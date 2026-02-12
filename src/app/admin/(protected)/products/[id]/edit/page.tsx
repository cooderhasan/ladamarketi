import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

interface EditProductPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
    const { id } = await params;

    const [product, categories, brands] = await Promise.all([
        prisma.product.findUnique({
            where: { id },
            include: {
                variants: true,
                categories: true,
            },
        }),
        prisma.category.findMany({
            where: {
                isActive: true,
                NOT: {
                    name: { in: ["Root", "Home"] }
                }
            },
            orderBy: { order: "asc" },
            select: { id: true, name: true, parentId: true },
        }),
        prisma.brand.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        }),
    ]);

    if (!product) {
        notFound();
    }

    // Serialize product data for client component
    const anyProduct = product as any;
    const serializedProduct = {
        ...product,
        listPrice: product.listPrice.toNumber(),
        salePrice: product.salePrice ? product.salePrice.toNumber() : null,
        trendyolPrice: product.trendyolPrice ? product.trendyolPrice.toNumber() : null,
        n11Price: product.n11Price ? product.n11Price.toNumber() : null,
        hepsiburadaPrice: product.hepsiburadaPrice ? product.hepsiburadaPrice.toNumber() : null,
        weight: anyProduct.weight ? Number(anyProduct.weight) : null,
        width: anyProduct.width ? Number(anyProduct.width) : null,
        height: anyProduct.height ? Number(anyProduct.height) : null,
        length: anyProduct.length ? Number(anyProduct.length) : null,
        desi: anyProduct.desi ? Number(anyProduct.desi) : null,
        variants: product.variants.map((v) => ({
            ...v,
            color: v.color || "",
            size: v.size || "",
            sku: v.sku || "",
            barcode: v.barcode || "",
            priceAdjustment: v.priceAdjustment.toNumber(),
        })),
        categories: product.categories.map(c => ({ id: c.id })),
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Ürün Düzenle
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    {product.name}
                </p>
            </div>

            <ProductForm
                categories={categories}
                brands={brands}
                product={serializedProduct}
            />
        </div>
    );
}

