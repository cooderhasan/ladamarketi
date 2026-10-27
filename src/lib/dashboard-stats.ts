import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";

/**
 * Genel Bakış (admin ana sayfa) ve Satış Özeti rakamları.
 * Ciro = müşterinin ödediği tutar (Order.total), KDV dahil.
 * İptal ve ödemesi tamamlanmamış (PayTR'de yarım kalan kart ödemesi) siparişler hariç; havale bekleyenler dahil.
 * Gün/hafta/ay sınırları Türkiye saatine göre (sunucu UTC; Türkiye 2016'dan beri sabit UTC+3).
 * 60 sn önbellek: sayfa her açılışta yeniden hesaplamaz.
 */

/** Ciroya katılmayan sipariş durumları: iptal ve ödemesi tamamlanmamış */
export const NON_REVENUE_STATUSES = ["CANCELLED", "WAITING_FOR_PAYMENT"] as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CREDIT_CARD: "Kredi Kartı",
    BANK_TRANSFER: "Havale / EFT",
    CURRENT_ACCOUNT: "Cari Hesap",
    CASH_ON_DELIVERY: "Kapıda Ödeme",
};

const TR_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Türkiye saatine göre o günün 00:00'ı (UTC Date olarak) */
export function trStartOfDay(d: Date): Date {
    const tr = new Date(d.getTime() + TR_OFFSET_MS);
    return new Date(Date.UTC(tr.getUTCFullYear(), tr.getUTCMonth(), tr.getUTCDate()) - TR_OFFSET_MS);
}
export function trStartOfWeek(d: Date): Date {
    const start = trStartOfDay(d);
    const tr = new Date(start.getTime() + TR_OFFSET_MS);
    const dow = (tr.getUTCDay() + 6) % 7; // Pazartesi = 0
    return new Date(start.getTime() - dow * DAY_MS);
}
export function trStartOfMonth(d: Date, monthOffset = 0): Date {
    const tr = new Date(d.getTime() + TR_OFFSET_MS);
    return new Date(Date.UTC(tr.getUTCFullYear(), tr.getUTCMonth() + monthOffset, 1) - TR_OFFSET_MS);
}

export const revenueWhere = { status: { notIn: [...NON_REVENUE_STATUSES] as OrderStatus[] } };

export async function sumRange(from: Date, to: Date) {
    const agg = await prisma.order.aggregate({
        where: { ...revenueWhere, createdAt: { gte: from, lt: to } },
        _sum: { total: true },
        _count: { _all: true },
    });
    return { revenue: Number(agg._sum.total || 0), orders: agg._count._all };
}

/** Türkiye gününe göre günlük ciro; siparişsiz günler 0 olarak gelir (eskiden yeniye) */
export async function dailyRevenue(from: Date, days: number) {
    const to = new Date(from.getTime() + days * DAY_MS);
    const rows = await prisma.$queryRaw<{ d: string; revenue: number; orders: bigint }[]>`
        SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM-DD') AS d,
               COALESCE(SUM(total), 0)::float AS revenue,
               COUNT(*) AS orders
        FROM orders
        WHERE "createdAt" >= ${from} AND "createdAt" < ${to} AND status NOT IN ('CANCELLED', 'WAITING_FOR_PAYMENT')
        GROUP BY d
    `;
    const byDay = new Map(rows.map((r) => [r.d, { revenue: Number(r.revenue), orders: Number(r.orders) }]));
    return Array.from({ length: days }, (_, i) => {
        const key = new Date(from.getTime() + i * DAY_MS + TR_OFFSET_MS).toISOString().slice(0, 10);
        return { date: key, ...(byDay.get(key) || { revenue: 0, orders: 0 }) };
    });
}

export interface PeriodStat {
    revenue: number;
    orders: number;
    prevRevenue: number;
    prevOrders: number;
}

export interface DashboardData {
    today: PeriodStat;
    week: PeriodStat;
    month: PeriodStat;
    daily: { date: string; revenue: number; orders: number }[]; // son 30 gün, eskiden yeniye
    byPayment: { method: string; revenue: number; orders: number }[]; // bu ay
    toShipTotal: number; // Onaylandı + Hazırlanıyor
    toShipLate: number; // bunlardan 2 günden eski olanlar
    generatedAt: string;
}

async function loadDashboardData(): Promise<DashboardData> {
    const now = new Date();
    const today = trStartOfDay(now);
    const week = trStartOfWeek(now);
    const month = trStartOfMonth(now);
    const prevMonth = trStartOfMonth(now, -1);
    const elapsedMonth = now.getTime() - month.getTime();
    // Geçen ayın aynı günü/saatine kadar (geçen ay kısaysa ay sonunda kesilir)
    const prevMonthTo = new Date(Math.min(prevMonth.getTime() + elapsedMonth, month.getTime()));
    const from30 = new Date(today.getTime() - 29 * DAY_MS);
    const lateBefore = new Date(now.getTime() - 2 * DAY_MS); // 2 günden eski = gecikiyor
    const toShipWhere = { status: { in: ["CONFIRMED", "PROCESSING"] as OrderStatus[] } };

    const [t, tPrev, w, wPrev, m, mPrev, daily, paymentRows, toShipTotal, toShipLate] = await Promise.all([
        sumRange(today, now),
        sumRange(new Date(today.getTime() - DAY_MS), new Date(now.getTime() - DAY_MS)), // dün bu saate kadar
        sumRange(week, now),
        sumRange(new Date(week.getTime() - 7 * DAY_MS), new Date(now.getTime() - 7 * DAY_MS)),
        sumRange(month, now),
        sumRange(prevMonth, prevMonthTo),
        dailyRevenue(from30, 30),
        prisma.$queryRaw<{ method: string | null; revenue: number; orders: bigint }[]>`
            SELECT p.method::text AS method,
                   COALESCE(SUM(o.total), 0)::float AS revenue,
                   COUNT(*) AS orders
            FROM orders o
            LEFT JOIN payments p ON p."orderId" = o.id
            WHERE o."createdAt" >= ${month} AND o.status NOT IN ('CANCELLED', 'WAITING_FOR_PAYMENT')
            GROUP BY p.method
        `,
        prisma.order.count({ where: toShipWhere }),
        prisma.order.count({ where: { ...toShipWhere, createdAt: { lt: lateBefore } } }),
    ]);

    return {
        today: { revenue: t.revenue, orders: t.orders, prevRevenue: tPrev.revenue, prevOrders: tPrev.orders },
        week: { revenue: w.revenue, orders: w.orders, prevRevenue: wPrev.revenue, prevOrders: wPrev.orders },
        month: { revenue: m.revenue, orders: m.orders, prevRevenue: mPrev.revenue, prevOrders: mPrev.orders },
        daily,
        byPayment: paymentRows
            .map((r) => ({ method: r.method || "UNKNOWN", revenue: Number(r.revenue), orders: Number(r.orders) }))
            .sort((a, b) => b.revenue - a.revenue),
        toShipTotal,
        toShipLate,
        generatedAt: now.toISOString(),
    };
}

export const getDashboardData = unstable_cache(loadDashboardData, ["admin-dashboard-v1"], { revalidate: 60, tags: ["admin-dashboard"] });
