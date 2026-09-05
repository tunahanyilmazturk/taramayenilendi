"use client";

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSearch,
  FileText,
  FileUp,
  Filter,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Page } from "@/components/ui/page-header";
import { useCompanies } from "@/lib/data";
import { demoEmployees, type Employee, type ResultStatus } from "@/lib/employees";
import {
  analyzeResultText,
  createResultId,
  detectScreeningType,
  normalizeResultText,
  type ResultFinding,
  type ResultRecord,
  type ScreeningType,
} from "@/lib/results";
import { readStorage, storageKeys, useStoredState, writeStorage } from "@/lib/storage";
import { includesQuery, initials } from "@/lib/utils";

const resultTone: Record<ResultStatus, "brand" | "warning" | "danger"> = {
  "Sonuç var": "brand",
  Bekliyor: "warning",
  Eksik: "danger",
};
const screeningTypes: Array<"all" | ScreeningType> = [
  "all",
  "İşe giriş muayenesi",
  "Periyodik sağlık taraması",
  "Diğer",
];

export default function ResultsPage() {
  const [companies] = useCompanies();
  const [storedEmployees, setEmployees] = useStoredState<Employee[]>(storageKeys.employees, demoEmployees);
  const [records, setRecords] = useStoredState<ResultRecord[]>(storageKeys.resultRecords, []);
  const [query, setQuery] = useState("");
  const [companyId, setCompanyId] = useState("all");
  const [status, setStatus] = useState<"all" | ResultStatus>("all");
  const [screeningType, setScreeningType] = useState<"all" | ScreeningType>("all");
  const [dateMode, setDateMode] = useState<"all" | "today" | "week" | "custom">("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [uploadEmployee, setUploadEmployee] = useState<Employee | null>(null);
  const employees = storedEmployees.length ? storedEmployees : demoEmployees;
  const companyName = (id: number) => companies.find((company) => company.id === id)?.name ?? "Firma seçilmedi";
  // Eski localStorage kayıtlarını yeni hemogram, TİT ve göz analiz kurallarıyla
  // ekrana taşır. Böylece daha önce yüklenmiş raporlar da yeni analiz görünümünü kullanır.
  const analyzedRecords = useMemo(
    () =>
      records.map((record) => {
        if (!record.extractedText) return record;
        return { ...record, analysis: analyzeResultText(record.extractedText) };
      }),
    [records],
  );
  const recordsByEmployee = useMemo(
    () =>
      new Map(
        employees.map((employee) => [
          employee.id,
          analyzedRecords.filter(
            (record) =>
              record.employeeId === employee.id ||
              normalizeResultText(record.employeeName) === normalizeResultText(employee.name),
          ),
        ]),
      ),
    [analyzedRecords, employees],
  );
  const dateMatches = (record: ResultRecord) => {
    if (dateMode === "all") return true;
    const recordDate = new Date(record.uploadedAt);
    if (dateMode === "custom") return Boolean(selectedDate) && recordDate.toISOString().slice(0, 10) === selectedDate;
    const now = new Date();
    if (dateMode === "today") return recordDate.toDateString() === now.toDateString();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return recordDate >= weekAgo;
  };
  const filtered = employees.filter((employee) => {
    const employeeRecords = recordsByEmployee.get(employee.id) ?? [];
    const recordMatch = employeeRecords.some(
      (record) =>
        dateMatches(record) && (screeningType === "all" || (record.screeningType ?? "Diğer") === screeningType),
    );
    return (
      (companyId === "all" || employee.companyId === Number(companyId)) &&
      (status === "all" || employee.lastResult === status) &&
      includesQuery(
        `${employee.name} ${employee.department} ${employee.position} ${companyName(employee.companyId)}`,
        query,
      ) &&
      (dateMode === "all" && screeningType === "all" ? true : recordMatch)
    );
  });
  const selectedEmployee = filtered.find((employee) => employee.id === selectedId) ?? filtered[0] ?? null;
  const selectedRecords = selectedEmployee
    ? (recordsByEmployee.get(selectedEmployee.id) ?? []).filter(
        (record) =>
          (dateMode === "all" || dateMatches(record)) &&
          (screeningType === "all" || (record.screeningType ?? "Diğer") === screeningType),
      )
    : [];
  const statusCounts = {
    "Sonuç var": employees.filter((employee) => employee.lastResult === "Sonuç var").length,
    Bekliyor: employees.filter((employee) => employee.lastResult === "Bekliyor").length,
    Eksik: employees.filter((employee) => employee.lastResult === "Eksik").length,
  };
  const activeFilterCount = [
    companyId !== "all",
    screeningType !== "all",
    status !== "all",
    dateMode !== "all",
    Boolean(query.trim()),
  ].filter(Boolean).length;
  const resetFilters = () => {
    setQuery("");
    setCompanyId("all");
    setStatus("all");
    setScreeningType("all");
    setDateMode("all");
    setSelectedDate("");
  };
  const removeRecord = (record: ResultRecord) => {
    const nextRecords = records.filter((item) => item.id !== record.id);
    setRecords(nextRecords);
    writeStorage(storageKeys.resultRecords, nextRecords);
    setEmployees((current) =>
      current.map((item) => {
        if (item.id !== record.employeeId) return item;
        const hasRemaining = nextRecords.some(
          (itemRecord) =>
            itemRecord.employeeId === item.id ||
            normalizeResultText(itemRecord.employeeName) === normalizeResultText(item.name),
        );
        return { ...item, lastResult: hasRemaining ? "Sonuç var" : "Bekliyor" };
      }),
    );
  };

  return (
    <Page className="xl:h-[calc(100dvh-7rem)] xl:min-h-0 xl:overflow-hidden xl:pb-0">
      <div className="grid gap-5 xl:h-full xl:min-h-0 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="xl:flex xl:min-h-0 xl:flex-col">
          <Card className="p-4 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-brand-soft text-brand flex size-8 items-center justify-center rounded-lg">
                  <Filter className="size-3.5" />
                </span>
                <h2 className="text-heading text-sm font-semibold">Akıllı filtreler</h2>
              </div>
              <div className="flex items-center gap-1.5">
                {activeFilterCount ? <Badge tone="info">{activeFilterCount} aktif</Badge> : null}
                <Button aria-label="Filtreleri temizle" onClick={resetFilters} size="icon-sm" variant="ghost">
                  <RotateCcw />
                </Button>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-heading text-[11px] font-semibold">Firma</span>
                  <Select
                    className="mt-1.5 h-9 w-full"
                    onChange={(event) => setCompanyId(event.target.value)}
                    value={companyId}
                  >
                    <option value="all">Tüm firmalar</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block">
                  <span className="text-heading text-[11px] font-semibold">Tarama türü</span>
                  <Select
                    className="mt-1.5 h-9 w-full"
                    onChange={(event) => setScreeningType(event.target.value as "all" | ScreeningType)}
                    value={screeningType}
                  >
                    <option value="all">Tüm taramalar</option>
                    {screeningTypes.slice(1).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
              <label className="block">
                <span className="text-heading text-[11px] font-semibold">Sonuç durumu</span>
                <Select
                  className="mt-1.5 h-9 w-full"
                  onChange={(event) => setStatus(event.target.value as "all" | ResultStatus)}
                  value={status}
                >
                  <option value="all">Tüm durumlar</option>
                  <option value="Sonuç var">Sonuç var</option>
                  <option value="Bekliyor">Bekliyor</option>
                  <option value="Eksik">Eksik</option>
                </Select>
              </label>
              <div>
                <span className="text-heading text-[11px] font-semibold">Hızlı durum</span>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  <FilterChip active={status === "all"} label="Tümü" onClick={() => setStatus("all")} />
                  <FilterChip
                    active={status === "Sonuç var"}
                    label={`Sonuç ${statusCounts["Sonuç var"]}`}
                    onClick={() => setStatus("Sonuç var")}
                  />
                  <FilterChip
                    active={status === "Bekliyor"}
                    label={`Bekliyor ${statusCounts.Bekliyor}`}
                    onClick={() => setStatus("Bekliyor")}
                  />
                </div>
                {statusCounts.Eksik ? (
                  <button
                    className={`text-danger mt-1 text-[11px] font-semibold ${status === "Eksik" ? "underline" : ""}`}
                    onClick={() => setStatus("Eksik")}
                    type="button"
                  >
                    {statusCounts.Eksik} eksik sonuç göster
                  </button>
                ) : null}
              </div>
              <div>
                <span className="text-heading text-[11px] font-semibold">Tarih aralığı</span>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  <FilterChip active={dateMode === "all"} label="Tümü" onClick={() => setDateMode("all")} />
                  <FilterChip active={dateMode === "today"} label="Bugün" onClick={() => setDateMode("today")} />
                  <FilterChip active={dateMode === "week"} label="7 gün" onClick={() => setDateMode("week")} />
                </div>
                <label className="relative mt-1.5 block">
                  <CalendarDays className="text-subtle pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                  <input
                    aria-label="Özel tarih"
                    className="border-border bg-card-muted text-foreground focus:border-brand-outline h-9 w-full rounded-lg border pr-3 pl-9 text-[11px] outline-none"
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setDateMode("custom");
                    }}
                    type="date"
                    value={selectedDate}
                  />
                </label>
              </div>
            </div>
            {activeFilterCount ? (
              <div className="border-divider mt-3 flex flex-wrap gap-1.5 border-t pt-3">
                <span className="text-subtle mr-1 text-[10px] font-semibold">Aktif:</span>
                {companyId !== "all" ? (
                  <ActiveFilter
                    label={companies.find((company) => String(company.id) === companyId)?.name ?? "Firma"}
                    onClear={() => setCompanyId("all")}
                  />
                ) : null}
                {screeningType !== "all" ? (
                  <ActiveFilter label={screeningType} onClear={() => setScreeningType("all")} />
                ) : null}
                {status !== "all" ? <ActiveFilter label={status} onClear={() => setStatus("all")} /> : null}
                {dateMode !== "all" ? (
                  <ActiveFilter
                    label={dateMode === "today" ? "Bugün" : dateMode === "week" ? "Son 7 gün" : selectedDate}
                    onClear={() => {
                      setDateMode("all");
                      setSelectedDate("");
                    }}
                  />
                ) : null}
                {query.trim() ? <ActiveFilter label={`Arama: ${query}`} onClear={() => setQuery("")} /> : null}
              </div>
            ) : null}
            <div className="border-divider mt-4 flex min-h-0 flex-1 flex-col border-t pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-heading text-sm font-semibold">Kayıtlar</p>
                  <p className="text-muted mt-0.5 text-[11px]">Filtrelere uyan personeller</p>
                </div>
                <Badge tone="info">{filtered.length}</Badge>
              </div>
              <div className="relative mt-2">
                <Search className="text-subtle pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                <Input
                  aria-label="Kişi ara"
                  className="h-9 pl-9 text-xs"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Kişi ara..."
                  value={query}
                />
              </div>
              <div className="mt-2 space-y-1.5 overflow-y-auto pr-1 xl:min-h-0 xl:flex-1">
                {filtered.length ? (
                  filtered.map((employee) => (
                    <PersonListItem
                      active={selectedEmployee?.id === employee.id}
                      employee={employee}
                      key={employee.id}
                      onClick={() => setSelectedId(employee.id)}
                      records={recordsByEmployee.get(employee.id) ?? []}
                    />
                  ))
                ) : (
                  <p className="text-muted bg-card-muted rounded-xl p-4 text-center text-xs">
                    Filtrelere uyan kişi yok.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </aside>
        <section className="results-detail-pane min-w-0 xl:min-h-0 xl:overflow-y-auto">
          <PersonDetail
            companyName={companyName(selectedEmployee?.companyId ?? 0)}
            employee={selectedEmployee}
            onUpload={() => setUploadEmployee(selectedEmployee)}
            onDelete={removeRecord}
            records={selectedRecords}
          />
        </section>
      </div>
      <SingleResultUploadModal
        employee={uploadEmployee}
        onClose={() => setUploadEmployee(null)}
        onSaved={(record) => {
          setRecords((current) => [...current, record]);
          setEmployees((current) =>
            current.map((item) => (item.id === record.employeeId ? { ...item, lastResult: "Sonuç var" } : item)),
          );
        }}
      />
    </Page>
  );
}

function SingleResultUploadModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: Employee | null;
  onClose: () => void;
  onSaved: (record: ResultRecord) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const save = async () => {
    if (!employee || !file) return;
    setLoading(true);
    setError("");
    try {
      setProgress("PDF okunuyor…");
      const text = await extractResultText(file, setProgress);
      if (!text.trim())
        throw new Error("PDF içinde okunabilir metin bulunamadı. Metin içeren veya OCR destekli bir PDF seçin.");
      const record: ResultRecord = {
        id: createResultId(),
        employeeId: employee.id,
        employeeName: employee.name,
        companyId: employee.companyId,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        extractedText: text.slice(0, 100_000),
        dataUrl: await fileToDataUrl(file),
        analysis: analyzeResultText(text),
        screeningType: detectScreeningType(`${text}\n${file.name}`),
      };
      writeStorage(storageKeys.resultRecords, [...readStorage<ResultRecord[]>(storageKeys.resultRecords, []), record]);
      onSaved(record);
      setFile(null);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "PDF okunamadı.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };
  return (
    <Modal
      description={employee ? `${employee.name} için sonuç raporunu doğrudan bu ekrandan ekleyin.` : "Personel seçin."}
      eyebrow="Kişiye özel sonuç aktarımı"
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Vazgeç
          </Button>
          <Button disabled={!file || loading} onClick={() => void save()}>
            <FileUp /> {loading ? progress || "Okunuyor…" : "Sonucu kaydet"}
          </Button>
        </>
      }
      icon={FileUp}
      onClose={onClose}
      open={Boolean(employee)}
      size="lg"
      title={`${employee?.name ?? "Personel"} için sonuç ekle`}
    >
      <div className="space-y-4">
        <label className="border-border-strong bg-card-muted hover:border-brand-outline flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-10 text-center transition-colors">
          <span className="bg-brand-soft text-brand flex size-12 items-center justify-center rounded-2xl">
            <FileUp className="size-6" />
          </span>
          <span className="text-heading mt-3 text-sm font-semibold">
            {file ? file.name : "PDF sonuç dosyasını seçin"}
          </span>
          <span className="text-muted mt-1 text-xs">İşe giriş veya periyodik muayene formu yükleyebilirsiniz.</span>
          <input
            accept=".pdf,.txt,.csv"
            className="sr-only"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError("");
            }}
            type="file"
          />
        </label>
        {file && (
          <div className="bg-card-muted rounded-xl px-4 py-3 text-xs">
            <span className="text-heading font-semibold">Seçilen dosya:</span>{" "}
            <span className="text-muted">
              {file.name} · {Math.max(1, Math.round(file.size / 1024))} KB
            </span>
          </div>
        )}
        {error && (
          <div className="border-danger bg-danger-soft text-danger rounded-xl border px-4 py-3 text-xs">{error}</div>
        )}
        <div className="bg-info-soft text-info rounded-xl px-4 py-3 text-xs leading-5">
          PDF içindeki ölçümler otomatik analiz edilir; sonuç kaydedildiğinde bu personelin geçmişinde görünür.
        </div>
      </div>
    </Modal>
  );
}

