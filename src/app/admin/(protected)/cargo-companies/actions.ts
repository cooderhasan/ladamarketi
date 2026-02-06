"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const cargoSchema = z.object({
    name: z.string().min(1, "Kargo firma adı zorunludur"),
    isActive: z.boolean().optional(),
});

export async function createCargoCompany(formData: FormData) {
    const session = await auth();
    if (session?.user.role !== "ADMIN" && session?.user.role !== "OPERATOR") {
        return { success: false, error: "Yetkisiz işlem." };
    }

    const name = formData.get("name") as string;
    const isActive = formData.get("isActive") === "on";

    const validated = cargoSchema.safeParse({ name, isActive });

    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message };
    }

    try {
        await prisma.cargoCompany.create({
            data: {
                name: validated.data.name,
                isActive: validated.data.isActive,
            },
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Create cargo error:", error);
        return { success: false, error: "Kargo firması oluşturulurken hata oluştu." };
    }
}

export async function toggleCargoCompany(id: string, currentState: boolean) {
    const session = await auth();
    if (session?.user.role !== "ADMIN" && session?.user.role !== "OPERATOR") {
        return { success: false, error: "Yetkisiz işlem." };
    }

    try {
        await prisma.cargoCompany.update({
            where: { id },
            data: { isActive: !currentState },
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Toggle cargo error:", error);
        return { success: false, error: "Kargo durumu güncellenirken hata oluştu." };
    }
}

export async function deleteCargoCompany(id: string) {
    const session = await auth();
    if (session?.user.role !== "ADMIN") {
        return { success: false, error: "Sadece yöneticiler silebilir." };
    }

    try {
        await prisma.cargoCompany.delete({
            where: { id },
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Delete cargo error:", error);
        return { success: false, error: "Silinirken hata oluştu." };
    }
}
