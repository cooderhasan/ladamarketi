"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { registerUser } from "@/app/register/actions";

interface RegisterFormProps {
    logoUrl?: string;
    siteName?: string;
}

export function RegisterForm({ logoUrl, siteName }: RegisterFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isCorporate, setIsCorporate] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            await registerUser(formData);
            setSuccess(true);
            toast.success("Kayıt başarılı! Yönlendiriliyorsunuz...");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="w-full max-w-lg shadow-xl border-green-200 bg-white/95 backdrop-blur">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl text-green-700">Kayıt Başarılı</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6 pt-4">
                    <div className="space-y-4 text-gray-600 dark:text-gray-300">
                        {isCorporate ? (
                            <>
                                <p className="text-lg font-medium">
                                    Bayilik başvurunuz alınmıştır.
                                </p>
                                <p>
                                    Bayiliğiniz yönetici tarafından onaylandıktan sonra
                                    sisteme giriş yapıp sipariş verebilirsiniz.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-lg font-medium">
                                    Hesabınız başarıyla oluşturuldu.
                                </p>
                                <p>
                                    Şimdi giriş yaparak alışverişe başlayabilirsiniz.
                                </p>
                            </>
                        )}
                    </div>

                    <div className="pt-4">
                        <Link href="/login">
                            <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                                Giriş Yap
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden relative shadow-md">
                    {logoUrl ? (
                        <Image
                            src={logoUrl}
                            alt={siteName || "Logo"}
                            fill
                            className="object-contain p-2 bg-white"
                        />
                    ) : (
                        <span className="text-white font-bold text-2xl">
                            {(siteName || "M").charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <CardTitle className="text-2xl">Üye Kaydı</CardTitle>
                <CardDescription>
                    {isCorporate
                        ? "Bayi olmak için formu doldurun, onay sonrası giriş yapabilirsiniz."
                        : "Alışverişe başlamak için hemen üye olun."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4 p-3 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="isCorporate"
                            checked={isCorporate}
                            onChange={(e) => setIsCorporate(e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded"
                        />
                        <Label htmlFor="isCorporate" className="cursor-pointer font-medium">
                            Kurumsal Üyelik Yapmak İstiyorum (Bayi)
                        </Label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta *</Label>
                            <Input id="email" name="email" type="email" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon *</Label>
                            <Input id="phone" name="phone" type="tel" required />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="password">Şifre *</Label>
                            <Input id="password" name="password" type="password" minLength={6} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Şifre Tekrar *</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" minLength={6} required />
                        </div>
                    </div>

                    {isCorporate && (
                        <div className="space-y-4 pt-2 border-t mt-2">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Firma Adı *</Label>
                                <Input id="companyName" name="companyName" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxNumber">Vergi Numarası *</Label>
                                <Input id="taxNumber" name="taxNumber" minLength={10} maxLength={11} required />
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                        <div className="space-y-2">
                            <Label htmlFor="city">Şehir *</Label>
                            <Input id="city" name="city" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="district">İlçe *</Label>
                            <Input id="district" name="district" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Adres *</Label>
                        <Textarea id="address" name="address" rows={2} required />
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                        {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-500">Zaten hesabınız var mı? </span>
                    <Link href="/login" className="text-blue-600 hover:underline">
                        Giriş Yap
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
