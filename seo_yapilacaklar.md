# SEO Yapılacaklar

Son güncelleme: 27.10.2026

## Yapıldı (canlıda)

- `metadataBase` eklendi; og:image artık `https://www.ladamarketi.com/...` (önceden localhost çıkıyordu)
- Yapısal veri (ürün, breadcrumb, mağaza) sunucuda HTML içinde; ürün şemasındaki fiyat sayfadaki fiyatla aynı
- Başlıklar kısa marka ile: `Ürün Adı | Lada Marketi` (mağaza adı tekrar etmiyor)
- Ana sayfaya görünür H1
- Site haritası: /blog kaldırıldı, indirimli ürünler ve politikalar eklendi
- Sepet, ödeme, hesap, giriş/kayıt, şifre ve arama sonuçları `noindex`
- Ayarlar > Marka & Görseller > **Paylaşım Görseli** alanı (boşsa logo); her sayfada og:url

## Sizin yapmanız gerekenler

- [ ] Admin > Ayarlar > Marka & Görseller > Paylaşım Görseli: 1200×630, JPG, 300 KB altı görsel yükleyip kaydedin (logo 1,6 MB, WhatsApp önizlemede göstermiyor)
- [ ] Facebook Hata Ayıklayıcı'da (developers.facebook.com/tools/debug) ana sayfayı **Scrape Again** ile tekrar taratın
- [ ] Google Search Console > Site Haritaları: `https://www.ladamarketi.com/sitemap.xml` yeniden gönderin
- [ ] Admin > Ayarlar > SEO Başlığı: baştaki boşluğu ve sondaki noktayı silin

## Sonra yapılacaklar (2. grup — dikkat isteyen)

### A. Kategori adresleri (en önemlisi)
- 74 kategorinin 70'inde sonda sayı var (`...-on-duzen-grubu-12`), 11 grupta aynı isim tekrar ediyor
- Önerilen biçim: üst kategori + ad, ör. `lada-niva-1600-on-duzen-grubu`
- Güvenli yol:
  1. Önce eski → yeni adres listesi çıkarılıp onayınıza sunulur (veritabanına dokunmadan)
  2. Kategori sayfasına yedek: eski adresle gelen yeni adrese 301 ile yönlendirilir
  3. Yedek alınıp tek seferlik script ile adresler güncellenir
  4. `redirects.json` hedefleri ve slider/banner linkleri de güncellenir
- **Gerekli:** adres biçimi onayı

### B. Ürün yapısal verisi (Google zengin sonuçlar)
- Barkoddan GTIN (yalnız geçerli EAN-13 olanlar)
- Kargo bilgisi (`shippingDetails`) ve iade politikası (`hasMerchantReturnPolicy`) — Search Console uyarılarını giderir
- Markası olmayan üründe boş marka gönderilmesin
- Yorum varsa puan (`aggregateRating`)
- **Gerekli:** kargo ücreti, ücretsiz kargo limiti, teslim süresi, iade gün sayısı

### C. Kategori açıklaması
- Kategorilere açıklama alanı (veritabanına boş bırakılabilir sütun + admin alanı)
- Kategori sayfasında ürünlerin altında kısa metin; taslaklar Gemini ile yazılabilir

### D. http → https → www yönlendirme zinciri
- `http://ladamarketi.com` iki adımda yönleniyor; tek adıma indirilmeli
- Sunucu/proxy ayarı (Coolify/hosting paneli), koddan değil
- **Gerekli:** hosting paneline erişim
