"use client";

import { Building2, ClipboardList, LayoutGrid, MapPin, Plus, RotateCcw, Settings2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CompanyCard, CompanyRowActions, type CompanyActions } from "@/components/companies/company-card";
import { applyCompanyForm, CompanyForm, type CompanyFormValues } from "@/components/companies/company-form";
import { SectorManager } from "@/components/companies/sector-manager";
import { Badge, contractTone, CountPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect, SearchInput } from "@/components/ui/field";
import { Alert, ConfirmDialog } from "@/components/ui/modal";
import { Page, PageHeader } from "@/components/ui/page-header";
import { paginate, Pagination } from "@/components/ui/pagination";
import { Avatar, DataTable, SortButton, TBody, Td, Th, THead, Tr, type SortDirection } from "@/components/ui/table";
import { useCompanies, useSectors } from "@/lib/data";
import { companyLocation, contractStatuses, type Company } from "@/lib/demo-data";
import { labelToIso } from "@/lib/format";
import { useConfirm, useNotice, useSort } from "@/lib/hooks";
import { cn, compareTr, includesQuery, initials } from "@/lib/utils";

type SortKey = "name" | "employees" | "contract" | "lastScreening";
type View = "table" | "cards";

const allCities = "Tüm şehirler";
const allStatuses = "Tümü";
const statusFilters = [allStatuses, ...contractStatuses];

const sortValue = (company: Company, key: SortKey) => {
  if (key === "lastScreening") return labelToIso(company.lastScreening);
  return company[key];
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useCompanies();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sectors, setSectors] = useSectors();
  const [notice, showNotice] = useNotice();
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();
  const { sortKey, direction, toggle } = useSort<SortKey>("name");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(allStatuses);
  const [city, setCity] = useState(allCities);
  const [view, setView] = useState<View>("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [sectorOpen, setSectorOpen] = useState(false);

  const cities = useMemo(
    () => [allCities, ...new Set(companies.map((company) => company.city).filter(Boolean))],
    [companies],
  );
  const filtered = useMemo(
    () =>
      companies
        .filter(
          (company) =>
            (status === allStatuses || company.contract === status) &&
            (city === allCities || company.city === city) &&
            includesQuery(
              `${company.name} ${company.sector} ${companyLocation(company)} ${company.contact}`,
              query,
            ),
        )
        .sort((a, b) => {
          const comparison = compareTr(sortValue(a, sortKey), sortValue(b, sortKey));
          return direction === "asc" ? comparison : -comparison;
        }),
    [companies, query, status, city, sortKey, direction],
  );
  const { safePage, items: paged } = paginate(filtered, page, pageSize);
  const hasFilters = Boolean(query || status !== allStatuses || city !== allCities);

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
    setPage(1);
  };
  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (company: Company) => {
    setEditing(company);
    setFormOpen(true);
  };
  const saveCompany = (values: CompanyFormValues) => {
    setCompanies(applyCompanyForm(companies, values, editing?.id ?? null));
    setFormOpen(false);
    showNotice(editing ? "Firma bilgileri güncellendi." : "Yeni firma eklendi.");
  };
  const removeCompany = (company: Company) => {
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
  const actions: CompanyActions = { onEdit: openEdit, onDelete: removeCompany };

  return (
    <Page>
      <PageHeader
        className="border-border bg-card shadow-card rounded-2xl border px-5 py-5 sm:px-6 sm:py-6"
        actions={
          <>
            <Button onClick={() => setSectorOpen(true)} variant="secondary">
              <Settings2 /> Sektör yönetimi
            </Button>
            <Button onClick={openNew}>
              <Plus /> Yeni firma ekle
            </Button>
          </>
        }
        description="Hizmet verdiğiniz firmaları, sözleşmeleri ve tarama geçmişini yönetin."
        eyebrow="Müşteri ve sözleşme merkezi"
        title="Firmalar"
        visual="/headers/companies.png"
      />
      {notice && <Alert className="mt-4 w-fit">{notice}</Alert>}
      {selectedIds.length > 0 && (
        <Card className="mt-4 flex flex-col gap-3 border-brand/30 bg-brand-soft/40 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-foreground"><strong>{selectedIds.length}</strong> firma seçildi.</p>
          <Button onClick={removeSelected} size="sm" variant="danger"><Trash2 /> Seçilenleri sil</Button>
        </Card>
      )}

      <Card aria-label="Firma listesi filtreleri" className="mt-5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Firma listesi</h2>
              <CountPill>{filtered.length} kayıt</CountPill>
            </div>
            <p className="mt-1 text-xs text-subtle">Arama ve filtrelerle kayıtları hızlıca daraltın.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect label="Şehir" onChange={withReset(setCity)} options={cities} value={city} />
            <ViewToggle onChange={setView} view={view} />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row">
          <SearchInput
            aria-label="Firma ara"
            className="min-w-0 flex-1"
            onChange={(event) => withReset(setQuery)(event.target.value)}
            placeholder="Firma adı, sektör veya yetkili ara..."
            value={query}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-1 text-[10px] font-bold tracking-[0.12em] text-subtle uppercase">Sözleşme</span>
            {statusFilters.map((item) => (
              <Button
                aria-pressed={status === item}
                className={cn(status === item && "border-brand-outline")}
                key={item}
                onClick={() => withReset(setStatus)(item)}
                size="sm"
                variant={status === item ? "soft" : "outline"}
              >
                {item}
              </Button>
            ))}
            {hasFilters && (
              <Button onClick={clearFilters} size="sm" variant="danger">
                <RotateCcw /> Temizle
              </Button>
            )}
          </div>
        </div>
      </Card>

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

function ViewToggle({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  const options: Array<[View, string, typeof ClipboardList]> = [
    ["table", "Tablo görünümü", ClipboardList],
    ["cards", "Kart görünümü", LayoutGrid],
  ];
  return (
    <div className="flex rounded-xl border border-border bg-card p-1" role="group" aria-label="Görünüm">
      {options.map(([id, label, Icon]) => (
        <button
          aria-label={label}
          aria-pressed={view === id}
          className={cn(
            "rounded-lg p-2 transition-colors",
            view === id ? "bg-brand-soft text-brand-soft-fg" : "text-muted hover:text-foreground",
          )}
          key={id}
          onClick={() => onChange(id)}
          type="button"
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
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
