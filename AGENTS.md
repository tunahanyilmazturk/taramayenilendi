<!-- BEGIN:nextjs-agent-rules -->

# Next.js çalışma notu

Bu proje Next.js 16 kullanır. Kod yazmadan önce gerekiyorsa ilgili Next.js belgelerini `node_modules/next/dist/docs/` içinden kontrol edin. App Router ve Turbopack davranışlarını eski Next.js varsayımlarıyla karıştırmayın.

Bu blok `next dev` tarafından yönetilir; silmeyin.

<!-- END:nextjs-agent-rules -->

# OSGB Yönetim Sistemi — Agent çalışma rehberi

## Projenin amacı

OSGB operasyonlarını yönetmek için hazırlanmış, Türkçe arayüzlü, responsive frontend demo uygulamasıdır. Firmalar, çalışanlar, taramalar, teklifler, saha takvimi, ekipman, istatistik ve çalışan sağlık sonuçları tek panelden takip edilir.

Uygulama şu anda backend içermez. Tüm demo verileri tarayıcıdaki `localStorage` üzerinde tutulur. Bu nedenle bir tarayıcı profiline kaydedilen veriler başka kullanıcıya veya cihaza otomatik taşınmaz.

## Teknoloji ve komutlar

- Next.js 16, App Router ve Turbopack
- React 19 ve TypeScript
- Tailwind CSS v4 + `next-themes`
- Recharts ile istatistik görselleştirmeleri
- ExcelJS ile `.xlsx` dışa aktarma ve Excel içe aktarma
- `pdfjs-dist` ile PDF metin çıkarma
- Taranmış PDF sayfalarında istemci tarafı OCR için Tesseract.js
- pdfmake ve QRCode ile PDF/iletişim çıktıları
- Zod, React Hook Form ve Zustand yardımcıları

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
npm run start
```

Formatlama için proje script’i yoktur; gerektiğinde `npx prettier --write <dosya veya klasör>` kullanın.

## Uygulama yapısı

### Rotalar

- `/dashboard` — operasyon özeti ve günlük saha gündemi
- `/firmalar` ve `/firmalar/[id]` — firma, sektör, sözleşme ve tarama geçmişi
- `/personeller` — firma çalışanları, filtreleme, liste/kart görünümü, sayfalama ve toplu işlemler
- `/personeller/[id]` — personel detayları ve sonuç geçmişi
- `/personeller/sonuc-aktarimi` — çoklu PDF/CSV/TXT sonuç aktarım merkezi
- `/sonuclar` — firma/tarama/tarih filtresiyle çalışan sonuçları ve analizleri
- `/taramalar`, `/taramalar/[id]`, `/taramalar/yeni` — saha tarama planları ve detayları
- `/teklifler`, `/teklifler/[id]`, `/teklifler/yeni` — teklif listesi, detay ve oluşturma sihirbazı
- `/takvim` — yalnızca taramaların planlandığı saha takvimi
- `/istatistikler` — genel ve modül bazlı raporlar, grafikler ve Excel dışa aktarma
- `/ekipmanlar` — cihaz ve ekipman envanteri
- `/ayarlar` — görünüm, organizasyon, ekip, güvenlik ve test ayarları

### Klasörler

- `app/` — App Router sayfaları ve layout’lar
- `components/ui/` — ortak Button, Card, Badge, Modal, Field, Table, Page ve benzeri UI parçaları
- `components/panel/` — sidebar, topbar, panel shell ve alt navigasyon
- `components/{dashboard,companies,personnel,results,screenings,offers,calendar,statistics,equipment}/` — modül bazlı ekranlar
- `components/settings/` — ayar sekmeleri
- `lib/storage.ts` — `useSyncExternalStore` tabanlı localStorage katmanı
- `lib/data.ts` — tip güvenli demo veri hook’ları
- `lib/demo-data.ts` — ortak demo verilerinin kaynağı
- `lib/employees.ts` — çalışan tipleri ve örnek çalışan kayıtları
- `lib/results.ts` — PDF metin analizi, laboratuvar bulguları, göz ve özel test çıkarımı
- `lib/pdf/` — teklif ve tarama PDF üreticileri ile ortak PDF renkleri
- `lib/format.ts`, `lib/utils.ts`, `lib/hooks.ts` — biçimlendirme, yardımcılar ve ortak hook’lar
- `public/` — statik görseller

## Veri ve localStorage kuralları

`storageKeys` içindeki anahtarları kullanın; modül içinde rastgele localStorage anahtarı üretmeyin. Aynı veriyi birden fazla ekran farklı kopyalarda tutmamalıdır.

Önemli ortak hook’lar: `useCompanies`, `useOffers`, `useTests`, `useTeam`, `useRoles`, `useSectors`, `useTestCategories` ve `useStoredState`.

Yeni kayıt eklerken mevcut ID’leri ezmeyin. Silme işlemlerinden etkilenmeyen numaralandırma gereken yerlerde mevcut yardımcıları kullanın. `localStorage` erişimi SSR sırasında doğrudan yapılmamalıdır; `storage.ts` katmanını kullanın.

## Sonuç/PDF aktarımı

`/personeller/sonuc-aktarimi` ekranı bir modal değildir; çoklu dosya kuyruğu ve iki kolonlu eşleştirme çalışma alanıdır.

Aktarım akışı:

1. Firma seçilir.
2. Bir veya daha fazla PDF, CSV veya TXT eklenir.
3. PDF metni `pdfjs-dist` ile okunur.
4. Metinsiz sayfalarda OCR denenir.
5. Dosya adı ve içerik üzerinden çalışan eşleştirmesi yapılır.
6. Kayıtlı olmayan isimler yeni personel adayı olarak gösterilir.
7. Kullanıcı onaylarsa profil bilgileri ve sonuç kayıtları birlikte oluşturulur.

Yeni sonuç analizleri eklenirken mevcut `ResultRecord`, `ResultAnalysis`, `SpecialTestResult` ve `EyeExamResult` tipleri genişletilmeli; sayfa içine uyumsuz yeni bir sonuç modeli eklenmemelidir. Tıbbi yorumlar kesin tanı gibi sunulmamalı, referans aralığı ve uzman değerlendirmesi gerektirdiği açıkça belirtilmelidir.

PDF işlerinde `GlobalWorkerOptions.workerSrc` tanımlanmalıdır. Büyük PDF’ler için data URL ve OCR maliyeti göz önünde bulundurulmalıdır.

## Tasarım sistemi

`app/globals.css` içindeki tasarım tokenlarını kullanın. Hardcoded hex renk eklemeyin.

Tercih edilen sınıflar: `bg-card`, `bg-card-muted`, `border-border`, `border-border-strong`, `text-heading`, `text-foreground`, `text-muted`, `text-subtle`, `text-brand`, `bg-brand-soft`, `text-brand-soft-fg`, `bg-warning-soft`, `text-warning`, `bg-danger-soft` ve `text-danger`.

Ortak bileşenleri yeniden kullanın. Yeni bir buton, kart veya modal görünümü eklemeden önce `components/ui/` içindeki karşılığını kontrol edin. Masaüstünde ana içeriği sıkıştırmayın; yoğun listelerde filtre, sayfalama ve kompakt görünüm tercih edin.

## Kodlama kuralları

- Kullanıcıya görünen metinler Türkçe olmalı.
- Formlarda erişilebilir `aria-label`, klavye erişimi ve belirgin focus durumları korunmalı.
- Liste ekranlarında boş durum, yükleniyor durumu, hata durumu ve sayfalama düşünülmeli.
- Sıralama ve filtreleme yalnızca görsel değil, gerçek state ile çalışmalı.
- Dosya yükleme ve silme gibi işlemler kullanıcıya notice veya açık durum mesajı vermeli.
- Kullanıcı onayı gereken silme ve yeni personel oluşturma işlemleri `ConfirmDialog` veya açık bir onay alanıyla yapılmalı.
- Mevcut kullanıcı değişikliklerini ve localStorage verisini gereksiz yere sıfırlamayın.
- Backend eklemeyin; kullanıcı açıkça istemedikçe frontend-only mimari korunmalı.

## Değişiklik sonrası kontrol

Her anlamlı değişiklikten sonra şu kontrolleri çalıştırın:

```bash
npm run typecheck
npm run lint
npm run build
```

UI değişikliği varsa ilgili rotayı tarayıcıda kontrol edin. Özellikle modal, dosya yükleme, PDF önizleme, Excel aktarımı, sayfalama ve yeni sekmede açılan detay bağlantılarını elle doğrulayın.
