"use client";

import { useEffect } from "react";
import { markOrdersPrinted } from "@/app/admin/(protected)/orders/actions";

interface AutoPrintProps {
    orderIds?: string | string[];
}

export function AutoPrint({ orderIds }: AutoPrintProps) {
    useEffect(() => {
        if (orderIds) {
            const ids = typeof orderIds === "string" ? orderIds.split(",") : orderIds;
            const validIds = ids.filter(Boolean);
            if (validIds.length > 0) {
                markOrdersPrinted(validIds).catch((err) => {
                    console.error("AutoPrint mark error:", err);
                });
            }
        }

        // Small delay to ensure hydration and styles are ready
        const timer = setTimeout(() => {
            window.print();
        }, 500);

        return () => clearTimeout(timer);
    }, [orderIds]);

    return null;
}
