# Kategori Adresleri — Eski → Yeni (ONAYLANDI 30.10.2026)

Hazırlanma: 30.10.2026 · Kaynak: canlı admin kategori listesi (salt okunur) · Veritabanında hiçbir şey değiştirilmedi.

- Kural: model adı + kategori adı, Türkçe harfler düzgün (ö→o, ş→s...), sondaki sayı yok, "Samara" ile başlayanların başına "lada-"
- Eski adreslerin hepsi yenisine kalıcı (301) yönlendirilecek; Google'daki ve paylaşılmış linkler çalışmaya devam eder
- Uygulama: admin > Kategoriler > "Adresleri güncelle" (tek seferlik); eşleme `src/data/category-slug-map.ts`

## Kararlar (onaylandı)

1. **İki ayrı "Lada Vega 1.5 8V" var:** ana kategori (`lada-vega-1-5-8v`, 127 ürün) ve onun altında aynı adlı bir alt kategori (`lada-vega-500-8v-36`, 636 ürün). İkisi aynı adresi alamaz. Karar: ana kategori kalır, alt kategori `lada-vega-1-5-8v-yedek-parcalari` olur. Sonra (30.10.2026) ikisi birleştirildi: alt kategorinin ürünleri ve alt grupları üste taşındı, alt kategori pasif, adresi `lada-vega-1-5-8v`'ye yönleniyor.
2. **"Home" (`home-2`, 266 ürün):** eski aktarımdan kalma görünüyor; karar: adresine dokunulmaz.

## Liste

