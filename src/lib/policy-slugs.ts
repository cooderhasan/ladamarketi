/**
 * Politika sayfalarının düzgün adresleri (eski aktarımda Türkçe harfler düşmüştü: "i-ptal-ve-i-ade").
 * Veritabanındaki anahtar (slug, birincil anahtar) değiştirilmedi: düzgün adres eski kayda bağlanır,
 * eski adres düzgün adrese kalıcı yönlendirilir. Admin panelinde politikalar eski anahtarla düzenlenmeye devam eder.
 */
const POLICY_ALIASES: Record<string, string> = {
    "iptal-ve-iade": "i-ptal-ve-i-ade",
    "satis-sozlesmesi": "sat-s-zle-mesi",
    "guvenli-alisveris": "g-venli-al-veri",
    "gizlilik-ilkelerimiz": "gizlilik-i-lkelerimiz",
};

const PUBLIC_BY_DB: Record<string, string> = Object.fromEntries(
    Object.entries(POLICY_ALIASES).map(([publicSlug, dbSlug]) => [dbSlug, publicSlug])
);

/** Adresteki slug → veritabanı anahtarı */
export function policyDbSlug(publicSlug: string): string {
    return POLICY_ALIASES[publicSlug] ?? publicSlug;
}

/** Veritabanı anahtarı → sitede kullanılacak adres slug'ı */
export function policyPublicSlug(dbSlug: string): string {
    return PUBLIC_BY_DB[dbSlug] ?? dbSlug;
}

/** Eski (bozuk) adres mi? Öyleyse düzgün karşılığı */
export function policyRedirectSlug(slug: string): string | null {
    return PUBLIC_BY_DB[slug] ?? null;
}
