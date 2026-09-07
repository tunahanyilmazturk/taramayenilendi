# Claude çalışma rehberi

Bu dosya, Claude tabanlı ajanlar için proje özeti ve hızlı yönlendirmedir. Ayrıntılı kurallar ve mimari referans için önce [AGENTS.md](AGENTS.md) dosyasını okuyun.

## Kısa proje özeti

OSGB Yönetim Sistemi; firmaları, saha taramalarını, teklifleri, takvimi, ekipmanları ve istatistikleri yöneten Next.js 16 frontend-only uygulamasıdır. Personel ve sağlık sonucu modülleri kaldırılmıştır. Backend yoktur; demo state `localStorage` üzerinde tutulur.

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
5. Dosya yükleme ve silme gibi işlemlerde açık onay/durum mesajı göster.
6. Backend veya harici servis ekleme; kullanıcı açıkça istemedikçe uygulama frontend-only kalmalı.
7. Kod değişikliğinden sonra `npm run typecheck`, `npm run lint` ve `npm run build` çalıştır.

## Önemli modüller

- `lib/storage.ts` — SSR uyumlu localStorage state katmanı
- `components/screenings/` — tarama oluşturma, detay, PDF ve paylaşım akışları
- `components/offers/` — teklif oluşturma, detay, PDF ve yanıt akışları

## Commit öncesi kontrol

Değişen dosyaları, `git diff` çıktısını ve `git status` durumunu kontrol et. `tmp/`, `.next/`, build çıktıları, kişisel PDF’ler ve `.env` dosyaları repoya eklenmemeli.
