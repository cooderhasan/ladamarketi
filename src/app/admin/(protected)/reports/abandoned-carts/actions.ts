"use server";

import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendAbandonedCartEmail } from "@/lib/email";
import { calculatePrice } from "@/lib/helpers";
import { getSiteSettings } from "@/lib/settings";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";
import { cartReminderOneClickUrl, cartReminderUnsubscribeUrl, getCartReminderOptOuts } from "@/lib/cart-reminder";

const ABANDONED_AFTER_MS = 2 * 60 * 60 * 1000;

const cartInclude = {
    user: {
        select: {
            id: true,
            email: true,
            name: true,
            companyName: true,
            phone: true,
            discountGroup: { select: { discountRate: true } },
            // Sepetten sonra sipariş verdiyse sepet terk edilmiş sayılmaz (ödemesi tamamlanmamış/iptal hariç)
            orders: {
                where: { status: { notIn: ["WAITING_FOR_PAYMENT", "CANCELLED"] } },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { createdAt: true },
            },
        },
    },
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
                    isActive: true,
                    images: true,
                    isBundle: true,
                    bundleItems: { select: { quantity: true, childProduct: { select: { stock: true } } } },
                },
            },
            variant: { select: { color: true, size: true, priceAdjustment: true, stock: true } },
        },
    },
} satisfies Prisma.CartInclude;

/**
 * Müşterinin son 30 günde satın aldığı ürünler (üye ya da aynı e-postayla misafir sipariş).
 * Kartla ödeyip başarı sayfasına dönmeyenin sepeti boşalmaz; ona "sepetinizde ürün kaldı" denmesin diye sepetten düşülür.
 */
async function getRecentlyPurchasedKeys(userId: string, email?: string | null): Promise<Set<string>> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orders = await prisma.order.findMany({
        where: {
            createdAt: { gte: since },
            status: { notIn: ["WAITING_FOR_PAYMENT", "CANCELLED"] },
            OR: [{ userId }, ...(email ? [{ guestEmail: { equals: email, mode: "insensitive" as const } }] : [])],
        },
        select: { items: { select: { productId: true, variantId: true } } },
    });
    const keys = new Set<string>();
    for (const order of orders) {
        for (const item of order.items) {
            keys.add(`${item.productId}|${item.variantId || ""}`);
            keys.add(`${item.productId}|*`);
        }
    }
    return keys;
}

const isPurchased = (keys: Set<string>, item: { productId: string; variantId?: string | null }) =>
    keys.has(`${item.productId}|${item.variantId || ""}`) || (!item.variantId && keys.has(`${item.productId}|*`));

type RawCart = NonNullable<Awaited<ReturnType<typeof findCart>>>;

function findCart(cartId: string) {
    return prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude });
}

/**
 * Sepetteki ürünleri sepet sayfasındaki gibi fiyatlar: varyant fiyat farkı, müşteri iskontosu ve indirimli fiyat dahil.
 * Satın alınmış ürünler düşülür; stokta olmayan veya yayından kaldırılan ürünler işaretlenir.
 */
async function prepareCart(cart: RawCart) {
    const user = cart.user;
    const purchased = await getRecentlyPurchasedKeys(cart.userId, user.email);
    const discountRate = Number(user.discountGroup?.discountRate || 0);

    const items = cart.items
        .filter((item) => !isPurchased(purchased, item))
        .map((item) => {
            const { product, variant } = item;
            const listPrice = Number(product.listPrice) + Number(variant?.priceAdjustment || 0);
            const salePrice = product.salePrice ? Number(product.salePrice) : undefined;
            const unitPrice = calculatePrice(listPrice, salePrice, discountRate, product.vatRate).finalPrice;

            let stock = variant ? variant.stock : product.stock;
            if (product.isBundle && product.bundleItems.length > 0) {
                stock = Math.max(0, Math.min(...product.bundleItems.map((bi) => Math.floor(bi.childProduct.stock / bi.quantity))));
            }

            return {
                id: item.id,
                productName: product.name,
                variantInfo: variant ? `${variant.color || ""} ${variant.size || ""}`.trim() || undefined : undefined,
                image: product.images[0] || "",
                productUrl: `${SITE_URL}/products/${product.slug}`,
                quantity: item.quantity,
                unitPrice,
                lineTotal: unitPrice * item.quantity,
                available: product.isActive && stock > 0,
                // Sepet senkronu her değişiklikte ürünleri yeniden yazar; en yeni satır son sepet işlemidir
                touchedAt: Math.max(item.createdAt.getTime(), item.updatedAt.getTime()),
            };
        });

    const availableItems = items.filter((item) => item.available);

    return {
        items,
        availableItems,
        totalAmount: availableItems.reduce((sum, item) => sum + item.lineTotal, 0),
        lastActivity: items.length > 0 ? new Date(Math.max(...items.map((item) => item.touchedAt))) : null,
        lastOrderAt: user.orders[0]?.createdAt ?? null,
    };
}

