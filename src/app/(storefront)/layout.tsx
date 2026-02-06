import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import { Toaster } from "@/components/ui/sonner";
import { getSiteSettings } from "@/lib/settings";
import { getAllPolicies } from "@/app/actions/policy";
import { StoreInitializer } from "@/components/store-initializer";

export default async function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const settings = await getSiteSettings();
    // Traverse to find the correct parent (Root -> Home -> Categories)
    // 1. Get Root
    // Force using the known "Home" category ID to skip Root
    const targetParentId = "cml9exnw20009orv864or2ni2";

    const categories = await prisma.category.findMany({
        where: {
            isActive: true,
            parentId: targetParentId
        },
        orderBy: { order: "asc" },
        select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            imageUrl: true,
            children: {
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    imageUrl: true
                },
                orderBy: { order: "asc" }
            }
        },
    });

    const policies = await getAllPolicies();

    let userDiscountRate = 0;
    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                discountGroup: {
                    select: { discountRate: true }
                }
            }
        });
        userDiscountRate = Number(user?.discountGroup?.discountRate || 0);
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <StoreInitializer discountRate={userDiscountRate} />
            <StorefrontHeader
                user={session?.user}
                logoUrl={settings.logoUrl}
                siteName={settings.siteName}
                categories={categories}
                phone={settings.phone}
                facebookUrl={settings.facebookUrl}
                instagramUrl={settings.instagramUrl}
                twitterUrl={settings.twitterUrl}
                linkedinUrl={settings.linkedinUrl}
            />
            <main className="flex-1">{children}</main>
            <StorefrontFooter settings={settings} policies={policies} />
        </div>
    );
}

