"use client";

import Link from "next/link";
import { ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    slug: string;
    children?: Category[];
    imageUrl?: string | null;
}

interface CategoryMenuProps {
    categories: Category[];
}

export function CategoryMenu({ categories }: CategoryMenuProps) {
    return (
        <div className="relative group z-50">
            {/* Trigger Button */}
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-t-lg transition-colors min-w-[250px]">
                <Menu className="h-5 w-5" />
                <span>KATEGORİLER</span>
            </button>

            {/* Dropdown Container */}
            <div className="absolute top-full left-0 w-[250px] bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-b-lg invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                <div className="flex flex-col py-2">
                    {categories.map((category) => (
                        <div key={category.id} className="group/item relative">
                            {/* Main Category Item */}
                            <Link
                                href={`/products?category=${category.slug}`}
                                className="flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 transition-colors"
                            >
                                <span>{category.name}</span>
                                {category.children && category.children.length > 0 && (
                                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover/item:text-blue-600" />
                                )}
                            </Link>

                            {/* Subcategories Flyout */}
                            {category.children && category.children.length > 0 && (
                                <div className="absolute left-full top-0 w-[600px] min-h-full bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg ml-2 p-6 invisible opacity-0 group-hover/item:visible group-hover/item:opacity-100 transition-all duration-200 z-50">
                                    <div className="grid grid-cols-2 gap-6">
                                        {category.children.map((child) => (
                                            <Link
                                                key={child.id}
                                                href={`/products?category=${child.slug}`}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 group/sub transition-all border border-transparent hover:border-gray-100"
                                            >
                                                {/* Placeholder Icon/Image Box */}
                                                <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 group-hover/sub:text-blue-600 group-hover/sub:bg-blue-50 overflow-hidden border border-gray-200 dark:border-gray-600 p-0.5">
                                                    {child.imageUrl ? (
                                                        <img src={child.imageUrl} alt={child.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <span className="text-xs font-bold opacity-30">Img</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white group-hover/sub:text-blue-600">
                                                        {child.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        Kategoriye Git
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
