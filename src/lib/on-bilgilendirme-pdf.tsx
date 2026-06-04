import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    renderToBuffer,
} from '@react-pdf/renderer';

// ─────────────────────────────────────────────────────────────
// Türkçe karakter desteği için Unicode font kaydı
// ─────────────────────────────────────────────────────────────
Font.register({
    family: 'Roboto',
    fonts: [
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf',
            fontWeight: 'normal',
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc9.ttf',
            fontWeight: 'bold',
        },
    ],
});

// ─────────────────────────────────────────────────────────────
// Satıcı Sabit Bilgileri
// ─────────────────────────────────────────────────────────────
const SELLER = {
    title: 'Konya Lada Yedek Parça Satış Hizmetleri',
    address: 'Fatih Mahallesi Horozlu Sokak No 44-1 (Eski Sanayi) Selçuklu KONYA',
    phone: '0534 519 44 72 - 538 816 84 00',
    email: 'ladamarketi@gmail.com',
    vd: 'Meram',
    vn: '2030321343',
};

// ─────────────────────────────────────────────────────────────
// Stiller
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Roboto',
        fontSize: 9,
        paddingTop: 36,
        paddingBottom: 56,
        paddingHorizontal: 36,
        color: '#1a1a1a',
        lineHeight: 1.4,
    },
    title: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 8,
        textAlign: 'center',
        color: '#555',
        marginBottom: 14,
    },
    sectionHeader: {
        fontSize: 9,
        fontWeight: 'bold',
        backgroundColor: '#2c3e50',
        color: '#ffffff',
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginTop: 10,
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 2,
        paddingHorizontal: 8,
    },
    label: {
        fontWeight: 'bold',
        width: 135,
        flexShrink: 0,
    },
    value: {
        flex: 1,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#34495e',
        paddingVertical: 4,
        paddingHorizontal: 6,
        marginTop: 4,
    },
    tableHeaderText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 8,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 3,
        paddingHorizontal: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
    },
    tableRowAlt: {
        backgroundColor: '#f7f9fa',
    },
    col1: { flex: 4 },
    col2: { width: 36, textAlign: 'center' },
    col3: { width: 75, textAlign: 'right' },
    col4: { width: 75, textAlign: 'right' },
    totalArea: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 6,
        marginTop: 3,
    },
    totalLabel: {
        fontWeight: 'bold',
        minWidth: 110,
        textAlign: 'right',
        marginRight: 8,
    },
    totalValue: {
        fontWeight: 'bold',
        width: 75,
        textAlign: 'right',
    },
    bodyText: {
        paddingHorizontal: 8,
        marginBottom: 3,
    },
    bulletText: {
        paddingHorizontal: 16,
        marginBottom: 2,
    },
    signatureArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 28,
        paddingHorizontal: 8,
    },
    signatureBlock: {
        width: '44%',
        alignItems: 'center',
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#333',
        width: '100%',
        marginTop: 32,
        paddingTop: 4,
    },
    signatureLabel: {
        textAlign: 'center',
        fontSize: 8,
        color: '#444',
    },
    footer: {
        position: 'absolute',
        bottom: 18,
        left: 36,
        right: 36,
        fontSize: 7,
        color: '#999',
        textAlign: 'center',
        borderTopWidth: 0.5,
        borderTopColor: '#ccc',
        paddingTop: 5,
    },
});

// ─────────────────────────────────────────────────────────────
// Yardımcı Fonksiyonlar
// ─────────────────────────────────────────────────────────────
function formatMoney(amount: number): string {
    return (
        new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ' TL'
    );
}

function getPaymentLabel(method: string): string {
    switch (method) {
        case 'BANK_TRANSFER': return 'Havale / EFT';
        case 'CREDIT_CARD': return 'Kredi Kartı / Banka Kartı';
        case 'CURRENT_ACCOUNT': return 'Cari Hesap';
        default: return method;
    }
}

// ─────────────────────────────────────────────────────────────
// Props Arayüzü
// ─────────────────────────────────────────────────────────────
export interface OnBilgilendirmeProps {
    orderNumber: string;
    orderDate: Date;
    customerName: string;
    customerAddress: string;
    customerCity: string;
    customerDistrict?: string;
    customerPhone?: string;
    customerEmail: string;
    items: {
        productName: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
    }[];
    totalAmount: number;
    shippingCost?: number;
    paymentMethod: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CURRENT_ACCOUNT';
}

