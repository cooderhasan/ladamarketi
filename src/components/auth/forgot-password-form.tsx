"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, CheckCircle2, Send } from "lucide-react";

interface ForgotPasswordFormProps {
    logoUrl?: string;
    siteName?: string;
}

export function ForgotPasswordForm({ logoUrl, siteName }: ForgotPasswordFormProps) {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSent(true);
            } else {
                toast.error(data.error || "Bir hata oluştu.");
            }
        } catch {
            toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md relative">
            {/* Glass Card */}
            <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-[#009AD0] to-[#007EA8] px-8 py-10 text-center">
                    {/* Logo */}
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition-transform overflow-hidden relative">
                        {logoUrl ? (
                            <Image
                                src={logoUrl}
                                alt={siteName || "Logo"}
                                fill
                                className="object-contain p-2"
                            />
                        ) : (
                            <span className="text-[#009AD0] font-black text-3xl">
                                {(siteName || "L").charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">
                        Şifre Sıfırlama
                    </h1>
                    <p className="text-blue-100 text-sm">
                        {sent ? "E-postanızı kontrol edin" : "E-posta adresinizi girin"}
                    </p>
                </div>

                {/* Form / Success Section */}
                <div className="px-8 py-8">
                    {sent ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    Sıfırlama E-postası Gönderildi
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-medium text-[#009AD0]">{email}</span> adresine şifre sıfırlama bağlantısı gönderdik. E-postanızı kontrol edin ve spam klasörünü de incelemeyi unutmayın.
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Bağlantı 1 saat geçerlidir.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full mt-4"
                                onClick={() => { setSent(false); setEmail(""); }}
                            >
                                Farklı E-posta ile Dene
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                Hesabınıza kayıtlı e-posta adresinizi girin. Şifre sıfırlama bağlantısı göndereceğiz.
                            </p>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-[#009AD0]" />
                                    E-posta Adresi
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="ornek@firma.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 pl-4 pr-4 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#009AD0]/20 focus:border-[#009AD0] transition-all"
                                />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-[#009AD0] to-[#007EA8] hover:from-[#007EA8] hover:to-[#006282] text-white font-semibold rounded-xl shadow-lg shadow-[#009AD0]/25 hover:shadow-[#009AD0]/40 transition-all duration-300 flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5" />
                                        Sıfırlama Bağlantısı Gönder
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#009AD0] transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Giriş sayfasına dön
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
