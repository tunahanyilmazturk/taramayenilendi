"use client";

import {
  CalendarDays,
  Check,
  ClipboardList,
  Edit3,
  Eye,
  FileText,
  Plus,
  Send,
  Tag,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, CountPill, offerTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, StatTile, SummaryCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FilterSelect, Input, SearchInput, Select } from "@/components/ui/field";
import { Alert, Modal } from "@/components/ui/modal";
import { Page, PageHeader } from "@/components/ui/page-header";
import { Pagination, paginate } from "@/components/ui/pagination";
import { Avatar, DataTable, SortButton, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { useCompanies, useOffers } from "@/lib/data";
import { offerStatuses, type Company, type Offer, type OfferStatus } from "@/lib/demo-data";
import { isoToLabel, labelToIso, money, todayIso } from "@/lib/format";
import { useNotice, useSort } from "@/lib/hooks";
import { cn, compareTr, includesQuery, initials } from "@/lib/utils";

type SortKey = "number" | "company" | "status" | "total" | "validUntil";
type FormState = { companyId: string; title: string; validUntil: string; total: string; items: string; contact: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = { companyId: "", title: "", validUntil: "", total: "", items: "1", contact: "" };
const statusFilters = ["Tümü", ...offerStatuses] as const;
const openStatuses: OfferStatus[] = ["Gönderildi", "Görüşülüyor"];

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
  const [notice, showNotice] = useNotice();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("Tümü");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { sortKey, direction, toggle } = useSort<SortKey>("number", "desc");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const result = offers.filter(
      (offer) =>
        (status === "Tümü" || offer.status === status) &&
        includesQuery(`${offer.number} ${offer.company} ${offer.title} ${offer.contact}`, query),
    );
    return result.sort((a, b) => {
      const comparison = compareTr(sortValue(a, sortKey), sortValue(b, sortKey));
      return direction === "asc" ? comparison : -comparison;
    });
  }, [offers, query, status, sortKey, direction]);
  const { safePage, items: paged } = paginate(filtered, page, pageSize);
  const selected = offers.find((offer) => offer.id === selectedId);
  const editing = offers.find((offer) => offer.id === editingId);
  const openCount = offers.filter((offer) => openStatuses.includes(offer.status)).length;
  const approvedVolume = offers
    .filter((offer) => offer.status === "Onaylandı")
    .reduce((sum, offer) => sum + offer.total, 0);

  const changeSort = (key: SortKey) => {
    toggle(key);
    setPage(1);
  };
  const resetFilters = () => {
    setQuery("");
    setStatus("Tümü");
    setPage(1);
  };
  const saveEdit = (offer: Offer) => {
    setOffers((current) => current.map((item) => (item.id === offer.id ? offer : item)));
    setEditingId(null);
    showNotice("Teklif bilgileri kaydedildi.");
  };
  const removeOffer = (offer: Offer) => {
    if (!window.confirm(`${offer.number} numaralı teklifi silmek istediğinize emin misiniz?`)) return;
    setOffers((current) => current.filter((item) => item.id !== offer.id));
    if (selectedId === offer.id) setSelectedId(null);
    showNotice("Teklif silindi.");
  };
  const updateStatus = (offer: Offer, nextStatus: OfferStatus) => {
    setOffers((current) => current.map((item) => (item.id === offer.id ? { ...item, status: nextStatus } : item)));
    showNotice("Teklif durumu güncellendi.");
  };
  const actions = { onSelect: setSelectedId, onEdit: setEditingId, onDelete: removeOffer, onStatus: updateStatus };

  return (
    <Page>
      <PageHeader
        eyebrow="Teklif ve fiyatlandırma merkezi"
        title="Teklifler"
        description="Firmalarınıza sunduğunuz OSGB hizmet tekliflerini ve dönüş süreçlerini yönetin."
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
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Toplam teklif" value={offers.length} icon={FileText} />
        <SummaryCard label="Açık teklifler" value={openCount} icon={Send} />
        <SummaryCard label="Onaylanan hacim" value={money(approvedVolume)} icon={ClipboardList} />
      </div>
      <Card aria-label="Teklif listesi filtreleri" className="mt-7 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Teklif listesi</h2>
              <CountPill>{filtered.length} kayıt</CountPill>
            </div>
            <p className="mt-1 text-xs text-subtle">Teklifleri arayın, durumlarına göre filtreleyin ve sıralayın.</p>
          </div>
          <FilterSelect
            label="Durum"
            onChange={(value) => {
              setStatus(value as (typeof statusFilters)[number]);
              setPage(1);
            }}
            options={statusFilters}
            value={status}
          />
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
      </Card>
      {selected && <OfferDetail offer={selected} onClose={() => setSelectedId(null)} {...actions} />}
      {paged.length > 0 ? (
        <OfferTable direction={direction} offers={paged} onSort={changeSort} sortKey={sortKey} {...actions} />
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
    </Page>
  );
}

type RowActions = {
  onSelect: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (offer: Offer) => void;
  onStatus: (offer: Offer, status: OfferStatus) => void;
};

function OfferTable({
  offers,
  sortKey,
  direction,
  onSort,
  ...actions
}: RowActions & {
  offers: Offer[];
  sortKey: SortKey;
  direction: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const sortProps = { sortKey, direction, onSort };
  return (
    <DataTable
      className="mt-6"
      mobile={offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} {...actions} />
      ))}
    >
      <THead>
        <tr>
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
          <OfferRow key={offer.id} offer={offer} {...actions} />
        ))}
      </TBody>
    </DataTable>
  );
}

