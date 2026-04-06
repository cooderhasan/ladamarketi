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

    // 1. Get Gemini Configuration
    const config = await prisma.geminiConfig.findFirst({
        where: { isActive: true }
    });

    if (!config || !config.apiKey) {
      return NextResponse.json({ error: "Gemini API yapılandırılmamış veya aktif değil." }, { status: 400 });
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

    // 3. Extract Data (Selectors for ladaci.com and aslaneroto.com)
    let productName = $("h1").first().text().trim();
    let productDescription = "";

    if (url.includes("ladaci.com")) {
        productDescription = $("#tab-description").text().trim();
    } else if (url.includes("aslaneroto.com")) {
        productDescription = $("#tabs-1").text().trim();
    } else {
        // General fallback
        productDescription = $("article").text().trim() || 
                             $(".product-description").text().trim() || 
                             $("meta[name='description']").attr("content") || "";
    }

    if (!productName && !productDescription) {
        return NextResponse.json({ error: "Sayfadan ürün bilgisi ayıklanamadı." }, { status: 400 });
    }

    // 4. Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Sen uzman bir e-ticaret içerik yazarı ve SEO uzmanısın. 
      Sana verilen ürün ismini ve ham açıklama metnini kullanarak, otomobil yedek parça sitemiz için tamamen ÖZGÜN, ikna edici ve SEO uyumlu bir ürün açıklaması yaz.
      
      Ürün İsmi: ${productName}
      Orijinal Açıklama: ${productDescription}

      Kurallar:
      1. Dil: Türkçe.
      2. Orijinal metni asla kelimesi kelimesine kopyalama, anlamı koruyarak sitemizin profesyonel diline göre yeniden yorumla.
      3. Çıktıyı sadece temiz HTML formatında ver (<p> paragraf ve <ul><li> liste etiketleri kullan).
      4. Başlık (h1, h2) ekleme, sadece içerik metnini ver.
      5. Teknik özellikleri anlaşılır bir liste halinde sun.
    `;

    const result = await model.generateContent(prompt);
    const aiResponse = await result.response;
    let generatedHtml = aiResponse.text();

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
