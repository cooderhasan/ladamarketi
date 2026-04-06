import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL gerekli" }, { status: 400 });
    }

    // 1. Get AI Configuration
    const config = await prisma.geminiConfig.findFirst({
        where: { isActive: true }
    });

    if (!config) {
      return NextResponse.json({ error: "Yapay Zeka (AI) yapılandırılmamış veya aktif değil." }, { status: 400 });
    }

    // 2. Fetch Page Content
    let response;
    try {
        response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.google.com/',
            },
            next: { revalidate: 0 }
        });
    } catch (err: any) {
        return NextResponse.json({ 
            success: false, 
            error: `Kaynak siteye erişilirken ağ hatası oluştu: ${err.message || "Bilinmeyen ağ hatası"}` 
        }, { status: 500 });
    }

    if (!response.ok) {
        return NextResponse.json({ 
            success: false, 
            error: `Kaynak siteye ulaşılamadı (Hata Kodu: ${response.status}). Site botu engellemi olabilir.` 
        }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 3. Extract Data
    let productName = $("h1").first().text().trim();
    let productDescription = "";

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
        return NextResponse.json({ error: "Sayfadan ürün bilgisi ayıklanamadı." }, { status: 400 });
    }

    const systemPrompt = `Sen 30 yıllık tecrübesiyle her Lada modelini avucunun içi gibi bilen, müşteriye güven veren, babacan ve profesyonel bir "Lada Yedek Parça Uzmanı"sın. (Sabahki Samimiyet: 2026-04-06)
    İşin; müşteriye parçayı saniyeler içinde en samimi ve en teknik şekilde anlatmak, onun sorununu (hararet, ses, arıza vb.) nasıl çözeceğini belirtmektir.

    NİHAİ KURALLAR (SABAHKİ SAMİMİYET):
    1. ÜSLUP: Ne çok agresif ne de çok resmi ol. 30 yıllık tecrübenin getirdiği o güven veren, babacan ve yardımsever dili kullan. "Sanayi jargonu" ile "Profesyonel dili" sapa sağlam harmanla.
    2. UZUNLUK VE DETAY: Açıklamayı saniyeler içinde kısa kesme. Parçanın neden önemli olduğunu, montaj ipuçlarını ve dayanıklılığını detaylıca (birkaç paragraf) anlat.
    3. HTML FORMATI: <p>, <b>, <ul>, <li> etiketlerini CÖMERTçe kullanarak görsel bir düzen kur.
    4. PROBLEM-ÇÖZÜM: Müşterinin yaşadığı sıkıntıyı anla ve bu parçanın o sıkıntıyı nasıl "sıfır hata" ile çözeceğini anlat.
    5. TEKNİK TABLO ZORUNLULUĞU: Her açıklamanın sonuna mutlaka şık bir HTML <table> yapısı ekle. (Örn: Ürün Kodu, Uyumluluk, Malzeme Türü, Marka Menşei gibi sütunlar yer almalı).
    6. DİL: %100 özgün, akıcı ve sapa sağlam bir Türkçe kullan. Kaynak metni kopyalama, usta dilinle baştan anlat.`;

    const userPrompt = `USTA, bu parçayı bizim için SIFIRDAN, bambaşka bir üslupla anlat. Rakip metnin gölgesi bile kalmasın. 
      
      ÜRÜN ADI: ${productName}
      KAYNAK METİN: ${productDescription || "Rakip sitede açıklama metni bulunamadı. Lütfen sadece ürün adını ve tecrübeni kullanarak (30 yıllık Lada ustası gibi) araca ne gibi bir fayda sağlayacağını anlatan özgün bir tanıtım yaz."}`;

    let generatedHtml = "";

    // 4. Generate Content based on Provider
    if (config.provider === "OPENROUTER" && config.openRouterApiKey) {
        let modelId = config.openRouterModel || "openai/gpt-4o-mini";
        
        // HATA FIX: Veritabanındaki eski ':beta' takısını veya ekleri temizle
        modelId = modelId.replace(":beta", "").trim();

        // Qwen modelleri için artık manuel prefix eklemiyoruz, direkt veritabanındaki ID'yi kullanıyoruz (Nihai Fix: 2026-04-06)
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.openRouterApiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ladamarketi.com", 
                "X-Title": "Ladamarketi B2B"
            },
            body: JSON.stringify({
                model: modelId,
                temperature: 1.0, // Maksimum yaratıcılık
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ]
            })
        });

        const orData = await orRes.json();
        
        if (orData.error) {
            throw new Error(`OpenRouter Hatası: ${orData.error.message || JSON.stringify(orData.error)}`);
        }
        
        const choice = orData.choices?.[0];
        const message = choice?.message;

        if (message?.refusal) {
            throw new Error(`Yapay Zeka Reddi: ${message.refusal}`);
        }

        generatedHtml = message?.content || "";
        
        if (!generatedHtml) {
            throw new Error("Yapay zeka herhangi bir içerik üretmedi. Lütfen modeli veya sağlayıcıyı değiştirip tekrar deneyin.");
        }

    } else if (config.provider === "GEMINI" && config.apiKey) {
        const genAI = new GoogleGenerativeAI(config.apiKey);
        // Clean model ID for native SDK
        const modelIdFromConfig = config.openRouterModel?.split("/").pop()?.replace(":free", "") || "gemini-1.5-flash";
        
        const model = genAI.getGenerativeModel({ 
            model: modelIdFromConfig,
            systemInstruction: systemPrompt 
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
                temperature: 1.0, // Maksimum yaratıcılık
            }
        });
        const aiResponse = await result.response;
        generatedHtml = aiResponse.text();
    }
 else {
        return NextResponse.json({ error: "Seçilen sağlayıcı için API anahtarı eksik." }, { status: 400 });
    }

    // 1. Clean markdown code blocks if AI returns them (case-insensitive)
    generatedHtml = generatedHtml.replace(/```(?:html|HTML|xml|json)?/gi, "").replace(/```/g, "").trim();

    // 2. ABSOLUTE FILTER: Remove any Chinese, Japanese, or Korean characters (CJK) 
    // This is a safety layer for models like Qwen.
    generatedHtml = generatedHtml.replace(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uff00-\uffef]/g, "").trim();

    return NextResponse.json({ 
        success: true, 
        data: generatedHtml,
        sourceName: productName
    });

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu: " + error.message }, { status: 500 });
  }
}
