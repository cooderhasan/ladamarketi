import { getSiteSettings } from "@/lib/settings";
import { CartClient } from "@/components/storefront/cart-client";

export const metadata = {
    title: "Sepetim | Lada Marketi",
    description: "Sepetinizdeki ürünleri görüntüleyin ve siparişinizi güvenle tamamlayın.",
};

export default async function CartPage() {
    const settings = await getSiteSettings();
    const bankTransferDiscountRate = Number(settings.bankTransferDiscountRate || 0);
    const minOrderLimit = Number(settings.minOrderLimit || 0);

    return (
        <CartClient
            bankTransferDiscountRate={bankTransferDiscountRate}
            minOrderLimit={minOrderLimit}
        />
    );
}
