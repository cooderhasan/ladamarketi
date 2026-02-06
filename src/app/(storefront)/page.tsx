import { prisma } from "@/lib/db";
import { HeroSlider } from "@/components/storefront/hero-slider";
import { FeaturedProducts } from "@/components/storefront/featured-products";
import { CategorySection } from "@/components/storefront/category-section";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, Shield, HeadphonesIcon } from "lucide-react";
import { auth } from "@/lib/auth";

async function getHomeData() {
    const [sliders, featuredProductsRaw, newProductsRaw, bestSellersRaw, categories] =
        await Promise.all([
            prisma.slider.findMany({
                where: { isActive: true },
                orderBy: { order: "asc" },
            }),
            prisma.product.findMany({
                where: { isActive: true, isFeatured: true },
                include: { category: true },
                take: 8,
            }),
            prisma.product.findMany({
                where: { isActive: true, isNew: true },
                include: { category: true },
                take: 8,
            }),
            prisma.product.findMany({
                where: { isActive: true, isBestSeller: true },
                include: { category: true },
                take: 8,
            }),
            prisma.category.findMany({
                where: { isActive: true },
                orderBy: { order: "asc" },
            }),
        ]);

    const transformProduct = (product: any) => ({
        ...product,
        listPrice: Number(product.listPrice),
    });

    return {
        sliders,
        featuredProducts: featuredProductsRaw.map(transformProduct),
        newProducts: newProductsRaw.map(transformProduct),
        bestSellers: bestSellersRaw.map(transformProduct),
        categories,
    };
}

export default async function HomePage() {
    const session = await auth();
    const data = await getHomeData();
    const discountRate = session?.user?.discountRate || 0;
    const isDealer =
        session?.user?.role === "DEALER" && session?.user?.status === "APPROVED";

    return (
        <div className="space-y-16 pb-16">
            {/* Hero Slider */}
            <HeroSlider sliders={data.sliders} />

            {/* Features */}
            <section className="container mx-auto px-4">
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Hızlı Teslimat
                            </h3>
                            <p className="text-sm text-gray-500">Aynı gün kargo</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <Shield className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Güvenli Ödeme
                            </h3>
                            <p className="text-sm text-gray-500">256-bit SSL</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                            <HeadphonesIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                7/24 Destek
                            </h3>
                            <p className="text-sm text-gray-500">Her zaman yanınızda</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dealer CTA - Only for non-dealers */}
            {!isDealer && (
                <section className="container mx-auto px-4">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-white">
                        <div className="max-w-2xl">
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">
                                Bayi Olun, Özel Fiyatlardan Yararlanın!
                            </h2>
                            <p className="text-blue-100 mb-6">
                                Bayilerimize %20&apos;ye varan özel indirimler sunuyoruz. Hemen
                                kayıt olun ve toptan alışverişin avantajlarını keşfedin.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/register">
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="bg-white text-blue-600 hover:bg-blue-50"
                                    >
                                        Bayi Kayıt
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="border-white text-white hover:bg-white/10"
                                    >
                                        Giriş Yap
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

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
                />
            )}
        </div>
    );
}
