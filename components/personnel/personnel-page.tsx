"use client";

import { AlertTriangle, Check, Download, FileSpreadsheet, FileText, Pencil, Plus, RotateCcw, Search, Trash2, Upload, UsersRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Badge, CountPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert, ConfirmDialog, Modal } from "@/components/ui/modal";
import { Page, PageHeader } from "@/components/ui/page-header";
import { VisualFilterSurface } from "@/components/ui/visual-filter-surface";
import { ListViewToggle } from "@/components/ui/list-view-toggle";
import { Pagination, paginate } from "@/components/ui/pagination";
import { SearchableCompanySelect } from "@/components/ui/searchable-company-select";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Avatar, DataTable, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { useCompanies, usePersonnel } from "@/lib/data";
import { personnelStatuses, nextPersonnelId, type Personnel, type PersonnelStatus } from "@/lib/personnel";
import { isoToLabel, labelToIso, todayIso } from "@/lib/format";
import { useConfirm, useNotice } from "@/lib/hooks";
import { cn, compareTr, includesQuery, initials } from "@/lib/utils";

type PersonnelForm = Omit<Personnel, "id" | "createdAt">;
type ImportRow = { rowNumber: number; data: PersonnelForm; errors: string[] };
type PdfTextItem = { str: string; x: number; y: number };

const emptyForm = (companyId: number): PersonnelForm => ({
  companyId,
  employeeNo: "",
  nationalId: "",
  name: "",
  birthDate: "",
  title: "",
  department: "",
  email: "",
  phone: "",
  startDate: todayIso(),
  status: "Aktif",
  notes: "",
});

const statusTone: Record<PersonnelStatus, "brand" | "warning" | "danger"> = { Aktif: "brand", İzinli: "warning", Pasif: "danger" };

export default function PersonnelPage() {
  return <Suspense fallback={null}><PersonnelPageInner /></Suspense>;
}

