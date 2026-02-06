
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { N11Client } from "@/services/n11/api";

export async function getN11Config() {
    try {
        const config = await (prisma as any).n11Config.findFirst();
        return { success: true, data: config };
    } catch (error) {
        return { success: false, error: "Ayarlar alınamadı" };
    }
}

export async function saveN11Config(prevState: any, formData: FormData) {
    try {
        const apiKey = formData.get("apiKey") as string;
        const apiSecret = formData.get("apiSecret") as string;
        const isActive = formData.get("isActive") === "on";

        if (!apiKey || !apiSecret) {
            return { success: false, message: "API Anahtarı ve Şifresi zorunludur." };
        }

        const existing = await (prisma as any).n11Config.findFirst();

        if (existing) {
            await (prisma as any).n11Config.update({
                where: { id: existing.id },
                data: { apiKey, apiSecret, isActive }
            });
        } else {
            await (prisma as any).n11Config.create({
                data: { apiKey, apiSecret, isActive }
            });
        }

        revalidatePath("/admin/integrations/n11");
        return { success: true, message: "Ayarlar kaydedildi." };
    } catch (error) {
        console.error("N11 Save Error:", error);
        return { success: false, message: "Kaydetme hatası." };
    }
}

export async function syncProductsToN11() {
    try {
        const config = await (prisma as any).n11Config.findFirst({ where: { isActive: true } });
        if (!config) return { success: false, message: "Aktif entegrasyon bulunamadı." };

        // Fetch products with N11 mapping info
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: {
                category: true,
                brand: true,
                variants: true
            }
        });

        // Simulating N11 API call with real product data
        const productData = products.map(p => ({
            productSellerCode: p.sku,
            title: p.name,
            subtitle: p.name,
            description: p.description,
            price: Number((p as any).n11Price) || Number(p.listPrice), // Use N11 price if available
            currencyType: "TL",
            images: p.images,
            stockItems: {
                stockItem: {
                    quantity: p.stock
                }
            }
        }));

        console.log("Syncing to N11:", productData.length, "products");
        // In real impl: await n11Client.saveProduct(productData);

        // Simulating delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return { success: true, message: `${products.length} ürün N11 için hazırlandı ve gönderildi (Simülasyon).` };
    } catch (error: any) {
        console.error("N11 Sync Error:", error);
        return { success: false, message: "Sync Hatası: " + error.message };
    }
}

export async function syncOrdersFromN11() {
    try {
        const config = await (prisma as any).n11Config.findFirst({ where: { isActive: true } });
        if (!config) return { success: false, message: "Aktif entegrasyon bulunamadı." };

        // Fetch N11 Orders (Simulation)
        // In real impl: await n11Client.getOrders("New");

        console.log("Fetching orders from N11...");

        // Simulating delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For simulation, we return "No new orders" to avoid creating dummy data in production DB
        return { success: true, message: "N11 Sipariş kontrolü tamamlandı. Yeni sipariş bulunamadı (Simülasyon)." };

    } catch (error: any) {
        console.error("N11 Order Sync Error:", error);
        return { success: false, message: "Order Sync Hatası: " + error.message };
    }
}
