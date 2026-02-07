import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { HeroSlider } from "@/components/storefront/hero-slider";
import { FeaturedProducts } from "@/components/storefront/featured-products";
import { CategorySection } from "@/components/storefront/category-section";
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
        take: 4, // Limit to 4 as requested for category section
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

              {/* Features */}
              <section className="grid gap-6 md:grid-cols-3">
                <div className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Hızlı Teslimat
                    </h3>
                    <p className="text-sm text-gray-500">Aynı gün kargo</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Güvenli Ödeme
                    </h3>
                    <p className="text-sm text-gray-500">256-bit SSL</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <HeadphonesIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      7/24 Destek
                    </h3>
                    <p className="text-sm text-gray-500">Her zaman yanınızda</p>
                  </div>
                </div>
              </section>
              {/* Categories */}
              {data.categories.length > 0 && (
                <CategorySection categories={data.categories} />
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
        </div>
      </main>
      <StorefrontFooter settings={settings} policies={data.policies} />
    </div>
  );
}
