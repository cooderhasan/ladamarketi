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
import { ShoppingCart, Minus, Plus, Package, Truck, ArrowLeft, ChevronLeft, ChevronRight, FileQuestion } from "lucide-react";

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

    // Sale Price Logic
    // If variant has price adjustment, we need to apply it to sale price too? 
    // Usually Sale Price is "per product", variants might add to it.
    // Let's assume salePrice is base price.
    const baseSalePrice = product.salePrice;
    const hasSalePrice = baseSalePrice != null && baseSalePrice < product.listPrice;

    // Calculate effective sale price with variant adjustment
    const effectiveSalePrice = hasSalePrice ? (baseSalePrice! + priceAdjustment) : null;

    // Calculate discount percentage for badge
    const saleDiscountRate = hasSalePrice && baseSalePrice != null
        ? Math.round(((product.listPrice - baseSalePrice) / product.listPrice) * 100)
        : 0;

    // Determine display values
    const displayFinalPrice = hasSalePrice ? effectiveSalePrice! : (isDealer ? price.finalPrice : (product.listPrice + priceAdjustment));
    const showStrikethrough = hasSalePrice || (isDealer && discountRate > 0);
    const strikethroughPrice = product.listPrice + priceAdjustment;

    const vatAmount = hasSalePrice
        ? (displayFinalPrice - (displayFinalPrice / (1 + product.vatRate / 100)))
        : price.vatAmount;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        // Update quantity for live price calculation (allow any positive number during typing)
        // Validation/Clamping happens on blur or add-to-cart
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= 0) {
            setQuantity(numValue);
        }
    };

    const handleInputBlur = () => {
        let numValue = Number(inputValue);

        if (isNaN(numValue)) {
            numValue = product.minQuantity;
        }

        // Clamp value
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

        // Build variant info string
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
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link href="/" className="hover:text-blue-600">
                    Ana Sayfa
                </Link>
                <span>/</span>
                <Link href="/products" className="hover:text-blue-600">
                    Ürünler
                </Link>
                {product.category && (
                    <>
                        <span>/</span>
                        <Link
                            href={`/products?category=${product.category.slug}`}
                            className="hover:text-blue-600"
                        >
                            {product.category.name}
                        </Link>
                    </>
                )}
                <span>/</span>
                <span className="text-gray-900 dark:text-white">{product.name}</span>
            </div>

            {/* Product Info */}
            <div className="grid gap-8 lg:grid-cols-2 mb-16">
                {/* Images */}
                <div className="space-y-4">
                    <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                        {product.images[0] ? (
                            <Image
                                src={product.images[activeImageIndex] || product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <Package className="w-24 h-24 text-gray-300" />
                            </div>
                        )}
                        {product.stock === 0 && (
                            <Badge variant="destructive" className="absolute top-4 left-4 z-10">
                                Stokta Yok
                            </Badge>
                        )}

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
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-black/50 text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setActiveImageIndex((prev) =>
                                            prev === product.images.length - 1 ? 0 : prev + 1
                                        );
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-black/50 text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {product.images.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                            {product.images.map((image, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setActiveImageIndex(index)}
                                    className={cn(
                                        "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                                        activeImageIndex === index
                                            ? "border-blue-600 ring-2 ring-blue-600/20"
                                            : "border-transparent hover:border-gray-300"
                                    )}
                                >
                                    <Image
                                        src={image}
                                        alt={`${product.name} - ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="space-y-6 lg:sticky lg:top-24 h-fit">
                    {product.category && (
                        <Badge variant="secondary">{product.category.name}</Badge>
                    )}

                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {product.name}
                    </h1>

                    {/* Variant Selection */}
                    {hasVariants && (
                        <div className="space-y-4 border p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                            {colors.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Renk:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {colors.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setSelectedColor(color)}
                                                className={cn(
                                                    "relative flex flex-col items-center justify-between overflow-hidden rounded-md border-2 p-1 transition-all hover:border-black dark:hover:border-white focus:outline-hidden w-24 h-28",
                                                    selectedColor === color
                                                        ? "border-black dark:border-white opacity-100"
                                                        : "border-transparent bg-white dark:bg-gray-700 opacity-80"
                                                )}
                                            >
                                                <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-600 rounded-sm overflow-hidden mb-2">
                                                    {product.images[0] ? (
                                                        <Image
                                                            src={product.images[0]}
                                                            alt={color}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full">
                                                            <div className="w-full h-full bg-gray-200 dark:bg-gray-800" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium leading-none text-center block w-full truncate px-1">
                                                    {color}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {sizes.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Beden:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {sizes.map((size) => (
                                            <Button
                                                key={size}
                                                type="button"
                                                variant={selectedSize === size ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSelectedSize(size)}
                                            >
                                                {size}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {currentVariant ? (
                                currentVariant.stock > 0 ? (
                                    <p className="text-sm text-green-600">
                                        Seçili varyant stokta: {currentVariant.stock} adet
                                    </p>
                                ) : (
                                    <p className="text-sm text-red-600 font-medium">
                                        Bu seçenek tükendi (Stokta yok)
                                    </p>
                                )
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Bu kombinasyon mevcut değil
                                </p>
                            )}
                        </div>
                    )}

                    {/* Pricing */}
                    <div className="space-y-2">
                        {/* Discount Badge */}
                        {(isDealer && discountRate > 0 || hasSalePrice) && (
                            <div className="mb-2">
                                <Badge className="bg-[#E31E24] hover:bg-[#c4191f] text-white">
                                    %{Math.max(discountRate, saleDiscountRate)} İndirim
                                </Badge>
                            </div>
                        )}

                        <div className="flex flex-col">
                            {showStrikethrough && (
                                <span className="text-xl text-gray-400 line-through">
                                    {formatPrice(strikethroughPrice)}
                                </span>
                            )}
                            <div className="text-4xl font-bold text-[#009AD0] dark:text-white">
                                {formatPrice(displayFinalPrice)}
                            </div>
                            <p className="text-sm text-gray-500">
                                KDV Dahil (%{product.vatRate} KDV: {formatPrice(vatAmount)})
                            </p>
                        </div>
                    </div>

                    {/* Product Details (SKU, Barcode, Origin) */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3 text-sm border border-gray-200 dark:border-gray-800">
                        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Stok Kodu</span>
                            <span className="font-medium text-gray-900 dark:text-white font-mono">
                                {currentVariant?.sku || product.sku || "-"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
                            <span className="text-gray-500 dark:text-gray-400">Barkod</span>
                            <span className="font-medium text-gray-900 dark:text-white font-mono">
                                {currentVariant?.barcode || product.barcode || "-"}
                            </span>
                        </div>
                        {product.origin ? (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">Menşei</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {product.origin}
                                </span>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">Menşei</span>
                                <span className="font-medium text-gray-900 dark:text-white">-</span>
                            </div>
                        )}
                    </div>

                    {/* Add to Cart */}
                    {product.stock > 0 && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">Adet:</span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
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
                                        className="w-20 text-center"
                                        min={product.minQuantity}
                                        max={product.stock}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => adjustQuantity(1)}
                                        disabled={quantity >= effectiveStock}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-lg font-bold">
                                    Toplam: {formatPrice(displayFinalPrice * quantity)}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                                    <ShoppingCart className="h-5 w-5 mr-2" />
                                    Sepete Ekle
                                </Button>

                                {whatsappNumber && (
                                    <a
                                        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                                            `Merhaba, ${product.name} ürününü sipariş etmek istiyorum.${product.sku ? ` Stok Kodu: ${product.sku}` : ''}`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1"
                                    >
                                        <Button
                                            type="button"
                                            size="lg"
                                            variant="outline"
                                            className="w-full border-green-600 text-green-600 hover:bg-green-50"
                                        >
                                            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            WhatsApp ile Sipariş
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Description (Full Width) */}
            {product.description && (
                <div className="mb-16 border-t pt-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Ürün Açıklaması
                    </h2>
                    <div
                        className="text-gray-600 dark:text-gray-300 prose dark:prose-invert max-w-none [&>p]:mb-4 last:[&>p]:mb-0"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                </div>
            )}

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="border-t pt-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                        Benzer Ürünler
                    </h2>
                    <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
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
