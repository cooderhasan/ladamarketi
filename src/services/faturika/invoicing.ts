/**
 * Faturika için veritabanı tarafı. Şema değişmez: canlıda migration çalışmadığı için kayıtlar
 * site_settings ve order.shippingAddress JSON alanında tutulur.
 */

import { prisma } from "@/lib/db";
import type { FaturikaCarriers } from "@/services/faturika/carriers";
import { istanbulDate } from "@/services/faturika/mapper";

export const FATURIKA_SETTINGS_KEY = "faturika";

export interface FaturikaSettings {
    carriers?: FaturikaCarriers;
}

export async function getFaturikaSettings(): Promise<FaturikaSettings> {
    const row = await prisma.siteSettings.findUnique({ where: { key: FATURIKA_SETTINGS_KEY } });
    return (row?.value as FaturikaSettings | undefined) ?? {};
}

/**
 * Faturadaki gönderim tarihi için siparişin kargolandığı günü kaydeder. İlk kayıt korunur: Yurtiçi
 * sorgusu aynı siparişi tekrar "Kargolandı" yapsa da tarih değişmez. JSON tek anahtarla güncellenir,
 * böylece aynı anda yazan başka bir işlem alanın geri kalanını ezmez.
 * Hata sipariş durumu güncellemesini durdurmaz; tarih yoksa fatura ekranında sorulur.
 */
export async function recordOrdersShipped(orderIds: string[]): Promise<void> {
    if (orderIds.length === 0) return;
    try {
        await prisma.$executeRaw`
            UPDATE orders
            SET "shippingAddress" = jsonb_set(
                COALESCE(NULLIF("shippingAddress", 'null'::jsonb), '{}'::jsonb),
                '{shippedAt}',
                to_jsonb(${istanbulDate()}::text)
            )
            WHERE id = ANY(${orderIds})
              AND COALESCE("shippingAddress", '{}'::jsonb) ->> 'shippedAt' IS NULL`;
    } catch (error) {
        console.error("[Faturika] Kargo tarihi kaydedilemedi:", error);
    }
}
