import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPayTRCallback } from "@/lib/paytr";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const params: any = {};
        formData.forEach((value, key) => {
            params[key] = value;
        });

        console.log("PayTR Callback received:", params.merchant_oid, params.status);

        // 1. Verify Hash
        if (!verifyPayTRCallback(params)) {
            console.error("PayTR Callback Hash mismatch!");
            return new NextResponse("PAYTR_HASH_MISMATCH", { status: 400 });
        }

        const orderId = params.merchant_oid;
        const status = params.status; // success or failed

        if (status === "success") {
            // 2. Update Order and Payment status
            await prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                });

                if (!order) throw new Error("Order not found");

                // Update Order status
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: "CONFIRMED" },
                });

                // Update Payment status
                await tx.payment.updateMany({
                    where: { orderId: orderId },
                    data: {
                        status: "COMPLETED",
                        providerRef: params.paytr_token, // Using providerRef
                    },
                });

                console.log(`Order ${orderId} confirmed via PayTR`);
            });
        } else {
            // Payment failed
            console.log(`Order ${orderId} payment failed:`, params.failed_reason_msg);
            await prisma.order.update({
                where: { id: orderId },
                data: { status: "CANCELLED", notes: (params.failed_reason_msg || "Ödeme başarısız.") },
            });
        }

        // 3. Return OK to PayTR
        return new NextResponse("OK");
    } catch (error) {
        console.error("PayTR Callback Error:", error);
        return new NextResponse("INTERNAL_SERVER_ERROR", { status: 500 });
    }
}
