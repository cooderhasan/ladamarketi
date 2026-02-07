"use client";

import Link from "next/link";
import { ChevronRight, Menu, Car, Zap, Disc, Shield, Sparkles, Settings, Gauge, Wrench, Layers, Box, Battery } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    slug: string;
    children?: Category[];
    imageUrl?: string | null;
}

interface CategorySidebarProps {
    categories: Category[];
}

function getCategoryIcon(name: string) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("motor")) return <Gauge className="h-5 w-5" />;
    if (lowerName.includes("fren")) return <Disc className="h-5 w-5" />;
    if (lowerName.includes("elektrik") || lowerName.includes("ateşleme")) return <Zap className="h-5 w-5" />;
    if (lowerName.includes("kaporta") || lowerName.includes("karoseri")) return <Shield className="h-5 w-5" />;
    if (lowerName.includes("aksesuar")) return <Sparkles className="h-5 w-5" />;
    if (lowerName.includes("filtre") || lowerName.includes("yağ")) return <Layers className="h-5 w-5" />;
    if (lowerName.includes("soğutma") || lowerName.includes("radyatör")) return <Box className="h-5 w-5" />;
    if (lowerName.includes("lada") || lowerName.includes("samara") || lowerName.includes("vega") || lowerName.includes("niva")) return <Car className="h-5 w-5" />;
    if (lowerName.includes("şanzıman") || lowerName.includes("vites")) return <Settings className="h-5 w-5" />;

    return <Wrench className="h-5 w-5" />;
}

export function CategorySidebar({ categories }: CategorySidebarProps) {
    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 h-full min-h-[600px] flex flex-col relative z-20 transition-all duration-300 hover:shadow-xl group">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 py-4 flex items-center gap-3 rounded-t-2xl shadow-sm">
                <Menu className="h-5 w-5" />
                <span className="font-bold text-lg tracking-wide uppercase">KATEGORİLER</span>
            </div>

            {/* Category List */}
            <div className="flex-1 py-3 relative">
                {categories.map((category) => (
                    <div key={category.id} className="group/item static">
                        {/* Main Category Item */}
                        <Link
                            href={`/products?category=${category.slug}`}
                            className="flex items-center justify-between px-6 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700/50 hover:text-blue-700 dark:hover:text-blue-500 transition-all duration-300 relative group"
                        >
                            <div className="flex items-center gap-3 transform group-hover:translate-x-1 transition-transform duration-300">
                                <span className="text-gray-400 group-hover:text-blue-600 transition-colors bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-md group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
                                    {getCategoryIcon(category.name)}
                                </span>
                                <span>{category.name}</span>
                            </div>

                            {category.children && category.children.length > 0 && (
                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transition-all transform group-hover:translate-x-1" />
                            )}

                            {/* Active Indicator Bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
                        </Link>

                        {/* Subcategories Flyout */}
                        {category.children && category.children.length > 0 && (
                            <div className="absolute left-[calc(100%-4px)] top-0 w-[800px] min-h-full bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 rounded-r-2xl p-8 invisible opacity-0 translate-x-4 group-hover/item:visible group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300 z-50 bg-[url('/pattern.png')] bg-no-repeat bg-right-bottom bg-contain">
                                <div className="mb-8 pb-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            {getCategoryIcon(category.name)}
                                        </div>
                                        {category.name}
                                    </h3>
                                    <Link
                                        href={`/products?category=${category.slug}`}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline"
                                    >
                                        Tümünü Gör <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-3 gap-x-8 gap-y-4 content-start">
                                    {category.children.map((child) => (
                                        <Link
                                            key={child.id}
                                            href={`/products?category=${child.slug}`}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 group/sub transition-all duration-200 border border-transparent hover:border-blue-100 hover:shadow-sm"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-gray-300 group-hover/sub:bg-blue-600 group-hover/sub:scale-125 transition-all" />
                                            <span className="text-[15px] font-medium text-gray-600 dark:text-gray-300 group-hover/sub:text-blue-700 dark:group-hover/sub:text-blue-400">
                                                {child.name}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Bottom Accent */}
            <div className="p-4 mt-auto">
                <div className="bg-blue-50 dark:bg-gray-900/50 rounded-xl p-4 border border-blue-100 dark:border-gray-700/30">
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/70 font-bold text-center flex items-center justify-center gap-2">
                        <Shield className="h-3 w-3" />
                        LADA YEDEK PARÇA UZMANI
                    </p>
                </div>
            </div>
        </div>
    );
}
