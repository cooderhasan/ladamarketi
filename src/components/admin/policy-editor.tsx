"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePolicy } from "@/app/actions/policy";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

interface Policy {
    slug: string;
    title: string;
    content: string;
}

export function PolicyEditor({ policy }: { policy: Policy }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(policy.title);
    const [content, setContent] = useState(policy.content);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await updatePolicy(policy.slug, title, content);
            if (result.success) {
                toast.success("Politika güncellendi");
                router.refresh();
                router.push("/admin/policies");
            } else {
                toast.error(result.error || "Güncelleme başarısız");
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <div className="space-y-2">
                <Label htmlFor="title">Başlık</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>İçerik</Label>
                <RichTextEditor
                    content={content}
                    onChange={setContent}
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                >
                    İptal
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? "Kaydediliyor..." : "Kaydet"}
                </Button>
            </div>
        </form>
    );
}
