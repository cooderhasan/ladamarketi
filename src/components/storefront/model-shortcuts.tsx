import Link from "next/link";
import { Car } from "lucide-react";

interface ModelCategory {
    id: string;
    name: string;
    slug: string;
}

// "Lada Vega 16v Yedek Parçaları" -> "Vega 16v": düğmede kısa ad, tam ad title'da
function shortName(name: string) {
    return name
        .replace(/^lada\s+/i, "")
        .replace(/\s+yedek\s+parçalar[ıi]?$/i, "")
        .trim() || name;
}

// Ana sayfada "Aracınızı seçin": üst kategoriler (araç modelleri) yatay kaydırılan düğmeler olarak.
// Telefonda kenar menü yok; müşteri önce aracını seçer. Veri kenar menüdeki kategori listesinden, ek sorgu yok.
export function ModelShortcuts({ categories }: { categories: ModelCategory[] }) {
    const models = categories.filter((c) => c.name.trim().toLowerCase() !== "home");
    if (models.length === 0) return null;

    return (
        // Masaüstünde (lg) hemen yanında aynı listeyi gösteren kategori menüsü var; tekrar etmesin diye sadece telefon/tablette
        <nav aria-label="Araç modeline göre parçalar" className="min-w-0 lg:hidden">
            <p className="flex items-center justify-center gap-2 mb-2.5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] text-[#00739C] dark:text-[#4cc3ec]">
                <span className="h-px w-6 bg-[#009AD0]" />
                Aracınızı Seçin
                <span className="h-px w-6 bg-[#009AD0]" />
            </p>
            {/* Telefonda tek satır, yana kayar; geniş ekranda ortalanmış ve satır kırılır */}
            <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1 md:mx-0 md:px-0 md:flex-wrap md:justify-center md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {models.map((c) => (
                    <Link
                        key={c.id}
                        href={`/category/${c.slug}`}
                        title={c.name}
                        className="group shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 px-3.5 py-2 text-[13px] font-semibold text-gray-700 dark:text-gray-200 shadow-xs hover:ring-[#009AD0] hover:text-[#00739C] hover:bg-[#009AD0]/5 transition-colors whitespace-nowrap"
                    >
                        <Car className="h-3.5 w-3.5 text-[#009AD0]" />
                        {shortName(c.name)}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
