"use client";

import { CalendarDays, Check, ClipboardList, Edit3, Eye, FileText, LayoutGrid, List, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, CountPill, offerTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FilterSelect, Input, SearchInput, Select } from "@/components/ui/field";
import { Alert, ConfirmDialog, Modal } from "@/components/ui/modal";
import { Page, PageHeader } from "@/components/ui/page-header";
import { Pagination, paginate } from "@/components/ui/pagination";
import { Avatar, DataTable, SortButton, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { useCompanies, useOffers, useOrganization } from "@/lib/data";
import { offerStatuses, offerTypes, type Company, type Offer, type OfferStatus } from "@/lib/demo-data";
import { isoToLabel, labelToIso, money, todayIso } from "@/lib/format";
import { useConfirm, useNotice, useSort } from "@/lib/hooks";
import { cn, compareTr, includesQuery, initials } from "@/lib/utils";
import { previewOfferPdf } from "@/lib/pdf/offer-pdf";

type SortKey = "number" | "company" | "status" | "total" | "validUntil";
type View = "table" | "cards";
type FormState = {
  companyId: string;
  title: string;
  validUntil: string;
  total: string;
  items: string;
  contact: string;
};
type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = { companyId: "", title: "", validUntil: "", total: "", items: "1", contact: "" };
const statusFilters = ["Tümü", ...offerStatuses] as const;
const allOfferTypes = "Tüm teklif türleri";

const sortValue = (offer: Offer, key: SortKey) => (key === "validUntil" ? labelToIso(offer.validUntil) : offer[key]);
const isExpired = (offer: Offer) => {
  const iso = labelToIso(offer.validUntil);
  return Boolean(iso) && iso < todayIso() && offer.status !== "Süresi doldu";
};

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.companyId) errors.companyId = "Firma seçin.";
  if (!form.title.trim()) errors.title = "Teklif başlığı zorunludur.";
  if (!form.validUntil) errors.validUntil = "Geçerlilik tarihi seçin.";
  if (form.total === "" || Number(form.total) < 0) errors.total = "Geçerli bir toplam tutar girin.";
  if (Number(form.items) < 1) errors.items = "En az 1 hizmet kalemi olmalıdır.";
  return errors;
}

