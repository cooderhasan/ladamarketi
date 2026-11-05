import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { syncActiveYKOrders } from "@/services/yurtici/sync";

/** CRON_SECRET tanımlı değilse adres tamamen kapalıdır. */
function isAuthorized(request: Request): boolean {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) return false;

    const given = Buffer.from(request.headers.get("authorization") ?? "");
    const expected = Buffer.from(`Bearer ${secret}`);
    return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Coolify zamanlanmış görevi çağırır; "Kargoları Güncelle" butonuyla aynı işi yapar. */
export async function POST(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await syncActiveYKOrders();
        if (result.success) revalidatePath("/admin/orders");
        console.log("[YK Cron]", result.success ? result.message : result.error);
        return NextResponse.json(result, { status: result.success ? 200 : 503 });
    } catch (error) {
        console.error("[YK Cron] Hata:", error);
        return NextResponse.json({ success: false, error: "Kargo güncellemesi başarısız." }, { status: 500 });
    }
}
