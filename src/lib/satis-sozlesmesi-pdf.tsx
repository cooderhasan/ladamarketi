import React from 'react';
import path from 'path';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    renderToBuffer,
} from '@react-pdf/renderer';

const FONT_DIR = path.join(process.cwd(), 'public', 'fonts');
Font.register({
    family: 'NotoSans',
    fonts: [
        { src: path.join(FONT_DIR, 'NotoSans-Regular.ttf'), fontWeight: 'normal' },
        { src: path.join(FONT_DIR, 'NotoSans-Bold.ttf'),    fontWeight: 'bold' },
    ],
});

const SELLER = {
    title: 'Konya Lada Yedek Parça Satış Hizmetleri',
    address: 'Fatih Mahallesi Horozlu Sokak No 44-1 (Eski Sanayi) Selçuklu KONYA',
    phone: '0534 519 44 72 - 538 816 84 00',
    email: 'ladamarketi@gmail.com',
    website: 'www.ladamarketi.com',
    vd: 'Meram',
    vn: '2030321343',
};

const styles = StyleSheet.create({
    page: {
        fontFamily: 'NotoSans',
        fontSize: 9,
        paddingTop: 36,
        paddingBottom: 56,
        paddingHorizontal: 36,
        color: '#1a1a1a',
        lineHeight: 1.45,
    },
    title: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
    subtitle: { fontSize: 8, textAlign: 'center', color: '#555', marginBottom: 14 },
    sectionHeader: {
        fontSize: 9, fontWeight: 'bold',
        backgroundColor: '#1a3c5e', color: '#ffffff',
        paddingVertical: 4, paddingHorizontal: 8,
        marginTop: 10, marginBottom: 4,
    },
    maddeTitle: {
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 2,
        paddingHorizontal: 8,
    },
    bodyText: { paddingHorizontal: 8, marginBottom: 3 },
    footer: {
        position: 'absolute', bottom: 18, left: 36, right: 36,
        fontSize: 7, color: '#999', textAlign: 'center',
        borderTopWidth: 0.5, borderTopColor: '#ccc', paddingTop: 5,
    },
});

export interface SatisSozlesmesiProps {
    orderNumber: string;
    orderDate: Date;
    customerName: string;
    customerAddress: string;
    customerCity: string;
    customerDistrict?: string;
    customerPhone?: string;
    customerEmail: string;
}

