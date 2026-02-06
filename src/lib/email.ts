import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/emails/order-confirmation';
import { AdminNewOrderEmail } from '@/emails/admin-new-order';

const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

interface SendOrderConfirmationProps {
    to: string;
    orderNumber: string;
    customerName: string;
    items: {
        productName: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
    }[];
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
    };
    cargoCompany?: string;
}

interface SendAdminNewOrderProps {
    orderNumber: string;
    customerName: string;
    companyName: string;
    totalAmount: number;
    orderId: string;
    cargoCompany?: string;
}

export async function sendOrderConfirmationEmail(props: SendOrderConfirmationProps) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Email sending skipped.');
        return { success: false, error: 'API key missing' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Sipariş <siparis@bagajlastigi.com>',
            to: [props.to],
            subject: `Siparişiniz Alındı - #${props.orderNumber}`,
            react: OrderConfirmationEmail({
                orderNumber: props.orderNumber,
                customerName: props.customerName,
                items: props.items,
                totalAmount: props.totalAmount,
                paymentMethod: props.paymentMethod,
                bankInfo: props.bankInfo,
            }),
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
            from: 'Sipariş Bildirim <siparis@bagajlastigi.com>',
            to: [ADMIN_EMAIL],
            subject: `Yeni Sipariş: #${props.orderNumber} - ${props.companyName}`,
            react: AdminNewOrderEmail({
                orderNumber: props.orderNumber,
                customerName: props.customerName,
                companyName: props.companyName,
                totalAmount: props.totalAmount,
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
