"use client";

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
                                    className="object-contain p-1 transition-transform duration-700 ease-out group-hover:scale-105"
                                    sizes={index === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                                    priority={index === 0}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                                    <span className="text-6xl grayscale opacity-20">📦</span>
                                </div>
                            )}

                            {/* Blue Tint Overlay to match site theme */}
                            <div className="absolute inset-0 bg-[#009AD0]/10 transition-opacity duration-300 group-hover:opacity-0" />

                            {/* Gradient Overlay - Dark Blue instead of Black */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#002838]/90 via-[#002838]/0 to-transparent opacity-70 transition-opacity group-hover:opacity-60" />
                        </div>

                        {/* Glassmorphism Content Overlay */}
                        <div className={cn(
                            "absolute z-20",
                            index === 0 ? "inset-x-4 bottom-4" : "inset-x-3 bottom-3"
                        )}>
                            <div className={cn(
                                "relative overflow-hidden rounded-xl backdrop-blur-md border border-white/20 shadow-lg transition-all duration-300 bg-[#009AD0]/90 dark:bg-black/80 group-hover:bg-[#007EA8]/95 dark:group-hover:bg-black/90 group-hover:shadow-xl",
                                index === 0 ? "p-5" : "p-3"
                            )}>

                                <div className="relative z-10">
                                    <h3 className={cn(
                                        "font-bold leading-tight text-white transition-transform duration-300 drop-shadow-sm",
                                        index === 0 ? "text-3xl mb-2" : "text-sm mb-0",
                                        "group-hover:-translate-y-0.5"
                                    )}>
                                        {category.name}
                                    </h3>

                                    <div className={cn(
                                        "flex items-center justify-between transition-all duration-300",
                                        index === 0 ? "opacity-90 group-hover:opacity-100" : "grid grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-hover:mt-1"
                                    )}>
                                        <div className="overflow-hidden flex items-center justify-between w-full">
                                            <span className="text-[10px] md:text-xs font-bold text-white/90 uppercase tracking-wider whitespace-nowrap">
                                                Ürünleri Keşfet
                                            </span>
                                            <div className={cn(
                                                "rounded-full flex items-center justify-center transition-all duration-300",
                                                index === 0 ? "bg-white/20 p-1.5" : "bg-transparent p-0 ml-2"
                                            )}>
                                                <ArrowRight className={cn(
                                                    "text-white",
                                                    index === 0 ? "h-4 w-4" : "h-3 w-3"
                                                )} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
