import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/helpers";
import {
    getDashboardData,
    dailyRevenue,
    monthlyRevenue,
    sumRange,
    trStartOfDay,
    trStartOfMonth,
} from "@/lib/dashboard-stats";
import { PeriodCard, Delta } from "@/components/admin/period-stat-card";
import { SalesBarChart } from "@/components/admin/sales-bar-chart";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/** "2026-08" -> "Ağustos 2026" */
function monthLabel(key: string) {
    const [y, m] = key.split("-").map(Number);
    return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** "2026-08" -> o ayın ortasında bir an (Türkiye ay sınırları trStartOfMonth ile hesaplanır) */
function monthRef(key: string) {
    const [y, m] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 15, 12));
}

function shiftMonth(key: string, offset: number) {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + offset, 1));
    return d.toISOString().slice(0, 7);
}

function pctChange(now: number, prev: number) {
    if (prev <= 0) return null;
    return Math.round(((now - prev) / prev) * 100);
}

function PctCell({ now, prev }: { now: number; prev: number }) {
    const pct = pctChange(now, prev);
    if (pct === null) return <span className="text-gray-300">—</span>;
    return <span className={pct >= 0 ? "text-emerald-600" : "text-red-600"}>{pct >= 0 ? "+" : "−"}%{Math.abs(pct)}</span>;
}

async function getSalesReport(monthKey: string) {
    const now = new Date();
    const currentKey = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 7);
    const isCurrent = monthKey === currentKey;
    const ref = isCurrent ? now : monthRef(monthKey);

    const monthStart = trStartOfMonth(ref);
    const prevMonthStart = trStartOfMonth(ref, -1);
    const nextMonthStart = trStartOfMonth(ref, 1);
    const daysInMonth = Math.round((nextMonthStart.getTime() - monthStart.getTime()) / DAY_MS);
    const daysInPrevMonth = Math.round((monthStart.getTime() - prevMonthStart.getTime()) / DAY_MS);
    // Bu ay ise bugüne kadarki günler; geçen ayla karşılaştırma da aynı süreye göre (ay başından bu saate kadar)
    const shownDays = isCurrent ? Math.round((trStartOfDay(now).getTime() - monthStart.getTime()) / DAY_MS) + 1 : daysInMonth;
    const monthEnd = isCurrent ? now : nextMonthStart;
    const prevMonthEnd = isCurrent
        ? new Date(Math.min(prevMonthStart.getTime() + (now.getTime() - monthStart.getTime()), monthStart.getTime()))
        : monthStart;

    const [dash, monthSum, prevMonthSum, days, prevDays, months] = await Promise.all([
        getDashboardData(),
        sumRange(monthStart, monthEnd),
        sumRange(prevMonthStart, prevMonthEnd),
        dailyRevenue(monthStart, shownDays),
        dailyRevenue(prevMonthStart, daysInPrevMonth),
        monthlyRevenue(now, 12), // her zaman bu ayla biter; seçilen ay listede vurgulanır
    ]);

    return { dash, isCurrent, currentKey, monthSum, prevMonthSum, days, prevDays, months };
}

