import { auth } from "@/lib/auth";

/**
 * Yönetim paneli işlemleri (server action) için yetki kontrolü: sadece ADMIN / OPERATOR.
 * /admin adreslerindeki genel kontrole (middleware) ek olarak her işlem kendi içinde de yetki ister;
 * güvenlik tek bir katmana bağlı kalmaz.
 */
export async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OPERATOR")) {
        throw new Error("Bu işlem için yetkiniz yok.");
    }
    return session;
}