export default function OffersPage() {
  const [offers, setOffers] = useOffers();
  const [companies] = useCompanies();
  const [organization] = useOrganization();
  const [notice, showNotice] = useNotice();
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("Tümü");
  const [companyFilter, setCompanyFilter] = useState("Tüm firmalar");
  const [typeFilter, setTypeFilter] = useState(allOfferTypes);
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [minItems, setMinItems] = useState("");
  const [maxItems, setMaxItems] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [view, setView] = useState<View>("table");
  const { sortKey, direction, toggle } = useSort<SortKey>("number", "desc");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const filtered = useMemo(() => {
    const result = offers.filter(
      (offer) =>
        (status === "Tümü" || offer.status === status) &&
        (companyFilter === "Tüm firmalar" || offer.company === companyFilter) &&
        (typeFilter === allOfferTypes || offer.offerType === typeFilter) &&
        (!validFrom || labelToIso(offer.validUntil) >= validFrom) &&
        (!validTo || labelToIso(offer.validUntil) <= validTo) &&
        (!minTotal || offer.total >= Number(minTotal)) &&
        (!maxTotal || offer.total <= Number(maxTotal)) &&
        (!minItems || offer.items >= Number(minItems)) &&
        (!maxItems || offer.items <= Number(maxItems)) &&
        includesQuery(`${offer.number} ${offer.company} ${offer.title} ${offer.contact}`, query),
    );
    return result.sort((a, b) => {
      const comparison = compareTr(sortValue(a, sortKey), sortValue(b, sortKey));
      return direction === "asc" ? comparison : -comparison;
    });
  }, [
    offers,
    query,
    status,
    companyFilter,
    typeFilter,
    validFrom,
    validTo,
    minTotal,
    maxTotal,
    minItems,
    maxItems,
    sortKey,
    direction,
  ]);
  const { safePage, items: paged } = paginate(filtered, page, pageSize);
  const editing = offers.find((offer) => offer.id === editingId);

  const changeSort = (key: SortKey) => {
    toggle(key);
    setPage(1);
  };
  const resetFilters = () => {
    setQuery("");
    setStatus("Tümü");
    setCompanyFilter("Tüm firmalar");
    setTypeFilter(allOfferTypes);
    setValidFrom("");
    setValidTo("");
    setMinTotal("");
    setMaxTotal("");
    setMinItems("");
    setMaxItems("");
    setPage(1);
  };
  const hasAdvancedFilters = Boolean(
    companyFilter !== "Tüm firmalar" ||
    typeFilter !== allOfferTypes ||
    validFrom ||
    validTo ||
    minTotal ||
    maxTotal ||
    minItems ||
    maxItems,
  );
  const hasAnyFilters = Boolean(query || status !== "Tümü" || hasAdvancedFilters);
  const saveEdit = (offer: Offer) => {
    const editedAt = new Date().toLocaleString("tr-TR");
    setOffers((current) =>
      current.map((item) => {
        if (item.id !== offer.id) return item;
        const currentRevision = item.revision ?? 1;
        return {
          ...offer,
          revision: currentRevision + 1,
          revisionHistory: [
            ...(item.revisionHistory ?? []),
            {
              revision: currentRevision,
              createdAt: item.createdAt,
              note: "Düzenleme öncesi sürüm",
              status: item.status,
            },
          ],
          activities: [
            ...(item.activities ?? []),
            {
              id: `${Date.now()}`,
              type: "revised" as const,
              title: `Revizyon ${currentRevision + 1} kaydedildi`,
              description: "Teklif düzenlenerek yeni sürüm oluşturuldu.",
              createdAt: editedAt,
            },
          ],
        };
      }),
    );
    setEditingId(null);
    showNotice("Teklif bilgileri kaydedildi.");
  };
  const removeOffer = (offer: Offer) => {
    confirm({
      title: "Teklifi sil",
      description: `${offer.number} numaralı teklif silinecek.`,
      onConfirm: () => {
        setOffers((current) => current.filter((item) => item.id !== offer.id));
        setSelectedIds((current) => current.filter((id) => id !== offer.id));
        showNotice("Teklif silindi.");
      },
    });
  };
  const toggleSelected = (id: number) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };
  const togglePageSelection = () => {
    const pageIds = paged.map((offer) => offer.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])),
    );
  };
  const removeSelected = () => {
    if (!selectedIds.length) return;
    const count = selectedIds.length;
    confirm({
      title: "Seçilen teklifleri sil",
      description: `${count} teklif kalıcı olarak silinecek.`,
      confirmLabel: "Teklifleri sil",
      onConfirm: () => {
        setOffers((current) => current.filter((item) => !selectedIds.includes(item.id)));
        setSelectedIds([]);
        showNotice(`${count} teklif silindi.`);
      },
    });
  };
  const previewOffer = (offer: Offer) => {
    void previewOfferPdf(
      offer,
      organization,
      companies.find((company) => company.name === offer.company),
    );
  };
  const updateStatus = (offer: Offer, nextStatus: OfferStatus) => {
    setOffers((current) => current.map((item) => (item.id === offer.id ? { ...item, status: nextStatus } : item)));
    showNotice("Teklif durumu güncellendi.");
  };
  const actions = { onEdit: setEditingId, onDelete: removeOffer, onStatus: updateStatus, onPreview: previewOffer };

  return (
    <Page>
      <PageHeader
        className="border-border bg-card shadow-card rounded-2xl border px-5 py-5 sm:px-6 sm:py-6"
        eyebrow="Teklif ve fiyatlandırma merkezi"
        title="Teklifler"
        description="Firmalarınıza sunduğunuz OSGB hizmet tekliflerini ve dönüş süreçlerini yönetin."
        visual="/headers/offers.png"
        actions={
          <Button asChild>
            <Link href="/teklifler/yeni">
              <Plus /> Yeni teklif oluştur
            </Link>
          </Button>
        }
      />
      {notice && (
        <Alert className="mt-4 w-fit" icon={Check}>
          {notice}
        </Alert>
      )}
      {selectedIds.length > 0 && (
        <Card className="border-brand/30 bg-brand-soft/40 mt-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground text-sm font-medium">
            <strong>{selectedIds.length}</strong> teklif seçildi.
          </p>
          <Button onClick={removeSelected} size="sm" variant="danger">
            <Trash2 /> Seçilenleri sil
          </Button>
        </Card>
      )}
      <Card aria-label="Teklif listesi filtreleri" className="mt-5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-foreground text-sm font-semibold">Teklif listesi</h2>
              <CountPill>{filtered.length} kayıt</CountPill>
            </div>
            <p className="text-subtle mt-1 text-xs">Teklifleri arayın, durumlarına göre filtreleyin ve sıralayın.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Durum"
              onChange={(value) => {
                setStatus(value as (typeof statusFilters)[number]);
                setPage(1);
              }}
              options={statusFilters}
              value={status}
            />
            <OfferViewToggle onChange={setView} view={view} />
            <Button
              onClick={() => setAdvancedOpen((value) => !value)}
              size="sm"
              variant={advancedOpen || hasAdvancedFilters ? "soft" : "outline"}
            >
              {advancedOpen ? "Gelişmiş filtreleri gizle" : "Gelişmiş filtreler"}
            </Button>
          </div>
        </div>
        <SearchInput
          aria-label="Teklif ara"
          className="mt-4"
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Teklif no, firma, başlık veya yetkili ara..."
          value={query}
        />
        {advancedOpen && (
          <div className="border-divider mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label="Firma"
              onChange={(value) => {
                setCompanyFilter(value);
                setPage(1);
              }}
              options={["Tüm firmalar", ...Array.from(new Set(companies.map((company) => company.name)))]}
              value={companyFilter}
            />
            <FilterSelect
              label="Teklif türü"
              onChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
              options={[allOfferTypes, ...offerTypes]}
              value={typeFilter}
            />
            <Field label="Geçerlilik başlangıcı">
              <Input
                aria-label="Geçerlilik başlangıcı"
                className="h-10"
                onChange={(event) => {
                  setValidFrom(event.target.value);
                  setPage(1);
                }}
                type="date"
                value={validFrom}
              />
            </Field>
            <Field label="Geçerlilik bitişi">
              <Input
                aria-label="Geçerlilik bitişi"
                className="h-10"
                onChange={(event) => {
                  setValidTo(event.target.value);
                  setPage(1);
                }}
                type="date"
                value={validTo}
              />
            </Field>
            <Field label="Minimum tutar">
              <Input
                aria-label="Minimum tutar"
                className="h-10"
                min={0}
                onChange={(event) => {
                  setMinTotal(event.target.value);
                  setPage(1);
                }}
                placeholder="₺ 0"
                type="number"
                value={minTotal}
              />
            </Field>
            <Field label="Maksimum tutar">
              <Input
                aria-label="Maksimum tutar"
                className="h-10"
                min={0}
                onChange={(event) => {
                  setMaxTotal(event.target.value);
                  setPage(1);
                }}
                placeholder="₺ 0"
                type="number"
                value={maxTotal}
              />
            </Field>
            <Field label="Minimum hizmet adedi">
              <Input
                aria-label="Minimum hizmet adedi"
                className="h-10"
                min={0}
                onChange={(event) => {
                  setMinItems(event.target.value);
                  setPage(1);
                }}
                placeholder="0"
                type="number"
                value={minItems}
              />
            </Field>
            <Field label="Maksimum hizmet adedi">
              <Input
                aria-label="Maksimum hizmet adedi"
                className="h-10"
                min={0}
                onChange={(event) => {
                  setMaxItems(event.target.value);
                  setPage(1);
                }}
                placeholder="0"
                type="number"
                value={maxItems}
              />
            </Field>
            {hasAnyFilters && (
              <Button className="w-fit" onClick={resetFilters} size="sm" variant="danger">
                Filtreleri temizle
              </Button>
            )}
          </div>
        )}
      </Card>
      {paged.length > 0 ? (
        view === "table" ? (
          <OfferTable
            direction={direction}
            offers={paged}
            onSort={changeSort}
            selectedIds={selectedIds}
            onToggle={toggleSelected}
            onToggleAll={togglePageSelection}
            sortKey={sortKey}
            {...actions}
          />
        ) : (
          <OfferGrid offers={paged} selectedIds={selectedIds} onToggle={toggleSelected} {...actions} />
        )
      ) : (
        <EmptyState
          action={
            <Button onClick={resetFilters} size="sm" variant="outline">
              Filtreleri temizle
            </Button>
          }
          className="mt-6"
          description="Arama veya durum filtresini değiştirerek tekrar deneyin."
          icon={FileText}
          title="Filtrelerle eşleşen teklif yok"
        />
      )}
      <Pagination
        noun="teklif"
        onPage={setPage}
        onPageSize={(value) => {
          setPageSize(value);
          setPage(1);
        }}
        page={safePage}
        pageSize={pageSize}
        total={filtered.length}
      />
      {editing && (
        <OfferEditModal companies={companies} offer={editing} onClose={() => setEditingId(null)} onSave={saveEdit} />
      )}
      <ConfirmDialog onClose={closeConfirm} request={confirmRequest} />
    </Page>
  );
}

