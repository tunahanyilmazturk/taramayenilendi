"use client";

import { ArrowLeft, ClipboardCheck, FileSearch, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, IconBadge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { Alert } from "@/components/ui/modal";
import { Page, PageHeader } from "@/components/ui/page-header";
import { useCompanies, usePersonnel, useResultCounts, useScreenings } from "@/lib/data";
import { useCan } from "@/lib/hooks";
import { includesQuery } from "@/lib/utils";

type ResultFilter = "Tümü" | "Sonuç bekliyor" | "Sonuç yüklendi";

export default function ResultsDetailPage({ screeningId }: { screeningId: string }) {
  const [screenings] = useScreenings();
  const [personnel] = usePersonnel();
  const [resultCounts] = useResultCounts();
  const [companies] = useCompanies();
  const can = useCan();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResultFilter>("Tümü");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const screening = screenings.find((item) => String(item.id) === screeningId);
  const company = screening ? companies.find((item) => item.id === screening.companyId) : undefined;
  const resultCount = screening ? Math.min(screening.participants, resultCounts[String(screening.id)] ?? 0) : 0;
  const resultProgress = screening?.participants ? Math.round((resultCount / screening.participants) * 100) : 0;

  const participants = useMemo(() => {
    if (!screening) return [];
    return personnel
      .filter((person) => person.companyId === screening.companyId)
      .filter((person) => includesQuery(`${person.name} ${person.employeeNo} ${person.department}`, query))
      .filter((person) => statusFilter === "Tümü" || statusFilter === "Sonuç bekliyor");
  }, [personnel, query, screening, statusFilter]);
  const selectedPerson = participants.find((person) => person.id === selectedId) ?? participants[0];

  if (!can("results.list")) {
    return <Page><Alert tone="danger">Bu sonuç detayını görüntüleme yetkiniz yok.</Alert></Page>;
  }

  if (!screening) {
    return <Page><EmptyState description="Sonuç detayına dönmek için sonuç listesine gidin." icon={FileSearch} title="Tarama bulunamadı" action={<Button asChild variant="secondary"><Link href="/sonuclar"><ArrowLeft /> Sonuçlara dön</Link></Button>} /></Page>;
  }

  return (
    <Page>
      <PageHeader
        compact
        eyebrow="Sonuç detayları"
        title={screening.title}
        description={`${screening.company} · ${screening.date} · ${screening.location || "Konum belirtilmedi"}`}
        actions={<Button asChild variant="secondary"><Link href="/sonuclar"><ArrowLeft /> Sonuçlara dön</Link></Button>}
      />

      <Card className="mt-4 border-brand-outline/35 bg-brand-soft/20 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconBadge icon={ClipboardCheck} size="md" />
            <div><h2 className="text-sm font-semibold text-heading">Tarama sonuç çalışma alanı</h2><p className="mt-1 text-xs text-muted">Katılımcıyı seçin, sonuç durumunu ve kayıt alanını buradan yönetin.</p></div>
          </div>
          <Badge tone={screening.status === "Tamamlandı" ? "success" : "info"}>{screening.status}</Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
          <label className="relative block"><span className="sr-only">Personel ara</span><Search className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" /><Input className="pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="Personel, sicil veya departman ara..." value={query} /></label>
          <Select aria-label="Sonuç durumu filtresi" onChange={(event) => setStatusFilter(event.target.value as ResultFilter)} value={statusFilter}><option>Tümü</option><option>Sonuç bekliyor</option><option>Sonuç yüklendi</option></Select>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
        <Card className="p-4 sm:p-5">
          <CardHeader icon={UserRound} title="Katılımcı personeller" description={`${participants.length} personel listeleniyor · ${company?.name ?? screening.company}`} action={<Badge tone="info">Sonuç kaydı</Badge>} />
          <div className="mt-4 space-y-2">
            {participants.length === 0 ? <EmptyState className="py-8" description="Arama veya filtreyi değiştirerek tekrar deneyin." icon={Search} title="Personel bulunamadı" /> : participants.map((person) => (
              <button className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selectedPerson?.id === person.id ? "border-brand bg-brand-soft/60" : "border-border hover:bg-card-muted"}`} key={person.id} onClick={() => setSelectedId(person.id)} type="button">
                <span className="bg-card-muted text-brand flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">{person.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-heading">{person.name}</strong><span className="mt-0.5 block truncate text-xs text-muted">{person.employeeNo} · {person.department || "Departman belirtilmedi"}</span></span>
                <Badge tone={person.status === "Aktif" ? "success" : "warning"}>{person.status}</Badge>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          {!selectedPerson ? <EmptyState className="py-14" description="Sonuç alanını görüntülemek için soldan bir personel seçin." icon={UserRound} title="Personel seçilmedi" /> : <>
            <CardHeader icon={ClipboardCheck} title={selectedPerson.name} description={`${selectedPerson.employeeNo} · ${selectedPerson.title || "Görev belirtilmedi"}`} action={<Badge tone={resultProgress === 100 ? "success" : "warning"}>{resultCount} / {screening.participants} sonuç</Badge>} />
            <Alert className="mt-5" tone="brand">Bu personel için henüz bireysel sonuç kaydı bulunmuyor. Sonuç yükleme ve düzenleme alanı bir sonraki adımda eklenecek.</Alert>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailField label="Firma" value={screening.company} />
              <DetailField label="Tarama tarihi" value={screening.date} />
              <DetailField label="Test kapsamı" value={`${screening.testLines?.length ?? screening.testIds?.length ?? 0} test`} />
              <DetailField label="Yüklenen sonuç" value={`${resultCount} / ${screening.participants} kişi · %${resultProgress}`} />
            </div>
          </>}
        </Card>
      </div>
    </Page>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-card-muted/55 p-3"><p className="text-[10px] font-semibold tracking-wide text-subtle uppercase">{label}</p><p className="mt-1.5 text-sm font-medium text-heading">{value}</p></div>;
}
