"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFaturikaReadiness, saveFaturikaCarriers } from "@/app/admin/(protected)/settings/faturika-actions";
import type { FaturikaReadiness } from "@/services/faturika/api";
import type { FaturikaCarriers } from "@/services/faturika/carriers";

interface FaturikaSettingsCardProps {
    cargoNames: string[];
    initialCarriers: FaturikaCarriers;
    carriersSaved: boolean;
}

export function FaturikaSettingsCard({ cargoNames, initialCarriers, carriersSaved }: FaturikaSettingsCardProps) {
    const [readiness, setReadiness] = useState<FaturikaReadiness | null>(null);
    const [checking, setChecking] = useState(true);

    const refresh = useCallback(async () => {
        setChecking(true);
        try {
            setReadiness(await getFaturikaReadiness());
        } catch {
            setReadiness({ configured: false, mode: "draft", error: "Durum okunamadı. Sayfayı yenileyin." });
        } finally {
            setChecking(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <div className="space-y-6">
            <FaturikaReadinessPanel readiness={readiness} checking={checking} onRefresh={refresh} />
            <FaturikaCarriersForm
                cargoNames={cargoNames}
                initialCarriers={initialCarriers}
                carriersSaved={carriersSaved}
            />
        </div>
    );
}

interface FaturikaReadinessPanelProps {
    readiness: FaturikaReadiness | null;
    checking: boolean;
    onRefresh: () => void;
}

export function FaturikaReadinessPanel({ readiness, checking, onRefresh }: FaturikaReadinessPanelProps) {
    const account = readiness?.account;

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1.5">
                    <CardTitle>e-Fatura Bağlantısı</CardTitle>
                    <CardDescription>Faturika hesabının fatura kesmeye hazır olup olmadığını gösterir.</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={checking}>
                    {checking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Yenile
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {!readiness ? (
                    <p className="text-sm text-gray-500">Kontrol ediliyor...</p>
                ) : (
                    <>
                        {readiness.error && <Notice tone="error">{readiness.error}</Notice>}
                        {!readiness.configured && !readiness.error && (
                            <Notice tone="warning">
                                API anahtarı tanımlı değil. Faturika panelinden oluşturulan anahtar Coolify&apos;a
                                FATURIKA_API_KEY olarak eklenince bağlantı açılır.
                            </Notice>
                        )}

                        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                            <Fact label="Mod" value={readiness.mode === "live" ? "Canlı" : "Taslak (fatura gönderilmez)"} />
                            <Fact label="Firma" value={account?.legal_name ?? "-"} />
                            <Fact label="Kontör" value={account ? String(account.credits.balance) : "-"} />
                            <Fact label="Durum" value={account ? (account.ready ? "Hazır" : "Hazır değil") : "-"} />
                        </dl>

                        {account?.ready && (
                            <Notice tone="success">Hesap fatura göndermeye hazır.</Notice>
                        )}
                        {account?.blockers.map((blocker) => (
                            <Notice key={`${blocker.code}-${blocker.scope}`} tone="warning">
                                {blocker.message}
                            </Notice>
                        ))}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function Fact({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="font-medium break-words">{value}</dd>
        </div>
    );
}

const NOTICE_STYLES = {
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900/40 dark:text-green-300",
    warning: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-300",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-300",
};

function Notice({ tone, children }: { tone: keyof typeof NOTICE_STYLES; children: React.ReactNode }) {
    const Icon = tone === "success" ? CheckCircle2 : TriangleAlert;
    return (
        <p className={`flex items-start gap-2 rounded-md border p-3 text-sm ${NOTICE_STYLES[tone]}`}>
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{children}</span>
        </p>
    );
}

export function FaturikaCarriersForm({ cargoNames, initialCarriers, carriersSaved }: FaturikaSettingsCardProps) {
    const [carriers, setCarriers] = useState(initialCarriers);
    const [saved, setSaved] = useState(carriersSaved);
    const [saving, setSaving] = useState(false);

    const update = (cargoName: string, field: "title" | "vkn", value: string) => {
        setCarriers((current) => ({
            ...current,
            [cargoName]: { ...(current[cargoName] ?? { title: "", vkn: "" }), [field]: value },
        }));
    };

    const save = async () => {
        setSaving(true);
        try {
            const result = await saveFaturikaCarriers(carriers);
            if (result.success) {
                setSaved(true);
                toast.success("Kargo bilgileri kaydedildi.");
            } else {
                toast.error(result.error || "Kaydedilemedi.");
            }
        } catch {
            toast.error("Kaydedilemedi.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Faturadaki Kargo Bilgileri</CardTitle>
                <CardDescription>
                    İnternet satışı faturasında taşıyıcının resmî unvanı ve VKN&apos;si zorunludur. Bilgisi girilmeyen
                    kargo firmasıyla gelen siparişe fatura kesilmez.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!saved && (
                    <Notice tone="warning">Önerilen bilgiler dolduruldu. Geçerli olması için Kaydet&apos;e basın.</Notice>
                )}
                {cargoNames.length === 0 && <p className="text-sm text-gray-500">Kargo firması tanımlı değil.</p>}
                {cargoNames.map((cargoName) => (
                    <div key={cargoName} className="grid grid-cols-1 gap-3 rounded-lg border p-3 md:grid-cols-[10rem_1fr_11rem] md:items-end">
                        <p className="text-sm font-medium md:pb-2">{cargoName}</p>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Resmî Unvan</Label>
                            <Input
                                value={carriers[cargoName]?.title ?? ""}
                                maxLength={180}
                                onChange={(e) => update(cargoName, "title", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">VKN</Label>
                            <Input
                                value={carriers[cargoName]?.vkn ?? ""}
                                inputMode="numeric"
                                maxLength={11}
                                onChange={(e) => update(cargoName, "vkn", e.target.value.replace(/\D/g, ""))}
                            />
                        </div>
                    </div>
                ))}
                {cargoNames.length > 0 && (
                    <div className="flex justify-end">
                        <Button type="button" onClick={save} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Kaydet
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
