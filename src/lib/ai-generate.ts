import { prisma } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { stripAiLinksAndCitations, convertAiMarkdown } from "@/lib/ai-output";

/** Yapay zeka ayarı eksik / pasif (kullanıcıya 400 olarak gösterilir) */
export class AiConfigError extends Error {}

/** Model çıktısını sitede kullanılabilir HTML'e çevirir */
export function cleanAiHtml(raw: string): string {
    let html = raw
        // Markdown kod blokları (```html ... ```)
        .replace(/```(?:html|HTML|xml|json)?/gi, "")
        .replace(/```/g, "")
        // Çince / Japonca / Korece karakterler (Qwen gibi modeller için güvenlik katmanı)
        .replace(/[一-鿿぀-ゟ゠-ヿ＀-￯]/g, "")
        .trim();
    // İnternette arama yapan modellerin eklediği linkler ve [1] gibi kaynak numaraları kalmasın
    html = stripAiLinksAndCitations(html);
    // Model Markdown yazdıysa (# başlık, **kalın**, - madde) HTML'e çevir; sitede # işaretleri görünmesin
    return convertAiMarkdown(html);
}

/**
 * Panelde seçili sağlayıcıyla (Entegrasyonlar > Yapay Zeka: OpenRouter / Gemini) metin üretir,
 * temizlenmiş HTML döner. Ürün açıklaması ve kategori açıklaması aynı ayarı kullanır.
 */
export async function generateAiHtml(systemPrompt: string, userPrompt: string): Promise<string> {
    const config = await prisma.geminiConfig.findFirst({ where: { isActive: true } });
    if (!config) throw new AiConfigError("Yapay Zeka (AI) yapılandırılmamış veya aktif değil.");

    let text = "";

    if (config.provider === "OPENROUTER" && config.openRouterApiKey) {
        // Veritabanındaki eski ':beta' takısını temizle
        const modelId = (config.openRouterModel || "openai/gpt-4o-mini").replace(":beta", "").trim();

        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.openRouterApiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ladamarketi.com",
                "X-Title": "Ladamarketi B2B",
            },
            body: JSON.stringify({
                model: modelId,
                temperature: 1.0,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
            }),
        });

        const orData = await orRes.json();
        if (orData.error) {
            throw new Error(`OpenRouter Hatası: ${orData.error.message || JSON.stringify(orData.error)}`);
        }
        const message = orData.choices?.[0]?.message;
        if (message?.refusal) throw new Error(`Yapay Zeka Reddi: ${message.refusal}`);

        text = message?.content || "";
        if (!text) {
            throw new Error("Yapay zeka herhangi bir içerik üretmedi. Lütfen modeli veya sağlayıcıyı değiştirip tekrar deneyin.");
        }
    } else if (config.provider === "GEMINI" && config.apiKey) {
        const genAI = new GoogleGenerativeAI(config.apiKey);
        const modelId = config.openRouterModel?.split("/").pop()?.replace(":free", "") || "gemini-1.5-flash";
        const model = genAI.getGenerativeModel({ model: modelId, systemInstruction: systemPrompt });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 1.0 },
        });
        text = (await result.response).text();
    } else {
        throw new AiConfigError("Seçilen sağlayıcı için API anahtarı eksik.");
    }

    return cleanAiHtml(text);
}