type RowActions = {
  onEdit: (id: number) => void;
  onDelete: (offer: Offer) => void;
  onStatus: (offer: Offer, status: OfferStatus) => void;
  onPreview: (offer: Offer) => void;
};

function OfferViewToggle({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  const options: Array<[View, string, typeof List]> = [
    ["table", "Liste görünümü", List],
    ["cards", "Kart görünümü", LayoutGrid],
  ];
  return (
    <div aria-label="Görünüm" className="border-border bg-card flex rounded-xl border p-1" role="group">
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

function OfferGrid({
  offers,
  selectedIds,
  onToggle,
  ...actions
}: RowActions & { offers: Offer[]; selectedIds: number[]; onToggle: (id: number) => void }) {
  return (
    <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-2">
      {offers.map((offer) => (
        <Card className="h-full" key={offer.id}>
          <OfferCard offer={offer} onToggle={onToggle} selected={selectedIds.includes(offer.id)} {...actions} />
        </Card>
      ))}
    </div>
  );
}

function OfferTable({
  offers,
  sortKey,
  direction,
  onSort,
  selectedIds,
  onToggle,
  onToggleAll,
  ...actions
}: RowActions & {
  offers: Offer[];
  sortKey: SortKey;
  direction: "asc" | "desc";
  onSort: (key: SortKey) => void;
  selectedIds: number[];
  onToggle: (id: number) => void;
  onToggleAll: () => void;
}) {
  const sortProps = { sortKey, direction, onSort };
  return (
    <DataTable
      className="mt-6"
      mobile={offers.map((offer) => (
        <OfferCard
          key={offer.id}
          offer={offer}
          selected={selectedIds.includes(offer.id)}
          onToggle={onToggle}
          {...actions}
        />
      ))}
    >
      <THead>
        <tr>
          <Th>
            <input
              aria-label="Sayfadaki teklifleri seç"
              checked={offers.length > 0 && offers.every((offer) => selectedIds.includes(offer.id))}
              className="accent-brand size-4"
              onChange={onToggleAll}
              type="checkbox"
            />
          </Th>
          <Th>
            <SortButton column="number" label="Teklif" {...sortProps} />
          </Th>
          <Th>
            <SortButton column="company" label="Firma" {...sortProps} />
          </Th>
          <Th>Hizmet kapsamı</Th>
          <Th>
            <SortButton column="status" label="Durum" {...sortProps} />
          </Th>
          <Th>
            <SortButton column="total" label="Toplam" {...sortProps} />
          </Th>
          <Th>
            <SortButton column="validUntil" label="Geçerlilik" {...sortProps} />
          </Th>
          <Th>
            <span className="sr-only">İşlemler</span>
          </Th>
        </tr>
      </THead>
      <TBody>
        {offers.map((offer) => (
          <OfferRow
            key={offer.id}
            offer={offer}
            selected={selectedIds.includes(offer.id)}
            onToggle={onToggle}
            {...actions}
          />
        ))}
      </TBody>
    </DataTable>
  );
}

function StatusSelect({ offer, onStatus }: { offer: Offer; onStatus: RowActions["onStatus"] }) {
  return (
    <Select
      aria-label={`${offer.number} durumu`}
      className="h-8 w-[126px] min-w-[126px] px-2 pr-9 text-[11px] font-semibold"
      onChange={(event) => onStatus(offer, event.target.value as OfferStatus)}
      value={offer.status}
    >
      {offerStatuses.map((item) => (
        <option key={item}>{item}</option>
      ))}
    </Select>
  );
}

function ValidUntil({ offer, className }: { offer: Offer; className?: string }) {
  return (
    <span className={cn("text-muted block text-xs", className)}>
      <span className="flex items-center gap-1">
        <CalendarDays className="size-3.5" />
        {offer.validUntil}
      </span>
      {isExpired(offer) && <span className="text-warning mt-1 block text-[10px] font-semibold">Süresi geçti</span>}
    </span>
  );
}

function OfferRow({
  offer,
  onEdit,
  onDelete,
  onStatus,
  onPreview,
  selected,
  onToggle,
}: RowActions & { offer: Offer; selected: boolean; onToggle: (id: number) => void }) {
  return (
    <Tr>
      <Td>
        <input
          aria-label={`${offer.number} seç`}
          checked={selected}
          className="accent-brand size-4"
          onChange={() => onToggle(offer.id)}
          type="checkbox"
        />
      </Td>
      <Td>
        <Link className="text-left" href={`/teklifler/${offer.id}`}>
          <span className="text-brand block text-xs font-bold tracking-[0.08em]">{offer.number}</span>
          <span className="text-subtle mt-1 block text-[11px]">Oluşturuldu: {offer.createdAt}</span>
        </Link>
      </Td>
      <Td>
        <Link className="flex items-center gap-3 text-left" href={`/teklifler/${offer.id}`}>
          <Avatar size="sm" text={initials(offer.company)} />
          <span>
            <span className="text-foreground block text-sm font-semibold">{offer.company}</span>
            <span className="text-subtle mt-1 block text-xs">Yetkili: {offer.contact || "—"}</span>
          </span>
        </Link>
      </Td>
      <Td>
        <Link className="block" href={`/teklifler/${offer.id}`}>
          <p className="text-foreground max-w-[210px] truncate text-xs font-medium">{offer.title}</p>
          <p className="text-subtle mt-1 flex items-center gap-1 text-[11px]">
            <ClipboardList className="size-3" />
            {offer.items} hizmet kalemi
          </p>
        </Link>
      </Td>
      <Td>
        <StatusSelect offer={offer} onStatus={onStatus} />
      </Td>
      <Td className="text-foreground text-sm font-semibold">{money(offer.total)}</Td>
      <Td>
        <ValidUntil offer={offer} />
      </Td>
      <Td>
        <div className="flex justify-end gap-1">
          <Button
            aria-label={`${offer.number} düzenle`}
            onClick={() => onEdit(offer.id)}
            size="icon-sm"
            variant="ghost"
          >
            <Edit3 />
          </Button>
          <Button
            aria-label={`${offer.number} PDF önizleme`}
            onClick={() => onPreview(offer)}
            size="icon-sm"
            variant="ghost"
          >
            <Eye />
          </Button>
          <Button aria-label={`${offer.number} sil`} onClick={() => onDelete(offer)} size="icon-sm" variant="danger">
            <Trash2 />
          </Button>
        </div>
      </Td>
    </Tr>
  );
}

function OfferCard({
  offer,
  onEdit,
  onDelete,
  onStatus,
  onPreview,
  selected,
  onToggle,
}: RowActions & { offer: Offer; selected: boolean; onToggle: (id: number) => void }) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <input
            aria-label={`${offer.number} seç`}
            checked={selected}
            className="accent-brand mt-1 size-4 shrink-0"
            onChange={() => onToggle(offer.id)}
            type="checkbox"
          />
          <Link className="min-w-0 text-left" href={`/teklifler/${offer.id}`}>
            <span className="text-brand block text-[10px] font-bold tracking-[0.08em]">{offer.number}</span>
            <span className="text-foreground mt-1 block text-sm font-semibold">{offer.company}</span>
            <span className="text-muted mt-1 block truncate text-xs">{offer.title}</span>
          </Link>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            aria-label={`${offer.number} düzenle`}
            onClick={() => onEdit(offer.id)}
            size="icon-sm"
            variant="ghost"
          >
            <Edit3 />
          </Button>
          <Button
            aria-label={`${offer.number} PDF önizleme`}
            onClick={() => onPreview(offer)}
            size="icon-sm"
            variant="ghost"
          >
            <Eye />
          </Button>
          <Button aria-label={`${offer.number} sil`} onClick={() => onDelete(offer)} size="icon-sm" variant="danger">
            <Trash2 />
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <StatusSelect offer={offer} onStatus={onStatus} />
        <span className="text-foreground text-sm font-semibold">{money(offer.total)}</span>
      </div>
      <ValidUntil className="mt-2" offer={offer} />
    </div>
  );
}

function OfferEditModal({
  offer,
  companies,
  onClose,
  onSave,
}: {
  offer: Offer;
  companies: Company[];
  onClose: () => void;
  onSave: (offer: Offer) => void;
}) {
  const knownCompany = companies.some((company) => company.id === offer.companyId);
  const [form, setForm] = useState<FormState>({
    ...emptyForm,
    companyId: knownCompany ? String(offer.companyId) : offer.company ? "current" : "",
    title: offer.title,
    validUntil: labelToIso(offer.validUntil),
    total: String(offer.total),
    items: String(offer.items),
    contact: offer.contact,
  });
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validateForm(form) : {};
  const setField = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const chooseCompany = (value: string) => {
    const company = companies.find((item) => String(item.id) === value);
    setField("companyId", value);
    if (company) setField("contact", company.contact);
  };
  const submit = () => {
    setSubmitted(true);
    if (Object.keys(validateForm(form)).length > 0) return;
    const company = companies.find((item) => String(item.id) === form.companyId);
    onSave({
      ...offer,
      companyId: company?.id ?? offer.companyId,
      company: company?.name ?? offer.company,
      title: form.title.trim(),
      validUntil: isoToLabel(form.validUntil),
      total: Math.round(Number(form.total)),
      items: Number(form.items) || 1,
      contact: form.contact.trim(),
    });
  };
  return (
    <Modal
      description="Teklif başlığını, geçerlilik tarihini ve tutar bilgilerini güncelleyin."
      eyebrow={`Teklif kaydı · ${offer.number}`}
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Vazgeç
          </Button>
          <Button onClick={submit}>
            <Check /> Değişiklikleri kaydet
          </Button>
        </>
      }
      icon={FileText}
      onClose={onClose}
      open
      size="lg"
      title="Teklifi düzenle"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2" error={errors.companyId} label="Firma" required>
          <Select
            invalid={Boolean(errors.companyId)}
            onChange={(event) => chooseCompany(event.target.value)}
            value={form.companyId}
          >
            <option value="">Firma seçin</option>
            {!knownCompany && offer.company && <option value="current">{offer.company}</option>}
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field className="sm:col-span-2" error={errors.title} label="Teklif başlığı" required>
          <Input
            invalid={Boolean(errors.title)}
            onChange={(event) => setField("title", event.target.value)}
            placeholder="Örn. 2026 yıllık sağlık taraması"
            value={form.title}
          />
        </Field>
        <Field error={errors.validUntil} label="Geçerlilik tarihi" required>
          <Input
            invalid={Boolean(errors.validUntil)}
            onChange={(event) => setField("validUntil", event.target.value)}
            type="date"
            value={form.validUntil}
          />
        </Field>
        <Field error={errors.total} label="Toplam tutar (₺)" required>
          <Input
            invalid={Boolean(errors.total)}
            min={0}
            onChange={(event) => setField("total", event.target.value)}
            placeholder="0"
            type="number"
            value={form.total}
          />
        </Field>
        <Field error={errors.items} label="Hizmet kalemi sayısı">
          <Input
            invalid={Boolean(errors.items)}
            min={1}
            onChange={(event) => setField("items", event.target.value)}
            type="number"
            value={form.items}
          />
        </Field>
        <Field label="Firma yetkilisi">
          <Input
            onChange={(event) => setField("contact", event.target.value)}
            placeholder="Ad soyad"
            value={form.contact}
          />
        </Field>
        {Object.keys(errors).length > 0 && (
          <Alert className="sm:col-span-2" tone="danger">
            Lütfen işaretli alanları kontrol edin.
          </Alert>
        )}
      </div>
    </Modal>
  );
}