const SatisSozlesmesiDocument: React.FC<SatisSozlesmesiProps> = (props) => {
    const { orderNumber, orderDate, customerName, customerAddress, customerCity,
        customerDistrict, customerPhone, customerEmail } = props;

    const fullAddress = [customerAddress, customerDistrict, customerCity].filter(Boolean).join(', ');
    const dateStr = new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }).format(orderDate);

    return (
        <Document title={`Mesafeli Satış Sözleşmesi - ${orderNumber}`} author={SELLER.title}>
            <Page size="A4" style={styles.page}>

                <Text style={styles.title}>MESAFELİ SATIŞ SÖZLEŞMESİ</Text>
                <Text style={styles.subtitle}>
                    Sipariş No: {orderNumber}  |  Tarih: {dateStr}
                </Text>

                <Text style={styles.sectionHeader}>TARAFLAR</Text>
                <Text style={styles.maddeTitle}>SATICI:</Text>
                <Text style={styles.bodyText}>Ticari Ünvan: {SELLER.title}</Text>
                <Text style={styles.bodyText}>Adres: {SELLER.address}</Text>
                <Text style={styles.bodyText}>Telefon: {SELLER.phone}</Text>
                <Text style={styles.bodyText}>E-Posta: {SELLER.email}</Text>
                <Text style={styles.bodyText}>Web: {SELLER.website}</Text>
                <Text style={styles.bodyText}>Vergi Dairesi / No: {SELLER.vd} / {SELLER.vn}</Text>

                <Text style={styles.maddeTitle}>ALICI:</Text>
                <Text style={styles.bodyText}>Ad Soyad / Ünvan: {customerName}</Text>
                <Text style={styles.bodyText}>Adres: {fullAddress}</Text>
                {customerPhone ? <Text style={styles.bodyText}>Telefon: {customerPhone}</Text> : null}
                <Text style={styles.bodyText}>E-Posta: {customerEmail}</Text>

                <Text style={styles.sectionHeader}>Madde - 1  KONU</Text>
                <Text style={styles.bodyText}>
                    İşbu sözleşmenin konusu; SATICI'nın, ALICI'ya satışını yaptığı ürünün satışı ve
                    teslimi ile ilgili olarak 4077 sayılı Tüketicilerin Korunması Hakkındaki Kanun'un
                    Mesafeli Sözleşmelere ilişkin hükümleri gereğince tarafların hak ve
                    yükümlülüklerinin belirlenmesidir.
                </Text>

                <Text style={styles.sectionHeader}>Madde - 2  SÖZLEŞME KONUSU ÜRÜN BİLGİLERİ</Text>
                <Text style={styles.bodyText}>
                    Mal/Ürün veya Hizmetin; türü, miktarı, marka/modeli, rengi, adedi, satış bedeli ve
                    ödeme şekli, {SELLER.website} sitesinde belirtildiği şekildedir. Bu bilgiler
                    ALICI'ya bildirilmeden değişiklik gösterebilmektedir.
                </Text>

                <Text style={styles.sectionHeader}>Madde - 3  GENEL HÜKÜMLER</Text>
                <Text style={styles.bodyText}>
                    3.1 - ALICI, sözleşme konusu ürünün temel nitelikleri, satış fiyatı ve ödeme
                    şekli ile teslimata ilişkin tüm ön bilgileri okuyup bilgi sahibi olduğunu ve
                    elektronik ortamda gerekli teyidi verdiğini beyan eder.
                </Text>
                <Text style={styles.bodyText}>
                    3.2 - Sözleşme konusu ürün, yasal 30 günlük süreyi aşmamak koşuluyla her bir
                    ürün için alıcının yerleşim yerinin uzaklığına bağlı olarak ön bilgiler içinde
                    açıklanan süre içinde teslim edilir.
                </Text>
                <Text style={styles.bodyText}>
                    3.3 - SATICI, sözleşme konusu ürünün sağlam, eksiksiz ve siparişte belirtilen
                    niteliklere uygun teslim edilmesinden sorumludur.
                </Text>
                <Text style={styles.bodyText}>
                    3.4 - Sözleşme konusu ürünün teslimatı için satış bedelinin ödenmiş olması
                    şarttır. Herhangi bir nedenle ürün bedeli ödenmez veya banka kayıtlarında iptal
                    edilirse, SATICI ürünün teslimi yükümlülüğünden kurtulmuş kabul edilir.
                </Text>
                <Text style={styles.bodyText}>
                    3.5 - SATICI, mücbir sebepler nedeniyle sözleşme konusu ürünü süresi içinde
                    teslim edemez ise durumu ALICI'ya bildirmekle yükümlüdür.
                </Text>
                <Text style={styles.bodyText}>
                    3.6 - Arızalı veya bozuk ürünlerin garantisi kapsamında gerekli işlemin
                    yapılması için ürün ALICI tarafından teslim alındığı tarihten itibaren 7 gün
                    içinde SATICI'ya iade edilmeli; nakliye bedeli SATICI tarafından karşılanır.
                </Text>

                <Text style={styles.sectionHeader}>Madde - 4  CAYMA HAKKI</Text>
                <Text style={styles.bodyText}>
                    ALICI, sözleşme konusu ürünü teslim aldığı tarihten itibaren 14 (on dört) gün
                    içinde cayma hakkına sahiptir. Cayma hakkının kullanılabilmesi için bu süre
                    içinde SATICI'ya ({SELLER.email} veya {SELLER.phone}) bildirimde
                    bulunulması ve ürünün kullanılmamış ve ambalajının zarar görmemiş olması şarttır.
                    Cayma hakkı nedeniyle iade edilen ürünün kargo bedeli ALICI'ya aittir.
                </Text>

                <Text style={styles.sectionHeader}>Madde - 5  YETKİLİ MAHKEME</Text>
                <Text style={styles.bodyText}>
                    Bu sözleşmenin uygulanmasında, T.C. Sanayi ve Ticaret Bakanlığı'nca ilan edilen
                    değere kadar Tüketici Hakem Heyetleri ile ALICI'nın veya SATICI'nın yerleşim
                    yerindeki Tüketici Mahkemeleri yetkilidir. Siparişin onaylanması durumunda,
                    ALICI işbu sözleşmenin tüm hükümlerini kabul etmiş sayılır.
                </Text>

                <Text style={[styles.bodyText, { marginTop: 20, textAlign: 'center', fontWeight: 'bold' }]}>
                    Sipariş No: {orderNumber}  |  {dateStr}
                </Text>

                <Text style={styles.footer}>
                    {SELLER.title} | {SELLER.address} | {SELLER.phone} | {SELLER.email}
                </Text>
            </Page>
        </Document>
    );
};

export async function generateSatisSozlesmesiPdf(props: SatisSozlesmesiProps): Promise<Buffer> {
    return renderToBuffer(<SatisSozlesmesiDocument {...props} />) as Promise<Buffer>;
}
