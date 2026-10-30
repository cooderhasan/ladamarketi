"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Merge } from "lucide-react";
import { toast } from "sonner";
import { applyCategoryMerges } from "@/app/admin/(protected)/categories/actions";

/** Tek seferlik kategori birleştirme; birleştirilecek kategori kalmayınca görünmez */
export function CategoryMergeNotice({ pending }: { pending: { from: string; into: string; name: string }[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    if (pending.length === 0) return null;

    const run = async () => {
        if (!confirm("Aynı adlı alt kategori üstteki kategoriyle birleştirilecek: ürünleri ve alt grupları üste taşınır, alttaki pasif yapılır. Devam edilsin mi?")) return;
        setLoading(true);
        try {
            const r = await applyCategoryMerges();
            const msg = r.results.map((x) => `${x.from} → ${x.into}: ${x.products} ürün eklendi, ${x.groups} alt grup taşındı`).join("; ");
            toast.success(msg || "Birleştirilecek kategori kalmadı.");
            router.refresh();
        } catch (e: any) {
            toast.error(e?.message || "Birleştirme başarısız.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
            <div className="text-sm text-amber-900 dark:text-amber-200">
                <p className="font-semibold">Aynı adlı iç içe kategori: {pending.map((p) => p.name).join(", ")}</p>
                <p className="text-xs mt-0.5">
                    {pending.map((p) => `${p.from} → ${p.into}`).join(", ")}. Ürünler ve alt gruplar üstteki kategoriye taşınır; alttaki silinmez, pasif yapılır ve adresi yönlendirilir.
                </p>
            </div>
            <Button onClick={run} disabled={loading} className="shrink-0 bg-[#009AD0] hover:bg-[#00739C] text-white gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Merge className="w-4 h-4" />}
                Birleştir
            </Button>
        </div>
    );
}
