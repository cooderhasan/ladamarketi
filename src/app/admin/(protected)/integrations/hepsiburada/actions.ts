
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getHepsiburadaConfig() {
    try {
        const config = await (prisma as any).hepsiburadaConfig.findFirst();
        return { success: true, data: config };
    } catch (error) {
        return { success: false, error: "Ayarlar alınamadı" };
    }
}

export async function saveHepsiburadaConfig(prevState: any, formData: FormData) {
    try {
        const username = formData.get("username") as string; // Usually Merchant ID
        const password = formData.get("password") as string;
        const merchantId = formData.get("merchantId") as string;
        const isActive = formData.get("isActive") === "on";

        if (!username || !password) {
            return { success: false, message: "Kullanıcı Adı ve Şifre zorunludur." };
        }

        const existing = await (prisma as any).hepsiburadaConfig.findFirst();

        if (existing) {
            await (prisma as any).hepsiburadaConfig.update({
                where: { id: existing.id },
                data: { username, password, merchantId, isActive }
            });
        } else {
            await (prisma as any).hepsiburadaConfig.create({
                data: { username, password, merchantId, isActive }
            });
        }

        revalidatePath("/admin/integrations/hepsiburada");
        return { success: true, message: "Ayarlar kaydedildi." };
    } catch (error) {
        console.error("HB Save Error:", error);
        return { success: false, message: "Kaydetme hatası." };
    }
}

export async function syncProductsToHepsiburada() {
    try {
        const config = await (prisma as any).hepsiburadaConfig.findFirst({ where: { isActive: true } });
        if (!config) return { success: false, message: "Aktif entegrasyon bulunamadı." };

        // Fetch products
        const products = await prisma.product.findMany({
            where: { isActive: true },
        });

        // Prepare data for HB
        const productData = products.map(p => ({
            merchantSku: p.sku,
            productName: p.name,
            price: Number((p as any).hepsiburadaPrice) || Number(p.listPrice), // Use HB price if available
            stock: p.stock,
            vatRate: p.vatRate
        }));

        console.log("Syncing to HB:", productData.length, "products");
        // In real impl: await hbClient.pushProducts(productData);

        // Simulating delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return { success: true, message: `${products.length} ürün Hepsiburada için hazırlandı ve gönderildi (Simülasyon).` };
    } catch (error: any) {
        console.error("HB Sync Error:", error);
        return { success: false, message: "Sync Hatası: " + error.message };
    }
}

export async function syncOrdersFromHepsiburada() {
    try {
        const config = await (prisma as any).hepsiburadaConfig.findFirst({ where: { isActive: true } });
        if (!config) return { success: false, message: "Aktif entegrasyon bulunamadı." };

        // Fetch HB Orders (Simulation)
        // In real impl: await hbClient.getListings();

        console.log("Fetching orders from Hepsiburada...");

        // Simulating delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For simulation, we return "No new orders"
        return { success: true, message: "Hepsiburada Sipariş kontrolü tamamlandı. Yeni sipariş bulunamadı (Simülasyon)." };

    } catch (error: any) {
        console.error("HB Order Sync Error:", error);
        return { success: false, message: "Order Sync Hatası: " + error.message };
    }
}
