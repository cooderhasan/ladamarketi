import { prisma } from "@/lib/db";
import { CategoriesTable } from "@/components/admin/categories-table";
import { CategorySlugMigration } from "@/components/admin/category-slug-migration";
import { CATEGORY_SLUG_MAP } from "@/data/category-slug-map";

export default async function CategoriesPage() {
    const categories = await prisma.category.findMany({
        orderBy: { order: "asc" },
        include: {
            _count: {
                select: { products: true },
            },
            parent: {
                select: { name: true },
            },
        },
    });

    // Onaylı yeni adres listesine henüz geçmemiş kategoriler (tek seferlik güncelleme butonu)
    const pendingSlugs = categories.filter((c) => CATEGORY_SLUG_MAP[c.slug]).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Kategori Yönetimi
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Ürün kategorilerini yönetin
                </p>
            </div>

            <CategorySlugMigration pending={pendingSlugs} />

            <CategoriesTable categories={categories} />
        </div>
    );
}
