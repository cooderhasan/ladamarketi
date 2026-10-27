type JsonLdProps = {
    data: Record<string, any>;
    id?: string;
};

/**
 * Yapısal veri sunucuda düz <script> olarak HTML'e yazılır.
 * Önceden next/script (lazyOnload) ile sayfa yüklendikten sonra ekleniyordu; ilk HTML'de olmadığı için
 * Google ürün fiyatı/stok ve breadcrumb bilgisini güvenilir okuyamıyordu.
 */
export function JsonLd({ data, id = "json-ld" }: JsonLdProps) {
    return (
        <script
            id={id}
            type="application/ld+json"
            // "<" kaçışı: açıklamadaki "</script>" metni etiketi erken kapatmasın
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
        />
    );
}
