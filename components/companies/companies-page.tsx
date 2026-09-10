"use client";

import { Building2, ClipboardList, Download, MapPin, Plus, RotateCcw, Settings2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CompanyCard, CompanyRowActions, type CompanyActions } from "@/components/companies/company-card";
import { applyCompanyForm, CompanyForm, type CompanyFormValues } from "@/components/companies/company-form";
import { SectorManager } from "@/components/companies/sector-manager";
import { Badge, contractTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/field";
import { Alert, ConfirmDialog } from "@/components/ui/modal";
import { Page, PageHeader } from "@/components/ui/page-header";
import { VisualFilterSurface } from "@/components/ui/visual-filter-surface";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { paginate, Pagination } from "@/components/ui/pagination";
import { Avatar, DataTable, SortButton, TBody, Td, Th, THead, Tr, type SortDirection } from "@/components/ui/table";
import { useCompanies, useOffers, usePersonnel, useScreenings, useSectors } from "@/lib/data";
import { companyLocation, contractStatuses, type Company } from "@/lib/demo-data";
import { labelToIso, todayIso } from "@/lib/format";
import { useCan, useConfirm, useNotice, useSort } from "@/lib/hooks";
import { exportListToExcel } from "@/lib/excel";
import { compareTr, includesQuery, initials } from "@/lib/utils";

type SortKey = "name" | "employees" | "contract" | "lastScreening";
type View = "table" | "cards";

const allCities = "Tüm şehirler";
const allSectors = "Tüm sektörler";
const allStatuses = "Tümü";
const statusFilters = [allStatuses, ...contractStatuses];

const sortValue = (company: Company, key: SortKey) => {
  if (key === "lastScreening") return labelToIso(company.lastScreening);
  return company[key];
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useCompanies();
  const [personnel] = usePersonnel();
  const [screenings, setScreenings] = useScreenings();
  const [offers, setOffers] = useOffers();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sectors, setSectors] = useSectors();
  const [notice, showNotice] = useNotice();
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();
  const can = useCan();
  const { sortKey, direction, toggle } = useSort<SortKey>("name");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(allStatuses);
  const [city, setCity] = useState(allCities);
  const [sector, setSector] = useState(allSectors);
  const [view, setView] = useState<View>("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [sectorOpen, setSectorOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const cities = useMemo(
    () => [allCities, ...new Set(companies.map((company) => company.city).filter(Boolean))],
    [companies],
  );
  const sectorOptions = useMemo(
    () => [allSectors, ...new Set([...sectors, ...companies.map((company) => company.sector)].filter(Boolean))],
    [companies, sectors],
  );
  const filtered = useMemo(
    () =>
      companies
        .filter(
          (company) =>
            (status === allStatuses || company.contract === status) &&
            (city === allCities || company.city === city) &&
            (sector === allSectors || company.sector === sector) &&
            includesQuery(
              `${company.name} ${company.sector} ${companyLocation(company)} ${company.contact}`,
              query,
            ),
        )
        .sort((a, b) => {
          const comparison = compareTr(sortValue(a, sortKey), sortValue(b, sortKey));
          return direction === "asc" ? comparison : -comparison;
        }),
    [companies, query, status, city, sector, sortKey, direction],
  );
  const { safePage, items: paged } = paginate(filtered, page, pageSize);
  const hasFilters = Boolean(query || status !== allStatuses || city !== allCities || sector !== allSectors);

  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };
  const clearFilters = () => {
    setQuery("");
    setStatus(allStatuses);
    setCity(allCities);
    setSector(allSectors);
    setPage(1);
  };
  const openNew = () => {
    if (!can("companies.write")) return showNotice("Firma oluşturma yetkiniz yok.");
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (company: Company) => {
    if (!can("companies.write")) return showNotice("Firma düzenleme yetkiniz yok.");
    setEditing(company);
    setFormOpen(true);
  };
  const saveCompany = (values: CompanyFormValues) => {
    setCompanies(applyCompanyForm(companies, values, editing?.id ?? null));
    if (editing && editing.name !== values.name.trim()) {
      setScreenings((current) => current.map((item) => item.companyId === editing.id ? { ...item, company: values.name.trim() } : item));
      setOffers((current) => current.map((item) => item.companyId === editing.id ? { ...item, company: values.name.trim() } : item));
    }
    setFormOpen(false);
    showNotice(editing ? "Firma bilgileri güncellendi." : "Yeni firma eklendi.");
  };
  const relatedCounts = (companyId: number) => ({
    personnel: personnel.filter((item) => item.companyId === companyId).length,
    screenings: screenings.filter((item) => item.companyId === companyId).length,
    offers: offers.filter((item) => item.companyId === companyId).length,
  });
  const relationSummary = (companyId: number) => {
    const counts = relatedCounts(companyId);
    return [
      counts.personnel > 0 && `${counts.personnel} personel`,
      counts.screenings > 0 && `${counts.screenings} tarama`,
      counts.offers > 0 && `${counts.offers} teklif`,
    ].filter(Boolean).join(", ");
  };
  const removeCompany = (company: Company) => {
    if (!can("companies.delete")) return showNotice("Firma silme yetkiniz yok.");
    const summary = relationSummary(company.id);
    if (summary) {
      showNotice(`${company.name} silinemedi: bağlı ${summary} bulunuyor. Kayıt geçmişini korumak için firmayı düzenleyerek Pasif yapın.`);
      return;
    }
    confirm({ title: "Firmayı sil", description: `${company.name} firması kalıcı olarak silinecek.`, onConfirm: () => {
      setCompanies((current) => current.filter((item) => item.id !== company.id));
      setSelectedIds((current) => current.filter((id) => id !== company.id));
      showNotice(`${company.name} silindi.`);
    }});
  };
  const toggleSelected = (id: number) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };
  const togglePageSelection = () => {
    const pageIds = paged.map((company) => company.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => allSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])));
  };
  const removeSelected = () => {
    if (!selectedIds.length) return;
    const blocked = companies
      .filter((company) => selectedIds.includes(company.id))
      .map((company) => ({ company, summary: relationSummary(company.id) }))
      .filter((item) => item.summary);
    if (blocked.length > 0) {
      showNotice(`Toplu silme durduruldu: ${blocked.map((item) => `${item.company.name} (${item.summary})`).join(", ")}. Bağlı kayıtları olan firmalar silinemez.`);
      return;
    }
    const count = selectedIds.length;
    confirm({ title: "Seçilen firmaları sil", description: `${count} firma kalıcı olarak silinecek.`, confirmLabel: "Firmaları sil", onConfirm: () => {
      setCompanies((current) => current.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      showNotice(`${count} firma silindi.`);
    }});
  };
  const renameSector = (from: string, to: string) => {
    setSectors(sectors.map((sector) => (sector === from ? to : sector)));
    setCompanies(companies.map((company) => (company.sector === from ? { ...company, sector: to } : company)));
  };
  const exportCompanies = () => {
    if (!can("companies.export")) return showNotice("Firma Excel aktarımı için yetkiniz yok.");
    void exportListToExcel({
      filename: `firmalar-${todayIso()}.xlsx`,
      items: filtered,
      sheetName: "Firmalar",
      title: "Firma kayıtları",
      context: [["Arama", query || "Tümü"], ["Sözleşme", status], ["Şehir", city], ["Sektör", sector]],
      columns: [
        { header: "ID", width: 10, value: (item: Company) => item.id },
        { header: "Firma", width: 28, value: (item: Company) => item.name },
        { header: "Sektör", width: 22, value: (item: Company) => item.sector },
        { header: "İl", width: 16, value: (item: Company) => item.city },
        { header: "İlçe", width: 16, value: (item: Company) => item.district },
        { header: "Yetkili", width: 22, value: (item: Company) => item.contact },
        { header: "E-posta", width: 28, value: (item: Company) => item.email },
        { header: "Telefon", width: 18, value: (item: Company) => item.phone },
        { header: "Çalışan", width: 12, value: (item: Company) => item.employees },
        { header: "Sözleşme", width: 16, value: (item: Company) => item.contract },
        { header: "Sözleşme bitiş", width: 18, value: (item: Company) => item.contractEnd || "—" },
        { header: "Son tarama", width: 18, value: (item: Company) => item.lastScreening || "—" },
        { header: "Tarama sayısı", width: 14, value: (item: Company) => item.screenings },
        { header: "Notlar", width: 32, value: (item: Company) => item.notes || "" },
      ],
    }).catch(() => showNotice("Firma Excel çıktısı hazırlanamadı."));
  };
  const actions: CompanyActions = { onEdit: openEdit, onDelete: removeCompany };

  return (
    <Page>
      <VisualFilterSurface visual="/headers/companies.png">
      <PageHeader
        compact
        className="border-0 bg-transparent p-0 shadow-none before:hidden"
        actions={
          <>
            {can("companies.export") && <Button onClick={exportCompanies} variant="secondary">
              <Download /> Excel&apos;e aktar
            </Button>}
            {can("companies.write") && <Button onClick={() => setSectorOpen(true)} variant="secondary">
              <Settings2 /> Sektör yönetimi
            </Button>}
            {can("companies.write") && <Button onClick={openNew}>
              <Plus /> Yeni firma ekle
            </Button>}
          </>
        }
        description="Hizmet verdiğiniz firmaları, sözleşmeleri ve tarama geçmişini yönetin."
        eyebrow="Müşteri ve sözleşme merkezi"
        title="Firmalar"
        dark
      />
      {notice && <Alert className="mt-4 w-fit">{notice}</Alert>}
      {selectedIds.length > 0 && (
        <Card className="mt-4 flex flex-col gap-3 border-brand/30 bg-brand-soft/40 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-foreground"><strong>{selectedIds.length}</strong> firma seçildi.</p>
          <Button onClick={removeSelected} size="sm" variant="danger"><Trash2 /> Seçilenleri sil</Button>
        </Card>
      )}

      <ListToolbar advancedOpen={advancedOpen} count={filtered.length} description="Arama ve gelişmiş filtrelerle firma kayıtlarını hızlıca daraltın." onAdvanced={() => setAdvancedOpen((value) => !value)} onCards={() => setView("cards")} onList={() => setView("table")} onQuery={(value) => { setQuery(value); setPage(1); }} placeholder="Firma adı, sektör veya yetkili ara..." query={query} title="Firma listesi" view={view}>
        <FilterSelect label="Şehir" onChange={withReset(setCity)} options={cities} value={city} />
        <FilterSelect label="Sektör" onChange={withReset(setSector)} options={sectorOptions} value={sector} />
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2"><span className="text-[10px] font-bold tracking-[0.12em] text-subtle uppercase">Sözleşme</span>{statusFilters.map((item) => <Button aria-pressed={status === item} key={item} onClick={() => withReset(setStatus)(item)} size="sm" variant={status === item ? "soft" : "outline"}>{item}</Button>)}{hasFilters && <Button onClick={clearFilters} size="sm" variant="danger"><RotateCcw /> Temizle</Button>}</div>
      </ListToolbar>
      </VisualFilterSurface>

      {view === "table" ? (
        <CompanyTable companies={paged} direction={direction} onSort={withReset(toggle)} selectedIds={selectedIds} onToggle={toggleSelected} onToggleAll={togglePageSelection} sortKey={sortKey} {...actions} />
      ) : (
        <CompanyGrid companies={paged} selectedIds={selectedIds} onToggle={toggleSelected} {...actions} />
      )}
      <Pagination
        noun="firma"
        onPage={setPage}
        onPageSize={withReset(setPageSize)}
        page={safePage}
        pageSize={pageSize}
        total={filtered.length}
      />

      <CompanyForm
        company={editing}
        onClose={() => setFormOpen(false)}
        onSave={saveCompany}
        open={formOpen}
        sectors={sectors}
      />
      <SectorManager
        onAdd={(sector) => setSectors([...sectors, sector])}
        onClose={() => setSectorOpen(false)}
        onDelete={(sector) => setSectors(sectors.filter((item) => item !== sector))}
        onRename={renameSector}
        open={sectorOpen}
        sectors={sectors}
      />
      <ConfirmDialog onClose={closeConfirm} request={confirmRequest} />
    </Page>
  );
}

