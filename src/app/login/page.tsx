"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { Mail, Lock, LogIn, UserPlus, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("E-posta veya şifre hatalı.");
            } else {
                // Redirect to admin - Middleware will handle non-admin users by redirecting them to home
                window.location.href = "/admin";
            }
        } catch {
            toast.error("Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 dark:bg-orange-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative">
                {/* Glass Card */}
                <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-10 text-center">
                        {/* Logo */}
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition-transform">
                            <span className="text-orange-500 font-black text-3xl">B</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">
                            Bayi Girişi
                        </h1>
                        <p className="text-orange-100 text-sm">
                            Hesabınıza giriş yaparak devam edin
                        </p>
                    </div>

                    {/* Form Section */}
                    <div className="px-8 py-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-orange-500" />
                                    E-posta Adresi
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="ornek@firma.com"
                                        required
                                        className="h-12 pl-4 pr-4 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-orange-500" />
                                    Şifre
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        className="h-12 pl-4 pr-4 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Giriş yapılıyor...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-5 w-5" />
                                        Giriş Yap
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-600" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">veya</span>
                            </div>
                        </div>

                        {/* Register Link */}
                        <Link
                            href="/register"
                            className="flex items-center justify-center gap-3 w-full h-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-orange-300 dark:hover:border-orange-500/50 transition-all duration-300 group"
                        >
                            <UserPlus className="h-5 w-5 text-gray-500 group-hover:text-orange-500 transition-colors" />
                            Yeni Hesap Oluştur
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                        </Link>
                    </div>
                </div>

                {/* Footer Text */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Giriş yaparak{" "}
                    <Link href="/policies/membership" className="text-orange-600 hover:underline">Kullanım Şartları</Link>
                    {" "}ve{" "}
                    <Link href="/policies/privacy" className="text-orange-600 hover:underline">Gizlilik Politikası</Link>
                    'nı kabul etmiş olursunuz.
                </p>
            </div>
        </div>
    );
}