function PersonnelPageInner() {
  const [companies] = useCompanies();
  const [personnel, setPersonnel] = usePersonnel();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("Tümü");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [departmentFilter, setDepartmentFilter] = useState("Tümü");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [view, setView] = useState<"table" | "cards">("table");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editor, setEditor] = useState<{ open: boolean; item: Personnel | null }>({ open: false, item: null });
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [importError, setImportError] = useState("");
  const [importCompanyId, setImportCompanyId] = useState(companies[0]?.id ?? 0);
  const [importDate, setImportDate] = useState(todayIso());
  const [isReading, setIsReading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const excelFileRef = useRef<HTMLInputElement>(null);
  const pdfFileRef = useRef<HTMLInputElement>(null);
  const [notice, showNotice] = useNotice(3500);
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => {
    const editId = Number(searchParams.get("duzenle"));
    if (!editId) return;
    const item = personnel.find((entry) => entry.id === editId);
    if (!item) return;
    const timer = window.setTimeout(() => setEditor({ open: true, item }), 0);
    window.history.replaceState({}, "", "/personeller");
    return () => window.clearTimeout(timer);
  }, [personnel, searchParams]);

  const departments = useMemo(() => ["Tümü", ...Array.from(new Set(personnel.map((item) => item.department).filter(Boolean))).sort(compareTr)], [personnel]);
  const filtered = useMemo(() => personnel.filter((item) => {
    const company = companies.find((entry) => entry.id === item.companyId);
    return (companyFilter === "Tümü" || item.companyId === Number(companyFilter)) &&
      (statusFilter === "Tümü" || item.status === statusFilter) &&
      (departmentFilter === "Tümü" || item.department === departmentFilter) &&
      includesQuery(`${item.name} ${item.employeeNo} ${item.title} ${item.department} ${item.email} ${company?.name ?? ""}`, query);
  }).sort((a, b) => compareTr(a.name, b.name)), [companies, companyFilter, departmentFilter, personnel, query, statusFilter]);
  const { safePage, items: paged } = paginate(filtered, page, pageSize);
  const hasFilters = Boolean(query || companyFilter !== "Tümü" || statusFilter !== "Tümü" || departmentFilter !== "Tümü");

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setQuery("");
    setCompanyFilter("Tümü");
    setStatusFilter("Tümü");
    setDepartmentFilter("Tümü");
    resetPage();
  };
  const toggleSelected = (id: number) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const togglePageSelection = () => {
    const pageIds = paged.map((item) => item.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => allSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])));
  };
  const removeSelected = () => {
    if (!selectedIds.length) return;
    const count = selectedIds.length;
    confirm({ title: "Seçilen personelleri sil", description: `${count} personel kaydı kalıcı olarak silinecek.`, confirmLabel: "Personelleri sil", onConfirm: () => { setPersonnel((current) => current.filter((item) => !selectedIds.includes(item.id))); setSelectedIds([]); showNotice(`${count} personel silindi.`); } });
  };
  const openNew = () => { setEditor({ open: true, item: null }); };
  const openEdit = (item: Personnel) => setEditor({ open: true, item });
  const save = (form: PersonnelForm) => {
    const values = { ...form, name: form.name.trim(), employeeNo: form.employeeNo.trim(), email: form.email.trim(), phone: form.phone.trim() };
    if (values.employeeNo && personnel.some((item) => item.id !== editor.item?.id && item.companyId === values.companyId && item.employeeNo === values.employeeNo)) {
      showNotice("Bu firmada aynı personel numarası zaten kayıtlı.");
      return;
    }
    setPersonnel((current) => editor.item ? current.map((item) => item.id === editor.item!.id ? { ...item, ...values } : item) : [...current, { ...values, id: nextPersonnelId(current), createdAt: todayIso() }]);
    setEditor({ open: false, item: null });
    showNotice(editor.item ? "Personel bilgileri güncellendi." : "Personel firmaya eklendi.");
  };
  const remove = (item: Personnel) => confirm({ title: "Personeli sil", description: `${item.name} personel kaydı kalıcı olarak silinecek.`, confirmLabel: "Personeli sil", onConfirm: () => { setPersonnel((current) => current.filter((entry) => entry.id !== item.id)); setSelectedIds((current) => current.filter((id) => id !== item.id)); showNotice("Personel kaydı silindi."); } });

  const openImport = () => {
    setImportCompanyId(companies[0]?.id ?? 0);
    setImportDate(todayIso());
    setImportFiles([]);
    setImportFileName("");
    setImportRows([]);
    setImportError("");
    setImportOpen(true);
  };
  const handleFiles = async (files: File[], companyId = importCompanyId, startDate = importDate) => {
    if (!files.length) return;
    if (!companyId) { showNotice("Toplu aktarım için önce firma seçin."); return; }
    const isPdfBatch = files.every((file) => file.name.toLocaleLowerCase().endsWith(".pdf"));
    const isSpreadsheetBatch = files.every((file) => file.name.toLocaleLowerCase().endsWith(".xlsx") || file.name.toLocaleLowerCase().endsWith(".csv"));
    if (!isPdfBatch && !isSpreadsheetBatch) {
      setImportError("Aynı seçimde yalnızca PDF dosyalarını veya tek bir Excel/CSV dosyasını aktarabilirsiniz.");
      return;
    }
    if (isSpreadsheetBatch && files.length > 1) {
      setImportError("Excel/CSV aktarımı için tek dosya seçin. Birden fazla dosya seçimi yalnızca Ek-2 PDF için desteklenir.");
      return;
    }
    setImportFiles(files);
    setImportFileName(files.length > 1 ? `${files.length} Ek-2 PDF dosyası seçildi` : files[0].name);
    setImportError("");
    setIsReading(true);
    try {
      const rows = isPdfBatch
        ? (await Promise.all(files.map((file) => parsePersonnelPdf(file, companyId, startDate)))).flat().map((row, index) => ({ ...row, rowNumber: index + 1 }))
        : await parsePersonnelFile(files[0], companyId, startDate);
      setImportRows(rows);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Dosya okunamadı.");
    } finally {
      setIsReading(false);
      if (excelFileRef.current) excelFileRef.current.value = "";
      if (pdfFileRef.current) pdfFileRef.current.value = "";
    }
  };
  const updateImportSettings = (companyId: number, startDate: string) => {
    setImportCompanyId(companyId); setImportDate(startDate);
    if (importFiles.length) void handleFiles(importFiles, companyId, startDate);
  };
  const importValidRows = () => {
    const valid = importRows.filter((row) => row.errors.length === 0);
    if (!valid.length) return;
    setPersonnel((current) => {
      const next = [...current];
      valid.forEach(({ data }) => {
        const existingIndex = data.employeeNo ? next.findIndex((item) => item.companyId === data.companyId && item.employeeNo === data.employeeNo) : -1;
        if (existingIndex >= 0) next[existingIndex] = { ...next[existingIndex], ...data };
        else next.push({ ...data, id: nextPersonnelId(next), createdAt: todayIso() });
      });
      return next;
    });
    setImportOpen(false); showNotice(`${valid.length} personel satırı içe aktarıldı. Aynı personel numaraları güncellendi.`);
  };

  return <Page>
    <VisualFilterSurface visual="/headers/personnel.png">
    <PageHeader
      className="border-0 bg-transparent p-0 shadow-none before:hidden"
      actions={<div className="flex max-w-full flex-nowrap gap-2 overflow-x-auto pb-1"><input accept=".xlsx,.csv" className="hidden" onChange={(event) => void handleFiles(Array.from(event.target.files ?? []))} ref={excelFileRef} type="file" /><input accept=".pdf" className="hidden" multiple onChange={(event) => void handleFiles(Array.from(event.target.files ?? []))} ref={pdfFileRef} type="file" /><Button onClick={openImport} size="sm" variant="outline"><Upload /> Toplu personel ekle</Button><Button onClick={() => void exportPersonnelExcel(filtered, companies, false)} size="sm" variant="outline"><Download /> Excel&apos;e aktar</Button><Button onClick={() => void exportPersonnelExcel([], companies, true)} size="sm" variant="secondary"><FileSpreadsheet /> Şablon indir</Button><Button onClick={openNew} size="sm"><Plus /> Personel ekle</Button></div>}
      description="Firmalara bağlı çalışan kayıtlarını, toplu Excel aktarımını ve veri kalitesini tek merkezden yönetin."
      eyebrow="Firma çalışanları"
      title="Personeller"
      dark
    />
    {notice && <Alert className="mt-4" icon={Check}>{notice}</Alert>}
    {selectedIds.length > 0 && <Card className="border-brand/30 bg-brand-soft/40 mt-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-foreground text-sm font-medium"><strong>{selectedIds.length}</strong> personel seçildi.</p><Button onClick={removeSelected} size="sm" variant="danger"><Trash2 /> Seçilenleri sil</Button></Card>}
    <Card aria-label="Personel listesi filtreleri" className="mt-5 border-0 bg-transparent p-0 shadow-none"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><h2 className="text-foreground text-sm font-semibold">Personel listesi</h2><CountPill>{filtered.length} kayıt</CountPill></div><p className="text-subtle mt-1 text-xs">Arama ve filtrelerle firma çalışanlarını hızlıca daraltın.</p></div><div className="flex flex-wrap items-center gap-2"><Field label="Firma"><Select aria-label="Firma filtresi" className="h-10 min-w-52" onChange={(event) => { setCompanyFilter(event.target.value); resetPage(); }} value={companyFilter}><option value="Tümü">Tüm firmalar</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select></Field><Field label="Durum"><Select aria-label="Durum filtresi" className="h-10 min-w-36" onChange={(event) => { setStatusFilter(event.target.value); resetPage(); }} value={statusFilter}><option>Tümü</option>{personnelStatuses.map((status) => <option key={status}>{status}</option>)}</Select></Field><Field label="Departman"><Select aria-label="Departman filtresi" className="h-10 min-w-44" onChange={(event) => { setDepartmentFilter(event.target.value); resetPage(); }} value={departmentFilter}>{departments.map((department) => <option key={department}>{department}</option>)}</Select></Field>{hasFilters && <Button onClick={clearFilters} size="sm" variant="danger"><RotateCcw /> Temizle</Button>}</div></div><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><Field className="min-w-0 flex-1" label="Personel ara"><span className="relative block"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" /><Input aria-label="Personel ara" className="h-10 pl-9" onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="Ad, personel no, görev veya firma ara..." value={query} /></span></Field><ListViewToggle onCards={() => setView("cards")} onList={() => setView("table")} value={view} /></div></Card>
    <ListToolbar advancedOpen={advancedOpen} count={filtered.length} description="Arama ve gelişmiş filtrelerle personel kayıtlarını hızlıca daraltın." onAdvanced={() => setAdvancedOpen((value) => !value)} onCards={() => setView("cards")} onList={() => setView("table")} onQuery={(value) => { setQuery(value); resetPage(); }} placeholder="Ad, personel no, görev veya firma ara..." query={query} title="Personel listesi" view={view}>
      <SearchableCompanySelect companies={companies} includeAll onChange={(value) => { setCompanyFilter(String(value ?? "Tümü")); resetPage(); }} value={companyFilter} />
      <Select aria-label="Durum filtresi" onChange={(event) => { setStatusFilter(event.target.value); resetPage(); }} value={statusFilter}><option>Tümü</option>{personnelStatuses.map((status) => <option key={status}>{status}</option>)}</Select>
      <Select aria-label="Departman filtresi" onChange={(event) => { setDepartmentFilter(event.target.value); resetPage(); }} value={departmentFilter}>{departments.map((department) => <option key={department}>{department}</option>)}</Select>
      {hasFilters && <Button onClick={clearFilters} size="sm" variant="danger"><RotateCcw /> Filtreleri temizle</Button>}
    </ListToolbar>
    </VisualFilterSurface>
    {view === "cards" ? <div className="mt-5 grid gap-4 xl:grid-cols-2">{paged.map((item) => <Card key={item.id}><MobilePersonnel company={companies.find((company) => company.id === item.companyId)?.name ?? "Firma bulunamadı"} item={item} onDelete={() => remove(item)} onEdit={() => openEdit(item)} selected={selectedIds.includes(item.id)} onToggle={() => toggleSelected(item.id)} /></Card>)}</div> : <DataTable className="mt-5" empty={filtered.length === 0 ? <EmptyState compact className="rounded-none border-0" description="Filtreleri değiştirin veya yeni personel ekleyin." icon={UsersRound} title="Personel bulunamadı" /> : undefined} mobile={paged.map((item) => <MobilePersonnel company={companies.find((company) => company.id === item.companyId)?.name ?? "Firma bulunamadı"} item={item} key={item.id} onDelete={() => remove(item)} onEdit={() => openEdit(item)} selected={selectedIds.includes(item.id)} onToggle={() => toggleSelected(item.id)} />)}><THead><Tr><Th><input aria-label="Sayfadaki personelleri seç" checked={paged.length > 0 && paged.every((item) => selectedIds.includes(item.id))} className="size-4 accent-brand" onChange={togglePageSelection} type="checkbox" /></Th><Th>Personel</Th><Th>Firma</Th><Th>Görev / departman</Th><Th>İletişim</Th><Th>Durum</Th><Th>İşe giriş</Th><Th className="text-right">İşlem</Th></Tr></THead><TBody>{paged.map((item) => <Tr key={item.id}><Td><input aria-label={`${item.name} seç`} checked={selectedIds.includes(item.id)} className="size-4 accent-brand" onChange={() => toggleSelected(item.id)} type="checkbox" /></Td><Td><div className="flex items-center gap-3"><Avatar size="sm" text={initials(item.name)} /><div><Link className="text-xs font-semibold text-foreground hover:text-brand" href={`/personeller/${item.id}`}>{item.name}</Link><p className="text-[11px] text-muted">{item.employeeNo || "Personel no yok"}</p></div></div></Td><Td><span className="text-xs font-medium text-foreground">{companies.find((company) => company.id === item.companyId)?.name ?? "Firma bulunamadı"}</span></Td><Td><p className="text-xs font-semibold text-foreground">{item.title || "Görev belirtilmedi"}</p><p className="text-[11px] text-muted">{item.department || "Departman belirtilmedi"}</p></Td><Td><p className="text-[11px] text-muted">{item.email || "E-posta yok"}</p><p className="mt-1 text-[11px] text-muted">{item.phone || "Telefon yok"}</p></Td><Td><Badge tone={statusTone[item.status]}>{item.status}</Badge></Td><Td><span className="text-xs text-muted">{isoToLabel(item.startDate) || "Belirtilmedi"}</span></Td><Td><div className="flex justify-end gap-1"><Button aria-label={`${item.name} düzenle`} onClick={() => openEdit(item)} size="icon-sm" variant="ghost"><Pencil /></Button><Button aria-label={`${item.name} sil`} onClick={() => remove(item)} size="icon-sm" variant="danger"><Trash2 /></Button></div></Td></Tr>)}</TBody></DataTable>}
    <Pagination noun="personel" onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} page={safePage} pageSize={pageSize} total={filtered.length} />
    <PersonnelModal companies={companies} item={editor.item} key={`${editor.item?.id ?? "new"}-${editor.open}`} onClose={() => setEditor({ open: false, item: null })} onSave={save} open={editor.open} />
    <ImportModal companies={companies} companyId={importCompanyId} date={importDate} error={importError} fileName={importFileName} isReading={isReading} onClose={() => setImportOpen(false)} onConfirm={importValidRows} onDateChange={(date) => updateImportSettings(importCompanyId, date)} onPickExcel={() => excelFileRef.current?.click()} onPickPdf={() => pdfFileRef.current?.click()} onCompanyChange={(companyId) => updateImportSettings(companyId, importDate)} open={importOpen} rows={importRows} />
    <ConfirmDialog onClose={closeConfirm} request={confirmRequest} />
  </Page>;
}

