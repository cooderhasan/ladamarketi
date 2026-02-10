import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
}

interface CategorySectionProps {
    categories: Category[];
}

export function CategorySection({ categories }: CategorySectionProps) {
    return (
        <section className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pl-4 border-l-4 border-[#009AD0]">
                Kategoriler
            </h2>
            <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className="group relative h-40 sm:h-64 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800">
                            {category.imageUrl ? (
                                <img
                                    src={category.imageUrl}
                                    alt={category.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-300">
                                    <span className="text-5xl opacity-20">🚙</span>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 p-6 w-full translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {category.name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-900/90 dark:text-white/90 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                <span className="border-b border-gray-900/50 dark:border-white/50 pb-0.5">Ürünleri İncele</span>
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
