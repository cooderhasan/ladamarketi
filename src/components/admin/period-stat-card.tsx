import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatPrice } from "@/lib/helpers";
import type { PeriodStat } from "@/lib/dashboard-stats";

/** Önceki döneme göre değişim (%); önceki dönem 0 ise gösterilmez */
export function Delta({ now, prev, label }: { now: number; prev: number; label: string }) {
    if (prev <= 0) return <span className="text-xs text-gray-400">{label}: veri yok</span>;
    const pct = Math.round(((now - prev) / prev) * 100);
    const up = pct >= 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-emerald-600" : "text-red-600"}`} title={`${label}: ${formatPrice(prev)}`}>
            {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            %{Math.abs(pct)} <span className="font-normal text-gray-400">{label}</span>
        </span>
    );
}

/** Genel Bakış ve Satış Özeti'ndeki dönem kartı: ciro, sipariş sayısı ve önceki döneme göre değişim */
export function PeriodCard({ title, stat, compareLabel }: { title: string; stat: PeriodStat; compareLabel: string }) {
    return (
        <Card>
            <CardHeader className="pb-1 px-4 sm:px-5 pt-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">{title}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-5 pb-4 space-y-1">
                <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{formatPrice(stat.revenue)}</div>
                <div className="text-xs text-gray-500">{stat.orders} sipariş</div>
                <Delta now={stat.revenue} prev={stat.prevRevenue} label={compareLabel} />
            </CardContent>
        </Card>
    );
}
