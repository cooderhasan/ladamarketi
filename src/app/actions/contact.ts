'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const contactSchema = z.object({
    name: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    subject: z.string().optional(),
    message: z.string().min(10, "Mesajınız en az 10 karakter olmalıdır"),
})

export type ContactState = {
    success?: boolean
    error?: string
    message?: string
}

export async function submitContactForm(prevState: ContactState, formData: FormData): Promise<ContactState> {
    const parsed = contactSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        subject: formData.get("subject"),
        message: formData.get("message"),
    })

    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    try {
        await prisma.contactMessage.create({
            data: {
                name: parsed.data.name,
                email: parsed.data.email,
                subject: parsed.data.subject,
                message: parsed.data.message,
            },
        })

        return { success: true, message: "Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız." }
    } catch (error) {
        console.error("Contact submission error:", error)
        return { error: "Bir hata oluştu, lütfen daha sonra tekrar deneyin." }
    }
}

export async function getContactMessages() {
    return await prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
    })
}

export async function markMessageAsRead(id: string) {
    try {
        await prisma.contactMessage.update({
            where: { id },
            data: { isRead: true }
        })
        revalidatePath("/admin/messages")
        return { success: true }
    } catch (error) {
        console.error("Mark read error:", error)
        return { success: false }
    }
}

export async function deleteMessage(id: string) {
    try {
        await prisma.contactMessage.delete({
            where: { id }
        })
        revalidatePath("/admin/messages")
        return { success: true }
    } catch (error) {
        console.error("Delete message error:", error)
        return { success: false }
    }
}
