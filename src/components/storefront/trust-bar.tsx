import { Truck, ShieldCheck, Landmark, Award, MessageCircle } from "lucide-react";

interface TrustBarProps {
    // Ayarlar > Ödeme > Havale indirim oranı ("0" ise havale kartı yerine tecrübe kartı)
    bankTransferDiscountRate?: string | number;
}

// Güven çubuğu: tek renk (marka mavisi) kartlar. Önceden mavi/yeşil/mor ikonlar ve gerçeğe uymayan "7/24 Destek" vardı.
export function TrustBar({ bankTransferDiscountRate }: TrustBarProps) {
    const havale = Number(bankTransferDiscountRate || 0);

    const items = [
        { icon: Truck, title: "Aynı Gün Kargo", text: "14:00'e kadar verilen siparişlerde" },
        { icon: ShieldCheck, title: "Güvenli Ödeme", text: "PayTR güvencesiyle kartla ödeme" },
        havale > 0
            ? { icon: Landmark, title: `Havalede %${havale} İndirim`, text: "Havale / EFT ile ödemelerde" }
            : { icon: Award, title: "15 Yıllık Tecrübe", text: "Lada yedek parçada uzman" },
        { icon: MessageCircle, title: "WhatsApp Destek", text: "Doğru parça için bize yazın" },
    ];

    return (
        <section aria-label="Alışveriş avantajları" className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
            {items.map(({ icon: Icon, title, text }) => (
                <div
                    key={title}
                    className="flex items-center gap-2.5 md:gap-3 rounded-2xl bg-white dark:bg-gray-800 ring-1 ring-gray-200/70 dark:ring-gray-700 p-3 md:p-4"
                >
                    <div className="shrink-0 w-9 h-9 md:w-11 md:h-11 rounded-xl bg-[#009AD0]/10 dark:bg-sky-900/30 flex items-center justify-center">
                        <Icon className="h-[18px] w-[18px] md:h-5 md:w-5 text-[#00739C] dark:text-[#4cc3ec]" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-[12px] md:text-sm leading-tight">{title}</p>
                        <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5">{text}</p>
                    </div>
                </div>
            ))}
        </section>
    );
}
