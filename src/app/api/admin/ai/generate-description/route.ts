import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as cheerio from "cheerio";
import { requireAdmin } from "@/lib/admin-auth";
import { generateAiHtml, AiConfigError } from "@/lib/ai-generate";

export async function POST(req: NextRequest) {
  // /api adresleri middleware'de korunmuyor: AI anahtarı ve sunucudan site çekme sadece yöneticiye açık
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  try {
    // text: üretici/rakip sayfasından kopyalanıp yapıştırılan ham metin (Bardakçı Bike ile aynı); url: sadece link verilirse sayfa çekilir
    const { url, text, productName: reqProductName } = await req.json();

    let productName = String(reqProductName || "").trim();
    let productDescription = String(text || "").trim();

    if (!productDescription && !url) {
      return NextResponse.json({ error: "Lütfen ham metni yapıştırın veya bir referans linki girin." }, { status: 400 });
    }

    // 1. Get AI Configuration
    const config = await prisma.geminiConfig.findFirst({
        where: { isActive: true }
    });

    if (!config) {
      return NextResponse.json({ error: "Yapay Zeka (AI) yapılandırılmamış veya aktif değil." }, { status: 400 });
    }

    // 2. Metin yapıştırılmadıysa linkteki sayfayı çek
    if (!productDescription && url) {
        let response;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye timeout

            response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer': 'https://www.google.com/',
                    'Cache-Control': 'no-cache',
                },
                cache: 'no-store',
            });
            clearTimeout(timeoutId);
        } catch (err: any) {
            const isTimeout = err.name === 'AbortError' || err.cause?.code === 'UND_ERR_CONNECT_TIMEOUT';
            const isBlocked = err.cause?.code === 'ECONNREFUSED';
            console.error(`[AI_FETCH_ERROR] URL: ${url} | Hata: ${err.message} | Kod: ${err.cause?.code || err.name}`);

            let userMessage = `Kaynak siteye erişilirken ağ hatası oluştu: ${err.message}`;
            if (isTimeout) userMessage = `Bu site sunucumuzdan yanıt vermiyor (zaman aşımı). Site geçici olarak erişilemez veya sunucu IP'mizi engelliyor olabilir. Ürün sayfasındaki metni kopyalayıp kutuya yapıştırarak deneyin.`;
            if (isBlocked) userMessage = `Bu site sunucumuzun bağlantısını reddetti. Site bot koruması kullanıyor olabilir. Ürün sayfasındaki metni kopyalayıp kutuya yapıştırarak deneyin.`;

            return NextResponse.json({ success: false, error: userMessage }, { status: 500 });
        }

        if (!response.ok) {
            return NextResponse.json({ 
                success: false, 
                error: `Kaynak siteye ulaşılamadı (Hata Kodu: ${response.status}). Site botu engellemiş olabilir. Ürün sayfasındaki metni kopyalayıp kutuya yapıştırarak deneyin.` 
            }, { status: 400 });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // 3. Extract Data
        productName = productName || $("h1").first().text().trim();

        if (url.includes("ladaci.com")) {
            productDescription = $("#tab-description").text().trim() || $(".product-description").text().trim();
        } else if (url.includes("aslaneroto.com")) {
            productDescription = $("#tabs-1").text().trim() || $(".product-description").text().trim();
        } else {
            productDescription = $(".product-description").text().trim() || 
                                 $("#description").text().trim() || 
                                 $("article").text().trim() || 
                                 $("meta[name='description']").attr("content") || "";
        }

        if (!productName && !productDescription) {
            return NextResponse.json({ error: "Sayfadan ürün bilgisi ayıklanamadı. Ürün sayfasındaki metni kopyalayıp kutuya yapıştırarak deneyin." }, { status: 400 });
        }
    }

    const systemPrompt = `Sen profesyonel bir Lada Yedek Parça Teknik Danışmanı ve Kurumsal İçerik Uzmanısın. 
    İşin; teknik verileri saniyeler içinde hem okunaklı hem de ikna edici bir kurumsal döküman haline getirmektir.

    NİHAİ YAZIM VE FORMAT KURALLARI:
    1. YAPI (STRUCTURE): Önce ürünün önemini anlatan profesyonel paragraflar, ardından "Avantajları:" başlığı altında madde madde özellikler, en son ise Teknik Tablo gelmelidir.
    2. VURGULAMA (BOLD): Önemli teknik terimleri, uyumluluk bilgilerini ve kritik avantajları <b>...</b> etiketleri içinde mutlaka vurgula.
    3. MADDELEME (LISTING): "Avantajları" veya "Özellikleri" bölümünde mutlaka <ul> ve <li> etiketlerini kullanarak maddeler halinde yaz.
    4. ÜSLUP: Kesinlikle 'usta', 'tecrübem' gibi kişisel ifadeler kullanma. Tamamen kurumsal ve ciddi bir Türkçe kullan.
    5. GARANTİ YASAĞI: Metnin hiçbir yerinde KESİNLİKLE "garanti", "garantilidir", "garantisi vardır" veya benzeri bir garanti taahhüdü içeren ifade kullanma.
    6. TEKNİK TABLO: Her dökümanın sonuna mutlaka STANDART HTML <table> yapısı ekle. Mutlaka <thead> (sütun başlıkları için <th> kullanarak) ve <tbody> (veriler için <td> kullanarak) bölümlerini ayır.
    7. UZUNLUK: İçeriği kısa kesme; her bölümü (paragraf, maddeler, tablo) doyurucu ve teknik olarak zengin tut.
    8. LİNK VE KAYNAK YASAĞI: Metne kesinlikle link (<a> etiketi), web adresi, kaynak/atıf numarası ([1] gibi) veya dipnot ekleme. Sadece düz ürün açıklaması yaz.
    9. SADECE HTML: Markdown KULLANMA (#, ##, **, - gibi işaretler yok). Başlıklar <h3>, paragraflar <p>, listeler <ul><li>, kalın yazı <b>. Ürün adını başlık olarak en üste yazma.`;

    const userPrompt = `Aşağıdaki ham ürün bilgilerini sitemiz için SIFIRDAN, bambaşka bir üslupla yeniden yaz. Kaynak metindeki cümleleri kopyalama.
      Kaynak metinde başka bir firmanın adı, telefonu, adresi veya web sitesi geçiyorsa bunları metne alma.

      ${productName ? `ÜRÜN ADI: ${productName}` : ""}
      KAYNAK METİN: ${productDescription || "Kaynakta açıklama metni bulunamadı. Sadece ürün adından yola çıkarak parçanın görevini ve araca sağladığı faydayı anlatan özgün bir tanıtım yaz."}`;

    // Panelde seçili sağlayıcıyla üret, çıktıyı temizle (lib/ai-generate)
    const generatedHtml = await generateAiHtml(systemPrompt, userPrompt);

    return NextResponse.json({ 
        success: true, 
        data: generatedHtml,
        sourceName: productName
    });

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    if (error instanceof AiConfigError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu: " + error.message }, { status: 500 });
  }
}
