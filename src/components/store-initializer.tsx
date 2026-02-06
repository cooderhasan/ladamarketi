"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart-store";

interface StoreInitializerProps {
    discountRate: number;
}

export function StoreInitializer({ discountRate }: StoreInitializerProps) {
    const initialized = useRef(false);
    const setDiscountRate = useCartStore((state) => state.setDiscountRate);

    // Use a layout effect or immediate effect to ensure it runs as early as possible?
    // Standard useEffect is fine.
    useEffect(() => {
        // Always update the store with the latest server-side rate
        useCartStore.setState({ discountRate });
    }, [discountRate]);

    return null;
}
