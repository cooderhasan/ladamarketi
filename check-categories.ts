
import { prisma } from "./src/lib/db";

async function checkHomeChildren() {
    console.log("Checking children of Home category...");
    try {
        const home = await prisma.category.findFirst({
            where: { slug: "home-2" }, // Based on previous output
            include: { children: { select: { name: true, slug: true } } }
        });

        if (home) {
            console.log(`Home ID: ${home.id}`);
            console.log(`Home Name: ${home.name}`);
            console.log(`Children Count: ${home.children.length}`);
            console.log("First 10 Children:", home.children.slice(0, 10));
        } else {
            console.log("No Home category found.");
        }

    } catch (error) {
        console.error("Error checking categories:", error);
    }
}

checkHomeChildren()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
