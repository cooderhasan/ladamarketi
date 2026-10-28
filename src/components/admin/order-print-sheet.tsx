import { formatPrice, formatDate } from "@/lib/helpers";
import { Barcode } from "@/components/admin/barcode";

// Helper to serialise decimals safely
const toNumber = (value: any) => {
    if (value === null || value === undefined) return 0;
    return typeof value === "object" && "toNumber" in value ? value.toNumber() : Number(value);
};

const PAYMENT_LABELS: Record<string, string> = {
    CREDIT_CARD: "Kredi Kartı",
    BANK_TRANSFER: "Havale / EFT",
    CURRENT_ACCOUNT: "Cari Hesap",
    CASH_ON_DELIVERY: "Kapıda Ödeme",
};

// Sistemin nota eklediği satırlar ([Sistem Notu: ...], PayTR hata mesajı) müşteri notu değildir
function customerNote(notes?: string | null) {
    if (!notes) return "";
    return notes
        .replace(/\[Sistem Notu:[^\]]*\]/g, "")
        .replace(/\|?\s*PayTR Hatası:[^|]*/g, "")
        .trim();
}

/**
 * Sipariş bilgi fişi (A4, kompakt). Tekli ve toplu yazdırma aynı şablonu kullanır.
 * Önceki tasarımda büyük logo/başlık, tekrar eden müşteri bilgileri, ürün başına iki satır ve geniş boşluklar
 * yüzünden çok ürünlü siparişler birkaç sayfaya taşıyordu; artık bir A4'e ~40 ürün sığar.
 * Hazırlık için: stok kodu ve kontrol kutusu sütunu, sipariş no barkodu.
 */
