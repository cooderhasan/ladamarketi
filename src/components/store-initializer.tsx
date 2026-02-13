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
    console.log("STORE_INIT: Component executed", { discountRate, dbCartItems: dbCart?.length, isAuthenticated });
    const initialized = useRef(false);
    const setItems = useCartStore((state) => state.setItems);
    const setIsAuthenticated = useCartStore((state) => state.setIsAuthenticated);

    const hasHydrated = useCartStore((state) => state._hasHydrated);

    useEffect(() => {
        console.log("STORE_INIT: Effect triggered", { hasHydrated, isAuthenticated, initialized: initialized.current });
        // Update store with server-side flags
        useCartStore.setState({ discountRate, isAuthenticated });

        // IMPORTANT: Only process cart merging AFTER hydration is complete
        if (!hasHydrated) {
            console.log("STORE_INIT: Waiting for hydration...");
            return;
        }

        if (isAuthenticated && !initialized.current) {
            const localItems = useCartStore.getState().items;
            console.log("STORE_INIT: Initializing authenticated session. Local items:", localItems.length, "DB items:", dbCart?.length);

            if (dbCart) {
                if (localItems.length === 0) {
                    console.log("STORE_INIT: Local empty, setting items from DB:", dbCart.length);
                    setItems(dbCart);
                } else {
                    console.log("STORE_INIT: Merging local and DB items...");
                    const mergedItems = [...dbCart];

                    localItems.forEach(localItem => {
                        const localKey = localItem.variantId ? `${localItem.productId}-${localItem.variantId}` : localItem.productId;
                        const existingIndex = mergedItems.findIndex(dbItem => {
                            const dbKey = dbItem.variantId ? `${dbItem.productId}-${dbItem.variantId}` : dbItem.productId;
                            return dbKey === localKey;
                        });

                        if (existingIndex >= 0) {
                            mergedItems[existingIndex].quantity = Math.max(mergedItems[existingIndex].quantity, localItem.quantity);
                        } else {
                            mergedItems.push(localItem);
                        }
                    });

                    console.log("STORE_INIT: Merge result:", mergedItems.length, "Syncing to DB...");
                    setItems(mergedItems);
                    syncCart(mergedItems);
                }
            } else if (localItems.length > 0) {
                console.log("STORE_INIT: No DB cart, syncing local items to DB:", localItems.length);
                syncCart(localItems);
            }

            initialized.current = true;
        }
    }, [discountRate, dbCart, isAuthenticated, setItems, hasHydrated]);

    return null;
}
