"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CartItem as StoreCartItem } from "@/types";

export async function syncCart(items: StoreCartItem[]) {
    console.log("SYNC_CART: Received request, item count:", items.length);
    try {
        const session = await auth();
        if (!session?.user?.id) {
            console.log("SYNC_CART: No active session, skipping sync.");
            return { success: false, error: "Unauthorized" };
        }

        const userId = session.user.id;
        console.log("SYNC_CART: Syncing for user:", userId);

        // Ensure cart exists
        let cart = await prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
            });
        }

        // Transactions to clear and add new items
        await prisma.$transaction([
            prisma.cartItem.deleteMany({
                where: { cartId: cart.id },
            }),
            prisma.cartItem.createMany({
                data: items.map((item) => ({
                    cartId: cart!.id,
                    productId: item.productId,
                    variantId: item.variantId || null,
                    quantity: item.quantity,
                })),
            }),
        ]);

        console.log("SYNC_CART: Sync successful.");
        return { success: true };
    } catch (error) {
        console.error("SYNC_CART: Cart sync error:", error);
        return { success: false, error: "Sepet senkronize edilemedi." };
    }
}

export async function getDBCart() {
    console.log("GET_DB_CART: Fetching cart from DB...");
    try {
        const session = await auth();
        if (!session?.user?.id) {
            console.log("GET_DB_CART: No active session.");
            return null;
        }

        console.log("GET_DB_CART: Found session for user:", session.user.id);
        const cart = await prisma.cart.findUnique({
            where: { userId: session.user.id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                listPrice: true,
                                salePrice: true,
                                vatRate: true,
                                stock: true,
                                minQuantity: true,
                                images: true,
                                desi: true,
                            }
                        },
                        variant: {
                            select: {
                                id: true,
                                color: true,
                                size: true,
                                priceAdjustment: true,
                                stock: true,
                            }
                        }
                    }
                }
            }
        });

        if (!cart) return [];

        // Map DB items to StoreCartItem types
        const mappedItems: StoreCartItem[] = cart.items.map((item) => {
            const listPrice = Number(item.product.listPrice) + Number(item.variant?.priceAdjustment || 0);

            return {
                productId: item.productId,
                name: item.product.name,
                slug: item.product.slug,
                image: item.product.images[0] || "",
                quantity: item.quantity,
                listPrice: listPrice,
                salePrice: item.product.salePrice ? Number(item.product.salePrice) : undefined,
                discountRate: 0, // This will be handled by the client-side store based on user group
                vatRate: item.product.vatRate,
                minQuantity: item.product.minQuantity,
                stock: item.variant ? item.variant.stock : item.product.stock,
                variantId: item.variantId || undefined,
                variantInfo: item.variant ? `${item.variant.color || ""} ${item.variant.size || ""}`.trim() : undefined,
                desi: item.product.desi ? Number(item.product.desi) : null,
            };
        });

        console.log(`GET_DB_CART: Found ${mappedItems.length} items in DB.`);
        return mappedItems;
    } catch (error) {
        console.error("GET_DB_CART: Error:", error);
        return null;
    }
}

export async function clearDBCart() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false };

        const cart = await prisma.cart.findUnique({
            where: { userId: session.user.id },
        });

        if (cart) {
            await prisma.cartItem.deleteMany({
                where: { cartId: cart.id },
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Clear DB cart error:", error);
        return { success: false };
    }
}
