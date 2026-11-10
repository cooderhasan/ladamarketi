"use server";

import { redirect } from "next/navigation";
import { optOutCartReminder, verifyCartReminderToken } from "@/lib/cart-reminder";

export async function unsubscribeCartReminderAction(formData: FormData) {
    const userId = String(formData.get("u") || "");
    const token = String(formData.get("t") || "");

    if (!verifyCartReminderToken(userId, token)) {
        redirect("/sepet-hatirlatma-iptal");
    }

    await optOutCartReminder(userId);
    redirect(`/sepet-hatirlatma-iptal?u=${encodeURIComponent(userId)}&t=${encodeURIComponent(token)}`);
}
