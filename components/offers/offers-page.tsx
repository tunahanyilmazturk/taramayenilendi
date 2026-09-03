"use client";

/* Frontend-only offer records hydrate from browser storage until the backend is added. */
/* eslint-disable react-hooks/set-state-in-effect */

import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Download,
  Edit3,
  Eye,
  FileText,
  Mail,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type OfferStatus = "Taslak" | "Gönderildi" | "Görüşülüyor" | "Onaylandı" | "Reddedildi" | "Süresi doldu";
type Offer = {
  id: number;
  number: string;
  company: string;
  title: string;
  status: OfferStatus;
  total: number;
  validUntil: string;
  createdAt: string;
  items: number;
  contact: string;
};
type CompanyOption = { id: number; name: string; contact: string; email?: string };
type FormState = { company: string; title: string; validUntil: string; total: string; items: string; contact: string };
type SortKey = "number" | "company" | "status" | "total" | "validUntil";

const initialOffers: Offer[] = [
  {
    id: 1,
    number: "TEK-2026-004",
    company: "Artemis Otomotiv A.Ş.",
    title: "2026 periyodik sağlık taraması",
    status: "Görüşülüyor",
    total: 86800,
    validUntil: "30 Eyl 2026",
    createdAt: "26 Ağu 2026",
    items: 4,
    contact: "Murat Şahin",
  },
  {
    id: 2,
    number: "TEK-2026-003",
    company: "Nova Gıda Üretim",
    title: "Yıllık OSGB hizmet paketi",
    status: "Gönderildi",
    total: 126500,
    validUntil: "15 Eyl 2026",
    createdAt: "22 Ağu 2026",
    items: 6,
    contact: "Emre Yıldız",
  },
  {
    id: 3,
    number: "TEK-2026-002",
    company: "Mavi Hat Lojistik",
    title: "Mobil tarama hizmeti",
    status: "Onaylandı",
    total: 44100,
    validUntil: "05 Eyl 2026",
    createdAt: "14 Ağu 2026",
    items: 3,
    contact: "Büşra Aydın",
  },
  {
    id: 4,
    number: "TEK-2026-001",
    company: "Eksen Yapı Proje",
    title: "İşe giriş sağlık taraması",
    status: "Taslak",
    total: 22800,
    validUntil: "20 Eyl 2026",
    createdAt: "09 Ağu 2026",
    items: 2,
    contact: "Zeynep Koç",
  },
];
const defaultCompanies: CompanyOption[] = [
  { id: 1, name: "Artemis Otomotiv A.Ş.", contact: "Murat Şahin" },
  { id: 2, name: "Mavi Hat Lojistik", contact: "Büşra Aydın" },
  { id: 3, name: "Nova Gıda Üretim", contact: "Emre Yıldız" },
  { id: 4, name: "Eksen Yapı Proje", contact: "Zeynep Koç" },
  { id: 5, name: "Meridyen Tekstil", contact: "Can Erdem" },
];
const emptyForm: FormState = { company: "", title: "", validUntil: "", total: "", items: "1", contact: "" };
const statuses: OfferStatus[] = ["Taslak", "Gönderildi", "Görüşülüyor", "Onaylandı", "Reddedildi", "Süresi doldu"];
const labelToDate = (value: string) => {
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const match = value.match(/^(\d{1,2})\s+([^\s]+)\s+(\d{4})$/);
  if (!match) return "";
  const month = months.indexOf(match[2]) + 1;
  return month ? `${match[3]}-${String(month).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}` : "";
};
const dateToLabel = (value: string) => {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" })
    .format(date)
    .replace(".", "");
};

