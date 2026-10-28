import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { HeroSlider } from "@/components/storefront/hero-slider";
import { FeaturedProducts } from "@/components/storefront/featured-products";
import { CategorySectionModern } from "@/components/storefront/category-section-modern";
import { CategorySidebarModern } from "@/components/storefront/category-sidebar-modern";
import Link from "next/link";
import Image from "next/image";
import { ModelShortcuts } from "@/components/storefront/model-shortcuts";
import { TrustBar } from "@/components/storefront/trust-bar";
import { WhyUs } from "@/components/storefront/why-us";
import { unstable_cache } from "next/cache";
import { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, absoluteUrl } from "@/lib/site-url";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    let general: any = {};
    try {
        const generalSettings = await prisma.siteSettings.findUnique({
            where: { key: "general" },
        });
        general = (generalSettings?.value as any) || {};
    } catch (error) {
        console.warn("Could not fetch site settings for homepage metadata.", error);
    }

    return {
        title: { absolute: general.seoTitle || general.siteName || "Lada Yedek Parça ve Aksesuar | Lada Marketi" },
        description: general.seoDescription || "Lada yedek parça ve aksesuar toptan ve perakende satış platformu.",
        keywords: general.seoKeywords?.split(",") || [],
        alternates: {
            canonical: "/",
        },
    };
}

async function loadHomeData() {
    const [sliders, featuredProducts, newProducts, bestSellers, categories, sidebarCategories, banners, saleCandidates, productCount] =
        await Promise.all([
            prisma.slider.findMany({
                where: { isActive: true },
                orderBy: { order: "asc" },
            }),
            prisma.product.findMany({
                where: { isActive: true, isFeatured: true },
                include: { category: true, brand: true, _count: { select: { variants: true } } },
                // Sabit sıra: sırasızken düzenlenen ürün listede yer değiştirebiliyordu
                orderBy: [{ createdAt: "desc" }, { id: "asc" }],
                take: 8,
            }),
            prisma.product.findMany({
                where: { isActive: true, isNew: true },
                include: { category: true, brand: true, _count: { select: { variants: true } } },
                // Sabit sıra: sırasızken düzenlenen ürün listede yer değiştirebiliyordu
                orderBy: [{ createdAt: "desc" }, { id: "asc" }],
                take: 8,
            }),
            prisma.product.findMany({
                where: { isActive: true, isBestSeller: true },
                include: { category: true, brand: true, _count: { select: { variants: true } } },
                // Sabit sıra: sırasızken düzenlenen ürün listede yer değiştirebiliyordu
                orderBy: [{ createdAt: "desc" }, { id: "asc" }],
                take: 8,
            }),
            prisma.category.findMany({
                where: { isActive: true, isFeatured: true },
                orderBy: { order: "asc" },
                take: 5,
            }),
            // Sidebar categories (all active top-level)
            prisma.category.findMany({
                where: {
                    isActive: true,
                    parentId: null
                },
                orderBy: { order: "asc" },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    children: {
                        where: { isActive: true },
                        select: { id: true, name: true, slug: true },
                        orderBy: { order: "asc" }
                    }
                }
            }),
            prisma.banner.findMany({
                where: { isActive: true },
                orderBy: { order: "asc" },
            }),
            // Fırsat Ürünleri: stokta olan, indirimli fiyatı liste fiyatından düşük ürünler.
            // İndirim oranı veritabanında sıralanamadığı için en yeni 40 aday alınıp aşağıda orana göre sıralanıyor.
            prisma.product.findMany({
                where: {
                    isActive: true,
                    stock: { gt: 0 },
                    salePrice: { not: null, lt: prisma.product.fields.listPrice },
                },
                include: { category: true, brand: true, _count: { select: { variants: true } } },
                orderBy: [{ createdAt: "desc" }, { id: "asc" }],
                take: 40,
            }),
            prisma.product.count({ where: { isActive: true } }),
        ]);

    const discountOf = (p: any) => {
        const list = Number(p.listPrice || 0);
        return list > 0 ? (list - Number(p.salePrice || 0)) / list : 0;
    };
    const saleProducts = [...saleCandidates].sort((a, b) => discountOf(b) - discountOf(a)).slice(0, 8);

    const transformProduct = (product: any) => ({
        ...product,
        listPrice: Number(product.listPrice),
        salePrice: product.salePrice ? Number(product.salePrice) : null,
        trendyolPrice: product.trendyolPrice ? Number(product.trendyolPrice) : null,
        n11Price: product.n11Price ? Number(product.n11Price) : null,
        hepsiburadaPrice: product.hepsiburadaPrice ? Number(product.hepsiburadaPrice) : null,
        googlePrice: product.googlePrice ? Number(product.googlePrice) : null,
        weight: product.weight ? Number(product.weight) : null,
        width: product.width ? Number(product.width) : null,
        height: product.height ? Number(product.height) : null,
        length: product.length ? Number(product.length) : null,
        desi: product.desi ? Number(product.desi) : null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
    });

    const transformCategory = (category: any) => ({
        ...category,
        createdAt: category.createdAt.toISOString(),
    });

    const transformSlider = (slider: any) => ({
        ...slider,
        createdAt: slider.createdAt.toISOString(),
    });

    const transformBanner = (banner: any) => ({
        ...banner,
        createdAt: banner.createdAt.toISOString(),
        updatedAt: banner.updatedAt.toISOString(),
    });

    return {
        sliders: sliders.map(transformSlider),
        featuredProducts: featuredProducts.map(transformProduct),
        newProducts: newProducts.map(transformProduct),
        bestSellers: bestSellers.map(transformProduct),
        saleProducts: saleProducts.map(transformProduct),
        categories: categories.map(transformCategory),
        sidebarCategories: sidebarCategories,
        banners: banners.map(transformBanner),
        productCount,
    };
}

