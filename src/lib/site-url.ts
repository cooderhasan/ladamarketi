/** Sitenin mutlak adresi (canonical, og:image, yapısal veri ve site haritası için) */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.ladamarketi.com").replace(/\/$/, "");

/** Sayfa başlıklarına eklenen kısa marka; uzun slogan (site adı) yalnızca ana sayfa başlığında */
export const SITE_BRAND = "Lada Marketi";

/** Göreli yolu (/uploads/x.png) mutlak adrese çevirir; zaten mutlaksa dokunmaz */
export function absoluteUrl(path: string) {
    if (!path) return path;
    if (/^https?:\/\//.test(path)) return path;
    return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
