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

    const prompt = `
      Sen uzman bir e-ticaret içerik yazarı ve SEO uzmanısın. 
      Sana verilen ürün ismini ve ham açıklama metnini kullanarak, otomobil yedek parça sitemiz için tamamen ÖZGÜN, ikna edici ve SEO uyumlu bir ürün açıklaması yaz.
      
      Ürün İsmi: ${productName}
      Orijinal Açıklama: ${productDescription}

      Kurallar:
      1. Dil: Türkçe.
      2. Orijinal metni asla kelimesi kelimesine kopyalama, anlamı koruyarak sitemizin profesyonel diline göre yeniden yorumla.
      3. Çıktıyı sadece temiz HTML formatında ver (<p>, <ul>, <li> ve <strong> etiketleri kullan).
      4. Önemli teknik terimleri, ürün isimlerini, araç modellerini ve kritik avantajları <strong> etiketleri arasına alarak vurgula.
      5. Başlık (h1, h2) ekleme, sadece içerik metnini ver.
      6. Teknik özellikleri anlaşılır bir liste halinde sun.
    `;

    let generatedHtml = "";

    // 4. Generate Content based on Provider
    if (config.provider === "OPENROUTER" && config.openRouterApiKey) {
        // Eski hatalı ID'yi (qwen-3.6) otomatik olarak düzelt (qwen3.6)
        let modelId = config.openRouterModel || "qwen/qwen3.6-plus:free";
        if (modelId === "qwen/qwen-3.6-plus") modelId = "qwen/qwen3.6-plus:free";

        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.openRouterApiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ladamarketi.com", // Required by OpenRouter
                "X-Title": "Ladamarketi B2B"
            },
            body: JSON.stringify({
                model: modelId,
                messages: [
                    { role: "system", content: "Sen profesyonel bir içerik yazarı ve e-ticaret uzmanısın." },
                    { role: "user", content: prompt }
                ]
            })
        });

        const orData = await orRes.json();
        if (orData.error) throw new Error(`OpenRouter Error: ${orData.error.message || JSON.stringify(orData.error)}`);
        generatedHtml = orData.choices[0].message.content;

    } else if (config.provider === "GEMINI" && config.apiKey) {
        const genAI = new GoogleGenerativeAI(config.apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent(prompt);
        const aiResponse = await result.response;
        generatedHtml = aiResponse.text();
    } else {
        return NextResponse.json({ error: "Seçilen sağlayıcı için API anahtarı eksik." }, { status: 400 });
    }

    // Clean markdown code blocks if AI returns them
    generatedHtml = generatedHtml.replace(/```html/g, "").replace(/```/g, "").trim();

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
