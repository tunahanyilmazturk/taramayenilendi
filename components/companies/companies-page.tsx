"use client";

/* Frontend-only demo records hydrate from browser storage. */
/* eslint-disable react-hooks/set-state-in-effect */

import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Edit3,
  Eye,
  FileText,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Tag,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type Company = {
  id: number;
  name: string;
  sector: string;
  city: string;
  contact: string;
  email?: string;
  phone: string;
  employees: number;
  screenings: number;
  contract: "Aktif" | "Yenileniyor" | "Pasif";
  contractEnd: string;
  lastScreening: string;
};
type FormState = Omit<Company, "id" | "employees" | "screenings" | "lastScreening" | "city" | "email"> & {
  city: string;
  district: string;
  email: string;
  employees: string;
};
type SortKey = "name" | "employees" | "contract" | "lastScreening";

const initialCompanies: Company[] = [
  {
    id: 1,
    name: "Artemis Otomotiv A.Ş.",
    sector: "Otomotiv",
    city: "Kocaeli · Gebze",
    contact: "Murat Şahin",
    phone: "+90 262 000 00 00",
    employees: 248,
    screenings: 18,
    contract: "Aktif",
    contractEnd: "31 Ara 2026",
    lastScreening: "02 Eyl 2026",
  },
  {
    id: 2,
    name: "Mavi Hat Lojistik",
    sector: "Lojistik",
    city: "İstanbul · Tuzla",
    contact: "Büşra Aydın",
    phone: "+90 216 000 00 00",
    employees: 126,
    screenings: 12,
    contract: "Aktif",
    contractEnd: "18 Mar 2027",
    lastScreening: "28 Ağu 2026",
  },
  {
    id: 3,
    name: "Nova Gıda Üretim",
    sector: "Gıda üretimi",
    city: "Tekirdağ · Çerkezköy",
    contact: "Emre Yıldız",
    phone: "+90 282 000 00 00",
    employees: 384,
    screenings: 24,
    contract: "Yenileniyor",
    contractEnd: "15 Eyl 2026",
    lastScreening: "20 Ağu 2026",
  },
  {
    id: 4,
    name: "Eksen Yapı Proje",
    sector: "İnşaat",
    city: "İstanbul · Kadıköy",
    contact: "Zeynep Koç",
    phone: "+90 216 000 00 00",
    employees: 76,
    screenings: 7,
    contract: "Aktif",
    contractEnd: "07 Haz 2027",
    lastScreening: "12 Ağu 2026",
  },
  {
    id: 5,
    name: "Meridyen Tekstil",
    sector: "Tekstil",
    city: "Bursa · Nilüfer",
    contact: "Can Erdem",
    phone: "+90 224 000 00 00",
    employees: 214,
    screenings: 16,
    contract: "Pasif",
    contractEnd: "02 Tem 2026",
    lastScreening: "15 Tem 2026",
  },
];
const defaultSectors = ["Otomotiv", "Lojistik", "Gıda üretimi", "İnşaat", "Tekstil"];
const emptyForm: FormState = {
  name: "",
  sector: "",
  city: "",
  district: "",
  contact: "",
  email: "",
  phone: "",
  contract: "Aktif",
  contractEnd: "",
  employees: "",
};
const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const dateToLabel = (value: string) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day} ${monthNames[Number(month) - 1]} ${year}` : value;
};
const labelToDate = (value: string) => {
  const match = value.match(/^(\d{1,2})\s+([^\s]+)\s+(\d{4})$/);
  if (!match) return "";
  const month = monthNames.indexOf(match[2]) + 1;
  return month ? `${match[3]}-${String(month).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}` : "";
};

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState(initialCompanies);
  const [sectors, setSectors] = useState(defaultSectors);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tümü");
  const [city, setCity] = useState("Tüm şehirler");
  const [view, setView] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [formOpen, setFormOpen] = useState(false);
  const [sectorOpen, setSectorOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedId, setSelectedIdState] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);
  const setSelectedId = (id: number | null) => {
    if (id === null) setSelectedIdState(null);
    else router.push(`/firmalar/${id}`);
  };
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("hantech-companies");
      const storedSectors = window.localStorage.getItem("hantech-sectors");
      if (stored) {
        const parsed = JSON.parse(stored) as Company[];
        if (Array.isArray(parsed)) setCompanies(parsed);
      }
      if (storedSectors) {
        const parsed = JSON.parse(storedSectors) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) setSectors(parsed);
      }
    } catch {
      /* Use demo records if storage is unavailable. */
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem("hantech-companies", JSON.stringify(companies));
  }, [companies, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem("hantech-sectors", JSON.stringify(sectors));
  }, [sectors, hydrated]);
  const cities = useMemo(
    () => ["Tüm şehirler", ...new Set(companies.map((company) => company.city.split(" · ")[0]).filter(Boolean))],
    [companies],
  );
  const filtered = useMemo(() => {
    const result = companies.filter(
      (company) =>
        (status === "Tümü" || company.contract === status) &&
        (city === "Tüm şehirler" || company.city.startsWith(city)) &&
        `${company.name} ${company.sector} ${company.city} ${company.contact}`
          .toLocaleLowerCase("tr-TR")
          .includes(query.toLocaleLowerCase("tr-TR")),
    );
    return result.sort((a, b) => {
      const first =
        sortKey === "name"
          ? a.name
          : sortKey === "employees"
            ? a.employees
            : sortKey === "contract"
              ? a.contract
              : a.lastScreening;
      const second =
        sortKey === "name"
          ? b.name
          : sortKey === "employees"
            ? b.employees
            : sortKey === "contract"
              ? b.contract
              : b.lastScreening;
      const comparison =
        typeof first === "number" && typeof second === "number"
          ? first - second
          : String(first).localeCompare(String(second), "tr");
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [companies, query, status, city, sortKey, sortDirection]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedCompanies = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filtered.length);
  const setFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };
  const setField = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const changeSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setPage(1);
  };
  const openEdit = (company: Company) => {
    const [companyCity, companyDistrict = ""] = company.city.split(" · ");
    setForm({
      name: company.name,
      sector: company.sector,
      city: companyCity,
      district: companyDistrict,
      contact: company.contact,
      email: company.email ?? "",
      phone: company.phone,
      contract: company.contract,
      contractEnd: labelToDate(company.contractEnd),
      employees: String(company.employees ?? 0),
    });
    setEditingId(company.id);
    setFormOpen(true);
  };
  const saveCompany = () => {
    if (!form.name.trim() || !form.sector.trim() || !form.contact.trim()) return;
    const displayCity = [form.city.trim(), form.district.trim()].filter(Boolean).join(" · ");
    const employees = Math.max(0, Number(form.employees) || 0);
    if (editingId === null)
      setCompanies((current) => [
        ...current,
        {
          ...form,
          id: Date.now(),
          name: form.name.trim(),
          sector: form.sector.trim(),
          city: displayCity,
          contact: form.contact.trim(),
          email: form.email.trim(),
          employees,
          screenings: 0,
          contractEnd: dateToLabel(form.contractEnd),
          lastScreening: "Henüz yok",
        },
      ]);
    else
      setCompanies((current) =>
        current.map((company) =>
          company.id === editingId
            ? {
                ...company,
                name: form.name.trim(),
                sector: form.sector.trim(),
                city: displayCity,
                contact: form.contact.trim(),
                email: form.email.trim(),
                phone: form.phone,
                employees,
                contract: form.contract,
                contractEnd: dateToLabel(form.contractEnd),
              }
            : company,
        ),
      );
    setFormOpen(false);
    setEditingId(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };
  const removeCompany = (company: Company) => {
    if (!window.confirm(`${company.name} firmasını silmek istediğinize emin misiniz?`)) return;
    setCompanies((current) => current.filter((item) => item.id !== company.id));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };
  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(true);
  };
  const hasFilters = Boolean(query || status !== "Tümü" || city !== "Tüm şehirler");
  const clearFilters = () => {
    setQuery("");
    setStatus("Tümü");
    setCity("Tüm şehirler");
    setPage(1);
  };
  return (
    <main className="mx-auto max-w-[1440px] pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#6f8982] dark:text-[#9ebbb3]">Müşteri ve sözleşme merkezi</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#103c3a] dark:text-[#ecfaf5]">
            Firmalar
          </h1>
          <p className="mt-2 text-sm text-[#81958f] dark:text-[#91b0a6]">
            Hizmet verdiğiniz firmaları, sözleşmeleri ve tarama geçmişini yönetin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#cfe6da] bg-white px-4 py-3 text-sm font-semibold text-[#278b70] transition hover:bg-[#effaf4] dark:border-[#1d4941] dark:bg-[#0e2927] dark:text-[#a7f3d0] dark:hover:bg-[#174638]"
            onClick={() => setSectorOpen(true)}
            type="button"
          >
            <Settings2 className="size-4" /> Sektör yönetimi
          </button>
          <button
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#103c3a] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(16,60,58,0.14)] hover:bg-[#174e4b]"
            onClick={openNew}
            type="button"
          >
            <Plus className="size-4" /> Yeni firma ekle
          </button>
        </div>
      </div>
      {saved && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#e5f5ec] px-3 py-2 text-xs font-semibold text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
          Firma bilgileri demo olarak kaydedildi.
        </p>
      )}
      <section
        aria-label="Firma listesi filtreleri"
        className="mt-7 rounded-2xl border border-[#e0ece8] bg-white p-4 sm:p-5 dark:border-[#1d4941] dark:bg-[#0e2927]"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">Firma listesi</h2>
                <span className="rounded-full bg-[#e5f5ec] px-2 py-1 text-[10px] font-bold text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
                  {filtered.length} kayıt
                </span>
              </div>
              <p className="mt-1 text-xs text-[#91a49f]">Arama ve filtrelerle kayıtları hızlıca daraltın.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                label="Şehir"
                value={city}
                options={cities}
                onChange={(value) => setFilter(setCity, value)}
              />
              <div className="flex rounded-xl border border-[#dbe9e4] p-1 dark:border-[#1d4941]">
                <button
                  aria-label="Tablo görünümü"
                  className={`rounded-lg p-2 ${view === "table" ? "bg-[#d8f0e4] text-[#1f8068] dark:bg-[#174638] dark:text-[#a7f3d0]" : "text-[#81958f]"}`}
                  onClick={() => setView("table")}
                  type="button"
                >
                  <ClipboardList className="size-4" />
                </button>
                <button
                  aria-label="Kart görünümü"
                  className={`rounded-lg p-2 ${view === "cards" ? "bg-[#d8f0e4] text-[#1f8068] dark:bg-[#174638] dark:text-[#a7f3d0]" : "text-[#81958f]"}`}
                  onClick={() => setView("cards")}
                  type="button"
                >
                  <Building2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9ab1ab]" />
              <input
                aria-label="Firma ara"
                className="h-11 w-full rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] pr-3 pl-9 text-sm outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white"
                onChange={(event) => setFilter(setQuery, event.target.value)}
                placeholder="Firma adı, sektör veya yetkili ara..."
                value={query}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-1 text-[10px] font-bold tracking-[0.12em] text-[#91a49f] uppercase">Sözleşme</span>
              {["Tümü", "Aktif", "Yenileniyor", "Pasif"].map((item) => (
                <button
                  aria-pressed={status === item}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${status === item ? "border-[#299b7c] bg-[#d8f0e4] text-[#1f8068] dark:bg-[#174638] dark:text-[#a7f3d0]" : "border-[#dbe9e4] text-[#718783] hover:bg-[#f0faf4] dark:border-[#1d4941] dark:text-[#9ebbb3] dark:hover:bg-[#174638]"}`}
                  key={item}
                  onClick={() => setFilter(setStatus, item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
              {hasFilters && (
                <button
                  className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold text-[#a66f60] hover:bg-[#fff1ed] dark:hover:bg-[#49302c]"
                  onClick={clearFilters}
                  type="button"
                >
                  <RotateCcw className="size-3.5" /> Temizle
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
      {selectedId !== null && (
        <CompanyDetail
          company={companies.find((company) => company.id === selectedId)}
          onClose={() => setSelectedId(null)}
          onEdit={openEdit}
        />
      )}
      {view === "table" ? (
        <CompanyTable
          companies={pagedCompanies}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={changeSort}
          onSelect={setSelectedId}
          onEdit={openEdit}
          onDelete={removeCompany}
        />
      ) : (
        <CompanyCards companies={pagedCompanies} onSelect={setSelectedId} onEdit={openEdit} onDelete={removeCompany} />
      )}
      <Pagination
        page={safePage}
        pageCount={pageCount}
        pageSize={pageSize}
        total={filtered.length}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onPage={setPage}
        onPageSize={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
      {formOpen && (
        <CompanyForm
          form={form}
          sectors={sectors}
          editing={editingId !== null}
          setField={setField}
          onClose={() => setFormOpen(false)}
          onSave={saveCompany}
        />
      )}
      {sectorOpen && <SectorManager sectors={sectors} setSectors={setSectors} onClose={() => setSectorOpen(false)} />}
    </main>
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
function SortButton({
  label,
  column,
  active,
  direction,
  onSort,
}: {
  label: string;
  column: SortKey;
  active: boolean;
  direction: "asc" | "desc";
  onSort: (column: SortKey) => void;
}) {
  return (
    <button
      className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.12em] text-[#91a49f] uppercase hover:text-[#278b70]"
      onClick={() => onSort(column)}
      type="button"
    >
      {label}
      <ChevronsUpDown className={`size-3 ${active ? "text-[#299b7c]" : "text-[#b5c4bf]"}`} />
      {active && <span className="sr-only">{direction === "asc" ? "artan" : "azalan"}</span>}
    </button>
  );
}
function CompanyTable({
  companies,
  sortKey,
  sortDirection,
  onSort,
  onSelect,
  onEdit,
  onDelete,
}: {
  companies: Company[];
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  onSort: (column: SortKey) => void;
  onSelect: (id: number) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-[#e0ece8] bg-white dark:border-[#1d4941] dark:bg-[#0e2927]">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead className="border-b border-[#edf3f0] bg-[#fbfdfc] dark:border-[#1d4941] dark:bg-[#102f2d]">
            <tr>
              <th className="px-5 py-4">
                <SortButton
                  label="Firma"
                  column="name"
                  active={sortKey === "name"}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-5 py-4 text-[10px] font-bold tracking-[0.12em] text-[#91a49f] uppercase">
                Sektör / Konum
              </th>
              <th className="px-5 py-4">
                <SortButton
                  label="Çalışan"
                  column="employees"
                  active={sortKey === "employees"}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-5 py-4">
                <SortButton
                  label="Sözleşme"
                  column="contract"
                  active={sortKey === "contract"}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-5 py-4">
                <SortButton
                  label="Son tarama"
                  column="lastScreening"
                  active={sortKey === "lastScreening"}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf3f0] dark:divide-[#1d4941]">
            {companies.map((company) => (
              <tr className="transition hover:bg-[#f8fcfa] dark:hover:bg-[#12372f]" key={company.id}>
                <td className="px-5 py-4">
                  <button
                    className="flex items-center gap-3 text-left"
                    onClick={() => onSelect(company.id)}
                    type="button"
                  >
                    <Avatar name={company.name} />
                    <span>
                      <span className="block text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">
                        {company.name}
                      </span>
                      <span className="mt-1 block text-xs text-[#91a49f]">Yetkili: {company.contact}</span>
                    </span>
                  </button>
                </td>
                <td className="px-5 py-4">
                  <p className="text-xs font-medium text-[#486761] dark:text-[#bed8cf]">{company.sector}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[#91a49f]">
                    <MapPin className="size-3" />
                    {company.city}
                  </p>
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">
                  {company.employees}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={company.contract} />
                  <p className="mt-1 text-[10px] text-[#91a49f]">{company.contractEnd}</p>
                </td>
                <td className="px-5 py-4 text-xs text-[#718783] dark:text-[#9ebbb3]">
                  {company.lastScreening}
                  <p className="mt-1 text-[10px] text-[#91a49f]">{company.screenings} tarama</p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <button
                      aria-label={`${company.name} detaylarını gör`}
                      className="rounded-lg p-2 text-[#81958f] hover:bg-[#ebf6f0] hover:text-[#258b71]"
                      onClick={() => onSelect(company.id)}
                      type="button"
                    >
                      <Eye className="size-4" />
                    </button>
                    <button
                      aria-label={`${company.name} düzenle`}
                      className="rounded-lg p-2 text-[#81958f] hover:bg-[#ebf6f0] hover:text-[#258b71]"
                      onClick={() => onEdit(company)}
                      type="button"
                    >
                      <Edit3 className="size-4" />
                    </button>
                    <button
                      aria-label={`${company.name} sil`}
                      className="rounded-lg p-2 text-[#a66f60] hover:bg-[#fff1ed] dark:hover:bg-[#49302c]"
                      onClick={() => onDelete(company)}
                      type="button"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-[#edf3f0] md:hidden dark:divide-[#1d4941]">
        {companies.map((company) => (
          <CompanyCard company={company} key={company.id} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
      {companies.length === 0 && (
        <p className="py-12 text-center text-sm text-[#81958f]">Filtrelerle eşleşen firma bulunamadı.</p>
      )}
    </div>
  );
}
function CompanyCards({
  companies,
  onSelect,
  onEdit,
  onDelete,
}: {
  companies: Company[];
  onSelect: (id: number) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {companies.map((company) => (
        <article
          className="rounded-2xl border border-[#e0ece8] bg-white dark:border-[#1d4941] dark:bg-[#0e2927]"
          key={company.id}
        >
          <CompanyCard company={company} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} />
        </article>
      ))}
      {companies.length === 0 && (
        <p className="col-span-full py-12 text-center text-sm text-[#81958f]">Filtrelerle eşleşen firma bulunamadı.</p>
      )}
    </div>
  );
}
function CompanyCard({
  company,
  onSelect,
  onEdit,
  onDelete,
}: {
  company: Company;
  onSelect: (id: number) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <Avatar name={company.name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">{company.name}</p>
          <p className="mt-1 text-xs text-[#81958f]">
            {company.sector} · {company.city}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <span className="rounded-xl bg-[#f7fcf9] p-3 text-[#718783] dark:bg-[#102f2d]">
          Çalışan<strong className="mt-1 block text-sm text-[#31534f] dark:text-[#d3ebe2]">{company.employees}</strong>
        </span>
        <span className="rounded-xl bg-[#f7fcf9] p-3 text-[#718783] dark:bg-[#102f2d]">
          Son tarama
          <strong className="mt-1 block text-sm text-[#31534f] dark:text-[#d3ebe2]">{company.lastScreening}</strong>
        </span>
      </div>
      <div className="flex items-center justify-between">
        <StatusBadge status={company.contract} />
        <div className="flex gap-1">
          <button
            aria-label={`${company.name} detaylarını gör`}
            className="rounded-lg p-2 text-[#81958f] hover:bg-[#ebf6f0]"
            onClick={() => onSelect(company.id)}
            type="button"
          >
            <Eye className="size-4" />
          </button>
          <button
            aria-label={`${company.name} düzenle`}
            className="rounded-lg p-2 text-[#81958f] hover:bg-[#ebf6f0]"
            onClick={() => onEdit(company)}
            type="button"
          >
            <Edit3 className="size-4" />
          </button>
          <button
            aria-label={`${company.name} sil`}
            className="rounded-lg p-2 text-[#a66f60] hover:bg-[#fff1ed] dark:hover:bg-[#49302c]"
            onClick={() => onDelete(company)}
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d8f0e4] text-xs font-bold text-[#1f8068] dark:bg-[#174638] dark:text-[#a7f3d0]">
      {name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")}
    </span>
  );
}
function StatusBadge({ status }: { status: Company["contract"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${status === "Aktif" ? "bg-[#dff6eb] text-[#258b71] dark:bg-[#174638] dark:text-[#a7f3d0]" : status === "Yenileniyor" ? "bg-[#fff1e2] text-[#a16c3e] dark:bg-[#4b3825] dark:text-[#f4c994]" : "bg-[#f1e8e5] text-[#a66f60] dark:bg-[#49302c] dark:text-[#f0b3a5]"}`}
    >
      {status}
    </span>
  );
}
function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  rangeStart,
  rangeEnd,
  onPage,
  onPageSize,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).slice(
    Math.max(0, page - 3),
    Math.min(pageCount, page + 2),
  );
  return (
    <div className="mt-4 flex flex-col gap-3 text-xs text-[#81958f] sm:flex-row sm:items-center sm:justify-between">
      <p>
        <strong className="text-[#486761] dark:text-[#bed8cf]">
          {rangeStart}-{rangeEnd}
        </strong>{" "}
        / {total} firma gösteriliyor
      </p>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          Sayfa başı
          <select
            aria-label="Sayfa başına kayıt"
            className="h-9 rounded-lg border border-[#dbe9e4] bg-white px-2 text-xs dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-[#c4dfd5]"
            onChange={(event) => onPageSize(Number(event.target.value))}
            value={pageSize}
          >
            <option value="3">3</option>
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
function CompanyDetail({
  company,
  onClose,
  onEdit,
}: {
  company?: Company;
  onClose: () => void;
  onEdit: (company: Company) => void;
}) {
  if (!company) return null;
  return (
    <section className="mt-6 rounded-2xl border border-[#bfe3d0] bg-[#f7fcf9] p-5 sm:p-6 dark:border-[#1d4941] dark:bg-[#12372f]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-[#299b7c] uppercase">Firma özeti</p>
          <h2 className="mt-2 text-xl font-semibold text-[#173e3b] dark:text-[#e8f7f1]">{company.name}</h2>
          <p className="mt-1 text-sm text-[#718783] dark:text-[#a7c9be]">
            {company.sector} · {company.city} · Yetkili: {company.contact}
          </p>
        </div>
        <button
          aria-label="Firma detayını kapat"
          className="rounded-lg p-2 text-[#81958f] hover:bg-[#e5f5ec]"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Info label="Çalışan" value={String(company.employees)} icon={UsersRound} />
        <Info label="Tarama" value={String(company.screenings)} icon={ClipboardList} />
        <Info label="Sözleşme" value={company.contractEnd} icon={FileText} />
        <Info label="Telefon" value={company.phone} icon={Phone} />
      </div>
      <button
        className="mt-5 rounded-xl bg-[#103c3a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#174e4b]"
        onClick={() => onEdit(company)}
        type="button"
      >
        Firma bilgilerini düzenle
      </button>
    </section>
  );
}
function Info({ label, value, icon: Icon }: { label: string; value: string; icon: typeof UsersRound }) {
  return (
    <div className="rounded-xl border border-[#dceee4] bg-white p-3 dark:border-[#1d4941] dark:bg-[#0e2927]">
      <Icon className="size-4 text-[#299b7c]" />
      <p className="mt-2 text-[10px] text-[#91a49f]">{label}</p>
      <p className="mt-1 truncate text-xs font-semibold text-[#31534f] dark:text-[#d3ebe2]">{value}</p>
    </div>
  );
}
function CompanyForm({
  form,
  sectors,
  editing,
  setField,
  onClose,
  onSave,
}: {
  form: FormState;
  sectors: string[];
  editing: boolean;
  setField: (key: keyof FormState, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const isValid = Boolean(
    form.name.trim() && form.sector.trim() && form.city.trim() && form.contact.trim() && Number(form.employees) > 0,
  );
  const handleSave = () => {
    if (!isValid) {
      setSubmitted(true);
      return;
    }
    onSave();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#082421]/60 p-0 backdrop-blur-[3px] sm:items-center sm:p-6">
      <section
        aria-label="Firma formu"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[1.5rem] bg-white shadow-2xl sm:rounded-[1.5rem] dark:bg-[#0e2927]"
        role="dialog"
      >
        <div className="relative overflow-hidden border-b border-[#dceee4] bg-[linear-gradient(135deg,#effaf4_0%,#ffffff_68%)] px-5 pt-4 pb-4 sm:px-7 sm:pt-5 dark:border-[#1d4941] dark:bg-[linear-gradient(135deg,#123a32_0%,#0e2927_72%)]">
          <div className="absolute -top-16 -right-10 size-44 rounded-full border-[22px] border-[#d8f0e4]/70 dark:border-[#1a4a3d]/60" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#d1efdf] text-[#218667] dark:bg-[#1a4a3d] dark:text-[#a7f3d0]">
                <Building2 className="size-4" />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-[0.16em] text-[#299b7c] uppercase">Firma kaydı</p>
                <h2 className="mt-0.5 text-xl font-semibold tracking-[-0.03em] text-[#173e3b] dark:text-[#e8f7f1]">
                  {editing ? "Firma bilgilerini düzenle" : "Yeni firma ekle"}
                </h2>
                <p className="mt-1 hidden max-w-lg text-[11px] leading-4 text-[#718783] sm:block dark:text-[#a7c9be]">
                  OSGB hizmet süreçleri için firma profilini temel bilgilerle oluşturun.
                </p>
              </div>
            </div>
            <button
              aria-label="Firma formunu kapat"
              className="relative rounded-xl p-1.5 text-[#718783] transition hover:bg-white/80 hover:text-[#173e3b] dark:hover:bg-[#174638] dark:hover:text-white"
              onClick={onClose}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="relative mt-3 flex items-center gap-2 text-[10px] font-semibold text-[#4b766b] dark:text-[#a7c9be]">
            <span className="flex size-4 items-center justify-center rounded-full bg-[#299b7c] text-[9px] text-white">
              1
            </span>
            <span>Temel profil</span>
            <span className="h-px w-6 bg-[#acd7c0] dark:bg-[#286050]" />
            <span className="flex size-4 items-center justify-center rounded-full bg-[#cce8d9] text-[9px] text-[#278b70] dark:bg-[#1a4a3d] dark:text-[#8ddfbe]">
              2
            </span>
            <span>Hizmet detayları</span>
          </div>
        </div>
        <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-7">
          <FormSection
            icon={Building2}
            title="Firma kimliği"
            description="Firmanızı listelerde ve raporlarda tanımlayacak bilgiler."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                required
                error={submitted && !form.name.trim()}
                label="Firma unvanı"
                value={form.name}
                onChange={(value) => setField("name", value)}
                placeholder="Örn. HanTech Sanayi A.Ş."
              />
              <SelectField
                required
                error={submitted && !form.sector.trim()}
                label="Sektör"
                value={form.sector}
                onChange={(value) => setField("sector", value)}
                options={sectors}
                placeholder="Sektör seçin"
              />
              <FormField
                required
                error={submitted && Number(form.employees) <= 0}
                label="Çalışan sayısı"
                value={form.employees}
                onChange={(value) => setField("employees", value.replace(/[^0-9]/g, ""))}
                placeholder="Örn. 120"
                type="number"
              />
              <FormField
                label="İl"
                value={form.city}
                onChange={(value) => setField("city", value)}
                placeholder="Örn. İstanbul"
              />
              <FormField
                label="İlçe"
                value={form.district}
                onChange={(value) => setField("district", value)}
                placeholder="Örn. Ataşehir"
              />
            </div>
          </FormSection>
          <div className="grid gap-6 lg:grid-cols-2">
            <FormSection icon={UsersRound} title="İletişim kişisi" description="Firma yetkilisi ve iletişim bilgileri.">
              <div className="space-y-4">
                <FormField
                  required
                  error={submitted && !form.contact.trim()}
                  label="Firma yetkilisi"
                  value={form.contact}
                  onChange={(value) => setField("contact", value)}
                  placeholder="Ad soyad"
                />
                <FormField
                  label="E-posta"
                  value={form.email}
                  onChange={(value) => setField("email", value)}
                  placeholder="yetkili@firma.com"
                  type="email"
                />
                <FormField
                  label="Telefon"
                  value={form.phone}
                  onChange={(value) => setField("phone", value)}
                  placeholder="+90 5xx xxx xx xx"
                  type="tel"
                />
              </div>
            </FormSection>
            <FormSection
              icon={ShieldCheck}
              title="Sözleşme ve hizmet"
              description="Sözleşme durumunu ve yenileme takibini tanımlayın."
            >
              <div className="space-y-4">
                <FormField
                  icon={CalendarDays}
                  label="Sözleşme bitiş tarihi"
                  value={form.contractEnd}
                  onChange={(value) => setField("contractEnd", value)}
                  placeholder="Tarih seçin"
                  type="date"
                />
                <SelectField
                  label="Sözleşme durumu"
                  value={form.contract}
                  onChange={(value) => setField("contract", value)}
                  options={["Aktif", "Yenileniyor", "Pasif"]}
                />
              </div>
            </FormSection>
          </div>
          {submitted && !isValid && (
            <p className="flex items-center gap-2 rounded-xl border border-[#f3c9bd] bg-[#fff7f4] px-3 py-2.5 text-xs font-medium text-[#a66f60] dark:border-[#59362f] dark:bg-[#3b2925] dark:text-[#f0b3a5]">
              <FileText className="size-4" /> Lütfen zorunlu alanları doldurun.
            </p>
          )}
        </div>
        <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#edf3f0] bg-white/95 px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-8 dark:border-[#1d4941] dark:bg-[#0e2927]/95">
          <p className="text-[11px] text-[#91a49f]">Daha sonra firma detaylarından güncelleyebilirsiniz.</p>
          <div className="flex justify-end gap-3">
            <button
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#718783] transition hover:bg-[#ebf6f0] dark:hover:bg-[#174638]"
              onClick={onClose}
              type="button"
            >
              Vazgeç
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#103c3a] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(16,60,58,0.16)] transition hover:bg-[#174e4b]"
              onClick={handleSave}
              type="button"
            >
              <Check className="size-4" /> {editing ? "Değişiklikleri kaydet" : "Firmayı oluştur"}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e1eee8] bg-[#fbfdfc] p-4 sm:p-5 dark:border-[#1d4941] dark:bg-[#102f2d]">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e4f5eb] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
          <Icon className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-[#81958f]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  error = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  error?: boolean;
}) {
  return (
    <label className="text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
      {label}
      {required && <span className="ml-1 text-[#299b7c]">*</span>}
      <span className="relative mt-2 block">
        <select
          aria-invalid={error}
          className={`h-11 w-full appearance-none rounded-xl border bg-white px-3 pr-9 text-sm outline-none focus:border-[#55b99c] dark:bg-[#0e2927] dark:text-white ${error ? "border-[#d58b7b]" : "border-[#dbe9e4] dark:border-[#1d4941]"}`}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#81958f]" />
      </span>
    </label>
  );
}
function SectorManager({
  sectors,
  setSectors,
  onClose,
}: {
  sectors: string[];
  setSectors: (sectors: string[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const save = () => {
    const value = draft.trim();
    if (!value) return;
    if (editing) setSectors(sectors.map((sector) => (sector === editing ? value : sector)));
    else if (!sectors.some((sector) => sector.toLocaleLowerCase("tr-TR") === value.toLocaleLowerCase("tr-TR")))
      setSectors([...sectors, value]);
    setDraft("");
    setEditing(null);
  };
  const startEdit = (sector: string) => {
    setEditing(sector);
    setDraft(sector);
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#082421]/60 p-4 backdrop-blur-[3px]">
      <section
        aria-label="Sektör yönetimi"
        aria-modal="true"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7 dark:bg-[#0e2927]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#d8f0e4] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
              <Tag className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-[#299b7c] uppercase">Tanımlamalar</p>
              <h2 className="mt-1 text-xl font-semibold text-[#173e3b] dark:text-[#e8f7f1]">Sektör yönetimi</h2>
              <p className="mt-1 text-xs text-[#81958f]">Firma kayıtlarında kullanılacak sektörleri yönetin.</p>
            </div>
          </div>
          <button
            aria-label="Sektör yönetimini kapat"
            className="rounded-xl p-2 text-[#81958f] hover:bg-[#ebf6f0] dark:hover:bg-[#174638]"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-6 flex gap-2">
          <input
            aria-label="Sektör adı"
            className="h-11 min-w-0 flex-1 rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] px-3 text-sm outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") save();
            }}
            placeholder="Yeni sektör adı"
            value={draft}
          />
          <button
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#103c3a] px-3.5 text-sm font-semibold text-white hover:bg-[#174e4b]"
            onClick={save}
            type="button"
          >
            <Plus className="size-4" />
            {editing ? "Güncelle" : "Ekle"}
          </button>
        </div>
        <div className="mt-5 divide-y divide-[#edf3f0] rounded-2xl border border-[#e1eee8] dark:divide-[#1d4941] dark:border-[#1d4941]">
          {sectors.map((sector) => (
            <div className="flex items-center justify-between gap-3 px-4 py-3" key={sector}>
              <span className="flex items-center gap-2 text-sm font-medium text-[#31534f] dark:text-[#d3ebe2]">
                <span className="size-2 rounded-full bg-[#299b7c]" />
                {sector}
              </span>
              <div className="flex gap-1">
                <button
                  aria-label={`${sector} düzenle`}
                  className="rounded-lg p-2 text-[#81958f] hover:bg-[#ebf6f0] hover:text-[#278b70] dark:hover:bg-[#174638]"
                  onClick={() => startEdit(sector)}
                  type="button"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  aria-label={`${sector} sil`}
                  className="rounded-lg p-2 text-[#a66f60] hover:bg-[#fff1ed] dark:hover:bg-[#49302c]"
                  onClick={() => {
                    if (editing === sector) {
                      setEditing(null);
                      setDraft("");
                    }
                    setSectors(sectors.filter((item) => item !== sector));
                  }}
                  type="button"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end border-t border-[#edf3f0] pt-4 dark:border-[#1d4941]">
          <button
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#718783] hover:bg-[#ebf6f0] dark:hover:bg-[#174638]"
            onClick={onClose}
            type="button"
          >
            Tamam
          </button>
        </div>
      </section>
    </div>
  );
}
function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  error = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  error?: boolean;
  icon?: typeof CalendarDays;
}) {
  return (
    <label className="text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
      {label}
      {required && <span className="ml-1 text-[#299b7c]">*</span>}
      <span className="relative mt-2 block">
        {Icon && (
          <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#91b6aa]" />
        )}
        <input
          aria-invalid={error}
          className={`h-11 w-full rounded-xl border bg-white px-3 text-sm transition outline-none placeholder:text-[#a2b7b0] focus:border-[#55b99c] dark:bg-[#0e2927] dark:text-white dark:placeholder:text-[#75968c] ${Icon ? "pl-10" : ""} ${error ? "border-[#d58b7b] focus:border-[#d58b7b]" : "border-[#dbe9e4] dark:border-[#1d4941]"}`}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      </span>
    </label>
  );
}
