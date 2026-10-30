import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site-url";
import { policyPublicSlug } from "@/lib/policy-slugs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = SITE_URL;

    // Static pages (/blog yoktu, 404 veriyordu; kaldırıldı)
    const routes = [
        "",
        "/about",
        "/contact",
        "/products",
        "/indirimli-urunler",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        changeFrequency: "daily" as const,
        priority: route === "" ? 1 : 0.8,
    }));

    // Categories
    let categories: { slug: string }[] = [];
    try {
        categories = await prisma.category.findMany({
            where: { isActive: true },
            select: { slug: true },
        });
    } catch (error) {
        console.warn("Could not fetch categories for sitemap, skipping.", error);
    }

    // lastModified yok: kategoride güncelleme tarihi tutulmuyor; önceden her istekte "şimdi" yazılıyordu, Google bu durumda tarihi dikkate almıyor
    const categoryUrls = categories.map((category) => ({
        url: `${baseUrl}/category/${category.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    // Products
    let products: { slug: string; updatedAt: Date }[] = [];
    try {
        products = await prisma.product.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true },
        });
    } catch (error) {
        console.warn("Could not fetch products for sitemap, skipping.", error);
    }

    const productUrls = products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // Policies (KVKK, iade, mesafeli satış vb.)
    let policies: { slug: string; updatedAt: Date }[] = [];
    try {
        policies = await prisma.policy.findMany({
            select: { slug: true, updatedAt: true },
        });
    } catch (error) {
        console.warn("Could not fetch policies for sitemap, skipping.", error);
    }

    const policyUrls = policies.map((policy) => ({
        url: `${baseUrl}/policies/${policyPublicSlug(policy.slug)}`,
        lastModified: policy.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.3,
    }));

    return [...routes, ...categoryUrls, ...productUrls, ...policyUrls];
}
