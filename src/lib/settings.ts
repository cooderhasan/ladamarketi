import { prisma } from "@/lib/db";

export async function getSiteSettings() {
    const settings = await prisma.siteSettings.findUnique({
        where: { key: "general" },
    });
    return (settings?.value as Record<string, string>) || {};
}
