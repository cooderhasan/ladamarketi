"use server";

import { prisma } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

interface BulkUpdateCriteria {
    brandId?: string;
    // Seçilen kategoriler; alt kategorilerin ürünleri de dahil edilir
    categoryIds?: string[];
    // Bilerek "Tüm Kategoriler" seçildiyse true. Kategori seçilmeden işlem yapılmaz:
    // önceden kategori boş kalınca işlem sitedeki tüm ürünlere uygulanıyordu
    allCategories?: boolean;
    priceFilter?: "ALL" | "ZERO" | "NON_ZERO";
}

interface PriceUpdateParams {
    operation: "INCREASE" | "DECREASE";
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    value: number;
}

export interface PreviewResult {
    id: string;
    name: string;
    oldPrice: number;
    newPrice: number;
    // İndirimli fiyat da aynı oranda/tutarda güncellenir (önceden sadece liste fiyatı değişiyordu;
    // zamda müşterinin ödediği indirimli fiyat aynı kalıyor, sadece indirim yüzdesi büyüyordu)
    oldSalePrice: number | null;
    newSalePrice: number | null;
    sku: string | null;
}

// Önceden sadece giriş yapılmış mı diye bakılıyordu; /admin adres kontrolüne ek olarak işlemin kendisi de yetki ister
async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")) {
        throw new Error("Bu işlem için yetkiniz yok.");
    }
    return session;
}

// Seçilen kategoriler + tüm alt kategorileri (her seviye)
async function withDescendants(ids: string[]) {
    const all = await prisma.category.findMany({ select: { id: true, parentId: true } });
    const childrenOf = new Map<string, string[]>();
    for (const c of all) {
        if (!c.parentId) continue;
        childrenOf.set(c.parentId, [...(childrenOf.get(c.parentId) || []), c.id]);
    }
    const result = new Set<string>();
    const queue = [...ids];
    while (queue.length) {
        const id = queue.shift()!;
        if (result.has(id)) continue;
        result.add(id);
        queue.push(...(childrenOf.get(id) || []));
    }
    return [...result];
}

async function buildWhere(criteria: BulkUpdateCriteria, withPriceFilter: boolean): Promise<Prisma.ProductWhereInput> {
    const where: Prisma.ProductWhereInput = {};
    if (criteria.brandId && criteria.brandId !== "ALL") where.brandId = criteria.brandId;

    if (!criteria.allCategories) {
        if (!criteria.categoryIds || criteria.categoryIds.length === 0) {
            throw new Error("Kategori seçin veya 'Tüm Kategoriler'i açın.");
        }
        const ids = await withDescendants(criteria.categoryIds);
        // Ürünün kategorileri (çoklu) veya eski tekil kategori alanı
        where.OR = [
            { categories: { some: { id: { in: ids } } } },
            { categoryId: { in: ids } },
        ];
    }

    if (withPriceFilter) {
        if (criteria.priceFilter === "ZERO") where.listPrice = { equals: 0 };
        else if (criteria.priceFilter === "NON_ZERO") where.listPrice = { gt: 0 };
    }
    return where;
}

function applyPrice(price: number, params: PriceUpdateParams) {
    let next = price;
    if (params.type === "PERCENTAGE") {
        const amount = price * (params.value / 100);
        next = params.operation === "INCREASE" ? price + amount : price - amount;
    } else {
        next = params.operation === "INCREASE" ? price + params.value : price - params.value;
    }
    return Math.max(0, Number(next.toFixed(2)));
}

async function computePriceChanges(criteria: BulkUpdateCriteria, params: PriceUpdateParams): Promise<PreviewResult[]> {
    const where = await buildWhere(criteria, true);
    const products = await prisma.product.findMany({
        where,
        select: { id: true, name: true, listPrice: true, salePrice: true, sku: true },
        orderBy: { name: "asc" },
    });

    return products.map((p) => {
        const oldPrice = Number(p.listPrice);
        const oldSalePrice = p.salePrice != null && Number(p.salePrice) > 0 ? Number(p.salePrice) : null;
        const newSale = oldSalePrice != null ? applyPrice(oldSalePrice, params) : null;
        return {
            id: p.id,
            name: p.name,
            oldPrice,
            newPrice: applyPrice(oldPrice, params),
            oldSalePrice,
            // Sabit tutarlı indirimde sıfıra inen indirimli fiyat kaldırılır
            newSalePrice: newSale != null && newSale > 0 ? newSale : null,
            sku: p.sku,
        };
    });
}

export async function previewBulkUpdate(
    criteria: BulkUpdateCriteria,
    params: PriceUpdateParams
): Promise<PreviewResult[]> {
    await requireAdmin();
    return computePriceChanges(criteria, params);
}

