import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Phone, Clock, Building2, FileText } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { ContactForm } from "@/components/storefront/contact-form";

export default async function ContactPage() {
    const settings = await getSiteSettings();

    return (
        <div className="container mx-auto px-4 py-8 sm:py-12">
            {/* Page Header */}
            <div className="text-center mb-10 space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    İletişim
                </h1>
                <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
                    Sorularınız, önerileriniz veya siparişleriniz için bize ulaşın.
                </p>
            </div>

            {/* Dynamic Intro Content */}
            {settings.contactContent && (
                <div className="prose prose-lg dark:prose-invert max-w-none mb-10">
                    <div dangerouslySetInnerHTML={{ __html: settings.contactContent }} />
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column: Contact Info + Map */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Company Info Card */}
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Building2 className="w-5 h-5 text-[#009AD0]" />
                                Firma Bilgileri
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Company Name */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Firma Ünvanı</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Konya Lada Yedek Parça Satış Hizmetleri
                                </p>
                            </div>

                            {/* Address */}
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 bg-blue-50 text-[#009AD0] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Adres</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                                        {settings.address || "Fatih Mahallesi Horozlu Sokak No 44-1 (Eski Sanayi) Selçuklu/KONYA"}
                                    </p>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 bg-green-50 text-green-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Telefon</h3>
                                    <div className="space-y-1 mt-0.5">
                                        <a href="tel:05345194472" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-[#009AD0] transition-colors">
                                            0534 519 44 72
                                        </a>
                                        <a href="tel:05388168400" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-[#009AD0] transition-colors">
                                            0538 816 84 00
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">E-posta</h3>
                                    <a href="mailto:info@ladamarketi.com" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#009AD0] transition-colors mt-0.5 block">
                                        info@ladamarketi.com
                                    </a>
                                </div>
                            </div>

                            {/* Working Hours */}
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Çalışma Saatleri</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                        Hafta içi ve Cumartesi: 08:00 - 20:00
                                    </p>
                                    <p className="text-xs text-red-500 font-medium mt-0.5">
                                        Pazar: Kapalı
                                    </p>
                                </div>
                            </div>

                            {/* Tax Info */}
                            <div className="flex items-start gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <div className="w-9 h-9 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Vergi Bilgileri</h3>
                                    <div className="mt-0.5 space-y-0.5">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="text-gray-400">V.D.:</span> Meram
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="text-gray-400">V.N.:</span> 2030321343
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Google Maps */}
                    <div className="h-64 sm:h-72 bg-gray-100 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5">
                        <iframe
                            src={settings.googleMapsEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3148.5!2d32.48!3d37.87!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDUyJzAwLjAiTiAzMsKwMjknMDAuMCJF!5e0!3m2!1str!2str!4v1620000000000!5m2!1str!2str"}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            title="Konya Lada Yedek Parça Konum"
                        ></iframe>
                    </div>
                </div>

                {/* Right Column: Contact Form */}
                <div className="lg:col-span-2">
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Bize Ulaşın</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Formu doldurarak bize mesaj gönderebilirsiniz. En kısa sürede size dönüş yapacağız.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <ContactForm />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
