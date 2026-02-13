"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart-store";
import { CartItem } from "@/types";
import { syncCart } from "@/app/(storefront)/cart/actions";

interface StoreInitializerProps {
    discountRate: number;
    dbCart?: CartItem[] | null;
    isAuthenticated?: boolean;
}

export function StoreInitializer({ discountRate, dbCart, isAuthenticated }: StoreInitializerProps) {
    const initialized = useRef(false);
    const setItems = useCartStore((state) => state.setItems);
    const setIsAuthenticated = useCartStore((state) => state.setIsAuthenticated);

    useEffect(() => {
        // Update store with server-side flags
        useCartStore.setState({ discountRate, isAuthenticated });

        // Handle Cart Merging for Authenticated Users
        if (isAuthenticated && !initialized.current) {
            const localItems = useCartStore.getState().items;

            if (dbCart) {
                if (localItems.length === 0) {
                    // 1. Local empty, use DB cart
                    setItems(dbCart);
                } else {
                    // 2. Local not empty, merge with DB
                    const mergedItems = [...dbCart];

                    localItems.forEach(localItem => {
                        const localKey = localItem.variantId ? `${localItem.productId}-${localItem.variantId}` : localItem.productId;
                        const existingIndex = mergedItems.findIndex(dbItem => {
                            const dbKey = dbItem.variantId ? `${dbItem.productId}-${dbItem.variantId}` : dbItem.productId;
                            return dbKey === localKey;
                        });

                        if (existingIndex >= 0) {
                            // Already in DB, maybe update quantity? 
                            // For now, let's keep the larger quantity
                            mergedItems[existingIndex].quantity = Math.max(mergedItems[existingIndex].quantity, localItem.quantity);
                        } else {
                            // New item from local, add to merge
                            mergedItems.push(localItem);
                        }
                    });

                    setItems(mergedItems);
                    // Sync back to DB
                    syncCart(mergedItems);
                }
            } else if (localItems.length > 0) {
                // 3. Authenticated but no DB cart yet, sync local to DB
                syncCart(localItems);
            }

            initialized.current = true;
        }
    }, [discountRate, dbCart, isAuthenticated, setItems]);

    return null;
}
