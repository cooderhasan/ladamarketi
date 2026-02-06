import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, CartSummary } from "@/types";
import { calculateCartSummary } from "@/lib/helpers";

interface CartState {
    items: CartItem[];
    discountRate: number;
    setDiscountRate: (rate: number) => void;
    addItem: (item: CartItem) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getSummary: () => CartSummary;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            discountRate: 0,

            setDiscountRate: (rate) => set({ discountRate: rate }),

            addItem: (item) => {
                // Validation: Prevent adding items with no price or no stock
                if (item.listPrice <= 0) {
                    console.warn("Cannot add item with price 0 to cart:", item.name);
                    return;
                }
                if (item.stock <= 0) {
                    console.warn("Cannot add out-of-stock item to cart:", item.name);
                    return;
                }

                const items = get().items;
                // Use productId + variantId for unique identification
                const itemKey = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
                const existingIndex = items.findIndex((i) => {
                    const existingKey = i.variantId ? `${i.productId}-${i.variantId}` : i.productId;
                    return existingKey === itemKey;
                });

                if (existingIndex >= 0) {
                    // Update quantity if item exists
                    const newItems = [...items];
                    const newQuantity = newItems[existingIndex].quantity + item.quantity;

                    // Check stock limit
                    if (newQuantity <= item.stock) {
                        newItems[existingIndex].quantity = newQuantity;
                        set({ items: newItems });
                    }
                } else {
                    // Add new item
                    set({ items: [...items, item] });
                }
            },

            removeItem: (productId) => {
                set({ items: get().items.filter((i) => i.productId !== productId) });
            },

            updateQuantity: (productId, quantity) => {
                const items = get().items;
                const itemIndex = items.findIndex((i) => i.productId === productId);

                if (itemIndex >= 0) {
                    const item = items[itemIndex];

                    // Check min quantity and stock
                    if (quantity >= item.minQuantity && quantity <= item.stock) {
                        const newItems = [...items];
                        newItems[itemIndex].quantity = quantity;
                        set({ items: newItems });
                    } else if (quantity < item.minQuantity) {
                        // Remove if below minimum
                        set({ items: items.filter((i) => i.productId !== productId) });
                    }
                }
            },

            clearCart: () => set({ items: [] }),

            getSummary: () => {
                const { items, discountRate } = get();
                return calculateCartSummary(items, discountRate);
            },
        }),
        {
            name: "b2b-cart",
        }
    )
);
