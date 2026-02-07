"use client";

import Link from "next/link";
import { ChevronRight, Menu, Settings2, ShieldCheck, Zap, Wrench, Package, Car, Gauge, LayoutGrid } from "lucide-react";
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

// Map generic icons to category keywords for a more dynamic feel
const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("motor") || n.includes("aksam")) return <Zap className="h-4 w-4" />;
    if (n.includes("bakım") || n.includes("yağ")) return <Settings2 className="h-4 w-4" />;
    if (n.includes("fren") || n.includes("güvenlik")) return <ShieldCheck className="h-4 w-4" />;
    if (n.includes("kaporta") || n.includes("dış")) return <Car className="h-4 w-4" />;
    if (n.includes("elektrik") || n.includes("aydınlatma")) return <LayoutGrid className="h-4 w-4" />;
    if (n.includes("yedek parça")) return <Wrench className="h-4 w-4" />;
    if (n.includes("aksesuar")) return <Gauge className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
};

export function CategorySidebar({ categories }: CategorySidebarProps) {
    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 h-full min-h-[600px] flex flex-col relative z-20 transition-all duration-300 hover:shadow-xl">
            {/* Header */}
            <div className="bg-[#009AD0] text-white px-6 py-4 flex items-center gap-3">
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
                            className="flex items-center justify-between px-6 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-[#009AD0]/10 dark:hover:bg-gray-700/50 hover:text-[#009AD0] dark:hover:text-[#009AD0] transition-all duration-300 relative group"
                        >
                            <div className="flex items-center gap-3 transform group-hover:translate-x-1 transition-transform duration-300">
                                <span className="text-[#009AD0]/70 group-hover:text-[#009AD0] transition-colors">
                                    {getCategoryIcon(category.name)}
                                </span>
                                <span>{category.name}</span>
                            </div>

                            {category.children && category.children.length > 0 && (
                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#009AD0] transition-all transform group-hover:translate-x-1" />
                            )}

                            {/* Active Indicator Bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#009AD0] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
                        </Link>

                        {/* Subcategories Flyout */}
                        {category.children && category.children.length > 0 && (
                            <div className="absolute left-[calc(100%-4px)] top-0 w-[800px] min-h-full bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 rounded-r-2xl p-8 invisible opacity-0 translate-x-4 group-hover/item:visible group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300 z-50">
                                <div className="mb-8 pb-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white flex items-center gap-3">
                                        <span className="w-2 h-8 bg-[#009AD0] rounded-full" />
                                        {category.name}
                                    </h3>
                                    <Link
                                        href={`/products?category=${category.slug}`}
                                        className="text-sm text-[#009AD0] hover:text-[#009AD0]/80 font-bold"
                                    >
                                        Tümünü Gör
                                    </Link>
                                </div>
                                <div className="grid grid-cols-3 gap-x-8 gap-y-4 content-start">
                                    {category.children.map((child) => (
                                        <Link
                                            key={child.id}
                                            href={`/products?category=${child.slug}`}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#009AD0]/5 dark:hover:bg-gray-700/50 group/sub transition-all duration-200"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover/sub:bg-[#009AD0] group-hover/sub:scale-150 transition-all" />
                                            <span className="text-[15px] font-medium text-gray-600 dark:text-gray-300 group-hover/sub:text-[#009AD0] dark:group-hover/sub:text-[#009AD0]">
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
                <div className="bg-[#009AD0]/10 dark:bg-gray-900/50 rounded-xl p-4 border border-[#009AD0]/20 dark:border-gray-700/30">
                    <p className="text-xs text-[#009AD0]/70 dark:text-[#009AD0]/70 font-bold text-center">
                        LADA YEDEK PARÇA UZMANI
                    </p>
                </div>
            </div>
        </div>
    );
}
