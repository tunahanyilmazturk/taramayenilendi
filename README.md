# OSGB Yönetim Sistemi

OSGB operasyonlarını tek panelden yönetmek için hazırlanmış modern, responsive ve Türkçe bir frontend uygulamasıdır. Firma kayıtlarından saha taramalarına, tekliflerden istatistiklere kadar operasyonun ana akışlarını kapsar.

> Bu sürüm frontend-only demo olarak çalışır. Kalıcı veri tabanı veya API yoktur; kayıtlar tarayıcı `localStorage` alanında saklanır.

## Öne çıkan modüller

### Dashboard

Günlük operasyon özeti, yaklaşan taramalar, saha gündemi, açık teklifler ve ekip/ekipman durumunu tek bakışta sunar.

### Firmalar

Firma kayıtları, sektör bilgileri, sözleşme durumu, çalışan sayısı ve firma bazlı tarama geçmişi takip edilir. Firma detay sayfasından ilgili operasyonlara geçiş yapılabilir.

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
- pdfmake ve QRCode
- Lucide React

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
npx prettier --write components/ui
```

## Proje yapısı

```text
app/                 App Router rotaları
components/ui/       Ortak tasarım bileşenleri
components/panel/    Sidebar, topbar ve panel shell
components/screenings Tarama akışları
components/offers/   Teklif akışları
components/statistics İstatistik ekranı
components/settings/ Ayarlar sekmeleri
lib/storage.ts        localStorage state katmanı
lib/data.ts           Ortak veri hook’ları
lib/demo-data.ts      Demo veri kaynağı
lib/pdf/              PDF üretim yardımcıları
public/images/        Statik görseller
```

## Veri saklama

Uygulama `lib/storage.ts` içindeki `storageKeys` ve `useStoredState` üzerinden tarayıcı storage kullanır. PDF analizleri veya sunucu tarafı dosya depolama bulunmaz; uygulama frontend-only demo olarak çalışır.

Teklif yanıtı bağlantısı da demo kapsamında aynı tarayıcıdaki localStorage verisini kullanır. Farklı cihaz veya kullanıcılar arasında gerçek paylaşım için backend ve merkezi veri saklama gerekir.

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