export function OrderPrintSheet({ order, settings }: { order: any; settings: any }) {
    const addr = (order.shippingAddress || {}) as any;
    const name = addr.name || addr.fullName || order.user?.companyName || order.user?.name || order.user?.email || order.guestEmail || "Misafir";
    const phone = addr.phone || order.user?.phone || "";
    const email = order.user?.email || order.guestEmail || "";
    // 11 haneli TC kimlik no basılmaz (KVKK); firma vergi no (10 hane) basılır
    const taxDigits = String(addr.taxNumber || "").replace(/\D/g, "");
    const note = customerNote(order.notes);
    const items: any[] = order.items || [];
    const itemsTotal = items.reduce((s, it) => s + toNumber(it.lineTotal), 0);
    const quantityTotal = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
    const discount = toNumber(order.discountAmount);
    const shipping = toNumber(order.shippingCost);
    const havale = /Havale İndirimi/i.test(order.notes || "");

    return (
        <div className="order-sheet text-black text-[11px] leading-snug">
            {/* Üst satır: firma (solda), fiş başlığı + sipariş no + barkod (sağda) */}
            <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-2">
                <div className="flex items-center gap-3 min-w-0">
                    {settings.logoUrl && (
                        // Baskıda güvenilir olsun diye düz img
                        <img src={settings.logoUrl} alt="" className="h-9 w-auto object-contain shrink-0" />
                    )}
                    <div className="min-w-0">
                        <p className="text-[13px] font-bold">{settings.companyName || settings.siteName || ""}</p>
                        <p className="text-[9.5px] text-gray-600 leading-tight">
                            {[settings.address, settings.phone, settings.email].filter(Boolean).join(" · ")}
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3 shrink-0">
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Sipariş Bilgi Fişi</p>
                        <p className="text-[15px] font-extrabold">#{order.orderNumber}</p>
                        <p className="text-[10px] text-gray-600">{formatDate(order.createdAt)}</p>
                    </div>
                    <Barcode value={order.orderNumber} width={1.1} height={34} displayValue={false} />
                </div>
            </div>

            {/* Alıcı + sipariş bilgileri: tek kutu, iki sütun (önceden müşteri ve teslimat ayrı ayrı, tekrar ediyordu) */}
            <div className="mt-2 grid grid-cols-[1.4fr_1fr] border border-black">
                <div className="p-2 border-r border-black">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Alıcı / Teslimat</p>
                    <p className="text-[12.5px] font-extrabold uppercase">{name}</p>
                    <p>{addr.address || order.user?.address || "-"}</p>
                    <p className="font-bold uppercase">
                        {[addr.district || order.user?.district, addr.city || order.user?.city].filter(Boolean).join(" / ")}
                    </p>
                    <p className="mt-0.5">
                        {phone && <span className="font-bold">Tel: {phone}</span>}
                        {phone && email && <span className="text-gray-500"> · </span>}
                        {email && <span className="text-gray-600">{email}</span>}
                    </p>
                    {taxDigits.length === 10 && <p>Vergi No: {taxDigits}</p>}
                </div>
                <div className="p-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 content-start">
                    <span className="text-gray-500">Ödeme:</span>
                    <span className="font-bold">{PAYMENT_LABELS[order.payment?.method] || "-"}</span>
                    <span className="text-gray-500">Kargo:</span>
                    <span className="font-bold">{order.cargoCompany || "-"}</span>
                    <span className="text-gray-500">Ürün:</span>
                    <span className="font-bold">{items.length} kalem · {quantityTotal} adet</span>
                </div>
            </div>

            {note && (
                <div className="mt-2 border border-black px-2 py-1">
                    <span className="font-bold">Müşteri notu: </span>
                    <span className="whitespace-pre-wrap">{note}</span>
                </div>
            )}

            {/* Ürünler: tek satır/ürün; sayfaya sığmazsa başlık satırı sonraki sayfada tekrar eder */}
            <table className="mt-2 w-full border-collapse leading-tight [&_td]:py-[3px]">
                <thead>
                    <tr className="border-y border-black text-[9.5px] uppercase tracking-wide">
                        <th className="py-1 pr-1 text-left w-6">#</th>
                        <th className="py-1 pr-2 text-left">Ürün</th>
                        <th className="py-1 pr-2 text-left w-[110px]">Stok Kodu</th>
                        <th className="py-1 pr-2 text-center w-10">Adet</th>
                        <th className="py-1 pr-2 text-right w-[72px]">Birim</th>
                        <th className="py-1 pr-2 text-right w-[80px]">Tutar</th>
                        <th className="py-1 text-center w-6" title="Hazırlandı">✓</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={item.id} className="border-b border-gray-300 align-top break-inside-avoid">
                            <td className="py-1 pr-1 text-gray-500">{i + 1}</td>
                            <td className="py-1 pr-2">
                                <span className="font-semibold">{item.productName}</span>
                                {item.variantInfo && <span className="text-gray-600"> · {item.variantInfo}</span>}
                            </td>
                            <td className="py-1 pr-2 font-mono text-[10px]">{item.variant?.sku || item.product?.sku || "-"}</td>
                            <td className={`py-1 pr-2 text-center ${item.quantity > 1 ? "font-extrabold" : "font-semibold"}`}>{item.quantity}</td>
                            <td className="py-1 pr-2 text-right">{formatPrice(toNumber(item.unitPrice))}</td>
                            <td className="py-1 pr-2 text-right font-semibold">{formatPrice(toNumber(item.lineTotal))}</td>
                            <td className="py-1 text-center">
                                <span className="inline-block w-3 h-3 border border-black align-middle" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Tutarlar: ürün toplamı KDV dahil; önceki "Ara Toplam" KDV hariç ve indirim sonrasıydı, kafa karıştırıyordu */}
            <div className="mt-2 flex justify-end break-inside-avoid">
                <div className="w-60 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
                    <span className="text-gray-600">Ürünler (KDV dahil)</span>
                    <span className="text-right">{formatPrice(itemsTotal)}</span>
                    {discount > 0 && (
                        <>
                            <span className="text-gray-600">{havale ? "Havale indirimi" : "İndirim"}</span>
                            <span className="text-right">-{formatPrice(discount)}</span>
                        </>
                    )}
                    {shipping > 0 && (
                        <>
                            <span className="text-gray-600">Kargo</span>
                            <span className="text-right">{formatPrice(shipping)}</span>
                        </>
                    )}
                    <span className="text-gray-600">KDV (dahil)</span>
                    <span className="text-right">{formatPrice(toNumber(order.vatAmount))}</span>
                    <span className="mt-0.5 border-t border-black pt-0.5 text-[13px] font-extrabold">GENEL TOPLAM</span>
                    <span className="mt-0.5 border-t border-black pt-0.5 text-right text-[13px] font-extrabold">{formatPrice(toNumber(order.total))}</span>
                </div>
            </div>

            <p className="mt-3 border-t border-dashed border-gray-400 pt-1 text-center text-[9px] text-gray-500">
                Bu belge sipariş bilgi ve kontrol fişidir, fatura niteliği taşımaz. Bizi tercih ettiğiniz için teşekkür ederiz.
            </p>
        </div>
    );
}

// Yazdırma sayfası ayarları: A4, dar kenar boşluğu, admin arayüzü gizli
export const PRINT_CSS = `
    @media print {
        @page { size: A4; margin: 8mm; }
        body { -webkit-print-color-adjust: exact; background-color: white !important; }
        .no-print, header, aside { display: none !important; }
        .lg\\:pl-64, .admin-content { padding-left: 0 !important; }
        main { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
        .print-page-break { break-after: page; }
        thead { display: table-header-group; }
        tr { break-inside: avoid; }
    }
`;
