import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ProductCardV2 } from "@/components/storefront/product-card-v2";
import { ProductFilters } from "@/components/storefront/product-filters";
import { Prisma } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { redirect } from "next/navigation";
import { ProductSort } from "@/components/storefront/product-sort";

import { Pagination } from "@/components/storefront/pagination";

interface ProductsPageProps {
    searchParams: Promise<{
        category?: string;
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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const params = await searchParams;
    const session = await auth();
    const discountRate = session?.user?.discountRate || 0;
    const isDealer =
        session?.user?.role === "DEALER" && session?.user?.status === "APPROVED";

    // --- Build Filtering Queries ---
    const where: Prisma.ProductWhereInput = { isActive: true };

    // Category
    if (params.category) {
        const category = await prisma.category.findUnique({
            where: { slug: params.category },
            include: { children: { select: { id: true } } }
        });

        if (category) {
            const categoryIds = [category.id, ...category.children.map(c => c.id)];
            // where.categoryId = { in: categoryIds }; // Legacy field
            (where as any).categories = { some: { id: { in: categoryIds } } };
        } else {
            // If category slug is invalid but provided, verified later by products length being 0 usually, 
            // but strictly we might want to return 404. For now, let it return empty.
            // where.category = { slug: params.category };
            (where as any).categories = { some: { slug: params.category } };
        }
    }

    // Search
    if (params.search) {
        where.OR = [
            { name: { contains: params.search, mode: "insensitive" } },
            { sku: { contains: params.search, mode: "insensitive" } },
            { barcode: { contains: params.search, mode: "insensitive" } },
            {
                variants: {
                    some: {
                        OR: [
                            { sku: { contains: params.search, mode: "insensitive" } },
                            { barcode: { contains: params.search, mode: "insensitive" } },
                        ],
                    },
                },
            },
        ];
    }

    // Price Range
    if (params.min_price || params.max_price) {
        where.listPrice = {
            gte: params.min_price ? Number(params.min_price) : undefined,
            lte: params.max_price ? Number(params.max_price) : undefined,
        };
    }

    // Brands
    const brandSlugs = typeof params.brands === 'string' ? [params.brands] : params.brands;
    if (brandSlugs && brandSlugs.length > 0) {
        where.brand = { slug: { in: brandSlugs } };
    }

    // Variants (Color & Size)
    const colorFilters = typeof params.colors === 'string' ? [params.colors] : params.colors;
    const sizeFilters = typeof params.sizes === 'string' ? [params.sizes] : params.sizes;

    if ((colorFilters && colorFilters.length > 0) || (sizeFilters && sizeFilters.length > 0)) {
        where.variants = {
            some: {
                // Must have at least one variant matching ANY of the colors AND ANY of the sizes if both are present
                // OR logic for within same type, AND logic across types is standard
                // However, Prisma 'some' works on the list.
                // If we want "Red OR Blue", we use `in`.
                // If we want "Red" AND "Large", we check for a variant that is both Red and Large? 
                // Usually filters are "Product has Red variant" AND "Product has Large variant" (might be different variants).
                // Let's implement: Product must have a variant that matches Color IN [...] AND Size IN [...] 
                // Actually, often users want "Show me products that are available in Red".

                OR: [
                    // If colors are selected
                    ...(colorFilters && colorFilters.length > 0 ? [{ color: { in: colorFilters } }] : []),
                    // If sizes are selected (This logic means OR - product has Red OR product has Large. Users usually expect AND between distinct filters)
                    // A better approach for Filter sections is usually Intersection (AND).
                    // So: Product has (Color IN colors) matches.
                ]
            }
        };

        // Let's refine for AND logic between Filter Groups (Brand AND Color AND Size)
        // Prisma `where.variants` with `some` checks if *at least one* variant matches criteria.
        // If we want "Has Red variant" AND "Has Large variant", we might need multiple `some` clauses if they don't need to be the *same* variant.
        // But valid variants are usually what we care about.
        // Let's try to match: Has a variant that is (Color IN colors AND Size IN sizes).

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
    if (params.sort === "price_asc") {
        orderBy = { listPrice: "asc" };
    } else if (params.sort === "price_desc") {
        orderBy = { listPrice: "desc" };
    } else if (params.sort === "newest") {
        orderBy = { createdAt: "desc" };
    }

    // --- Execute Queries ---
    const PAGE_SIZE = 20;
    const currentPage = params.page ? Number(params.page) : 1;
    const skip = (currentPage - 1) * PAGE_SIZE;

    const ROOT_CATEGORY_ID = "cml9exnw20009orv864or2ni2"; // Known Root ID
    let sidebarCategories: any[] = [];
    let currentCategory: { name: string; slug: string } | null = null;

    if (params.category) {
        const foundCategory = await prisma.category.findUnique({
            where: { slug: params.category },
            include: { children: { where: { isActive: true }, orderBy: { order: "asc" } } }
        });

        if (foundCategory) {
            currentCategory = foundCategory;
            if (foundCategory.children.length > 0) {
                // Show children
                sidebarCategories = foundCategory.children;
            } else {
                // Show siblings (excluding Root if parent is null)
                if (foundCategory.parentId) {
                    sidebarCategories = await prisma.category.findMany({
                        where: { parentId: foundCategory.parentId, isActive: true },
                        orderBy: { order: "asc" }
                    });
                }
            }
        }
    }

    // If still empty (no category selected OR invalid category OR root fallback), fetch Top Level
    if (sidebarCategories.length === 0) {
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

    // Extract unique colors and sizes
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
                    />
                </aside>

                {/* Products Grid */}
                <div className="flex-1">
                    {/* Header & Sorting */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {currentCategory
                                    ? currentCategory.name
                                    : params.search ? `"${params.search}" Arama Sonuçları` : "Tüm Ürünler"}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">{totalCount} ürün listeleniyor</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sıralama:</span>
                            {/* Using a simple form for server-side sort or client component? 
                               Component props are server components, so we can't use onChange easily without client component.
                               We can reuse logic or make a small Client Wrapper.
                               Actually, ProductFilters is client, let's make a Sorting component or just use a helper here if we can.
                               Simplest: Make the whole page Client? No, SEO.
                               Best: Small client component for Sort.
                           */}
                            <ProductSort initialSort={params.sort || "newest"} />
                        </div>
                    </div>

                    {products.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed">
                            <p className="text-gray-500">Bu kriterlere uygun ürün bulunamadı.</p>
                            <a href="/products" className="text-blue-600 hover:underline mt-2 inline-block">
                                Filtreleri Temizle
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
                                baseUrl="/products"
                                searchParams={params}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}




