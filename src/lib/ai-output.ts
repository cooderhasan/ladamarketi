/**
 * Yapay zekanın ürettiği açıklamadan link ve kaynak işaretlerini temizler.
 * İnternette arama yapan modeller (web/grounding) metne Google linki, [1] gibi kaynak numaraları
 * ve kaynak adresleri ekleyebiliyor; ürün açıklamasında bunların hiçbiri olmamalı.
 */
export function stripAiLinksAndCitations(html: string): string {
    return html
        // <a href="...">metin</a> → metin
        .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
        // Markdown link [metin](https://...) → metin
        .replace(/\[([^\]]+)\]\((?:https?:\/\/|www\.)[^)]*\)/gi, "$1")
        // Kaynak numaraları: [1], [1, 2], [1-3], [^1], 【1】, [kaynak 1]
        .replace(/\s*\[\^?\s*(?:kaynak\s*)?\d+(?:\s*[,\-–]\s*\d+)*\s*\]/gi, "")
        .replace(/\s*【[^】]*】/g, "")
        // Düz adresler (etiket özniteliklerine dokunmadan)
        .replace(/(^|[\s(>])(?:https?:\/\/|www\.)[^\s<>)"']+/gi, "$1")
        // Boş kalan <sup></sup> ve "()" artıkları
        .replace(/<sup>\s*<\/sup>/gi, "")
        .replace(/\(\s*\)/g, "")
        // Noktalama öncesi kalan boşluk: "kullanılır ." → "kullanılır."
        .replace(/[ \t]+([.,;:!?])/g, "$1")
        .trim();
}
