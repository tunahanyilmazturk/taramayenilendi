# OSGB Yönetim Sistemi

OSGB operasyonlarını tek panelden yönetmek için hazırlanmış modern, responsive ve Türkçe bir frontend uygulamasıdır. Firma ve çalışan kayıtlarından saha taramalarına, tekliflerden sağlık sonuçlarının PDF analizine kadar operasyonun ana akışlarını kapsar.

> Bu sürüm frontend-only demo olarak çalışır. Kalıcı veri tabanı veya API yoktur; kayıtlar tarayıcı `localStorage` alanında saklanır.

## Öne çıkan modüller

### Dashboard

Günlük operasyon özeti, yaklaşan taramalar, saha gündemi, açık teklifler ve ekip/ekipman durumunu tek bakışta sunar.

### Firmalar

Firma kayıtları, sektör bilgileri, sözleşme durumu, çalışan sayısı ve firma bazlı tarama geçmişi takip edilir. Firma detay sayfasından ilgili operasyonlara geçiş yapılabilir.

### Personeller

Firma çalışanları için firma, aktif/pasif ve metin bazlı filtreleme; liste ve kart görünümü; sayfalama; toplu seçim; toplu sonuç durumu güncelleme; toplu silme; personel detay/düzenleme ve Excel’den çalışan aktarımı bulunur.

### Toplu sonuç aktarımı

`/personeller/sonuc-aktarimi` adresindeki aktarım merkezi, modal yerine geniş bir çalışma ekranı olarak tasarlanmıştır.

1. Sonuçların ait olduğu firma seçilir.
2. Birden fazla PDF, CSV veya TXT dosyası yüklenir.
3. PDF metni `pdfjs-dist` ile okunur; metinsiz sayfalarda OCR denenir.
4. Dosya adı ve içerik üzerinden kayıtlı personeller eşleştirilir.
5. Kayıtlı olmayan isimler yeni personel adayı olarak gösterilir.
6. Onay verilirse PDF’den çıkarılan profil bilgileriyle personel oluşturulur.
7. Sonuç dosyası personele bağlanır ve analiz kaydı oluşturulur.

### Sonuçlar

Firma, tarama türü, tarih ve durum filtreleriyle çalışan sonuçları incelenebilir. Seçilen personelin kartı, sonuç geçmişi, PDF dosyaları ve analizleri görüntülenir.

Desteklenen analiz alanları arasında hemogram, tam idrar tahlili, göz muayenesi, EKG, akciğer/röntgen, işitme testi, SFT/spirometri ve genel laboratuvar bulguları bulunur. Analizler bilgilendirme amaçlıdır; kesin tıbbi tanı yerine geçmez.

### Taramalar ve takvim

Tarama oluşturma sihirbazı, tarama detay sayfası, hizmet kapsamı, saha planı, notlar, belgeler, PDF oluşturma ve ekip paylaşımı akışlarını içerir. Çok günlük taramalar takvimde ilgili günlere otomatik yayılır.

### Teklifler

Teklif listesi, gelişmiş filtreler, teklif oluşturma sihirbazı, fiyatlandırma, şartlar, detay sayfası, PDF çıktısı ve dış paydaşların yanıt verebildiği teklif bağlantısı bulunur.

### İstatistikler

Genel bakış ve modül bazlı sekmeler üzerinden operasyon, finans, tarama, firma, teklif ve ekipman verileri izlenebilir. Raporlar ExcelJS kullanılarak `.xlsx` formatında dışa aktarılır.

### Diğer ekranlar

Ekipman bakım ve kalibrasyon takibi, aylık tarama takvimi, organizasyon/görünüm/ekip/güvenlik/test ayarları ve responsive panel navigasyonu uygulamaya dahildir.

## Teknoloji yığını

- Next.js 16 + App Router + Turbopack
- React 19, TypeScript ve Tailwind CSS v4
- `next-themes`, Recharts, ExcelJS
- `pdfjs-dist`, Tesseract.js, pdfmake ve QRCode
- React Hook Form, Zod ve Lucide React

## Gereksinimler

- Node.js `>=20.9.0`
- npm `>=10.0.0`

## Kurulum

```bash
git clone https://github.com/tunahanyilmazturk/taramayenilendi.git
cd taramayenilendi
npm install
```

## Geliştirme sunucusu

```bash
npm run dev
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000) adresinde açılır.

## Üretim kontrolü

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

Formatlama için:

```bash
npx prettier --write components/personnel/personnel-page.tsx
```

## Proje yapısı

```text
app/                 App Router rotaları
components/ui/       Ortak tasarım bileşenleri
components/panel/    Sidebar, topbar ve panel shell
components/personnel Personel ve sonuç aktarımı
components/results/  Sonuç merkezi
components/screenings Tarama akışları
components/offers/   Teklif akışları
components/statistics İstatistik ekranı
components/settings/ Ayarlar sekmeleri
lib/storage.ts        localStorage state katmanı
lib/data.ts           Ortak veri hook’ları
lib/demo-data.ts      Demo veri kaynağı
lib/employees.ts      Personel modelleri
lib/results.ts        PDF ve sonuç analizleri
lib/pdf/              PDF üretim yardımcıları
public/images/        Statik görseller
```

## Veri saklama

Uygulama `lib/storage.ts` içindeki `storageKeys` ve `useStoredState` üzerinden tarayıcı storage kullanır. Demo veriler `lib/demo-data.ts` ve ilgili tip dosyalarından gelir. Tarayıcı localStorage alanını temizlemek demo firma, personel, teklif, tarama ve sonuç kayıtlarını siler.

## Tasarım sistemi

Renkler ve arayüz ölçüleri `app/globals.css` içindeki tokenlarla yönetilir. Yeni bileşenlerde hardcoded hex renk kullanılmamalıdır. Ortak sınıflar arasında `bg-card`, `bg-card-muted`, `border-border`, `text-heading`, `text-muted`, `text-brand`, `bg-brand-soft`, `bg-warning-soft` ve `bg-danger-soft` bulunur.

## Güvenlik ve kapsam notu

Bu demo uygulamada gerçek kimlik doğrulama, sunucu tarafı yetkilendirme, merkezi dosya depolama ve kalıcı veri tabanı bulunmaz. Üretim kullanımı için backend, erişim kontrolü, güvenli dosya depolama, audit log, kişisel sağlık verisi güvenliği ve KVKK süreçleri ayrıca tasarlanmalıdır.

## Katkı akışı

1. Değişiklik öncesi [AGENTS.md](AGENTS.md) ve [CLAUDE.md](CLAUDE.md) dosyalarını okuyun.
2. Ortak UI ve storage katmanlarını yeniden kullanın.
3. Türkçe metin, erişilebilirlik ve responsive tasarımı koruyun.
4. Değişiklik sonrası typecheck, lint ve build çalıştırın.
5. `tmp/`, `.next/`, kişisel PDF’ler ve `.env` dosyalarını commit etmeyin.
