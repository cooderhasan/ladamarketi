import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789");

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "E-posta adresi gereklidir." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        // Güvenlik: Kullanıcı yoksa da başarılı gibi yanıt ver (enumeration önleme)
        if (!user) {
            return NextResponse.json({ success: true });
        }

        // Token oluştur (1 saatlik geçerlilik)
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

        // Token'ı SiteSettings'te sakla (prefix: reset_token_)
        await prisma.siteSettings.upsert({
            where: { key: `reset_token_${email}` },
            create: {
                key: `reset_token_${email}`,
                value: { token, expiresAt: expiresAt.toISOString(), userId: user.id },
            },
            update: {
                value: { token, expiresAt: expiresAt.toISOString(), userId: user.id },
            },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL || "https://www.ladamarketi.com"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

        // E-posta gönder
        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: "Lada Marketi <siparis@ladamarketi.com>",
                to: [email],
                subject: "Şifre Sıfırlama Talebi - Lada Marketi",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #009AD0, #007EA8); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">Şifre Sıfırlama</h1>
                        </div>
                        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                            <p style="color: #374151; font-size: 16px;">Merhaba,</p>
                            <p style="color: #374151;">Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetUrl}" style="background: linear-gradient(135deg, #009AD0, #007EA8); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                                    Şifremi Sıfırla
                                </a>
                            </div>
                            <p style="color: #6b7280; font-size: 14px;">Bu bağlantı <strong>1 saat</strong> geçerlidir.</p>
                            <p style="color: #6b7280; font-size: 14px;">Eğer bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                            <p style="color: #9ca3af; font-size: 12px;">Lada Marketi - <a href="https://www.ladamarketi.com" style="color: #009AD0;">www.ladamarketi.com</a></p>
                        </div>
                    </div>
                `,
            });
        } else {
            console.log("-----------------------------------------");
            console.log("FORGOT PASSWORD LINK (DEV/NO-API-KEY):");
            console.log(resetUrl);
            console.log("-----------------------------------------");
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
    }
}
