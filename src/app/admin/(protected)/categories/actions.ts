"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function getCategories() {
    return prisma.category.findMany({
        orderBy: { order: "asc" },
        include: {
            _count: {
                select: { products: true },
            },
        },
    });
}

export async function createCategory(data: { name: string; slug: string; order?: number; parentId?: string | null; imageUrl?: string; isFeatured?: boolean; trendyolCategoryId?: number | null; n11CategoryId?: number | null; hbCategoryId?: string | null }) {
    await prisma.category.create({
        data: {
            name: data.name,
            slug: data.slug,
            order: data.order ?? 0,
            parentId: data.parentId || null,
            imageUrl: data.imageUrl,
            isFeatured: data.isFeatured ?? false,
            trendyolCategoryId: data.trendyolCategoryId ?? null,
            n11CategoryId: data.n11CategoryId ?? null,
            hbCategoryId: data.hbCategoryId ?? null,
        },
    });
    revalidatePath("/admin/categories");
}

export async function updateCategory(id: string, data: { name?: string; slug?: string; order?: number; isActive?: boolean; parentId?: string | null; imageUrl?: string; isFeatured?: boolean; trendyolCategoryId?: number | null; n11CategoryId?: number | null; hbCategoryId?: string | null }) {
    await prisma.category.update({
        where: { id },
        data,
    });
    revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
    await prisma.category.delete({
        where: { id },
    });
    revalidatePath("/admin/categories");
}

export async function toggleCategoryStatus(id: string, isActive: boolean) {
    await prisma.category.update({
        where: { id },
        data: { isActive },
    });
    revalidatePath("/admin/categories");
}
