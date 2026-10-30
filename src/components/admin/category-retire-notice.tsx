"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Archive } from "lucide-react";
import { toast } from "sonner";
import { applyCategoryRetirements } from "@/app/admin/(protected)/categories/actions";

/** Tek seferlik kategori boşaltma ("Home"); boşaltılacak kategori kalmayınca görünmez */
export function CategoryRetireNotice({ pending }: { pending: { slug: string; name: string; count: number }[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    if (pending.length === 0) return null;

    const run = async () => {
        if (!confirm("Kategori boşaltılıp pasif yapılacak. Ürünler asıl kategorilerinde kalır; başka kategorisi olmayan ürüne dokunulmaz. Devam edilsin mi?")) return;
        setLoading(true);
        try {
            const r = await applyCategoryRetirements();
            for (const x of r.results) {
                toast.success(`${x.slug}: ${x.removed} ürün çıkarıldı, ${x.mainFixed} ürünün ana kategorisi düzeltildi${x.deactivated ? ", kategori pasif yapıldı" : ""}.`);
                if (x.orphans.length) toast.warning(`Başka kategorisi olmayan ${x.orphans.length} ürün bırakıldı: ${x.orphans.slice(0, 5).join(", ")}`);
            }
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
                <p className="font-semibold">Eski vitrin kategorisi: {pending.map((p) => `${p.name} (${p.count} ürün)`).join(", ")}</p>
                <p className="text-xs mt-0.5">Ürünlerin hepsi asıl kategorilerinde de var. Boşaltılınca kategori pasif olur, adresi ana sayfaya yönlenir.</p>
            </div>
            <Button onClick={run} disabled={loading} className="shrink-0 bg-[#009AD0] hover:bg-[#00739C] text-white gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                Boşalt
            </Button>
        </div>
    );
}
