import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/emails/order-confirmation';
import { AdminNewOrderEmail } from '@/emails/admin-new-order';
import { ORDER_BRAND } from '@/emails/order-email-shared';
import { ShippingNotificationEmail } from '@/emails/shipping-notification';
import { AbandonedCartNotificationEmail, type AbandonedCartEmailItem } from '@/emails/abandoned-cart-notification';
import { generateOnBilgilendirmePdf } from '@/lib/on-bilgilendirme-pdf';
import { generateSatisSozlesmesiPdf } from '@/lib/satis-sozlesmesi-pdf';
import { generateIptalIadePdf } from '@/lib/iptal-iade-pdf';
import { getSiteSettings } from '@/lib/settings';
import { SITE_URL } from '@/lib/site-url';

const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ladamarketi@gmail.com";

interface OrderEmailItemProps {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    variantInfo?: string;
}

interface SendOrderConfirmationProps {
    to: string;
    orderNumber: string;
    orderId: string;
    customerName: string;
    items: OrderEmailItemProps[];
    totalAmount: number;
    paymentMethod: "BANK_TRANSFER" | "CREDIT_CARD" | "CURRENT_ACCOUNT";
    bankInfo?: {
        bankName: string;
        iban: string;
        accountHolder: string;
    };
    shippingAddress: {
        address: string;
        city: string;
        district?: string;
        phone?: string;
        name?: string;
    };
    shippingCost?: number;
    cargoCompany?: string;
    /** Karta yansıyan vade farkı; totalAmount bunu içermez */
    installmentFee?: number;
    installmentCount?: number;
}

interface SendAdminNewOrderProps {
    orderNumber: string;
    customerName: string;
    companyName: string;
    totalAmount: number;
    orderId: string;
    cargoCompany?: string;
    items: OrderEmailItemProps[];
    paymentMethod: "BANK_TRANSFER" | "CREDIT_CARD" | "CURRENT_ACCOUNT";
    shippingAddress: {
        address: string;
        city: string;
        district?: string;
        phone?: string;
    };
    customerEmail?: string;
    isGuest: boolean;
    shippingCost?: number;
    installmentFee?: number;
    installmentCount?: number;
}

export async function sendOrderConfirmationEmail(props: SendOrderConfirmationProps) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Email sending skipped.');
        return { success: false, error: 'API key missing' };
    }

    try {
        // 3 PDF'i paralel olarak üret (biri hata verse diğerleri etkilenmez)
        const orderDate = new Date();
        const pdfCommonProps = {
            orderNumber: props.orderNumber,
            orderDate,
            customerName: props.customerName,
        };

        const [onBilgiResult, satisSozResult, iptalIadeResult] = await Promise.allSettled([
            generateOnBilgilendirmePdf({
                ...pdfCommonProps,
                customerAddress: props.shippingAddress.address,
                customerCity: props.shippingAddress.city,
                customerDistrict: props.shippingAddress.district,
                customerPhone: props.shippingAddress.phone,
                customerEmail: props.to,
                items: props.items.map((item) => ({
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    lineTotal: item.lineTotal,
                })),
                totalAmount: props.totalAmount,
                shippingCost: props.shippingCost,
                paymentMethod: props.paymentMethod,
                installmentFee: props.installmentFee,
                installmentCount: props.installmentCount,
            }),
            generateSatisSozlesmesiPdf({
                ...pdfCommonProps,
                customerAddress: props.shippingAddress.address,
                customerCity: props.shippingAddress.city,
                customerDistrict: props.shippingAddress.district,
                customerPhone: props.shippingAddress.phone,
                customerEmail: props.to,
            }),
            generateIptalIadePdf(pdfCommonProps),
        ]);

        // Başarıyla üretilen PDF'leri ek olarak hazırla
        const attachments: { filename: string; content: Buffer }[] = [];
        if (onBilgiResult.status === 'fulfilled') {
            attachments.push({ filename: `on-bilgilendirme-${props.orderNumber}.pdf`, content: onBilgiResult.value });
        } else {
            console.error('Ön bilgilendirme PDF hatası:', onBilgiResult.reason);
        }
        if (satisSozResult.status === 'fulfilled') {
            attachments.push({ filename: `satis-sozlesmesi-${props.orderNumber}.pdf`, content: satisSozResult.value });
        } else {
            console.error('Satış sözleşmesi PDF hatası:', satisSozResult.reason);
        }
        if (iptalIadeResult.status === 'fulfilled') {
            attachments.push({ filename: `iptal-iade-${props.orderNumber}.pdf`, content: iptalIadeResult.value });
        } else {
            console.error('İptal/iade PDF hatası:', iptalIadeResult.reason);
        }

        const settings = await getSiteSettings();

        const { data, error } = await resend.emails.send({
            from: `${ORDER_BRAND.name} <siparis@ladamarketi.com>`,
            to: [props.to],
            subject: `Siparişiniz Alındı - #${props.orderNumber}`,
            react: OrderConfirmationEmail({
                orderNumber: props.orderNumber,
                customerName: props.customerName,
                items: props.items,
                totalAmount: props.totalAmount,
                paymentMethod: props.paymentMethod,
                bankInfo: props.bankInfo,
                orderUrl: `${SITE_URL}/orders/${props.orderId}`,
                shippingAddress: props.shippingAddress,
                cargoCompany: props.cargoCompany,
                shippingCost: props.shippingCost,
                contactPhone: settings.phone,
                contactEmail: settings.email,
                hasContracts: attachments.length > 0,
                installmentFee: props.installmentFee,
                installmentCount: props.installmentCount,
            }),
            attachments: attachments.length > 0 ? attachments : undefined,
        });

        if (error) {
            console.error('Email sending error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error };
    }
}

export async function sendAdminNewOrderEmail(props: SendAdminNewOrderProps) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Admin email sending skipped.');
        return { success: false, error: 'API key missing' };
    }

    if (!ADMIN_EMAIL) {
        console.warn('ADMIN_EMAIL is not set. Admin email sending skipped.');
        return { success: false, error: 'Admin email missing' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Sipariş Bildirim <siparis@ladamarketi.com>',
            to: [ADMIN_EMAIL],
            subject: `Yeni Sipariş: #${props.orderNumber} - ${props.companyName}`,
            react: AdminNewOrderEmail({
                orderNumber: props.orderNumber,
                orderId: props.orderId,
                customerName: props.customerName,
                companyName: props.companyName,
                totalAmount: props.totalAmount,
                items: props.items,
                paymentMethod: props.paymentMethod,
                shippingAddress: props.shippingAddress,
                customerEmail: props.customerEmail,
                isGuest: props.isGuest,
                cargoCompany: props.cargoCompany,
                shippingCost: props.shippingCost,
                installmentFee: props.installmentFee,
                installmentCount: props.installmentCount,
            }),
        });

        if (error) {
            console.error('Admin email sending error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Admin email sending failed:', error);
        return { success: false, error };
    }
}