function StatusSelect({ offer, onStatus }: { offer: Offer; onStatus: RowActions["onStatus"] }) {
  return (
    <Select
      aria-label={`${offer.number} durumu`}
      className="h-8 w-auto px-2 pr-7 text-[11px] font-semibold"
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
    <span className={cn("block text-xs text-muted", className)}>
      <span className="flex items-center gap-1">
        <CalendarDays className="size-3.5" />
        {offer.validUntil}
      </span>
      {isExpired(offer) && <span className="mt-1 block text-[10px] font-semibold text-warning">Süresi geçti</span>}
    </span>
  );
}

function OfferRow({ offer, onSelect, onEdit, onDelete, onStatus }: RowActions & { offer: Offer }) {
  return (
    <Tr>
      <Td>
        <button className="text-left" onClick={() => onSelect(offer.id)} type="button">
          <span className="block text-xs font-bold tracking-[0.08em] text-brand">{offer.number}</span>
          <span className="mt-1 block text-[11px] text-subtle">Oluşturuldu: {offer.createdAt}</span>
        </button>
      </Td>
      <Td>
        <button className="flex items-center gap-3 text-left" onClick={() => onSelect(offer.id)} type="button">
          <Avatar size="sm" text={initials(offer.company)} />
          <span>
            <span className="block text-sm font-semibold text-foreground">{offer.company}</span>
            <span className="mt-1 block text-xs text-subtle">Yetkili: {offer.contact || "—"}</span>
          </span>
        </button>
      </Td>
      <Td>
        <p className="max-w-[210px] truncate text-xs font-medium text-foreground">{offer.title}</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-subtle">
          <ClipboardList className="size-3" />
          {offer.items} hizmet kalemi
        </p>
      </Td>
      <Td>
        <StatusSelect offer={offer} onStatus={onStatus} />
      </Td>
      <Td className="text-sm font-semibold text-foreground">{money(offer.total)}</Td>
      <Td>
        <ValidUntil offer={offer} />
      </Td>
      <Td>
        <div className="flex justify-end gap-1">
          <Button aria-label={`${offer.number} detaylarını gör`} onClick={() => onSelect(offer.id)} size="icon-sm" variant="ghost">
            <Eye />
          </Button>
          <Button aria-label={`${offer.number} düzenle`} onClick={() => onEdit(offer.id)} size="icon-sm" variant="ghost">
            <Edit3 />
          </Button>
          <Button aria-label={`${offer.number} sil`} onClick={() => onDelete(offer)} size="icon-sm" variant="danger">
            <Trash2 />
          </Button>
        </div>
      </Td>
    </Tr>
  );
}

