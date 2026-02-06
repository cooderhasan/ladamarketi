import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    try {
        // Try loading dotenv for local development
        const dotenv = await import("dotenv");
        dotenv.config();
    } catch (e) {
        // Ignore if dotenv is not found (e.g. in production where env vars are injected)
        console.log("Info: dotenv not loaded (using system environment variables)");
    }

    console.log("🌱 Seeding database...");

    // Create discount groups
    const discountGroups = await Promise.all([
        prisma.discountGroup.upsert({
            where: { name: "Standart Bayi" },
            update: {},
            create: { name: "Standart Bayi", discountRate: 0 },
        }),
        prisma.discountGroup.upsert({
            where: { name: "Bayi %5" },
            update: {},
            create: { name: "Bayi %5", discountRate: 5 },
        }),
        prisma.discountGroup.upsert({
            where: { name: "Bayi %10" },
            update: {},
            create: { name: "Bayi %10", discountRate: 10 },
        }),
        prisma.discountGroup.upsert({
            where: { name: "Bayi %15" },
            update: {},
            create: { name: "Bayi %15", discountRate: 15 },
        }),
        prisma.discountGroup.upsert({
            where: { name: "Bayi %20" },
            update: {},
            create: { name: "Bayi %20", discountRate: 20 },
        }),
    ]);

    console.log("✅ Created discount groups:", discountGroups.length);

    // Create admin user
    // Create admin user
    const adminPassword = await bcrypt.hash("Ahmet.91!Tufekci_2025*Guvenli", 12);
    const admin = await prisma.user.upsert({
        where: { email: "ahmetufekci91@gmail.com" },
        update: {
            passwordHash: adminPassword,
            role: "ADMIN",
            status: "APPROVED",
        },
        create: {
            email: "ahmetufekci91@gmail.com",
            passwordHash: adminPassword,
            companyName: "B2B Admin",
            role: "ADMIN",
            status: "APPROVED",
        },
    });

    console.log("✅ Created admin user:", admin.email);

    // Create categories
    const categories = await Promise.all([
        prisma.category.upsert({
            where: { slug: "elektronik" },
            update: {},
            create: { name: "Elektronik", slug: "elektronik", order: 1 },
        }),
        prisma.category.upsert({
            where: { slug: "giyim" },
            update: {},
            create: { name: "Giyim", slug: "giyim", order: 2 },
        }),
        prisma.category.upsert({
            where: { slug: "ev-yasam" },
            update: {},
            create: { name: "Ev & Yaşam", slug: "ev-yasam", order: 3 },
        }),
        prisma.category.upsert({
            where: { slug: "spor" },
            update: {},
            create: { name: "Spor", slug: "spor", order: 4 },
        }),
    ]);

    console.log("✅ Created categories:", categories.length);

    // Create sample products
    const products = await Promise.all([
        prisma.product.upsert({
            where: { slug: "laptop-pro-15" },
            update: {},
            create: {
                name: "Laptop Pro 15",
                slug: "laptop-pro-15",
                description: "15 inç profesyonel laptop, i7 işlemci, 16GB RAM, 512GB SSD",
                listPrice: 45000,
                vatRate: 20,
                minQuantity: 1,
                stock: 50,
                images: [],
                isFeatured: true,
                isNew: true,
                categoryId: categories[0].id,
            },
        }),
        prisma.product.upsert({
            where: { slug: "kablosuz-mouse" },
            update: {},
            create: {
                name: "Kablosuz Mouse",
                slug: "kablosuz-mouse",
                description: "Ergonomik kablosuz mouse, 2.4GHz bağlantı",
                listPrice: 350,
                vatRate: 20,
                minQuantity: 10,
                stock: 500,
                images: [],
                isFeatured: true,
                categoryId: categories[0].id,
            },
        }),
        prisma.product.upsert({
            where: { slug: "erkek-tisort-basic" },
            update: {},
            create: {
                name: "Erkek Tişört Basic",
                slug: "erkek-tisort-basic",
                description: "100% pamuk basic tişört, farklı renklerde",
                listPrice: 150,
                vatRate: 10,
                minQuantity: 12,
                stock: 1000,
                images: [],
                isBestSeller: true,
                categoryId: categories[1].id,
            },
        }),
        prisma.product.upsert({
            where: { slug: "spor-ayakkabi" },
            update: {},
            create: {
                name: "Spor Ayakkabı",
                slug: "spor-ayakkabi",
                description: "Hafif ve konforlu spor ayakkabı",
                listPrice: 850,
                vatRate: 10,
                minQuantity: 6,
                stock: 200,
                images: [],
                isNew: true,
                categoryId: categories[3].id,
            },
        }),
    ]);

    console.log("✅ Created products:", products.length);

    // Create default site settings
    await prisma.siteSettings.upsert({
        where: { key: "general" },
        update: {},
        create: {
            key: "general",
            value: {
                siteName: "B2B Toptancı",
                companyName: "B2B E-Ticaret Ltd. Şti.",
                phone: "+90 212 555 0000",
                email: "info@b2b.com",
                address: "İstanbul, Türkiye",
            },
        },
    });

    await prisma.siteSettings.upsert({
        where: { key: "bankAccounts" },
        update: {},
        create: {
            key: "bankAccounts",
            value: [
                {
                    bankName: "Ziraat Bankası",
                    accountHolder: "B2B E-Ticaret Ltd. Şti.",
                    iban: "TR00 0000 0000 0000 0000 0000 00",
                },
                {
                    bankName: "İş Bankası",
                    accountHolder: "B2B E-Ticaret Ltd. Şti.",
                    iban: "TR00 0000 0000 0000 0000 0000 01",
                },
            ],
        },
    });

    console.log("✅ Created site settings");

    // Create sample slider
    await prisma.slider.upsert({
        where: { id: "slider-1" },
        update: {},
        create: {
            id: "slider-1",
            title: "Toptan Alımlarda Özel Fiyatlar",
            subtitle: "Bayilerimize özel indirim oranlarıyla alışveriş yapın",
            imageUrl: "",
            linkUrl: "/products",
            order: 1,
            isActive: true,
        },
    });

    console.log("✅ Created slider");

    // Create default policies
    const policies = [
        { slug: "kvkk", title: "KVKK Aydınlatma Metni" },
        { slug: "privacy", title: "Gizlilik Politikası" },
        { slug: "distance-sales", title: "Mesafeli Satış Sözleşmesi" },
        { slug: "cancellation", title: "İptal ve İade Koşulları" },
        { slug: "cookies", title: "Çerez Politikası" },
        { slug: "payment-methods", title: "Ödeme Yöntemleri" },
    ];

    for (const policy of policies) {
        await prisma.policy.upsert({
            where: { slug: policy.slug },
            update: {},
            create: {
                slug: policy.slug,
                title: policy.title,
                content: `<h3>${policy.title}</h3><p>Bu metin varsayılan olarak oluşturulmuştur. Admin panelinden düzenleyebilirsiniz.</p>`,
            },
        });
    }

    console.log("✅ Created policies");

    console.log("🎉 Seeding completed!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
