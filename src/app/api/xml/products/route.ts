
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";

// Cache for 8 hours (3 times a day)
export const revalidate = 28800;

function escapeXml(unsafe: string | null | undefined): string {
    if (!unsafe) return "";
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case "<": return "&lt;";
            case ">": return "&gt;";
            case "&": return "&amp;";
            case "'": return "&apos;";
            case "\"": return "&quot;";
            default: return c;
        }
    });
}

export async function GET(req: NextRequest) {
    // 1. Check Authentication
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
        return new NextResponse("Unauthorized: Missing API Key", { status: 401 });
    }

    const settings = await getSiteSettings();
    const validKey = settings.xmlApiKey;

    if (!validKey || key !== validKey) {
        return new NextResponse("Unauthorized: Invalid API Key", { status: 401 });
    }

    const useSalePrice = settings.xmlUseSalePrice === "true";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ladamarketi.com";

    // 2. Fetch Active Products
    const products = await prisma.product.findMany({
        where: { isActive: true },
        include: {
            categories: {
                take: 1
            },
            brand: true,
            variants: {
                where: { isActive: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    // 3. Generate XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
<title>${escapeXml(settings.siteName || "Lada Marketi")}</title>
<link>${baseUrl}</link>
<description>${escapeXml(settings.seoDescription || "B2B E-Ticaret")}</description>
`;

    for (const product of products) {
        const hasVariants = product.variants.length > 0;
        const mainCategory = product.categories[0]?.name || "Diğer";
        const brandName = product.brand?.name || "Markasız";
        const productUrl = `${baseUrl}/products/${product.slug}`;
        const mainImage = product.images[0] || "";
        const additionalImages = product.images.slice(1);

        // Base price logic
        const listPrice = Number(product.listPrice);
        const salePrice = product.salePrice ? Number(product.salePrice) : null;

        const priceToUse = useSalePrice && salePrice && salePrice > 0 ? salePrice : listPrice;
        const priceFormatted = priceToUse.toFixed(2) + " TRY";
        const listPriceFormatted = listPrice.toFixed(2) + " TRY"; // For 'price' field if sale_price is used

        // Items to output
        const itemsToProcess = hasVariants ? product.variants : [product];

        for (const item of itemsToProcess) {
            const isVariant = "productId" in item; // Simple check if it's a variant object

            // Access properties safely
            /* eslint-disable @typescript-eslint/no-explicit-any */
            const itemId = isVariant ? (item as any).id : product.id;
            const itemSku = (item as any).sku || product.sku || "";
            const itemBarcode = (item as any).barcode || product.barcode || "";
            const itemStock = (item as any).stock || 0;

            // Title & Description
            let title = product.name;
            if (isVariant) {
                const variantParts = [];
                if ((item as any).color) variantParts.push((item as any).color);
                if ((item as any).size) variantParts.push((item as any).size);
                if (variantParts.length > 0) title += ` - ${variantParts.join(" ")}`;
            }

            // Price adjustment for variants
            let finalPrice = priceToUse;
            if (isVariant) {
                const adjustment = Number((item as any).priceAdjustment || 0);
                finalPrice += adjustment;
            }
            const finalPriceFormatted = finalPrice.toFixed(2) + " TRY";

            xml += `<item>
<g:id>${escapeXml(itemId)}</g:id>
<g:item_group_id>${escapeXml(product.id)}</g:item_group_id>
<title>${escapeXml(title)}</title>
<description><![CDATA[${product.description || title}]]></description>
<link>${productUrl}</link>
<g:image_link>${escapeXml(mainImage)}</g:image_link>
${additionalImages.map(img => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n')}
<g:brand>${escapeXml(brandName)}</g:brand>
<g:condition>new</g:condition>
<g:availability>${itemStock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
<g:price>${finalPriceFormatted}</g:price>
${useSalePrice && salePrice && salePrice > 0 ? `<g:sale_price>${finalPriceFormatted}</g:sale_price>` : ""}
${itemSku ? `<g:mpn>${escapeXml(itemSku)}</g:mpn>` : ""}
${itemBarcode ? `<g:gtin>${escapeXml(itemBarcode)}</g:gtin>` : ""}
<g:google_product_category>${escapeXml(mainCategory)}</g:google_product_category>
<g:product_type>${escapeXml(mainCategory)}</g:product_type>
<g:custom_label_0>${itemStock}</g:custom_label_0>
</item>
`;
        }
    }

    xml += `</channel>
</rss>`;

    return new NextResponse(xml, {
        headers: {
            "Content-Type": "application/xml",
            // Cache in Vercel Edge Cache/CDN
            // s-maxage=28800: Cached on CDN for 8 hours
            // stale-while-revalidate=3600: Serve stale content for 1 more hour while updating
            "Cache-Control": "s-maxage=28800, stale-while-revalidate=3600"
        }
    });
}