/**
 * expectedCount: önizlemede gösterilen ürün sayısı. Arada ürün eklenip/silinmişse ya da form değiştiyse
 * işlem yapılmaz (önceden onay, önizlemedeki liste yerine formun o anki ayarlarıyla çalışıyordu).
 * Tüm güncellemeler tek işlemde (transaction): yarıda hata olursa hiçbir ürün değişmez.
 */
export async function executeBulkUpdate(
    criteria: BulkUpdateCriteria,
    params: PriceUpdateParams,
    expectedCount: number
) {
    const session = await requireAdmin();
    const changes = await computePriceChanges(criteria, params);
    if (changes.length !== expectedCount) {
        // Hata fırlatmak yerine sonuç: production'da sunucu hata mesajları istemciye gizleniyor
        return { success: false as const, error: "Ürün listesi önizlemeden sonra değişti. Lütfen önizlemeyi yeniden oluşturun." };
    }

    try {
        await prisma.$transaction(
            changes.map((item) =>
                prisma.product.update({
                    where: { id: item.id },
                    data: { listPrice: item.newPrice, salePrice: item.newSalePrice },
                })
            )
        );

        await prisma.adminLog.create({
            data: {
                action: "BULK_PRICE_UPDATE",
                details: `Updated ${changes.length} products. Criteria: ${JSON.stringify(criteria)}, Params: ${JSON.stringify(params)}`,
                entityId: "BULK",
                entityType: "PRODUCT",
                adminId: session.user.id,
            }
        });

        revalidatePath("/admin/products");
        revalidatePath("/");
        revalidateTag("home-data", "max");

        return { success: true as const, count: changes.length };
    } catch (error) {
        console.error("Bulk update error:", error);
        return { success: false as const, error: "Toplu güncelleme sırasında hata oluştu; hiçbir ürün değiştirilmedi." };
    }
}

interface StockUpdateParams {
    operation: "SET" | "INCREASE" | "DECREASE";
    value: number;
}

export interface StockPreviewResult {
    id: string;
    name: string;
    oldStock: number;
    newStock: number;
    sku: string | null;
}

async function computeStockChanges(criteria: BulkUpdateCriteria, params: StockUpdateParams): Promise<StockPreviewResult[]> {
    const where = await buildWhere(criteria, false);
    const products = await prisma.product.findMany({
        where,
        select: { id: true, name: true, stock: true, sku: true },
        orderBy: { name: "asc" },
    });

    return products.map((p) => {
        const oldStock = p.stock;
        let newStock = oldStock;
        if (params.operation === "SET") newStock = params.value;
        else if (params.operation === "INCREASE") newStock = oldStock + params.value;
        else if (params.operation === "DECREASE") newStock = oldStock - params.value;
        if (newStock < 0) newStock = 0;

        return { id: p.id, name: p.name, oldStock, newStock, sku: p.sku };
    });
}

export async function previewBulkStockUpdate(
    criteria: BulkUpdateCriteria,
    params: StockUpdateParams
): Promise<StockPreviewResult[]> {
    await requireAdmin();
    return computeStockChanges(criteria, params);
}

export async function executeBulkStockUpdate(
    criteria: BulkUpdateCriteria,
    params: StockUpdateParams,
    expectedCount: number
) {
    const session = await requireAdmin();
    const changes = await computeStockChanges(criteria, params);
    if (changes.length !== expectedCount) {
        // Hata fırlatmak yerine sonuç: production'da sunucu hata mesajları istemciye gizleniyor
        return { success: false as const, error: "Ürün listesi önizlemeden sonra değişti. Lütfen önizlemeyi yeniden oluşturun." };
    }

    try {
        await prisma.$transaction(
            changes.map((item) =>
                prisma.product.update({
                    where: { id: item.id },
                    data: { stock: item.newStock },
                })
            )
        );

        await prisma.adminLog.create({
            data: {
                action: "BULK_STOCK_UPDATE",
                details: `Updated ${changes.length} products. Criteria: ${JSON.stringify(criteria)}, Params: ${JSON.stringify(params)}`,
                entityId: "BULK",
                entityType: "PRODUCT",
                adminId: session.user.id,
            }
        });

        revalidatePath("/admin/products");
        revalidatePath("/");
        revalidateTag("home-data", "max");

        return { success: true as const, count: changes.length };
    } catch (error) {
        console.error("Bulk stock update error:", error);
        return { success: false as const, error: "Toplu stok güncelleme sırasında hata oluştu; hiçbir ürün değiştirilmedi." };
    }
}
