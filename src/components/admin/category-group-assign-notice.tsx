"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { applyGroupAssignments } from "@/app/admin/(protected)/categories/actions";

/** Tek seferlik alt grup ataması; eklenecek ürün kalmayınca görünmez */
export function CategoryGroupAssignNotice({ pending }: { pending: number }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    if (pending <= 0) return null;

    const run = async () => {
        if (!confirm(`${pending} ürün-alt grup eşleşmesi eklenecek. Ürünler ana kategorilerinde kalır, sadece önerilen alt gruba da eklenir. Devam edilsin mi?`)) return;
        setLoading(true);
        try {
            const r = await applyGroupAssignments();
            toast.success(`${r.added} ürün ${r.groups} alt gruba eklendi${r.missing ? ` (${r.missing} ürün bulunamadı, atlandı)` : ""}.`);
            router.refresh();
        } catch (e: any) {
            toast.error(e?.message || "İşlem başarısız.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
            <div className="text-sm text-amber-900 dark:text-amber-200">
                <p className="font-semibold">Alt grubu eksik ürünler: {pending} eşleşme</p>
                <p className="text-xs mt-0.5">Onaylanan öneriler (alt_grup_onerileri.csv: YÜKSEK + ORTA). Ürünler ana kategoride kalır, Motor Aksamı / Fren Grubu gibi alt gruplara da eklenir.</p>
            </div>
            <Button onClick={run} disabled={loading} className="shrink-0 bg-[#009AD0] hover:bg-[#00739C] text-white gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderTree className="w-4 h-4" />}
                Alt gruplara ekle
            </Button>
        </div>
    );
}
