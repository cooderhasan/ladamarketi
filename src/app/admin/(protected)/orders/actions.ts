"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendShippingNotificationEmail } from "@/lib/email";

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
                oldData: { status: order?.status ?? null },
                newData: { status },
            },
        });

        revalidatePath("/admin/orders");
        return { success: true };
    } catch (error) {
        console.error("Order status update error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Durum güncellenemedi." };
    }
}

export async function updateOrderTracking(orderId: string, trackingUrl: string) {
    try {
        const session = await auth();

        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")) {
            throw new Error("Unauthorized");
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: { trackingUrl },
            include: {
                user: {
                    select: { email: true, companyName: true }
                }
            }
        });

        // Send Notification Email
        // If we have a tracking URL (not empty) and we haven't just cleared it
        if (trackingUrl && trackingUrl.trim() !== "") {
            const email = order.user?.email || order.guestEmail;
            const customerName = order.user?.companyName || order.guestEmail || "Müşteri";

            if (email) {
                // Fire and forget - don't block the UI for email sending
                sendShippingNotificationEmail({
                    to: email,
                    customerName: customerName,
                    orderNumber: order.orderNumber,
                    cargoCompany: order.cargoCompany || "Kargo",
                    trackingUrl: trackingUrl
                }).catch(err => {
                    console.error("Failed to send shipping notification:", err);
                });
            }
        }

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

export async function bulkUpdateOrderStatus(
    orderIds: string[],
    status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
) {
    try {
        const session = await auth();

        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")) {
            throw new Error("Unauthorized");
        }

        // Update all selected orders
        await prisma.order.updateMany({
            where: {
                id: { in: orderIds },
            },
            data: { status },
        });

        // Log the bulk action (simplified log)
        await prisma.adminLog.create({
            data: {
                adminId: session.user.id,
                action: "BULK_UPDATE_ORDER_STATUS",
                entityType: "Order",
                entityId: "BULK",
                newData: { orderIds, status },
            },
        });

        revalidatePath("/admin/orders");
        return { success: true };
    } catch (error) {
        console.error("Bulk order status update error:", error);
        return { success: false, error: "Toplu güncelleme başarısız oldu." };
    }
}

