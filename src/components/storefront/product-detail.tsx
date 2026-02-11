"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProductCardV2 } from "./product-card-v2";
import { formatPrice, calculatePrice, validateMinQuantity } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";
import { useState } from "react";
import { ShoppingCart, Minus, Plus, Package, Truck, ArrowLeft, ChevronLeft, ChevronRight, FileQuestion, CreditCard } from "lucide-react";
import { InstallmentTable } from "./installment-table";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface ProductVariant {
    id: string;
    color: string | null;
    size: string | null;
    stock: number;
    sku: string | null;
    barcode: string | null;
    priceAdjustment: number;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    images: string[];
    listPrice: number;
    salePrice?: number | null;
    vatRate: number;
    minQuantity: number;
    stock: number;
    sku: string | null;
    barcode: string | null;
    origin: string | null;
    description: string | null;
    category: {
        id: string;
        name: string;
        slug: string;
    } | null;
    brand?: {
        name: string;
        slug: string;
    } | null;
    variants?: ProductVariant[];
}


interface ProductDetailProps {
    product: Product;
    relatedProducts: Product[];
    discountRate: number;
    isDealer: boolean;
    isAuthenticated: boolean;
    whatsappNumber?: string;
}

export function ProductDetail({
    product,
    relatedProducts,
    discountRate,
    isDealer,
    isAuthenticated,
    whatsappNumber,
}: ProductDetailProps) {
    const [quantity, setQuantity] = useState(product.minQuantity);
    const [inputValue, setInputValue] = useState(product.minQuantity.toString());
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const addItem = useCartStore((state) => state.addItem);

    // Get unique colors and sizes from variants
    const variants = product.variants || [];
    const colors = [...new Set(variants.filter(v => v.color).map(v => v.color!))];
    const sizes = [...new Set(variants.filter(v => v.size).map(v => v.size!))];
    const hasVariants = variants.length > 0;

    // Selected color and size
    const [selectedColor, setSelectedColor] = useState<string | null>(colors.length > 0 ? colors[0] : null);
    const [selectedSize, setSelectedSize] = useState<string | null>(sizes.length > 0 ? sizes[0] : null);

    // Find matching variant based on selection
    const findVariant = () => {
        if (!hasVariants) return null;
        return variants.find(v => {
            const colorMatch = !colors.length || v.color === selectedColor;
            const sizeMatch = !sizes.length || v.size === selectedSize;
            return colorMatch && sizeMatch;
        }) || null;
    };

    // Update selected variant when color/size changes
    const currentVariant = findVariant();
    const effectiveStock = hasVariants ? (currentVariant?.stock || 0) : product.stock;
    const priceAdjustment = currentVariant?.priceAdjustment || 0;

    const price = calculatePrice(
        product.listPrice + priceAdjustment,
        discountRate,
        product.vatRate
    );

    const baseSalePrice = product.salePrice;
    const hasSalePrice = baseSalePrice != null && baseSalePrice < product.listPrice;
    const effectiveSalePrice = hasSalePrice ? (baseSalePrice! + priceAdjustment) : null;
    const saleDiscountRate = hasSalePrice && baseSalePrice != null
        ? Math.round(((product.listPrice - baseSalePrice) / product.listPrice) * 100)
        : 0;

    const displayFinalPrice = hasSalePrice ? effectiveSalePrice! : (isDealer ? price.finalPrice : (product.listPrice + priceAdjustment));
    const showStrikethrough = hasSalePrice || (isDealer && discountRate > 0);
    const strikethroughPrice = product.listPrice + priceAdjustment;

    const vatAmount = hasSalePrice
        ? (displayFinalPrice - (displayFinalPrice / (1 + product.vatRate / 100)))
        : price.vatAmount;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= 0) {
            setQuantity(numValue);
        }
    };

    const handleInputBlur = () => {
        let numValue = Number(inputValue);
        if (isNaN(numValue)) numValue = product.minQuantity;
        if (numValue < product.minQuantity) numValue = product.minQuantity;
        if (numValue > effectiveStock) numValue = effectiveStock;
        setQuantity(numValue);
        setInputValue(numValue.toString());
    };

    const adjustQuantity = (delta: number) => {
        const newValue = quantity + delta;
        if (newValue >= product.minQuantity && newValue <= effectiveStock) {
            setQuantity(newValue);
            setInputValue(newValue.toString());
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    const handleAddToCart = () => {
        const validation = validateMinQuantity(quantity, product.minQuantity);
        if (!validation.valid) {
            toast.error(validation.message);
            return;
        }
        if (quantity > effectiveStock) {
            toast.error(`Stokta sadece ${effectiveStock} adet bulunuyor.`);
            return;
        }
        if (hasVariants && !currentVariant) {
            toast.error("Lütfen bir varyant seçin.");
            return;
        }
        const variantInfo = currentVariant ?
            [selectedColor && `Renk: ${selectedColor}`, selectedSize && `Beden: ${selectedSize}`]
                .filter(Boolean).join(", ") : undefined;

        addItem({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            image: product.images[0] || "",
            quantity,
            listPrice: product.listPrice + priceAdjustment,
            discountRate: hasSalePrice ? saleDiscountRate : discountRate,
            vatRate: product.vatRate,
            minQuantity: product.minQuantity,
            stock: effectiveStock,
            variantId: currentVariant?.id,
            variantInfo,
        });
        toast.success("Ürün sepete eklendi!");
    };

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
                <Link href="/" className="hover:text-[#009AD0] transition-colors">
                    Ana Sayfa
                </Link>
                <span className="text-gray-300">/</span>
                <Link href="/products" className="hover:text-[#009AD0] transition-colors">
                    Ürünler
                </Link>
                {product.category && (
                    <>
                        <span className="text-gray-300">/</span>
                        <Link
                            href={`/products?category=${product.category.slug}`}
                            className="hover:text-[#009AD0] transition-colors"
                        >
                            {product.category.name}
                        </Link>
                    </>
                )}
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 dark:text-white font-medium truncate">{product.name}</span>
            </div>

            <div className="grid gap-12 lg:grid-cols-12 mb-24">
                {/* Left Column: Image Gallery (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="relative aspect-square bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 group">
                        {product.images[0] ? (
                            <Image
                                src={product.images[activeImageIndex] || product.images[0]}
                                alt={product.name}
                                fill
                                className="object-contain p-8 hover:scale-105 transition-transform duration-500"
                                priority
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <Package className="w-24 h-24 text-gray-300" />
                            </div>
                        )}
                        {product.stock === 0 && (
                            <div className="absolute top-6 left-6 z-10">
                                <Badge variant="destructive" className="text-base px-4 py-1.5 shadow-lg">
                                    Stokta Yok
                                </Badge>
                            </div>
                        )}

                        {/* Interactive Zoom Hint */}
                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md pointer-events-none">
                            Yakınlaştırmak için üzerine gelin
                        </div>

                        {/* Navigation Arrows */}
                        {product.images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setActiveImageIndex((prev) =>
                                            prev === 0 ? product.images.length - 1 : prev - 1
                                        );
                                    }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-black/80 text-gray-900 dark:text-white shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-[#009AD0] hover:text-white translate-x-[-10px] group-hover:translate-x-0"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setActiveImageIndex((prev) =>
                                            prev === product.images.length - 1 ? 0 : prev + 1
                                        );
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-black/80 text-gray-900 dark:text-white shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-[#009AD0] hover:text-white translate-x-[10px] group-hover:translate-x-0"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {product.images.length > 1 && (
                        <div className="grid grid-cols-6 gap-3">
                            {product.images.map((image, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setActiveImageIndex(index)}
                                    className={cn(
                                        "relative aspect-square rounded-xl overflow-hidden border transition-all duration-300",
                                        activeImageIndex === index
                                            ? "border-[#009AD0] ring-2 ring-[#009AD0]/20 scale-95 opacity-100"
                                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 opacity-70 hover:opacity-100"
                                    )}
                                >
                                    <Image
                                        src={image}
                                        alt={`${product.name} - ${index + 1}`}
                                        fill
                                        className="object-contain p-1"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Product Info & Buy Box (5 cols) */}
                <div className="lg:col-span-12 xl:col-span-5 h-fit lg:sticky lg:top-24 space-y-8">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 lg:p-8 shadow-xl shadow-gray-200/50 dark:shadow-gray-950/50 border border-gray-100 dark:border-gray-800">
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div>
                                {product.category && (
                                    <Link
                                        href={`/products?category=${product.category.slug}`}
                                        className="text-[#009AD0] font-medium text-sm hover:underline mb-2 inline-block"
                                    >
                                        {product.category.name}
                                    </Link>
                                )}
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                                    {product.name}
                                </h1>
                                {product.brand && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-gray-500 text-sm">Marka:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{product.brand.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Pricing Section */}
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50">
                                <div className="flex items-baseline gap-3 flex-wrap">
                                    <div className="text-4xl md:text-5xl font-black text-[#009AD0] tracking-tight">
                                        {formatPrice(displayFinalPrice)}
                                    </div>
                                    {showStrikethrough && (
                                        <div className="text-xl text-gray-400 line-through font-medium">
                                            {formatPrice(strikethroughPrice)}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                    <span>KDV Dahil</span>
                                    {(isDealer && discountRate > 0 || hasSalePrice) && (
                                        <Badge className="bg-[#E31E24] hover:bg-[#c4191f] text-white border-none px-2 py-0.5 ml-auto">
                                            %{Math.max(discountRate, saleDiscountRate)} İndirim
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Variants */}
                            {hasVariants && (
                                <div className="space-y-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                                    {colors.length > 0 && (
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-gray-900 dark:text-white">Renk Seçenekleri</label>
                                            <div className="flex flex-wrap gap-3">
                                                {colors.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setSelectedColor(color)}
                                                        className={cn(
                                                            "group relative w-16 h-20 rounded-xl border-2 transition-all duration-200 overflow-hidden",
                                                            selectedColor === color
                                                                ? "border-[#009AD0] ring-2 ring-[#009AD0]/30 shadow-md transform scale-105"
                                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800 opacity-70 hover:opacity-100"
                                                        )}
                                                    >
                                                        <div className="absolute inset-x-0 top-0 bottom-6 bg-gray-100 dark:bg-gray-700">
                                                            {product.images[0] && (
                                                                <Image
                                                                    src={product.images[0]}
                                                                    alt={color}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="absolute inset-x-0 bottom-0 h-6 bg-white dark:bg-gray-800 flex items-center justify-center text-[10px] uppercase font-bold tracking-wider text-gray-900 dark:text-white">
                                                            {color.substring(0, 8)}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {sizes.length > 0 && (
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-gray-900 dark:text-white">Beden Seçenekleri</label>
                                            <div className="flex flex-wrap gap-2">
                                                {sizes.map((size) => (
                                                    <button
                                                        key={size}
                                                        type="button"
                                                        onClick={() => setSelectedSize(size)}
                                                        className={cn(
                                                            "min-w-[3rem] px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all duration-200",
                                                            selectedSize === size
                                                                ? "border-[#009AD0] bg-[#009AD0]/10 text-[#009AD0] ring-2 ring-[#009AD0]/20"
                                                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 hover:text-gray-900 bg-white dark:bg-gray-800"
                                                        )}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Stock Status & Actions */}
                            <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                                {product.stock > 0 ? (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">Adet:</span>
                                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1 border border-gray-200 dark:border-gray-700">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all"
                                                    onClick={() => adjustQuantity(-1)}
                                                    disabled={quantity <= product.minQuantity}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    value={inputValue}
                                                    onChange={handleInputChange}
                                                    onBlur={handleInputBlur}
                                                    onFocus={handleFocus}
                                                    className="w-12 text-center border-none bg-transparent h-8 text-lg font-bold p-0 focus-visible:ring-0"
                                                    min={product.minQuantity}
                                                    max={product.stock}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all"
                                                    onClick={() => adjustQuantity(1)}
                                                    disabled={quantity >= effectiveStock}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <Button
                                            size="lg"
                                            className="w-full h-14 text-lg font-bold bg-[#009AD0] hover:bg-[#007EA8] text-white shadow-lg shadow-blue-900/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            onClick={handleAddToCart}
                                        >
                                            <ShoppingCart className="h-6 w-6 mr-3" />
                                            Sepete Ekle
                                        </Button>

                                        {whatsappNumber && (
                                            <a
                                                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                                                    `Merhaba, ${product.name} ürününü sipariş etmek istiyorum.${product.sku ? ` Stok Kodu: ${product.sku}` : ''}`
                                                )}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block"
                                            >
                                                <Button
                                                    type="button"
                                                    size="lg"
                                                    variant="outline"
                                                    className="w-full h-12 font-semibold border-green-600/30 text-green-700 hover:bg-green-50 hover:border-green-600 rounded-xl transition-all"
                                                >
                                                    <svg className="h-5 w-5 mr-2.5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                    </svg>
                                                    WhatsApp ile Sor
                                                </Button>
                                            </a>
                                        )}

                                        <div className="flex items-center justify-center gap-6 pt-2">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Truck className="w-4 h-4 text-[#009AD0]" />
                                                <span>Hızlı Kargo</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Package className="w-4 h-4 text-[#009AD0]" />
                                                <span>Güvenli Paketleme</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <FileQuestion className="w-4 h-4 text-[#009AD0]" />
                                                <span>Orjinal Ürün</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center font-medium border border-red-100 dark:border-red-900/30">
                                        Bu ürün şu anda stoklarımızda bulunmamaktadır.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Description & Specs */}
            <div className="grid lg:grid-cols-12 gap-8 mb-24">
                <div className="lg:col-span-8 space-y-8">
                    {product.description && (
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="w-1.5 h-8 bg-[#009AD0] rounded-r-full"></span>
                                Ürün Açıklaması
                            </h2>
                            <div
                                className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-[#009AD0] prose-a:text-[#009AD0] prose-img:rounded-xl"
                                dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                        </div>
                    )}

                    {/* Installment Table Section */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="installments" className="border-none">
                                <AccordionTrigger className="hover:no-underline py-0">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                        <span className="w-1.5 h-8 bg-[#009AD0] rounded-r-full"></span>
                                        Taksit Seçenekleri
                                    </h2>
                                </AccordionTrigger>
                                <AccordionContent className="pt-6">
                                    <InstallmentTable price={displayFinalPrice} />
                                    <p className="mt-4 text-[10px] text-gray-400 italic">
                                        * Taksit oranları PayTR tarafından anlık olarak güncellenmektedir. Vade farkı ödeme adımında toplam tutara yansıtılacaktır.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Teknik Özellikler</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                                <span className="text-gray-500">Stok Kodu</span>
                                <span className="font-mono font-medium">{product.sku || "-"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                                <span className="text-gray-500">Barkod</span>
                                <span className="font-mono font-medium">{product.barcode || "-"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                                <span className="text-gray-500">Menşei</span>
                                <span className="font-medium">{product.origin || "-"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                                <span className="text-gray-500">Kategori</span>
                                <span className="font-medium">{product.category?.name || "-"}</span>
                            </div>
                            {product.brand && (
                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                                    <span className="text-gray-500">Marka</span>
                                    <span className="font-medium">{product.brand.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Benzer Ürünler
                        </h2>
                        <Link href={`/products?category=${product.category?.slug}`} className="text-[#009AD0] hover:underline font-medium">
                            Tümünü Gör
                        </Link>
                    </div>

                    <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
                        {relatedProducts.map((p) => (
                            <ProductCardV2
                                key={p.id}
                                product={p}
                                discountRate={discountRate}
                                isDealer={isDealer}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
