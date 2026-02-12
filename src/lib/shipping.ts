/**
 * Desi Bazlı Kargo Ücreti Hesaplama Modülü
 * 
 * Desi = (En × Boy × Yükseklik) / 3000
 * Kargo firmaları desi veya ağırlıktan büyük olanı baz alır.
 */

export interface DesiPriceRange {
    id: string;
    minDesi: number;
    maxDesi: number;
    price: number;
    multiplierType: "FIXED" | "MULTIPLY"; // Sabit Değer veya Katsayı ile Çarp
}

/**
 * Hacimsel desi hesaplama
 * @param width Genişlik (cm)
 * @param height Yükseklik (cm) 
 * @param length Uzunluk (cm)
 * @returns Hesaplanan desi değeri
 */
export function calculateDesi(width: number, height: number, length: number): number {
    if (width <= 0 || height <= 0 || length <= 0) return 0;
    return Math.ceil((width * height * length) / 3000 * 100) / 100; // 2 ondalık basamak
}

/**
 * Efektif desi — ağırlık ve hacimsel desiden büyük olanı döner
 * Kargo firmaları her zaman büyük olan değeri baz alır
 * @param weight Ağırlık (kg)
 * @param desi Hacimsel veya manuel desi
 * @returns Büyük olan değer
 */
export function getEffectiveDesi(weight: number | null | undefined, desi: number | null | undefined): number {
    const w = weight ?? 0;
    const d = desi ?? 0;
    return Math.max(w, d);
}

/**
 * Desi fiyat tablosundan kargo ücreti hesaplama
 * @param desi Ürün/sipariş desisi
 * @param priceRanges Kargo firmasının desi fiyat tablosu
 * @returns Kargo ücreti (TL) veya null (eşleşme yoksa)
 */
export function calculateShippingCost(
    desi: number,
    priceRanges: DesiPriceRange[]
): number | null {
    if (!priceRanges || priceRanges.length === 0 || desi <= 0) return null;

    // Desi aralığına göre sıralı
    const sorted = [...priceRanges].sort((a, b) => a.minDesi - b.minDesi);

    for (const range of sorted) {
        if (desi >= range.minDesi && desi <= range.maxDesi) {
            if (range.multiplierType === "MULTIPLY") {
                // Katsayı ile çarp: fiyat × desi
                return Math.round(range.price * desi * 100) / 100;
            }
            // Sabit değer
            return range.price;
        }
    }

    // Eğer desi en büyük aralığın üstündeyse, son aralığı kullan
    const lastRange = sorted[sorted.length - 1];
    if (desi > lastRange.maxDesi) {
        if (lastRange.multiplierType === "MULTIPLY") {
            return Math.round(lastRange.price * desi * 100) / 100;
        }
        return lastRange.price;
    }

    return null;
}

/**
 * Sepetteki ürünlerin toplam desisini hesapla
 * @param items Sepet kalemleri (her birinin desi ve quantity bilgisi)
 * @returns Toplam desi
 */
export function calculateTotalDesi(
    items: Array<{ desi?: number | null; weight?: number | null; quantity: number }>
): number {
    return items.reduce((total, item) => {
        const effectiveDesi = getEffectiveDesi(item.weight, item.desi);
        return total + effectiveDesi * item.quantity;
    }, 0);
}
