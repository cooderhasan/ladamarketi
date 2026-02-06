"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(
    orderId: string,
    status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
) {
    try {
        const session = await auth();

        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")) {
            throw new Error("Unauthorized");
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true },
        });

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { status },
        });

        await prisma.adminLog.create({
            data: {
                adminId: session.user.id,
                action: "UPDATE_ORDER_STATUS",
                entityType: "Order",
                entityId: orderId,
                oldData: { status: order?.status },
                newData: { status },
            },
        });

        revalidatePath("/admin/orders");
        return { success: true };
    } catch (error) {
        console.error("Order status update error:", error);
        return { success: false, error: "Failed to update order status" };
    }
}

export async function updateOrderTracking(orderId: string, trackingUrl: string) {
    try {
        const session = await auth();

        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")) {
            throw new Error("Unauthorized");
        }

        await prisma.order.update({
            where: { id: orderId },
            data: { trackingUrl },
        });

        await prisma.adminLog.create({
            data: {
                adminId: session.user.id,
                action: "UPDATE_ORDER_TRACKING",
                entityType: "Order",
                entityId: orderId,
                newData: { trackingUrl },
            },
        });

        revalidatePath("/admin/orders");
        return { success: true };
    } catch (error) {
        console.error("Order tracking update error:", error);
        return { success: false, error: "Takip linki güncellenemedi." };
    }
}
