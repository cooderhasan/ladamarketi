"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCategoryDescription, saveCategoryDescription, deleteCategoryDescription } from "@/lib/category-description";

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

export async function createCategory(data: { name: string; slug: string; order?: number; parentId?: string | null; imageUrl?: string; isFeatured?: boolean; isInHeader?: boolean; headerOrder?: number; trendyolCategoryId?: number | null; n11CategoryId?: number | null; hbCategoryId?: string | null; googleProductCategory?: string | null; description?: string }) {
    await requireAdmin();
    const created = await prisma.category.create({
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
    if (data.description !== undefined) await saveCategoryDescription(created.id, data.description);
    revalidatePath("/admin/categories");
    revalidatePath("/");
}

export async function updateCategory(id: string, input: { name?: string; slug?: string; order?: number; isActive?: boolean; parentId?: string | null; imageUrl?: string; isFeatured?: boolean; isInHeader?: boolean; headerOrder?: number; trendyolCategoryId?: number | null; n11CategoryId?: number | null; hbCategoryId?: string | null; googleProductCategory?: string | null; description?: string }) {
    await requireAdmin();
    // Açıklama kategori tablosunda değil, site_settings'te (lib/category-description)
    const { description, ...data } = input;
    console.log("updateCategory called with:", { id, data });
    try {
        const result = await prisma.category.update({
            where: { id },
            data,
        });
        if (description !== undefined) await saveCategoryDescription(id, description);
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
    await deleteCategoryDescription(id);
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


/**
 * Tek seferlik: CATEGORY_MERGES'teki kaynak kategoriyi hedefe birleştirir.
 * Kaynağın ürünleri hedefe eklenir (ürün kategorisiz kalmaz), alt grupları hedefin altına taşınır,
 * kaynak silinmez: boşaltılıp pasif yapılır ve adresi hedefe yönlenir. Tekrar çalıştırılırsa yapılmışları atlar.
 */
export async function applyCategoryMerges() {
    await requireAdmin();
    const { CATEGORY_MERGES } = await import("@/data/category-slug-map");
    const results: { from: string; into: string; products: number; groups: number }[] = [];

    for (const [fromSlug, intoSlug] of Object.entries(CATEGORY_MERGES)) {
        const [from, into] = await Promise.all([
            prisma.category.findUnique({
                where: { slug: fromSlug },
                select: { id: true, isActive: true, products: { select: { id: true } }, children: { select: { id: true } } },
            }),
            prisma.category.findUnique({ where: { slug: intoSlug }, select: { id: true, products: { select: { id: true } } } }),
        ]);
        if (!from || !into || from.id === into.id) continue;
        if (!from.isActive && from.products.length === 0 && from.children.length === 0) continue; // zaten birleştirilmiş

        const already = new Set(into.products.map((p) => p.id));
        const toConnect = from.products.map((p) => p.id).filter((id) => !already.has(id));

        await prisma.$transaction([
            prisma.category.update({ where: { id: into.id }, data: { products: { connect: toConnect.map((id) => ({ id })) } } }),
            // Alt gruplar (Motor Aksamı vb.) doğrudan hedefin altına
            prisma.category.updateMany({ where: { parentId: from.id }, data: { parentId: into.id } }),
            // Ürün sayfasındaki yol satırı eski (tekil) kategori alanından okunuyor
            prisma.product.updateMany({ where: { categoryId: from.id }, data: { categoryId: into.id } }),
            // Kaynak: boş, pasif, üst kategorisiz (menülerde ve listelerde görünmesin)
            prisma.category.update({
                where: { id: from.id },
                data: { isActive: false, parentId: null, isInHeader: false, isFeatured: false, products: { set: [] } },
            }),
        ]);
        results.push({ from: fromSlug, into: intoSlug, products: toConnect.length, groups: from.children.length });
    }

    revalidatePath("/", "layout");
    return { success: true, results };
}

/**
 * Tek seferlik: CATEGORY_RETIRED'daki kategoriyi boşaltıp pasif yapar ("Home").
 * Başka kategorisi olan ürünler çıkarılır; ana (tekil) kategorisi bu olan ürünün ana kategorisi
 * diğer kategorilerinden birine çevrilir. Başka kategorisi olmayan ürüne dokunulmaz; öyle ürün varsa kategori aktif kalır.
 */
export async function applyCategoryRetirements() {
    await requireAdmin();
    const { CATEGORY_RETIRED } = await import("@/data/category-slug-map");
    const results: { slug: string; removed: number; mainFixed: number; orphans: string[]; deactivated: boolean }[] = [];

    for (const slug of Object.keys(CATEGORY_RETIRED)) {
        const cat = await prisma.category.findUnique({
            where: { slug },
            select: {
                id: true,
                isActive: true,
                products: {
                    select: {
                        id: true,
                        name: true,
                        categoryId: true,
                        categories: { select: { id: true, isActive: true, _count: { select: { products: true } } } },
                    },
                },
            },
        });
        if (!cat || (!cat.isActive && cat.products.length === 0)) continue;

        const others = (p: (typeof cat.products)[number]) =>
            p.categories
                .filter((c) => c.id !== cat.id)
                // Önce aktif, sonra en özel (en az ürünlü) kategori
                .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a._count.products - b._count.products);
        const movable = cat.products.filter((p) => others(p).length > 0);
        const orphans = cat.products.filter((p) => others(p).length === 0);
        const mainFixes = movable.filter((p) => p.categoryId === cat.id || !p.categoryId);
        const deactivate = orphans.length === 0;

        await prisma.$transaction([
            ...mainFixes.map((p) => prisma.product.update({ where: { id: p.id }, data: { categoryId: others(p)[0].id } })),
            prisma.category.update({
                where: { id: cat.id },
                data: {
                    products: { disconnect: movable.map((p) => ({ id: p.id })) },
                    ...(deactivate ? { isActive: false, isInHeader: false, isFeatured: false } : {}),
                },
            }),
        ]);
        results.push({ slug, removed: movable.length, mainFixed: mainFixes.length, orphans: orphans.map((p) => p.name), deactivated: deactivate });
    }

    revalidatePath("/", "layout");
    return { success: true, results };
}

/** Düzenleme penceresi açılınca kategorinin mevcut açıklaması */
export async function getCategoryDescriptionForAdmin(id: string) {
    await requireAdmin();
    return getCategoryDescription(id);
}

/**
 * AI ile kategori açıklaması taslağı. Uydurma bilgi olmasın diye kategorideki gerçek ürün adları
 * (en çok 25) modele verilir; ad + üst kategori (model) başlığı oluşturur.
 */
export async function generateCategoryDescription(input: { categoryId?: string | null; name: string; parentId?: string | null }) {
    await requireAdmin();
    const { generateAiHtml } = await import("@/lib/ai-generate");
    const { categoryDisplayName } = await import("@/lib/category-title");

    const parent = input.parentId
        ? await prisma.category.findUnique({ where: { id: input.parentId }, select: { name: true } })
        : null;
    const title = categoryDisplayName(input.name, parent?.name);

    let productNames: string[] = [];
    let subcategories: string[] = [];
    if (input.categoryId) {
        const children = await prisma.category.findMany({
            where: { parentId: input.categoryId, isActive: true },
            select: { id: true, name: true },
        });
        subcategories = children.map((c) => c.name);
        const products = await prisma.product.findMany({
            where: { isActive: true, categories: { some: { id: { in: [input.categoryId, ...children.map((c) => c.id)] } } } },
            select: { name: true },
            orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
            take: 25,
        });
        productNames = products.map((p) => p.name);
    }

    const systemPrompt = `Sen Lada Marketi için Lada yedek parça kategori sayfalarına SEO uyumlu tanıtım metni yazan kurumsal bir içerik uzmanısın.

    KURALLAR:
    1. UZUNLUK: 120-200 kelime. 2-3 kısa paragraf (<p>). İstersen tek bir ara başlık (<h2>) kullanabilirsin.
    2. İÇERİK: Kategoride hangi tür parçaların bulunduğunu ve hangi araç/model için olduğunu anlat. Sadece sana verilen kategori adı, alt gruplar ve ürün adlarından çıkarılabilecek bilgileri kullan; uydurma teknik değer, ölçü, parça numarası yazma.
    3. YASAKLAR: "garanti" / "garantili" ifadeleri, fiyat, indirim, kampanya, "ücretsiz kargo" veya kargo süresi vaadi, telefon, web adresi, link (<a>), kaynak numarası ([1]) kullanma.
    4. ÜSLUP: Kurumsal, sade, ikna edici Türkçe. "Usta", "tecrübem" gibi kişisel ifadeler yok. Anahtar kelimeyi (kategori başlığı) doğal şekilde 1-2 kez geçir, kelime doldurma yapma.
    5. HTML: Sadece <p>, <h2>, <b>, <ul>, <li> etiketleri. Markdown yok. Metnin başına kategori adını başlık olarak yazma (sayfada zaten var).`;

    const userPrompt = `Kategori başlığı: ${title}
${subcategories.length ? `Alt gruplar: ${subcategories.join(", ")}` : ""}
${productNames.length ? `Kategorideki örnek ürünler:\n- ${productNames.join("\n- ")}` : "Kategoride henüz ürün yok; sadece başlıktan yola çıkarak genel bir tanıtım yaz."}`;

    try {
        const html = await generateAiHtml(systemPrompt, userPrompt);
        return { success: true as const, html };
    } catch (e: any) {
        return { success: false as const, error: e?.message || "Açıklama oluşturulamadı." };
    }
}
