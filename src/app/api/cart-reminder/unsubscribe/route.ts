import { NextRequest, NextResponse } from "next/server";
import { optOutCartReminder, verifyCartReminderToken } from "@/lib/cart-reminder";
import { SITE_URL } from "@/lib/site-url";

/** Posta programlarının "Aboneliği iptal et" düğmesi (RFC 8058 tek tık): List-Unsubscribe adresine POST eder */
export async function POST(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get("u") || undefined;
    const token = request.nextUrl.searchParams.get("t") || undefined;

    if (!verifyCartReminderToken(userId, token)) {
        return NextResponse.json({ success: false }, { status: 400 });
    }

    await optOutCartReminder(userId!);
    return NextResponse.json({ success: true });
}

/** Adres tarayıcıda açılırsa onay düğmeli sayfaya gider (bağlantı tarayıcıları kendiliğinden çıkarmasın) */
export async function GET(request: NextRequest) {
    const target = new URL("/sepet-hatirlatma-iptal", SITE_URL);
    request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));
    return NextResponse.redirect(target, 302);
}
