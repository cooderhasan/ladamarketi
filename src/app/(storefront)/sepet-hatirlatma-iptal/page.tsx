import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCartReminderOptOuts, verifyCartReminderToken } from "@/lib/cart-reminder";
import { unsubscribeCartReminderAction } from "./actions";

export const metadata = {
    title: "Sepet Hatırlatma E-postaları",
    robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CartReminderUnsubscribePage({
    searchParams,
}: {
    searchParams: Promise<{ u?: string; t?: string }>;
}) {
    const { u, t } = await searchParams;
    const valid = verifyCartReminderToken(u, t);
    const done = valid && (await getCartReminderOptOuts()).has(u!);

    return (
        <div className="container mx-auto max-w-lg px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sepet hatırlatma e-postaları</h1>

            {!valid ? (
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                    Bu bağlantı geçersiz. Lütfen e-postadaki bağlantıyı eksiksiz açtığınızdan emin olun.
                </p>
            ) : done ? (
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                    Artık sepet hatırlatma e-postası almayacaksınız. Sipariş ve kargo bilgilendirmeleri gönderilmeye devam eder.
                </p>
            ) : (
                <form action={unsubscribeCartReminderAction} className="mt-6 space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Sepetinizde ürün kaldığında size hatırlatma e-postası göndermemizi istemiyorsanız aşağıdaki düğmeye basın.
                    </p>
                    <input type="hidden" name="u" value={u} />
                    <input type="hidden" name="t" value={t} />
                    <Button type="submit">Hatırlatma e-postalarını durdur</Button>
                </form>
            )}

            <Link href="/" className="mt-8 inline-block text-sm text-gray-500 underline hover:text-gray-700">
                Ana sayfaya dön
            </Link>
        </div>
    );
}
