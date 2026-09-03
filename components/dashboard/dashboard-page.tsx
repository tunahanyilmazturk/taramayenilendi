"use client";

import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  MapPin,
  Send,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Badge, contractTone, CountPill, offerTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, IconBadge, StatTile, SummaryCard } from "@/components/ui/card";
import { Page, PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/table";
import { useCompanies, useOffers, useTeam } from "@/lib/data";
import { companyLocation, type Company, type Offer } from "@/lib/demo-data";
import { greeting, labelToIso, longDateWithWeekday, money, todayIso } from "@/lib/format";
import { useHydrated } from "@/lib/storage";
import { initials } from "@/lib/utils";

export default function DashboardPage() {
  const hydrated = useHydrated();
  const [companies] = useCompanies();
  const [offers] = useOffers();
  const [team] = useTeam();

  const now = useMemo(() => new Date(), []);
  const dateLabel = longDateWithWeekday(now);
  const hello = greeting(now);

  const activeCompanies = companies.filter((c) => c.contract === "Aktif").length;
  const renewingCompanies = companies.filter((c) => c.contract === "Yenileniyor").length;
  const activeTeam = team.filter((m) => m.active).length;
  const openOffers = offers.filter((o) => o.status === "Gönderildi" || o.status === "Görüşülüyor").length;
  const approvedVolume = offers.filter((o) => o.status === "Onaylandı").reduce((sum, o) => sum + o.total, 0);

  const upcoming = useMemo(() => {
    const today = todayIso();
    return companies
      .map((c) => ({ company: c, sortKey: labelToIso(c.lastScreening) || "9999" }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
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
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/tarama-planlari">
              <CalendarDays /> Tarama planla
            </Link>
          </Button>
        }
        description="Saha operasyonlarınıza ve açık iş kalemlerine genel bakış."
        eyebrow={dateLabel}
        title={`${hello}, Ahmet`}
      />

      <section aria-label="Operasyon özeti" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={CheckCircle2} label="Aktif firma" value={activeCompanies} />
        <SummaryCard icon={FileText} label="Açık teklif" value={openOffers} />
        <SummaryCard icon={UsersRound} label="Aktif ekip" value={activeTeam} />
        <SummaryCard icon={TrendingUp} label="Onaylanan hacim" value={money(approvedVolume)} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <Card className="p-5 sm:p-6">
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
          <div className="mt-5 divide-y divide-divider">
            {upcoming.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">Henüz firma kaydı bulunmuyor.</p>
            ) : (
              upcoming.map((company) => <ScreeningRow key={company.id} company={company} />)
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <CardHeader
            action={
              <CountPill>{expiringContracts.length} yaklaşan</CountPill>
            }
            description="60 gün içinde yenilenmesi gereken sözleşmeler."
            icon={CalendarDays}
            title="Sözleşme yenileme"
          />
          <div className="mt-5 divide-y divide-divider">
            {expiringContracts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">Yaklaşan sözleşme bitişi yok.</p>
            ) : (
              expiringContracts.map(({ company, days }) => (
                <div className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0" key={company.id}>
                  <Link className="flex min-w-0 items-center gap-3" href={`/firmalar/${company.id}`}>
                    <Avatar size="sm" text={initials(company.name)} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">{company.name}</span>
                      <span className="mt-1 block text-[11px] text-subtle">Bitiş: {company.contractEnd || "—"}</span>
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="p-5 sm:p-6">
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
          <div className="mt-5 divide-y divide-divider">
            {recentOffers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">Henüz teklif kaydı bulunmuyor.</p>
            ) : (
              recentOffers.map((offer) => <OfferRow key={offer.id} offer={offer} />)
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
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
            <StatTile icon={ClipboardList} label="Pasif" value={companies.filter((c) => c.contract === "Pasif").length} />
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

function ScreeningRow({ company }: { company: Company }) {
  return (
    <div className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <Link className="flex min-w-0 items-center gap-3" href={`/firmalar/${company.id}`}>
        <Avatar text={initials(company.name)} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">{company.name}</span>
          <span className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
            <MapPin className="size-3" />
            {companyLocation(company) || "—"}
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 text-xs font-semibold text-foreground">
            <Clock3 className="size-3.5" />
            {company.lastScreening}
          </p>
          <p className="mt-1 text-[10px] text-subtle">{company.screenings} tarama</p>
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
      href="/teklifler"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{offer.title}</p>
        <p className="mt-1 text-[11px] text-subtle">
          {offer.number} · {offer.company}
        </p>
      </div>
      <div className="flex items-center gap-3 sm:shrink-0">
        <span className="text-sm font-semibold text-foreground">{money(offer.total)}</span>
        <Badge tone={offerTone[offer.status]}>{offer.status}</Badge>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <Page className="animate-pulse">
      <div className="h-8 w-64 rounded bg-card-muted" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="h-24 rounded-2xl bg-card-muted" key={i} />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="h-64 rounded-2xl bg-card-muted" />
        <div className="h-64 rounded-2xl bg-card-muted" />
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
