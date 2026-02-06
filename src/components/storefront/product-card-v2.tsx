"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice, calculatePrice } from "@/lib/helpers";
import { ShoppingCart, Heart, RefreshCw, Minus, Plus, Star, Eye } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    slug: string;
    images: string[];
    listPrice: number;
    vatRate: number;
    minQuantity: number;
    stock: number;
    category: {
        name: string;
        slug: string;
    } | null;
    brand?: {
        name: string;
        slug: string;
    } | null;
    _count?: {
        variants: number;
    };
}

interface ProductCardProps {
    product: Product;
    discountRate: number;
    isDealer: boolean;
    badge?: string;
}

export function ProductCardV2({
    product,
    discountRate,
    isDealer,
    badge,
}: ProductCardProps) {
    const { addItem } = useCartStore();
    const [quantity, setQuantity] = useState(product.minQuantity || 1);

    const price = calculatePrice(
        product.listPrice,
        discountRate,
        product.vatRate
    );

    const hasVariants = product._count?.variants && product._count.variants > 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (hasVariants) {
            return; // Link handles variant navigation
        }

        addItem({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            image: product.images[0],
            quantity: quantity,
            listPrice: product.listPrice,
            vatRate: product.vatRate,
            stock: product.stock,
            minQuantity: product.minQuantity,
            discountRate: discountRate,
        });

        toast.success("Ürün sepete eklendi");
    };

    const handleQuantityChange = (e: React.MouseEvent, delta: number) => {
        e.preventDefault();
        e.stopPropagation();
        const newQty = Math.max(product.minQuantity || 1, quantity + delta);
        if (newQty <= product.stock) {
            setQuantity(newQty);
        } else {
            toast.error("Stok miktarını aştınız");
        }
    };

    return (
        <Link href={`/products/${product.slug}`} className="group block h-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col relative group/card">

                {/* Image Section */}
                <div className="relative aspect-[4/5] bg-white overflow-hidden p-4">
                    {/* Overlay Icons */}


                    {product.images[0] ? (
                        <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <span className="text-4xl">📦</span>
                        </div>
                    )}

                    {/* Left Top Badges (Stock/New) */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {badge && (
                            <Badge className="bg-blue-600">{badge}</Badge>
                        )}
                        {product.stock === 0 && (
                            <Badge variant="destructive">Stokta Yok</Badge>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col">
                    {/* Brand */}
                    {product.brand && (
                        <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                            {product.brand.name}
                        </p>
                    )}

                    {/* Product Name */}
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 text-sm line-clamp-2 mb-2 h-10">
                        {product.name}
                    </h3>

                    {/* Rating placehoder */}
                    <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className="w-3 h-3 text-gray-300 fill-gray-300" />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">0 Yorum</span>
                    </div>

                    {/* Price Section */}
                    <div className="mt-auto space-y-1">
                        {isDealer ? (
                            <div className="flex flex-col items-start gap-1">
                                {discountRate > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-sm px-1.5 py-0.5 h-auto text-[10px] font-bold">
                                            %{discountRate} İndirim
                                        </Badge>
                                        <p className="text-sm text-gray-400 line-through">
                                            {formatPrice(price.listPrice)}
                                        </p>
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <p className="text-xl font-bold text-red-600">
                                        {formatPrice(price.finalPrice)}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-bold tracking-wide">
                                        KDV DAHİL
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {formatPrice(product.listPrice)}
                                </p>
                                <p className="text-[10px] text-gray-500 font-bold tracking-wide">
                                    KDV DAHİL
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Min Quantity Info */}
                    {product.minQuantity > 1 && (
                        <p className="text-xs text-amber-600 mt-2 font-medium">
                            Min. sipariş: {product.minQuantity} adet
                        </p>
                    )}

                    {/* Action Section (Quantity & Button) */}
                    <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        {product.stock > 0 && !hasVariants ? (
                            <>
                                <div className="flex items-center justify-center border border-gray-200 dark:border-gray-600 rounded-md h-10 w-full xl:w-24 shrink-0">
                                    <button
                                        onClick={(e) => handleQuantityChange(e, -1)}
                                        className="w-10 xl:w-8 h-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <div className="flex-1 h-full flex items-center justify-center font-semibold text-sm">
                                        {quantity}
                                    </div>
                                    <button
                                        onClick={(e) => handleQuantityChange(e, 1)}
                                        className="w-10 xl:w-8 h-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                <Button
                                    onClick={handleAddToCart}
                                    className="w-full xl:flex-1 h-10 bg-[#E31E24] hover:bg-[#c4151a] text-white font-medium text-sm"
                                >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Sepete Ekle
                                </Button>
                            </>
                        ) : hasVariants ? (
                            <Button
                                variant="outline"
                                className="w-full h-10 border-blue-500 text-blue-600 hover:bg-blue-50"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Seçenekleri Gör
                            </Button>
                        ) : (
                            <Button
                                variant="secondary"
                                className="w-full h-10"
                                disabled
                            >
                                Stokta Yok
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

