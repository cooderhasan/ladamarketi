"use client";

import { useState, useEffect } from "react";
import { getGeminiConfig, saveGeminiConfig } from "./actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Save, ExternalLink } from "lucide-react";

export default function GeminiIntegrationPage() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getGeminiConfig().then(res => {
            if (res.success) setConfig(res.data);
            setLoading(false);
        });
    }, []);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        const formData = new FormData(e.currentTarget);
        const res = await saveGeminiConfig(formData);
        if (res.success) {
            toast.success("Ayarlar başarıyla kaydedildi.");
        } else {
            toast.error(res.error || "Bir hata oluştu.");
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                    <Brain className="w-7 h-7" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Google Gemini AI</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Yapay zeka modellerini kullanarak otomatik ürün açıklamaları oluşturun.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card className="border-indigo-100 dark:border-indigo-900/30 overflow-hidden shadow-sm">
                    <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b">
                        <CardTitle className="text-lg">API Yapılandırması</CardTitle>
                        <CardDescription>Gemini API anahtarınızı buraya ekleyerek AI özelliklerini aktif edin.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Entegrasyon Durumu</Label>
                                    <p className="text-xs text-gray-500">AI servislerini aktif veya pasif hale getirin.</p>
                                </div>
                                <Switch 
                                    name="isActive" 
                                    defaultChecked={config?.isActive} 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="apiKey" className="text-sm font-medium">API Key *</Label>
                                <div className="relative">
                                    <Input
                                        id="apiKey"
                                        name="apiKey"
                                        type="password"
                                        defaultValue={config?.apiKey || ""}
                                        placeholder="AIzaSy..."
                                        required
                                        className="pr-10"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Brain className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                    API anahtarınız yok mu? 
                                    <a 
                                        href="https://aistudio.google.com/app/apikey" 
                                        target="_blank" 
                                        className="text-indigo-600 hover:underline flex items-center gap-0.5"
                                    >
                                        Google AI Studio'dan hemen alın <ExternalLink className="w-3 h-3" />
                                    </a>
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                                {saving ? "Kaydediliyor..." : <><Save className="w-4 h-4 mr-2" /> Ayarları Kaydet</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                            Nasıl Çalışır?
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200 list-disc list-inside">
                            <li>Gemini 1.5 Flash modeli kullanılarak hızlı ve ekonomik içerik üretilir.</li>
                            <li>Toptancı veya rakip sitelerden aldığınız ürün linkleri analiz edilir.</li>
                            <li>Ürün adından ve mevcut bilgilerden SEO uyumlu, tamamen özgün bir açıklama metni sentezlenir.</li>
                            <li>Oluşturulan metin HTML formatında direkt editöre aktarılır.</li>
                        </ul>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
