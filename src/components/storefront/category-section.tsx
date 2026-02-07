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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                Kategoriler
            </h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        href={`/products?category=${category.slug}`}
                        className="group relative h-64 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 bg-white dark:bg-gray-800">
                            {category.imageUrl ? (
                                <img
                                    src={category.imageUrl}
                                    alt={category.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400">
                                    <span className="text-4xl">📷</span>
                                </div>
                            )}
                        </div>

                        {/* Overlay - only at bottom for text readability */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <h3 className="text-xl font-bold text-white mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                {category.name}
                            </h3>
                            <div className="flex items-center text-sm text-[#B3E5FC] font-medium translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                Şimdi İncele
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
