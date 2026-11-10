import { Body, Button, Column, Container, Head, Hr, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components";
import * as React from "react";
import { SITE_URL } from "@/lib/site-url";
import { FONT, INK, LINE, MUTED, ORDER_BRAND, SOFT, formatTry } from "./order-email-shared";

export interface AbandonedCartEmailItem {
    productName: string;
    variantInfo?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    imageUrl?: string;
    productUrl?: string;
}

interface AbandonedCartNotificationEmailProps {
    /** Üyenin Ad Soyad'ı; yoksa sadece "Merhaba," yazar */
    customerName?: string;
    items: AbandonedCartEmailItem[];
    totalAmount: number;
    cartUrl: string;
    contactPhone?: string;
    contactEmail?: string;
    unsubscribeUrl?: string;
}

const textStyle = { margin: 0, fontSize: "14px", lineHeight: "22px", color: INK, fontFamily: FONT };
const smallStyle = { margin: 0, fontSize: "12px", lineHeight: "18px", color: MUTED, fontFamily: FONT };

const ItemImage = ({ item }: { item: AbandonedCartEmailItem }) => {
    const image = item.imageUrl ? (
        <Img
            src={item.imageUrl}
            width="64"
            height="64"
            alt={item.productName}
            style={{ display: "block", width: "64px", height: "64px", objectFit: "contain", borderRadius: "8px", border: `1px solid ${LINE}`, backgroundColor: "#ffffff" }}
        />
    ) : (
        <div style={{ width: "62px", height: "62px", margin: 0, borderRadius: "8px", backgroundColor: SOFT, border: `1px solid ${LINE}` }} />
    );
    return item.productUrl && item.imageUrl ? <Link href={item.productUrl}>{image}</Link> : image;
};

export const AbandonedCartNotificationEmail = ({
    customerName,
    items,
    totalAmount,
    cartUrl,
    contactPhone,
    contactEmail,
    unsubscribeUrl,
}: AbandonedCartNotificationEmailProps) => {
    const siteHost = SITE_URL.replace(/^https?:\/\//, "");

    return (
        <Html lang="tr">
            <Head />
            <Preview>Sepetinize eklediğiniz ürünler sizi bekliyor, kaldığınız yerden devam edebilirsiniz.</Preview>
            <Body style={{ margin: 0, padding: "24px 12px", backgroundColor: "#f3f4f6", fontFamily: FONT }}>
                <Container style={{ maxWidth: "560px", backgroundColor: "#ffffff", borderRadius: "10px", border: `1px solid ${LINE}`, overflow: "hidden" }}>
                    <Section style={{ backgroundColor: ORDER_BRAND.color, padding: "18px 28px" }}>
                        <Text style={{ margin: 0, fontSize: "20px", lineHeight: "26px", fontWeight: 800, color: "#ffffff", fontFamily: FONT }}>{ORDER_BRAND.name}</Text>
                    </Section>

                    <Section style={{ padding: "26px 28px 6px" }}>
                        <Text style={{ margin: "0 0 6px", fontSize: "22px", lineHeight: "28px", fontWeight: 700, color: INK, fontFamily: FONT }}>Sepetinizdeki ürünler sizi bekliyor</Text>
                        <Text style={textStyle}>
                            {customerName ? `Merhaba ${customerName},` : "Merhaba,"}
                            <br />
                            Sepetinize eklediğiniz ürünleri sizin için sakladık. Siparişinizi tamamlamak isterseniz kaldığınız yerden devam edebilirsiniz.
                        </Text>
                    </Section>

                    <Section style={{ padding: "18px 28px 0" }}>
                        {items.map((item, index) => (
                            <Row key={index} style={{ borderBottom: `1px solid ${LINE}` }}>
                                <Column style={{ width: "76px", padding: "12px 12px 12px 0", verticalAlign: "top" }}>
                                    <ItemImage item={item} />
                                </Column>
                                <Column style={{ padding: "12px 12px 12px 0", verticalAlign: "top" }}>
                                    <Text style={{ margin: 0, fontSize: "14px", lineHeight: "20px", fontWeight: 600, fontFamily: FONT }}>
                                        {item.productUrl ? (
                                            <Link href={item.productUrl} style={{ color: INK, textDecoration: "none" }}>{item.productName}</Link>
                                        ) : (
                                            <span style={{ color: INK }}>{item.productName}</span>
                                        )}
                                    </Text>
                                    {item.variantInfo && <Text style={{ ...smallStyle, marginTop: "2px" }}>{item.variantInfo}</Text>}
                                    <Text style={{ ...smallStyle, marginTop: "2px" }}>
                                        {item.quantity} adet × {formatTry(item.unitPrice)}
                                    </Text>
                                </Column>
                                <Column align="right" style={{ padding: "12px 0", verticalAlign: "top", whiteSpace: "nowrap" }}>
                                    <Text style={{ margin: 0, fontSize: "14px", lineHeight: "20px", fontWeight: 600, color: INK, fontFamily: FONT }}>{formatTry(item.lineTotal)}</Text>
                                </Column>
                            </Row>
                        ))}

                        <Row>
                            <Column style={{ padding: "14px 0 0" }}>
                                <Text style={{ margin: 0, fontSize: "15px", lineHeight: "20px", fontWeight: 700, color: INK, fontFamily: FONT }}>Sepet toplamı</Text>
                            </Column>
                            <Column align="right" style={{ padding: "14px 0 0", whiteSpace: "nowrap" }}>
                                <Text style={{ margin: 0, fontSize: "18px", lineHeight: "20px", fontWeight: 700, color: ORDER_BRAND.color, fontFamily: FONT }}>{formatTry(totalAmount)}</Text>
                            </Column>
                        </Row>
                        <Text style={{ ...smallStyle, marginTop: "6px" }}>
                            Kargo ücreti teslimatta alıcı tarafından ödenir. Fiyat ve stok durumu değişebilir; sipariş anındaki fiyat geçerlidir.
                        </Text>
                    </Section>

                    <Section style={{ padding: "24px 28px 0", textAlign: "center" }}>
                        <Button
                            href={cartUrl}
                            style={{ backgroundColor: ORDER_BRAND.color, color: "#ffffff", borderRadius: "8px", padding: "13px 28px", fontSize: "15px", fontWeight: 700, textDecoration: "none", fontFamily: FONT }}
                        >
                            Sepetime Git
                        </Button>
                        <Text style={{ ...smallStyle, marginTop: "10px" }}>Hesabınıza giriş yaptığınızda sepetiniz açılır.</Text>
                    </Section>

                    <Section style={{ padding: "22px 28px 24px" }}>
                        <Hr style={{ borderColor: LINE, margin: "0 0 14px" }} />
                        {(contactPhone || contactEmail) && (
                            <Text style={{ margin: "0 0 8px", fontSize: "13px", lineHeight: "20px", color: MUTED, fontFamily: FONT }}>
                                Sorunuz mu var? {[contactPhone, contactEmail].filter(Boolean).join(" · ")}
                            </Text>
                        )}
                        <Text style={smallStyle}>
                            Bu e-postayı {ORDER_BRAND.name} hesabınızın sepetinde ürün bulunduğu için aldınız.
                            {unsubscribeUrl && (
                                <>
                                    {" "}Sepet hatırlatma e-postalarını almak istemiyorsanız{" "}
                                    <Link href={unsubscribeUrl} style={{ color: MUTED, textDecoration: "underline" }}>buradan çıkabilirsiniz</Link>.
                                </>
                            )}
                        </Text>
                        <Text style={{ ...smallStyle, marginTop: "6px" }}>
                            {ORDER_BRAND.name} · <Link href={SITE_URL} style={{ color: MUTED, textDecoration: "none" }}>{siteHost}</Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default AbandonedCartNotificationEmail;