function MobilePersonnel({ company, item, onDelete, onEdit, onToggle, selected }: { company: string; item: Personnel; onDelete: () => void; onEdit: () => void; onToggle: () => void; selected: boolean }) { return <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><input aria-label={`${item.name} seç`} checked={selected} className="size-4 accent-brand" onChange={onToggle} type="checkbox" /><Avatar size="sm" text={initials(item.name)} /><div><Link className="text-xs font-semibold text-foreground hover:text-brand" href={`/personeller/${item.id}`}>{item.name}</Link><p className="text-[11px] text-muted">{company} · {item.title || "Görev belirtilmedi"}</p></div></div><Badge tone={statusTone[item.status]}>{item.status}</Badge></div><div className="mt-3 flex items-center justify-between text-[11px] text-muted"><span>{item.employeeNo || "Personel no yok"}</span><span>{item.department || "Departman yok"}</span></div><div className="mt-3 flex justify-end gap-2"><Button onClick={onEdit} size="sm" variant="outline"><Pencil /> Düzenle</Button><Button onClick={onDelete} size="sm" variant="danger"><Trash2 /> Sil</Button></div></div>; }

function PersonnelModal({ companies, item, onClose, onSave, open }: { companies: ReturnType<typeof useCompanies>[0]; item: Personnel | null; onClose: () => void; onSave: (form: PersonnelForm) => void; open: boolean }) {
  const [form, setForm] = useState<PersonnelForm>(() => item ? { companyId: item.companyId, employeeNo: item.employeeNo, nationalId: item.nationalId, name: item.name, birthDate: item.birthDate, title: item.title, department: item.department, email: item.email, phone: item.phone, startDate: item.startDate, status: item.status, notes: item.notes } : emptyForm(companies[0]?.id ?? 0));
  const [submitted, setSubmitted] = useState(false);
  const errors = { companyId: form.companyId ? "" : "Firma seçin.", name: form.name.trim() ? "" : "Ad soyad zorunludur." };
  const setField = <K extends keyof PersonnelForm>(key: K, value: PersonnelForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = () => { setSubmitted(true); if (errors.companyId || errors.name) return; onSave(form); };
  return <Modal description="Personeli firmaya bağlayın; temel kimlik, görev ve iletişim bilgilerini tek adımda kaydedin." footer={<><Button onClick={onClose} variant="outline">Vazgeç</Button><Button onClick={submit}><Check /> {item ? "Değişiklikleri kaydet" : "Personeli ekle"}</Button></>} icon={item ? Pencil : Plus} onClose={onClose} open={open} size="lg" title={item ? "Personeli düzenle" : "Firmaya personel ekle"}>
    <div className="space-y-6">
      <section><div className="mb-3 flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-xs font-bold text-brand-soft-fg">1</span><div><h3 className="text-sm font-semibold text-heading">Firma ve kimlik</h3><p className="text-[11px] text-muted">Personelin bağlı olduğu firma ve ayırt edici bilgileri.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><Field error={submitted ? errors.companyId : ""} hint="Personelin kayıtlı olduğu firmayı seçin." label="Firma" required><SearchableCompanySelect companies={companies} invalid={submitted && Boolean(errors.companyId)} onChange={(value) => setField("companyId", Number(value ?? 0))} value={form.companyId} /></Field><Field hint="Firmanın kendi sicil numarasını kullanabilirsiniz." label="Sicil / personel no"><Input onChange={(event) => setField("employeeNo", event.target.value)} placeholder="Örn. ART-0024" value={form.employeeNo} /></Field><Field className="sm:col-span-2" error={submitted ? errors.name : ""} label="Ad soyad" required><Input autoFocus invalid={submitted && Boolean(errors.name)} onChange={(event) => setField("name", event.target.value)} placeholder="Örn. Ayşe Demir" value={form.name} /></Field><Field hint="Opsiyoneldir; yabancı kimlik veya pasaport numarası da yazılabilir." label="TC / yabancı kimlik no"><Input onChange={(event) => setField("nationalId", event.target.value)} placeholder="Kimlik numarası" value={form.nationalId} /></Field><Field label="Doğum tarihi"><Input onChange={(event) => setField("birthDate", event.target.value)} type="date" value={form.birthDate} /></Field></div></section>
      <section className="border-t border-divider pt-5"><div className="mb-3 flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-xs font-bold text-brand-soft-fg">2</span><div><h3 className="text-sm font-semibold text-heading">Görev ve iletişim</h3><p className="text-[11px] text-muted">Saha ekibinin ihtiyaç duyacağı çalışma bilgileri.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Görev / unvan"><Input onChange={(event) => setField("title", event.target.value)} placeholder="Örn. Üretim operatörü" value={form.title} /></Field><Field label="Departman"><Input onChange={(event) => setField("department", event.target.value)} placeholder="Örn. Üretim" value={form.department} /></Field><Field label="E-posta"><Input onChange={(event) => setField("email", event.target.value)} placeholder="ornek@firma.com" type="email" value={form.email} /></Field><Field label="Telefon"><Input onChange={(event) => setField("phone", event.target.value)} placeholder="05xx xxx xx xx" type="tel" value={form.phone} /></Field><Field label="İşe giriş tarihi"><Input onChange={(event) => setField("startDate", event.target.value)} type="date" value={form.startDate} /></Field><Field hint="Personelin güncel çalışma durumunu seçin." label="Durum"><Select onChange={(event) => setField("status", event.target.value as PersonnelStatus)} value={form.status}>{personnelStatuses.map((status) => <option key={status}>{status}</option>)}</Select></Field></div></section>
      <section className="border-t border-divider pt-5"><Field hint="Sonradan personel detayında da güncelleyebilirsiniz." label="Operasyon notu"><Textarea onChange={(event) => setField("notes", event.target.value)} placeholder="Örn. yıllık tarama katılımcısı, özel takip notu..." value={form.notes} /></Field></section>
    </div>
  </Modal>;
}

function ImportModal({ companies, companyId, date, error, fileName, isReading, onClose, onConfirm, onDateChange, onPickExcel, onPickPdf, onCompanyChange, open, rows }: { companies: ReturnType<typeof useCompanies>[0]; companyId: number; date: string; error: string; fileName: string; isReading: boolean; onClose: () => void; onConfirm: () => void; onDateChange: (date: string) => void; onPickExcel: () => void; onPickPdf: () => void; onCompanyChange: (companyId: number) => void; open: boolean; rows: ImportRow[] }) {
  const valid = rows.filter((row) => row.errors.length === 0); const invalid = rows.length - valid.length;
  return <Modal className="max-w-6xl" description="Sol panelden aktarım ayarlarını yapın, sağ panelden dosya sonuçlarını kontrol edin." footer={<><Button onClick={onClose} variant="outline">Vazgeç</Button><Button disabled={!valid.length || isReading || !companyId} onClick={onConfirm}><Check /> {valid.length} geçerli satırı aktar</Button></>} icon={FileSpreadsheet} onClose={onClose} open={open} size="xl" title="Toplu personel ekle"><div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]"><aside className="h-fit space-y-4 rounded-2xl border border-border bg-card-muted p-4"><div><p className="text-brand text-[10px] font-bold tracking-[0.14em] uppercase">Aktarım ayarları</p><p className="text-muted mt-1 text-xs leading-5">Firma ve tarih bilgisi seçilen tüm dosyalara uygulanır.</p></div><Field label="Firma" required><Select aria-label="Toplu aktarım firması" onChange={(event) => onCompanyChange(Number(event.target.value))} value={String(companyId)}><option value="0">Firma seçin</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select></Field><Field label="Varsayılan işe giriş tarihi"><Input aria-label="Varsayılan işe giriş tarihi" onChange={(event) => onDateChange(event.target.value)} type="date" value={date} /></Field><div className="space-y-2 border-t border-divider pt-4"><Button className="w-full justify-start" disabled={!companyId || isReading} onClick={onPickExcel} variant="secondary"><FileSpreadsheet /> Excel / CSV seç</Button><Button className="w-full justify-start" disabled={!companyId || isReading} onClick={onPickPdf} variant="secondary"><FileText /> Ek-2 PDF seç</Button>{isReading && <p className="text-xs text-muted">Dosyalar okunuyor…</p>}</div><p className="rounded-xl border border-border bg-card p-3 text-[11px] leading-5 text-muted">Excel / CSV tek dosya, PDF ise çoklu seçilebilir. Her PDF ayrı personel kaydı olarak okunur.</p></aside><section className="min-w-0 space-y-4">{error && <Alert icon={AlertTriangle} tone="danger">{error}</Alert>}<div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card-muted px-3 py-2.5"><Badge tone="brand">{valid.length} geçerli</Badge><Badge tone={invalid ? "danger" : "neutral"}>{invalid} hatalı</Badge><span className="min-w-0 truncate text-xs text-muted">{fileName || "Henüz dosya seçilmedi"}</span></div>{invalid > 0 && <Alert icon={AlertTriangle} tone="warning">Hatalı satırlar aktarılmaz. Ad Soyad zorunludur; TC numarasının boş olması hata değildir.</Alert>}{rows.length > 0 ? <div className="max-h-[50dvh] overflow-auto rounded-xl border border-border"><table className="w-full min-w-[900px] text-left text-xs"><thead className="sticky top-0 border-b border-divider bg-card-muted"><tr><th className="px-3 py-2">Satır</th><th className="px-3 py-2">Personel</th><th className="px-3 py-2">TC / kimlik</th><th className="px-3 py-2">Sicil no</th><th className="px-3 py-2">Doğum tarihi</th><th className="px-3 py-2">Görev</th><th className="px-3 py-2">Durum</th><th className="px-3 py-2">Kontrol</th></tr></thead><tbody className="divide-y divide-divider">{rows.slice(0, 100).map((row) => <tr key={row.rowNumber}><td className="px-3 py-2 text-muted">{row.rowNumber}</td><td className="px-3 py-2 font-medium text-foreground">{row.data.name || "—"}</td><td className="px-3 py-2 text-muted">{row.data.nationalId || "—"}</td><td className="px-3 py-2 text-muted">{row.data.employeeNo || "—"}</td><td className="px-3 py-2 text-muted">{isoToLabel(row.data.birthDate) || "—"}</td><td className="px-3 py-2 text-muted">{row.data.title || "—"}</td><td className="px-3 py-2"><Badge tone={statusTone[row.data.status]}>{row.data.status}</Badge></td><td className="px-3 py-2 text-danger">{row.errors.join(" ") || "Uygun"}</td></tr>)}</tbody></table></div> : <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card-muted p-8 text-center"><div><FileSpreadsheet className="mx-auto size-8 text-subtle" /><p className="mt-3 text-sm font-semibold text-foreground">Dosya seçilmeye hazır</p><p className="mt-1 text-xs leading-5 text-muted">Sol panelden Excel/CSV veya birden fazla Ek-2 PDF seçtiğinizde aktarım önizlemesi burada görünecek.</p></div></div>}{rows.length > 100 && <p className="text-xs text-muted">Önizleme ilk 100 satırı gösteriyor; geçerli tüm satırlar aktarılabilir.</p>}<p className="text-[11px] leading-5 text-muted">Öncelikli alanlar: Ad Soyad, TC / yabancı kimlik no (opsiyonel), Sicil No, Doğum Tarihi, Görev / Unvan ve Departman. PDF’de telefon ve formdaki tarih okunabildiği ölçüde alınır.</p></section></div></Modal>;
}

function normalizedHeader(value: unknown) { return String(value ?? "").trim().toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, ""); }
function normalizedText(value: unknown) { return String(value ?? "").trim().toLocaleLowerCase("tr-TR"); }
function cellText(value: unknown) { if (value instanceof Date) return value.toISOString().slice(0, 10); if (typeof value === "object" && value && "text" in value) return String((value as { text?: string }).text ?? ""); return String(value ?? "").trim(); }
function parseDate(value: unknown) { const text = cellText(value).replace(/\s+/g, " ").trim(); if (!text) return ""; if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text; const numeric = text.match(/^(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{4})$/); if (numeric) return `${numeric[3]}-${numeric[2].padStart(2, "0")}-${numeric[1].padStart(2, "0")}`; return labelToIso(text); }

