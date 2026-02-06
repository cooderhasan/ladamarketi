'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitContactForm } from "@/app/actions/contact"
import { toast } from "sonner"

export function ContactForm() {
    const [pending, setPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setPending(true)
        try {
            // Cannot pass prevState directly easily with simple action call without useFormState/useActionState
            // We'll just call the action directly for simplicity or wrap it.
            // But wait, my action signature is (prevState, formData).
            // Let's adjust usage or wrapper.

            const result = await submitContactForm({}, formData)

            if (result.success) {
                toast.success(result.message)
                // Optional: reset form
                const form = document.querySelector('form') as HTMLFormElement
                form?.reset()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Bir hata oluştu")
        } finally {
            setPending(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad</Label>
                    <Input id="name" name="name" placeholder="Adınız Soyadınız" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input id="email" name="email" type="email" placeholder="ornek@sirket.com" required />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="subject">Konu</Label>
                <Input id="subject" name="subject" placeholder="Mesajınızın konusu" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="message">Mesaj</Label>
                <Textarea
                    id="message"
                    name="message"
                    placeholder="Mesajınızı buraya yazınız..."
                    rows={6}
                    required
                    minLength={10}
                />
            </div>
            <Button className="w-full md:w-auto" size="lg" disabled={pending}>
                {pending ? "Gönderiliyor..." : "Mesaj Gönder"}
            </Button>
        </form>
    )
}
