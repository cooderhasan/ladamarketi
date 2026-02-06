
import { prisma } from "@/lib/db";

interface N11Creds {
    apiKey: string;
    apiSecret: string;
}

export class N11Client {
    private baseUrl = "https://api.n11.com/ws/ProductService.wsdl";
    private creds: N11Creds | null = null;

    constructor(creds?: N11Creds) {
        if (creds) {
            this.creds = creds;
        }
    }

    async init() {
        if (this.creds) return;
        const config = await (prisma as any).n11Config.findFirst({ where: { isActive: true } });
        if (!config) throw new Error("Aktif N11 yapılandırması bulunamadı.");
        this.creds = { apiKey: config.apiKey, apiSecret: config.apiSecret };
    }

    private getAuthHeader() {
        // N11 doesn't use standard headers for SOAP, auth is in the XML body usually or header relies on specific logic.
        // Actually N11 verifies appKey/appSecret inside the SOAP Body -> Authentication
        return {};
    }

    // Helper to generate XML for SaveProduct
    private generateSaveProductXML(product: any) {
        if (!this.creds) throw new Error("Creds missing");

        // This is a simplified XML generation. In production, consider an XML builder.
        // N11 SaveProduct requires specific structure.
        return `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
           <soapenv:Header/>
           <soapenv:Body>
              <sch:SaveProductRequest>
                 <auth>
                    <appKey>${this.creds.apiKey}</appKey>
                    <appSecret>${this.creds.apiSecret}</appSecret>
                 </auth>
                 <product>
                    <productSellerCode>${product.sellerCode}</productSellerCode>
                    <title>${product.title}</title>
                    <subtitle>${product.subtitle || ""}</subtitle>
                    <description>${product.description}</description>
                    <category>
                       <id>${product.categoryId}</id>
                    </category>
                    <price>${product.price}</price>
                    <currencyType>TL</currencyType>
                    <images>
                       <image>
                          <url>${product.imageUrl}</url>
                          <order>1</order>
                       </image>
                    </images>
                    <approvalStatus>1</approvalStatus>
                    <preparingDay>3</preparingDay>
                    <stockItems>
                       <stockItem>
                          <quantity>${product.quantity}</quantity>
                          <sellerStockCode>${product.stockCode}</sellerStockCode>
                          <optionPrice>${product.price}</optionPrice>
                       </stockItem>
                    </stockItems>
                 </product>
              </sch:SaveProductRequest>
           </soapenv:Body>
        </soapenv:Envelope>`;
    }

    async saveProduct(product: any) {
        await this.init();
        const xml = this.generateSaveProductXML(product);

        const response = await fetch("https://api.n11.com/ws/ProductService", {
            method: "POST",
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": "" // N11 might require empty or specific action
            },
            body: xml
        });

        const text = await response.text();

        // Extremely basic XML parsing to check success
        // In reality, use 'fast-xml-parser' or similar
        const success = text.includes("<status>success</status>") || text.includes("<result>true</result>"); // adjust based on actual N11 response

        if (!success) {
            // Try to extract error message
            const match = text.match(/<errorMessage>(.*?)<\/errorMessage>/);
            const errorMsg = match ? match[1] : "Unknown N11 Error";
            return { success: false, message: errorMsg, raw: text };
        }

        return { success: true, raw: text };
    }
}