// ─────────────────────────────────────────────────────────────
// PDF Bileşeni
// ─────────────────────────────────────────────────────────────
const OnBilgilendirmeDocument: React.FC<OnBilgilendirmeProps> = (props) => {
    const {
        orderNumber, orderDate, customerName,
        customerAddress, customerCity, customerDistrict,
        customerPhone, customerEmail,
        items, totalAmount, shippingCost = 0, paymentMethod,
    } = props;

    const fullAddress = [customerAddress, customerDistrict, customerCity]
        .filter(Boolean)
        .join(', ');

    const dateStr = new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric', month: 'long', day: 'numeric',
    }).format(orderDate);

    return (
        <Document title={`Ön Bilgilendirme Formu - ${orderNumber}`} author={SELLER.title}>
            <Page size="A4" style={styles.page}>

                {/* ── Başlık ── */}
                <Text style={styles.title}>
                    TÜKETİCİ MEVZUATI GEREĞİNCE ÖN BİLGİLENDİRME FORMU
                </Text>
                <Text style={styles.subtitle}>
                    Sipariş No: {orderNumber}  |  Tarih: {dateStr}
                </Text>

                {/* ── 1. Satıcı Bilgileri ── */}
                <Text style={styles.sectionHeader}>1. SATICIYA İLİŞKİN BİLGİLER</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Ticari Ünvan:</Text>
                    <Text style={styles.value}>{SELLER.title}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Adres:</Text>
                    <Text style={styles.value}>{SELLER.address}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Telefon:</Text>
                    <Text style={styles.value}>{SELLER.phone}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>E-posta:</Text>
                    <Text style={styles.value}>{SELLER.email}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Vergi Dairesi / No:</Text>
                    <Text style={styles.value}>{SELLER.vd} / {SELLER.vn}</Text>
                </View>

                {/* ── 2. Alıcı Bilgileri ── */}
                <Text style={styles.sectionHeader}>2. ALICIYA İLİŞKİN BİLGİLER</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Adı Soyadı / Ünvanı:</Text>
                    <Text style={styles.value}>{customerName}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Teslimat Adresi:</Text>
                    <Text style={styles.value}>{fullAddress}</Text>
                </View>
                {customerPhone ? (
                    <View style={styles.row}>
                        <Text style={styles.label}>Telefon:</Text>
                        <Text style={styles.value}>{customerPhone}</Text>
                    </View>
                ) : null}
                <View style={styles.row}>
                    <Text style={styles.label}>E-posta:</Text>
                    <Text style={styles.value}>{customerEmail}</Text>
                </View>

                {/* ── 3. Konu ── */}
                <Text style={styles.sectionHeader}>3. KONU</Text>
                <Text style={styles.bodyText}>
                    İşbu Ön Bilgilendirme Formu'nun konusu; Alıcının, aşağıda nitelik ve satış fiyatı
                    belirtilen ürün ya da ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı
                    Tüketicilerin Korunması Hakkında Kanun ve Mesafeli Sözleşmelere Dair Yönetmelik
                    hükümleri gereğince bilgilendirilmesidir.
                </Text>

                {/* ── 4. Ürün Bilgileri ve Ödeme ── */}
                <Text style={styles.sectionHeader}>4. ÜRÜN BİLGİLERİ VE ÖDEME</Text>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, styles.col1]}>Ürün Adı</Text>
                    <Text style={[styles.tableHeaderText, styles.col2]}>Adet</Text>
                    <Text style={[styles.tableHeaderText, styles.col3]}>Birim Fiyat</Text>
                    <Text style={[styles.tableHeaderText, styles.col4]}>Toplam</Text>
                </View>
                {items.map((item, i) => (
                    <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
                        <Text style={styles.col1}>{item.productName}</Text>
                        <Text style={styles.col2}>{item.quantity}</Text>
                        <Text style={styles.col3}>{formatMoney(item.unitPrice)}</Text>
                        <Text style={styles.col4}>{formatMoney(item.lineTotal)}</Text>
                    </View>
                ))}
                {shippingCost > 0 && (
                    <View style={styles.tableRow}>
                        <Text style={styles.col1}>Kargo Bedeli</Text>
                        <Text style={styles.col2}>1</Text>
                        <Text style={styles.col3}>{formatMoney(shippingCost)}</Text>
                        <Text style={styles.col4}>{formatMoney(shippingCost)}</Text>
                    </View>
                )}

                <View style={[styles.totalArea, { marginTop: 6 }]}>
                    <Text style={styles.totalLabel}>Ödeme Şekli:</Text>
                    <Text style={[styles.totalValue, { fontWeight: 'normal' }]}>
                        {getPaymentLabel(paymentMethod)}
                    </Text>
                </View>
                <View style={[styles.totalArea, { marginTop: 2 }]}>
                    <Text style={styles.totalLabel}>TOPLAM TUTAR:</Text>
                    <Text style={styles.totalValue}>{formatMoney(totalAmount)}</Text>
                </View>

                {/* ── 5. Teslimat ── */}
                <Text style={styles.sectionHeader}>5. TESLİMAT</Text>
                <Text style={styles.bodyText}>
                    Teslimat, stok durumuna göre en kısa sürede yapılır. Satıcı, sipariş tarihinden
                    itibaren en geç 30 (otuz) gün içinde ürünü teslim etmekle yükümlüdür. Zorunlu
                    hallerde bu süre en fazla 10 gün daha uzatılabilir; bu durumda alıcı bilgilendirilir.
                </Text>

                {/* ── 6. Cayma Hakkı ── */}
                <Text style={styles.sectionHeader}>6. CAYMA HAKKI</Text>
                <Text style={styles.bodyText}>
                    Alıcı, ürünü teslim aldığı tarihten itibaren 14 (on dört) gün içinde herhangi bir
                    gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.
                    Cayma bildirimini {SELLER.email} adresine veya {SELLER.phone} numaralı
                    telefona iletmeniz yeterlidir. İade kargo bedeli alıcıya aittir.
                </Text>

                {/* ── 7. Cayma Hakkı İstisnaları ── */}
                <Text style={styles.sectionHeader}>7. CAYMA HAKKI İSTİSNALARI</Text>
                <Text style={styles.bulletText}>• Alıcının talepleri doğrultusunda veya açıkça kişiselleştirilmiş ürünler</Text>
                <Text style={styles.bulletText}>• Ambalajı açılmış olması hâlinde iade edilmesi sağlık/hijyen açısından uygun olmayan ürünler</Text>
                <Text style={styles.bulletText}>• Niteliği gereği başka ürünlerle karışan ve ayrıştırılamayan ürünler</Text>
                <Text style={styles.bulletText}>• Teslim sonrası alıcı tarafından montajı/kurulumu gerçekleştirilmiş ürünler</Text>

                {/* ── 8. Yetkili Mahkeme ── */}
                <Text style={styles.sectionHeader}>8. YETKİLİ MAHKEME</Text>
                <Text style={styles.bodyText}>
                    Bu sözleşmeden doğan uyuşmazlıklarda; T.C. Ticaret Bakanlığı'nca ilan edilen parasal
                    sınırlar dahilinde Tüketici Hakem Heyetleri, bu sınırları aşan uyuşmazlıklarda
                    Konya Tüketici Mahkemeleri yetkilidir.
                </Text>

                {/* ── 9. Onay ── */}
                <Text style={styles.sectionHeader}>9. ONAY</Text>
                <Text style={styles.bodyText}>
                    Alıcı, işbu Ön Bilgilendirme Formu'nda yer alan tüm hüküm ve koşulları okuduğunu,
                    anladığını ve kabul ettiğini beyan eder. Sipariş tamamlanması ile form kabul edilmiş
                    sayılır.
                </Text>

                {/* ── İmza Alanı ── */}
                <View style={styles.signatureArea}>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Satıcı Kaşe / İmza</Text>
                        <Text style={styles.signatureLabel}>{SELLER.title}</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Alıcı İmzası</Text>
                        <Text style={styles.signatureLabel}>{customerName}</Text>
                    </View>
                </View>

                {/* ── Altbilgi ── */}
                <Text style={styles.footer}>
                    Bu form, 6502 sayılı Tüketicilerin Korunması Hakkında Kanun ve Mesafeli Sözleşmelere
                    Dair Yönetmelik uyarınca düzenlenmiştir. | {SELLER.title} | Sipariş No: {orderNumber}
                </Text>
            </Page>
        </Document>
    );
};

// ─────────────────────────────────────────────────────────────
// Buffer Üretici — Sunucu taraflı PDF oluşturur
// ─────────────────────────────────────────────────────────────
export async function generateOnBilgilendirmePdf(
    props: OnBilgilendirmeProps
): Promise<Buffer> {
    return renderToBuffer(
        <OnBilgilendirmeDocument {...props} />
    ) as Promise<Buffer>;
}
