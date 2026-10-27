import Link from "next/link";
import { ArrowRight, Award, Boxes, MapPin, Truck } from "lucide-react";

interface WhyUsProps {
    productCount: number;
}

// 1.234 -> "1.200+": sayı her ürün eklendiğinde değişmesin, yuvarlak dursun
function roundedCount(n: number) {
    if (n < 100) return String(n);
    const step = n >= 1000 ? 100 : 50;
    return `${(Math.floor(n / step) * step).toLocaleString("tr-TR")}+`;
}

// Ana sayfanın kapanışı: "Neden Lada Marketi". Ürün sayısı veritabanından (aktif ürünler).
export function WhyUs({ productCount }: WhyUsProps) {
    const stats = [
        { icon: Award, value: "15 Yıl", label: "Lada yedek parça tecrübesi" },
        { icon: Boxes, value: roundedCount(productCount), label: "Ürün çeşidi" },
        { icon: Truck, value: "14:00", label: "Saatine kadar aynı gün kargo" },
        { icon: MapPin, value: "81 İl", label: "Konya'dan Türkiye geneline gönderim" },
    ];

    return (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0088bb] via-[#00739C] to-[#003a52] px-5 py-8 sm:px-8 md:px-12 md:py-12 text-white shadow-lg shadow-[#00739C]/20">
            {/* Arka planda hafif ışık ve ızgara: düz renk blok gibi durmasın */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:28px_28px]" />

            <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="h-px w-6 bg-white/60" />
                        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
                            Neden Lada Marketi
                        </span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
                        15 yıldır Lada sahiplerinin parça adresi
                    </h2>
                    <p className="mt-3 md:mt-4 text-sm md:text-base text-white/80 leading-relaxed max-w-xl">
                        Niva&apos;dan Samara&apos;ya, Vega&apos;dan Kalina&apos;ya aracınıza uyan parçayı biliyoruz.
                        Emin olamadığınız parçayı sipariş vermeden önce bize sorun; doğru parçayı birlikte bulalım.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/products"
                            className="group/cta inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#00739C] shadow-md hover:bg-white/90 transition-colors"
                        >
                            Tüm Ürünler
                            <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/30 hover:bg-white/20 transition-colors"
                        >
                            Bize Ulaşın
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {stats.map(({ icon: Icon, value, label }) => (
                        <div key={label} className="rounded-2xl bg-white/10 ring-1 ring-inset ring-white/15 backdrop-blur-sm p-4 md:p-5">
                            <Icon className="h-5 w-5 md:h-6 md:w-6 text-white/80 mb-3" strokeWidth={1.75} />
                            <p className="text-2xl md:text-3xl font-extrabold tracking-tight">{value}</p>
                            <p className="mt-1 text-[11px] md:text-sm text-white/75 leading-snug">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
