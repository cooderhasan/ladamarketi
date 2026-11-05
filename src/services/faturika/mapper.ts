/**
 * Sipariş → Faturika istek gövdesi. Saf fonksiyonlar: veritabanına ve ağa dokunmaz.
 *
 * Tutar kuralı: fatura toplamı müşterinin ödediği tutarla kuruşu kuruşuna aynı olmalı.
 * Hesaplar tam sayı kuruşla yapılır; satırlar KDV dahil gross_total olarak gider.
 */

export const CONSUMER_TAX_NUMBER = "11111111111";
export const DEFAULT_WEBSITE = "https://www.ladamarketi.com";

const UNIT_CODE_PIECE = "C62";
const SALE_INVOICE_TYPE = "SATIS";

type Money = number | string | { toString(): string };

export type DocumentType = "einvoice_outgoing" | "earchive";

export type SitePaymentMethod = "CREDIT_CARD" | "BANK_TRANSFER" | "CASH_ON_DELIVERY" | "CURRENT_ACCOUNT";

export interface InvoiceOrderItem {
    productName: string;
    variantInfo?: string | null;
    quantity: number;
    lineTotal: Money;
    discountRate: Money;
    vatRate: number;
}

export interface InvoiceOrderPayment {
    method: SitePaymentMethod;
    status: string;
    amount: Money;
    installmentCount?: number | null;
}

export interface InvoiceOrder {
    total: Money;
    shippingCost: Money;
    items: InvoiceOrderItem[];
    payment: InvoiceOrderPayment | null;
}

export interface InvoiceLine {
    name: string;
    description?: string;
    quantity: number;
    unit_code: string;
    gross_total: number;
    vat_rate: number;
}

export interface InvoiceProblem {
    code:
        | "NO_ITEMS"
        | "NO_PAYMENT"
        | "SHIPPING_COST"
        | "CARD_PAYMENT_INCOMPLETE"
        | "PAID_LESS_THAN_ORDER"
        | "NO_DISCOUNT_ELIGIBLE_LINES"
        | "TOTAL_MISMATCH"
        | "LINE_NOT_POSITIVE";
    message: string;
}

export interface InvoiceAmounts {
    lines: InvoiceLine[];
    /** Faturanın ödenecek tutarı (kuruş); taslaktaki payable_total bununla karşılaştırılır */
    totalKurus: number;
    bankDiscountKurus: number;
    installmentFeeKurus: number;
    problems: InvoiceProblem[];
}

export function toKurus(value: Money): number {
    return Math.round(Number(String(value)) * 100);
}

function sum(values: number[]): number {
    return values.reduce((total, value) => total + value, 0);
}

function largestIndex(values: number[]): number {
    return values.reduce((best, value, index) => (value > values[best] ? index : best), 0);
}

/** Tutarı ağırlıklara orantılı böler; yuvarlamadan kalan kuruş en büyük paya eklenir */
function spread(amount: number, weights: number[]): number[] {
    const totalWeight = sum(weights);
    const shares = weights.map((weight) => Math.round((amount * weight) / totalWeight));
    shares[largestIndex(weights)] += amount - sum(shares);
    return shares;
}

