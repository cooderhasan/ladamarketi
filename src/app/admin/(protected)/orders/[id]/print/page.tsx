import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { AutoPrint } from "@/components/admin/auto-print";
import { OrderPrintSheet, PRINT_CSS } from "@/components/admin/order-print-sheet";

export default async function OrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            user: true,
            // Stok kodu (hazırlık için) ürün / varyanttan
            items: {
                include: {
                    product: { select: { sku: true } },
                    variant: { select: { sku: true } },
                },
            },
            payment: true,
        },
    });

    if (!order) {
        notFound();
    }

    const settings = await getSiteSettings();

    return (
        <div className="bg-white min-h-screen text-black p-6 max-w-[210mm] mx-auto print:p-0">
            <style>{PRINT_CSS}</style>

            {/* Auto-print component */}
            <AutoPrint orderIds={id} />

            {/* Actions (Hidden in Print) */}
            <div className="no-print mb-6 flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                <div className="flex flex-col">
                    <span className="text-gray-600 font-medium">Baskı Önizleme</span>
                    <span className="text-xs text-gray-500">Bu sayfa otomatik olarak yazıcı diyaloğunu açar.</span>
                </div>
                <PrintButton />
            </div>

            <OrderPrintSheet order={order} settings={settings} />
        </div>
    );
}
