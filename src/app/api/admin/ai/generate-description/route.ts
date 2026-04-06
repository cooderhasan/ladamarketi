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

    const systemPrompt = `Sen 30 yıllık tecrübeli bir LADA USTASI ve otomotiv içerik yazarı ufuksun. 
      GÖREVİN: Ürünü teknik bir katalog gibi değil, bu parçayı yıllardır takan bir usta samimiyetiyle ve uzmanlığıyla anlatmak.

      KESİN KURALLAR:
      1. Üslup: "Bu parça aracınızın can damarıdır..." gibi samimi, güven veren ve uzman bir "Usta" dili kullan. Rakip sitelerdeki o resmi ve soğuk cümle yapılarını ASLA kullanma.
      2. Yasak: Kaynak metindeki hiçbir cümleyi, hatta 3 kelimelik öbeği bile kopyalama. Cümle yapılarını devrik yap, eş anlamlı kelimeler kullan. Metin sonunda kaynak metinden eser kalmasın.
      3. Hedef: Müşteri okuduğunda "Bunu gerçekten bilen biri yazmış" demeli.

      Yazım Planı:
      - 1. Paragraf: Parçanın sürüş keyfine ve konforuna etkisini usta ağzıyla anlat.
      - 2. Paragraf: Teknik detayları (saat, mesafe, dijital ekran vb.) bir öneri şeklinde metne yedir.
      - 3. Paragraf: Montajın önemini ve parça kalitesini vurgula.

      Format: Sadece temiz HTML (<p>, <ul>, <li>, <strong>). Başlık kullanma. Dil %100 Türkçe.`;

    const userPrompt = `USTA, bu parçayı bizim için sıfırdan, kendi cümlelerinle anlatır mısın? Rakip metinden tek bir kelime bile kopyalama.
      
      ÜRÜN ADI: ${productName}
      KAYNAK METİN: ${productDescription}`;

    let generatedHtml = "";

    // 4. Generate Content based on Provider
    if (config.provider === "OPENROUTER" && config.openRouterApiKey) {
        let modelId = config.openRouterModel || "qwen/qwen3.6-plus:free";
        if (modelId === "qwen/qwen-3.6-plus") modelId = "qwen/qwen3.6-plus:free";

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
                temperature: 0.8,
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
        // Correctly handle model ID from config for Gemini provider (strip prefix like google/)
        const modelIdFromConfig = config.openRouterModel?.split("/").pop() || "gemini-1.5-flash";
        
        const model = genAI.getGenerativeModel({ 
            model: modelIdFromConfig,
            systemInstruction: systemPrompt 
        });
        const result = await model.generateContent(userPrompt);
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
