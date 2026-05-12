import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
    try {
        // Güvenlik kontrolü
        const session = await auth();
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const products = await prisma.product.findMany({
            include: { categories: true },
        });

        let updatedCount = 0;

        for (const p of products) {
            if (p.categories.length > 0) {
                const firstCatId = p.categories[0].id;
                if (p.categoryId !== firstCatId) {
                    await prisma.product.update({
                        where: { id: p.id },
                        data: { categoryId: firstCatId },
                    });
                    updatedCount++;
                }
            } else if (p.categoryId !== null) {
                await prisma.product.update({
                    where: { id: p.id },
                    data: { category: { disconnect: true } },
                });
                updatedCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Kategori onarımı tamamlandı. Toplam ${updatedCount} ürün güncellendi.` 
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