async function parsePersonnelFile(file: File, defaultCompanyId: number, defaultStartDate: string): Promise<ImportRow[]> {
  if (!file.name.toLocaleLowerCase().endsWith(".xlsx") && !file.name.toLocaleLowerCase().endsWith(".csv")) throw new Error("Lütfen .xlsx veya .csv formatında bir dosya seçin.");
  const { Workbook } = await import("exceljs/dist/exceljs.min.js");
  const workbook = new Workbook();
  const rows: unknown[][] = [];
  if (file.name.toLocaleLowerCase().endsWith(".csv")) {
    const text = await file.text();
    text.split(/\r?\n/).filter(Boolean).forEach((line) => { const separator = line.includes(";") && !line.includes(",") ? ";" : ","; rows.push(line.split(separator).map((cell) => cell.replace(/^\"|\"$/g, "").replaceAll("\"\"", "\""))); });
  } else {
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("Excel dosyasında çalışma sayfası bulunamadı.");
    sheet.eachRow((row) => rows.push((row.values as unknown[]).slice(1)));
  }
  if (rows.length < 2) throw new Error("Dosyada başlık ve en az bir personel satırı bulunmalı.");
  const headers = rows[0].map(normalizedHeader);
  const findIndex = (aliases: string[]) => headers.findIndex((header) => aliases.includes(header));
  const indexes = { name: findIndex(["adsoyad", "personel", "personeladi", "calisan", "calisanadi", "isim"]), firstName: findIndex(["ad", "adi"]), lastName: findIndex(["soyad", "soyadi"]), nationalId: findIndex(["tcno", "tc", "tckimlikno", "kimlikno", "ykn", "pasaportno"]), employeeNo: findIndex(["personelno", "sicilno", "sicil"]), birthDate: findIndex(["dogumtarihi", "dogum", "birthdate", "dogumyili"]), title: findIndex(["gorev", "gorevi", "unvan", "pozisyon", "meslek", "neisyaptigi", "is", "job"]), department: findIndex(["departman", "bolum"]), email: findIndex(["eposta", "email", "mail"]), phone: findIndex(["telefon", "gsm", "ceptelefonu"]), startDate: findIndex(["isegiristarihi", "isebaslamatarihi", "baslangictarihi"]), status: findIndex(["durum", "calismadurumu"]), notes: findIndex(["not", "aciklama"]) };
  if (!defaultCompanyId) throw new Error("Önce firma seçin.");
  if (indexes.name < 0 && indexes.firstName < 0) throw new Error("Başlıklarda Ad Soyad veya Ad alanı bulunmalı.");
  const result: ImportRow[] = [];
  rows.slice(1).forEach((values, index) => {
    if (!values.some((value) => cellText(value))) return;
    const rawStatus = cellText(values[indexes.status]);
    const status = personnelStatuses.find((item) => normalizedText(item) === normalizedText(rawStatus)) ?? "Aktif";
    const name = indexes.name >= 0 ? cellText(values[indexes.name]) : `${cellText(values[indexes.firstName])} ${cellText(values[indexes.lastName])}`.trim();
    const data: PersonnelForm = { companyId: defaultCompanyId, employeeNo: cellText(values[indexes.employeeNo]), nationalId: cellText(values[indexes.nationalId]), name, birthDate: parseDate(values[indexes.birthDate]), title: cellText(values[indexes.title]), department: cellText(values[indexes.department]), email: cellText(values[indexes.email]), phone: cellText(values[indexes.phone]), startDate: parseDate(values[indexes.startDate]) || defaultStartDate, status, notes: cellText(values[indexes.notes]) };
    const errors = [!data.name ? "Ad soyad eksik." : "", rawStatus && !personnelStatuses.some((item) => normalizedText(item) === normalizedText(rawStatus)) ? "Durum geçersiz." : "", data.birthDate === "" && cellText(values[indexes.birthDate]) ? "Doğum tarihi geçersiz." : "", data.startDate === "" && cellText(values[indexes.startDate]) ? "İşe giriş tarihi geçersiz." : ""].filter(Boolean);
    result.push({ rowNumber: index + 2, data, errors });
  });
  return result;
}

