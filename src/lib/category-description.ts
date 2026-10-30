import { prisma } from "@/lib/db";

/**
 * Kategori açıklaması (kategori sayfasında ürünlerin altındaki tanıtım metni).
 * Veritabanı yapısı değişmesin diye site_settings tablosunda kategori başına ayrı kayıt olarak tutulur:
 * anahtar "category-description:<kategori id>", değer { html }. Canlıda otomatik migration olmadığı için
 * categories tablosuna sütun eklemek siteyi bozabilirdi. Kategori id'si sabit; adres (slug) değişse de açıklama kalır.
 */
const key = (categoryId: string) => `category-description:${categoryId}`;

export async function getCategoryDescription(categoryId: string): Promise<string> {
    try {
        const row = await prisma.siteSettings.findUnique({ where: { key: key(categoryId) } });
        const html = (row?.value as { html?: unknown } | null)?.html;
        return typeof html === "string" ? html : "";
    } catch {
        return "";
    }
}

/** Boş (yalnızca etiket/boşluk) açıklama kaydı siler */
export async function saveCategoryDescription(categoryId: string, html: string): Promise<void> {
    const clean = (html || "").trim();
    const text = clean.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim();
    if (!text) {
        await prisma.siteSettings.deleteMany({ where: { key: key(categoryId) } });
        return;
    }
    await prisma.siteSettings.upsert({
        where: { key: key(categoryId) },
        update: { value: { html: clean } },
        create: { key: key(categoryId), value: { html: clean } },
    });
}

export async function deleteCategoryDescription(categoryId: string): Promise<void> {
    await prisma.siteSettings.deleteMany({ where: { key: key(categoryId) } });
}
