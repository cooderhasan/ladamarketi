import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Bekleyen teklif talepleri
        const pendingQuotes = await prisma.quote.count({
            where: { status: "PENDING" }
        });

        // Bekleyen bayi onayları
        const pendingDealers = await prisma.user.count({
            where: {
                role: "CUSTOMER",
                status: "PENDING"
            }
        });

        // Kritik stok uyarıları (Raw SQL kullanıyoruz çünkü Prisma'da column karşılaştırması yok)
        const lowStockProducts: { count: bigint }[] = await prisma.$queryRaw`
            SELECT COUNT(*)::bigint as count FROM products 
            WHERE stock <= "criticalStock" AND "isActive" = true
        `;
        const lowStock = Number(lowStockProducts[0]?.count || 0);

        // Bugünkü yeni siparişler
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newOrders = await prisma.order.count({
            where: {
                createdAt: { gte: today },
                status: "PENDING"
            }
        });

        const notifications = [];

        if (pendingQuotes > 0) {
            notifications.push({
                id: "quotes",
                title: "Yeni Teklif Talebi",
                description: `${pendingQuotes} adet bekleyen teklif var`,
                link: "/admin/quotes",
                type: "quote",
                count: pendingQuotes
            });
        }

        if (pendingDealers > 0) {
            notifications.push({
                id: "dealers",
                title: "Bayi Onay Bekliyor",
                description: `${pendingDealers} üye onay bekliyor`,
                link: "/admin/customers?status=PENDING",
                type: "user",
                count: pendingDealers
            });
        }

        if (lowStock > 0) {
            notifications.push({
                id: "stock",
                title: "Düşük Stok Uyarısı",
                description: `${lowStock} üründe stok kritik`,
                link: "/admin/stock-alerts",
                type: "stock",
                count: lowStock
            });
        }

        if (newOrders > 0) {
            notifications.push({
                id: "orders",
                title: "Yeni Sipariş",
                description: `${newOrders} yeni sipariş var`,
                link: "/admin/orders?status=PENDING",
                type: "order",
                count: newOrders
            });
        }

        const totalCount = pendingQuotes + pendingDealers + lowStock + newOrders;

        return NextResponse.json({
            notifications,
            totalCount
        });
    } catch (error) {
        console.error("Notifications error:", error);
        return NextResponse.json({ error: "Bildirimler alınamadı" }, { status: 500 });
    }
}
