import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, token, password } = await req.json();

        if (!email || !token || !password) {
            return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
        }

        // Token'ı kontrol et
        const setting = await prisma.siteSettings.findUnique({
            where: { key: `reset_token_${email}` },
        });

        if (!setting) {
            return NextResponse.json({ error: "Geçersiz veya süresi dolmuş bağlantı." }, { status: 400 });
        }

        const data = setting.value as { token: string; expiresAt: string; userId: string };

        if (data.token !== token) {
            return NextResponse.json({ error: "Geçersiz sıfırlama bağlantısı." }, { status: 400 });
        }

        if (new Date(data.expiresAt) < new Date()) {
            // Süresi dolmuş token'ı temizle
            await prisma.siteSettings.delete({ where: { key: `reset_token_${email}` } });
            return NextResponse.json({ error: "Sıfırlama bağlantısının süresi dolmuş. Lütfen tekrar talep edin." }, { status: 400 });
        }

        // Şifreyi güncelle
        const passwordHash = await bcrypt.hash(password, 12);
        await prisma.user.update({
            where: { id: data.userId },
            data: { passwordHash },
        });

        // Token'ı temizle (tek kullanım)
        await prisma.siteSettings.delete({ where: { key: `reset_token_${email}` } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
    }
}
