import Link from "next/link";
import { ProductCardModern } from "./product-card-modern";
import { ArrowRight } from "lucide-react";

interface Product {
    id: string;
    name: string;
    slug: string;
    images: string[];
    listPrice: number;
    vatRate: number;
    minQuantity: number;
    stock: number;
    category: {
        name: string;
        slug: string;
    } | null;
    brand?: {
        name: string;
        slug: string;
    } | null;
    weight?: number | null;
    width?: number | null;
    height?: number | null;
    length?: number | null;
    desi?: number | null;
}

interface FeaturedProductsProps {
    title: string;
    products: Product[];
    discountRate: number;
    isDealer: boolean;
    badge?: string;
    variant?: "featured" | "new" | "bestseller" | "deals" | "default";
}

// Sütun sayısına göre tam satırları göster (2 sütunda 6, 3 sütunda 6, 4 sütunda 8'e kadar):
// alt satırda tek başına kalan ürün olmasın, telefonda sayfa da gereksiz uzamasın
function fullRows(count: number, cols: number, max: number) {
    const n = Math.min(count, max);
    return Math.floor(n / cols) * cols || n;
}

export function FeaturedProducts({
    title,
    products,
    discountRate,
    isDealer,
    badge,
    variant = "default",
}: FeaturedProductsProps) {
    if (products.length === 0) return null;

    // Başlığın üstündeki küçük etiket
    const eyebrow = {
        new: "Yeni Gelenler",
        featured: "Sizin İçin Seçtik",
        bestseller: "En Çok Tercih Edilenler",
        deals: "İndirimli Fiyatlar",
        default: "",
    }[variant];
    const allHref = {
        new: "/products?sort=newest",
        deals: "/indirimli-urunler",
        featured: "/products",
        bestseller: "/products",
        default: "/products",
    }[variant];
    // "Öne Çıkanlar" hafif mavi zeminli bir bant içinde: bölümler alt alta aynı görünmesin
    const banded = variant === "featured";

    const showBase = fullRows(products.length, 2, 6);
    const showMd = fullRows(products.length, 3, 6);
    const show2xl = fullRows(products.length, 4, 8);

    return (
        // Sayfa zaten container + px-4 içinde; burada tekrar container/px-4 vardı, kenar boşluğu ikiye katlanıyordu
        <section className={banded ? "rounded-3xl bg-[#009AD0]/[0.06] dark:bg-sky-950/20 ring-1 ring-[#009AD0]/10 px-3 py-6 sm:px-6 md:px-8 md:py-10" : ""}>
            {/* Section Header */}
            <div className="flex items-end justify-between gap-4 mb-5 md:mb-7">
                <div className="min-w-0">
                    {eyebrow && (
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="h-px w-6 bg-[#009AD0]" />
                            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] text-[#00739C] dark:text-[#4cc3ec]">
                                {eyebrow}
                            </span>
                        </div>
                    )}
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        {title}
                    </h2>
                </div>
                <Link
                    href={allHref}
                    className="group/all shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[#009AD0]/30 bg-white dark:bg-gray-900 dark:border-gray-700 px-3.5 py-2 text-xs md:text-sm font-semibold text-[#00739C] dark:text-[#4cc3ec] hover:bg-[#009AD0] hover:text-white hover:border-[#009AD0] transition-colors"
                >
                    Tümünü Gör
                    <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4 transition-transform group-hover/all:translate-x-0.5" />
                </Link>
            </div>

            {/* Products Grid */}
            <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
                {products.map((product, i) => (
                    <div
                        key={product.id}
                        className={[
                            i < showBase ? "block" : "hidden",
                            i < showMd ? "md:block" : "md:hidden",
                            i < show2xl ? "2xl:block" : "2xl:hidden",
                        ].join(" ")}
                    >
                        <ProductCardModern
                            product={product}
                            discountRate={discountRate}
                            isDealer={isDealer}
                            badge={badge}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
