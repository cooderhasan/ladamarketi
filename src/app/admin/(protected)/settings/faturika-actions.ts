"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
    FaturikaError,
    getAccount,
    getFaturikaMode,
    isFaturikaConfigured,
    type FaturikaReadiness,
} from "@/services/faturika/api";
import { normalizeCarriers, type FaturikaCarriers } from "@/services/faturika/carriers";
import { FATURIKA_SETTINGS_KEY, getFaturikaSettings } from "@/services/faturika/invoicing";

export async function getFaturikaReadiness(): Promise<FaturikaReadiness> {
    await requireAdmin();
    const mode = getFaturikaMode();
    if (!isFaturikaConfigured()) return { configured: false, mode };

    try {
        return { configured: true, mode, account: await getAccount() };
    } catch (error) {
        console.error("[Faturika] Hesap bilgisi alınamadı:", error);
        return {
            configured: true,
            mode,
            error: error instanceof FaturikaError ? error.message : "Faturika hesap bilgisi alınamadı.",
        };
    }
}

export async function saveFaturikaCarriers(input: FaturikaCarriers): Promise<{ success: boolean; error?: string }> {
    await requireAdmin();

    const result = normalizeCarriers(input);
    if ("error" in result) return { success: false, error: result.error };

    const value = {
        ...(await getFaturikaSettings()),
        carriers: result.carriers,
    } as unknown as Prisma.InputJsonValue;

    await prisma.siteSettings.upsert({
        where: { key: FATURIKA_SETTINGS_KEY },
        update: { value },
        create: { key: FATURIKA_SETTINGS_KEY, value },
    });

    revalidatePath("/admin/settings");
    return { success: true };
}