async function extractResultText(file: File, onProgress?: (message: string) => void) {
  if (!file.name.toLocaleLowerCase("tr-TR").endsWith(".pdf")) return file.text();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const pdfDocument = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  let text = "";
  const pagesWithoutText: number[] = [];
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const content = await page.getTextContent();
    const emphasized: string[] = [];
    const pageText = content.items
      .map((item) => {
        if ("str" in item && item.str.trim() && "fontName" in item && /bold|heavy|demi/i.test(item.fontName ?? "")) {
          emphasized.push(item.str.trim());
        }
        return "str" in item ? item.str : "";
      })
      .join(" ")
      .trim();
    if (pageText) text += `${pageText}${emphasized.length ? `\n[VURGULU] ${emphasized.join(" | ")}` : ""}\n`;
    else pagesWithoutText.push(pageNumber);
  }
  if (pagesWithoutText.length) {
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("tur");
      try {
        for (const [index, pageNumber] of pagesWithoutText.entries()) {
          onProgress?.(`OCR sayfa ${index + 1} / ${pagesWithoutText.length} okunuyor`);
          const page = await pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.8 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext("2d");
          if (!context) throw new Error("PDF sayfası görüntüye dönüştürülemedi.");
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          const result = await worker.recognize(canvas);
          text += `${result.data.text}\n`;
        }
      } finally {
        await worker.terminate();
      }
    } catch {
      onProgress?.("OCR kullanılamadı");
    }
  }
  return text;
}

