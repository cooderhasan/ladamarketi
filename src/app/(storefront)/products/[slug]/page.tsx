import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/storefront/product-detail";
import { JsonLd } from "@/components/seo/json-ld";
import { Metadata } from "next";
import { getProductReviews, getReviewStats } from "@/app/actions/review";
import { stripHtmlToText, validGtin } from "@/lib/helpers";
import { SITE_URL, absoluteUrl } from "@/lib/site-url";

interface ProductPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
        where: { slug, isActive: true },
        select: { name: true, description: true, images: true }
    });

    if (!product) return { title: "Ürün Bulunamadı" };

    const description = stripHtmlToText(product.description).slice(0, 160) || `${product.name} uygun fiyat ve taksit seçenekleriyle Lada Marketi'nde.`;
    const url = `${SITE_URL}/products/${slug}`;

    return {
        // Marka layout şablonundan eklenir ("| Lada Marketi"); burada da eklenince başlıkta iki kez çıkıyordu
        title: product.name,
        description,
        openGraph: {
            title: product.name,
            description,
            url,
            type: "website",
            images: (product.images || []).map(absoluteUrl),
        },
        alternates: {
            canonical: url
        }
    };
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { slug } = await params;
    const session = await auth();
    const settings = await getSiteSettings();
    const discountRate = session?.user?.discountRate || 0;
    const isDealer =
        (session?.user?.role === "DEALER" && session?.user?.status === "APPROVED") ||
        session?.user?.role === "ADMIN" ||
        session?.user?.role === "OPERATOR";
    const isAuthenticated = !!session?.user;

    const product = await prisma.product.findUnique({
        where: { slug, isActive: true },
        include: {
            category: {
                include: {
                    parent: {
                        include: {
                            parent: true
                        }
                    }
                }
            },
            // Ürünün bağlı olduğu tüm kategoriler (yol satırı en özel olanından kurulur)
            categories: {
                where: { isActive: true },
                include: { parent: { include: { parent: true } } },
            },
            brand: true,
            variants: {
                where: { isActive: true },
            },
        },
    });

    if (!product) {
        notFound();
    }

    // Ana kategori: ürünün bağlı olduğu en alt (en özel) kategori. Eski tekil "category" alanı ürün eklenirken
    // ilk seçilen kategori oluyordu; üst kategori ilk seçildiyse yol satırında alt grup (Şanzıman Grubu vb.) atlanıyordu.
    // Eşit derinlikte, eski ana kategorinin soyundan olan öne alınır.
    const depthOf = (c: any) => (c.parent ? (c.parent.parent ? 3 : 2) : 1);
    const inLegacyLine = (c: any) => [c.id, c.parent?.id, c.parent?.parent?.id].includes(product.categoryId);
    const mainCategory: any =
        [...product.categories].sort(
            (a, b) => depthOf(b) - depthOf(a) || Number(inLegacyLine(b)) - Number(inLegacyLine(a))
        )[0] ?? product.category;

    console.log("Product slug:", slug);
    console.log("Product origin from DB:", product.origin);
    console.log("Product variants count:", product.variants.length);

    // Get related products (ana kategoriden)
    const relatedProducts = await prisma.product.findMany({
        where: {
            isActive: true,
            ...(mainCategory ? { categories: { some: { id: mainCategory.id } } } : { categoryId: product.categoryId }),
            id: { not: product.id },
        },
        include: { category: true, brand: true },
        take: 6,
    });

    const reviews = await getProductReviews(product.id);
    const reviewStats = await getReviewStats(product.id);

    // Serialize product with variants
    const serializedProduct = {
        ...product,
        // Ad üstündeki kategori etiketi ve linkler de ana (en özel) kategoriyi göstersin
        category: mainCategory ?? product.category,
        listPrice: Number(product.listPrice),
        salePrice: product.salePrice ? Number(product.salePrice) : null,
        weight: product.weight ? Number(product.weight) : null,
        width: product.width ? Number(product.width) : null,
        height: product.height ? Number(product.height) : null,
        length: product.length ? Number(product.length) : null,
        desi: product.desi ? Number(product.desi) : null,
        googlePrice: (product as any).googlePrice ? Number((product as any).googlePrice) : null,
        gtin: (product as any).gtin || null,
        mpn: (product as any).mpn || null,
        origin: product.origin,
        variants: product.variants.map(v => ({
            id: v.id,
            color: v.color,
            size: v.size,
            stock: v.stock,
            sku: v.sku,
            barcode: v.barcode,
            priceAdjustment: Number(v.priceAdjustment),
        })),
    };

    // Construct breadcrumbs from category tree
    const breadcrumbs = [];
    let currentCat: any = mainCategory;
    while (currentCat) {
        breadcrumbs.unshift({ name: currentCat.name, slug: currentCat.slug });
        currentCat = currentCat.parent;
    }

    const baseUrl = SITE_URL;
    const absoluteImages = product.images?.map(absoluteUrl) || [];
    // Şemadaki fiyat sayfada ziyaretçiye gösterilenle aynı olmalı: indirimli fiyat liste fiyatından düşükse o
    // (önceden hep liste fiyatı yazılıyordu; indirimli üründe Google'da fiyat uyuşmazlığı oluyordu)
    const listPrice = Number(product.listPrice);
    const salePrice = product.salePrice != null ? Number(product.salePrice) : null;
    const schemaPrice = salePrice != null && salePrice > 0 && salePrice < listPrice ? salePrice : listPrice;

    // GTIN: sadece panelde GTIN alanına girilmiş, sağlama basamağı doğru numara. Barkod alanı kullanılmaz:
    // sistemin ürettiği barkodlar rastgele ("460..."), Google'a gerçek GTIN gibi gönderilirse ürün uyuşmazlığı olur.
    const gtin = validGtin((product as any).gtin);
    // MPN: üretici parça numarası; bizim stok kodumuzla (LDM-...) aynıysa gönderilmez
    const mpn = (product as any).mpn && (product as any).mpn !== product.sku ? (product as any).mpn : undefined;

    const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: absoluteImages,
        description: stripHtmlToText(product.description) || product.name,
        sku: product.sku,
        ...(mpn ? { mpn } : {}),
        ...(gtin ? { [`gtin${gtin.length}`]: gtin } : {}),
        // Markası olmayan üründe marka gönderilmez (mağaza adı marka değildir)
        ...(product.brand?.name ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
        ...(reviewStats.totalReviews > 0
            ? {
                  aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: Number(reviewStats.averageRating.toFixed(1)),
                      reviewCount: reviewStats.totalReviews,
                      bestRating: 5,
                      worstRating: 1,
                  },
              }
            : {}),
        offers: {
            "@type": "Offer",
            url: `${baseUrl}/products/${product.slug}`,
            priceCurrency: "TRY",
            price: schemaPrice,
            priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
            itemCondition: "https://schema.org/NewCondition",
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            seller: {
                "@type": "Organization",
                name: "Lada Marketi",
            },
            // İade politikası (İptal ve İade sayfası): teslimden itibaren 14 gün, kargoyla, iade kargo ücreti
            // müşteriye ait (ayıplı üründe firma öder). Kargo ücreti (shippingDetails) gönderilmiyor: kargo alıcı
            // ödemeli ve tutarı belli değil; Google 0 TL'yi "ücretsiz kargo" sayar.
            hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: "TR",
                returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
                merchantReturnDays: 14,
                returnMethod: "https://schema.org/ReturnByMail",
                returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
            },
        },
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Ana Sayfa",
                "item": baseUrl
            },
            ...breadcrumbs.map((bc, index) => ({
                "@type": "ListItem",
                "position": index + 2,
                "name": bc.name,
                "item": `${baseUrl}/category/${bc.slug}`
            })),
            {
                "@type": "ListItem",
                "position": breadcrumbs.length + 2,
                "name": product.name,
                "item": `${baseUrl}/products/${product.slug}`
            }
        ]
    };

    return (
        <>
            <JsonLd id="product-jsonld" data={schema} />
            <JsonLd id="breadcrumb-jsonld" data={breadcrumbSchema} />
            <ProductDetail
                product={serializedProduct}
                relatedProducts={relatedProducts.map(p => ({
                    ...p,
                    listPrice: Number(p.listPrice),
                    salePrice: p.salePrice ? Number(p.salePrice) : null,
                    weight: p.weight ? Number(p.weight) : null,
                    width: p.width ? Number(p.width) : null,
                    height: p.height ? Number(p.height) : null,
                    length: p.length ? Number(p.length) : null,
                    desi: p.desi ? Number(p.desi) : null,
                    googlePrice: (p as any).googlePrice ? Number((p as any).googlePrice) : null,
                    origin: p.origin,
                }))}
                discountRate={discountRate}
                isDealer={isDealer}
                isAuthenticated={isAuthenticated}
                bankTransferDiscountRate={Number(settings.bankTransferDiscountRate || 0)}
                whatsappNumber={settings.whatsappNumber || settings.phone}
                reviews={reviews.map(r => ({
                    ...r,
                    user: {
                        name: r.user.companyName || r.user.email || "Misafir",
                        image: null
                    }
                }))}
                reviewStats={reviewStats}
                breadcrumbs={breadcrumbs}
            />
        </>
    );
}