function OfferCard({ offer, onSelect, onEdit, onDelete, onStatus }: RowActions & { offer: Offer }) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <button className="min-w-0 text-left" onClick={() => onSelect(offer.id)} type="button">
          <span className="block text-[10px] font-bold tracking-[0.08em] text-brand">{offer.number}</span>
          <span className="mt-1 block text-sm font-semibold text-foreground">{offer.company}</span>
          <span className="mt-1 block truncate text-xs text-muted">{offer.title}</span>
        </button>
        <div className="flex shrink-0 gap-1">
          <Button aria-label={`${offer.number} düzenle`} onClick={() => onEdit(offer.id)} size="icon-sm" variant="ghost">
            <Edit3 />
          </Button>
          <Button aria-label={`${offer.number} sil`} onClick={() => onDelete(offer)} size="icon-sm" variant="danger">
            <Trash2 />
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <StatusSelect offer={offer} onStatus={onStatus} />
        <span className="text-sm font-semibold text-foreground">{money(offer.total)}</span>
      </div>
      <ValidUntil className="mt-2" offer={offer} />
    </div>
  );
}

function OfferDetail({
  offer,
  onClose,
  onEdit,
  onDelete,
  onStatus,
}: Omit<RowActions, "onSelect"> & { offer: Offer; onClose: () => void }) {
  return (
    <Card className="mt-6 border-border-strong p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">Teklif detayı · {offer.number}</p>
          <h2 className="mt-2 text-xl font-semibold text-heading">{offer.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {offer.company} · Yetkili: {offer.contact || "Belirtilmedi"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={offerTone[offer.status]}>{offer.status}</Badge>
          {isExpired(offer) && <Badge tone="warning">Süresi geçti</Badge>}
          <Button aria-label="Teklif detayını kapat" onClick={onClose} size="icon-sm" variant="ghost">
            <X />
          </Button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Teklif toplamı" value={money(offer.total)} icon={ClipboardList} />
        <StatTile label="Hizmet kalemi" value={`${offer.items} kalem`} icon={FileText} />
        <StatTile label="Teklif türü" value={offer.offerType ?? "Belirtilmedi"} icon={Tag} />
        <StatTile label="Geçerlilik" value={offer.validUntil} icon={CalendarDays} />
        <StatTile label="Oluşturulma" value={offer.createdAt} icon={UsersRound} />
      </div>
      {offer.lines && offer.lines.length > 0 && (
        <div className="mt-5 rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-divider px-4 py-3">
            <p className="text-xs font-semibold text-foreground">Hizmet kalemleri</p>
            {(offer.discount !== undefined || offer.tax !== undefined) && (
              <p className="text-[11px] text-subtle">
                İndirim %{offer.discount ?? 0} · KDV %{offer.tax ?? 0}
              </p>
            )}
          </div>
          <ul className="divide-y divide-divider">
            {offer.lines.map((line) => (
              <li className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs" key={line.testId}>
                <span className="min-w-0 truncate text-foreground">
                  {line.name}
                  <span className="text-subtle">
                    {" "}
                    × {line.quantity} · {money(line.unitPrice)} birim
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-foreground">{money(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {offer.notes && (
        <p className="mt-5 rounded-xl bg-card-muted p-4 text-xs leading-5 text-muted">
          <span className="font-semibold text-foreground">Not:</span> {offer.notes}
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button onClick={() => onEdit(offer.id)} size="sm">
          <Edit3 /> Düzenle
        </Button>
        {offer.status === "Taslak" && (
          <Button onClick={() => onStatus(offer, "Gönderildi")} size="sm" variant="secondary">
            <Send /> Gönderildi olarak işaretle
          </Button>
        )}
        <Button onClick={() => onDelete(offer)} size="sm" variant="danger-outline">
          <Trash2 /> Sil
        </Button>
        <label className="ml-auto flex items-center gap-2 text-xs text-muted">
          Durum
          <Select
            className="h-9 w-auto text-xs"
            onChange={(event) => onStatus(offer, event.target.value as OfferStatus)}
            value={offer.status}
          >
            {offerStatuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </label>
      </div>
    </Card>
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
          <Select invalid={Boolean(errors.companyId)} onChange={(event) => chooseCompany(event.target.value)} value={form.companyId}>
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
          <Input onChange={(event) => setField("contact", event.target.value)} placeholder="Ad soyad" value={form.contact} />
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