export default function OffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState(initialOffers);
  const [companies, setCompanies] = useState(defaultCompanies);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OfferStatus | "Tümü">("Tümü");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortKey, setSortKey] = useState<SortKey>("number");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("hantech-offers");
      const storedCompanies = window.localStorage.getItem("hantech-companies");
      if (stored) {
        const parsed = JSON.parse(stored) as Offer[];
        if (Array.isArray(parsed)) setOffers(parsed);
      }
      if (storedCompanies) {
        const parsed = JSON.parse(storedCompanies) as Array<{
          id: number;
          name: string;
          contact: string;
          email?: string;
        }>;
        if (Array.isArray(parsed) && parsed.length > 0)
          setCompanies(parsed.map(({ id, name, contact, email }) => ({ id, name, contact, email })));
      }
    } catch {
      /* Keep demo records when storage is unavailable. */
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem("hantech-offers", JSON.stringify(offers));
  }, [offers, hydrated]);
  const filtered = useMemo(() => {
    const result = offers.filter(
      (offer) =>
        (status === "Tümü" || offer.status === status) &&
        `${offer.number} ${offer.company} ${offer.title} ${offer.contact}`
          .toLocaleLowerCase("tr-TR")
          .includes(query.toLocaleLowerCase("tr-TR")),
    );
    return result.sort((a, b) => {
      const first =
        sortKey === "number"
          ? a.number
          : sortKey === "company"
            ? a.company
            : sortKey === "status"
              ? a.status
              : sortKey === "total"
                ? a.total
                : a.validUntil;
      const second =
        sortKey === "number"
          ? b.number
          : sortKey === "company"
            ? b.company
            : sortKey === "status"
              ? b.status
              : sortKey === "total"
                ? b.total
                : b.validUntil;
      const comparison =
        typeof first === "number" && typeof second === "number"
          ? first - second
          : String(first).localeCompare(String(second), "tr");
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [offers, query, sortKey, sortDirection, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const totalValue = offers
    .filter((offer) => offer.status !== "Reddedildi")
    .reduce((sum, offer) => sum + offer.total, 0);
  const updateForm = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };
  const changeSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setPage(1);
  };
  const openNew = () => router.push("/teklifler/yeni");
  const openEdit = (offer: Offer) => {
    setForm({
      company: offer.company,
      title: offer.title,
      validUntil: labelToDate(offer.validUntil),
      total: String(offer.total),
      items: String(offer.items),
      contact: offer.contact,
    });
    setEditingId(offer.id);
    setFormOpen(true);
  };
  const saveOffer = () => {
    if (!form.company || !form.title.trim() || !form.validUntil || !form.total || Number(form.total) < 0) return;
    if (editingId !== null)
      setOffers((current) =>
        current.map((offer) =>
          offer.id === editingId
            ? {
                ...offer,
                company: form.company,
                title: form.title.trim(),
                validUntil: dateToLabel(form.validUntil),
                total: Number(form.total),
                items: Number(form.items) || 1,
                contact: form.contact,
              }
            : offer,
        ),
      );
    else
      setOffers((current) => [
        ...current,
        {
          id: Date.now(),
          number: `TEK-${new Date().getFullYear()}-${String(current.length + 1).padStart(3, "0")}`,
          company: form.company,
          title: form.title.trim(),
          status: "Taslak",
          total: Number(form.total),
          validUntil: dateToLabel(form.validUntil),
          createdAt: dateToLabel(new Date().toISOString().slice(0, 10)),
          items: Number(form.items) || 1,
          contact: form.contact,
        },
      ]);
    setFormOpen(false);
    setEditingId(null);
    showNotice("Teklif bilgileri demo olarak kaydedildi.");
  };
  const removeOffer = (offer: Offer) => {
    if (!window.confirm(`${offer.number} numaralı teklifi silmek istediğinize emin misiniz?`)) return;
    setOffers((current) => current.filter((item) => item.id !== offer.id));
    setSelectedId(null);
    showNotice("Teklif silindi.");
  };
  const updateStatus = (offer: Offer, nextStatus: OfferStatus) => {
    setOffers((current) => current.map((item) => (item.id === offer.id ? { ...item, status: nextStatus } : item)));
    showNotice("Teklif durumu güncellendi.");
  };
  return (
    <main className="mx-auto max-w-[1440px] pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#6f8982] dark:text-[#9ebbb3]">Teklif ve fiyatlandırma merkezi</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#103c3a] dark:text-[#ecfaf5]">
            Teklifler
          </h1>
          <p className="mt-2 text-sm text-[#81958f] dark:text-[#91b0a6]">
            Firmalarınıza sunduğunuz OSGB hizmet tekliflerini ve dönüş süreçlerini yönetin.
          </p>
        </div>
        <button
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#103c3a] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(16,60,58,0.14)] hover:bg-[#174e4b]"
          onClick={openNew}
          type="button"
        >
          <Plus className="size-4" /> Yeni teklif oluştur
        </button>
      </div>
      {notice && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#e5f5ec] px-3 py-2 text-xs font-semibold text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
          {notice}
        </p>
      )}
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <Summary label="Toplam teklif" value={offers.length} icon={FileText} />
        <Summary
          label="Açık teklifler"
          value={offers.filter((offer) => ["Gönderildi", "Görüşülüyor"].includes(offer.status)).length}
          icon={Send}
        />
        <Summary label="Teklif hacmi" value={money(totalValue)} icon={ClipboardList} />
      </div>
      <section
        aria-label="Teklif listesi filtreleri"
        className="mt-7 rounded-2xl border border-[#e0ece8] bg-white p-4 sm:p-5 dark:border-[#1d4941] dark:bg-[#0e2927]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">Teklif listesi</h2>
              <span className="rounded-full bg-[#e5f5ec] px-2 py-1 text-[10px] font-bold text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
                {filtered.length} kayıt
              </span>
            </div>
            <p className="mt-1 text-xs text-[#91a49f]">Teklifleri arayın, durumlarına göre filtreleyin ve sıralayın.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Durum"
              value={status}
              options={["Tümü", ...statuses]}
              onChange={(value) => {
                setStatus(value as OfferStatus | "Tümü");
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9ab1ab]" />
          <input
            aria-label="Teklif ara"
            className="h-11 w-full rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] pr-3 pl-9 text-sm outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white"
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Teklif no, firma, başlık veya yetkili ara..."
            value={query}
          />
        </div>
      </section>
      {selectedId !== null && (
        <OfferDetail
          offer={offers.find((offer) => offer.id === selectedId)}
          onClose={() => setSelectedId(null)}
          onEdit={openEdit}
          onDelete={removeOffer}
          onStatus={updateStatus}
        />
      )}
      {paged.length > 0 ? (
        <OfferTable
          offers={paged}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={changeSort}
          onSelect={setSelectedId}
          onEdit={openEdit}
          onDelete={removeOffer}
          onStatus={updateStatus}
        />
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[#dceee4] py-16 text-center dark:border-[#1d4941]">
          <FileText className="mx-auto size-8 text-[#9ab1ab]" />
          <p className="mt-3 text-sm font-semibold text-[#52776d] dark:text-[#c4dfd5]">
            Filtrelerle eşleşen teklif yok
          </p>
          <button
            className="mt-3 text-xs font-semibold text-[#278b70]"
            onClick={() => {
              setQuery("");
              setStatus("Tümü");
            }}
            type="button"
          >
            Filtreleri temizle
          </button>
        </div>
      )}
      <Pagination
        page={safePage}
        pageCount={pageCount}
        pageSize={pageSize}
        total={filtered.length}
        onPage={setPage}
        onPageSize={(value) => {
          setPageSize(value);
          setPage(1);
        }}
      />
      {formOpen && (
        <OfferForm
          form={form}
          companies={companies}
          editing={editingId !== null}
          setField={updateForm}
          onClose={() => setFormOpen(false)}
          onSave={saveOffer}
        />
      )}
    </main>
  );
}

const money = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value);
function Summary({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof FileText }) {
  return (
    <div className="rounded-2xl border border-[#e5eee9] bg-[#fbfdfc] p-4 dark:border-[#1d4941] dark:bg-[#102f2d]">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#81958f]">{label}</p>
        <Icon className="size-4 text-[#299b7c]" />
      </div>
      <p className="mt-2 text-xl font-semibold text-[#173e3b] dark:text-[#e8f7f1]">{value}</p>
    </div>
  );
}
function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="h-10 appearance-none rounded-xl border border-[#dbe9e4] bg-white pr-8 pl-3 text-xs font-medium text-[#52776d] outline-none dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-[#c4dfd5]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-[#81958f]" />
    </label>
  );
}
function OfferTable({
  offers,
  sortKey,
  sortDirection,
  onSort,
  onSelect,
  onEdit,
  onDelete,
  onStatus,
}: {
  offers: Offer[];
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  onSort: (key: SortKey) => void;
  onSelect: (id: number) => void;
  onEdit: (offer: Offer) => void;
  onDelete: (offer: Offer) => void;
  onStatus: (offer: Offer, status: OfferStatus) => void;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-[#e0ece8] bg-white dark:border-[#1d4941] dark:bg-[#0e2927]">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead className="border-b border-[#edf3f0] bg-[#fbfdfc] dark:border-[#1d4941] dark:bg-[#102f2d]">
            <tr>
              <th className="px-5 py-4">
                <SortButton
                  label="Teklif"
                  active={sortKey === "number"}
                  direction={sortDirection}
                  onClick={() => onSort("number")}
                />
              </th>
              <th className="px-5 py-4">
                <SortButton
                  label="Firma"
                  active={sortKey === "company"}
                  direction={sortDirection}
                  onClick={() => onSort("company")}
                />
              </th>
              <th className="px-5 py-4 text-[10px] font-bold tracking-[0.12em] text-[#91a49f] uppercase">
                Hizmet kapsamı
              </th>
              <th className="px-5 py-4">
                <SortButton
                  label="Durum"
                  active={sortKey === "status"}
                  direction={sortDirection}
                  onClick={() => onSort("status")}
                />
              </th>
              <th className="px-5 py-4">
                <SortButton
                  label="Toplam"
                  active={sortKey === "total"}
                  direction={sortDirection}
                  onClick={() => onSort("total")}
                />
              </th>
              <th className="px-5 py-4">
                <SortButton
                  label="Geçerlilik"
                  active={sortKey === "validUntil"}
                  direction={sortDirection}
                  onClick={() => onSort("validUntil")}
                />
              </th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf3f0] dark:divide-[#1d4941]">
            {offers.map((offer) => (
              <OfferRow
                key={offer.id}
                offer={offer}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatus={onStatus}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-[#edf3f0] md:hidden dark:divide-[#1d4941]">
        {offers.map((offer) => (
          <div className="flex items-start justify-between gap-3 p-4" key={offer.id}>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.08em] text-[#278b70]">{offer.number}</p>
              <button
                className="mt-1 text-left text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]"
                onClick={() => onSelect(offer.id)}
                type="button"
              >
                {offer.company}
              </button>
              <p className="mt-1 truncate text-xs text-[#81958f]">{offer.title}</p>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={offer.status} />
                <span className="text-xs font-semibold text-[#52776d] dark:text-[#bed8cf]">{money(offer.total)}</span>
              </div>
            </div>
            <button
              aria-label={`${offer.number} düzenle`}
              className="rounded-lg p-2 text-[#81958f]"
              onClick={() => onEdit(offer)}
              type="button"
            >
              <Edit3 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
function OfferRow({
  offer,
  onSelect,
  onEdit,
  onDelete,
  onStatus,
}: {
  offer: Offer;
  onSelect: (id: number) => void;
  onEdit: (offer: Offer) => void;
  onDelete: (offer: Offer) => void;
  onStatus: (offer: Offer, status: OfferStatus) => void;
}) {
  return (
    <tr className="transition hover:bg-[#f8fcfa] dark:hover:bg-[#12372f]">
      <td className="px-5 py-4">
        <button className="text-left" onClick={() => onSelect(offer.id)} type="button">
          <p className="text-xs font-bold tracking-[0.08em] text-[#278b70]">{offer.number}</p>
          <p className="mt-1 text-[11px] text-[#91a49f]">Oluşturuldu: {offer.createdAt}</p>
        </button>
      </td>
      <td className="px-5 py-4">
        <button className="flex items-center gap-3 text-left" onClick={() => onSelect(offer.id)} type="button">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#d8f0e4] text-xs font-bold text-[#1f8068] dark:bg-[#174638] dark:text-[#a7f3d0]">
            {offer.company
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")}
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">{offer.company}</span>
            <span className="mt-1 block text-xs text-[#91a49f]">Yetkili: {offer.contact}</span>
          </span>
        </button>
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[210px] truncate text-xs font-medium text-[#486761] dark:text-[#bed8cf]">{offer.title}</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-[#91a49f]">
          <ClipboardList className="size-3" />
          {offer.items} hizmet kalemi
        </p>
      </td>
      <td className="px-5 py-4">
        <select
          aria-label={`${offer.number} durumu`}
          className="h-8 max-w-[125px] rounded-full border-0 bg-transparent px-2 text-[10px] font-semibold text-[#52776d] outline-none dark:text-[#c4dfd5]"
          onChange={(event) => onStatus(offer, event.target.value as OfferStatus)}
          value={offer.status}
        >
          {statuses.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </td>
      <td className="px-5 py-4 text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">{money(offer.total)}</td>
      <td className="px-5 py-4 text-xs text-[#718783] dark:text-[#a7c9be]">
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3.5" />
          {offer.validUntil}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <button
            aria-label={`${offer.number} detaylarını gör`}
            className="rounded-lg p-2 text-[#81958f] hover:bg-[#ebf6f0] hover:text-[#258b71]"
            onClick={() => onSelect(offer.id)}
            type="button"
          >
            <Eye className="size-4" />
          </button>
          <button
            aria-label={`${offer.number} düzenle`}
            className="rounded-lg p-2 text-[#81958f] hover:bg-[#ebf6f0] hover:text-[#258b71]"
            onClick={() => onEdit(offer)}
            type="button"
          >
            <Edit3 className="size-4" />
          </button>
          <button
            aria-label={`${offer.number} sil`}
            className="rounded-lg p-2 text-[#a66f60] hover:bg-[#fff1ed] dark:hover:bg-[#49302c]"
            onClick={() => onDelete(offer)}
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.12em] text-[#91a49f] uppercase hover:text-[#278b70]"
      onClick={onClick}
      type="button"
    >
      {label}
      <ChevronsUpDown className={`size-3 ${active ? "text-[#299b7c]" : "text-[#b5c4bf]"}`} />
      {active && <span className="sr-only">{direction === "asc" ? "artan" : "azalan"}</span>}
    </button>
  );
}
function StatusBadge({ status }: { status: OfferStatus }) {
  const style =
    status === "Onaylandı"
      ? "bg-[#dff6eb] text-[#258b71] dark:bg-[#174638] dark:text-[#a7f3d0]"
      : status === "Reddedildi" || status === "Süresi doldu"
        ? "bg-[#f1e8e5] text-[#a66f60] dark:bg-[#49302c] dark:text-[#f0b3a5]"
        : status === "Görüşülüyor"
          ? "bg-[#fff1e2] text-[#a16c3e] dark:bg-[#4b3825] dark:text-[#f4c994]"
          : "bg-[#e7f0ed] text-[#52776d] dark:bg-[#24423a] dark:text-[#c4dfd5]";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${style}`}>{status}</span>;
}
function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  return (
    <div className="mt-4 flex flex-col gap-3 text-xs text-[#81958f] sm:flex-row sm:items-center sm:justify-between">
      <p>
        <strong className="text-[#486761] dark:text-[#bed8cf]">
          {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}
        </strong>{" "}
        / {total} teklif gösteriliyor
      </p>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          Sayfa başı
          <select
            aria-label="Sayfa başına teklif"
            className="h-9 rounded-lg border border-[#dbe9e4] bg-white px-2 text-xs dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-[#c4dfd5]"
            onChange={(event) => onPageSize(Number(event.target.value))}
            value={pageSize}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </label>
        <button
          aria-label="Önceki sayfa"
          className="rounded-lg border border-[#dbe9e4] p-2 disabled:opacity-40 dark:border-[#1d4941]"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          type="button"
        >
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((item) => (
          <button
            aria-current={item === page ? "page" : undefined}
            className={`size-8 rounded-lg text-xs font-semibold ${item === page ? "bg-[#299b7c] text-white" : "border border-[#dbe9e4] hover:bg-[#ebf6f0] dark:border-[#1d4941]"}`}
            key={item}
            onClick={() => onPage(item)}
            type="button"
          >
            {item}
          </button>
        ))}
        <button
          aria-label="Sonraki sayfa"
          className="rounded-lg border border-[#dbe9e4] p-2 disabled:opacity-40 dark:border-[#1d4941]"
          disabled={page === pageCount}
          onClick={() => onPage(page + 1)}
          type="button"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
function OfferDetail({
  offer,
  onClose,
  onEdit,
  onDelete,
  onStatus,
}: {
  offer?: Offer;
  onClose: () => void;
  onEdit: (offer: Offer) => void;
  onDelete: (offer: Offer) => void;
  onStatus: (offer: Offer, status: OfferStatus) => void;
}) {
  if (!offer) return null;
  return (
    <section className="mt-6 rounded-2xl border border-[#bfe3d0] bg-[#f7fcf9] p-5 sm:p-6 dark:border-[#1d4941] dark:bg-[#12372f]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-[#299b7c] uppercase">Teklif detayı · {offer.number}</p>
          <h2 className="mt-2 text-xl font-semibold text-[#173e3b] dark:text-[#e8f7f1]">{offer.title}</h2>
          <p className="mt-1 text-sm text-[#718783] dark:text-[#a7c9be]">
            {offer.company} · Yetkili: {offer.contact}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={offer.status} />
          <button
            aria-label="Teklif detayını kapat"
            className="rounded-lg p-2 text-[#81958f] hover:bg-[#e5f5ec] dark:hover:bg-[#174638]"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Info label="Teklif toplamı" value={money(offer.total)} icon={ClipboardList} />
        <Info label="Hizmet kalemi" value={`${offer.items} kalem`} icon={FileText} />
        <Info label="Geçerlilik" value={offer.validUntil} icon={CalendarDays} />
        <Info label="Oluşturulma" value={offer.createdAt} icon={UsersRound} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-[#103c3a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#174e4b]"
          onClick={() => onEdit(offer)}
          type="button"
        >
          <Edit3 className="size-3.5" /> Düzenle
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-[#cfe6da] bg-white px-3 py-2 text-xs font-semibold text-[#278b70] dark:border-[#37685a] dark:bg-[#153c36] dark:text-[#a7f3d0]"
          onClick={() => onStatus(offer, "Gönderildi")}
          type="button"
        >
          <Send className="size-3.5" /> Gönderildi olarak işaretle
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-[#f0d5cc] px-3 py-2 text-xs font-semibold text-[#a66f60] hover:bg-[#fff1ed] dark:border-[#59362f] dark:hover:bg-[#49302c]"
          onClick={() => onDelete(offer)}
          type="button"
        >
          <Trash2 className="size-3.5" /> Sil
        </button>
      </div>
    </section>
  );
}
function Info({ label, value, icon: Icon }: { label: string; value: string; icon: typeof ClipboardList }) {
  return (
    <div className="rounded-xl border border-[#dceee4] bg-white p-3 dark:border-[#1d4941] dark:bg-[#0e2927]">
      <Icon className="size-4 text-[#299b7c]" />
      <p className="mt-2 text-[10px] text-[#91a49f]">{label}</p>
      <p className="mt-1 truncate text-xs font-semibold text-[#31534f] dark:text-[#d3ebe2]">{value}</p>
    </div>
  );
}

function OfferForm({
  form,
  companies,
  editing,
  setField,
  onClose,
  onSave,
}: {
  form: FormState;
  companies: CompanyOption[];
  editing: boolean;
  setField: (key: keyof FormState, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const valid = Boolean(form.company && form.title.trim() && form.validUntil && form.total && Number(form.total) >= 0);
  const save = () => {
    if (!valid) {
      setSubmitted(true);
      return;
    }
    onSave();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#082421]/60 p-4 backdrop-blur-[3px]">
      <section
        aria-label="Teklif formu"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-[#0e2927]"
        role="dialog"
      >
        <div className="border-b border-[#dceee4] bg-[linear-gradient(135deg,#eef7f1_0%,#ffffff_72%)] px-6 py-5 sm:px-7 dark:border-[#1d4941] dark:bg-[linear-gradient(135deg,#173c34_0%,#0e2927_72%)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#d8f0e4] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
                <FileText className="size-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-[0.14em] text-[#299b7c] uppercase">Teklif kaydı</p>
                <h2 className="mt-1 text-xl font-semibold text-[#173e3b] dark:text-[#e8f7f1]">
                  {editing ? "Teklifi düzenle" : "Yeni teklif oluştur"}
                </h2>
                <p className="mt-1 text-xs text-[#81958f]">
                  Firma ve hizmet detaylarını belirleyerek teklif taslağı oluşturun.
                </p>
              </div>
            </div>
            <button
              aria-label="Teklif formunu kapat"
              className="rounded-xl p-2 text-[#81958f] hover:bg-[#ebf6f0] dark:hover:bg-[#174638]"
              onClick={onClose}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-7">
          <label className="text-sm font-medium text-[#31534f] sm:col-span-2 dark:text-[#c4dfd5]">
            Firma
            <select
              className={`mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white ${submitted && !form.company ? "border-[#c47b69]" : "border-[#dbe9e4]"}`}
              onChange={(event) => {
                const company = companies.find((item) => item.name === event.target.value);
                setField("company", event.target.value);
                if (company) setField("contact", company.contact);
              }}
              value={form.company}
            >
              <option value="">Firma seçin</option>
              {companies.map((company) => (
                <option key={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-[#31534f] sm:col-span-2 dark:text-[#c4dfd5]">
            Teklif başlığı
            <input
              className={`mt-2 h-11 w-full rounded-xl border bg-[#fbfdfc] px-3 text-sm outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white ${submitted && !form.title.trim() ? "border-[#c47b69]" : "border-[#dbe9e4]"}`}
              onChange={(event) => setField("title", event.target.value)}
              placeholder="Örn. 2026 yıllık sağlık taraması"
              value={form.title}
            />
          </label>
          <label className="text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
            Geçerlilik tarihi
            <input
              className={`mt-2 h-11 w-full rounded-xl border bg-[#fbfdfc] px-3 text-sm outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white ${submitted && !form.validUntil ? "border-[#c47b69]" : "border-[#dbe9e4]"}`}
              onChange={(event) => setField("validUntil", event.target.value)}
              type="date"
              value={form.validUntil}
            />
          </label>
          <label className="text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
            Toplam tutar (₺)
            <input
              className={`mt-2 h-11 w-full rounded-xl border bg-[#fbfdfc] px-3 text-sm outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white ${submitted && !form.total ? "border-[#c47b69]" : "border-[#dbe9e4]"}`}
              min="0"
              onChange={(event) => setField("total", event.target.value)}
              placeholder="0"
              type="number"
              value={form.total}
            />
          </label>
          <label className="text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
            Hizmet kalemi sayısı
            <input
              className="mt-2 h-11 w-full rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] px-3 text-sm outline-none dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white"
              min="1"
              onChange={(event) => setField("items", event.target.value)}
              type="number"
              value={form.items}
            />
          </label>
          <label className="text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
            Firma yetkilisi
            <input
              className="mt-2 h-11 w-full rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] px-3 text-sm outline-none dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white"
              onChange={(event) => setField("contact", event.target.value)}
              value={form.contact}
            />
          </label>
          {submitted && !valid && (
            <p className="rounded-xl border border-[#f3c9bd] bg-[#fff7f4] px-3 py-2.5 text-xs text-[#a66f60] sm:col-span-2 dark:border-[#59362f] dark:bg-[#3b2925] dark:text-[#f0b3a5]">
              Lütfen firma, başlık, geçerlilik tarihi ve geçerli bir toplam tutar girin.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-[#edf3f0] px-6 py-4 sm:px-7 dark:border-[#1d4941]">
          <button
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#718783] hover:bg-[#ebf6f0] dark:hover:bg-[#174638]"
            onClick={onClose}
            type="button"
          >
            Vazgeç
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-[#103c3a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#174e4b]"
            onClick={save}
            type="button"
          >
            <Check className="size-4" /> {editing ? "Değişiklikleri kaydet" : "Teklif taslağı oluştur"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
