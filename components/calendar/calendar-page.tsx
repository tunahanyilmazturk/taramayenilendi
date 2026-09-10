"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, IconBadge } from "@/components/ui/card";
import { Page } from "@/components/ui/page-header";
import { useScreenings } from "@/lib/data";
import { labelToIso } from "@/lib/format";
import type { Screening, ScreeningStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const monthNames = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat("tr-TR", { month: "long" }).format(new Date(2024, month, 1)),
);
type CalendarView = "month" | "week" | "year";
const statusTone: Record<ScreeningStatus, "brand" | "warning" | "danger" | "neutral" | "info" | "success"> = {
  Planlandı: "info",
  Hazırlanıyor: "warning",
  "Devam ediyor": "brand",
  Tamamlandı: "success",
  İptal: "danger",
};
const statusDot: Record<ScreeningStatus, string> = {
  Planlandı: "bg-info",
  Hazırlanıyor: "bg-warning",
  "Devam ediyor": "bg-info",
  Tamamlandı: "bg-success",
  İptal: "bg-danger",
};
const statusSurface: Record<ScreeningStatus, string> = {
  Planlandı: "border-info/40 bg-info-soft text-info",
  Hazırlanıyor: "border-warning/40 bg-warning-soft text-warning",
  "Devam ediyor": "border-brand/40 bg-brand-soft text-brand-soft-fg",
  Tamamlandı: "border-success-border bg-success-soft text-success",
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

function weekLabel(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startLabel = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(start);
  const endLabel = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(end);
  return `${startLabel} - ${endLabel}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function screeningsForDay(screenings: Screening[], key: string) {
  return screenings
    .filter((screening) => {
      const start = toIso(screening.date);
      const end = toIso(screening.endDate || screening.date);
      return start && end && key >= start && key <= end;
    })
    .sort((first, second) => first.time.localeCompare(second.time, "tr"));
}

function isUpcomingOperationalScreening(screening: Screening) {
  return screening.status !== "Tamamlandı" && screening.status !== "İptal";
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

function startOfWeek(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function weekCells(date: Date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => {
    const cell = new Date(start);
    cell.setDate(start.getDate() + index);
    return cell;
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
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [view, setView] = useState<CalendarView>("month");
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
  const weekViewCells = useMemo(() => weekCells(new Date(`${selectedKey}T12:00:00`)), [selectedKey]);
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
            Boolean(item.date) && toIso(item.screening.date) >= todayKey && isUpcomingOperationalScreening(item.screening),
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

  const weekScreenings = visibleScreenings.filter((screening) => {
    const start = toIso(screening.date);
    const end = toIso(screening.endDate || screening.date);
    const weekStart = dateKey(weekViewCells[0]);
    const weekEnd = dateKey(weekViewCells[weekViewCells.length - 1]);
    return start && end && start <= weekEnd && end >= weekStart;
  });

  const yearScreenings = visibleScreenings.filter((screening) => {
    const start = toIso(screening.date);
    const end = toIso(screening.endDate || screening.date);
    const yearStart = `${month.getFullYear()}-01-01`;
    const yearEnd = `${month.getFullYear()}-12-31`;
    return start && end && start <= yearEnd && end >= yearStart;
  });

  const moveMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelectedKey(dateKey(next));
  };

  const setCalendarDate = (year: number, monthIndex: number) => {
    const next = new Date(year, monthIndex, 1);
    setMonth(next);
    setSelectedKey(dateKey(next));
  };

  const moveView = (offset: number) => {
    if (view === "week") {
      const next = new Date(`${selectedKey}T12:00:00`);
      next.setDate(next.getDate() + offset * 7);
      setSelectedKey(dateKey(next));
      setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
      return;
    }
    if (view === "year") {
      setMonth(new Date(month.getFullYear() + offset, month.getMonth(), 1));
      setSelectedKey(dateKey(new Date(month.getFullYear() + offset, month.getMonth(), 1)));
      return;
    }
    moveMonth(offset);
  };

  const viewTitle =
    view === "week"
      ? weekLabel(new Date(`${selectedKey}T12:00:00`))
      : view === "year"
        ? `${month.getFullYear()} yılı`
        : monthLabel(month);
  const viewDescription =
    view === "week"
      ? `${weekScreenings.length} tarama planı · Haftalık saha planınızı görüntüleyin.`
      : view === "year"
        ? `${yearScreenings.length} tarama planı · Yıllık operasyon yoğunluğunu inceleyin.`
        : `${monthScreenings.length} tarama planı · Günlük saha planınızı seçerek detayları görüntüleyin.`;

  return (
    <Page className="pt-1 xl:h-[calc(100dvh-118px)] xl:overflow-hidden xl:pb-0">
      <div className="grid gap-4 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="border-border/80 bg-card shadow-card flex min-h-0 flex-col overflow-hidden p-4 sm:p-5">
          <div className="border-brand-outline/35 bg-brand-soft/30 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 sm:p-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <IconBadge className="bg-brand text-brand-fg shadow-sm" icon={CalendarDays} size="md" />
              <div>
                <h2 className="text-heading text-sm font-bold capitalize sm:text-base">{viewTitle}</h2>
                <p className="text-muted mt-0.5 truncate text-[10px] sm:text-[11px]">{viewDescription}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1">
              <div className="border-border bg-card/80 flex items-center gap-0.5 rounded-lg border p-0.5">
                <div className="relative">
                  <select
                    aria-label="Takvim ayı"
                    className="border-border bg-card text-foreground focus:border-brand h-8 w-24 appearance-none rounded-lg border px-2 pr-6 text-[11px] font-medium capitalize outline-none"
                    onChange={(event) => setCalendarDate(month.getFullYear(), Number(event.target.value))}
                    value={month.getMonth()}
                  >
                    {monthNames.map((name, index) => (
                      <option key={name} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="text-subtle pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2" />
                </div>
                <div className="relative">
                  <select
                    aria-label="Takvim yılı"
                    className="border-border bg-card text-foreground focus:border-brand h-8 w-20 appearance-none rounded-lg border px-2 pr-6 text-[11px] font-medium outline-none"
                    onChange={(event) => setCalendarDate(Number(event.target.value), month.getMonth())}
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
              </div>
              <div
                className="border-border bg-card/80 flex items-center gap-0.5 rounded-lg border p-0.5"
                role="tablist"
                aria-label="Takvim görünümü"
              >
                {(
                  [
                    ["month", "Ay"],
                    ["week", "Hafta"],
                    ["year", "Yıl"],
                  ] as Array<[CalendarView, string]>
                ).map(([value, label]) => (
                  <Button
                    aria-selected={view === value}
                    className={cn("h-8 px-2.5 text-[11px]", view === value && "bg-brand text-brand-fg hover:bg-brand")}
                    key={value}
                    onClick={() => setView(value)}
                    role="tab"
                    size="xs"
                    variant={view === value ? "primary" : "ghost"}
                  >
                    {label}
                  </Button>
                ))}
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
              <Button aria-label="Önceki dönem" onClick={() => moveView(-1)} size="icon-sm" variant="outline">
                <ChevronLeft />
              </Button>
              <Button aria-label="Sonraki dönem" onClick={() => moveView(1)} size="icon-sm" variant="outline">
                <ChevronRight />
              </Button>
            </div>
          </div>

          <div className="border-border bg-card-muted/35 mt-4 flex flex-wrap items-center gap-2 rounded-xl border p-2.5">
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

          {view === "month" && (
            <div className="border-border bg-border mt-4 grid min-h-0 flex-1 grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] gap-px overflow-hidden rounded-xl border shadow-inner">
              {weekDays.map((day) => (
                <div
                  className="bg-card-muted text-muted px-2 py-2.5 text-center text-[10px] font-bold tracking-wide uppercase"
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
                      "bg-card hover:bg-brand-soft/35 min-h-0 overflow-hidden p-1.5 text-left align-top transition-colors sm:p-2",
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
          )}

          {view === "week" && (
            <div className="border-border bg-border mt-4 grid min-h-0 flex-1 grid-cols-1 gap-px overflow-hidden rounded-xl border shadow-inner md:grid-cols-7">
              {weekViewCells.map((date, index) => {
                const key = dateKey(date);
                const dayScreenings = screeningsForDay(visibleScreenings, key);
                const selected = key === selectedKey;
                return (
                  <div
                    className={cn(
                      "bg-card min-h-36 overflow-y-auto p-3",
                      selected && "ring-brand relative z-10 ring-2 ring-inset",
                    )}
                    key={key}
                  >
                    <button
                      className="flex w-full items-center justify-between gap-2 text-left"
                      onClick={() => setSelectedKey(key)}
                      type="button"
                    >
                      <span className="text-muted text-[10px] font-bold uppercase">{weekDays[index]}</span>
                      <span
                        className={cn(
                          "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold",
                          key === todayKey && "bg-brand text-brand-fg",
                          selected && key !== todayKey && "bg-brand-soft text-brand-soft-fg",
                        )}
                      >
                        {date.getDate()}
                      </span>
                    </button>
                    <div className="mt-3 space-y-2">
                      {dayScreenings.length ? (
                        dayScreenings.map((screening) => (
                          <Link
                            className={cn(
                              "block truncate rounded-md border px-2 py-2 text-[10px] font-semibold",
                              statusSurface[screening.status],
                            )}
                            href={`/taramalar/${screening.id}`}
                            key={screening.id}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {screening.time} · {screening.company}
                          </Link>
                        ))
                      ) : (
                        <p className="text-subtle text-[10px]">Plan yok</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === "year" && (
            <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {monthNames.map((name, monthIndex) => {
                const monthDate = new Date(month.getFullYear(), monthIndex, 1);
                const start = dateKey(monthDate);
                const end = dateKey(new Date(month.getFullYear(), monthIndex + 1, 0));
                const count = visibleScreenings.filter((screening) => {
                  const screeningStart = toIso(screening.date);
                  const screeningEnd = toIso(screening.endDate || screening.date);
                  return screeningStart && screeningEnd && screeningStart <= end && screeningEnd >= start;
                }).length;
                return (
                  <button
                    className="border-border bg-card hover:border-brand-outline hover:bg-brand-soft/20 rounded-xl border p-4 text-left transition-colors"
                    key={name}
                    onClick={() => {
                      setCalendarDate(month.getFullYear(), monthIndex);
                      setView("month");
                    }}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-heading text-sm font-bold capitalize">{name}</span>
                      <Badge tone={count ? "info" : "neutral"}>{count} tarama</Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                      {weekDays.map((day) => (
                        <span className="text-subtle text-[8px] font-bold" key={day}>
                          {day.slice(0, 1)}
                        </span>
                      ))}
                      {dayCells(monthDate).map((date) => {
                        const dayKey = dateKey(date);
                        const dayCount = screeningsForDay(visibleScreenings, dayKey).length;
                        return (
                          <span
                            className={cn(
                              "text-muted rounded px-0.5 py-1 text-[9px]",
                              date.getMonth() !== monthIndex && "opacity-30",
                              dayCount > 0 && "bg-brand-soft text-brand-soft-fg font-bold",
                            )}
                            key={dayKey}
                          >
                            {date.getDate()}
                          </span>
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <div className="min-h-0 space-y-4 overflow-y-auto pr-1 xl:sticky xl:top-4 xl:self-start">
          <Card className="border-border/80 bg-card/95 shadow-card p-4 sm:p-5">
            <CardHeader
              icon={CalendarDays}
              title="Seçili gün"
              description={formatDate(new Date(`${selectedKey}T12:00:00`))}
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-muted text-xs">Günün planları</span>
              <Badge tone="info">{selectedScreenings.length} tarama</Badge>
            </div>
            <Button
              className="mt-3 w-full"
              onClick={() => router.push(`/taramalar/yeni?tarih=${selectedKey}`)}
              size="sm"
              variant="soft"
            >
              <CalendarDays /> Bu güne tarama planla
            </Button>
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
          <Card className="border-border/80 bg-card/95 shadow-card p-4 sm:p-5">
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