export function buildInvoiceLines(order: InvoiceOrder): InvoiceAmounts {
    const problems: InvoiceProblem[] = [];
    const orderTotal = toKurus(order.total);
    const shippingCost = toKurus(order.shippingCost);
    const productGross = order.items.map((item) => toKurus(item.lineTotal));

    if (order.items.length === 0) {
        return {
            lines: [],
            totalKurus: 0,
            bankDiscountKurus: 0,
            installmentFeeKurus: 0,
            problems: [{ code: "NO_ITEMS", message: "Siparişte ürün yok." }],
        };
    }

    if (!order.payment) {
        problems.push({ code: "NO_PAYMENT", message: "Siparişin ödeme kaydı bulunamadı." });
    }

    // Kargo alıcı ödemeli, faturada kalem yok. Tutar girilmiş sipariş istisnadır, admin bakmalı.
    if (shippingCost > 0) {
        problems.push({
            code: "SHIPPING_COST",
            message: "Siparişte kargo ücreti var. Kargo kalemi otomatik eklenmez, siparişi kontrol edin.",
        });
    }

    // Havale indirimi satırlarda değil, satır toplamı ile sipariş toplamının farkında görünür
    const productTarget = orderTotal - shippingCost;
    const difference = sum(productGross) - productTarget;
    let bankDiscountKurus = 0;

    // Sipariş ve satırlar ayrı ayrı yuvarlandığı için satır başına 1 kuruş sapma normaldir
    if (Math.abs(difference) <= order.items.length) {
        productGross[largestIndex(productGross)] -= difference;
    } else if (difference > 0) {
        // Havale indirimi yalnız satır indirimi olmayan ürünlere uygulanıyor (checkout/actions.ts)
        const eligible = order.items.flatMap((item, index) => (toKurus(item.discountRate) === 0 ? [index] : []));
        if (eligible.length === 0) {
            problems.push({
                code: "NO_DISCOUNT_ELIGIBLE_LINES",
                message: "Sipariş toplamı ürün toplamından düşük ama indirimin dağıtılacağı ürün bulunamadı.",
            });
        } else {
            bankDiscountKurus = difference;
            const shares = spread(difference, eligible.map((index) => productGross[index]));
            eligible.forEach((index, position) => {
                productGross[index] -= shares[position];
            });
        }
    } else {
        problems.push({
            code: "TOTAL_MISMATCH",
            message: "Sipariş toplamı ürün toplamından yüksek. Siparişi kontrol edin.",
        });
    }

    if (productGross.some((gross) => gross <= 0)) {
        problems.push({ code: "LINE_NOT_POSITIVE", message: "İndirim sonrası tutarı sıfır olan ürün var." });
    }

    const lines: InvoiceLine[] = order.items.map((item, index) => ({
        name: item.productName.slice(0, 255),
        ...(item.variantInfo ? { description: item.variantInfo.slice(0, 500) } : {}),
        quantity: item.quantity,
        unit_code: UNIT_CODE_PIECE,
        gross_total: productGross[index] / 100,
        vat_rate: item.vatRate,
    }));

    // Vade farkı: PayTR'nin bildirdiği tutar (Payment.amount) taksit farkını içerir
    let installmentFeeKurus = 0;
    if (order.payment?.method === "CREDIT_CARD") {
        if (order.payment.status !== "COMPLETED") {
            problems.push({
                code: "CARD_PAYMENT_INCOMPLETE",
                message: "Kart ödemesi tamamlanmadı. Vade farkı ödeme sonrası belli olur.",
            });
        } else {
            const fee = toKurus(order.payment.amount) - orderTotal;
            if (fee < 0) {
                problems.push({
                    code: "PAID_LESS_THAN_ORDER",
                    message: "Ödenen tutar sipariş toplamından düşük. Siparişi kontrol edin.",
                });
            } else if (fee > 0) {
                installmentFeeKurus = fee;
                lines.push(...buildInstallmentLines(fee, order.items, productGross, order.payment.installmentCount));
            }
        }
    }

    return {
        lines,
        totalKurus: sum(productGross) + installmentFeeKurus,
        bankDiscountKurus,
        installmentFeeKurus,
        problems,
    };
}

/** Vade farkı malın KDV oranını alır; sepette birden çok oran varsa ürün tutarlarıyla orantılı bölünür */
function buildInstallmentLines(
    fee: number,
    items: InvoiceOrderItem[],
    productGross: number[],
    installmentCount?: number | null,
): InvoiceLine[] {
    const grossByRate = new Map<number, number>();
    items.forEach((item, index) => {
        grossByRate.set(item.vatRate, (grossByRate.get(item.vatRate) ?? 0) + productGross[index]);
    });

    const rates = [...grossByRate.keys()].sort((a, b) => a - b);
    const shares = spread(fee, rates.map((rate) => grossByRate.get(rate) ?? 0));

    return rates.flatMap((rate, index) =>
        shares[index] > 0
            ? [
                  {
                      name: "Vade Farkı",
                      ...(installmentCount && installmentCount > 1 ? { description: `${installmentCount} taksit` } : {}),
                      quantity: 1,
                      unit_code: UNIT_CODE_PIECE,
                      gross_total: shares[index] / 100,
                      vat_rate: rate,
                  },
              ]
            : [],
    );
}

export interface RecipientSource {
    name: string;
    taxNumber?: string | null;
    userTaxNumber?: string | null;
    companyName?: string | null;
    taxOffice?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    district?: string | null;
}

export interface Recipient {
    taxNumber: string;
    isConsumer: boolean;
    title: string;
    taxOffice?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    district?: string;
}

function validTaxNumber(value?: string | null): string | null {
    const digits = String(value ?? "").replace(/\D/g, "");
    return /^\d{10,11}$/.test(digits) && digits !== CONSUMER_TAX_NUMBER ? digits : null;
}

/** TC / VKN yoksa nihai tüketici numarası. Tutar sınırı uygulanmaz. */
export function resolveRecipient(source: RecipientSource, gibTitle?: string | null): Recipient {
    const taxNumber = validTaxNumber(source.taxNumber) ?? validTaxNumber(source.userTaxNumber);
    const isCompany = taxNumber?.length === 10;
    const title = (gibTitle || (isCompany && source.companyName) || source.name).trim();

    return {
        taxNumber: taxNumber ?? CONSUMER_TAX_NUMBER,
        isConsumer: !taxNumber,
        title,
        ...(source.taxOffice ? { taxOffice: source.taxOffice } : {}),
        ...(source.email ? { email: source.email } : {}),
        ...(source.phone ? { phone: source.phone } : {}),
        ...(source.address ? { address: source.address } : {}),
        ...(source.city ? { city: source.city } : {}),
        ...(source.district ? { district: source.district } : {}),
    };
}

