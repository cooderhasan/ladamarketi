import { normalizeTr } from "@/lib/product-search";

/**
 * Kategori başlığına üst kategorinin (modelin) adını ekler: "Hortum Grubu" → "Samara 1300-1500 Hortum Grubu".
 * Birden çok modelin altında aynı isimli alt kategori var (5 ayrı "Hortum Grubu"); başlıkları aynı olunca
 * Google hangisinin hangi modele ait olduğunu ayırt edemiyor.
 * Üst ad sonundaki "Yedek Parçaları" atılır; alt kategori adı modeli zaten içeriyorsa tekrar eklenmez.
 */
export function categoryDisplayName(name: string, parentName?: string | null): string {
    const base = (parentName || "").replace(/\s*yedek\s+par[çc]a(lar[ıi])?\s*$/i, "").trim();
    if (!base) return name;
    // Model kelimesi ("Samara", "Vaz") alt adda zaten geçiyorsa ekleme: "Samara 1300-1500 Samara Kaporta" olmasın
    const modelWord = normalizeTr(base).split(/\s+/).find((w) => w !== "lada");
    const child = normalizeTr(name);
    if (child.includes(normalizeTr(base)) || (modelWord && child.split(/[^a-z0-9]+/).includes(modelWord))) return name;
    return `${base} ${name}`;
}
