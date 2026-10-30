"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function getCategories() {
    await requireAdmin();
    return prisma.category.findMany({
        orderBy: { order: "asc" },
        include: {
            _count: {
                select: { products: true },
            },
        },
    });
}

export async function createCategory(data: { name: string; slug: string; order?: number; parentId?: string | null; imageUrl?: string; isFeatured?: boolean; isInHeader?: boolean; headerOrder?: number; trendyolCategoryId?: number | null; n11CategoryId?: number | null; hbCategoryId?: string | null; googleProductCategory?: string | null }) {
    await requireAdmin();
    await prisma.category.create({
        data: {
            name: data.name,
            slug: data.slug,
            order: data.order ?? 0,
            parentId: data.parentId || null,
            imageUrl: data.imageUrl,
            isFeatured: data.isFeatured ?? false,
            isInHeader: data.isInHeader ?? false,
            headerOrder: data.headerOrder ?? 0,
            trendyolCategoryId: data.trendyolCategoryId ?? null,
            n11CategoryId: data.n11CategoryId ?? null,
            hbCategoryId: data.hbCategoryId ?? null,
            googleProductCategory: data.googleProductCategory ?? null,
        },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/");
}

export async function updateCategory(id: string, data: { name?: string; slug?: string; order?: number; isActive?: boolean; parentId?: string | null; imageUrl?: string; isFeatured?: boolean; isInHeader?: boolean; headerOrder?: number; trendyolCategoryId?: number | null; n11CategoryId?: number | null; hbCategoryId?: string | null; googleProductCategory?: string | null }) {
    await requireAdmin();
    console.log("updateCategory called with:", { id, data });
    try {
        const result = await prisma.category.update({
            where: { id },
            data,
        });
        console.log("updateCategory result:", result);
    } catch (error) {
        console.error("updateCategory error:", error);
        throw error;
    }
    revalidatePath("/admin/categories");
    revalidatePath("/");
}

export async function deleteCategory(id: string) {
    await requireAdmin();
    await prisma.category.delete({
        where: { id },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/");
}

export async function toggleCategoryStatus(id: string, isActive: boolean) {
    await requireAdmin();
    await prisma.category.update({
        where: { id },
        data: { isActive },
    });
    revalidatePath("/admin/categories");
}

export async function updateCategoriesSidebarOrder(updates: { id: string; order: number }[]) {
    await requireAdmin();
    await prisma.$transaction(
        updates.map((update) =>
            prisma.category.update({
                where: { id: update.id },
                data: { order: update.order },
            })
        )
    );
    revalidatePath("/admin/categories");
    revalidatePath("/");
}

export async function updateCategoriesHeaderOrder(updates: { id: string; headerOrder: number }[]) {
    await requireAdmin();
    await prisma.$transaction(
        updates.map((update) =>
            prisma.category.update({
                where: { id: update.id },
                data: { headerOrder: update.headerOrder },
            })
        )
    );
    revalidatePath("/admin/categories");
    revalidatePath("/");
}

/**
 * Tek seferlik: kategori adreslerini onaylı listeye göre günceller (eski bozuk harfli / sayılı adres → yeni).
 * Eski adresler src/data/category-slug-map.ts ile yeni adrese yönlendirilmeye devam eder.
 * Tekrar çalıştırılırsa zaten güncel olanları atlar; yeni adresi başka kategori kullanıyorsa onu da atlar.
 * Slider ve banner linklerindeki eski kategori adresleri de düzeltilir.
 */
export async function applyCategorySlugMap() {
    await requireAdmin();
    const { CATEGORY_SLUG_MAP } = await import("@/data/category-slug-map");
    const oldSlugs = Object.keys(CATEGORY_SLUG_MAP);

    const [pending, taken] = await Promise.all([
        prisma.category.findMany({ where: { slug: { in: oldSlugs } }, select: { id: true, slug: true } }),
        prisma.category.findMany({ where: { slug: { in: Object.values(CATEGORY_SLUG_MAP) } }, select: { slug: true } }),
    ]);
    const takenSet = new Set(taken.map((t) => t.slug));
    const toUpdate = pending.filter((c) => !takenSet.has(CATEGORY_SLUG_MAP[c.slug]));
    const skipped = pending.filter((c) => takenSet.has(CATEGORY_SLUG_MAP[c.slug])).map((c) => c.slug);

    // /category/eski-adres → /category/yeni-adres (adresin sonu, ?, / veya # ile biten tam eşleşme)
    const fixLink = (url: string | null) =>
        url
            ? url.replace(/\/category\/([a-z0-9-]+)(?=$|[?#/])/g, (m, s) =>
                  CATEGORY_SLUG_MAP[s] ? `/category/${CATEGORY_SLUG_MAP[s]}` : m)
            : url;
    const [sliders, banners] = await Promise.all([
        prisma.slider.findMany({ where: { linkUrl: { contains: "/category/" } }, select: { id: true, linkUrl: true } }),
        prisma.banner.findMany({ where: { linkUrl: { contains: "/category/" } }, select: { id: true, linkUrl: true } }),
    ]);
    const sliderFixes = sliders.filter((s) => fixLink(s.linkUrl) !== s.linkUrl);
    const bannerFixes = banners.filter((b) => fixLink(b.linkUrl) !== b.linkUrl);

    await prisma.$transaction([
        ...toUpdate.map((c) => prisma.category.update({ where: { id: c.id }, data: { slug: CATEGORY_SLUG_MAP[c.slug] } })),
        ...sliderFixes.map((s) => prisma.slider.update({ where: { id: s.id }, data: { linkUrl: fixLink(s.linkUrl) } })),
        ...bannerFixes.map((b) => prisma.banner.update({ where: { id: b.id }, data: { linkUrl: fixLink(b.linkUrl) } })),
    ]);

    revalidatePath("/", "layout");
    return {
        success: true,
        updated: toUpdate.length,
        skipped,
        links: sliderFixes.length + bannerFixes.length,
    };
}

