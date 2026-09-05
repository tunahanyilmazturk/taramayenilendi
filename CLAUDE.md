# Claude çalışma rehberi

Bu dosya, Claude tabanlı ajanlar için proje özeti ve hızlı yönlendirmedir. Ayrıntılı kurallar ve mimari referans için önce [AGENTS.md](AGENTS.md) dosyasını okuyun.

## Kısa proje özeti

OSGB Yönetim Sistemi; firmaları, personelleri, saha taramalarını, teklifleri, takvimi, ekipmanları, istatistikleri ve çalışan sağlık sonuçlarını yöneten Next.js 16 frontend-only uygulamasıdır. Backend yoktur; demo state `localStorage` üzerinde tutulur.

## Hızlı komutlar

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Çalışırken dikkat edilecekler

1. Kullanıcıya görünen metinleri Türkçe yaz.
2. Mevcut route ve ortak veri hook’larını koru; aynı veriyi yeni bir localStorage anahtarıyla çoğaltma.
3. UI için `components/ui/` bileşenlerini ve `app/globals.css` tasarım tokenlarını kullan. Hardcoded hex renk ekleme.
4. Liste ekranlarında filtre, boş durum, sayfalama ve erişilebilir aksiyonlar bulunmalı.
5. PDF sonuç aktarımında `pdfjs-dist` worker ayarını koru; metinsiz PDF için OCR fallback’ini bozma.
6. Sağlık sonucu yorumlarını kesin tıbbi tanı gibi sunma; referans aralığı ve uzman değerlendirmesi uyarısını koru.
7. Dosya yükleme, toplu silme, yeni personel oluşturma ve veri aktarımı gibi işlemlerde açık onay/durum mesajı göster.
8. Backend veya harici servis ekleme; kullanıcı açıkça istemedikçe uygulama frontend-only kalmalı.
9. Kod değişikliğinden sonra `npm run typecheck`, `npm run lint` ve `npm run build` çalıştır.

## Önemli modüller

- `components/personnel/personnel-page.tsx` — çalışan listesi, kart/liste görünümü, sayfalama ve toplu işlemler
- `components/personnel/result-import-page.tsx` — geniş çoklu sonuç aktarım merkezi
- `components/results/results-page.tsx` — sonuç filtreleri, kişi seçimi, PDF analizleri ve sonuç geçmişi
- `lib/results.ts` — laboratuvar, hemogram, idrar, göz, EKG, röntgen ve SFT analiz modelleri
- `lib/storage.ts` — SSR uyumlu localStorage state katmanı
- `components/screenings/` — tarama oluşturma, detay, PDF ve paylaşım akışları
- `components/offers/` — teklif oluşturma, detay, PDF ve yanıt akışları

## Commit öncesi kontrol

Değişen dosyaları, `git diff` çıktısını ve `git status` durumunu kontrol et. `tmp/`, `.next/`, build çıktıları, kişisel PDF’ler ve `.env` dosyaları repoya eklenmemeli.
