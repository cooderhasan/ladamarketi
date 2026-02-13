
import { prisma } from "./src/lib/db";

async function diagnose() {
    console.log("DIAGNOSTIC: Checking Cart table...");
    try {
        const cartCount = await prisma.cart.count();
        console.log("DIAGNOSTIC: Cart table exists, count:", cartCount);
    } catch (error: any) {
        console.error("DIAGNOSTIC: Cart table error:", error.message);
        if (error.message.includes("does not exist")) {
            console.log("DIAGNOSTIC: SOLUTION -> You need to run 'npx prisma db push'");
        }
    }

    console.log("DIAGNOSTIC: Checking CartItem table...");
    try {
        const itemCount = await prisma.cartItem.count();
        console.log("DIAGNOSTIC: CartItem table exists, count:", itemCount);
    } catch (error: any) {
        console.error("DIAGNOSTIC: CartItem table error:", error.message);
    }
}

diagnose()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
