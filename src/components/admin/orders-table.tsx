"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Eye, FileDown, Search, X } from "lucide-react";
import {
    formatDate,
    getOrderStatusLabel,
    getOrderStatusColor,
    formatPrice,
} from "@/lib/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus, updateOrderTracking } from "@/app/admin/(protected)/orders/actions";
import { toast } from "sonner";
import { OrderWithItems } from "@/types";
import { Label } from "@/components/ui/label";

interface OrdersTableProps {
    orders: OrderWithItems[];
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
    };
}

const orderStatuses = [
    { value: "ALL", label: "Tümü" },
    { value: "PENDING", label: "Ödeme Bekleniyor" },
    { value: "CONFIRMED", label: "Onaylandı" },
    { value: "PROCESSING", label: "Hazırlanıyor" },
    { value: "SHIPPED", label: "Kargolandı" },
    { value: "DELIVERED", label: "Tamamlandı" },
    { value: "CANCELLED", label: "İptal Edildi" },
];

export function OrdersTable({ orders: initialOrders, pagination }: OrdersTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Filter States
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
    const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
    const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

    const [orders, setOrders] = useState(initialOrders);
    const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Sync local order state when props change (due to server refetch)
    useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);

    // Handle Search/Filter Application
    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (searchTerm) params.set("search", searchTerm);
        else params.delete("search");

        if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
        else params.delete("status");

        if (startDate) params.set("startDate", startDate);
        else params.delete("startDate");

        if (endDate) params.set("endDate", endDate);
        else params.delete("endDate");

        // Reset to page 1 on filter change
        params.set("page", "1");

        router.push(`?${params.toString()}`);
    };

    // Handle Reset
    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("ALL");
        setStartDate("");
        setEndDate("");
        router.push("/admin/orders");
    };

    // Handle Pagination
    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`?${params.toString()}`);
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setLoadingId(orderId);
        try {
            const result = await updateOrderStatus(orderId, newStatus as any);
            if (result && result.success) {
                setOrders((prev) =>
                    prev.map((order) =>
                        order.id === orderId ? { ...order, status: newStatus } : order
                    )
                );
                toast.success("Sipariş durumu güncellendi");
            } else {
                toast.error(result.error || "Güncelleme başarısız oldu");
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px] space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Arama</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Sipariş No, Müşteri Adı..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="w-full md:w-[180px] space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Durum</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tümü" />
                            </SelectTrigger>
                            <SelectContent>
                                {orderStatuses.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>
                                        {status.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="space-y-2 flex-1 md:w-[140px]">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Başlangıç</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="pt-8 text-gray-400">-</div>
                        <div className="space-y-2 flex-1 md:w-[140px]">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bitiş</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-end gap-2 md:ml-auto w-full md:w-auto pt-2 md:pt-0">
                        <Button onClick={resetFilters} variant="ghost" className="text-gray-500 hover:text-gray-700">
                            Temizle
                        </Button>
                        <Button onClick={applyFilters} className="min-w-[100px]">
                            Filtrele
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sipariş No</TableHead>
                                <TableHead>Müşteri</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Tutar</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        Sipariş bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow
                                        key={order.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setIsOpen(true);
                                        }}
                                    >
                                        <TableCell className="font-medium">
                                            #{order.orderNumber}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {order.user?.companyName || order.user?.email || order.guestEmail || "Misafir"}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {order.user?.phone || "-"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                                        <TableCell className="font-medium">
                                            {formatPrice(Number(order.total))}
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="w-[180px] flex flex-col gap-1">
                                                <Select
                                                    value={order.status}
                                                    onValueChange={(value) => handleStatusChange(order.id, value)}
                                                    disabled={loadingId === order.id}
                                                >
                                                    <SelectTrigger className={`h-8 border-transparent bg-transparent hover:bg-white/50 focus:ring-0 ${getOrderStatusColor(order.status)} border`}>
                                                        <SelectValue>
                                                            {getOrderStatusLabel(order.status, order.payment?.method)}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {orderStatuses.filter(s => s.value !== 'ALL').map((status) => (
                                                            <SelectItem key={status.value} value={status.value}>
                                                                {status.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <span className="text-[10px] text-gray-500 font-medium px-2">
                                                    {order.payment?.method === "BANK_TRANSFER" ? "Havale / EFT" : "Kredi Kartı"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Yazdır"
                                                    onClick={() => window.open(`/admin/orders/${order.id}/print`, '_blank')}
                                                >
                                                    <span className="text-lg">🖨️</span>
                                                </Button>
                                                <a
                                                    href={`/admin/orders/${order.id}/pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                                    title="PDF Olarak İndir"
                                                >
                                                    <FileDown className="h-5 w-5" />
                                                </a>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Double check
                                                        setSelectedOrder(order);
                                                        setIsOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-500">
                            Toplam {pagination.totalCount} sipariş, Sayfa {pagination.currentPage} / {pagination.totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage <= 1}
                            >
                                Önceki
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage >= pagination.totalPages}
                            >
                                Sonraki
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Order Detail Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-5xl min-w-[900px]">
                    <DialogHeader>
                        <DialogTitle>
                            Sipariş Detayı - {selectedOrder?.orderNumber}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            {/* Top Grid: Customer, Address, Cargo/Status - 3 Columns */}
                            <div className="grid grid-cols-3 gap-6">
                                {/* Column 1: Customer Info */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                            <span className="bg-blue-100 text-blue-700 p-1 rounded">👤</span> Müşteri Bilgileri
                                        </h4>
                                        <div className="text-sm space-y-1 text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                {selectedOrder.user?.companyName || selectedOrder.user?.email || selectedOrder.guestEmail || "Misafir"}
                                            </p>
                                            <p>{selectedOrder.user?.email || selectedOrder.guestEmail}</p>
                                            <p>{selectedOrder.user?.phone || "-"}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2 text-sm">Sipariş Notu</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 italic bg-yellow-50 p-2 rounded border border-yellow-100">
                                            {selectedOrder.notes || "Not yok."}
                                        </p>
                                    </div>
                                </div>

                                {/* Column 2: Shipping Address */}
                                <div>
                                    <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                        <span className="bg-green-100 text-green-700 p-1 rounded">📍</span> Teslimat Adresi
                                    </h4>
                                    <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded-md h-[calc(100%-32px)]">
                                        {selectedOrder.shippingAddress ? (
                                            <>
                                                <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">{(selectedOrder.shippingAddress as any).title}</p>
                                                <p>{(selectedOrder.shippingAddress as any).address}</p>
                                                <p className="mt-1 font-medium">{(selectedOrder.shippingAddress as any).district} / {(selectedOrder.shippingAddress as any).city}</p>
                                                <p className="mt-1 text-gray-500">Tel: {(selectedOrder.shippingAddress as any).phone}</p>
                                            </>
                                        ) : (
                                            <p className="text-red-500">Adres bilgisi bulunamadı.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Column 3: Cargo & Status */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                            <span className="bg-purple-100 text-purple-700 p-1 rounded">🚚</span> Kargo Bilgileri
                                        </h4>
                                        <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-gray-500">Firma</span>
                                                <span className="font-medium">{selectedOrder.cargoCompany || "Seçilmedi"}</span>
                                            </div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-gray-500">Desi</span>
                                                <span className="font-medium">{(selectedOrder as any).shippingDesi || 0}</span>
                                            </div>

                                            <Label className="text-xs font-medium mb-1.5 block">Takip Linki</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    defaultValue={selectedOrder.trackingUrl || ""}
                                                    placeholder="https://..."
                                                    className="h-7 text-xs"
                                                    id={`tracking-${selectedOrder.id}`}
                                                />
                                                <Button
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={async () => {
                                                        const input = document.getElementById(`tracking-${selectedOrder.id}`) as HTMLInputElement;
                                                        if (!input) return;

                                                        const result = await updateOrderTracking(selectedOrder.id, input.value);
                                                        if (result.success) {
                                                            toast.success("Takip linki güncellendi");
                                                            setSelectedOrder(prev => prev ? ({ ...prev, trackingUrl: input.value }) : null);
                                                            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, trackingUrl: input.value } : o));
                                                        } else {
                                                            toast.error(result.error);
                                                        }
                                                    }}
                                                >
                                                    Kaydet
                                                </Button>
                                            </div>
                                            {selectedOrder.trackingUrl && (
                                                <a href={selectedOrder.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1.5 inline-flex items-center gap-1">
                                                    Kargo Takip ↗
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-blue-900">Sipariş Durumu</span>
                                            <Badge className={`${getOrderStatusColor(selectedOrder.status)}`}>
                                                {getOrderStatusLabel(selectedOrder.status)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items Table - Compact */}
                            <div>
                                <h4 className="font-semibold mb-2 text-sm">Ürünler ({selectedOrder.items.length})</h4>
                                <div className="border rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50 sticky top-0">
                                            <TableRow>
                                                <TableHead className="py-2 h-9">Ürün</TableHead>
                                                <TableHead className="py-2 h-9 text-center w-20">Adet</TableHead>
                                                <TableHead className="py-2 h-9 text-right w-32">Birim Fiyat</TableHead>
                                                <TableHead className="py-2 h-9 text-right w-32">Toplam</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedOrder.items.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-gray-50">
                                                    <TableCell className="py-2">{item.productName}</TableCell>
                                                    <TableCell className="py-2 text-center font-medium">
                                                        {item.quantity}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right text-gray-600">
                                                        {formatPrice(Number(item.unitPrice))}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-medium">
                                                        {formatPrice(Number(item.lineTotal))}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end pt-2 border-t">
                                <div className="w-72 space-y-1.5 bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Ara Toplam</span>
                                        <span>{formatPrice(Number(selectedOrder.subtotal))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>KDV Toplam</span>
                                        <span>{formatPrice(Number(selectedOrder.vatAmount))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Kargo Ücreti</span>
                                        <span>{formatPrice(Number((selectedOrder as any).shippingCost || 0))}</span>
                                    </div>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <div className="flex justify-between text-lg font-bold text-gray-900">
                                        <span>Genel Toplam</span>
                                        <span>{formatPrice(Number(selectedOrder.total))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
