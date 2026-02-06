"use client";

import { useRouter } from "next/navigation";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createCargoCompany, toggleCargoCompany, deleteCargoCompany } from "@/app/admin/(protected)/cargo-companies/actions";
import { Trash2, Loader2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";

interface CargoCompany {
    id: string;
    name: string;
    isActive: boolean;
}

interface CargoSettingsProps {
    initialCompanies: CargoCompany[];
}

export function CargoSettings({ initialCompanies }: CargoSettingsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleAdd(formData: FormData) {
        setLoading(true);
        const result = await createCargoCompany(formData);

        if (result.success) {
            toast.success("Kargo firması eklendi.");
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    }

    async function handleToggle(id: string, currentState: boolean) {
        const result = await toggleCargoCompany(id, currentState);
        if (result.success) {
            toast.success("Durum güncellendi.");
            router.refresh();
        } else {
            toast.error(result.error);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;

        const result = await deleteCargoCompany(id);
        if (result.success) {
            toast.success("Kargo firması silindi.");
            router.refresh();
        } else {
            toast.error(result.error);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kargo Firmaları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    {initialCompanies.map(company => (
                        <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-800">
                            <span className="font-medium">{company.name}</span>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={company.isActive}
                                        onCheckedChange={() => handleToggle(company.id, company.isActive)}
                                    />
                                    <span className="text-sm text-gray-500">{company.isActive ? 'Aktif' : 'Pasif'}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(company.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {initialCompanies.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                            Henüz kargo firması eklenmemiş.
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Yeni Kargo Firması Ekle</h4>
                    <form action={handleAdd} className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                name="name"
                                placeholder="Örn: Aras Kargo, Yurtiçi Kargo"
                                required
                            />
                        </div>
                        <Input type="hidden" name="isActive" value="on" />
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            <span className="ml-2 hidden sm:inline">Ekle</span>
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
