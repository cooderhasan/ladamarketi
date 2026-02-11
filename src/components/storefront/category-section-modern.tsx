import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
}

interface CategorySectionProps {
    categories: Category[];
}

export function CategorySectionModern({ categories }: CategorySectionProps) {
    if (!categories || categories.length === 0) return null;

    // We'll use a grid layout where the first item might be larger or same size
    // depending on the count. For 4 items, a 2x2 or 1 large + 3 small is good.
    // Let's go with a responsive grid that looks premium.

    return (
        <section className="container mx-auto px-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 h-auto md:h-[500px]">
                {categories.slice(0, 5).map((category, index) => (
                    <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className={cn(
                            "group relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl",
                            "aspect-[2/1] md:aspect-auto",
                            index === 0 ? "md:col-span-2 md:row-span-2" : "md:col-span-1"
                        )}
                    >
                        {/* Background Image with Zoom Effect */}
                        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800">
                            {category.imageUrl ? (
                                <Image
                                    src={category.imageUrl}
                                    alt={category.name}
                                    fill
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                    sizes={index === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                                    priority={index === 0}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                                    <span className="text-6xl grayscale opacity-20">📦</span>
                                </div>
                            )}


                            {/* Gradient Overlay - Subtle bottom fade for readability, keeping top clear */}
                            <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end items-start text-white">
                            <h3 className={cn(
                                "font-bold leading-tight mb-1 md:mb-2 group-hover:translate-x-2 transition-transform duration-300 drop-shadow-lg",
                                index === 0 ? "text-2xl md:text-4xl" : "text-lg md:text-2xl"
                            )}>
                                {category.name}
                            </h3>

                            <div className="h-0 overflow-hidden group-hover:h-10 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 flex items-center">
                                <span className="inline-flex items-center text-xs font-bold text-white bg-blue-600/90 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                                    Ürünleri İncele <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
