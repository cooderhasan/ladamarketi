import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    productCount?: number;
}

interface CategorySectionProps {
    categories: Category[];
}

/**
 * Öne çıkan kategori kartları. Görseller mavi zeminli (#0295C9) araç fotoğrafları: kart da aynı mavide, görsel sağ altta
 * kırpılmadan (object-contain) durur, zemini kartla birleşir. Yazı solda üstte, "İncele" solda altta: araçla çakışmaz.
 * Önceden görsel kartı tamamen kaplıyordu (araçlar kesiliyordu), alttaki koyu geçiş mavi zemini bulandırıyor ve yazı
 * aracın üstüne biniyordu.
 */
function CategoryCard({ category, size, priority }: { category: Category; size: "lg" | "sm"; priority?: boolean }) {
    const lg = size === "lg";
    return (
        <Link
            href={`/category/${category.slug}`}
            className={`group relative block overflow-hidden rounded-2xl bg-[#0295C9] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0295C9]/25 ${lg ? "h-48 sm:h-56 md:h-64" : "h-44 md:h-52"}`}
        >
            {category.imageUrl && (
                <div className={`absolute bottom-0 right-0 ${lg ? "w-[78%] h-[88%]" : "w-[92%] h-[56%] sm:w-[88%] sm:h-[72%]"}`}>
                    <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        sizes={lg ? "(max-width: 640px) 80vw, 40vw" : "(max-width: 640px) 45vw, 28vw"}
                        priority={priority}
                        className="object-contain object-right-bottom transition-transform duration-500 ease-out group-hover:translate-x-1 group-hover:scale-105"
                    />
                </div>
            )}
            {/* Hafif ışık: tüm kartın üstünde olduğu için görselin zemini ile kart arasında ton farkı oluşmaz */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/10" />

            <div className={`relative z-10 ${lg ? "p-5 md:p-6 max-w-[62%]" : "p-4 max-w-[78%]"}`}>
                <h3 className={`font-extrabold tracking-tight text-white leading-tight drop-shadow-sm ${lg ? "text-lg sm:text-xl md:text-2xl" : "text-sm sm:text-base md:text-lg"}`}>
                    {category.name}
                </h3>
                {typeof category.productCount === "number" && category.productCount > 0 && (
                    <p className={`mt-1 font-medium text-white/80 ${lg ? "text-xs md:text-sm" : "text-[11px] md:text-xs"}`}>
                        {category.productCount.toLocaleString("tr-TR")} parça
                    </p>
                )}
            </div>

            {/* Telefonda küçük kartta "İncele" gizli: başlık + araç sığsın diye (kartın tamamı bağlantı) */}
            <span className={`absolute z-10 items-center gap-1.5 rounded-full bg-white/15 ring-1 ring-inset ring-white/30 backdrop-blur-sm font-semibold text-white transition-colors group-hover:bg-white group-hover:text-[#00739C] ${lg ? "inline-flex left-5 md:left-6 bottom-5 md:bottom-6 px-3.5 py-1.5 text-xs md:text-sm" : "hidden sm:inline-flex left-4 bottom-4 px-3 py-1 text-[11px] md:text-xs"}`}>
                İncele
                <ArrowRight className={lg ? "h-3.5 w-3.5 md:h-4 md:w-4" : "h-3 w-3"} />
            </span>
        </Link>
    );
}

export function CategorySectionModern({ categories }: CategorySectionProps) {
    if (!categories || categories.length === 0) return null;

    const topRow = categories.slice(0, 2);
    const bottomRow = categories.slice(2, 5);

    return (
        <section>
            <div className="space-y-4">
                {/* Top Row: 2 Large Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {topRow.map((category) => (
                        <CategoryCard key={category.id} category={category} size="lg" priority />
                    ))}
                </div>

                {/* Bottom Row: 3 Smaller Cards (telefonda 2) */}
                {bottomRow.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {bottomRow.map((category, index) => (
                            <div key={category.id} className={index === bottomRow.length - 1 ? "hidden sm:block" : undefined}>
                                <CategoryCard category={category} size="sm" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
