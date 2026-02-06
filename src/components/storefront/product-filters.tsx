"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ProductFiltersProps {
    categories: { id: string; name: string; slug: string }[];
    brands: { id: string; name: string; slug: string }[];
    colors: string[];
    sizes: string[];
}

export function ProductFilters({
    categories,
    brands,
    colors,
    sizes,
}: ProductFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Local state for price inputs to avoid url thrashing
    const [priceRange, setPriceRange] = useState({
        min: searchParams.get("min_price") || "",
        max: searchParams.get("max_price") || "",
    });

    const createQueryString = useCallback(
        (name: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === null) {
                params.delete(name);
            } else {
                params.set(name, value);
            }
            return params.toString();
        },
        [searchParams]
    );

    const toggleFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const current = params.getAll(key);

        if (current.includes(value)) {
            // Remove
            const newValues = current.filter((v) => v !== value);
            params.delete(key);
            newValues.forEach((v) => params.append(key, v));
        } else {
            // Add
            params.append(key, value);
        }

        router.push(`?${params.toString()}`);
    };

    const handlePriceFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (priceRange.min) params.set("min_price", priceRange.min);
        else params.delete("min_price");

        if (priceRange.max) params.set("max_price", priceRange.max);
        else params.delete("max_price");

        router.push(`?${params.toString()}`);
    };

    const isSelected = (key: string, value: string) => {
        return searchParams.getAll(key).includes(value);
    };

    return (
        <div className="space-y-6">
            <Accordion type="multiple" defaultValue={["categories", "brands", "price", "colors", "sizes"]} className="w-full">

                {/* Categories */}
                <AccordionItem value="categories">
                    <AccordionTrigger className="text-base font-semibold">Kategoriler</AccordionTrigger>
                    <AccordionContent>
                        <ScrollArea className="h-[200px] w-full">
                            <div className="space-y-2 p-1">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="cat-all"
                                        checked={!searchParams.get("category")}
                                        onCheckedChange={() => router.push("/products")}
                                    />
                                    <Label htmlFor="cat-all" className="cursor-pointer font-normal">Tüm Kategoriler</Label>
                                </div>
                                {categories.map((category) => (
                                    <div key={category.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`cat-${category.id}`}
                                            checked={searchParams.get("category") === category.slug}
                                            onCheckedChange={() => router.push(`/products?${createQueryString("category", category.slug)}`)}
                                        />
                                        <Label htmlFor={`cat-${category.id}`} className="cursor-pointer font-normal">
                                            {category.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </AccordionContent>
                </AccordionItem>

                {/* Brands */}
                {brands.length > 0 && (
                    <AccordionItem value="brands">
                        <AccordionTrigger className="text-base font-semibold">Markalar</AccordionTrigger>
                        <AccordionContent>
                            <ScrollArea className="h-[200px] w-full">
                                <div className="space-y-2 p-1">
                                    {brands.map((brand) => (
                                        <div key={brand.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`brand-${brand.id}`}
                                                checked={isSelected("brands", brand.slug)}
                                                onCheckedChange={() => toggleFilter("brands", brand.slug)}
                                            />
                                            <Label htmlFor={`brand-${brand.id}`} className="cursor-pointer font-normal">
                                                {brand.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </AccordionContent>
                    </AccordionItem>
                )}

                {/* Price Range */}
                <AccordionItem value="price">
                    <AccordionTrigger className="text-base font-semibold">Fiyat Aralığı</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 p-1">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    placeholder="En Az"
                                    value={priceRange.min}
                                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                    className="w-full"
                                />
                                <span className="text-gray-500">-</span>
                                <Input
                                    type="number"
                                    placeholder="En Fazla"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                    className="w-full"
                                />
                            </div>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={handlePriceFilter}
                            >
                                Filtrele
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Colors */}
                {colors.length > 0 && (
                    <AccordionItem value="colors">
                        <AccordionTrigger className="text-base font-semibold">Renkler</AccordionTrigger>
                        <AccordionContent>
                            <ScrollArea className="h-[200px] w-full">
                                <div className="grid grid-cols-5 gap-2 p-1">
                                    {colors.map((color) => (
                                        <div key={color} className="flex flex-col items-center gap-1 group">
                                            <div className="relative">
                                                <Checkbox
                                                    id={`color-${color}`}
                                                    className="peer sr-only"
                                                    checked={isSelected("colors", color)}
                                                    onCheckedChange={() => toggleFilter("colors", color)}
                                                />
                                                <div
                                                    className={cn(
                                                        "w-8 h-8 rounded-full border border-gray-200 cursor-pointer shadow-sm peer-checked:ring-2 peer-checked:ring-primary peer-checked:ring-offset-2 transition-all hover:scale-110",
                                                        isSelected("colors", color) ? "ring-2 ring-primary ring-offset-2" : ""
                                                    )}
                                                    style={{ backgroundColor: mapColorToCss(color) }}
                                                    onClick={() => toggleFilter("colors", color)}
                                                />
                                            </div>
                                            <Label htmlFor={`color-${color}`} className="text-[10px] text-gray-500 truncate w-full text-center">
                                                {color}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </AccordionContent>
                    </AccordionItem>
                )}

                {/* Sizes */}
                {sizes.length > 0 && (
                    <AccordionItem value="sizes">
                        <AccordionTrigger className="text-base font-semibold">Bedenler</AccordionTrigger>
                        <AccordionContent>
                            <ScrollArea className="h-[200px] w-full">
                                <div className="flex flex-wrap gap-2 p-1">
                                    {sizes.map((size) => (
                                        <div key={size} className="flex items-center">
                                            <Checkbox
                                                id={`size-${size}`}
                                                className="peer sr-only"
                                                checked={isSelected("sizes", size)}
                                                onCheckedChange={() => toggleFilter("sizes", size)}
                                            />
                                            <Label
                                                htmlFor={`size-${size}`}
                                                className={cn(
                                                    "cursor-pointer px-3 py-1.5 rounded-md border text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary",
                                                    isSelected("sizes", size) ? "bg-primary text-primary-foreground border-primary" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                                )}
                                            >
                                                {size}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </AccordionContent>
                    </AccordionItem>
                )}
            </Accordion>
        </div>
    );
}

// Helper to map standard colors to CSS values
// Simple mapping for common colors, fallback to the name
function mapColorToCss(colorName: string): string {
    const map: Record<string, string> = {
        "Kırmızı": "red",
        "Mavi": "blue",
        "Yeşil": "green",
        "Sarı": "yellow",
        "Siyah": "black",
        "Beyaz": "white",
        "Turuncu": "orange",
        "Mor": "purple",
        "Pembe": "pink",
        "Gri": "gray",
        "Lacivert": "navy",
        "Bordo": "maroon",
        "Bej": "beige",
        "Kahverengi": "brown",
        "Turkuaz": "turquoise",
        "Gold": "gold",
        "Gümüş": "silver",
    };
    return map[colorName] || colorName;
}
