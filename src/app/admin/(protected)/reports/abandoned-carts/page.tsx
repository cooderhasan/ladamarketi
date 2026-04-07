"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Mail, ShoppingCart, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getAbandonedCartsAction, sendCartReminderAction } from "./actions";

export default function AbandonedCartsPage() {
    const [carts, setCarts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingId, setSendingId] = useState<string | null>(null);

    const loadCarts = async () => {
        setLoading(true);
        const result = await getAbandonedCartsAction();
        if (result.success && result.carts) {
            setCarts(result.carts);
        } else {
            toast.error(result.error || "Sepetler yüklenemedi.");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadCarts();
    }, []);

    const handleSendReminder = async (cartId: string) => {
        setSendingId(cartId);
        toast.info("Hatırlatma e-postası gönderiliyor...");
        
        const result = await sendCartReminderAction(cartId);
        
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.error || "Mail gönderilemedi.");
        }
        setSendingId(null);
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Sepette Bekleyenler
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Ürünlerini sepette unutan müşterilerinizi takip edin ve hatırlatma maili gönderin.
                    </p>
                </div>
                <Button onClick={loadCarts} variant="outline" size="sm">
                    Yenile
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Sepeti Terk Edenler</CardTitle>
                    <CardDescription>
                        Son 2 saatten daha eski aktif sepetleri listeliyorsunuz.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {carts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                            <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
                            <p>Şu anda sepette bekleyen bir ürün yok.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Müşteri Bilgisi</TableHead>
                                        <TableHead>İletişim</TableHead>
                                        <TableHead className="text-center">Sepetteki Ürün</TableHead>
                                        <TableHead className="text-right">Tutar</TableHead>
                                        <TableHead>Son İşlem</TableHead>
                                        <TableHead className="text-right">İşlem</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {carts.map((cart) => {
                                        const customerName = cart.user?.companyName || cart.user?.email || "Bilinmiyor";
                                        const email = cart.user?.email;
                                        const phone = cart.user?.phone;
                                        
                                        const totalItems = cart.items.reduce((acc: number, cur: any) => acc + cur.quantity, 0);
                                        const totalAmount = cart.items.reduce((acc: number, cur: any) => {
                                            const price = Number(cur.product.salePrice || cur.product.listPrice);
                                            return acc + (price * cur.quantity);
                                        }, 0);

                                        return (
                                            <TableRow key={cart.id}>
                                                <TableCell className="font-medium">
                                                    {customerName}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{email}</div>
                                                    {phone && <div className="text-xs text-gray-500">{phone}</div>}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary">{totalItems} Ürün</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-blue-600">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalAmount)}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {formatDistanceToNow(new Date(cart.updatedAt), { addSuffix: true, locale: tr })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="default" 
                                                        size="sm"
                                                        onClick={() => handleSendReminder(cart.id)}
                                                        disabled={sendingId === cart.id || !email}
                                                        className="w-full sm:w-auto"
                                                    >
                                                        {sendingId === cart.id ? (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Mail className="mr-2 h-4 w-4" />
                                                        )}
                                                        Hatırlat
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
