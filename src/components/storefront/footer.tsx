import Link from "next/link";

interface Policy {
    slug: string;
    title: string;
}

interface StorefrontFooterProps {
    settings?: Record<string, string>;
    policies?: Policy[];
}

export function StorefrontFooter({ settings, policies }: StorefrontFooterProps) {
    // Separate policies into groups if needed, or just list them all
    // For now, let's put "payment-methods" apart if we want, or just filter it out from the general list if we handle it separately.
    // User requested "Combine", so let's just list them.
    // However, usually "Payment Methods" is a policy too.

    const footerPolicies = policies || [];

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="container mx-auto px-4 py-12 pb-24 md:pb-12 text-center md:text-left">
                <div className="grid gap-8 grid-cols-1 md:grid-cols-4">
                    {/* Company Info */}
                    <div className="space-y-4 md:col-span-1">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            {settings?.logoUrl ? (
                                <img src={settings.logoUrl} alt={settings?.siteName || "Logo"} className="h-10 w-auto object-contain" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-[#009AD0] rounded-xl flex items-center justify-center transform -rotate-3 shadow-lg">
                                        <span className="text-white font-extrabold text-xl">B</span>
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="font-black text-2xl text-white tracking-tight uppercase">
                                            BAGAJ
                                        </span>
                                        <span className="font-bold text-sm text-[#009AD0] tracking-widest uppercase">
                                            LASTİĞİ
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-400">
                            {settings?.seoDescription || "Lada ve Samara yedek parça, aksesuar ve modifiye ürünlerinde güvenilir adres."}
                        </p>
                        <div className="flex justify-center md:justify-start gap-3 pt-2">
                            {/* Social Icons */}
                            {settings?.facebookUrl && (
                                <a
                                    href={settings.facebookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 bg-gray-800 hover:bg-[#009AD0] rounded-full flex items-center justify-center transition-colors"
                                    title="Facebook"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
                                    </svg>
                                </a>
                            )}
                            {settings?.instagramUrl && (
                                <a
                                    href={settings.instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 bg-gray-800 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600 rounded-full flex items-center justify-center transition-colors"
                                    title="Instagram"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </a>
                            )}
                            {settings?.twitterUrl && (
                                <a
                                    href={settings.twitterUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 bg-gray-800 hover:bg-[#009AD0] rounded-full flex items-center justify-center transition-colors"
                                    title="X (Twitter)"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                            )}
                            {settings?.linkedinUrl && (
                                <a
                                    href={settings.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 bg-gray-800 hover:bg-[#009AD0] rounded-full flex items-center justify-center transition-colors"
                                    title="LinkedIn"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Hızlı Bağlantılar</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/products" className="text-gray-400 hover:text-[#009AD0] transition-colors">
                                    Ürünler
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-gray-400 hover:text-[#009AD0] transition-colors">
                                    Hakkımızda
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-gray-400 hover:text-[#009AD0] transition-colors">
                                    İletişim
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Corporate & Policies */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Kurumsal</h4>
                        <ul className="space-y-2 text-sm">
                            {footerPolicies.map((policy) => (
                                <li key={policy.slug}>
                                    <Link href={`/policies/${policy.slug}`} className="text-gray-400 hover:text-[#009AD0] transition-colors">
                                        {policy.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <div className="md:col-span-1">
                            <h4 className="font-semibold text-white mb-4">İletişim</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                {settings?.phone && <li>{settings.phone}</li>}
                                {settings?.email && <li>{settings.email}</li>}
                                {settings?.address && <li className="whitespace-pre-wrap">{settings.address}</li>}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                    <div className="text-gray-500">
                        <p>© {new Date().getFullYear()} {settings?.companyName || "B2B Toptancı"}. Tüm hakları saklıdır.</p>
                        <p className="mt-1">
                            Coded by{" "}
                            <a
                                href="https://www.hasandurmus.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#009AD0] hover:text-[#007EA8] transition-colors"
                            >
                                Hasan Durmuş
                            </a>
                        </p>
                    </div>

                    {/* Payment Icons */}
                    <div className="flex items-center gap-2">
                        {(settings?.showVisa === "true") && (
                            <div className="bg-white rounded px-2 h-9 min-w-[3rem] flex items-center justify-center p-1" title="Visa">
                                <strong style={{ color: "#1A1F71", fontStyle: "italic", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "1.2rem", lineHeight: 1, letterSpacing: "-0.5px", fontWeight: 900 }}>VISA</strong>
                            </div>
                        )}
                        {(settings?.showMastercard === "true") && (
                            <div className="bg-white rounded px-2 h-9 min-w-[3rem] flex items-center justify-center" title="Mastercard">
                                <svg viewBox="0 0 24 15" className="h-full w-auto max-w-full">
                                    <rect fill="none" width="24" height="15" />
                                    <circle cx="7" cy="7.5" r="7" fill="#EB001B" />
                                    <circle cx="17" cy="7.5" r="7" fill="#F79E1B" fillOpacity="0.8" />
                                </svg>
                            </div>
                        )}
                        {(settings?.showTroy === "true") && (
                            <div className="bg-white rounded px-2 h-9 min-w-[3rem] flex items-center justify-center" title="Troy">
                                <strong className="text-blue-900 text-sm font-black tracking-tighter">TROY</strong>
                            </div>
                        )}
                        {(settings?.showBankTransfer === "true") && (
                            <div className="bg-white rounded px-2 h-9 min-w-[3rem] flex items-center justify-center" title="Havale / EFT">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}
