import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { ContactForm } from "@/components/storefront/contact-form";

export default async function ContactPage() {
    const settings = await getSiteSettings();

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    İletişim
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                    {settings.seoDescription || "Sorularınız, önerileriniz veya iş birliği talepleriniz için bize ulaşın."}
                </p>
            </div>

            {/* Dynamic Intro Content */}
            {settings.contactContent && (
                <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                    <div dangerouslySetInnerHTML={{ __html: settings.contactContent }} />
                </div>
            )}

            <div className="grid gap-12 lg:grid-cols-3">
                {/* Contact Info */}
                <div className="space-y-8 lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>İletişim Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Adres</h3>
                                    <p className="text-gray-500 mt-1 whitespace-pre-wrap">
                                        {settings.address || "İstoç Ticaret Merkezi, \n24. Ada No: 123 \nBağcılar / İstanbul"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Telefon</h3>
                                    <p className="text-gray-500 mt-1">
                                        {settings.phone || "+90 212 555 0000"} <br />
                                        {settings.whatsappNumber && `WhatsApp: +${settings.whatsappNumber}`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">E-posta</h3>
                                    <p className="text-gray-500 mt-1">
                                        {settings.email || "info@b2b-toptan.com"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Google Maps Placeholder */}
                    <div className="h-64 bg-gray-100 rounded-xl overflow-hidden relative">
                        <iframe
                            src={settings.googleMapsEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3008.963364446!2d28.8!3d41.05!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDAzJzAwLjAiTiAyOMKwNDgnMDAuMCJF!5e0!3m2!1str!2str!4v1620000000000!5m2!1str!2str"}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                        ></iframe>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bize Ulaşın</CardTitle>
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