function NoResults() {
  return (
    <EmptyState
      compact
      className="rounded-none border-0"
      description="Arama veya filtreleri değiştirerek tekrar deneyin."
      icon={Building2}
      title="Filtrelerle eşleşen firma bulunamadı"
    />
  );
}

function CompanyTable({
  companies,
  sortKey,
  direction,
  onSort,
  onEdit,
  onDelete,
  selectedIds,
  onToggle,
  onToggleAll,
}: {
  companies: Company[];
  sortKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  selectedIds: number[];
  onToggle: (id: number) => void;
  onToggleAll: () => void;
} & CompanyActions) {
  const sortProps = { sortKey, direction, onSort };
  return (
    <DataTable
      className="mt-6"
      empty={companies.length === 0 && <NoResults />}
      mobile={companies.map((company) => (
        <CompanyCard company={company} key={company.id} onDelete={onDelete} onEdit={onEdit} onToggle={onToggle} selected={selectedIds.includes(company.id)} />
      ))}
    >
      <THead>
        <tr>
          <Th><input aria-label="Sayfadaki firmaları seç" checked={companies.length > 0 && companies.every((company) => selectedIds.includes(company.id))} className="size-4 accent-brand" onChange={onToggleAll} type="checkbox" /></Th>
          <Th>
            <SortButton column="name" label="Firma" {...sortProps} />
          </Th>
          <Th>Sektör / Konum</Th>
          <Th>
            <SortButton column="employees" label="Çalışan" {...sortProps} />
          </Th>
          <Th>
            <SortButton column="contract" label="Sözleşme" {...sortProps} />
          </Th>
          <Th>
            <SortButton column="lastScreening" label="Son tarama" {...sortProps} />
          </Th>
          <Th>
            <span className="sr-only">İşlemler</span>
          </Th>
        </tr>
      </THead>
      <TBody>
        {companies.map((company) => (
          <Tr key={company.id}>
            <Td>
              <input aria-label={`${company.name} seç`} checked={selectedIds.includes(company.id)} className="size-4 accent-brand" onChange={() => onToggle(company.id)} type="checkbox" />
            </Td>
            <Td>
              <Link className="flex items-center gap-3" href={`/firmalar/${company.id}`}>
                <Avatar text={initials(company.name)} />
                <span>
                  <span className="block text-sm font-semibold text-foreground">{company.name}</span>
                  <span className="mt-1 block text-xs text-subtle">Yetkili: {company.contact}</span>
                </span>
              </Link>
            </Td>
            <Td>
              <p className="text-xs font-medium text-foreground">{company.sector}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-subtle">
                <MapPin className="size-3" />
                {companyLocation(company) || "—"}
              </p>
            </Td>
            <Td className="text-sm font-semibold text-foreground">{company.employees}</Td>
            <Td>
              <Badge tone={contractTone[company.contract]}>{company.contract}</Badge>
              <p className="mt-1 text-[10px] text-subtle">{company.contractEnd || "—"}</p>
            </Td>
            <Td className="text-xs text-muted">
              {company.lastScreening}
              <p className="mt-1 text-[10px] text-subtle">{company.screenings} tarama</p>
            </Td>
            <Td>
              <CompanyRowActions company={company} onDelete={onDelete} onEdit={onEdit} />
            </Td>
          </Tr>
        ))}
      </TBody>
    </DataTable>
  );
}

function CompanyGrid({ companies, onEdit, onDelete, selectedIds, onToggle }: { companies: Company[]; selectedIds: number[]; onToggle: (id: number) => void } & CompanyActions) {
  if (companies.length === 0) {
    return (
      <Card className="mt-6">
        <NoResults />
      </Card>
    );
  }
  return (
    <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-2">
      {companies.map((company) => (
        <Card className="h-full" key={company.id}>
          <CompanyCard company={company} onDelete={onDelete} onEdit={onEdit} onToggle={onToggle} selected={selectedIds.includes(company.id)} />
        </Card>
      ))}
    </div>
  );
}
