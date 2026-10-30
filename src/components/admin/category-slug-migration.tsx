"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { applyCategorySlugMap } from "@/app/admin/(protected)/categories/actions";

/** Tek seferlik kategori adresi güncellemesi; eski adresli kategori kalmayınca görünmez */
export function CategorySlugMigration({ pending }: { pending: number }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    if (pending <= 0) return null;

    const run = async () => {
        if (!confirm(`${pending} kategorinin adresi yeni (düzgün Türkçe, model adlı) adrese geçirilecek. Eski adresler otomatik yönlendirilir. Devam edilsin mi?`)) return;
        setLoading(true);
        try {
            const r = await applyCategorySlugMap();
            toast.success(`${r.updated} kategori adresi güncellendi${r.links ? `, ${r.links} slider/banner linki düzeltildi` : ""}.`);
            if (r.skipped.length) toast.warning(`Atlanan (yeni adres dolu): ${r.skipped.join(", ")}`);
            router.refresh();
        } catch (e: any) {
            toast.error(e?.message || "Güncelleme başarısız.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
            <div className="text-sm text-amber-900 dark:text-amber-200">
                <p className="font-semibold">{pending} kategorinin adresi eski biçimde</p>
                <p className="text-xs mt-0.5">
                    Örn. <code>n-dzen-grubu-17</code> → <code>lada-samara-1500i-on-duzen-grubu</code>. Tek seferlik işlemdir; eski adresler yeni adrese yönlendirilir.
                </p>
            </div>
            <Button onClick={run} disabled={loading} className="shrink-0 bg-[#009AD0] hover:bg-[#00739C] text-white gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Adresleri güncelle
            </Button>
        </div>
    );
}
