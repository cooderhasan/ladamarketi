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
        backgroundColor: '#7b2d00', color: '#ffffff',
        paddingVertical: 4, paddingHorizontal: 8,
        marginTop: 10, marginBottom: 4,
    },
    subHeader: {
        fontWeight: 'bold',
        marginTop: 7,
        marginBottom: 3,
        paddingHorizontal: 8,
        fontSize: 9,
    },
    bodyText: { paddingHorizontal: 8, marginBottom: 3 },
    bulletText: { paddingHorizontal: 16, marginBottom: 2 },
    noteBox: {
        marginTop: 10,
        marginHorizontal: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#fff8e1',
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
    },
    noteText: { fontSize: 8, color: '#78350f' },
    infoRow: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 2 },
    infoLabel: { fontWeight: 'bold', width: 120, flexShrink: 0 },
    infoValue: { flex: 1 },
    footer: {
        position: 'absolute', bottom: 18, left: 36, right: 36,
        fontSize: 7, color: '#999', textAlign: 'center',
        borderTopWidth: 0.5, borderTopColor: '#ccc', paddingTop: 5,
    },
});

export interface IptalIadeProps {
    orderNumber: string;
    orderDate: Date;
    customerName: string;
}

const IptalIadeDocument: React.FC<IptalIadeProps> = ({ orderNumber, orderDate, customerName }) => {
    const dateStr = new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric', month: 'long', day: 'numeric',
    }).format(orderDate);

    return (
        <Document title={`İptal ve İade Koşulları - ${orderNumber}`} author={SELLER.title}>
            <Page size="A4" style={styles.page}>

                <Text style={styles.title}>İPTAL VE İADE KOŞULLARI</Text>
                <Text style={styles.subtitle}>
                    Sipariş No: {orderNumber}  |  Tarih: {dateStr}  |  Müşteri: {customerName}
                </Text>

                {/* ── İnternet Mağazası İade ── */}
                <Text style={styles.sectionHeader}>İNTERNET MAĞAZASINDAN SATIN ALINAN ÜRÜNLER</Text>
                <Text style={styles.bodyText}>
                    İnternetten satın almış olduğunuz ürünü, hiçbir etiketini sökmeden ve araç
                    üzerinde kullanmadan, orijinal kutusuyla teslimat tarihinden itibaren{' '}
                    <Text style={{ fontWeight: 'bold' }}>14 gün içerisinde</Text> aşağıdaki
                    kanallar üzerinden iptal talebinizi ileterek iade edebilirsiniz:
                </Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Telefon:</Text>
                    <Text style={styles.infoValue}>{SELLER.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>E-posta:</Text>
                    <Text style={styles.infoValue}>{SELLER.email}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Web:</Text>
                    <Text style={styles.infoValue}>{SELLER.website}</Text>
                </View>
                <Text style={[styles.bodyText, { marginTop: 4 }]}>
                    6502 sayılı Tüketicinin Korunması Hakkındaki Kanun'a göre fiziki mağazalardan
                    alınan ürünlerde cayma hakkı bulunmamaktadır.
                </Text>
                <Text style={[styles.bodyText, { fontWeight: 'bold', marginTop: 4 }]}>
                    İade etmek istediğiniz ürünü, iade sebebinizi bildiren bir not eki ve faturanız
                    ile birlikte gönderiniz. Faturası kurumsal olan siparişlerde, kurum adına
                    düzenlenmiş İADE FATURASI kesilmediği takdirde iade işlemi tamamlanamaz.
                </Text>

                {/* ── Genel İade Şartları ── */}
                <Text style={styles.sectionHeader}>GENEL İADE VE DEĞİŞİM ŞARTLARI</Text>
                <Text style={styles.bulletText}>
                    • İadeler mutlak surette orijinal kutu veya ambalajı ile birlikte yapılmalıdır.
                </Text>
                <Text style={styles.bulletText}>
                    • Orijinal kutusu/ambalajı bozulmuş, etiketleri sökülmüş, araç üzerinde
                    denenmiş, montajı yapılmış veya herhangi bir şekilde zarar görmüş ürünlerin
                    iadesi kabul edilemez.
                </Text>
                <Text style={styles.bulletText}>
                    • İade ile birlikte orijinal faturanın tüm kopyaları ve iade sebebini içeren
                    bir dilekçe gönderilmelidir.
                </Text>
                <Text style={styles.bulletText}>
                    • Ayıplı ürünlerin iadesinde kargo ücreti firmamız tarafından karşılanır.
                </Text>
                <Text style={styles.bulletText}>
                    • Ürün seçiminde uyumsuzluk problemi yaşanabilecek ürünler için ürün üzerinde
                    değişiklik yaptırmayınız; bu durum iade işlemini imkânsız hale getirir.
                </Text>
                <Text style={styles.bulletText}>
                    • Ürün teslim alındığında kargo elemanı yanında ambalajını açarak kontrol
                    etme hakkınız mevcuttur. Kargodan kaynaklı hasarlar hasar tespit tutanağına
                    yazdırılmalıdır.
                </Text>

                {/* ── İade İşlem Süreci ── */}
                <Text style={styles.sectionHeader}>İADE İŞLEM SÜRECİ</Text>
                <Text style={styles.bulletText}>
                    • Gelen ürün İade Bölümü tarafından incelenir; gerekirse yetkili servisine
                    test için gönderilir. Yukarıdaki şartlara uygunsa iade işlemi başlatılır.
                    Bu süreç 7-14 iş günü arasında değişmektedir.
                </Text>
                <Text style={styles.bulletText}>
                    • İade işleminde alışveriş tutarı, kargo ücreti düşülerek iade edilir.
                </Text>
                <Text style={styles.bulletText}>
                    • İade işleminiz tamamlandığında bu alışverişten kazanılan hediye çeki ve
                    puan bakiyelerinin tamamı hesabınızdan düşülür.
                </Text>
                <Text style={styles.bulletText}>
                    • Fiziki mağazadan kartla satın alınan ürünlerde karta iade yalnızca aynı
                    gün içinde ve ürün kullanılmamış, etiketsiz, montajsız olması durumunda
                    mümkündür.
                </Text>

                {/* ── Önemli Not ── */}
                <View style={styles.noteBox}>
                    <Text style={[styles.noteText, { fontWeight: 'bold', marginBottom: 2 }]}>
                        ÖNEMLİ NOT
                    </Text>
                    <Text style={styles.noteText}>
                        Ürün teslim alındıktan sonraki 12 saat geçmesinin ardından hata, çizik,
                        ezik, kırık veya hasar bildirimleri kabul edilmeyecektir. Lütfen ürününüzü
                        teslim aldığınızda kontrol ediniz.
                    </Text>
                </View>

                {/* ── İletişim ── */}
                <Text style={styles.sectionHeader}>İADE VE İPTAL İÇİN İLETİŞİM</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Telefon:</Text>
                    <Text style={styles.infoValue}>{SELLER.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>E-posta:</Text>
                    <Text style={styles.infoValue}>{SELLER.email}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Adres:</Text>
                    <Text style={styles.infoValue}>{SELLER.address}</Text>
                </View>

                <Text style={styles.footer}>
                    {SELLER.title} | Sipariş No: {orderNumber} | {dateStr}
                </Text>
            </Page>
        </Document>
    );
};

export async function generateIptalIadePdf(props: IptalIadeProps): Promise<Buffer> {
    return renderToBuffer(<IptalIadeDocument {...props} />) as Promise<Buffer>;
}
