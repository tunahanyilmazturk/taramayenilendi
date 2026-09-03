<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# OSGB Yönetim Sistemi — Proje Notları

## Genel

- Next.js 16 (App Router, Turbopack) + Tailwind CSS v4 + TypeScript
- Frontend-only demo: tüm veriler `localStorage`'da saklanır (`hantech-*` anahtarları)
- Tema: `next-themes` (dark/light), tasarım tokenları `app/globals.css` içinde tanımlı

## Komutlar

- `npm run dev` — geliştirme sunucusu
- `npm run build` — production build
- `npm run typecheck` — TypeScript kontrolü (`tsc --noEmit`)
- `npm run lint` — ESLint
- `npm run format` — Prettier

## Mimari

### `lib/`
- `storage.ts` — `useSyncExternalStore` tabanlı localStorage katmanı; `useStoredState`, `useHydrated`, `storageKeys`
- `data.ts` — tip güvenli veri hook'ları: `useCompanies`, `useOffers`, `useTests`, `useTeam`, `useRoles`, `useSectors`, `useTestCategories`
- `demo-data.ts` — tip tanımları ve demo kayıtlar (tek kaynak)
- `format.ts` — `money`, `isoToLabel`, `labelToIso`, `todayIso`, `greeting`, `longDateWithWeekday`
- `hooks.ts` — `useNotice`, `useDismiss`, `useSort`
- `utils.ts` — `cn`, `compareTr`, `includesQuery`, `initials`
- `auth.ts` — demo oturum yönetimi
- `navigation.ts` — sidebar navigasyon konfigürasyonu

### `components/ui/`
Ortak UI bileşenleri (design tokenları kullanır, hardcoded renk yok):
- `button.tsx`, `card.tsx`, `badge.tsx`, `table.tsx`, `field.tsx`, `modal.tsx`, `page-header.tsx`, `empty-state.tsx`, `pagination.tsx`, `switch.tsx`

### `components/panel/`
Shell bileşenleri: `panel-shell.tsx` (auth guard), `sidebar.tsx`, `topbar.tsx`, `placeholder-page.tsx`

### `components/settings/`
Ayarlar bölümleri — her bölüm kendi state'ini yönetir, `SettingsCard` ve `SectionHeading` ortak iskelet

### Tasarım Tokenları
`globals.css` içinde CSS custom property'ler: `--color-brand`, `--color-border`, `--color-foreground` vb.
Tailwind class'ları: `text-foreground`, `bg-card`, `border-border`, `text-brand`, `bg-brand-soft`, `text-muted`, `text-subtle`, `text-heading` vb.
**Hardcoded hex renk kullanmayın** — her zaman token class'larını kullanın.

## Önemli Düzeltmeler (refactor sırasında)

1. **unitPrice bug**: Teklif sihirbazında `test.unitPrice ?? test.price` kullanılarak birim fiyat düzenlemesi korunur
2. **Teklif numarası**: `nextOfferNumber()` silmelerden etkilenmeyen sıralı numara üretir
3. **Paylaşılan veri**: Firmalar, teklifler ve firma detayı aynı `useCompanies`/`useOffers` hook'larını kullanır
4. **Şifre formu**: `security-settings.tsx` içinde validasyon ve güç göstergesi ile
5. **Ekip kalıcılığı**: `useTeam` hook'u localStorage'a yazar, sayfa yenilemede kaybolmaz
6. **Dinamik dashboard**: Tarih ve selamlama `new Date()`'ten gelir, istatistikler gerçek veriden

