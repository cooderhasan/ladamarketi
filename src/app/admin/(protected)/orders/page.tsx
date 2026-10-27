import { prisma } from "@/lib/db";
import { OrdersTable } from "@/components/admin/orders-table";
import { OrderStatus } from "@prisma/client";
import { formatPrice } from "@/lib/helpers";
import { NON_REVENUE_STATUSES, PAYMENT_METHOD_LABELS } from "@/lib/dashboard-stats";

interface OrdersPageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
        cargo?: string;
        startDate?: string;
        endDate?: string;
        printed?: string; // "YES" | "NO" | "ALL"
    }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const limit = 20; // Items per page
    const skip = (page - 1) * limit;

    const search = params.search || "";
    const status = params.status as OrderStatus | string | undefined;
    const cargo = params.cargo;
    const printed = params.printed; // "YES" | "NO" | undefined/"ALL"
    // Tarihler Türkiye saatine göre gün başı/sonu (sunucu UTC; önceden 00:00-03:00 arası siparişler önceki güne düşüyordu)
    const trDay = (s: string, end: boolean) =>
        /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T${end ? "23:59:59.999" : "00:00:00"}+03:00`) : new Date(s);
    const startDate = params.startDate ? trDay(params.startDate, false) : undefined;
    const endDate = params.endDate ? trDay(params.endDate, true) : undefined;

    // Construct Where Clause
    const where: any = {};

    if (search) {
        where.OR = [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { user: { companyName: { contains: search, mode: "insensitive" } } },
            { guestEmail: { contains: search, mode: "insensitive" } },
        ];
    }

    if (status === "TO_SHIP") {
        // Onaylandı + Hazırlanıyor birlikte (Genel Bakış'taki "Kargolanacak" kartı bu filtreyle açar)
        where.status = { in: ["CONFIRMED", "PROCESSING"] as OrderStatus[] };
    } else if (status && status !== "ALL") {
        const normalizedStatus = status.toUpperCase();
        if (Object.values(OrderStatus).includes(normalizedStatus as OrderStatus)) {
            where.status = normalizedStatus as OrderStatus;
        }
    } else if (!status || status === "") {
        // Varsayılan görünüm (filtre yok): "Ödeme Bekleniyor" olanları gizle (Başarısız/Yarım kalan PayTR işlemleri)
        where.NOT = {
            status: "WAITING_FOR_PAYMENT"
        };
    }
    // status === "ALL" ise hiçbir filtre ekleme - tüm durumları göster

    // Cargo Filtering
    if (cargo && cargo !== "ALL") {
        if (!where.AND) where.AND = [];
        
        if (cargo === "YURTICI") {
            where.AND.push({
                OR: [
                    { cargoCompany: { contains: "Yurt", mode: "insensitive" } },
                    { cargoCompany: { contains: "Yü", mode: "insensitive" } }
                ]
            });
        } else if (cargo === "ARAS") {
            where.AND.push({
                cargoCompany: { contains: "Aras", mode: "insensitive" }
            });
        } else if (cargo === "OTHER") {
            where.AND.push({
                AND: [
                    { NOT: { cargoCompany: { contains: "Yurt", mode: "insensitive" } } },
                    { NOT: { cargoCompany: { contains: "Aras", mode: "insensitive" } } },
                    { NOT: { cargoCompany: null } }
                ]
            });
        }
    }

    // Print Filter
    if (printed === "YES") {
        where.isPrinted = true;
    } else if (printed === "NO") {
        where.isPrinted = false;
    }

    // Date Filtering
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
            where.createdAt.gte = startDate;
        }
        if (endDate) {
            where.createdAt.lte = endDate;
        }
    }

    // Ciroya katılan siparişler (iptal ve ödemesi tamamlanmamış hariç), ödeme yöntemi dökümü için
    const revenueStatus = { status: { notIn: [...NON_REVENUE_STATUSES] as OrderStatus[] } };
    const paymentMethods = Object.keys(PAYMENT_METHOD_LABELS);

    // Parallel Fetch: Orders + Total Count + Filtre özeti
    const [orders, totalCount, statusGroups, ...methodSums] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                user: {
                    select: { id: true, companyName: true, email: true, phone: true },
                },
                items: {
                    include: {
                        product: {
                            select: { id: true, sku: true, slug: true, images: true },
                        },
                    },
                },
                payment: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.order.count({ where }),
        // Filtreye uyan TÜM siparişlerin (sadece bu sayfanın değil) durum bazında adet ve tutarı
        prisma.order.groupBy({
            by: ["status"],
            where,
            _sum: { total: true },
            _count: { _all: true },
        }),
        ...paymentMethods.map((method) =>
            prisma.order.aggregate({
                where: { AND: [where, revenueStatus, { payment: { method: method as any } }] },
                _sum: { total: true },
                _count: { _all: true },
            })
        ),
    ]);

    // İptal ve ödemesi tamamlanmamış siparişler toplama katılmaz, ayrıca gösterilir
    const summary = { count: 0, total: 0, cancelledCount: 0, cancelledTotal: 0, unpaidCount: 0, unpaidTotal: 0 };
    for (const g of statusGroups) {
        const n = g._count._all;
        const t = Number(g._sum.total || 0);
        if (g.status === "CANCELLED") { summary.cancelledCount += n; summary.cancelledTotal += t; continue; }
        if (g.status === "WAITING_FOR_PAYMENT") { summary.unpaidCount += n; summary.unpaidTotal += t; continue; }
        summary.count += n;
        summary.total += t;
    }
    const byMethod = paymentMethods
        .map((method, i) => ({ method, count: methodSums[i]._count._all, total: Number(methodSums[i]._sum.total || 0) }))
        .filter((m) => m.count > 0)
        .sort((a, b) => b.total - a.total);

    const totalPages = Math.ceil(totalCount / limit);

    const serializedOrders = orders.map((order: any) => ({
        ...order,
        guestEmail: order.guestEmail,
        isPrinted: order.isPrinted ?? false,
        printedAt: order.printedAt ? order.printedAt.toISOString() : null,
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        vatAmount: Number(order.vatAmount),
        total: Number(order.total),
        shippingCost: order.shippingCost ? Number(order.shippingCost) : 0,
        shippingDesi: order.shippingDesi ? Number(order.shippingDesi) : 0,
        appliedDiscountRate: Number(order.appliedDiscountRate),
        items: order.items.map((item: any) => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            discountRate: Number(item.discountRate),
            lineTotal: Number(item.lineTotal),
        })),
        payment: order.payment
            ? {
                ...order.payment,
                amount: Number(order.payment.amount),
            }
            : null,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Sipariş Yönetimi
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Siparişleri görüntüleyin, arayın ve yönetin.
                </p>
            </div>

            <OrdersTable
                orders={serializedOrders}
                pagination={{
                    currentPage: page,
                    totalPages,
                    totalCount,
                }}
            />

            {/* Filtre özeti: seçili tarih/durum/arama için toplam (tüm sayfalar) */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <span className="text-sm font-medium text-gray-500">
                        Filtreye uyan siparişler
                        {params.startDate || params.endDate ? ` (${params.startDate || "…"} – ${params.endDate || "…"})` : ""}
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {summary.count} sipariş · {formatPrice(summary.total)}
                    </span>
                </div>
                {byMethod.length > 1 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {byMethod.map((m) => (
                            <span key={m.method} className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                <span className="font-semibold">{PAYMENT_METHOD_LABELS[m.method]}</span>: {m.count} · {formatPrice(m.total)}
                            </span>
                        ))}
                    </div>
                )}
                {(summary.cancelledCount > 0 || summary.unpaidCount > 0) && (
                    <p className="mt-2 text-xs text-gray-500">
                        Toplama dahil değil:
                        {summary.cancelledCount > 0 ? ` ${summary.cancelledCount} iptal (${formatPrice(summary.cancelledTotal)})` : ""}
                        {summary.cancelledCount > 0 && summary.unpaidCount > 0 ? "," : ""}
                        {summary.unpaidCount > 0 ? ` ${summary.unpaidCount} ödeme bekleyen (${formatPrice(summary.unpaidTotal)})` : ""}
                    </p>
                )}
            </div>
        </div>
    );
}
