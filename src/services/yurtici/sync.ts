/**
 * Yurtiçi Kargo toplu durum güncellemesi.
 * "Kargoları Güncelle" butonu ve zamanlanmış görev (/api/cron/yurtici-sync) aynı işi buradan yapar.
 * Yetki kontrolü çağıranın sorumluluğundadır.
 */

import { prisma } from "@/lib/db";
import { recordOrdersShipped } from "@/services/faturika/invoicing";
import { queryYKShipment, type YKCredentials } from "@/services/yurtici/api";

const LOOKBACK_DAYS = 14;
// YK aynı kargo için 1 dakika içinde tekrarlı sorguda hata döner
const MIN_SECONDS_BETWEEN_QUERIES = 65;

export type YKSyncResult =
    | { success: true; count: number; delivered: number; errors: number; message: string }
    | { success: false; error: string };

/** Aktif YK konfigürasyonu; yoksa null. */
export async function getYKConfig(): Promise<YKCredentials | null> {
    const config = await prisma.yurticiKargoConfig.findFirst({
        where: { isActive: true },
    });
    if (!config) return null;
    return {
        username: config.username,
        password: config.password,
        customerCode: config.customerCode,
        unitCode: config.unitCode,
        demandNo: config.demandNo,
        isTestMode: config.isTestMode,
    };
}

/** Son 14 günün teslim veya iptal edilmemiş YK kargolarını sırayla sorgular. */
export async function syncActiveYKOrders(): Promise<YKSyncResult> {
    const creds = await getYKConfig();
    if (!creds) return { success: false, error: "YK entegrasyonu yapılandırılmamış." };

    const since = new Date();
    since.setDate(since.getDate() - LOOKBACK_DAYS);

    const activeOrders = await prisma.order.findMany({
        where: {
            ykCargoKey: { not: null },
            status: { notIn: ["DELIVERED", "CANCELLED"] },
            createdAt: { gte: since },
        },
        select: { id: true, ykCargoKey: true, orderNumber: true, ykSyncedAt: true },
    });

    if (activeOrders.length === 0) {
        return { success: true, count: 0, delivered: 0, errors: 0, message: "Senkronize edilecek aktif kargo bulunamadı." };
    }

    let updatedCount = 0;
    let deliveredCount = 0;
    let errorCount = 0;

    // YK limitleri ve sunucu yükü için bilerek sırayla: aynı anda tek istek
    for (const order of activeOrders) {
        try {
            if (!order.ykCargoKey) continue;

            if (order.ykSyncedAt) {
                const secondsSinceSync = (Date.now() - new Date(order.ykSyncedAt).getTime()) / 1000;
                if (secondsSinceSync < MIN_SECONDS_BETWEEN_QUERIES) continue;
            }

            const result = await queryYKShipment(order.ykCargoKey, creds);

            if (result.success) {
                let newOrderStatus: "SHIPPED" | "DELIVERED" | "CANCELLED" | undefined;
                if (result.operationStatus === "IND") {
                    newOrderStatus = "SHIPPED";
                } else if (result.operationStatus === "DLV") {
                    newOrderStatus = "DELIVERED";
                    deliveredCount++;
                } else if (result.operationStatus === "CNL" || result.operationStatus === "ISC" || result.operationStatus === "BI") {
                    newOrderStatus = "CANCELLED";
                }

                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        ykStatus: result.operationStatus ?? null,
                        ykStatusMessage: result.operationMessage ?? null,
                        ykDocId: result.docId ?? null,
                        ykSyncedAt: new Date(),
                        ...(result.trackingUrl ? { trackingUrl: result.trackingUrl } : {}),
                        ...(newOrderStatus ? { status: newOrderStatus } : {}),
                    },
                });
                if (newOrderStatus === "SHIPPED") await recordOrdersShipped([order.id]);
                updatedCount++;
            } else {
                errorCount++;
            }
        } catch (err) {
            console.error(`[YK Bulk Sync] Error on order ${order.orderNumber}:`, err);
            errorCount++;
        }
    }

    return {
        success: true,
        count: updatedCount,
        delivered: deliveredCount,
        errors: errorCount,
        message: `${updatedCount} sipariş güncellendi. (${deliveredCount} teslim edildi)`,
    };
}
