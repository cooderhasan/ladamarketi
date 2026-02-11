"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/helpers";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface InstallmentRate {
    count: number;
    rate: number;
    amount: number;
}

interface BankRates {
    [key: string]: string | InstallmentRate[];
}

interface InstallmentTableProps {
    price: number;
}

export function InstallmentTable({ price }: InstallmentTableProps) {
    const [rates, setRates] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRates() {
            setLoading(true);
            try {
                const response = await fetch("/api/payment/paytr/installment-rates");
                const data = await response.json();

                if (data.status === "success") {
                    setRates(data.properties);
                } else {
                    setError(data.err_msg || "Taksit oranları yüklenemedi");
                }
            } catch (err) {
                setError("Bağlantı hatası oluştu");
            } finally {
                setLoading(false);
            }
        }

        fetchRates();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                {error}
            </div>
        );
    }

    if (!rates || Object.keys(rates).length === 0) {
        return (
            <div className="text-sm text-gray-500 p-4 border border-dashed rounded-lg text-center">
                Bu ürün için taksit seçeneği bulunmamaktadır.
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(rates).map(([bank, cardRates]: [string, any]) => {
                if (!Array.isArray(cardRates)) return null;

                return (
                    <Card key={bank} className="overflow-hidden border-blue-100 dark:border-blue-900/30">
                        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-b border-blue-100 dark:border-blue-900/30">
                            <h4 className="font-bold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                                {bank}
                            </h4>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="h-8 text-[10px] font-bold uppercase">Taksit</TableHead>
                                    <TableHead className="h-8 text-[10px] font-bold uppercase text-right">Aylık</TableHead>
                                    <TableHead className="h-8 text-[10px] font-bold uppercase text-right">Toplam</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cardRates.map((row: any) => {
                                    const totalAmount = price * (1 + Number(row.rate) / 100);
                                    const monthlyAmount = totalAmount / Number(row.count);

                                    return (
                                        <TableRow key={row.count} className="h-8">
                                            <TableCell className="py-1 text-xs font-medium">{row.count}</TableCell>
                                            <TableCell className="py-1 text-xs text-right font-medium">
                                                {formatPrice(monthlyAmount)}
                                            </TableCell>
                                            <TableCell className="py-1 text-xs text-right font-bold text-blue-600 dark:text-blue-400">
                                                {formatPrice(totalAmount)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Card>
                );
            })}
        </div>
    );
}
