"use client";

import { useState, useEffect } from "react";
import { getGeminiConfig, saveGeminiConfig } from "./actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Brain, Save, ExternalLink, Zap, Globe } from "lucide-react";

export default function GeminiIntegrationPage() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [provider, setProvider] = useState<string>("GEMINI");

    useEffect(() => {
        getGeminiConfig().then(res => {
            if (res.success && res.data) {
                setConfig(res.data);
                setProvider(res.data.provider || "GEMINI");
            }
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
                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                    <Brain className="w-7 h-7" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yapay Zeka (AI) Entegrasyonu</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ürün açıklamalarınızı otomatik oluşturmak için AI sağlayıcınızı yönetin.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card className="border-indigo-100 dark:border-indigo-900/30 overflow-hidden shadow-sm">
                    <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b">
                        <CardTitle className="text-lg">Sağlayıcı Ayarları</CardTitle>
                        <CardDescription>Hangi yapay zeka servisini kullanmak istediğinizi seçin.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                        
                        {/* Status Switch */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Entegrasyon Durumu</Label>
                                <p className="text-xs text-gray-500">AI servislerini tüm sitede aktif veya pasif hale getirin.</p>
                            </div>
                            <Switch 
                                name="isActive" 
                                defaultChecked={config?.isActive} 
                            />
                        </div>

                        {/* Provider Selection */}
                        <div className="space-y-4">
                            <Label className="text-sm font-bold">Yapay Zeka Sağlayıcısı</Label>
                            <RadioGroup 
                                name="provider" 
                                value={provider} 
                                onValueChange={setProvider}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <div>
                                    <RadioGroupItem value="GEMINI" id="gemini" className="peer sr-only" />
                                    <Label
                                        htmlFor="gemini"
                                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:bg-indigo-50/50 dark:peer-data-[state=checked]:bg-indigo-900/20 peer-data-[state=checked]:text-indigo-600 cursor-pointer transition-all"
                                    >
                                        <Globe className="mb-3 h-6 w-6" />
                                        <div className="text-center">
                                            <div className="font-bold">Google Gemini</div>
                                            <div className="text-[10px] text-muted-foreground mt-1">Hızlı ve Geniş Ücretsiz Katman</div>
                                        </div>
                                    </Label>
                                </div>

                                <div>
                                    <RadioGroupItem value="OPENROUTER" id="openrouter" className="peer sr-only" />
                                    <Label
                                        htmlFor="openrouter"
                                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-600 peer-data-[state=checked]:bg-purple-50/50 dark:peer-data-[state=checked]:bg-purple-900/20 peer-data-[state=checked]:text-purple-600 cursor-pointer transition-all"
                                    >
                                        <Zap className="mb-3 h-6 w-6" />
                                        <div className="text-center">
                                            <div className="font-bold">OpenRouter</div>
                                            <div className="text-[10px] text-muted-foreground mt-1">Llama 3, Mistral, Qwen vb. Çoklu Model</div>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* API Key Fields based on provider */}
                        <div className="space-y-6 pt-4 border-t">
                            {provider === "GEMINI" ? (
                                <div className="space-y-4 animate-in slide-in-from-left duration-300">
                                    <div className="space-y-2">
                                        <Label htmlFor="apiKey" className="text-sm font-medium">Gemini API Key *</Label>
                                        <Input
                                            id="apiKey"
                                            name="apiKey"
                                            type="password"
                                            defaultValue={config?.apiKey || ""}
                                            placeholder="AIzaSy..."
                                            className="font-mono"
                                        />
                                        <p className="text-[11px] text-gray-500">
                                            <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
                                                Google AI Studio'dan anahtar alın <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                                    <div className="space-y-2">
                                        <Label htmlFor="openRouterApiKey" className="text-sm font-medium">OpenRouter API Key *</Label>
                                        <Input
                                            id="openRouterApiKey"
                                            name="openRouterApiKey"
                                            type="password"
                                            defaultValue={config?.openRouterApiKey || ""}
                                            placeholder="sk-or-v1-..."
                                            className="font-mono bg-purple-50/10 border-purple-100"
                                        />
                                        <p className="text-[11px] text-gray-500">
                                            <a href="https://openrouter.ai/keys" target="_blank" className="text-purple-600 hover:underline inline-flex items-center gap-1">
                                                OpenRouter'dan anahtar alın <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="openRouterModel" className="text-sm font-medium">Model Belirleyin</Label>
                                        <Input
                                            id="openRouterModel"
                                            name="openRouterModel"
                                            type="text"
                                            defaultValue={config?.openRouterModel || "qwen/qwen-3.6-plus"}
                                            placeholder="örn: meta-llama/llama-3-8b-instruct"
                                        />
                                        <p className="text-[10px] text-gray-500 italic">
                                            * Ücretsiz modeller için "free" etiketli olanları kullanabilirsiniz.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]">
                                {saving ? "Kaydediliyor..." : <><Save className="w-4 h-4 mr-2" /> Ayarları Kaydet</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
