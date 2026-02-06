"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
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

export function CategorySidebar({ categories }: CategorySidebarProps) {
    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[500px] relative z-10">
            <div className="bg-blue-700 text-white px-5 py-3 font-bold text-lg flex items-center justify-between rounded-t-lg">
                <span>KATEGORİLER</span>
            </div>
            <div className="flex flex-col py-2 relative">
                {categories.map((category) => (
                    <div key={category.id} className="group/item static">
                        {/* Note: 'static' here relies on the parent having 'relative' if we want the flyout to be relative to the menu container, 
                            BUT for a sidebar, standard behavior is a flyout that overlaps the content to the right. 
                            So getting the positioning right is key. 
                            We want the flyout relative to the Sidebar Item? No, usually relative to the Sidebar Container.
                        */}

                        {/* Main Category Item */}
                        <Link
                            href={`/products?category=${category.slug}`}
                            className="flex items-center justify-between px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                        >
                            <span>{category.name}</span>
                            {category.children && category.children.length > 0 && (
                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover/item:text-blue-600" />
                            )}
                        </Link>

                        {/* Subcategories Flyout - Positioned to the right of the sidebar */}
                        {category.children && category.children.length > 0 && (
                            <div className="absolute left-full top-0 w-[800px] h-full bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 p-6 invisible opacity-0 group-hover/item:visible group-hover/item:opacity-100 transition-opacity z-50">
                                <div className="mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{category.name}</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-4 content-start">
                                    {category.children.map((child) => (
                                        <Link
                                            key={child.id}
                                            href={`/products?category=${child.slug}`}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 group/sub transition-all"
                                        >
                                            <div className="w-10 h-10 shrink-0 bg-gray-100 dark:bg-gray-600 rounded-md flex items-center justify-center text-gray-400 group-hover/sub:text-blue-600 group-hover/sub:bg-blue-50">
                                                {/* Placeholder for small category image or icon */}
                                                <div className="w-2 h-2 rounded-full bg-current" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover/sub:text-blue-600">
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
        </div>
    );
}
