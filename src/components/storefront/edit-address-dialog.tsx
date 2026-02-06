"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAddress } from "@/app/(storefront)/account/actions";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface EditAddressDialogProps {
    initialData: {
        address?: string | null;
        city?: string | null;
        district?: string | null;
        phone?: string | null;
    };
}

export function EditAddressDialog({ initialData }: EditAddressDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const result = await updateAddress(formData);
        setLoading(false);

        if (result.success) {
            toast.success("Adres başarıyla güncellendi.");
            setOpen(false);
        } else {
            toast.error(result.error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    <Pencil className="w-3 h-3 mr-2" />
                    Düzenle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adres Düzenle</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">Şehir</Label>
                        <Input
                            id="city"
                            name="city"
                            defaultValue={initialData.city || ""}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="district">İlçe</Label>
                        <Input
                            id="district"
                            name="district"
                            defaultValue={initialData.district || ""}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Adres</Label>
                        <Textarea
                            id="address"
                            name="address"
                            defaultValue={initialData.address || ""}
                            required
                            rows={3}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input
                            id="phone"
                            name="phone"
                            defaultValue={initialData.phone || ""}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
