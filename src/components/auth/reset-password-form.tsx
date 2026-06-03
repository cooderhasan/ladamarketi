"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, ShieldCheck } from "lucide-react";

interface ResetPasswordFormProps {
    logoUrl?: string;
    siteName?: string;
}

export function ResetPasswordForm({ logoUrl, siteName }: ResetPasswordFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const email = searchParams.get("email") || "";

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const passwordStrength = () => {
        if (password.length === 0) return null;
        if (password.length < 6) return { level: "weak", label: "Çok Kısa", color: "bg-red-500" };
        if (password.length < 8) return { level: "fair", label: "Zayıf", color: "bg-orange-500" };
        if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return { level: "strong", label: "Güçlü", color: "bg-green-500" };
        return { level: "medium", label: "Orta", color: "bg-yellow-500" };
    };

    const strength = passwordStrength();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!token || !email) {
            toast.error("Geçersiz sıfırlama bağlantısı. Lütfen tekrar talep edin.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Şifreler eşleşmiyor.");
            return;
        }

        if (password.length < 6) {
            toast.error("Şifre en az 6 karakter olmalıdır.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess(true);
                setTimeout(() => router.push("/login"), 3000);
            } else {
                toast.error(data.error || "Bir hata oluştu.");
            }
        } catch {
            toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div className="w-full max-w-md relative">
                <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-10 text-center">
                        <h1 className="text-2xl font-bold text-white mb-1">Geçersiz Bağlantı</h1>
                    </div>
                    <div className="px-8 py-8 text-center space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.</p>
                        <Link href="/forgot-password">
                            <Button className="w-full bg-gradient-to-r from-[#009AD0] to-[#007EA8] text-white">
                                Yeni Bağlantı İste
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md relative">
            {/* Glass Card */}
            <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-[#009AD0] to-[#007EA8] px-8 py-10 text-center">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden relative">
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
                        Yeni Şifre Belirle
                    </h1>
                    <p className="text-blue-100 text-sm">
                        {success ? "Şifreniz başarıyla güncellendi" : "Güvenli bir şifre oluşturun"}
                    </p>
                </div>

                {/* Form / Success Section */}
                <div className="px-8 py-8">
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                    Şifreniz Güncellendi! 🎉
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Yeni şifreniz başarıyla kaydedildi. Birkaç saniye içinde giriş sayfasına yönlendirileceksiniz.
                                </p>
                            </div>
                            <Link href="/login">
                                <Button className="w-full bg-gradient-to-r from-[#009AD0] to-[#007EA8] text-white rounded-xl h-12">
                                    Giriş Yap
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Display */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 flex items-center gap-3">
                                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                                <span className="text-sm text-blue-800 dark:text-blue-200 truncate">
                                    <span className="font-medium">{email}</span> için şifre sıfırlanıyor
                                </span>
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-[#009AD0]" />
                                    Yeni Şifre
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 pl-4 pr-12 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#009AD0]/20 focus:border-[#009AD0] transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {/* Password strength indicator */}
                                {strength && (
                                    <div className="space-y-1.5">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-300 ${strength.color} ${
                                                    strength.level === "weak" ? "w-1/4" :
                                                    strength.level === "fair" ? "w-2/4" :
                                                    strength.level === "medium" ? "w-3/4" :
                                                    "w-full"
                                                }`}
                                            />
                                        </div>
                                        <p className={`text-xs font-medium ${
                                            strength.level === "weak" ? "text-red-500" :
                                            strength.level === "fair" ? "text-orange-500" :
                                            strength.level === "medium" ? "text-yellow-600" :
                                            "text-green-600"
                                        }`}>
                                            {strength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-[#009AD0]" />
                                    Şifre Tekrar
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`h-12 pl-4 pr-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl focus:ring-2 transition-all ${
                                            confirmPassword && confirmPassword !== password
                                                ? "border-red-400 focus:ring-red-200 focus:border-red-400"
                                                : confirmPassword && confirmPassword === password
                                                    ? "border-green-400 focus:ring-green-200 focus:border-green-400"
                                                    : "border-gray-200 dark:border-gray-600 focus:ring-[#009AD0]/20 focus:border-[#009AD0]"
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {confirmPassword && confirmPassword !== password && (
                                    <p className="text-xs text-red-500">Şifreler eşleşmiyor.</p>
                                )}
                                {confirmPassword && confirmPassword === password && (
                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Şifreler eşleşiyor.
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-[#009AD0] to-[#007EA8] hover:from-[#007EA8] hover:to-[#006282] text-white font-semibold rounded-xl shadow-lg shadow-[#009AD0]/25 hover:shadow-[#009AD0]/40 transition-all duration-300 flex items-center justify-center gap-2"
                                disabled={loading || (!!confirmPassword && confirmPassword !== password)}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="h-5 w-5" />
                                        Şifremi Güncelle
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {!success && (
                        <div className="mt-6 text-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#009AD0] transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Giriş sayfasına dön
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
