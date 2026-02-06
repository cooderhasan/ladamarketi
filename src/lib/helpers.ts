import { PriceCalculation, CartItem, CartSummary } from "@/types";

export const SHIPPING_FREE_LIMIT = 20000; // DEPRECATED: Use settings.freeShippingLimit instead. Kept as fallback.

/**
 * Calculate discounted price for a product based on dealer discount rate
 */
/**
 * Calculate discounted price for a product based on dealer discount rate
 * NOTE: listPrice is treated as VAT-INCLUSIVE
 */
export function calculatePrice(
    listPrice: number,
    discountRate: number,
    vatRate: number
): PriceCalculation {
    // 1. Calculate price after discount (still VAT-inclusive)
    const discountedPrice = listPrice * (1 - discountRate / 100);

    // 2. Calculate VAT amount from the inclusive price
    // Formula: Price = Base * (1 + Rate) => Base = Price / (1 + Rate)
    const basePrice = discountedPrice / (1 + vatRate / 100);
    const vatAmount = discountedPrice - basePrice;

    return {
        listPrice,
        discountRate,
        discountedPrice: roundPrice(discountedPrice),
        vatRate,
        vatAmount: roundPrice(vatAmount),
        finalPrice: roundPrice(discountedPrice),
    };
}

/**
 * Calculate cart summary with totals
 * NOTE: item.listPrice is VAT-INCLUSIVE
 */
export function calculateCartSummary(
    items: CartItem[],
    discountRate: number
): CartSummary {
    let subtotal = 0; // Total price (VAT inclusive)
    let discountAmount = 0;
    let vatAmount = 0;

    items.forEach((item) => {
        // Item total (VAT inclusive)
        const itemTotal = item.listPrice * item.quantity;

        // Discount amount - Use item's specific discount rate
        // If item.discountRate is defined, use it. Otherwise fallback to global discountRate (backward compatibility)
        const effectiveRate = item.discountRate !== undefined ? item.discountRate : discountRate;
        const itemDiscount = itemTotal * (effectiveRate / 100);

        // Price after discount (VAT inclusive)
        const itemDiscounted = itemTotal - itemDiscount;

        // Calculate VAT from discounted price
        const itemBase = itemDiscounted / (1 + item.vatRate / 100);
        const itemVat = itemDiscounted - itemBase;

        subtotal += itemTotal;
        discountAmount += itemDiscount;
        vatAmount += itemVat;
    });

    // Total to pay is simply subtotal minus discount
    // (VAT is already inside)
    const total = subtotal - discountAmount;

    // Subtotal should be the Net Amount (Total - Vat)
    // So that: Net Subtotal + VAT = Total
    const netSubtotal = total - vatAmount;

    return {
        items,
        subtotal: roundPrice(netSubtotal),
        discountAmount: roundPrice(discountAmount),
        vatAmount: roundPrice(vatAmount),
        total: roundPrice(total),
        itemCount: items.reduce((acc, item) => acc + item.quantity, 0),
    };
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency = "TRY"): string {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price);
}

/**
 * Round price to 2 decimal places
 */
export function roundPrice(price: number): number {
    return Math.round(price * 100) / 100;
}

/**
 * Generate unique order number
 */
export function generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return `SP${year}${month}${day}${random}`;
}

/**
 * Generate slug from text
 */
export function generateSlug(text: string): string {
    const turkishChars: Record<string, string> = {
        ğ: "g",
        ü: "u",
        ş: "s",
        ı: "i",
        ö: "o",
        ç: "c",
        Ğ: "g",
        Ü: "u",
        Ş: "s",
        İ: "i",
        Ö: "o",
        Ç: "c",
    };

    return text
        .toLowerCase()
        .replace(/[ğüşıöçĞÜŞİÖÇ]/g, (char) => turkishChars[char] || char)
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

/**
 * Generate random SKU code
 * Format: ABC-12345
 */
export function generateSKU(): string {
    const prefix = "LDM";
    const random = Math.floor(Math.random() * 10000000)
        .toString()
        .padStart(7, "0");
    return `${prefix}-${random}`;
}

/**
 * Generate valid EAN-13 barcode
 */
export function generateBarcode(): string {
    // Prefix 460 (Russia)
    let code = "460" + Math.floor(Math.random() * 1000000000)
        .toString()
        .padStart(9, "0");

    // Calculate checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }

    const checksum = (10 - (sum % 10)) % 10;
    return code + checksum;
}

/**
 * Validate minimum quantity
 */
export function validateMinQuantity(
    quantity: number,
    minQuantity: number
): { valid: boolean; message?: string } {
    if (quantity < minQuantity) {
        return {
            valid: false,
            message: `Bu ürün için minimum sipariş adedi ${minQuantity}'dir.`,
        };
    }
    return { valid: true };
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}

/**
 * Get order status label in Turkish
 */
export function getOrderStatusLabel(status: string, paymentMethod?: string) {
    switch (status) {
        case "PENDING":
            if (paymentMethod === "BANK_TRANSFER") return "Havale Bekleniyor";
            if (paymentMethod === "CREDIT_CARD") return "Ödeme Bekleniyor (Kart)";
            return "Ödeme Bekleniyor";
        case "CONFIRMED":
            return "Onaylandı";
        case "PROCESSING":
            return "Hazırlanıyor";
        case "SHIPPED":
            return "Kargolandı";
        case "DELIVERED":
            return "Tamamlandı";
        case "CANCELLED":
            return "İptal Edildi";
        default:
            return status;
    }
}

/**
 * Get order status color for badges
 */
export function getOrderStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-800",
        CONFIRMED: "bg-blue-100 text-blue-800",
        PROCESSING: "bg-purple-100 text-purple-800",
        SHIPPED: "bg-indigo-100 text-indigo-800",
        DELIVERED: "bg-green-100 text-green-800",
        CANCELLED: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
}

/**
 * Get user status label in Turkish
 */
export function getUserStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
        PENDING: "Onay Bekliyor",
        APPROVED: "Onaylandı",
        REJECTED: "Reddedildi",
        SUSPENDED: "Askıya Alındı",
    };
    return statusLabels[status] || status;
}

/**
 * Get user status color for badges
 */
export function getUserStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-800",
        APPROVED: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-800",
        SUSPENDED: "bg-gray-100 text-gray-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
}
