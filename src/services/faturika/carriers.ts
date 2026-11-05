/**
 * Kargo firması → faturadaki resmî unvan ve VKN eşleştirmesi (internet satışı beyanında zorunlu).
 * Saf fonksiyonlar: hem sunucuda hem ayarlar kartında kullanılır.
 */

export interface FaturikaCarrier {
    title: string;
    vkn: string;
}

export type FaturikaCarriers = Record<string, FaturikaCarrier>;

const KNOWN_CARRIERS: { match: RegExp; carrier: FaturikaCarrier }[] = [
    { match: /yurt\s*i[cç]i|yurt[iİı]ç[iİı]/i, carrier: { title: "YURTİÇİ KARGO SERVİSİ A.Ş.", vkn: "9860008925" } },
    { match: /aras/i, carrier: { title: "ARAS KARGO YURT İÇİ YURT DIŞI TAŞIMACILIK A.Ş.", vkn: "0720039666" } },
];

export function knownCarrierFor(cargoName: string): FaturikaCarrier | null {
    return KNOWN_CARRIERS.find(({ match }) => match.test(cargoName))?.carrier ?? null;
}

/** Boş satırları atar, eksik veya hatalı satırı reddeder. VKN metin kalır: başındaki sıfır kaybolmamalı. */
export function normalizeCarriers(input: FaturikaCarriers): { carriers: FaturikaCarriers } | { error: string } {
    const carriers: FaturikaCarriers = {};

    for (const [cargoName, carrier] of Object.entries(input)) {
        const title = carrier.title.trim();
        const vkn = carrier.vkn.trim();
        if (!title && !vkn) continue;

        if (!title || title.length > 180) {
            return { error: `${cargoName}: resmî unvan zorunlu, en çok 180 karakter olabilir.` };
        }
        if (!/^\d{10,11}$/.test(vkn)) {
            return { error: `${cargoName}: VKN 10 veya 11 hane olmalı.` };
        }
        carriers[cargoName] = { title, vkn };
    }

    return { carriers };
}