// Ana sayfa verisi herkes için aynı (kullanıcıya özel fiyat istemcide hesaplanıyor): 60 sn önbellek.
// Önceden her ziyarette ~9 sorgu çalışıyordu. Admin'de yapılan değişiklik en geç 1 dakikada görünür.
const getHomeData = unstable_cache(loadHomeData, ["home-data-v1"], { revalidate: 60, tags: ["home-data"] });

export default async function HomePage() {
    const session = await auth();
    const data = await getHomeData();
    const discountRate = session?.user?.discountRate || 0;
    const isDealer =
        session?.user?.role === "DEALER" && session?.user?.status === "APPROVED";

    let general: any = {};
    try {
        const generalSettings = await prisma.siteSettings.findUnique({
            where: { key: "general" },
        });
        general = (generalSettings?.value as any) || {};
    } catch (e) {
        console.warn("Could not fetch site settings for homepage schema.", e);
    }

    const baseUrl = SITE_URL;
    // Yapısal veride görsel adresi mutlak olmalı (ayarlardaki logo "/uploads/..." şeklinde göreli)
    const logoUrl = absoluteUrl(general.logoUrl || "/logo.png");
    const companySchema = {
        "@context": "https://schema.org",
        "@type": "Store",
        "name": general.siteName || "Lada Marketi",
        "url": baseUrl,
        "logo": logoUrl,
        "image": logoUrl,
        "description": general.seoDescription || "Lada yedek parça ve aksesuar toptan ve perakende satış platformu.",
        "telephone": general.phone || "05345194472",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": general.address || "Fatih Mahallesi Horozlu Sokak No 44-1 (Eski Sanayi) Selçuklu",
            "addressLocality": "Konya",
            "addressCountry": "TR"
        },
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday"
                ],
                "opens": "08:00",
                "closes": "20:00"
            }
        ]
    };

    return (
        <>
            <JsonLd id="company-jsonld" data={companySchema} />
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar - Desktop Only */}
                    <aside className="hidden lg:block lg:col-span-1 h-fit sticky top-32 z-30">
                        <CategorySidebarModern categories={data.sidebarCategories} phone={general.phone} whatsappNumber={general.whatsappNumber} />
                    </aside>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-12">
                        <div className="space-y-6 md:space-y-8">
                            {/* Hero Slider */}
                            <div className="rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5">
                                <HeroSlider sliders={data.sliders} />
                            </div>

                            {/* Sayfanın ana başlığı (H1), görünür ve kısa; önceden ana sayfada H1 yoktu */}
                            <div className="text-center space-y-4 md:space-y-5">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                                        Lada Yedek Parça ve Aksesuar
                                    </h1>
                                    <p className="mt-1.5 text-sm md:text-base text-gray-500 dark:text-gray-400">
                                        Niva, Vega, Samara ve Kalina için orijinal ve yan sanayi parçalar · Türkiye geneline kargo
                                    </p>
                                </div>
                                <ModelShortcuts categories={data.sidebarCategories} />
                            </div>

                            <TrustBar bankTransferDiscountRate={general.bankTransferDiscountRate} />
                        </div>

                        {/* Categories */}
                        {data.categories.length > 0 && (
                            <CategorySectionModern categories={data.categories} />
                        )}

                        {/* New Products */}
                        {data.newProducts.length > 0 && (
                            <FeaturedProducts
                                title="Yeni Ürünler"
                                products={data.newProducts}
                                discountRate={discountRate}
                                isDealer={isDealer}
                                badge="Yeni"
                                variant="new"
                            />
                        )}

                        {/* Fırsat Ürünleri: en yüksek indirimli ürünler, tümü /indirimli-urunler'de; indirimli ürün yoksa görünmez */}
                        {data.saleProducts.length > 0 && (
                            <FeaturedProducts
                                title="Fırsat Ürünleri"
                                products={data.saleProducts}
                                discountRate={discountRate}
                                isDealer={isDealer}
                                variant="deals"
                            />
                        )}

                        {/* Bannerlar: önceden en dipte, footer'ın hemen üstündeydi; artık ürün bölümlerinin arasında.
                            Görseller 800x450 (16:9) ve üzerlerinde yazı var: oran korunuyor, kırpılmıyor, karartılmıyor.
                            Telefonda yana kayan tek satır (alt alta ~620px yer tutuyordu) */}
                        {data.banners.length > 0 && (
                            <section aria-label="Kampanyalar" className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 scroll-px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible md:gap-4">
                                {data.banners.map((banner: any) => (
                                    <Link
                                        key={banner.id}
                                        href={banner.linkUrl || "#"}
                                        className={cn(
                                            "relative w-[85%] shrink-0 snap-start sm:w-auto aspect-[16/9] rounded-2xl overflow-hidden group block ring-1 ring-black/5 dark:ring-white/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300",
                                            !banner.linkUrl && "cursor-default pointer-events-none"
                                        )}
                                    >
                                        <Image
                                            src={banner.imageUrl}
                                            alt={banner.title || "Kampanya"}
                                            fill
                                            sizes="(max-width: 640px) 100vw, 33vw"
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        {banner.title && (
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10">
                                                <h3 className="text-white font-bold text-base md:text-lg drop-shadow-md">{banner.title}</h3>
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </section>
                        )}

                        {/* Featured Products */}
                        {data.featuredProducts.length > 0 && (
                            <FeaturedProducts
                                title="Öne Çıkan Ürünler"
                                products={data.featuredProducts}
                                discountRate={discountRate}
                                isDealer={isDealer}
                                variant="featured"
                            />
                        )}

                        {/* Best Sellers */}
                        {data.bestSellers.length > 0 && (
                            <FeaturedProducts
                                title="Çok Satanlar"
                                products={data.bestSellers}
                                discountRate={discountRate}
                                isDealer={isDealer}
                                badge="Popüler"
                                variant="bestseller"
                            />
                        )}
                    </div>
                </div>

                {/* Neden Lada Marketi: sayfanın kapanışı (önceden en altta bannerlar vardı) */}
                <div className="mt-12 md:mt-16 mb-4">
                    <WhyUs productCount={data.productCount} />
                </div>
            </div>
        </>
    );
}
