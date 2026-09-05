"use client";

import {
  ArrowUpRight,
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FilePlus2,
  FileText,
  Sparkles,
  MapPin,
  Send,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Badge, contractTone, CountPill, offerTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatTile } from "@/components/ui/card";
import { Page } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/table";
import { useCompanies, useOffers, useTeam, useScreenings, useEquipment } from "@/lib/data";
import { useSession } from "@/lib/auth";
import { companyLocation, type Company, type Offer } from "@/lib/demo-data";
import { greeting, labelToIso, longDateWithWeekday, money, todayIso } from "@/lib/format";
import { useHydrated } from "@/lib/storage";
import { initials } from "@/lib/utils";

export default function DashboardPage() {
  const hydrated = useHydrated();
  const [companies] = useCompanies();
  const [offers] = useOffers();
  const [team] = useTeam();
  const [screenings] = useScreenings();
  const [equipment] = useEquipment();
  const { session } = useSession();

  const now = useMemo(() => new Date(), []);
  const dateLabel = longDateWithWeekday(now);
  const hello = greeting(now);
  const today = todayIso();
  const agenda = screenings
    .filter((item) => !["Tamamlandı", "İptal"].includes(item.status) && labelToIso(item.endDate || item.date) >= today)
    .sort((a, b) => `${labelToIso(a.date)} ${a.time}`.localeCompare(`${labelToIso(b.date)} ${b.time}`));
  const todayScreenings = agenda.filter((item) => labelToIso(item.date) <= today);
  const maintenance = equipment.filter(
    (item) =>
      item.status === "Bakımda" ||
      item.status === "Kalibrasyon bekliyor" ||
      [item.nextCalibration, item.inspectionDate, item.insuranceEnd].some((date) => {
        const days = daysUntil(date || "");
        return days !== null && days <= 30;
      }),
  );

  const activeCompanies = companies.filter((c) => c.contract === "Aktif").length;
  const renewingCompanies = companies.filter((c) => c.contract === "Yenileniyor").length;
  const activeTeam = team.filter((m) => m.active).length;
  const openOffers = offers.filter((o) => o.status === "Gönderildi" || o.status === "Görüşülüyor").length;
  const upcoming = useMemo(() => {
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

  if (!hydrated) return <DashboardSkeleton />;

  return (
    <Page>
      <section className="relative isolate overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar px-5 py-6 text-sidebar-fg-strong shadow-primary sm:px-7 sm:py-8 lg:px-9 lg:py-9">
        <div className="pointer-events-none absolute -right-24 -top-32 -z-10 size-80 rounded-full border border-sidebar-accent/20 bg-sidebar-active/35 blur-[1px]" />
        <div className="pointer-events-none absolute -bottom-48 left-1/3 -z-10 size-96 rounded-full border border-brand/20 bg-brand/10 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sidebar-accent/25 bg-sidebar-hover/60 px-3 py-1.5 text-[11px] font-semibold text-sidebar-accent">
              <Sparkles className="size-3.5" />
              <span>{dateLabel}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {hello}, {session?.name.split(" ")[0] || "kullanıcı"}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-sidebar-fg/80 sm:text-base">
              Saha operasyonlarınızı tek bakışta yönetin. Bugünün planlarını kontrol edin, ekibinizi hazırlayın ve sıradaki adımı hızla başlatın.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button asChild size="sm" className="bg-brand text-brand-fg shadow-none hover:bg-brand-strong hover:text-brand-fg">
                <Link href="/taramalar/yeni">
                  <CalendarDays /> Tarama planla
                </Link>
              </Button>
              <Button asChild size="sm" className="border border-sidebar-border bg-sidebar-hover/70 text-sidebar-fg-strong shadow-none hover:bg-sidebar-active hover:text-sidebar-fg-strong">
                <Link href="/teklifler/yeni">
                  <FilePlus2 /> Yeni teklif
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[430px] lg:grid-cols-2">
            <HeroMetric label="Bugünkü operasyon" value={todayScreenings.length} icon={Activity} />
            <HeroMetric label="Yaklaşan tarama" value={agenda.length} icon={CalendarDays} />
            <HeroMetric label="Aktif ekip" value={activeTeam} icon={UsersRound} />
            <HeroMetric label="Açık teklif" value={openOffers} icon={FileText} />
          </div>
        </div>
      </section>

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
          <div className="mt-5 grid grid-cols-2 gap-3">
            <StatTile icon={ClipboardList} label="Bugünkü operasyon" value={todayScreenings.length} />
            <StatTile
              icon={UsersRound}
              label="Bugünkü planlarda katılımcı"
              value={todayScreenings.reduce((sum, item) => sum + item.participants, 0)}
            />
          </div>
          <div className="divide-divider mt-4 flex-1 divide-y">
            {agenda.length === 0 ? (
              <p className="text-muted py-6 text-sm">
                Yaklaşan tarama bulunmuyor. Tarama planlayarak saha takviminizi oluşturabilirsiniz.
              </p>
            ) : (
              agenda.slice(0, 5).map((item) => (
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
                  </div>
                  <Badge tone={item.status === "Hazırlanıyor" ? "warning" : "info"}>{item.status}</Badge>
                </Link>
              ))
            )}
          </div>
        </Card>
        <Card className="flex h-full flex-col p-5 sm:p-6">
          <CardHeader
            icon={Clock3}
            title="Bakım ve geçerlilik takibi"
            description="Bakım, kalibrasyon, muayene veya sigortası yaklaşan kaynaklar."
            action={<CountPill>{maintenance.length} kayıt</CountPill>}
          />
          <div className="mt-5 flex-1 space-y-3">
            {maintenance.length === 0 ? (
              <p className="text-muted py-6 text-sm">Önümüzdeki 30 gün için takip gerektiren kaynak yok.</p>
            ) : (
              maintenance.slice(0, 5).map((item) => (
                <Link
                  href="/ekipmanlar"
                  key={item.id}
                  className="border-border bg-card-muted hover:border-brand-outline block rounded-xl border p-3"
                >
                  <p className="text-heading text-sm font-semibold">{item.name}</p>
                  <p className="text-muted mt-1 text-xs">
                    {item.kind} · {item.status}
                  </p>
                  <p className="text-muted mt-1 text-xs">Sorumlu: {item.responsible || "Atanmadı"}</p>
                </Link>
              ))
            )}
          </div>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/ekipmanlar">
              Kaynakları yönet <ArrowUpRight />
            </Link>
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
            {upcoming.length === 0 ? (
              <p className="text-muted py-8 text-center text-sm">Henüz firma kaydı bulunmuyor.</p>
            ) : (
              upcoming.map((company) => <ScreeningRow key={company.id} company={company} />)
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
                  <Badge tone={days !== null && days <= 15 ? "danger" : "warning"}>
                    {days !== null ? (days < 0 ? `${Math.abs(days)} gün geçti` : `${days} gün`) : "—"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid items-stretch gap-6 xl:grid-cols-[1fr_1fr]">
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
      </div>
    </Page>
  );
}

function HeroMetric({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="rounded-xl border border-sidebar-border/80 bg-sidebar-hover/55 p-3.5 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium text-sidebar-muted">{label}</p>
        <Icon className="size-3.5 text-sidebar-accent" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-sidebar-fg-strong tabular-nums">{value}</p>
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
