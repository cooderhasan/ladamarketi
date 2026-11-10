import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site-url";

/** Sepet hatırlatma maillerinden çıkan üyelerin kimlikleri (şema değişmesin diye site_settings'te tutulur) */
const OPT_OUT_KEY = "cart_reminder_unsubscribed";

function getSecret() {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET tanımlı değil");
    return secret;
}

/** Abonelikten çıkma bağlantısının imzası; e-posta adresi bağlantıda görünmesin diye üye kimliği imzalanır */
export function cartReminderToken(userId: string) {
    return createHmac("sha256", getSecret()).update(`cart-reminder-unsubscribe:${userId}`).digest("base64url");
}

export function verifyCartReminderToken(userId: string | undefined, token: string | undefined) {
    if (!userId || !token) return false;
    try {
        const expected = Buffer.from(cartReminderToken(userId));
        const given = Buffer.from(token);
        return expected.length === given.length && timingSafeEqual(expected, given);
    } catch {
        return false;
    }
}

const query = (userId: string) => `u=${encodeURIComponent(userId)}&t=${cartReminderToken(userId)}`;

/** Mailin altındaki bağlantı: onay düğmesi olan sayfa (bağlantı tarayıcılarının kendiliğinden çıkarmaması için) */
export const cartReminderUnsubscribeUrl = (userId: string) => `${SITE_URL}/sepet-hatirlatma-iptal?${query(userId)}`;

/** List-Unsubscribe başlığı: Gmail ve Outlook'un "Aboneliği iptal et" düğmesi buraya POST eder */
export const cartReminderOneClickUrl = (userId: string) => `${SITE_URL}/api/cart-reminder/unsubscribe?${query(userId)}`;

export async function getCartReminderOptOuts(): Promise<Set<string>> {
    const row = await prisma.siteSettings.findUnique({ where: { key: OPT_OUT_KEY } });
    const ids = Array.isArray(row?.value) ? (row!.value as unknown[]) : [];
    return new Set(ids.filter((id): id is string => typeof id === "string"));
}

export async function optOutCartReminder(userId: string) {
    const ids = await getCartReminderOptOuts();
    if (ids.has(userId)) return;
    ids.add(userId);
    await prisma.siteSettings.upsert({
        where: { key: OPT_OUT_KEY },
        update: { value: [...ids] },
        create: { key: OPT_OUT_KEY, value: [...ids] },
    });
}
