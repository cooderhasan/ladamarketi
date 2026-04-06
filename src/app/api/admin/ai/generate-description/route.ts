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
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    if (!response.ok) {
        return NextResponse.json({ error: "Sayfa içeriği çekilemedi." }, { status: 500 });
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

    const systemPrompt = `Sen 30 yıllık tecrübeli bir LADA USTASI ve agresif bir satış pazarlama uzmanısın. 

      KESİN VE DEĞİŞMEZ KURALLAR:
      1. ASLA "Aracın gösterge panelinde..." veya "Kritik bir role sahiptir" gibi kaynak metinde geçen giriş kalıplarını kullanma. Bu cümlelerle başlarsan görev başarısızdır.
      2. Yıkıcı Yazım: Kaynak metindeki cümle yapılarını tamamen boz. Cümlelerin yarısını DEVRİK (yüklemi ortada) yap. Eş anlamlı kelimeleri zorunlu tut.
      3. Problem-Çözüm Kurgusu:
         - Giriş (Korku/İhtiyaç): "Hız göstergeniz bir an dursa başınıza ne işler açılır biliyor musunuz?" veya "Yolda giderken saatiniz mi durdu?" gibi bir problemle başla.
         - Gelişme (Çözüm): Bu parçanın neden en sağlam çözüm olduğunu, uyumluluğunu (Lada Vega vb.) bir usta ağzıyla anlat.
         - Sonuç (Güven): "Arabanızın sağlığı bizim işimiz" tonunda bitir.
      4. Teknik Veri: Teknik detayları (Ürün kodu, Barkod vb.) KESİNLİKLE metnin en altına "Teknik Detay Tablosu" gibi şık bir liste (ul/li) olarak koy, paragraf içine yedirme.

      Biçimlendirme: Sadece temiz HTML (<p>, <ul>, <li>, <strong>). Dil %100 Türkçe.`;

    const userPrompt = `USTA, bu parçayı bizim için SIFIRDAN, bambaşka bir üslupla anlat. Rakip metnin gölgesi bile kalmasın. 
      
      ÜRÜN ADI: ${productName}
      KAYNAK METİN: ${productDescription}`;

    let generatedHtml = "";

    // 4. Generate Content based on Provider
    if (config.provider === "OPENROUTER" && config.openRouterApiKey) {
        let modelId = config.openRouterModel || "openai/gpt-4o-mini";
        
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
        if (orData.error) throw new Error(`OpenRouter Error: ${orData.error.message || JSON.stringify(orData.error)}`);
        generatedHtml = orData.choices[0].message.content;

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

    // Clean markdown code blocks if AI returns them (case-insensitive and handles various tags)
    generatedHtml = generatedHtml.replace(/```(?:html|HTML|xml|json)?/gi, "").replace(/```/g, "").trim();

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
