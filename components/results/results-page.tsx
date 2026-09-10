"use client";

import { Download, Eye, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { Alert } from "@/components/ui/modal";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Page, PageHeader } from "@/components/ui/page-header";
import { Pagination, paginate } from "@/components/ui/pagination";
import { SearchableCompanySelect } from "@/components/ui/searchable-company-select";
import { useCompanies, useResultCounts, useScreenings } from "@/lib/data";
import { labelToIso, todayIso } from "@/lib/format";
import { useCan, useNotice } from "@/lib/hooks";
import { exportListToExcel } from "@/lib/excel";
import { includesQuery } from "@/lib/utils";

type ResultStatus = "Sonuç bekliyor" | "Raporlamaya hazır" | "Saha devam ediyor";

const statusTone: Record<ResultStatus, "warning" | "success" | "info"> = {
  "Sonuç bekliyor": "warning",
  "Raporlamaya hazır": "success",
  "Saha devam ediyor": "info",
};

function resultStatus(screening: { status: string; resultCount: number; participants: number }): ResultStatus {
  if (screening.resultCount >= screening.participants && screening.participants > 0) return "Raporlamaya hazır";
  if (screening.status === "Tamamlandı") return "Sonuç bekliyor";
  return "Saha devam ediyor";
}

export default function ResultsPage() {
  const [screenings] = useScreenings();
  const [resultCounts] = useResultCounts();
  const [companies] = useCompanies();
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState<number | string>("Tümü");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [notice, showNotice] = useNotice();
  const can = useCan();
  const rows = useMemo(
    () => screenings.map((screening) => ({
      ...screening,
      resultCount: Math.min(screening.participants, resultCounts[String(screening.id)] ?? 0),
      resultStatus: resultStatus({ ...screening, resultCount: Math.min(screening.participants, resultCounts[String(screening.id)] ?? 0) }),
      testCount: screening.testLines?.length ?? screening.testIds?.length ?? 0,
    })),
    [resultCounts, screenings],
  );
  const filtered = useMemo(
    () => rows.filter((row) =>
      (companyFilter === "Tümü" || row.companyId === Number(companyFilter)) &&
      (statusFilter === "Tümü" || row.resultStatus === statusFilter) &&
      (!dateFrom || labelToIso(row.date) >= dateFrom) &&
      (!dateTo || labelToIso(row.date) <= dateTo) &&
      includesQuery(`${row.title} ${row.company} ${row.location}`, query),
    ),
    [companyFilter, dateFrom, dateTo, query, rows, statusFilter],
  );
  const { safePage, items: paged } = paginate(filtered, page, pageSize);
  const pendingCount = rows.filter((row) => row.resultStatus === "Sonuç bekliyor").length;

  const exportResults = () => {
    if (!can("results.export")) return showNotice("Sonuç Excel aktarımı için yetkiniz yok.");
    void exportListToExcel({
      filename: `sonuclar-${todayIso()}.xlsx`,
      items: filtered,
      sheetName: "Sonuç durumu",
      title: "Tarama sonuç durumu",
      context: [["Arama", query || "Tümü"], ["Durum", statusFilter], ["Başlangıç", dateFrom || "Tümü"], ["Bitiş", dateTo || "Tümü"]],
      columns: [
        { header: "Tarama", width: 32, value: (item) => item.title },
        { header: "Firma", width: 28, value: (item) => item.company },
        { header: "Tarih", width: 15, value: (item) => item.date },
        { header: "Test sayısı", width: 14, value: (item) => item.testCount },
        { header: "Katılımcı", width: 14, value: (item) => item.participants },
        { header: "Yüklenen sonuç", width: 18, value: (item) => item.resultCount },
        { header: "Sonuç durumu", width: 22, value: (item) => item.resultStatus },
      ],
    }).catch(() => showNotice("Sonuç Excel çıktısı hazırlanamadı."));
  };

  return (
    <Page>
      <Card className="border-brand-outline/35 bg-brand-soft/25 p-5 sm:p-6">
        <PageHeader
          compact
          className="min-h-0 p-0 before:hidden"
          eyebrow="Sonuç merkezi"
          title="Tarama sonuçları"
          description="Tamamlanan taramaların sonuç teslim ve raporlama durumunu tek listeden takip edin."
          actions={can("results.export") ? <Button onClick={exportResults} variant="secondary"><Download /> Excel&apos;e aktar</Button> : undefined}
        />
      </Card>
      <div className="mt-5 space-y-5">
        {notice && <Alert tone="brand">{notice}</Alert>}
      <ListToolbar
        advancedOpen={advancedOpen}
        count={filtered.length}
        description="Tarama, firma, tarih ve sonuç durumuna göre daraltın."
        onAdvanced={() => setAdvancedOpen((value) => !value)}
        onCards={() => undefined}
        onList={() => undefined}
        onQuery={(value) => { setQuery(value); setPage(1); }}
        placeholder="Tarama, firma veya konum ara..."
        query={query}
        title="Sonuç listesi"
        view="list"
        className="mt-0"
        light
      >
        <SearchableCompanySelect companies={companies} includeAll onChange={(value) => { setCompanyFilter(value ?? "Tümü"); setPage(1); }} value={companyFilter} />
        <Select aria-label="Sonuç durumu filtresi" onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} value={statusFilter}>
          <option>Tümü</option><option>Sonuç bekliyor</option><option>Raporlamaya hazır</option><option>Saha devam ediyor</option>
        </Select>
        <Input aria-label="Sonuç başlangıç tarihi" onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} type="date" value={dateFrom} />
        <Input aria-label="Sonuç bitiş tarihi" onChange={(event) => { setDateTo(event.target.value); setPage(1); }} type="date" value={dateTo} />
      </ListToolbar>
      {filtered.length === 0 ? <EmptyState className="mt-6" description="Filtreleri değiştirerek tekrar deneyin." icon={Search} title="Sonuç kaydı bulunamadı" /> : (
        <Card className="mt-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-divider bg-card-muted"><tr><th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Tarama</th><th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Firma</th><th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Tarih</th><th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-muted">İlerleme</th><th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Durum</th><th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted">İşlem</th></tr></thead>
              <tbody className="divide-y divide-divider">{paged.map((row) => <tr className="transition-colors hover:bg-card-muted/70" key={row.id}><td className="px-5 py-5"><p className="font-semibold text-foreground">{row.title}</p><p className="mt-1.5 text-[11px] text-muted">{row.testCount} test · {row.location || "Konum belirtilmedi"}</p></td><td className="px-5 py-5 text-muted">{row.company}</td><td className="px-5 py-5 text-muted">{row.date}</td><td className="px-5 py-5"><div className="min-w-28"><div className="flex items-center justify-between gap-2 text-[11px] text-muted"><span>{row.resultCount} / {row.participants}</span><span>{row.participants ? Math.round((row.resultCount / row.participants) * 100) : 0}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-divider"><div className="h-full rounded-full bg-brand" style={{ width: `${row.participants ? Math.min(100, Math.round((row.resultCount / row.participants) * 100)) : 0}%` }} /></div></div></td><td className="px-5 py-5"><Badge tone={statusTone[row.resultStatus]}>{row.resultStatus}</Badge></td><td className="px-5 py-5 text-right"><Button asChild aria-label={`${row.title} detaylarını gör`} size="icon-sm" variant="ghost"><Link href={`/sonuclar/${row.id}`}><Eye /></Link></Button></td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}
      <Pagination noun="sonuç" onPage={setPage} onPageSize={(value) => { setPageSize(value); setPage(1); }} page={safePage} pageSize={pageSize} total={filtered.length} />
      {pendingCount > 0 && <p className="text-xs text-muted">{pendingCount} tarama sonuç teslimi veya raporlama adımı bekliyor.</p>}
      </div>
    </Page>
  );
}
