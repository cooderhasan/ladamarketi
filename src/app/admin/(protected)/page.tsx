import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Clock, AlertTriangle, Truck } from "lucide-react";
import { formatPrice, getOrderStatusLabel, getOrderStatusColor } from "@/lib/helpers";
import Link from "next/link";
import { getDashboardData, PAYMENT_METHOD_LABELS } from "@/lib/dashboard-stats";
import { PeriodCard } from "@/components/admin/period-stat-card";
import { SalesBarChart } from "@/components/admin/sales-bar-chart";

async function getDashboardStats() {
    const [
        pendingDealers,
        recentOrders,
        lowStockProducts,
    ] = await Promise.all([
        prisma.user.count({ where: { status: "PENDING" } }),
        prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { companyName: true, email: true, name: true } },
                payment: { select: { method: true } },
            },
        }),
        // Stok durumu: kritik (stokta ama kritik seviyede), tükenmiş ve eksi stoklu ayrı sayılır
        prisma.$queryRaw<{ criticalCount: bigint; outCount: bigint; negativeCount: bigint }[]>`
            SELECT
                COUNT(*) FILTER (WHERE stock > 0 AND stock <= "criticalStock") AS "criticalCount",
                COUNT(*) FILTER (WHERE stock <= 0) AS "outCount",
                COUNT(*) FILTER (WHERE stock < 0) AS "negativeCount"
            FROM products
            WHERE "isActive" = true
        `,
    ]);

    return {
        pendingDealers,
        criticalStockCount: Number(lowStockProducts[0]?.criticalCount || 0),
        outOfStockCount: Number(lowStockProducts[0]?.outCount || 0),
        negativeStockCount: Number(lowStockProducts[0]?.negativeCount || 0),
        recentOrders: recentOrders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            total: Number(order.total),
            paymentMethod: order.payment?.method,
            // Site siparişlerinde ad soyad teslimat adresinde "name", pazaryeri aktarımlarında "fullName"
            customerName:
                (order.shippingAddress as any)?.name ||
                (order.shippingAddress as any)?.fullName ||
                order.user?.name ||
                order.user?.companyName ||
                order.user?.email ||
                order.guestEmail ||
                "Misafir",
        })),
    };
}

