import { getSiteSettings } from "@/lib/settings";
import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata = {
    title: "Giriş Yap",
    description: "Hesabınıza giriş yapın.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
    // Zaten giriş yapmış kişi dönüş adresine gider (ör. sepet hatırlatma mailindeki "Sepetime Git");
    // yalnızca site içi göreli adresler kabul edilir
    const { callbackUrl } = await searchParams;
    if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") && !callbackUrl.startsWith("/\\")) {
        const session = await auth();
        if (session?.user) redirect(callbackUrl);
    }

    const settings = await getSiteSettings();
    const logoUrl = settings.logoUrl as string | undefined;
    const siteName = settings.siteName as string | undefined;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl" />
            </div>

            <Suspense fallback={<div className="flex justify-center p-8">Yükleniyor...</div>}>
                <LoginForm logoUrl={logoUrl} siteName={siteName} />
            </Suspense>
        </div>
    );
}
