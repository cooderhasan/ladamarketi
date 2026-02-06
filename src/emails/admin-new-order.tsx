
import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
    Row,
    Column,
} from "@react-email/components";
import * as React from "react";

interface AdminNewOrderEmailProps {
    orderNumber: string;
    customerName: string;
    companyName: string;
    totalAmount: number;
}

export const AdminNewOrderEmail = ({
    orderNumber,
    customerName,
    companyName,
    totalAmount,
}: AdminNewOrderEmailProps) => {
    const previewText = `Yeni Sipariş: #${orderNumber} - ${companyName}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Yeni Sipariş Var! 🎉
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            <strong>{companyName}</strong> ({customerName}) yeni bir sipariş oluşturdu.
                        </Text>

                        <Section className="bg-gray-50 p-4 rounded my-4">
                            <Row>
                                <Column>
                                    <Text className="text-gray-500 text-xs uppercase font-bold m-0">Sipariş No</Text>
                                    <Text className="text-lg font-bold m-0">#{orderNumber}</Text>
                                </Column>
                                <Column align="right">
                                    <Text className="text-gray-500 text-xs uppercase font-bold m-0">Tutar</Text>
                                    <Text className="text-lg font-bold m-0 text-green-600">
                                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(totalAmount)}
                                    </Text>
                                </Column>
                            </Row>
                        </Section>

                        <Section className="text-center mt-8">
                            <Link
                                href={`https://bagajlastigi.com/admin/orders/${orderNumber}`} // Adjust domain if dynamic needed
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                            >
                                Siparişi Görüntüle
                            </Link>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default AdminNewOrderEmail;
