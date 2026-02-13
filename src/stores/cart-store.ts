import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, CartSummary } from "@/types";
import { calculateCartSummary } from "@/lib/helpers";
import { syncCart } from "@/app/(storefront)/cart/actions";

interface CartState {
    items: CartItem[];
    discountRate: number;
    isSyncing: boolean;
    isAuthenticated: boolean;
    setDiscountRate: (rate: number) => void;
    setIsAuthenticated: (val: boolean) => void;
    addItem: (item: CartItem) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getSummary: () => CartSummary;
    setItems: (items: CartItem[]) => void;
    logout: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            discountRate: 0,
            isSyncing: false,
            isAuthenticated: false,

            setDiscountRate: (rate) => set({ discountRate: rate }),

            setIsAuthenticated: (val) => set({ isAuthenticated: val }),

            setItems: (items) => set({ items }),

            addItem: async (item) => {
                if (item.listPrice <= 0) {
                    console.warn("Cannot add item with price 0 to cart:", item.name);
                    return;
                }
                if (item.stock <= 0) {
                    console.warn("Cannot add out-of-stock item to cart:", item.name);
                    return;
                }

                const items = get().items;
                const itemKey = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
                const existingIndex = items.findIndex((i) => {
                    const existingKey = i.variantId ? `${i.productId}-${i.variantId}` : i.productId;
                    return existingKey === itemKey;
                });

                let newItems = [...items];
                if (existingIndex >= 0) {
                    const newQuantity = newItems[existingIndex].quantity + item.quantity;
                    if (newQuantity <= item.stock) {
                        newItems[existingIndex].quantity = newQuantity;
                    }
                } else {
                    newItems.push(item);
                }

                set({ items: newItems });

                if (get().isAuthenticated) {
                    await syncCart(newItems);
                }
            },

            removeItem: async (productId) => {
                const newItems = get().items.filter((i) => i.productId !== productId);
                set({ items: newItems });

                if (get().isAuthenticated) {
                    await syncCart(newItems);
                }
            },

            updateQuantity: async (productId, quantity) => {
                const items = get().items;
                const itemIndex = items.findIndex((i) => i.productId === productId);

                if (itemIndex >= 0) {
                    const item = items[itemIndex];
                    let newItems = [...items];

                    if (quantity >= item.minQuantity && quantity <= item.stock) {
                        newItems[itemIndex].quantity = quantity;
                        set({ items: newItems });
                    } else if (quantity < item.minQuantity) {
                        newItems = items.filter((i) => i.productId !== productId);
                        set({ items: newItems });
                    }

                    if (get().isAuthenticated) {
                        await syncCart(newItems);
                    }
                }
            },

            clearCart: async () => {
                set({ items: [] });
                if (get().isAuthenticated) {
                    await syncCart([]);
                }
            },

            getSummary: () => {
                const { items, discountRate } = get();
                return calculateCartSummary(items, discountRate);
            },

            logout: () => {
                set({ items: [], isAuthenticated: false, discountRate: 0 });
            },
        }),
        {
            name: "b2b-cart",
        }
    )
);
