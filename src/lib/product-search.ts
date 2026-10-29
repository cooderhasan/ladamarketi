import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Türkçe ve oto yedek parçaya uygun ürün araması.
 * - Türkçe harfler fark etmez ("amortisor" = "Amortisör")
 * - Ekler / ses değişimi tanınır ("balata" ↔ "Balatası", "silecek" ↔ "Sileceği")
 * - Rakam içeren kelimede ayraçsız karşılaştırma ("2101-1001010" = "21011001010")
 * - Aranan metin: ad + stok kodu + barkod + MPN + GTIN + marka + varyant renk/beden/stok kodu/barkod
 * Şema değişikliği / eklenti gerekmez; tek SQL sorgusu ile eşleşen ürün ID'lerini döner.
 */

const TR_MAP: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u",
};

/** Küçük harf + Türkçe harfleri sadeleştirir */
export function normalizeTr(s: string): string {
    return s
        .replace(/İ/g, "i")
        .replace(/I/g, "i")
        .toLowerCase()
        .replace(/[çğıöşüâîû]/g, (ch) => TR_MAP[ch])
        .replace(/̇/g, "");
}

/** Ayraçları (tire, nokta, boşluk, eğik çizgi...) silinmiş hal */
export function compactTr(s: string): string {
    return normalizeTr(s).replace(/[^a-z0-9]/g, "");
}

// Uzun olan önce
const SUFFIXES = ["lari", "leri", "lar", "ler", "si", "su", "i", "u", "a", "e"];
const SOFT_HARD: Record<string, string> = { k: "g", g: "k", t: "d", d: "t", p: "b", b: "p" };

/** Bir kelimenin aranacak halleri (kendisi, eki atılmış kök, son ünsüzün sert/yumuşak karşılığı) */
export function searchVariants(word: string): string[] {
    const w = normalizeTr(word.trim());
    const forms = [w];

    if (w.length >= 5) {
        const suffix = SUFFIXES.find((s) => w.endsWith(s) && w.length - s.length >= 4);
        if (suffix) forms.push(w.slice(0, -suffix.length));
    }

    for (const f of [...forms]) {
        const alt = SOFT_HARD[f[f.length - 1]];
        if (f.length >= 4 && alt) forms.push(f.slice(0, -1) + alt);
    }

    return [...new Set(forms)].filter((f) => f.length >= 3);
}

function escapeLike(s: string): string {
    return s.replace(/[\\%_]/g, (ch) => "\\" + ch);
}

/** SQL tarafında normalizeTr ile aynı sadeleştirme (önce büyük harfler, sonra lower) */
function sqlNormalize(expr: Prisma.Sql): Prisma.Sql {
    return Prisma.sql`translate(lower(translate(${expr}, 'ÇĞİIÖŞÜÂÎÛ', 'cgiiosuaiu')), 'çğıöşüâîû' || chr(775), 'cgiosuaiu')`;
}

/**
 * Aramaya uyan aktif ürünlerin ID'leri. Her kelime (herhangi bir haliyle) geçmeli (AND),
 * bir kelimenin halleri kendi içinde OR. Aranacak kelime yoksa null döner (filtre uygulanmaz).
 * categoryIds verilirse sadece o kategorilerdeki ürünler aranır.
 */
export async function findProductIdsBySearch(
    q: string,
    opts: { categoryIds?: string[] } = {}
): Promise<string[] | null> {
    const words = q.trim().split(/\s+/).filter(Boolean);

    const conditions: Prisma.Sql[] = [];
    for (const word of words) {
        let forms = searchVariants(word);
        // 1-2 harfli kelime ("ön" gibi): kendisi aranır
        if (forms.length === 0) {
            const w = normalizeTr(word);
            if (!w) continue;
            forms = [w];
        }
        const patterns = forms.map((f) => `%${escapeLike(f)}%`);
        const compact = /\d/.test(word) ? compactTr(word) : "";

        conditions.push(
            compact
                ? Prisma.sql`(t.txt LIKE ANY(${patterns}::text[]) OR regexp_replace(t.txt, '[^a-z0-9]', '', 'g') LIKE ${`%${escapeLike(compact)}%`})`
                : Prisma.sql`t.txt LIKE ANY(${patterns}::text[])`
        );
    }

    if (conditions.length === 0) return null;

    const categoryFilter = opts.categoryIds?.length
        ? Prisma.sql`AND EXISTS (SELECT 1 FROM "_CategoryToProduct" cp WHERE cp."B" = p.id AND cp."A" = ANY(${opts.categoryIds}::text[]))`
        : Prisma.empty;

    const text = Prisma.sql`concat_ws(' ', p.name, p.sku, p.barcode, p.mpn, p.gtin, b.name,
        (SELECT string_agg(concat_ws(' ', v.color, v.size, v.sku, v.barcode), ' ')
           FROM product_variants v WHERE v."productId" = p.id))`;

    const rows = await prisma.$queryRaw<{ id: string }[]>`
        WITH t AS (
            SELECT p.id, ${sqlNormalize(text)} AS txt
            FROM products p
            LEFT JOIN brands b ON b.id = p."brandId"
            WHERE p."isActive" = true ${categoryFilter}
        )
        SELECT t.id FROM t
        WHERE ${Prisma.join(conditions, " AND ")}
    `;

    return rows.map((r) => r.id);
}
