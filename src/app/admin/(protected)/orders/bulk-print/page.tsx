import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { AutoPrint } from "@/components/admin/auto-print";
import { CloseButton } from "@/components/admin/close-button";
import { OrderPrintSheet, PRINT_CSS } from "@/components/admin/order-print-sheet";

interface BulkPrintPageProps {
    searchParams: Promise<{ ids?: string }>;
}

export default async function BulkOrderPrintPage({ searchParams }: BulkPrintPageProps) {
    const { ids } = await searchParams;

    if (!ids) {
        return (
            <div className="p-8 text-center text-gray-500">
                Hiçbir sipariş seçilmedi.
            </div>
        );
    }

    const orderIdList = ids.split(",");

    const orders = await prisma.order.findMany({
        where: {
            id: { in: orderIdList },
        },
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
        orderBy: { createdAt: "desc" },
    });

    if (orders.length === 0) {
        notFound();
    }

    const settings = await getSiteSettings();

    return (
        <div className="bg-gray-100 min-h-screen">
            <style>{PRINT_CSS}</style>

            <AutoPrint orderIds={ids} />

            {/* Actions (Hidden in Print) */}
            <div className="no-print sticky top-0 z-50 p-4 bg-white border-b shadow-sm flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-gray-900 font-bold">Toplu Sipariş Yazdırma ({orders.length} Sipariş)</span>
                    <span className="text-xs text-gray-500">Her sipariş ayrı bir sayfada yazdırılacaktır.</span>
                </div>
                <div className="flex gap-4 items-center">
                    <CloseButton />
                    <PrintButton />
                </div>
            </div>

            <div className="flex flex-col gap-8 p-8 items-center bg-gray-100 print:bg-white print:p-0 print:gap-0">
                {orders.map((order, index) => (
                    <div
                        key={order.id}
                        className={`bg-white text-black p-6 w-full max-w-[210mm] shadow-sm print:shadow-none print:p-0 ${index !== orders.length - 1 ? "print-page-break" : ""}`}
                    >
                        <OrderPrintSheet order={order} settings={settings} />
                    </div>
                ))}
            </div>
        </div>
    );
}
