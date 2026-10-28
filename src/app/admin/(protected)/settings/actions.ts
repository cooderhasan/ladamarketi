"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function updateSiteSettings(key: string, value: Record<string, string>) {
    await requireAdmin();
    try {
        await prisma.siteSettings.upsert({
            where: { key },
            update: { value: value as unknown as Prisma.InputJsonValue },
            create: { key, value: value as unknown as Prisma.InputJsonValue },
        });
        revalidatePath("/admin/settings");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Settings update error:", error);
        throw error;
    }
}

export async function getSiteSettings(key: string) {
    // Herhangi bir ayar anahtarını (entegrasyon API anahtarları dahil) okuyabildiği için yetki ister
    await requireAdmin();
    const settings = await prisma.siteSettings.findUnique({
        where: { key },
    });
    return settings?.value as Record<string, unknown> | null;
}