export default async function AdminDashboardPage() {
    const [stats, dash] = await Promise.all([getDashboardStats(), getDashboardData()]);
    const monthTotal = dash.byPayment.reduce((a, b) => a + b.revenue, 0);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Genel Bakış
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Ciro KDV dahil; iptal edilen ve kart ödemesi tamamlanmamış siparişler hariç.
                </p>
            </div>

            {/* Dönem kartları: bugün / bu hafta / bu ay (önceki dönemin aynı anına göre) + kargolanacaklar */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <PeriodCard title="Bugün" stat={dash.today} compareLabel="düne göre" />
                <PeriodCard title="Bu Hafta" stat={dash.week} compareLabel="geçen haftaya göre" />
                <PeriodCard title="Bu Ay" stat={dash.month} compareLabel="geçen aya göre" />
                <Link prefetch={false} href="/admin/orders?status=TO_SHIP" className="block">
                    <Card className={`h-full transition-colors hover:border-[#009AD0]/40 ${dash.toShipLate > 0 ? "border-amber-300 dark:border-amber-700" : ""}`}>
                        <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 sm:px-5 pt-4">
                            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Kargolanacak</CardTitle>
                            <Truck className="h-4 w-4 text-[#009AD0]" />
                        </CardHeader>
                        <CardContent className="px-4 sm:px-5 pb-4 space-y-1">
                            <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{dash.toShipTotal} sipariş</div>
                            <div className="text-xs text-gray-500">Onaylandı + Hazırlanıyor</div>
                            {dash.toShipLate > 0 ? (
                                <span className="text-xs font-medium text-amber-600">{dash.toShipLate} sipariş 2 günden eski</span>
                            ) : (
                                <span className="text-xs text-emerald-600">Geciken yok</span>
                            )}
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Grafik + ödeme yöntemi dağılımı */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="px-4 sm:px-6 pb-2">
                        <CardTitle className="text-base sm:text-lg">Son 30 Gün</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                        <SalesBarChart data={dash.daily} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="px-4 sm:px-6 pb-2">
                        <CardTitle className="text-base sm:text-lg">Bu Ay Ödeme Yöntemleri</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 space-y-3">
                        {dash.byPayment.length === 0 ? (
                            <p className="text-sm text-gray-500">Bu ay henüz sipariş yok.</p>
                        ) : (
                            dash.byPayment.map((r) => {
                                const pct = monthTotal > 0 ? Math.round((r.revenue / monthTotal) * 100) : 0;
                                return (
                                    <div key={r.method}>
                                        <div className="flex items-baseline justify-between gap-2 text-sm">
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{PAYMENT_METHOD_LABELS[r.method] || "Belirtilmemiş"}</span>
                                            <span className="text-gray-500 whitespace-nowrap">{formatPrice(r.revenue)} · {r.orders}</span>
                                        </div>
                                        <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                            <div className="h-full rounded-full bg-[#009AD0] dark:bg-sky-400" style={{ width: `${Math.max(2, pct)}%` }} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Pending Dealers Alert */}
            {stats.pendingDealers > 0 && (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                    <CardContent className="flex items-center justify-between gap-3 py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3 min-w-0">
                            <Clock className="h-5 w-5 shrink-0 text-amber-600" />
                            <div>
                                <p className="font-medium text-amber-800 dark:text-amber-200">
                                    {stats.pendingDealers} bayi onay bekliyor
                                </p>
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    Müşteri yönetiminden onaylayabilirsiniz.
                                </p>
                            </div>
                        </div>
                        <Link
                            prefetch={false}
                            href="/admin/customers?status=PENDING"
                            className="shrink-0 whitespace-nowrap text-sm font-medium text-amber-700 hover:text-amber-800 dark:text-amber-300"
                        >
                            Görüntüle →
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Stok Uyarısı: kritik, tükenmiş ve eksi stok ayrı */}
            {(stats.criticalStockCount > 0 || stats.outOfStockCount > 0) && (
                <Card className={stats.criticalStockCount > 0 ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20" : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20"}>
                    <CardContent className="flex items-center justify-between gap-3 py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3 min-w-0">
                            <AlertTriangle className={`h-5 w-5 shrink-0 ${stats.criticalStockCount > 0 ? "text-red-600" : "text-gray-500"}`} />
                            <div>
                                <p className="font-medium text-red-800 dark:text-red-200">
                                    {stats.criticalStockCount > 0 ? `${stats.criticalStockCount} üründe stok kritik seviyede` : "Kritik seviyede ürün yok"}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {stats.outOfStockCount} ürün tükendi
                                    {stats.negativeStockCount > 0 ? ` · ${stats.negativeStockCount} ürün eksi stokta (düzeltilmeli)` : ""}
                                </p>
                            </div>
                        </div>
                        <Link
                            prefetch={false}
                            href="/admin/stock-alerts"
                            className="shrink-0 whitespace-nowrap text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-300"
                        >
                            Görüntüle →
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Recent Orders */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 sm:px-6">
                    <CardTitle className="text-base sm:text-lg">Son Siparişler</CardTitle>
                    <Link
                        prefetch={false}
                        href="/admin/orders"
                        className="shrink-0 whitespace-nowrap text-sm text-[#00739C] hover:text-[#009AD0]"
                    >
                        Tümünü Gör →
                    </Link>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                    {stats.recentOrders.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                            Henüz sipariş bulunmuyor.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {stats.recentOrders.map((order) => (
                                <Link
                                    prefetch={false}
                                    href={`/admin/orders?search=${encodeURIComponent(order.orderNumber)}&status=ALL`}
                                    key={order.id}
                                    className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded-lg transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                        <div className="hidden sm:flex shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center group-hover:bg-sky-50 dark:group-hover:bg-sky-900/20 transition-colors">
                                            <ShoppingCart className="h-5 w-5 text-gray-500 group-hover:text-[#009AD0] dark:group-hover:text-sky-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white group-hover:text-[#00739C] transition-colors truncate">
                                                {order.orderNumber}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                                                {order.customerName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {formatPrice(order.total)}
                                        </p>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge
                                                variant="secondary"
                                                className={`${getOrderStatusColor(order.status)} whitespace-nowrap text-[11px] sm:text-xs`}
                                            >
                                                {getOrderStatusLabel(order.status, order.paymentMethod)}
                                            </Badge>
                                            <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                                                {(order.paymentMethod && PAYMENT_METHOD_LABELS[order.paymentMethod]) || "—"}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
