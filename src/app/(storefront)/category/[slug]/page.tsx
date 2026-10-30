import { prisma } from "@/lib/db";
import { findProductsInStockFirst } from "@/lib/product-listing";
import { findProductIdsBySearch } from "@/lib/product-search";
import { auth } from "@/lib/auth";
import { ProductCardModern } from "@/components/storefront/product-card-modern";
import { ProductFilters } from "@/components/storefront/product-filters";
import { MobileProductFilters } from "@/components/storefront/mobile-product-filters";
import { Prisma } from "@prisma/client";
import { ProductSort } from "@/components/storefront/product-sort";
import { ProductStockToggle } from "@/components/storefront/product-stock-toggle";
import { Pagination } from "@/components/storefront/pagination";
import { notFound, permanentRedirect } from "next/navigation";
import { newCategorySlug, CATEGORY_RETIRED } from "@/data/category-slug-map";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-url";
import { categoryDisplayName } from "@/lib/category-title";
import { getCategoryDescription } from "@/lib/category-description";

interface CategoryPageProps {
    params: Promise<{
        slug: string;
    }>;
    searchParams: Promise<{
        search?: string;
        sort?: string;
        min_price?: string;
        max_price?: string;
        brands?: string | string[];
        colors?: string | string[];
        sizes?: string | string[];
        page?: string;
        in_stock?: string;
    }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { slug } = await params;
    const category = await prisma.category.findUnique({
        where: { slug },
        select: { id: true, name: true, parent: { select: { name: true } } }
    });

    if (!category) return { title: "Kategori Bulunamadı" };

    // Aynı isimli alt kategoriler (5 ayrı "Hortum Grubu") Google'da ayırt edilsin: model adı başlıkta
    const title = categoryDisplayName(category.name, category.parent?.name);
    // Kategori açıklaması varsa meta açıklama ondan (ilk ~155 karakter, kelime ortasında kesilmeden)
    const descText = (await getCategoryDescription(category.id)).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const metaDescription = descText
        ? descText.length > 155 ? `${descText.slice(0, 155).replace(/\s+\S*$/, "")}…` : descText
        : `${title} kategorisindeki en kaliteli yedek parça ve aksesuarları inceleyin.`;

    return {
        title,
        description: metaDescription,
        alternates: {
            canonical: `/category/${slug}`
        }
    };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { slug } = await params;
    const searchParamsValues = await searchParams;
    const session = await auth();
    const discountRate = session?.user?.discountRate || 0;
    const isDealer = session?.user?.role === "DEALER" && session?.user?.status === "APPROVED";

    // --- Fetch Category ---
    const category = await prisma.category.findUnique({
        where: { slug },
        include: {
            children: { select: { id: true, name: true, slug: true, imageUrl: true } },
            parent: { select: { name: true, slug: true } },
        }
    });

