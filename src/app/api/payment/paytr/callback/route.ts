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

        const orderId = params.merchant_oid; // This is the merchant_oid from PayTR
        const status = params.status; // success or failed
        const total_amount = params.total_amount; // Assuming total_amount is provided by PayTR

        if (status === "success") {
            // 2. Update Order and Payment status
            const order = await prisma.order.findFirst({
                where: {
                    orderNumber: orderId, // Use orderId (which is merchant_oid) for orderNumber
                    // Status check is removed to allow re-payment or different flows
                    // status: "PENDING",
                },
                include: { payment: true },
            });

            if (!order) {
                console.error(`Sipariş bulunamadı: ${orderId}`);
                return new NextResponse("OK"); // PayTR'a OK dön ki tekrar denemesin (veya hata dönüp loglatabiliriz ama genelde OK dönülür)
            }

            // Ödeme Başarılı
            await prisma.$transaction([
                prisma.order.update({
                    where: { id: order.id },
                    data: { status: "CONFIRMED" },
                }),
                prisma.payment.upsert({
                    where: { orderId: order.id },
                    update: {
                        status: "COMPLETED",
                        amount: Number(total_amount) / 100,
                        providerRef: orderId, // Using orderId (merchant_oid) as providerRef
                        providerData: params as any, // Store all params as providerData
                    },
                    create: {
                        orderId: order.id,
                        method: "CREDIT_CARD", // Assuming credit card, adjust if other methods are possible
                        status: "COMPLETED",
                        amount: Number(total_amount) / 100,
                        providerRef: orderId, // Using orderId (merchant_oid) as providerRef
                        providerData: params as any, // Store all params as providerData
                    },
                }),
            ]);
            console.log(`Order ${orderId} confirmed via PayTR`);
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
