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
    // Alt ad kendisi bir model adıysa ("Lada Vaz 2104", "Lada Samara Kaporta Aksamı") da ekleme
    const modelWord = normalizeTr(base).split(/[^a-z0-9]+/).find((w) => w && w !== "lada");
    const childWords = normalizeTr(name).split(/[^a-z0-9]+/);
    if (
        normalizeTr(name).includes(normalizeTr(base)) ||
        childWords.includes("lada") ||
        (modelWord && childWords.includes(modelWord))
    ) return name;
    return `${base} ${name}`;
}