    // Eski (bozuk harfli / sayılı) ya da birleştirilip pasif yapılmış kategori adresi: yeni adrese kalıcı yönlendir, filtreler korunur
    const target = !category || !category.isActive ? newCategorySlug(slug) : null;
    if (target) {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(searchParamsValues)) {
            if (Array.isArray(v)) v.forEach((x) => qs.append(k, x));
            else if (v != null) qs.set(k, v);
        }
        permanentRedirect(`/category/${target}${qs.size ? `?${qs}` : ""}`);
    }
    // Kaldırılıp pasif yapılmış kategori ("Home"): ilgili sayfaya kalıcı yönlendir
    if (category && !category.isActive && CATEGORY_RETIRED[slug]) {
        permanentRedirect(CATEGORY_RETIRED[slug]);
    }
    if (!category) {
        notFound();
    }

    // --- Build Filtering Queries ---
    const where: Prisma.ProductWhereInput = { isActive: true };

    // Filter by Category (Current + Children)
    const categoryIds = [category.id, ...category.children.map(c => c.id)];
    (where as any).categories = { some: { id: { in: categoryIds } } };


    // Kategori içi arama: ürünler sayfasıyla aynı ortak arama
    if (searchParamsValues.search) {
        const ids = await findProductIdsBySearch(searchParamsValues.search, { categoryIds });
        if (ids) where.id = { in: ids };
    }

    // Price Range
    if (searchParamsValues.min_price || searchParamsValues.max_price) {
        where.listPrice = {
            gte: searchParamsValues.min_price ? Number(searchParamsValues.min_price) : undefined,
            lte: searchParamsValues.max_price ? Number(searchParamsValues.max_price) : undefined,
        };
    }

    // Sadece stoktakiler (?in_stock=true)
    if (searchParamsValues.in_stock === "true") {
        where.stock = { gt: 0 };
    }

    // Brands
    const brandSlugs = typeof searchParamsValues.brands === 'string' ? [searchParamsValues.brands] : searchParamsValues.brands;
    if (brandSlugs && brandSlugs.length > 0) {
        where.brand = { slug: { in: brandSlugs } };
    }

    // Variants (Color & Size)
    const colorFilters = typeof searchParamsValues.colors === 'string' ? [searchParamsValues.colors] : searchParamsValues.colors;
    const sizeFilters = typeof searchParamsValues.sizes === 'string' ? [searchParamsValues.sizes] : searchParamsValues.sizes;

    if ((colorFilters && colorFilters.length > 0) || (sizeFilters && sizeFilters.length > 0)) {
        const variantConditions: Prisma.ProductVariantWhereInput = {};
        if (colorFilters && colorFilters.length > 0) {
            variantConditions.color = { in: colorFilters };
        }
        if (sizeFilters && sizeFilters.length > 0) {
            variantConditions.size = { in: sizeFilters };
        }
        where.variants = { some: variantConditions };
    }

    // --- Build Sorting ---
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (searchParamsValues.sort === "price_asc") {
        orderBy = { listPrice: "asc" };
    } else if (searchParamsValues.sort === "price_desc") {
        orderBy = { listPrice: "desc" };
    } else if (searchParamsValues.sort === "newest") {
        orderBy = { createdAt: "desc" };
    }

    // --- Execute Queries ---
    const PAGE_SIZE = 20;
    const currentPage = searchParamsValues.page ? Number(searchParamsValues.page) : 1;
    const skip = (currentPage - 1) * PAGE_SIZE;

    // Sidebar Categories (Siblings or Children)
    let sidebarCategories: any[] = [];
    if (category.children.length > 0) {
        sidebarCategories = category.children;
    } else if (category.parentId) {
        sidebarCategories = await prisma.category.findMany({
            where: { parentId: category.parentId, isActive: true },
            orderBy: { order: "asc" }
        });
    } else {
        // Fallback to top level if root logic needed, but for now children or siblings is good.
        // If root category with no children, show nothing or maybe all roots?
        // Let's stick to simple logic: match what products page did.
        const ROOT_CATEGORY_ID = null;
        sidebarCategories = await prisma.category.findMany({
            where: { parentId: ROOT_CATEGORY_ID, isActive: true },
            orderBy: { order: "asc" },
        });
    }


    // Kategori listesinin üstü: alt kategorisi olan sayfada "Tüm <Kategori>", alt kategoride "← <Üst kategori>"
    const categoryNav = category.children.length > 0
        ? { label: `Tüm ${category.name}`, href: `/category/${category.slug}`, active: true }
        : category.parent
            ? { label: category.parent.name, href: `/category/${category.parent.slug}`, active: false, back: true }
            // Alt kategorisi olmayan ana kategori: liste zaten ana kategoriler, üst satır gerekmez
            : null;

    // Filtrelerdeki marka / renk / beden sadece bu kategorinin ürünlerinden (önceden tüm sitenin markaları listeleniyordu)
    const categoryScope: Prisma.ProductWhereInput = {
        isActive: true,
        categories: { some: { id: { in: categoryIds } } },
    } as any;

    const [{ products, totalCount }, brandRows, variants] = await Promise.all([
        // Stoktakiler önce, tükenenler sonda (lib/product-listing)
        findProductsInStockFirst({
            where,
            include: {
                category: true,
                brand: true,
                _count: { select: { variants: true } }
            },
            orderBy,
            skip,
            take: PAGE_SIZE,
        }),
        prisma.brand.findMany({
            where: { isActive: true, products: { some: categoryScope } },
            orderBy: { name: "asc" },
            // Markanın bu kategorideki ürün sayısı (filtrede çoktan aza sıralanır, sayı yanında görünür)
            select: { id: true, name: true, slug: true, _count: { select: { products: { where: categoryScope } } } }
        }),
        prisma.productVariant.findMany({
            where: { isActive: true, product: categoryScope },
            select: { color: true, size: true },
            distinct: ['color', 'size']
        })
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const brands = brandRows
        .map((b) => ({ id: b.id, name: b.name, slug: b.slug, count: b._count.products }))
        .filter((b) => b.count > 0);
    const uniqueColors = Array.from(new Set(variants.map(v => v.color).filter(Boolean))) as string[];
    const uniqueSizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean))) as string[];

    const displayName = categoryDisplayName(category.name, category.parent?.name);
    // Tanıtım metni sadece ilk sayfada ve arama yokken (sayfa 2, 3... aynı metni tekrar etmesin)
    const showDescription = currentPage === 1 && !searchParamsValues.search;
    const categoryDescription = showDescription ? await getCategoryDescription(category.id) : "";
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL },
            ...(category.parent
                ? [{ "@type": "ListItem", position: 2, name: category.parent.name, item: `${SITE_URL}/category/${category.parent.slug}` }]
                : []),
            { "@type": "ListItem", position: category.parent ? 3 : 2, name: displayName, item: `${SITE_URL}/category/${category.slug}` },
        ],
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <JsonLd id="breadcrumb-jsonld" data={breadcrumbSchema} />
            {/* Yol satırı: müşteri hangi modelin kategorisinde olduğunu görsün */}
            <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 overflow-x-auto whitespace-nowrap no-scrollbar">
                <Link href="/" className="hover:text-[#009AD0] transition-colors">Ana Sayfa</Link>
                {category.parent && (
                    <>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        <Link href={`/category/${category.parent.slug}`} className="hover:text-[#009AD0] transition-colors">
                            {category.parent.name}
                        </Link>
                    </>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                <span className="text-gray-800 dark:text-gray-200 font-medium">{category.name}</span>
            </nav>
            {/* Telefonda "Filtrele" başlığın yanında; altta "Sadece Stoktakiler" + sıralama tek satır (üçü yan yana sığmıyordu) */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div className="flex items-start justify-between gap-3 w-full md:w-auto">
                    <div className="min-w-0">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {displayName}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Toplam <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span> ürün listeleniyor
                        </p>
                    </div>
                    <div className="lg:hidden shrink-0">
                        <MobileProductFilters
                            categories={sidebarCategories}
                            brands={brands}
                            colors={uniqueColors}
                            sizes={uniqueSizes}
                            activeCategorySlug={slug}
                            categoryNav={categoryNav}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full md:w-auto">
                    <ProductStockToggle />
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden xl:inline-block">Sıralama:</span>
                        <ProductSort initialSort={searchParamsValues.sort || "newest"} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Masaüstü filtre paneli sayfayla birlikte akar (ekrana sabit değil): ekrana sabitken yüksekliği ekran boyuyla sınırlıydı,
                    uzun panelde içinde ayrıca kaydırmak gerekiyordu */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#009AD0]"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                            Filtreler
                        </h2>
                        <ProductFilters
                            categories={sidebarCategories}
                            brands={brands}
                            colors={uniqueColors}
                            sizes={uniqueSizes}
                            activeCategorySlug={slug}
                            categoryNav={categoryNav}
                        />
                    </div>
                </aside>

                {/* Products Grid */}
                <div className="flex-1 w-full">
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 text-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Bu kategoride ürün bulunamadı</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mb-6">
                                Kategoride ürün kalmamış olabilir veya filtreleriniz çok kısıtlayıcı olabilir.
                            </p>
                            <a
                                href="/products"
                                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#009AD0] text-white font-medium hover:bg-[#007da8] transition-colors shadow-lg shadow-blue-500/20"
                            >
                                Tüm Ürünleri Gör
                            </a>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                                {products.map((product, index) => (
                                    <ProductCardModern
                                        key={product.id}
                                        product={{
                                            ...product,
                                            listPrice: Number(product.listPrice),
                                            salePrice: product.salePrice ? Number(product.salePrice) : null,
                                            weight: product.weight ? Number(product.weight) : null,
                                            width: product.width ? Number(product.width) : null,
                                            height: product.height ? Number(product.height) : null,
                                            length: product.length ? Number(product.length) : null,
                                            desi: product.desi ? Number(product.desi) : null,
                                            googlePrice: (product as any).googlePrice ? Number((product as any).googlePrice) : null,
                                        }}
                                        discountRate={discountRate}
                                        isDealer={isDealer}
                                        priority={index < 4}
                                    />
                                ))}
                            </div>

                            <div className="mt-12">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    baseUrl={`/category/${slug}`}
                                    searchParams={searchParamsValues}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {categoryDescription && (
                <section className="mt-14 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 md:p-8">
                    <div
                        className="text-[15px] leading-relaxed text-gray-600 dark:text-gray-300 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_h2]:text-lg md:[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 dark:[&_h2]:text-white [&_h2]:mt-5 [&_h2]:mb-2 [&_h2:first-child]:mt-0 [&_h3]:font-bold [&_h3]:text-gray-900 dark:[&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_li]:mb-1 [&_b]:font-semibold [&_b]:text-gray-800 dark:[&_b]:text-gray-100 [&_strong]:font-semibold [&_strong]:text-gray-800 dark:[&_strong]:text-gray-100"
                        dangerouslySetInnerHTML={{ __html: categoryDescription }}
                    />
                </section>
            )}
        </div>
    );
}