async function requireStaff() {
    const session = await auth();
    return !!session?.user && (session.user.role === "ADMIN" || session.user.role === "OPERATOR");
}

export async function getAbandonedCartsAction() {
    try {
        if (!(await requireStaff())) {
            return { success: false, error: "Yetkisiz erişim." };
        }

        const abandonedBefore = new Date(Date.now() - ABANDONED_AFTER_MS);
        const [rawCarts, optOuts] = await Promise.all([
            prisma.cart.findMany({ where: { items: { some: {} } }, include: cartInclude }),
            getCartReminderOptOuts(),
        ]);

        const carts = [];
        for (const cart of rawCarts) {
            const prepared = await prepareCart(cart);
            // Satın alınanlar düşülünce boş kalan, 2 saatten yeni olan ya da son sepet işleminden sonra sipariş veren listelenmez
            if (!prepared.lastActivity || prepared.lastActivity > abandonedBefore) continue;
            if (prepared.lastOrderAt && prepared.lastOrderAt >= prepared.lastActivity) continue;

            carts.push({
                id: cart.id,
                updatedAt: prepared.lastActivity.toISOString(),
                reminderSentAt: cart.reminderSentAt?.toISOString() ?? null,
                reminderCount: cart.reminderCount,
                unsubscribed: optOuts.has(cart.userId),
                user: {
                    email: cart.user.email,
                    name: cart.user.name,
                    companyName: cart.user.companyName,
                    phone: cart.user.phone,
                },
                items: prepared.items.map(({ touchedAt, productUrl, ...item }) => item),
                totalAmount: prepared.totalAmount,
            });
        }

        carts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        return { success: true, carts };
    } catch (error) {
        console.error("Sepetleri getirirken hata oluştu:", error);
        return { success: false, error: "Veriler yüklenemedi." };
    }
}

export async function sendCartReminderAction(cartId: string) {
    try {
        if (!(await requireStaff())) {
            return { success: false, error: "Yetkisiz erişim." };
        }

        const cart = await findCart(cartId);
        if (!cart || !cart.user?.email || cart.items.length === 0) {
            return { success: false, error: "Geçerli bir sepet bulunamadı veya e-posta adresi eksik." };
        }

        const optOuts = await getCartReminderOptOuts();
        if (optOuts.has(cart.userId)) {
            return { success: false, error: "Müşteri sepet hatırlatma e-postalarından çıkmış." };
        }

        // Son 24 saat içinde zaten hatırlatma gönderildi mi kontrol et
        if (cart.reminderSentAt && cart.reminderSentAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            return { success: false, error: "Bu müşteriye son 24 saat içinde zaten hatırlatma gönderildi." };
        }

        const prepared = await prepareCart(cart);
        if (prepared.items.length === 0) {
            return { success: false, error: "Müşteri sepetindeki ürünleri zaten satın almış." };
        }
        if (prepared.availableItems.length === 0) {
            return { success: false, error: "Sepetteki ürünlerin hiçbiri şu an satışta değil." };
        }

        const settings = await getSiteSettings();
        const result = await sendAbandonedCartEmail({
            to: cart.user.email,
            customerName: cart.user.name?.trim() || undefined,
            items: prepared.availableItems.map((item) => ({
                productName: item.productName,
                variantInfo: item.variantInfo,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.lineTotal,
                imageUrl: item.image ? absoluteUrl(item.image) : undefined,
                productUrl: item.productUrl,
            })),
            totalAmount: prepared.totalAmount,
            // Giriş yapılmamış cihazda sepet boş görünür; önce giriş, sonra sepet (girişliyse doğrudan sepete gider)
            cartUrl: `${SITE_URL}/login?callbackUrl=${encodeURIComponent("/cart")}`,
            contactPhone: settings.phone,
            contactEmail: settings.email,
            unsubscribeUrl: cartReminderUnsubscribeUrl(cart.userId),
            oneClickUnsubscribeUrl: cartReminderOneClickUrl(cart.userId),
        });

        if (!result.success) {
            return { success: false, error: "E-postayı gönderirken bir hata oluştu." };
        }

        await prisma.cart.update({
            where: { id: cartId },
            data: {
                reminderSentAt: new Date(),
                reminderCount: { increment: 1 },
            },
        });

        return { success: true, message: "Hatırlatma maili başarıyla gönderildi." };
    } catch (error) {
        console.error("Hatırlatma e-postası hatası:", error);
        return { success: false, error: "Beklenmeyen bir hata oluştu." };
    }
}
