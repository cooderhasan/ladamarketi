"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShoppingCart, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/helpers";

export function AddedToCartModal() {
    const {
        isAddedToCartModalOpen,
        closeAddedToCartModal,
        lastAddedItem,
        isAuthenticated
    } = useCartStore();

    if (!lastAddedItem) return null;

    return (
        <Dialog open={isAddedToCartModalOpen} onOpenChange={(open) => !open && closeAddedToCartModal()}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl rounded-3xl p-0 overflow-hidden gap-0">
                {/* Header with improved visual */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 flex items-center gap-3 border-b border-green-100 dark:border-green-800/30">
                    <div className="bg-green-100 dark:bg-green-800 rounded-full p-1">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-bold text-green-700 dark:text-green-400">Ürün Sepetinize Eklendi</span>
                </div>

                <div className="p-6">
                    <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="relative w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shrink-0">
                            {lastAddedItem.image ? (
                                <Image
                                    src={lastAddedItem.image}
                                    alt={lastAddedItem.name}
                                    fill
                                    className="object-contain p-2"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-300">
                                    <ShoppingCart className="h-8 w-8" />
                                </div>
                            )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 text-sm">
                                {lastAddedItem.name}
                            </h3>
                            {lastAddedItem.variantInfo && (
                                <p className="text-xs text-gray-500">
                                    Seçenek: {lastAddedItem.variantInfo}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500">Adet: <strong className="text-gray-900 dark:text-gray-300">{lastAddedItem.quantity}</strong></span>
                            </div>
                            <div className="mt-1 font-bold text-blue-600 dark:text-blue-400">
                                {formatPrice(lastAddedItem.salePrice || lastAddedItem.listPrice)}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={closeAddedToCartModal}
                            className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            Alışverişe Devam Et
                        </Button>

                        <Link href={isAuthenticated ? "/checkout" : "/checkout/auth"} onClick={closeAddedToCartModal}>
                            <Button className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20">
                                Sepete Git
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