async function parsePersonnelPdf(file: File, defaultCompanyId: number, defaultStartDate: string): Promise<ImportRow[]> {
  if (!file.name.toLocaleLowerCase().endsWith(".pdf")) throw new Error("Lütfen PDF formatında bir dosya seçin.");
  if (!defaultCompanyId) throw new Error("Önce firma seçin.");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pageTexts: string[] = [];
  const pdfItems: PdfTextItem[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items.flatMap((item) => {
      if (!("str" in item) || !item.str.trim()) return [];
      return [{ str: item.str, x: item.transform[4], y: item.transform[5] }];
    });
    pdfItems.push(...items);
    pageTexts.push(items.map((item) => item.str).join(" "));
  }
  const text = pageTexts.join(" ").replace(/[\u00a0\u200b]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) throw new Error("PDF içinde okunabilir metin bulunamadı. Taranmış görüntü PDF yerine metin içeren Ek-2 PDF yükleyin.");
  const name = extractPdfField(text, [/ad[ıi]\s*(?:ve\s*)?soyad[ıi]?/i, /adı\s*soyadı/i], [/t\s*\.?\s*c\s*\.?\s*kimlik\s*no/i, /doğum\s*yeri\s*ve\s*tarihi/i]);
  const nationalId = extractPdfField(text, [/t\s*\.?\s*c\s*\.?\s*kimlik\s*no/i, /yabanc[ıi]\s*kimlik\s*no/i], [/doğum\s*yeri\s*ve\s*tarihi/i, /cinsiyet/i]).replace(/\s/g, "");
  const spatialBirth = extractPdfSpatialValue(pdfItems, /doğum\s*yeri\s*ve\s*tarihi/i, /\d/);
  const birthDate = parseDate(spatialBirth) || extractPdfDate(text, [/doğum\s*yeri\s*ve\s*tarihi/i, /doğum\s*tarihi/i]);
  const contactText = extractPdfSpatialValue(pdfItems, /tel\s*no\s*\/?\s*e[-\s]?posta/i);
  const phone = cleanPdfValue((contactText.match(/(?:\+?90[\s-]*)?(?:0[\s-]*)?(?:5\d{2}|[2-4]\d{2})[\s-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/) ?? text.match(/(?:\+?90[\s-]*)?(?:0[\s-]*)?(?:5\d{2}|[2-4]\d{2})[\s-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/) ?? [""])[0]);
  const email = cleanPdfValue((contactText.match(/[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}/) ?? text.match(/[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}/) ?? [""])[0]);
  const spatialTitle = extractPdfSpatialValue(pdfItems, /yaptığı\s*[İiIı]ş/i);
  const title = cleanPdfJobTitle(spatialTitle || extractPdfField(text, [/yaptığı\s*[İiIı]ş\s*\(\s*ayrıntılı\s*olarak\s*tanımlanacaktır\s*\.?\s*\)/i, /yaptığı\s*[İiIı]ş/i, /mesleği/i], [/çalıştığı\s*bölüm/i, /tel\s*no\s*\/?\s*e\s*posta/i, /daha\s*önce\s*çalıştığı\s*yerler/i]));
  const department = extractPdfField(text, [/çalıştığı\s*bölüm/i, /bölümü/i], [/tel\s*no\s*\/?\s*e\s*posta/i, /daha\s*önce\s*çalıştığı\s*yerler/i]);
  const data: PersonnelForm = { ...emptyForm(defaultCompanyId), companyId: defaultCompanyId, name: cleanPdfValue(name), nationalId: cleanPdfValue(nationalId), birthDate, title: cleanPdfValue(title), department: cleanPdfValue(department), email, phone: cleanPdfValue(phone), startDate: defaultStartDate };
  return [{ rowNumber: 1, data, errors: data.name ? [] : ["Ek-2 PDF içinde kişi adı okunamadı. PDF metin katmanı içermiyor veya alan başlığı tanınmadı."] }];
}

function extractPdfField(text: string, labels: RegExp[], nextLabels: RegExp[]) {
  const labelMatch = labels.map((label) => label.exec(text)).filter((match): match is RegExpExecArray => Boolean(match)).sort((a, b) => (a.index ?? 0) - (b.index ?? 0))[0];
  if (!labelMatch || labelMatch.index === undefined) return "";
  const valueStart = labelMatch.index + labelMatch[0].length;
  const remainder = text.slice(valueStart);
  const end = nextLabels.map((label) => label.exec(remainder)?.index).filter((index): index is number => index !== undefined).sort((a, b) => a - b)[0];
  return cleanPdfValue(end === undefined ? remainder : remainder.slice(0, end));
}

function extractPdfDate(text: string, labels: RegExp[]) {
  const labelMatch = labels.map((label) => label.exec(text)).filter((match): match is RegExpExecArray => Boolean(match)).sort((a, b) => (a.index ?? 0) - (b.index ?? 0))[0];
  if (!labelMatch || labelMatch.index === undefined) return "";
  const nearbyText = text.slice(Math.max(0, labelMatch.index - 160), labelMatch.index + labelMatch[0].length + 520);
  const numeric = nearbyText.match(/\d{1,2}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{4}/);
  if (numeric) return parseDate(numeric[0]);
  const named = nearbyText.match(/\d{1,2}\s+(?:ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\s+\d{4}/i);
  return named ? parseDate(named[0]) : "";
}

function extractPdfSpatialValue(items: PdfTextItem[], labelPattern: RegExp, valuePattern?: RegExp) {
  const label = items.find((item) => labelPattern.test(item.str));
  if (!label) return "";
  const candidates = items
    .filter((item) => item !== label && item.x > label.x + 80 && Math.abs(item.y - label.y) <= 8 && (!valuePattern || valuePattern.test(item.str)))
    .sort((a, b) => a.x - b.x);
  return cleanPdfValue(candidates.map((item) => item.str).join(" "));
}

function cleanPdfJobTitle(value: string) {
  return cleanPdfValue(value
    .replace(/yaptığı\s*[İiIı]ş\s*\(\s*ayrıntılı\s*olarak\s*tanımlanacaktır\s*\.?\s*\)\s*[:\-]?/i, "")
    .replace(/^\(?\s*ayrıntılı\s*olarak\s*tanımlanacaktır\s*\.?\s*\)?\s*[:\-]?\s*/i, "")
    .replace(/\s+dk\.?$/i, ""));
}

function cleanPdfValue(value: string) {
  return value.replace(/^[:\-\s]+|[:\-\s]+$/g, "").replace(/\s+/g, " ").trim();
}

async function exportPersonnelExcel(items: Personnel[], companies: ReturnType<typeof useCompanies>[0], template: boolean) {
  const { Workbook } = await import("exceljs/dist/exceljs.min.js");
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Personeller");
  const headers = ["Firma", "Ad Soyad", "TC No", "Sicil No", "Doğum Tarihi", "Görev", "Departman", "E-posta", "Telefon", "İşe Giriş Tarihi", "Durum", "Not"];
  sheet.addRow(headers);
  if (!template) items.forEach((item) => sheet.addRow([companies.find((company) => company.id === item.companyId)?.name ?? "", item.name, item.nationalId, item.employeeNo, item.birthDate, item.title, item.department, item.email, item.phone, item.startDate, item.status, item.notes]));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: "middle", wrapText: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DCEAF5" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.columns = headers.map((_, index) => ({ width: [28, 24, 18, 16, 18, 24, 22, 30, 18, 18, 14, 16, 34][index] }));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, items.length + 1), column: headers.length } };
  if (template) {
    sheet.addRow([]);
    sheet.addRow(["Şablon kullanım notu: Firma seçimi aktarım penceresinden yapılır; Firma sütunu bilgi amaçlıdır."]);
    sheet.addRow(["Zorunlu alan: Ad Soyad. Tarih biçimi: YYYY-AA-GG veya GG.AA.YYYY."]);
    sheet.addRow(["Durum değerleri: Aktif, İzinli veya Pasif."]);
    const guide = workbook.addWorksheet("Talimatlar");
    guide.columns = [{ width: 25 }, { width: 80 }];
    guide.addRow(["Alan", "Açıklama"]);
    [
      ["Ad Soyad", "Zorunlu alandır."],
      ["TC No", "Opsiyoneldir; yabancı kimlik veya pasaport numarası da yazılabilir."],
      ["Sicil No", "Aynı firma içindeki mevcut sicil numarası aktarımda güncellenir."],
      ["Doğum Tarihi / İşe Giriş Tarihi", "YYYY-AA-GG veya GG.AA.YYYY biçiminde girin."],
      ["Durum", "Aktif, İzinli veya Pasif değerlerinden biri kullanılmalıdır."],
      ["Aktarım", "Dosyayı kaydedin, Personeller > Toplu personel ekle penceresinden firmayı seçip dosyayı yükleyin."],
    ].forEach((row) => guide.addRow(row));
    guide.getRow(1).font = { bold: true };
    guide.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DCEAF5" } };
    guide.views = [{ state: "frozen", ySplit: 1 }];
  }
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = template ? "personel-aktarim-sablonu.xlsx" : "personel-listesi.xlsx"; anchor.click(); URL.revokeObjectURL(url);
}
