import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { HeroSlider } from "@/components/storefront/hero-slider";
import { FeaturedProducts } from "@/components/storefront/featured-products";
import { CategorySectionModern } from "@/components/storefront/category-section-modern";
import { CategorySidebar } from "@/components/storefront/category-sidebar";
import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, Shield, HeadphonesIcon } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getHomeData() {
  const [sliders, featuredProducts, newProducts, bestSellers, categories, sidebarCategories, headerCategories, policies] =
    await Promise.all([
      prisma.slider.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      }),
      prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        include: { category: true, brand: true },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isActive: true, isNew: true },
        include: { category: true, brand: true },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isActive: true, isBestSeller: true },
        include: { category: true, brand: true },
        take: 8,
      }),
      prisma.category.findMany({
        where: { isActive: true, isFeatured: true },
        orderBy: { order: "asc" },
        take: 5, // Updated to 5 as requested
      }),
      // Sidebar categories (all active top-level)
      prisma.category.findMany({
        where: {
          isActive: true,
          parentId: "cml9exnw20009orv864or2ni2"
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
      // Header categories with fallback logic
      (async () => {
        let cats = await prisma.category.findMany({
          where: { isActive: true, isInHeader: true },
          orderBy: [{ headerOrder: "asc" }, { order: "asc" }],
          select: {
            id: true, name: true, slug: true, isInHeader: true,
            children: {
              where: { isActive: true },
              select: { id: true, name: true, slug: true },
              orderBy: { order: "asc" }
            }
          }
        });

        if (cats.length === 0) {
          cats = await prisma.category.findMany({
            where: { isActive: true, parent: { name: "Home" } },
            orderBy: { order: "asc" },
            take: 10,
            select: {
              id: true, name: true, slug: true, isInHeader: true,
              children: {
                where: { isActive: true },
                select: { id: true, name: true, slug: true },
                orderBy: { order: "asc" }
              }
            }
          });

          if (cats.length === 0) {
            cats = await prisma.category.findMany({
              where: { isActive: true, parentId: null },
              orderBy: { order: "asc" },
              take: 10,
              select: {
                id: true, name: true, slug: true, isInHeader: true,
                children: {
                  where: { isActive: true },
                  select: { id: true, name: true, slug: true },
                  orderBy: { order: "asc" }
                }
              }
            });
          }
        }
        return cats;
      })(),
      prisma.policy.findMany({
        select: { slug: true, title: true }
      }),
    ]);

  // Helper to convert Decimal to number and Date to string
  const transformProduct = (product: any) => ({
    ...product,
    listPrice: Number(product.listPrice),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    trendyolPrice: product.trendyolPrice ? Number(product.trendyolPrice) : null,
    n11Price: product.n11Price ? Number(product.n11Price) : null,
    hepsiburadaPrice: product.hepsiburadaPrice ? Number(product.hepsiburadaPrice) : null,
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

  return {
    sliders: sliders.map(transformSlider),
    featuredProducts: featuredProducts.map(transformProduct),
    newProducts: newProducts.map(transformProduct),
    bestSellers: bestSellers.map(transformProduct),
    categories: categories.map(transformCategory),
    sidebarCategories: sidebarCategories,
    headerCategories: headerCategories,
    policies: policies,
  };
}

export default async function HomePage() {
  const session = await auth();
  const data = await getHomeData();
  const settings = await getSiteSettings();
  const discountRate = session?.user?.discountRate || 0;
  const isDealer =
    session?.user?.role === "DEALER" && session?.user?.status === "APPROVED";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <StorefrontHeader
        user={session?.user}
        logoUrl={settings.logoUrl}
        siteName={settings.siteName}
        categories={data.headerCategories}
        phone={settings.phone}
        facebookUrl={settings.facebookUrl}
        instagramUrl={settings.instagramUrl}
        twitterUrl={settings.twitterUrl}
        linkedinUrl={settings.linkedinUrl}
      />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Desktop Only */}
            <aside className="hidden lg:block lg:col-span-1 h-fit sticky top-24 z-30">
              <CategorySidebar categories={data.sidebarCategories} />
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Hero Slider */}
              <div className="rounded-xl overflow-hidden shadow-sm">
                <HeroSlider sliders={data.sliders} />
              </div>



              {/* Features - Modern Frameless Design */}
              <section className="grid gap-2 grid-cols-3 py-4 border-y border-gray-100 dark:border-gray-800">
                <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 group text-center md:text-left">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-[10px] md:text-sm leading-tight">
                      Hızlı Teslimat
                    </h3>
                    <p className="hidden md:block text-xs text-gray-500">Aynı gün kargo imkanı</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 group text-center md:text-left">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shrink-0">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-[10px] md:text-sm leading-tight">
                      Güvenli Ödeme
                    </h3>
                    <p className="hidden md:block text-xs text-gray-500">256-bit SSL sertifikası</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 group text-center md:text-left">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0">
                    <HeadphonesIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-[10px] md:text-sm leading-tight">
                      7/24 Destek
                    </h3>
                    <p className="hidden md:block text-xs text-gray-500">Müşteri hizmetleri desteği</p>
                  </div>
                </div>
              </section>
              {/* Categories */}
              {data.categories.length > 0 && (
                <CategorySectionModern categories={data.categories} />
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

          {/* Features - Modern Frameless Design */}
          <section className="mt-12 py-8 border-t border-gray-100 dark:border-gray-800">
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-3">
              <div className="flex items-center justify-center gap-4 group">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    Hızlı Teslimat
                  </h3>
                  <p className="text-sm text-gray-500">Aynı gün kargo imkanı</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 group">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shrink-0">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    Güvenli Ödeme
                  </h3>
                  <p className="text-sm text-gray-500">256-bit SSL sertifikası</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 group">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0">
                  <HeadphonesIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    7/24 Destek
                  </h3>
                  <p className="text-sm text-gray-500">Müşteri hizmetleri desteği</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <StorefrontFooter settings={settings} policies={data.policies} />
    </div>
  );
}