export default async function SalesReportPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string }>;
}) {
    const params = await searchParams;
    const nowKey = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 7);
    const requested = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month || "") ? params.month! : nowKey;
    const monthKey = requested > nowKey ? nowKey : requested;

    const { dash, isCurrent, currentKey, monthSum, prevMonthSum, days, prevDays, months } = await getSalesReport(monthKey);
    const prevKey = shiftMonth(monthKey, -1);
    const avgBasket = monthSum.orders > 0 ? monthSum.revenue / monthSum.orders : 0;
    const prevAvgBasket = prevMonthSum.orders > 0 ? prevMonthSum.revenue / prevMonthSum.orders : 0;
    const compareLabel = isCurrent ? `${monthLabel(prevKey)} aynı döneme göre` : `${monthLabel(prevKey)} ayına göre`;
    const maxMonth = Math.max(1, ...months.map((m) => m.revenue));

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-[#009AD0]" />
                        Satış Özeti
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Ciro KDV dahil; iptal edilen ve kart ödemesi tamamlanmamış siparişler hariç. Genel Bakış ile aynı hesap.
                    </p>
                </div>
                <Link href="/admin/reports" prefetch={false}>
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Raporlar
                    </Button>
                </Link>
            </div>

            {/* Güncel dönemler (Genel Bakış ile aynı rakamlar) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                <PeriodCard title="Bugün" stat={dash.today} compareLabel="düne göre" />
                <PeriodCard title="Bu Hafta" stat={dash.week} compareLabel="geçen haftaya göre" />
                <div className="col-span-2 lg:col-span-1">
                    <PeriodCard title="Bu Ay" stat={dash.month} compareLabel="geçen aya göre" />
                </div>
            </div>

            {/* Ay seçici */}
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-800 px-2 py-2 sm:px-4">
                <Link prefetch={false} href={`/admin/reports/sales?month=${prevKey}`}>
                    <Button variant="ghost" size="sm" className="gap-1">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">{monthLabel(prevKey)}</span>
                    </Button>
                </Link>
                <div className="text-center">
                    <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{monthLabel(monthKey)}</div>
                    {isCurrent && <div className="text-[11px] text-gray-500">bugüne kadar</div>}
                </div>
                {monthKey < currentKey ? (
                    <Link prefetch={false} href={`/admin/reports/sales?month=${shiftMonth(monthKey, 1)}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                            <span className="hidden sm:inline">{monthLabel(shiftMonth(monthKey, 1))}</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                ) : (
                    <span className="w-9" />
                )}
            </div>

            {/* Seçilen ayın özeti: geçen aya göre */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-1 px-4 sm:px-5 pt-4">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Ciro</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-5 pb-4 space-y-1">
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(monthSum.revenue)}</div>
                        <Delta now={monthSum.revenue} prev={prevMonthSum.revenue} label={compareLabel} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1 px-4 sm:px-5 pt-4">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Sipariş</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-5 pb-4 space-y-1">
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{monthSum.orders}</div>
                        <div className="text-xs text-gray-500">
                            {monthLabel(prevKey)}: {prevMonthSum.orders} <PctCell now={monthSum.orders} prev={prevMonthSum.orders} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1 px-4 sm:px-5 pt-4">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Ortalama Sepet</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-5 pb-4 space-y-1">
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(avgBasket)}</div>
                        <div className="text-xs text-gray-500">
                            {monthLabel(prevKey)}: {formatPrice(prevAvgBasket)} <PctCell now={avgBasket} prev={prevAvgBasket} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Seçilen ayın günlük grafiği */}
            <Card>
                <CardHeader className="px-4 sm:px-6 pb-2">
                    <CardTitle className="text-base sm:text-lg">Günlük Satış · {monthLabel(monthKey)}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    <SalesBarChart data={days} lastLabel={isCurrent ? "Bugün" : ""} ariaLabel={`${monthLabel(monthKey)} günlük cirosu`} />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Günlük tablo: geçen ayın aynı günüyle */}
                <Card>
                    <CardHeader className="px-4 sm:px-6 pb-2">
                        <CardTitle className="text-base sm:text-lg">Gün Gün</CardTitle>
                        <p className="text-xs text-gray-500">Her gün, {monthLabel(prevKey)} ayının aynı günüyle karşılaştırılır.</p>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                        <div className="max-h-[520px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-white dark:bg-gray-950 text-xs text-gray-500">
                                    <tr className="border-b dark:border-gray-800">
                                        <th className="py-2 px-2 text-left font-medium">Gün</th>
                                        <th className="py-2 px-2 text-right font-medium">Ciro</th>
                                        <th className="py-2 px-2 text-right font-medium">Sip.</th>
                                        <th className="py-2 px-2 text-right font-medium hidden sm:table-cell">Geçen ay</th>
                                        <th className="py-2 px-2 text-right font-medium">Fark</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...days].reverse().map((d) => {
                                        const dayNo = Number(d.date.slice(8, 10));
                                        const prev = prevDays[dayNo - 1];
                                        return (
                                            <tr key={d.date} className="border-b last:border-0 border-gray-100 dark:border-gray-800">
                                                <td className="py-2 px-2 whitespace-nowrap">{dayNo} {MONTH_NAMES[Number(d.date.slice(5, 7)) - 1].slice(0, 3)}</td>
                                                <td className="py-2 px-2 text-right whitespace-nowrap font-medium">{d.revenue > 0 ? formatPrice(d.revenue) : <span className="text-gray-300">—</span>}</td>
                                                <td className="py-2 px-2 text-right">{d.orders || <span className="text-gray-300">0</span>}</td>
                                                <td className="py-2 px-2 text-right whitespace-nowrap text-gray-500 hidden sm:table-cell">{prev ? formatPrice(prev.revenue) : "—"}</td>
                                                <td className="py-2 px-2 text-right whitespace-nowrap text-xs">{prev ? <PctCell now={d.revenue} prev={prev.revenue} /> : <span className="text-gray-300">—</span>}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Son 12 ay */}
                <Card>
                    <CardHeader className="px-4 sm:px-6 pb-2">
                        <CardTitle className="text-base sm:text-lg">Aylık Karşılaştırma</CardTitle>
                        <p className="text-xs text-gray-500">Son 12 ay; devam eden ay geçen ayın aynı dönemiyle kıyaslanır. Bir aya tıklayınca günlük dökümü açılır.</p>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6 space-y-1">
                        {[...months].reverse().map((m, i, arr) => {
                            const prev = arr[i + 1];
                            const pct = Math.max(2, Math.round((m.revenue / maxMonth) * 100));
                            const selected = m.month === monthKey;
                            return (
                                <Link
                                    prefetch={false}
                                    key={m.month}
                                    href={`/admin/reports/sales?month=${m.month}`}
                                    className={`block rounded-lg px-2 py-2 transition-colors ${selected ? "bg-[#009AD0]/[0.08]" : "hover:bg-gray-50 dark:hover:bg-gray-900"}`}
                                >
                                    <div className="flex items-baseline justify-between gap-2 text-sm">
                                        <span className={`font-medium ${selected ? "text-[#00739C]" : "text-gray-800 dark:text-gray-200"}`}>
                                            {monthLabel(m.month)}
                                            {m.month === currentKey && <span className="ml-1 text-[11px] font-normal text-gray-500">(devam ediyor)</span>}
                                        </span>
                                        <span className="whitespace-nowrap">
                                            <span className="font-medium">{formatPrice(m.revenue)}</span>
                                            <span className="text-gray-500"> · {m.orders}</span>
                                            {/* Devam eden ay geçen ayın tamamıyla değil, aynı dönemiyle (ay başından bu saate kadar) kıyaslanır; üstteki "Bu Ay" kartıyla aynı */}
                                            {m.month === currentKey ? (
                                                <span className="ml-2 text-xs" title={`${monthLabel(shiftMonth(m.month, -1))} aynı döneme göre`}>
                                                    <PctCell now={dash.month.revenue} prev={dash.month.prevRevenue} />
                                                </span>
                                            ) : (
                                                prev && <span className="ml-2 text-xs"><PctCell now={m.revenue} prev={prev.revenue} /></span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                        <div className="h-full rounded-full bg-[#009AD0] dark:bg-sky-400" style={{ width: `${m.revenue > 0 ? pct : 0}%` }} />
                                    </div>
                                </Link>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
