import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/admin/settings-form";
import { knownCarrierFor, type FaturikaCarriers } from "@/services/faturika/carriers";
import { getFaturikaSettings } from "@/services/faturika/invoicing";


export default async function SettingsPage() {
    const generalSettings = await prisma.siteSettings.findUnique({
        where: { key: "general" },
    });

    const cargoCompanies = await prisma.cargoCompany.findMany({
        orderBy: { name: "asc" },
    });

    const faturikaSettings = await getFaturikaSettings();
    const savedCarriers = faturikaSettings.carriers;

    // Kaydedilmiş kargo bilgisi yoksa bilinen firmaların unvan ve VKN'si önerilir
    const faturikaCarriers: FaturikaCarriers = {};
    for (const { name } of cargoCompanies) {
        const carrier = savedCarriers ? savedCarriers[name] : knownCarrierFor(name);
        if (carrier) faturikaCarriers[name] = carrier;
    }

    const defaults = {
        siteName: "",
        companyName: "",
        phone: "",
        email: "",
        address: "",
        whatsappNumber: "",

        // Branding
        logoUrl: "",
        faviconUrl: "",
        ogImageUrl: "", // Paylaşım görseli (boşsa logo kullanılır)

        // SEO
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",

        // Content
        aboutContent: "",
        contactContent: "",
        googleMapsEmbedUrl: "",

        // Social
        facebookUrl: "",
        instagramUrl: "",
        twitterUrl: "",
        linkedinUrl: "",

        // Bank / Payment
        bankName: "",
        bankAccountName: "",
        bankIban1: "",
        bankIban2: "",
        bankTransferDiscountRate: "0",
        minOrderLimit: "0",
        // Analytics & Tracking
        googleAnalyticsId: "",
        metaPixelId: "",
        customBodyScripts: "",
    };

    const settings = { ...defaults, ...((generalSettings?.value as Record<string, string>) || {}) };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Site Ayarları
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Genel site ayarlarını düzenleyin
                </p>
            </div>

            <SettingsForm
                initialSettings={settings}
                cargoCompanies={cargoCompanies}
                faturikaCarriers={faturikaCarriers}
                faturikaCarriersSaved={Boolean(savedCarriers)}
            />
        </div>
    );
}
