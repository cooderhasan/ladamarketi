"use client";

import Link from "next/link";
import { Plus, Minus, ChevronRight, Menu, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";
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
    phone?: string;
    whatsappNumber?: string;
}

// Ayarlardaki telefon "0534 519 44 72 - 538 816 84 00" gibi birden fazla numara içerebiliyor: ilkini al
function firstNumber(value?: string) {
    return (value || "").split(/[-\/,|]/)[0].replace(/[^0-9]/g, "");
}

export function CategorySidebarModern({ categories, phone, whatsappNumber }: CategorySidebarProps) {
    const [openCategories, setOpenCategories] = useState<string[]>([]);

    const toggleCategory = (categoryId: string) => {
        setOpenCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const telDigits = firstNumber(phone);
    // wa.me ülke koduyla ister: 0532... -> 90532..., 532... -> 90532...
    const waRaw = firstNumber(whatsappNumber || phone);
    const waDigits = waRaw.startsWith("0") ? "90" + waRaw.slice(1) : waRaw.length === 10 ? "90" + waRaw : waRaw;

    return (
        <div className="w-full flex flex-col gap-4">
            {/* Header - Modern Glassy Look */}
            <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 shadow-sm p-4 group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#009AD0]/10 to-[#009AD0]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-[#009AD0]/10 dark:bg-sky-900/30 rounded-lg text-[#00739C] dark:text-[#4cc3ec]">
                        <Menu className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-none">
                            Kategoriler
                        </h2>
                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                            Tüm Ürünler
                        </span>
                    </div>
                </div>
            </div>

            {/* Category List - Floating Cards style */}
            <div className="flex flex-col gap-2">
                {/* Eski siteden kalan "Home" kök kategorisi listede görünmesin */}
                {categories.filter((c) => c.name.trim().toLowerCase() !== "home").map((category) => {
                    const isOpen = openCategories.includes(category.id);
                    const hasChildren = category.children && category.children.length > 0;

                    return (
                        <div
                            key={category.id}
                            className={cn(
                                "group bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 transition-all duration-300",
                                isOpen ? "shadow-md ring-1 ring-blue-500/20" : "hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800"
                            )}
                        >
                            {/* Main Category Row */}
                            <div className="flex items-center p-1">
                                <Link
                                    href={`/category/${category.slug}`}
                                    className="flex-1 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-3"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors" />
                                    {category.name}
                                </Link>
                                {hasChildren && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleCategory(category.id);
                                        }}
                                        className="p-2 mr-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                        aria-label={isOpen ? "Kapat" : "Aç"}
                                    >
                                        {isOpen ? (
                                            <Minus className="h-4 w-4" />
                                        ) : (
                                            <Plus className="h-4 w-4" />
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Subcategories - Smooth Reveal */}
                            <div
                                className={cn(
                                    "grid transition-all duration-300 ease-in-out",
                                    isOpen ? "grid-rows-[1fr] opacity-100 pb-2" : "grid-rows-[0fr] opacity-0"
                                )}
                            >
                                <div className="overflow-hidden">
                                    <div className="px-4 pb-2 pt-0 space-y-1 border-t border-gray-50 dark:border-gray-800/50 mt-1">
                                        {category.children!.map((child) => (
                                            <Link
                                                key={child.id}
                                                href={`/category/${child.slug}`}
                                                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group/sub"
                                            >
                                                <div className="w-1 h-1 rounded-full bg-gray-300 group-hover/sub:bg-blue-400 transition-colors" />
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Destek kartı: parça seçiminde yardım (önceden mor "Güvenli Alışveriş / %100 Orijinal" kartı vardı;
                yan sanayi parça da satıldığı için o ifade kaldırıldı) */}
            {(telDigits || waDigits) && (
                <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#0aa6dd] to-[#00739C] p-5 text-white shadow-lg shadow-[#009AD0]/20">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75 mb-1">Parça mı arıyorsunuz?</p>
                    <p className="font-bold text-lg leading-snug mb-1">Doğru parçayı birlikte bulalım</p>
                    <p className="text-xs text-white/80 mb-4">Şasi numaranız veya aracınızın modeliyle bize ulaşın.</p>
                    <div className="space-y-2">
                        {waDigits && (
                            <a
                                href={`https://wa.me/${waDigits}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white text-[#00739C] text-sm font-bold hover:bg-white/90 transition-colors"
                            >
                                <MessageCircle className="h-4 w-4" />
                                WhatsApp&apos;tan Yazın
                            </a>
                        )}
                        {telDigits && (
                            <a
                                href={`tel:${telDigits}`}
                                className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white/15 ring-1 ring-inset ring-white/25 text-sm font-semibold hover:bg-white/25 transition-colors"
                            >
                                <Phone className="h-4 w-4" />
                                {phone?.split(/[-\/,|]/)[0].trim()}
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