| Üst kategori | Kategori | Ürün | Eski adres | Yeni adres |
|---|---|---|---|---|
| — | Samara 1300-1500 Yedek Parçaları | 219 | `lada-samarayedek-paralar-23` | `lada-samara-1300-1500-yedek-parcalari` |
| — | Lada Vega 16v Yedek Parçaları | 621 | `lada-vega-16v-yedek-paralar-37` | `lada-vega-16v-yedek-parcalari` |
| — | Lada Vega 1600cc 8w | 129 | `lada-vega-1600cc-8w` | `lada-vega-1600cc-8w` (aynı) |
| — | Lada Vega 1.5 16v | 127 | `lada-vega-1-5-16v` | `lada-vega-1-5-16v` (aynı) |
| — | Lada Vega 1600cc 16v | 126 | `lada-vega-1600cc-16v` | `lada-vega-1600cc-16v` (aynı) |
| — | Lada Vega 1.5 8V | 127 | `lada-vega-1-5-8v` | `lada-vega-1-5-8v` (aynı) |
| Lada Vega 1.5 8V | Lada Vega 1.5 8V | 636 | `lada-vega-500-8v-36` | `lada-vega-1-5-8v-yedek-parcalari` |
| Samara 1300-1500 Yedek Parçaları | Lada Samara Sport-Tek Kapı | 137 | `lada-samara-sport-tek-kapi-34` | `lada-samara-sport-tek-kapi` |
| — | Lada Niva-1600 Yedek Parçaları | 116 | `lada-niva-1600-yedek-paralar-39` | `lada-niva-1600-yedek-parcalari` |
| Lada Niva-1600 Yedek Parçaları | Lada Niva-1600 Karb. Yedek Parçaları | 130 | `lada-niva-100-karb-yedek-paralar-40` | `lada-niva-1600-karb-yedek-parcalari` |
| — | Lada Niva-1700-İ Yedek Parçaları | 135 | `lada-niva-1700-i-yedek-paralar-41` | `lada-niva-1700-i-yedek-parcalari` |
| — | Lada Kalina Yedek Parçaları | 157 | `lada-kalina-yedek-paralar-38` | `lada-kalina-yedek-parcalari` |
| — | Gazelle Yedek Parçaları | 13 | `gazelle-80` | `gazelle-yedek-parcalari` |
| Samara 1300-1500 Yedek Parçaları | Samara 1500i | 782 | `samara-1500i-12` | `lada-samara-1500i` |
| Samara 1300-1500 Yedek Parçaları | Motor Aksamı | 421 | `motor-aksam-24` | `lada-samara-1300-1500-motor-aksami` |
| Lada Vega 16v Yedek Parçaları | Motor Aksamı | 48 | `motor-aksam-56` | `lada-vega-16v-motor-aksami` |
| Samara 1500i | Motor Aksamı | 45 | `motor-aksam-13` | `lada-samara-1500i-motor-aksami` |
| Samara 1500i | Elektrik Aksamı | 277 | `elektrik-aksam-14` | `lada-samara-1500i-elektrik-aksami` |
| Samara 1500i | Fren Grubu | 63 | `fren-grubu-16` | `lada-samara-1500i-fren-grubu` |
| Samara 1500i | Ön Düzen Grubu | 78 | `n-dzen-grubu-17` | `lada-samara-1500i-on-duzen-grubu` |
| Samara 1500i | Şanzıman Grubu | 88 | `anzman-grubu-18` | `lada-samara-1500i-sanziman-grubu` |
| Samara 1500i | Tel Grubu | 7 | `tel-grubu-19` | `lada-samara-1500i-tel-grubu` |
| Samara 1500i | Hortum Grubu | 10 | `hortum-grubu-21` | `lada-samara-1500i-hortum-grubu` |
| Samara 1500i | Aksesuar Grubu | 70 | `aksesuar-grubu-22` | `lada-samara-1500i-aksesuar-grubu` |
| Samara 1300-1500 Yedek Parçaları | Elektrik Aksamı | 44 | `elektrik-aksam-25` | `lada-samara-1300-1500-elektrik-aksami` |
| Samara 1300-1500 Yedek Parçaları | Kaporta Aksamı | 248 | `kaporta-aksam-26` | `lada-samara-1300-1500-kaporta-aksami` |
| Samara 1300-1500 Yedek Parçaları | Fren Grubu | 23 | `fren-grubu-27` | `lada-samara-1300-1500-fren-grubu` |
| Samara 1300-1500 Yedek Parçaları | Şanzıman Grubu | 15 | `anzman-grubu-29` | `lada-samara-1300-1500-sanziman-grubu` |
| Samara 1300-1500 Yedek Parçaları | Tel Grubu | 8 | `tel-grubu-30` | `lada-samara-1300-1500-tel-grubu` |
| Samara 1300-1500 Yedek Parçaları | İç Trim Grubu | 255 | `i-trim-grubu-31` | `lada-samara-1300-1500-ic-trim-grubu` |
| Samara 1300-1500 Yedek Parçaları | Hortum Grubu | 5 | `hortum-grubu-32` | `lada-samara-1300-1500-hortum-grubu` |
| Lada Samara Sport-Tek Kapı | İç Trim Grubu | 3 | `i-trim-grubu-35` | `lada-samara-sport-tek-kapi-ic-trim-grubu` |
| Samara 1500i | Süspansiyon Grubu | 313 | `sspansiyon-grubu-42` | `lada-samara-1500i-suspansiyon-grubu` |
| Samara 1300-1500 Yedek Parçaları | Süspansiyon Grubu | 7 | `sspansiyon-grubu-43` | `lada-samara-1300-1500-suspansiyon-grubu` |
| Lada Samara Sport-Tek Kapı | Süspansiyon Grubu | 2 | `sspansiyon-grubu-44` | `lada-samara-sport-tek-kapi-suspansiyon-grubu` |
| Lada Vega 1.5 8V | Motor Aksamı | 25 | `motor-aksam-45` | `lada-vega-1-5-8v-motor-aksami` |
| Lada Vega 1.5 8V | Elektrik Aksamı | 18 | `elektrik-aksam-46` | `lada-vega-1-5-8v-elektrik-aksami` |
| Lada Vega 1.5 8V | Fren Grubu | 8 | `fren-grubu-48` | `lada-vega-1-5-8v-fren-grubu` |
| Lada Vega 1.5 8V | Ön Düzen Grubu | 4 | `n-dzen-grubu-49` | `lada-vega-1-5-8v-on-duzen-grubu` |
| Lada Vega 1.5 8V | Şanzıman Grubu | 6 | `anzman-grubu-50` | `lada-vega-1-5-8v-sanziman-grubu` |
| Lada Vega 1.5 8V | İç Trim Grubu | 2 | `i-trim-grubu-52` | `lada-vega-1-5-8v-ic-trim-grubu` |
| Lada Vega 1.5 8V | Hortum Grubu | 1 | `hortum-grubu-53` | `lada-vega-1-5-8v-hortum-grubu` |
| Lada Vega 1.5 8V | Aksesuar Grubu | 0 | `aksesuar-grubu-54` | `lada-vega-1-5-8v-aksesuar-grubu` |
| Lada Vega 16v Yedek Parçaları | Elektrik Aksamı | 28 | `elektrik-aksam-57` | `lada-vega-16v-elektrik-aksami` |
| Lada Vega 16v Yedek Parçaları | Kaporta Aksamı | 28 | `kaporta-aksam-58` | `lada-vega-16v-kaporta-aksami` |
| Lada Vega 16v Yedek Parçaları | Ön Düzen Grubu | 16 | `n-dzen-grubu-60` | `lada-vega-16v-on-duzen-grubu` |
| Lada Vega 16v Yedek Parçaları | Şanzıman Grubu | 11 | `anzman-grubu-61` | `lada-vega-16v-sanziman-grubu` |
| Lada Vega 16v Yedek Parçaları | Tel Grubu | 0 | `tel-grubu-62` | `lada-vega-16v-tel-grubu` |
| Lada Vega 16v Yedek Parçaları | Hortum Grubu | 2 | `hortum-grubu-64` | `lada-vega-16v-hortum-grubu` |
| Lada Vega 16v Yedek Parçaları | Aksesuar Grubu | 1 | `aksesuar-grubu-65` | `lada-vega-16v-aksesuar-grubu` |
| Lada Vega 16v Yedek Parçaları | Süspansiyon Grubu | 5 | `sspansiyon-grubu-66` | `lada-vega-16v-suspansiyon-grubu` |
| Lada Kalina Yedek Parçaları | Elektrik Aksamı | 6 | `elektrik-aksam-68` | `lada-kalina-elektrik-aksami` |
| Lada Kalina Yedek Parçaları | Kaporta Aksamı | 0 | `kaporta-aksam-69` | `lada-kalina-kaporta-aksami` |
| Lada Kalina Yedek Parçaları | Fren Grubu | 9 | `fren-grubu-70` | `lada-kalina-fren-grubu` |
| Lada Kalina Yedek Parçaları | Şanzıman Grubu | 4 | `anzman-grubu-72` | `lada-kalina-sanziman-grubu` |
| Lada Kalina Yedek Parçaları | Tel Grubu | 0 | `tel-grubu-73` | `lada-kalina-tel-grubu` |
| Lada Kalina Yedek Parçaları | İç Trim Grubu | 0 | `i-trim-grubu-74` | `lada-kalina-ic-trim-grubu` |
| Lada Kalina Yedek Parçaları | Aksesuar Grubu | 0 | `aksesuar-grubu-76` | `lada-kalina-aksesuar-grubu` |
| Lada Kalina Yedek Parçaları | Süspansiyon Grubu | 0 | `sspansiyon-grubu-77` | `lada-kalina-suspansiyon-grubu` |
| — | Skoda Yedek Parçaları | 80 | `skoda-78` | `skoda-yedek-parcalari` |
| — | Home | 266 | `home-2` | `home-2` (dokunulmasın) |
| Samara 1500i | Lada Samara Kaporta Aksamı | 142 | `lada-samara-kaporta-aksam-15` | `lada-samara-kaporta-aksami` |
| Samara 1500i | İç Trim Grubu | 21 | `i-trim-grubu-20` | `lada-samara-1500i-ic-trim-grubu` |
| Samara 1300-1500 Yedek Parçaları | Ön Düzen Grubu | 11 | `n-dzen-grubu-28` | `lada-samara-1300-1500-on-duzen-grubu` |
| Samara 1300-1500 Yedek Parçaları | Aksesuar Grubu | 5 | `aksesuar-grubu-33` | `lada-samara-1300-1500-aksesuar-grubu` |
| Lada Vega 1.5 8V | Kaporta Aksamı | 7 | `kaporta-aksam-47` | `lada-vega-1-5-8v-kaporta-aksami` |
| Lada Vega 1.5 8V | Tel Grubu | 0 | `tel-grubu-51` | `lada-vega-1-5-8v-tel-grubu` |
| Lada Vega 1.5 8V | Süspansiyon Grubu | 2 | `sspansiyon-grubu-55` | `lada-vega-1-5-8v-suspansiyon-grubu` |
| Lada Vega 16v Yedek Parçaları | Fren Grubu | 11 | `fren-grubu-59` | `lada-vega-16v-fren-grubu` |
| Lada Vega 16v Yedek Parçaları | İç Trim Grubu | 5 | `i-trim-grubu-63` | `lada-vega-16v-ic-trim-grubu` |
| Lada Kalina Yedek Parçaları | Ön Düzen Grubu | 0 | `n-dzen-grubu-71` | `lada-kalina-on-duzen-grubu` |
| Lada Kalina Yedek Parçaları | Hortum Grubu | 0 | `hortum-grubu-75` | `lada-kalina-hortum-grubu` |
| Lada Niva-1600 Yedek Parçaları | Lada Vaz 2104 | 13 | `lada-vaz-2104-79` | `lada-vaz-2104` |
| Lada Kalina Yedek Parçaları | Motor Aksamı | 19 | `motor-aksam-67` | `lada-kalina-motor-aksami` |
