"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, IconBadge } from "@/components/ui/card";
import { Page } from "@/components/ui/page-header";
import { useScreenings } from "@/lib/data";
import { labelToIso } from "@/lib/format";
import type { Screening, ScreeningStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const statusTone: Record<ScreeningStatus, "brand" | "warning" | "danger" | "neutral" | "info"> = {
  Planlandı: "info",
  Hazırlanıyor: "warning",
  "Devam ediyor": "brand",
  Tamamlandı: "info",
  İptal: "danger",
};
const statusDot: Record<ScreeningStatus, string> = {
  Planlandı: "bg-info",
  Hazırlanıyor: "bg-warning",
  "Devam ediyor": "bg-info",
  Tamamlandı: "bg-info",
  İptal: "bg-danger",
};
const statusSurface: Record<ScreeningStatus, string> = {
  Planlandı: "border-info/40 bg-info-soft text-info",
  Hazırlanıyor: "border-warning/40 bg-warning-soft text-warning",
  "Devam ediyor": "border-brand/40 bg-brand-soft text-brand-soft-fg",
  Tamamlandı: "border-info/40 bg-info-soft text-info",
  İptal: "border-danger/40 bg-danger-soft text-danger",
};

function toIso(value: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return labelToIso(value);
}

function parseDate(value: string) {
  const iso = toIso(value);
  return iso ? new Date(`${iso}T12:00:00`) : null;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function screeningsForDay(screenings: Screening[], key: string) {
  return screenings.filter((screening) => {
    const start = toIso(screening.date);
    const end = toIso(screening.endDate || screening.date);
    return start && end && key >= start && key <= end;
  });
}

function dayCells(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function ScreeningRow({ screening }: { screening: Screening }) {
  return (
    <Link
      className="border-border bg-card-muted hover:border-brand-outline group block rounded-xl border p-3 transition-colors"
      href={`/taramalar/${screening.id}`}
      rel="noreferrer"
      target="_blank"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("size-2 rounded-full", statusDot[screening.status])} />
            <p className="text-foreground truncate text-xs font-bold">{screening.title}</p>
          </div>
          <p className="text-muted mt-1 truncate pl-4 text-[11px]">{screening.company}</p>
        </div>
        <ArrowUpRight className="text-subtle group-hover:text-brand size-4 shrink-0 transition-colors" />
      </div>
      <span
        className={cn(
          "mt-2 ml-4 inline-flex rounded-full border px-2 py-1 text-[9px] font-bold",
          statusSurface[screening.status],
        )}
      >
        {screening.status}
      </span>
      <div className="text-muted mt-3 flex flex-wrap gap-x-3 gap-y-1 pl-4 text-[10px]">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="size-3" />
          {screening.time}
          {screening.endTime ? ` - ${screening.endTime}` : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3" />
          {screening.location || "Konum yok"}
        </span>
      </div>
    </Link>
  );
}

export default function CalendarPage() {
  const [screenings] = useScreenings();
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [statusFilter, setStatusFilter] = useState<"Tümü" | ScreeningStatus>("Tümü");
  const years = useMemo(() => {
    const values = new Set([
      today.getFullYear() - 1,
      today.getFullYear(),
      today.getFullYear() + 1,
      today.getFullYear() + 2,
    ]);
    screenings.forEach((screening) => {
      const start = parseDate(screening.date);
      const end = parseDate(screening.endDate || screening.date);
      if (start) values.add(start.getFullYear());
      if (end) values.add(end.getFullYear());
    });
    return Array.from(values).sort((a, b) => a - b);
  }, [screenings, today]);
  const visibleScreenings = useMemo(
    () => screenings.filter((screening) => statusFilter === "Tümü" || screening.status === statusFilter),
    [screenings, statusFilter],
  );
  const cells = useMemo(() => dayCells(month), [month]);
  const eventsByDay = useMemo(() => {
    const map = new Map<string, Screening[]>();
    cells.forEach((cell) => {
      const key = dateKey(cell);
      const dayScreenings = screeningsForDay(visibleScreenings, key);
      if (dayScreenings.length) map.set(key, dayScreenings);
    });
    return map;
  }, [cells, visibleScreenings]);
  const selectedScreenings = eventsByDay.get(selectedKey) ?? screeningsForDay(visibleScreenings, selectedKey);
  const upcoming = useMemo(
    () =>
      visibleScreenings
        .map((screening) => ({ screening, date: parseDate(screening.date) }))
        .filter(
          (item): item is { screening: Screening; date: Date } =>
            Boolean(item.date) && toIso(item.screening.date) >= todayKey,
        )
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 3),
    [visibleScreenings, todayKey],
  );
  const monthStart = dateKey(new Date(month.getFullYear(), month.getMonth(), 1));
  const monthEnd = dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const monthScreenings = visibleScreenings.filter((screening) => {
    const start = toIso(screening.date);
    const end = toIso(screening.endDate || screening.date);
    return start && end && start <= monthEnd && end >= monthStart;
  });

  const moveMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelectedKey(dateKey(next));
  };

  return (
    <Page className="pt-1 xl:h-[calc(100dvh-118px)] xl:overflow-hidden xl:pb-0">
      <div className="grid gap-4 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="flex min-h-0 flex-col overflow-hidden border-border/80 bg-card/95 p-4 shadow-card sm:p-5">
          <div className="border-divider flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <IconBadge className="bg-brand-soft text-brand-soft-fg" icon={CalendarDays} size="lg" />
              <div>
                <h2 className="text-heading text-base font-bold capitalize">{monthLabel(month)}</h2>
                <p className="text-muted mt-0.5 text-[11px]">
                  {monthScreenings.length} tarama planı · Günlük saha planınızı seçerek detayları görüntüleyin.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <select
                  aria-label="Takvim yılı"
                  className="border-border bg-card text-foreground focus:border-brand h-9 w-24 appearance-none rounded-lg border px-3 pr-7 text-xs font-medium outline-none"
                  onChange={(event) => {
                    const next = new Date(Number(event.target.value), month.getMonth(), 1);
                    setMonth(next);
                    setSelectedKey(dateKey(next));
                  }}
                  value={month.getFullYear()}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-subtle pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2" />
              </div>
              <Button
                onClick={() => {
                  setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelectedKey(todayKey);
                }}
                size="xs"
                variant="outline"
              >
                Bugün
              </Button>
              <Button aria-label="Önceki ay" onClick={() => moveMonth(-1)} size="icon-sm" variant="outline">
                <ChevronLeft />
              </Button>
              <Button aria-label="Sonraki ay" onClick={() => moveMonth(1)} size="icon-sm" variant="outline">
                <ChevronRight />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-subtle mr-1 text-[10px] font-bold tracking-[0.12em] uppercase">Durum</span>
            {(["Tümü", ...Object.keys(statusTone)] as Array<"Tümü" | ScreeningStatus>).map((item) => (
              <Button
                aria-pressed={statusFilter === item}
                className={cn(
                  statusFilter === item && item === "Tümü" && "border-brand-outline bg-brand-soft text-brand-soft-fg",
                  item !== "Tümü" && statusSurface[item],
                )}
                key={item}
                onClick={() => setStatusFilter(item)}
                size="xs"
                variant={statusFilter === item ? "soft" : "outline"}
              >
                {item}
              </Button>
            ))}
            <span className="text-muted ml-auto text-[10px]">{visibleScreenings.length} kayıt gösteriliyor</span>
          </div>

          <div className="border-border bg-border mt-4 grid min-h-0 flex-1 grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] gap-px overflow-hidden rounded-xl border">
            {weekDays.map((day) => (
              <div
                className="bg-card-muted text-muted px-2 py-2.5 text-center text-[10px] font-bold uppercase"
                key={day}
              >
                {day}
              </div>
            ))}
            {cells.map((date) => {
              const key = dateKey(date);
              const dayScreenings = eventsByDay.get(key) ?? [];
              const inMonth = date.getMonth() === month.getMonth();
              const selected = key === selectedKey;
              return (
                <div
                  className={cn(
                    "bg-card hover:bg-brand-soft/40 min-h-0 overflow-hidden p-1.5 text-left align-top transition-colors sm:p-2",
                    !inMonth && "bg-card-muted/55 text-subtle",
                    selected && "ring-brand relative z-10 ring-2 ring-inset",
                  )}
                  key={key}
                >
                  <button
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                      key === todayKey && "bg-brand text-brand-fg",
                      selected && key !== todayKey && "bg-brand-soft text-brand-soft-fg",
                    )}
                    onClick={() => setSelectedKey(key)}
                    type="button"
                  >
                    {date.getDate()}
                  </button>
                  <span className="mt-2 block space-y-1">
                    {dayScreenings.slice(0, 2).map((screening) => (
                      <Link
                        className={cn(
                          "flex items-center gap-1.5 truncate rounded-md border px-1.5 py-1 text-[9px] font-semibold",
                          statusSurface[screening.status],
                        )}
                        href={`/taramalar/${screening.id}`}
                        key={screening.id}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <span className={cn("size-1.5 shrink-0 rounded-full", statusDot[screening.status])} />
                        {screening.time} · {screening.company}
                      </Link>
                    ))}
                    {dayScreenings.length > 2 && (
                      <span className="text-brand block px-1 text-[9px] font-bold">
                        +{dayScreenings.length - 2} tarama
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
          <Card className="border-border/80 bg-card/95 p-4 shadow-card sm:p-5">
            <CardHeader
              icon={CalendarDays}
              title="Seçili gün"
              description={formatDate(new Date(`${selectedKey}T12:00:00`))}
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-muted text-xs">Günün planları</span>
              <Badge tone="info">{selectedScreenings.length} tarama</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {selectedScreenings.length ? (
                selectedScreenings.map((screening) => <ScreeningRow key={screening.id} screening={screening} />)
              ) : (
                <div className="bg-card-muted text-muted rounded-xl p-5 text-center text-xs">
                  Bu gün için planlanmış tarama bulunmuyor.
                </div>
              )}
            </div>
          </Card>
          <Card className="border-border/80 bg-card/95 p-4 shadow-card sm:p-5">
            <CardHeader icon={Clock3} title="Yaklaşan taramalar" description="En yakın saha operasyonları" />
            <div className="mt-3 space-y-2">
              {upcoming.length ? (
                upcoming.map(({ screening, date }) => (
                  <Link
                    className="border-border hover:border-brand-outline flex items-center gap-3 rounded-xl border p-3 transition-colors"
                    href={`/taramalar/${screening.id}`}
                    key={screening.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div className="bg-brand-soft text-brand-soft-fg flex size-10 shrink-0 flex-col items-center justify-center rounded-lg">
                      <span className="text-[9px] font-bold uppercase">
                        {new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(date)}
                      </span>
                      <span className="text-sm font-bold">{date.getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-xs font-bold">{screening.company}</p>
                      <p className="text-muted mt-1 truncate text-[10px]">
                        {screening.time} · {screening.title}
                      </p>
                    </div>
                    <Badge tone={statusTone[screening.status]}>{screening.status}</Badge>
                  </Link>
                ))
              ) : (
                <p className="text-muted bg-card-muted rounded-xl p-4 text-center text-xs">Yaklaşan tarama yok.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
