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

const BLOCK_TAG = /^<\/?(p|ul|ol|li|table|thead|tbody|tfoot|tr|th|td|h[1-6]|div|br|hr|blockquote)\b/i;

/**
 * Model HTML yerine (ya da HTML'le karışık) Markdown yazarsa: "## Avantajları" → <h3>, "- madde" → <ul><li>,
 * "**kalın**" → <b>, düz metin blokları → <p>. Baştaki "# Ürün Adı" satırı atılır (ürün adı sayfada zaten başlık).
 * Markdown izi yoksa metne dokunmaz.
 */
export function convertAiMarkdown(src: string): string {
    const hasMarkdown = /^\s*#{1,6}\s/m.test(src) || /\*\*[^*\n]+\*\*/.test(src) || !/<p[\s>]/i.test(src);
    if (!hasMarkdown) return src;

    const lines = src.replace(/\r\n/g, "\n").split("\n");
    const first = lines.findIndex((l) => l.trim() !== "");
    if (first >= 0 && /^#\s+/.test(lines[first].trim())) lines.splice(first, 1);

    const out: string[] = [];
    let para: string[] = [];
    let list: string[] = [];
    const flushPara = () => {
        if (para.length) out.push(`<p>${para.join(" ")}</p>`);
        para = [];
    };
    const flushList = () => {
        if (list.length) out.push(`<ul>${list.map((x) => `<li>${x}</li>`).join("")}</ul>`);
        list = [];
    };

    for (const raw of lines) {
        const l = raw.trim();
        const heading = l.match(/^#{1,6}\s+(.+)$/);
        const item = l.match(/^[-*•]\s+(.+)$/);
        if (!l) {
            flushPara();
            flushList();
        } else if (heading) {
            flushPara();
            flushList();
            out.push(`<h3>${heading[1]}</h3>`);
        } else if (item) {
            flushPara();
            list.push(item[1]);
        } else if (BLOCK_TAG.test(l)) {
            flushPara();
            flushList();
            out.push(l);
        } else {
            flushList();
            para.push(l);
        }
    }
    flushPara();
    flushList();

    return out.join("\n").replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
}