interface SendShippingNotificationProps {
    to: string;
    customerName: string;
    orderNumber: string;
    cargoCompany: string;
    trackingUrl: string;
}

export async function sendShippingNotificationEmail(props: SendShippingNotificationProps) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Email sending skipped.');
        return { success: false, error: 'API key missing' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Sipariş <siparis@ladamarketi.com>',
            to: [props.to],
            // Bcc to admin to track sent emails
            bcc: ADMIN_EMAIL ? [ADMIN_EMAIL] : undefined,
            subject: `Siparişiniz Kargoya Verildi - #${props.orderNumber}`,
            react: ShippingNotificationEmail({
                orderNumber: props.orderNumber,
                customerName: props.customerName,
                cargoCompany: props.cargoCompany,
                trackingUrl: props.trackingUrl,
            }),
        });

        if (error) {
            console.error('Shipping notification email sending error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Shipping notification email sending failed:', error);
        return { success: false, error };
    }
}

interface SendAbandonedCartNotificationProps {
    to: string;
    /** Üyenin Ad Soyad'ı; yoksa mailde sadece "Merhaba," yazar */
    customerName?: string;
    items: AbandonedCartEmailItem[];
    totalAmount: number;
    cartUrl: string;
    contactPhone?: string;
    contactEmail?: string;
    unsubscribeUrl: string;
    /** List-Unsubscribe başlığı (posta programının kendi "aboneliği iptal et" düğmesi) */
    oneClickUnsubscribeUrl: string;
}

export async function sendAbandonedCartEmail(props: SendAbandonedCartNotificationProps) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Email sending skipped.');
        return { success: false, error: 'API key missing' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: `${ORDER_BRAND.name} <satis@ladamarketi.com>`,
            to: [props.to],
            subject: 'Sepetinizdeki ürünler sizi bekliyor',
            headers: {
                'List-Unsubscribe': `<${props.oneClickUnsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
            react: AbandonedCartNotificationEmail({
                customerName: props.customerName,
                items: props.items,
                totalAmount: props.totalAmount,
                cartUrl: props.cartUrl,
                contactPhone: props.contactPhone,
                contactEmail: props.contactEmail,
                unsubscribeUrl: props.unsubscribeUrl,
            }),
        });

        if (error) {
            console.error('Abandoned cart email sending error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Abandoned cart email sending failed:', error);
        return { success: false, error };
    }
}
