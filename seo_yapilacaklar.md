# SEO Yapılacaklar

Son güncelleme: 30.10.2026

## Yapıldı (canlıda)

- `metadataBase` eklendi; og:image artık `https://www.ladamarketi.com/...` (önceden localhost çıkıyordu)
- Yapısal veri (ürün, breadcrumb, mağaza) sunucuda HTML içinde; ürün şemasındaki fiyat sayfadaki fiyatla aynı
- Başlıklar kısa marka ile: `Ürün Adı | Lada Marketi` (mağaza adı tekrar etmiyor)
- Ana sayfaya görünür H1
- Site haritası: /blog kaldırıldı, indirimli ürünler ve politikalar eklendi
- Sepet, ödeme, hesap, giriş/kayıt, şifre ve arama sonuçları `noindex`
- Ayarlar > Marka & Görseller > **Paylaşım Görseli** alanı (boşsa logo); her sayfada og:url

## Sizin yapmanız gerekenler

- [x] Paylaşım görseli yüklendi (canlıda 1200×630, 85 KB, webp — 30.10.2026 kontrol edildi)
- [ ] Facebook Hata Ayıklayıcı'da (developers.facebook.com/tools/debug) ana sayfayı **Scrape Again** ile tekrar taratın
- [x] Search Console yeni Gmail hesabına DNS TXT ile bağlandı, site haritası gönderildi
- [x] SEO başlığı düzgün (canlıda: `Lada Yedek Parça ve Aksesuar | Lada Marketi`)

## Sonra yapılacaklar (2. grup — dikkat isteyen)

### A. Kategori adresleri (en önemlisi) — YAPILDI 30.10.2026
- 69 adres güncellendi (liste: kategori_adres_listesi.md), eski adresler 308 ile yönleniyor
- İç içe aynı adlı "Lada Vega 1.5 8V" birleştirildi; eski "Home" vitrin kategorisi boşaltılıp pasif yapıldı (/category/home-2 → /)
- Yönlendirme listesi: src/data/category-slug-map.ts (silinmemeli)

Eski notlar:
- 74 kategorinin 70'inde sonda sayı var (`...-on-duzen-grubu-12`), 11 grupta aynı isim tekrar ediyor
- 74 kategorinin 48'inde Türkçe harfler adresten düşmüş (eski aktarımdan): `n-dzen-grubu` (Ön Düzen), `anzman-grubu` (Şanzıman), `sspansiyon-grubu`, `motor-aksam`, `i-trim-grubu`, `...-yedek-paralar`, `lada-vega-500-8v` (1.5 8V) — 30.10.2026 tespit
- Başlıklara model adı eklendi (30.10.2026, adres değişmeden): "Samara 1300-1500 Hortum Grubu"
- Önerilen biçim: üst kategori + ad, ör. `lada-niva-1600-on-duzen-grubu`
- Güvenli yol:
  1. Önce eski → yeni adres listesi çıkarılıp onayınıza sunulur (veritabanına dokunmadan)
  2. Kategori sayfasına yedek: eski adresle gelen yeni adrese 301 ile yönlendirilir
  3. Yedek alınıp tek seferlik script ile adresler güncellenir
  4. `redirects.json` hedefleri ve slider/banner linkleri de güncellenir
- **Gerekli:** adres biçimi onayı

### B. Ürün yapısal verisi (Google zengin sonuçlar) — YAPILDI 30.10.2026
- İade politikası (14 gün, kargoyla, iade kargosu müşteride), marka yoksa marka yok, yorum puanı, sadece geçerli GTIN alanı (barkodlar rastgele 460..., kullanılmıyor), MPN stok koduyla aynıysa yok
- Kargo (shippingDetails) eklenmedi: alıcı ödemeli, tutar belli değil; 0 TL Google'da "ücretsiz kargo" sayılır
- Politika adresleri düzeltildi (iptal-ve-iade, satis-sozlesmesi, guvenli-alisveris, gizlilik-ilkelerimiz), eskiler yönleniyor

Eski notlar:
- Barkoddan GTIN (yalnız geçerli EAN-13 olanlar)
- Kargo bilgisi (`shippingDetails`) ve iade politikası (`hasMerchantReturnPolicy`) — Search Console uyarılarını giderir
- Markası olmayan üründe boş marka gönderilmesin
- Yorum varsa puan (`aggregateRating`)
- Kargo: her zaman alıcı ödemeli, ücretsiz kargo yok (Yurtiçi Kargo)
- **Gerekli:** teslim süresi, iade gün sayısı

### C. Kategori açıklaması
- Kategorilere açıklama alanı (veritabanına boş bırakılabilir sütun + admin alanı)
- Kategori sayfasında ürünlerin altında kısa metin; taslaklar Gemini ile yazılabilir

### D. http → https → www yönlendirme zinciri
- `http://ladamarketi.com` iki adımda yönleniyor; tek adıma indirilmeli
- Sunucu/proxy ayarı (Coolify/hosting paneli), koddan değil
- **Gerekli:** hosting paneline erişim