function fileToDataUrl(file: File) {
  return new Promise<string | undefined>((resolve) => {
    if (file.size > 3_000_000) return resolve(undefined);
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${active ? "border-brand bg-brand text-brand-contrast" : "border-border bg-card-muted text-muted hover:border-brand-outline"}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ActiveFilter({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      className="border-brand-outline bg-brand-soft text-brand inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold"
      onClick={onClear}
      title={`${label} filtresini kaldır`}
      type="button"
    >
      <span className="truncate">{label}</span>
      <span aria-hidden="true">×</span>
    </button>
  );
}

function PersonListItem({
  employee,
  records,
  active,
  onClick,
}: {
  employee: Employee;
  records: ResultRecord[];
  active: boolean;
  onClick: () => void;
}) {
  const latest = records.at(-1);
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${active ? "border-brand bg-brand-soft" : "border-border bg-card hover:border-brand-outline"}`}
      onClick={onClick}
      type="button"
    >
      <span className="bg-brand-soft text-brand flex size-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold">
        {initials(employee.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-heading block truncate text-xs font-semibold">{employee.name}</span>
        <span className="text-subtle mt-0.5 block truncate text-[10px]">
          {latest?.screeningType ?? employee.lastResult}
        </span>
      </span>
      <span className="flex items-center gap-1">
        {employee.lastResult === "Sonuç var" ? (
          <CheckCircle2 className="text-brand size-4" />
        ) : (
          <Clock3 className="text-warning size-4" />
        )}
        <ChevronRight className="text-subtle size-3" />
      </span>
    </button>
  );
}

function PersonDetail({
  employee,
  companyName,
  onUpload,
  onDelete,
  records,
}: {
  employee: Employee | null;
  companyName: string;
  onUpload: () => void;
  onDelete: (record: ResultRecord) => void;
  records: ResultRecord[];
}) {
  if (!employee)
    return (
      <Card className="flex min-h-[620px] items-center justify-center p-8">
        <div className="text-center">
          <UserRound className="text-subtle mx-auto size-10" />
          <p className="text-heading mt-3 text-sm font-semibold">Bir personel seçin</p>
          <p className="text-muted mt-1 text-xs">Sonuç detaylarını görmek için soldaki listeden kişi seçin.</p>
        </div>
      </Card>
    );
  return (
    <div className="space-y-4">
      <Card className="border-brand/20 bg-brand-soft/30 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-card text-brand flex size-14 items-center justify-center rounded-2xl text-lg font-bold shadow-sm">
              {initials(employee.name)}
            </span>
            <div>
              <p className="text-heading text-lg font-semibold">{employee.name}</p>
              <p className="text-muted mt-1 text-xs">
                {companyName} · {employee.department || "Departman belirtilmedi"}
              </p>
              <p className="text-subtle mt-1 text-xs">
                {employee.position || "Görev belirtilmedi"} · {employee.email || "E-posta yok"}
              </p>
            </div>
          </div>
          <Badge tone={resultTone[employee.lastResult]}>{employee.lastResult}</Badge>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Detail label="Telefon" value={employee.phone || "Belirtilmedi"} />
          <Detail label="Doğum tarihi" value={employee.birthDate || "Belirtilmedi"} />
          <Detail label="Cinsiyet" value={employee.gender || "Belirtilmedi"} />
          <Detail label="Rapor sayısı" value={String(records.length)} />
          <Detail label="Son tarama" value={records.at(-1)?.screeningType ?? "Henüz yok"} />
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="text-brand size-4" />
              <h2 className="text-heading text-sm font-semibold">Sonuçlar ve analiz</h2>
            </div>
            <p className="text-muted mt-1 text-xs">Yüklenen raporlar ve otomatik ön değerlendirme.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted hidden text-xs sm:inline">{records.length} rapor</span>
            <Button onClick={onUpload}>
              <Upload /> Sonuç yükle
            </Button>
          </div>
        </div>
        {records.length ? (
          <div className="mt-4 space-y-3">
            {records
              .slice()
              .reverse()
              .map((record) => (
                <ResultRecordCard key={record.id} onDelete={onDelete} record={record} />
              ))}
          </div>
        ) : (
          <div className="border-border bg-card-muted/50 text-muted mt-5 rounded-2xl border border-dashed p-10 text-center text-sm">
            Bu personel için sonuç bulunmuyor. Sonuç yükleyerek rapor geçmişini başlatabilirsiniz.
          </div>
        )}
      </Card>
    </div>
  );
}

function ResultRecordCard({ record, onDelete }: { record: ResultRecord; onDelete: (record: ResultRecord) => void }) {
  const tone =
    record.analysis.status === "attention" ? "danger" : record.analysis.status === "normal" ? "brand" : "warning";
  return (
    <article className="border-border rounded-2xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="bg-info-soft text-info flex size-10 shrink-0 items-center justify-center rounded-xl">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-heading truncate text-sm font-semibold">{record.fileName}</p>
            <p className="text-muted mt-1 text-xs">
              {record.screeningType ?? "Diğer"} · {new Date(record.uploadedAt).toLocaleString("tr-TR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={tone}>
            {record.analysis.status === "attention"
              ? "Dikkat"
              : record.analysis.status === "normal"
                ? "Normal"
                : "İncelenmeli"}
          </Badge>
          {record.dataUrl && (
            <Button
              onClick={() => window.open(record.dataUrl, "_blank", "noopener,noreferrer")}
              size="sm"
              variant="secondary"
            >
              <FileSearch /> PDF’i aç
            </Button>
          )}
          <Button
            aria-label={`${record.fileName} sil`}
            onClick={() => {
              if (window.confirm(`${record.fileName} sonucunu silmek istediğinize emin misiniz?`)) onDelete(record);
            }}
            size="sm"
            variant="danger"
          >
            <Trash2 /> Sil
          </Button>
        </div>
      </div>
      <p className="text-muted bg-card-muted mt-3 rounded-xl p-3 text-xs leading-5">{record.analysis.summary}</p>
      {record.analysis.insights?.length ? (
        <div className="border-info bg-info-soft/50 mt-3 rounded-xl border p-3">
          <p className="text-info text-xs font-semibold">Akıllı laboratuvar değerlendirmesi</p>
          <ul className="text-muted mt-2 space-y-1 text-xs leading-5">
            {record.analysis.insights.map((insight) => (
              <li className="flex gap-2" key={insight}>
                <span className="text-info">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {record.analysis.eyeExam ? <EyeExamPanel eyeExam={record.analysis.eyeExam} /> : null}
      {record.analysis.specialTests?.length ? <SpecialTestPanel tests={record.analysis.specialTests} /> : null}
      {record.analysis.highlightedText?.length ? (
        <HighlightedTextPanel items={record.analysis.highlightedText} />
      ) : null}
      <FindingSections findings={record.analysis.findings} />
    </article>
  );
}

const hemogramFindingLabels = new Set([
  "Lökosit",
  "Lenfosit %",
  "Monosit %",
  "Nötrofil %",
  "Eozinofil %",
  "Bazofil %",
  "Lenfosit #",
  "Monosit #",
  "Nötrofil #",
  "Eozinofil #",
  "Bazofil #",
  "Hemoglobin",
  "Eritrosit",
  "Hematokrit",
  "MCV",
  "MCH",
  "MCHC",
  "RDW",
  "Trombosit",
  "MPV",
  "PDW",
  "PCT",
  "P-LCR",
]);

function FindingSections({ findings }: { findings: ResultFinding[] }) {
  if (!findings.length) return null;
  const sections = [
    {
      title: "Hemogram parametreleri",
      items: findings.filter((finding) => hemogramFindingLabels.has(finding.label)),
    },
    {
      title: "İdrar parametreleri",
      items: findings.filter((finding) => ["İdrar pH", "İdrar dansitesi"].includes(finding.label)),
    },
    {
      title: "Diğer laboratuvar parametreleri",
      items: findings.filter(
        (finding) =>
          !hemogramFindingLabels.has(finding.label) && !["İdrar pH", "İdrar dansitesi"].includes(finding.label),
      ),
    },
  ].filter((section) => section.items.length);
  return (
    <div className="mt-3 space-y-2">
      {sections.map((section) => (
        <details className="border-border overflow-hidden rounded-xl border" key={section.title}>
          <summary className="bg-card-muted text-heading flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-xs font-semibold [&::-webkit-details-marker]:hidden">
            <span>{section.title}</span>
            <span className="text-muted font-normal">{section.items.length} parametre</span>
          </summary>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-card text-subtle">
                <tr>
                  <th className="px-3 py-2">Ölçüm</th>
                  <th className="px-3 py-2">Değer</th>
                  <th className="px-3 py-2">Referans</th>
                  <th className="px-3 py-2">Yorum</th>
                </tr>
              </thead>
              <tbody className="divide-divider divide-y">
                {section.items.map((finding) => (
                  <FindingRow finding={finding} key={finding.label} />
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ))}
    </div>
  );
}

function EyeExamPanel({ eyeExam }: { eyeExam: NonNullable<ResultRecord["analysis"]["eyeExam"]> }) {
  const eyeRows = [
    ["Sph.", eyeExam.left?.sph, eyeExam.right?.sph],
    ["Cyl.", eyeExam.left?.cyl, eyeExam.right?.cyl],
    ["Ax.", eyeExam.left?.axis, eyeExam.right?.axis],
    ["Görme keskinliği", eyeExam.left?.visualAcuity, eyeExam.right?.visualAcuity],
    ["Görme keskinliği (gözlüklü)", eyeExam.left?.correctedVisualAcuity, eyeExam.right?.correctedVisualAcuity],
    ["Göz tansiyonu", eyeExam.left?.eyePressure, eyeExam.right?.eyePressure],
  ].filter((row) => row[1] || row[2]);
  return (
    <details className="border-border bg-card-muted mt-3 rounded-xl border">
      <summary className="text-heading flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-xs font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <Sparkles className="text-info size-4" />
          Göz muayenesi bulguları
        </span>
        <span className="text-muted font-normal">Detayları aç</span>
      </summary>
      <div className="p-3 pt-0">
        {eyeRows.length ? (
          <div className="border-border mt-3 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[440px] text-left text-xs">
              <thead className="bg-card text-subtle">
                <tr>
                  <th className="px-3 py-2">Parametre</th>
                  <th className="px-3 py-2">Sol göz</th>
                  <th className="px-3 py-2">Sağ göz</th>
                </tr>
              </thead>
              <tbody className="divide-divider divide-y">
                {eyeRows.map(([label, left, right]) => (
                  <tr key={label}>
                    <td className="text-muted px-3 py-2 font-medium">{label}</td>
                    <td className="text-heading px-3 py-2 font-semibold">{left || "—"}</td>
                    <td className="text-heading px-3 py-2 font-semibold">{right || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {eyeExam.colorBlindness ? <Detail label="Renk körlüğü" value={eyeExam.colorBlindness} /> : null}
          {eyeExam.conclusion ? <Detail label="Sonuç" value={eyeExam.conclusion} /> : null}
          {eyeExam.assessment ? <Detail label="Değerlendirme" value={eyeExam.assessment} /> : null}
          {eyeExam.diagnosis ? <Detail label="Tanı" value={eyeExam.diagnosis} /> : null}
        </div>
      </div>
    </details>
  );
}

function SpecialTestPanel({ tests }: { tests: NonNullable<ResultRecord["analysis"]["specialTests"]> }) {
  return (
    <div className="mt-3 space-y-2">
      {tests.map((test) => (
        <details className="border-border bg-card-muted rounded-xl border" key={test.type}>
          <summary className="text-heading flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-xs font-semibold [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <Sparkles className="text-info size-4" />
              {test.type}
            </span>
            <span className="text-muted font-normal">
              {test.fields.length ? `${test.fields.length} bulgu` : "Metin değerlendirmesi"}
            </span>
          </summary>
          <div className="p-3 pt-0">
            {test.fields.length ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {test.fields.map((field) => (
                  <Detail key={field.label} label={field.label} value={field.value} />
                ))}
              </div>
            ) : null}
            {test.conclusion || test.assessment ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {test.conclusion ? <Detail label="Sonuç" value={test.conclusion} /> : null}
                {test.assessment ? <Detail label="Değerlendirme" value={test.assessment} /> : null}
              </div>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}

function HighlightedTextPanel({ items }: { items: string[] }) {
  return (
    <details className="border-warning bg-warning-soft/40 mt-3 rounded-xl border">
      <summary className="text-heading flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-xs font-semibold [&::-webkit-details-marker]:hidden">
        <span>Raporda vurgulanan alanlar</span>
        <span className="text-muted font-normal">{items.length} alan</span>
      </summary>
      <ul className="text-muted space-y-1 px-3 pb-3 text-xs leading-5">
        {items.map((item, index) => (
          <li className="flex gap-2" key={`${item}-${index}`}>
            <span className="text-warning">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function FindingRow({ finding }: { finding: ResultFinding }) {
  const tone = finding.status === "normal" ? "brand" : finding.status === "review" ? "warning" : "danger";
  return (
    <tr>
      <td className="text-heading px-3 py-2.5 font-medium">{finding.label}</td>
      <td className="text-heading px-3 py-2.5 font-semibold">
        {finding.value} {finding.unit}
      </td>
      <td className="text-muted px-3 py-2.5">{finding.reference}</td>
      <td className="px-3 py-2.5">
        <Badge tone={tone}>
          {finding.status === "normal"
            ? "Normal"
            : finding.status === "low"
              ? "Düşük"
              : finding.status === "high"
                ? "Yüksek"
                : "İncele"}
        </Badge>
        <span className="text-muted ml-2">{finding.comment}</span>
      </td>
    </tr>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card-muted rounded-xl p-3">
      <p className="text-subtle text-[10px] font-bold tracking-[0.12em] uppercase">{label}</p>
      <p className="text-heading mt-1.5 text-xs font-semibold">{value}</p>
    </div>
  );
}
