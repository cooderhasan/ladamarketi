import { Column, Row, Section, Text } from "@react-email/components";
import * as React from "react";
import { SITE_BRAND } from "@/lib/site-url";

export interface OrderEmailItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    variantInfo?: string;
}

export type OrderEmailPaymentMethod = "BANK_TRANSFER" | "CREDIT_CARD" | "CURRENT_ACCOUNT";

export const ORDER_BRAND = { name: SITE_BRAND, color: "#009AD0" };

export const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";
export const INK = "#111827";
export const MUTED = "#6b7280";
export const LINE = "#e5e7eb";
export const SOFT = "#f9fafb";

export const formatTry = (value: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value || 0);

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <Text style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: MUTED, fontFamily: FONT }}>
        {children}
    </Text>
);

export const OrderItemRows = ({ items }: { items: OrderEmailItem[] }) => (
    <Section>
        {items.map((item, index) => (
            <Row key={index} style={{ borderBottom: `1px solid ${LINE}` }}>
                <Column style={{ padding: "10px 12px 10px 0", verticalAlign: "top" }}>
                    <Text style={{ margin: 0, fontSize: "14px", lineHeight: "20px", fontWeight: 600, color: INK, fontFamily: FONT }}>{item.productName}</Text>
                    {item.variantInfo && (
                        <Text style={{ margin: "2px 0 0", fontSize: "12px", lineHeight: "18px", color: MUTED, fontFamily: FONT }}>{item.variantInfo}</Text>
                    )}
                    <Text style={{ margin: "2px 0 0", fontSize: "12px", lineHeight: "18px", color: MUTED, fontFamily: FONT }}>
                        {item.quantity} adet × {formatTry(item.unitPrice)}
                    </Text>
                </Column>
                <Column align="right" style={{ padding: "10px 0", verticalAlign: "top", whiteSpace: "nowrap" }}>
                    <Text style={{ margin: 0, fontSize: "14px", lineHeight: "20px", fontWeight: 600, color: INK, fontFamily: FONT }}>{formatTry(item.lineTotal)}</Text>
                </Column>
            </Row>
        ))}
    </Section>
);

const TotalRow = ({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) => (
    <Row>
        <Column style={{ padding: strong ? "10px 0 0" : "3px 0" }}>
            <Text style={{ margin: 0, fontSize: strong ? "15px" : "14px", lineHeight: "20px", fontWeight: strong ? 700 : 400, color: strong ? INK : MUTED, fontFamily: FONT }}>{label}</Text>
        </Column>
        <Column align="right" style={{ padding: strong ? "10px 0 0" : "3px 0", whiteSpace: "nowrap" }}>
            <Text style={{ margin: 0, fontSize: strong ? "18px" : "14px", lineHeight: "20px", fontWeight: strong ? 700 : 400, color: color || INK, fontFamily: FONT }}>{value}</Text>
        </Column>
    </Row>
);

export interface OrderEmailInstallment {
    installmentFee?: number;
    installmentCount?: number;
}

/**
 * Ürün toplamı + kargo - indirim + vade farkı = toplam.
 * totalAmount sipariş tutarıdır, vade farkını içermez. Havale indirimi ayrı alan olmadığı için aradaki farktan bulunur.
 */
export const OrderTotals = ({ items, totalAmount, shippingCost, installmentFee = 0, installmentCount }: { items: OrderEmailItem[]; totalAmount: number; shippingCost?: number } & OrderEmailInstallment) => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
    const shipping = Number(shippingCost || 0);
    const discount = subtotal + shipping - totalAmount;

    return (
        <Section style={{ marginTop: "8px" }}>
            <TotalRow label="Ürünler" value={formatTry(subtotal)} />
            <TotalRow label="Kargo" value={shipping > 0 ? formatTry(shipping) : "Alıcı ödemeli"} />
            {discount > 0.01 && <TotalRow label="İndirim" value={`-${formatTry(discount)}`} />}
            {installmentFee > 0 && (
                <TotalRow label={installmentCount && installmentCount > 1 ? `Vade farkı (${installmentCount} taksit)` : "Vade farkı"} value={formatTry(installmentFee)} />
            )}
            <TotalRow label="Toplam" value={formatTry(totalAmount + installmentFee)} strong color={ORDER_BRAND.color} />
        </Section>
    );
};
