"use client";

import {
  ArrowUpRight,
  AlertTriangle,
  BusFront,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FilePlus2,
  FileText,
  Sparkles,
  MapPin,
  Send,
  Wrench,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, contractTone, CountPill, offerTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatTile } from "@/components/ui/card";
import { Page } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/table";
import { useCompanies, useEquipment, useOffers, useScreenings } from "@/lib/data";
import { useSession } from "@/lib/auth";
import { companyLocation, type Company, type Offer } from "@/lib/demo-data";
import { greeting, labelToIso, longDateWithWeekday, money, todayIso } from "@/lib/format";
import { useHydrated } from "@/lib/storage";
import { initials } from "@/lib/utils";

export default function DashboardPage() {
  const hydrated = useHydrated();
  const [companies] = useCompanies();
  const [offers] = useOffers();
  const [screenings] = useScreenings();
  const [equipment] = useEquipment();
  const { session } = useSession();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const dateLabel = longDateWithWeekday(now);
  const hello = greeting(now);
  const today = todayIso();
  const agenda = useMemo(
    () => screenings
      .filter((item) => !["Tamamlandı", "İptal"].includes(item.status) && labelToIso(item.endDate || item.date) >= today)
      .sort((a, b) => `${labelToIso(a.date)} ${a.time}`.localeCompare(`${labelToIso(b.date)} ${b.time}`)),
    [screenings, today],
  );
  const todayScreenings = agenda.filter((item) => labelToIso(item.date) <= today && labelToIso(item.endDate || item.date) >= today);
  const activeCompanies = companies.filter((c) => c.contract === "Aktif").length;
  const renewingCompanies = companies.filter((c) => c.contract === "Yenileniyor").length;
  const recentScreeningCompanies = useMemo(() => {
    const today = todayIso();
    return companies
      .map((c) => ({ company: c, sortKey: labelToIso(c.lastScreening) }))
      .filter((item) => item.sortKey && item.sortKey <= today)
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
      .slice(0, 4)
      .map(({ company }) => company);
  }, [companies]);

  const expiringContracts = useMemo(
    () =>
      companies
        .filter((c) => c.contract !== "Pasif")
        .map((c) => ({ company: c, days: daysUntil(c.contractEnd) }))
        .filter((item) => item.days !== null && item.days <= 60)
        .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
        .slice(0, 4),
    [companies],
  );

  const recentOffers = useMemo(
    () => [...offers].sort((a, b) => labelToIso(b.createdAt).localeCompare(labelToIso(a.createdAt))).slice(0, 4),
    [offers],
  );

  const pendingOffers = useMemo(
    () => offers
      .filter((offer) => ["Gönderildi", "Görüşülüyor"].includes(offer.status) && !offer.customerResponse)
      .sort((a, b) => labelToIso(a.validUntil).localeCompare(labelToIso(b.validUntil)))
      .slice(0, 4),
    [offers],
  );

  const equipmentAttention = useMemo(
    () => equipment.filter((item) => ["Bakımda", "Kalibrasyon bekliyor"].includes(item.status)).slice(0, 4),
    [equipment],
  );

  if (!hydrated) return <DashboardSkeleton />;

  return (
    <Page>
      <section className="relative isolate overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar bg-[url('/headers/dashboard-osgb.png')] bg-cover bg-center px-5 py-6 text-sidebar-fg-strong shadow-primary sm:px-7 sm:py-8 lg:px-9 lg:py-9">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-sidebar/30" />
        <div className="pointer-events-none absolute -right-24 -top-32 -z-10 size-80 rounded-full border border-sidebar-accent/20 bg-sidebar-active/35 blur-[1px]" />
        <div className="pointer-events-none absolute -bottom-48 left-1/3 -z-10 size-96 rounded-full border border-brand/20 bg-brand/10 blur-2xl" />
        <div className="relative z-10 flex min-h-[270px] flex-col justify-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sidebar-accent/25 bg-sidebar-hover/60 px-3 py-1.5 text-[11px] font-semibold text-sidebar-accent">
              <Sparkles className="size-3.5" />
              <span>OSGB operasyon merkezi · {dateLabel}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {hello}, {session?.name.split(" ")[0] || "kullanıcı"}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-sidebar-fg/80 sm:text-base">
              Firmalarınızı, saha taramalarınızı ve teklif süreçlerinizi tek merkezden yönetin. Bugünün planını gözden geçirin, ekibinizi hazırlayın ve bir sonraki adımı hemen başlatın.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-sidebar-fg/75">
              <span>Saha operasyonları</span>
              <span>Firma takibi</span>
              <span>Teklif yönetimi</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button asChild size="sm" className="bg-brand text-brand-fg shadow-none hover:bg-brand-strong hover:text-brand-fg">
                <Link href="/taramalar/yeni">
                  <CalendarDays /> Tarama oluştur
                </Link>
              </Button>
              <Button asChild size="sm" className="border border-sidebar-border bg-sidebar-hover/70 text-sidebar-fg-strong shadow-none hover:bg-sidebar-active hover:text-sidebar-fg-strong">
                <Link href="/teklifler/yeni">
                  <FilePlus2 /> Teklif oluştur
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Card className="mt-6 p-5 sm:p-6">
        <CardHeader
          action={<CountPill>{agenda.filter((item) => item.status === "Hazırlanıyor").length + pendingOffers.length + expiringContracts.length + equipmentAttention.length} açık konu</CountPill>}
          description="Günün planını ilerletmek için dikkat bekleyen işler."
          icon={AlertTriangle}
          title="Aksiyon bekleyenler"
        />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AttentionCard
            count={agenda.filter((item) => item.status === "Hazırlanıyor").length}
            description="Saha hazırlığı tamamlanması gereken planlar"
            href="/taramalar"
            label="Tarama hazırlıkları"
            tone="warning"
          />
          <AttentionCard
            count={pendingOffers.length}
            description="Müşteri yanıtı bekleyen teklifler"
            href="/teklifler"
            label="Teklif yanıtları"
            tone="brand"
          />
          <AttentionCard
            count={expiringContracts.length}
            description="60 gün içinde yenilenmesi gereken sözleşmeler"
            href="/firmalar"
            label="Sözleşme yenilemeleri"
            tone="danger"
          />
          <AttentionCard
            count={equipmentAttention.length}
            description="Bakım veya kalibrasyon sürecindeki cihazlar"
            href="/ekipmanlar"
            label="Ekipman durumu"
            tone="neutral"
          />
        </div>
      </Card>

      <div className="mt-6 grid items-stretch gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <Card className="flex h-full flex-col p-5 sm:p-6">
          <CardHeader
            icon={CalendarDays}
            title="Saha gündemi"
            description="Bugün devam eden ve sıradaki planlı taramalar."
            action={
              <Button asChild size="xs" variant="soft">
                <Link href="/takvim">
                  Takvimi aç <ArrowUpRight />
                </Link>
              </Button>
            }
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="rounded-full bg-brand-soft px-2 py-1 font-semibold text-brand-soft-fg">{todayScreenings.length} bugün</span>
              <span>{agenda.length} planlı tarama</span>
            </div>
            <span className="text-subtle text-[11px]">Bu hafta</span>
          </div>
          <MiniWeekCalendar items={agenda.map((item) => ({ date: item.date, label: item.title }))} tone="brand" />
          <div className="divide-divider mt-3 flex-1 divide-y">
            {agenda.length === 0 ? (
              <p className="text-muted py-6 text-sm">
                Yaklaşan tarama bulunmuyor. Tarama planlayarak saha takviminizi oluşturabilirsiniz.
              </p>
            ) : (
              agenda.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/taramalar/${item.id}`}
                  className="hover:bg-card-muted flex flex-wrap items-center justify-between gap-3 rounded-lg py-4 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-heading text-sm font-semibold">{item.title}</p>
                    <p className="text-muted mt-1 text-xs">
                      {item.location || "Konum belirtilmedi"} · {item.participants} kişi
                    </p>
                    <p className="text-muted mt-1 text-xs">
                      {item.date} · {item.time || "Saat belirtilmedi"}
                    </p>
                    <p className="text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1"><UsersRound className="size-3" /> {item.team || "Ekip atanmadı"}</span>
                      <span className="inline-flex items-center gap-1"><BusFront className="size-3" /> {item.vehicle || "Araç atanmadı"}</span>
                    </p>
                  </div>
                  <Badge tone={item.status === "Hazırlanıyor" ? "warning" : "info"}>{item.status}</Badge>
                </Link>
              ))
            )}
          </div>
        </Card>
        <Card className="flex h-full flex-col p-5 sm:p-6">
          <CardHeader
            icon={Send}
            title="Teklif takibi"
            description="Tekliflerinizi haftalık akışta ve durumlarıyla takip edin."
            action={<CountPill>{recentOffers.length} teklif</CountPill>}
          />
          <MiniWeekCalendar items={pendingOffers.map((item) => ({ date: item.validUntil, label: item.title }))} tone="warning" />
          <div className="mt-3 space-y-2">
            {(pendingOffers.length > 0 ? pendingOffers : recentOffers).slice(0, 3).map((offer) => (
              <Link key={offer.id} href={`/teklifler/${offer.id}`} className="border-border bg-card-muted hover:border-brand-outline flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-heading">{offer.title}</span>
                  <span className="text-muted mt-1 block text-[10px]">Geçerlilik: {offer.validUntil || "—"}</span>
                </span>
                <Badge tone={offerTone[offer.status]}>{pendingOffers.length > 0 ? "Yanıt bekliyor" : offer.status}</Badge>
              </Link>
            ))}
          </div>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/teklifler">Teklifleri yönet <ArrowUpRight /></Link>
          </Button>
        </Card>
      </div>

      <div className="mt-6 grid items-stretch gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <Card className="flex h-full flex-col p-5 sm:p-6">
          <CardHeader
            action={
              <Button asChild size="xs" variant="ghost">
                <Link href="/firmalar">
                  Tümünü gör <ArrowUpRight />
                </Link>
              </Button>
            }
            description="Son taraması yapılan firmalar ve güncel sözleşme durumları."
            icon={ClipboardList}
            title="Son tarama akışı"
          />
          <div className="divide-divider mt-5 flex-1 divide-y">
            {recentScreeningCompanies.length === 0 ? (
              <p className="text-muted py-8 text-center text-sm">Henüz firma kaydı bulunmuyor.</p>
            ) : (
              recentScreeningCompanies.map((company) => <ScreeningRow key={company.id} company={company} />)
            )}
          </div>
        </Card>

        <Card className="flex h-full flex-col p-5 sm:p-6">
          <CardHeader
            action={<CountPill>{expiringContracts.length} yaklaşan</CountPill>}
            description="60 gün içinde yenilenmesi gereken sözleşmeler."
            icon={CalendarDays}
            title="Sözleşme yenileme"
          />
          <div className="divide-divider mt-5 flex-1 divide-y">
            {expiringContracts.length === 0 ? (
              <p className="text-muted py-8 text-center text-sm">Yaklaşan sözleşme bitişi yok.</p>
            ) : (
              expiringContracts.map(({ company, days }) => (
                <div className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0" key={company.id}>
                  <Link className="flex min-w-0 items-center gap-3" href={`/firmalar/${company.id}`}>
                    <Avatar size="sm" text={initials(company.name)} />
                    <span className="min-w-0">
                      <span className="text-foreground block truncate text-sm font-semibold">{company.name}</span>
                      <span className="text-subtle mt-1 block text-[11px]">Bitiş: {company.contractEnd || "—"}</span>
                    </span>
                  </Link>
                  <Badge tone={contractRiskTone(days)}>
                    {contractRiskLabel(days)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid items-stretch gap-6 xl:grid-cols-3">
        <Card className="flex h-full flex-col p-5 sm:p-6">
          <CardHeader
            action={
              <Button asChild size="xs" variant="ghost">
                <Link href="/teklifler">
                  Tümünü gör <ArrowUpRight />
                </Link>
              </Button>
            }
            description="Son oluşturulan ve durum güncellemesi bekleyen teklifler."
            icon={Send}
            title="Son teklifler"
          />
          <div className="divide-divider mt-5 flex-1 divide-y">
            {recentOffers.length === 0 ? (
              <p className="text-muted py-8 text-center text-sm">Henüz teklif kaydı bulunmuyor.</p>
            ) : (
              recentOffers.map((offer) => <OfferRow key={offer.id} offer={offer} />)
            )}
          </div>
        </Card>

        <Card className="flex h-full flex-col p-5 sm:p-6">
          <CardHeader
            action={
              <Button asChild size="xs" variant="ghost">
                <Link href="/firmalar">
                  Tümünü gör <ArrowUpRight />
                </Link>
              </Button>
            }
            description="Yenileme bekleyen ve pasif firma durumları."
            icon={UsersRound}
            title="Firma sözleşme özeti"
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <StatTile icon={CheckCircle2} label="Aktif" value={activeCompanies} />
            <StatTile icon={CalendarDays} label="Yenileniyor" value={renewingCompanies} />
            <StatTile icon={UsersRound} label="Toplam firma" value={companies.length} />
            <StatTile
              icon={ClipboardList}
              label="Pasif"
              value={companies.filter((c) => c.contract === "Pasif").length}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/firmalar">
                <UsersRound /> Firma listesi
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/teklifler/yeni">
                <FileText /> Yeni teklif
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="flex h-full flex-col p-5 sm:p-6">
          <CardHeader
            action={<CountPill>{equipmentAttention.length} dikkat</CountPill>}
            description="Bakım ve kalibrasyon bekleyen cihazlar."
            icon={Wrench}
            title="Ekipman durumu"
          />
          <div className="divide-divider mt-5 flex-1 divide-y">
            {equipmentAttention.length === 0 ? (
              <p className="text-muted py-8 text-center text-sm">Bakım veya kalibrasyon bekleyen ekipman yok.</p>
            ) : (
              equipmentAttention.map((item) => (
                <Link className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0" href="/ekipmanlar" key={item.id}>
                  <span className="min-w-0">
                    <span className="text-foreground block truncate text-sm font-semibold">{item.name}</span>
                    <span className="text-muted mt-1 block truncate text-[11px]">{item.responsible || "Sorumlu atanmadı"} · {item.location || "Konum yok"}</span>
                  </span>
                  <Badge tone={item.status === "Kalibrasyon bekliyor" ? "warning" : "danger"}>{item.status}</Badge>
                </Link>
              ))
            )}
          </div>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/ekipmanlar">Ekipmanları yönet <ArrowUpRight /></Link>
          </Button>
        </Card>
      </div>
    </Page>
  );
}

function MiniWeekCalendar({
  items,
  tone,
}: {
  items: Array<{ date: string; label: string }>;
  tone: "brand" | "warning";
}) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    const iso = date.toISOString().slice(0, 10);
    return {
      iso,
      day: date.toLocaleDateString("tr-TR", { weekday: "short" }).replace(".", ""),
      number: date.getDate(),
      count: items.filter((item) => labelToIso(item.date) === iso).length,
    };
  });

  return (
    <div className="border-border bg-card-muted mt-3 grid grid-cols-7 gap-1 rounded-xl border p-2">
      {days.map((day, index) => (
        <div
          key={day.iso}
          className={`relative min-w-0 rounded-lg px-1 py-2 text-center ${index === 0 ? "bg-brand text-brand-fg" : "bg-card"}`}
        >
          <p className={`text-[9px] font-semibold uppercase ${index === 0 ? "text-brand-fg/75" : "text-subtle"}`}>{day.day}</p>
          <p className={`mt-1 text-sm font-semibold ${index === 0 ? "text-brand-fg" : "text-heading"}`}>{day.number}</p>
          {day.count > 0 && (
            <span className={`mx-auto mt-1 block size-1.5 rounded-full ${tone === "warning" ? "bg-warning" : "bg-brand"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function ScreeningRow({ company }: { company: Company }) {
  return (
    <div className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <Link className="flex min-w-0 items-center gap-3" href={`/firmalar/${company.id}`}>
        <Avatar text={initials(company.name)} />
        <span className="min-w-0">
          <span className="text-foreground block truncate text-sm font-semibold">{company.name}</span>
          <span className="text-muted mt-1 flex items-center gap-1 truncate text-xs">
            <MapPin className="size-3" />
            {companyLocation(company) || "—"}
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-foreground flex items-center justify-end gap-1 text-xs font-semibold">
            <Clock3 className="size-3.5" />
            {company.lastScreening}
          </p>
          <p className="text-subtle mt-1 text-[10px]">{company.screenings} tarama</p>
        </div>
        <Badge tone={contractTone[company.contract]}>{company.contract}</Badge>
      </div>
    </div>
  );
}

function OfferRow({ offer }: { offer: Offer }) {
  return (
    <Link
      className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
      href={`/teklifler/${offer.id}`}
    >
      <div className="min-w-0">
        <p className="text-foreground truncate text-sm font-semibold">{offer.title}</p>
        <p className="text-subtle mt-1 text-[11px]">
          {offer.number} · {offer.company}
        </p>
      </div>
      <div className="flex items-center gap-3 sm:shrink-0">
        <span className="text-foreground text-sm font-semibold">{money(offer.total)}</span>
        <Badge tone={offerTone[offer.status]}>{offer.status}</Badge>
      </div>
    </Link>
  );
}

function AttentionCard({ count, description, href, label, tone }: { count: number; description: string; href: string; label: string; tone: "brand" | "danger" | "neutral" | "warning" }) {
  return (
    <Link className="border-border bg-card-muted hover:border-brand-outline flex items-start justify-between gap-3 rounded-xl border p-4 transition-colors" href={href}>
      <span className="min-w-0">
        <span className="text-foreground block text-sm font-semibold">{label}</span>
        <span className="text-muted mt-1 block text-[11px] leading-4">{description}</span>
      </span>
      <Badge tone={tone}>{count}</Badge>
    </Link>
  );
}

function contractRiskTone(days: number | null): "danger" | "warning" | "brand" {
  if (days !== null && days <= 15) return "danger";
  if (days !== null && days <= 30) return "warning";
  return "brand";
}

function contractRiskLabel(days: number | null) {
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)} gün geçti`;
  if (days <= 15) return `Kritik · ${days} gün`;
  if (days <= 30) return `Yaklaşıyor · ${days} gün`;
  return `${days} gün`;
}

function DashboardSkeleton() {
  return (
    <Page className="animate-pulse">
      <div className="bg-card-muted h-8 w-64 rounded" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="bg-card-muted h-24 rounded-2xl" key={i} />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="bg-card-muted h-64 rounded-2xl" />
        <div className="bg-card-muted h-64 rounded-2xl" />
      </div>
    </Page>
  );
}

function daysUntil(label: string) {
  const iso = labelToIso(label);
  if (!iso) return null;
  const target = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
