import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ProductCardV2 } from "@/components/storefront/product-card-v2";
import { ProductFilters } from "@/components/storefront/product-filters";
import { Prisma } from "@prisma/client";
import { ProductSort } from "@/components/storefront/product-sort";
import { Pagination } from "@/components/storefront/pagination";
import { notFound } from "next/navigation";
import { Metadata } from "next";

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
    }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { slug } = await params;
    const category = await prisma.category.findUnique({
        where: { slug },
        select: { name: true }
    });

    if (!category) return { title: "Kategori Bulunamadı" };

    return {
        title: `${category.name} | Lada Marketi`,
        description: `${category.name} kategorisindeki en kaliteli yedek parça ve aksesuarları inceleyin.`,
        alternates: {
            canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://ladamarketi.com"}/category/${slug}`
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
        include: { children: { select: { id: true, name: true, slug: true, imageUrl: true } } }
    });

    if (!category) {
        notFound();
    }

    // --- Build Filtering Queries ---
    const where: Prisma.ProductWhereInput = { isActive: true };

    // Filter by Category (Current + Children)
    const categoryIds = [category.id, ...category.children.map(c => c.id)];
    (where as any).categories = { some: { id: { in: categoryIds } } };


    // Search
    if (searchParamsValues.search) {
        where.OR = [
            { name: { contains: searchParamsValues.search, mode: "insensitive" } },
            { sku: { contains: searchParamsValues.search, mode: "insensitive" } },
            { barcode: { contains: searchParamsValues.search, mode: "insensitive" } },
            {
                variants: {
                    some: {
                        OR: [
                            { sku: { contains: searchParamsValues.search, mode: "insensitive" } },
                            { barcode: { contains: searchParamsValues.search, mode: "insensitive" } },
                        ],
                    },
                },
            },
        ];
    }

    // Price Range
    if (searchParamsValues.min_price || searchParamsValues.max_price) {
        where.listPrice = {
            gte: searchParamsValues.min_price ? Number(searchParamsValues.min_price) : undefined,
            lte: searchParamsValues.max_price ? Number(searchParamsValues.max_price) : undefined,
        };
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
        const ROOT_CATEGORY_ID = "cml9exnw20009orv864or2ni2";
        sidebarCategories = await prisma.category.findMany({
            where: { parentId: ROOT_CATEGORY_ID, isActive: true },
            orderBy: { order: "asc" },
        });
    }


    const [products, totalCount, brands, variants] = await Promise.all([
        prisma.product.findMany({
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
        prisma.product.count({ where }),
        prisma.brand.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, slug: true }
        }),
        prisma.productVariant.findMany({
            where: { isActive: true },
            select: { color: true, size: true },
            distinct: ['color', 'size']
        })
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const uniqueColors = Array.from(new Set(variants.map(v => v.color).filter(Boolean))) as string[];
    const uniqueSizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean))) as string[];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <aside className="lg:w-64 flex-shrink-0 space-y-8">
                    <ProductFilters
                        categories={sidebarCategories}
                        brands={brands}
                        colors={uniqueColors}
                        sizes={uniqueSizes}
                        activeCategorySlug={slug}
                    />
                </aside>

                {/* Products Grid */}
                <div className="flex-1">
                    {/* Header & Sorting */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {category.name}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">{totalCount} ürün listeleniyor</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sıralama:</span>
                            <ProductSort initialSort={searchParamsValues.sort || "newest"} />
                        </div>
                    </div>

                    {products.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed">
                            <p className="text-gray-500">Bu kategoride ürün bulunamadı.</p>
                            <a href="/products" className="text-blue-600 hover:underline mt-2 inline-block">
                                Tüm Ürünleri Gör
                            </a>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                                {products.map((product) => (
                                    <ProductCardV2
                                        key={product.id}
                                        product={{
                                            ...product,
                                            listPrice: Number(product.listPrice),
                                            salePrice: product.salePrice ? Number(product.salePrice) : null,
                                        }}
                                        discountRate={discountRate}
                                        isDealer={isDealer}
                                    />
                                ))}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                baseUrl={`/category/${slug}`}
                                searchParams={searchParamsValues}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