export interface ContactPayload {
    tax_number: string;
    title: string;
    tax_office?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    district?: string;
    id?: number;
    create_new?: boolean;
}

/**
 * Nihai tüketici numarası kişiyi tanımlamaz; Faturika unvanla eşler. Aynı adlı iki müşteri tek karta
 * düşmesin diye müşterinin önceki kartı biliniyorsa o güncellenir, bilinmiyorsa yeni kart açılır.
 */
export function buildContactPayload(recipient: Recipient, knownContactId?: number | null): ContactPayload {
    return {
        tax_number: recipient.taxNumber,
        title: recipient.title.slice(0, 190),
        ...(recipient.taxOffice ? { tax_office: recipient.taxOffice.slice(0, 120) } : {}),
        ...(recipient.email ? { email: recipient.email.slice(0, 190) } : {}),
        ...(recipient.phone ? { phone: recipient.phone.slice(0, 40) } : {}),
        ...(recipient.address ? { address: recipient.address.slice(0, 500) } : {}),
        ...(recipient.city ? { city: recipient.city.slice(0, 80) } : {}),
        ...(recipient.district ? { district: recipient.district.slice(0, 80) } : {}),
        ...(recipient.isConsumer ? (knownContactId ? { id: knownContactId } : { create_new: true }) : {}),
    };
}

const INTERNET_SALE_PAYMENT_METHOD: Record<SitePaymentMethod, string> = {
    CREDIT_CARD: "ODEMEARACISI",
    BANK_TRANSFER: "EFT/HAVALE",
    CASH_ON_DELIVERY: "KAPIDAODEME",
    CURRENT_ACCOUNT: "DIGER",
};

export interface DocumentPayload {
    document_type: DocumentType;
    invoice_type_code: string;
    scenario: "basic" | "earchive";
    contact_id: number;
    issue_date: string;
    currency: "TRY";
    deliver_by_email: boolean;
    stock_exit: boolean;
    notes: string;
    internet_sale: {
        payment_method: string;
        payment_date: string;
        website: string;
        delivery_type: "physical";
        carrier_title: string;
        carrier_vkn: string;
        delivery_date: string;
    };
    lines: InvoiceLine[];
}

export interface DocumentInput {
    orderNumber: string;
    documentType: DocumentType;
    contactId: number;
    lines: InvoiceLine[];
    paymentMethod: SitePaymentMethod;
    issueDate: string;
    paymentDate: string;
    deliveryDate: string;
    carrier: { title: string; vkn: string };
    website?: string;
}

export function buildDocumentPayload(input: DocumentInput): DocumentPayload {
    const website = input.website ?? DEFAULT_WEBSITE;
    const notes = [
        `Sipariş No: ${input.orderNumber}`,
        `Sipariş Kaynağı: ${new URL(website).host}`,
        // internet_sale içinde aracı adı için alan yok
        ...(input.paymentMethod === "CREDIT_CARD" ? ["Ödeme Aracısı: PayTR"] : []),
    ].join(" · ");

    return {
        document_type: input.documentType,
        invoice_type_code: SALE_INVOICE_TYPE,
        scenario: input.documentType === "earchive" ? "earchive" : "basic",
        contact_id: input.contactId,
        issue_date: input.issueDate,
        currency: "TRY",
        // İnternet satışında e-Arşiv alıcıya elektronik iletilmeli; e-Fatura kendi sistemiyle ulaşır
        deliver_by_email: input.documentType === "earchive",
        // Stok sitede tutuluyor
        stock_exit: false,
        notes,
        internet_sale: {
            payment_method: INTERNET_SALE_PAYMENT_METHOD[input.paymentMethod],
            payment_date: input.paymentDate,
            website,
            delivery_type: "physical",
            carrier_title: input.carrier.title,
            carrier_vkn: input.carrier.vkn,
            delivery_date: input.deliveryDate,
        },
        lines: input.lines,
    };
}

/** Düzeltilen gövde yeni anahtarla gitmeli: 422 yanıtları da anahtara bağlı önbelleğe girer (rehber §1) */
export function draftIdempotencyKey(orderNumber: string, attempt: number): string {
    return `lada-${orderNumber}-draft-${attempt}`;
}

/** YYYY-AA-GG, Türkiye saatiyle */
export function istanbulDate(date: Date = new Date()): string {
    return date.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}
