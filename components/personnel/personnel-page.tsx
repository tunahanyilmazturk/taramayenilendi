"use client";

import {
  Building2,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FileSpreadsheet,
  FileUp,
  Eye,
  LayoutGrid,
  List,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Alert, ConfirmDialog, Modal } from "@/components/ui/modal";
import { Page, PageHeader } from "@/components/ui/page-header";
import { useCompanies } from "@/lib/data";
import {
  demoEmployees,
  emptyEmployee,
  type Employee,
  type EmployeeForm,
  type EmployeeStatus,
  type ResultStatus,
} from "@/lib/employees";
import { useConfirm, useNotice } from "@/lib/hooks";
import {
  analyzeResultText,
  createResultId,
  detectScreeningType,
  extractEmployeeProfile,
  normalizeResultText,
  type ResultRecord,
} from "@/lib/results";
import { readStorage, storageKeys, useStoredState, writeStorage } from "@/lib/storage";
import { cn, includesQuery, initials } from "@/lib/utils";

const resultTone: Record<ResultStatus, "brand" | "warning" | "danger"> = {
  "Sonuç var": "brand",
  Bekliyor: "warning",
  Eksik: "danger",
};

export default function PersonnelPage() {
  const [companies] = useCompanies();
  const [employees, setEmployees] = useStoredState<Employee[]>(storageKeys.employees, demoEmployees);
  const [, setResultRecords] = useStoredState<ResultRecord[]>(storageKeys.resultRecords, []);
  const [companyId, setCompanyId] = useState("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | EmployeeStatus>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const safeEmployees = Array.isArray(employees) ? employees : demoEmployees;
  const searchParams = useSearchParams();
  const initialEditId = Number(searchParams.get("edit"));
  const initialEditEmployee = safeEmployees.find((item) => item.id === initialEditId) ?? null;
  const [editor, setEditor] = useState<{ open: boolean; employee: Employee | null }>({
    open: Boolean(initialEditEmployee),
    employee: initialEditEmployee,
  });
  const [excelOpen, setExcelOpen] = useState(false);
  const [notice, showNotice] = useNotice();
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();
  const filtered = useMemo(
    () =>
      safeEmployees.filter((employee) => {
        const company = companies.find((item) => item.id === employee.companyId);
        return (
          (companyId === "all" || employee.companyId === Number(companyId)) &&
          (status === "all" || employee.status === status) &&
          includesQuery(`${employee.name} ${employee.department} ${employee.position} ${company?.name ?? ""}`, query)
        );
      }),
    [companies, companyId, query, safeEmployees, status],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedEmployees = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allVisibleSelected =
    pagedEmployees.length > 0 && pagedEmployees.every((employee) => selectedIds.includes(employee.id));

  const saveEmployee = (values: EmployeeForm) => {
    if (!values.name.trim() || !values.companyId) return;
    setEmployees((current) => {
      const safeCurrent = Array.isArray(current) ? current : demoEmployees;
      if (editor.employee) {
        return safeCurrent.map((item) => (item.id === editor.employee?.id ? { ...values, id: item.id } : item));
      }
      const id = safeCurrent.length ? Math.max(...safeCurrent.map((item) => item.id)) + 1 : 1;
      return [...safeCurrent, { ...values, id }];
    });
    setEditor({ open: false, employee: null });
    showNotice(editor.employee ? "Personel bilgileri güncellendi." : "Personel kaydı oluşturuldu.");
  };
  const removeEmployee = (employee: Employee) =>
    confirm({
      title: "Personeli sil",
      description: `${employee.name} personel kaydı kalıcı olarak silinecek.`,
      onConfirm: () => {
        setEmployees((current) => (Array.isArray(current) ? current.filter((item) => item.id !== employee.id) : []));
        showNotice("Personel kaydı silindi.");
      },
    });
  const toggleSelected = (id: number) =>
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const toggleAllVisible = () =>
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !pagedEmployees.some((employee) => employee.id === id))
        : Array.from(new Set([...current, ...pagedEmployees.map((employee) => employee.id)])),
    );
  const bulkUpdateResult = (nextStatus: ResultStatus) => {
    if (!selectedIds.length) return;
    setEmployees((current) =>
      (Array.isArray(current) ? current : demoEmployees).map((employee) =>
        selectedIds.includes(employee.id) ? { ...employee, lastResult: nextStatus } : employee,
      ),
    );
    showNotice(`${selectedIds.length} personelin sonuç durumu güncellendi.`);
    setSelectedIds([]);
  };
  const removeSelected = () => {
    if (!selectedIds.length) return;
    confirm({
      title: "Seçili personelleri sil",
      description: `${selectedIds.length} personel kaydı kalıcı olarak silinecek.`,
      onConfirm: () => {
        setEmployees((current) =>
          Array.isArray(current) ? current.filter((employee) => !selectedIds.includes(employee.id)) : [],
        );
        showNotice(`${selectedIds.length} personel kaydı silindi.`);
        setSelectedIds([]);
      },
    });
  };
  const companyName = (id: number) => companies.find((company) => company.id === id)?.name ?? "Firma seçilmedi";
  const importEmployees = (rows: EmployeeForm[]) => {
    setEmployees((current) => {
      const safeCurrent = Array.isArray(current) ? current : demoEmployees;
      const next = [...safeCurrent];
      rows.forEach((row) => {
        const index = next.findIndex(
          (item) =>
            item.companyId === row.companyId &&
            item.name.toLocaleLowerCase("tr-TR") === row.name.toLocaleLowerCase("tr-TR"),
        );
        if (index >= 0) next[index] = { ...next[index], ...row };
        else next.push({ ...row, id: next.length ? Math.max(...next.map((item) => item.id)) + 1 : 1 });
      });
      return next;
    });
    setExcelOpen(false);
    showNotice(`${rows.length} personel Excel dosyasından aktarıldı.`);
  };

  return (
    <Page>
      <PageHeader
        className="border-border bg-card shadow-card rounded-2xl border px-5 py-5 sm:px-6 sm:py-6"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setExcelOpen(true)} variant="secondary">
              <FileSpreadsheet /> Excel ile aktar
            </Button>
            <Button asChild variant="secondary">
              <Link href="/personeller/sonuc-aktarimi">
                <FileUp /> Toplu sonuç aktar
              </Link>
            </Button>
            <Button onClick={() => setEditor({ open: true, employee: null })}>
              <Plus /> Personel ekle
            </Button>
          </div>
        }
        description="Firmalarınızın çalışan kayıtlarını, tarama sonuçlarını ve toplu sonuç aktarımını yönetin."
        eyebrow="Çalışan ve sonuç merkezi"
        title="Personeller"
      />
      {notice && (
        <Alert className="mt-4 w-fit" icon={Check}>
          {notice}
        </Alert>
      )}

      <div className="mt-5">
        <Card aria-label="Personel listesi" className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-heading text-sm font-semibold">Firma çalışanları</h2>
                <Badge tone="info">{filtered.length} kayıt</Badge>
              </div>
              <div className="text-muted mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                <span>{safeEmployees.filter((employee) => employee.status === "Aktif").length} aktif</span>
                <span className="text-divider">•</span>
                <span>
                  {safeEmployees.filter((employee) => employee.lastResult === "Bekliyor").length} sonuç bekliyor
                </span>
                <span className="text-divider">•</span>
                <span>{safeEmployees.filter((employee) => employee.lastResult === "Eksik").length} eksik sonuç</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative block">
                <span className="sr-only">Firma</span>
                <Building2 className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <select
                  aria-label="Firma seç"
                  className="border-border bg-card-muted text-foreground focus:border-brand-outline h-10 w-full min-w-48 appearance-none rounded-xl border pr-8 pl-9 text-xs outline-none"
                  onChange={(event) => {
                    setCompanyId(event.target.value);
                    setPage(1);
                    setSelectedIds([]);
                  }}
                  value={companyId}
                >
                  <option value="all">Tüm firmalar</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>
              <select
                aria-label="Personel durumu"
                className="border-border bg-card-muted text-foreground focus:border-brand-outline h-10 rounded-xl border px-3 text-xs outline-none"
                onChange={(event) => {
                  setStatus(event.target.value as "all" | EmployeeStatus);
                  setPage(1);
                  setSelectedIds([]);
                }}
                value={status}
              >
                <option value="all">Tüm durumlar</option>
                <option value="Aktif">Aktif</option>
                <option value="Pasif">Pasif</option>
              </select>
              <div className="border-border bg-card-muted flex items-center rounded-xl border p-0.5">
                <Button
                  aria-label="Liste görünümü"
                  onClick={() => setViewMode("table")}
                  size="icon-sm"
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                >
                  <List />
                </Button>
                <Button
                  aria-label="Kart görünümü"
                  onClick={() => setViewMode("cards")}
                  size="icon-sm"
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                >
                  <LayoutGrid />
                </Button>
              </div>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              aria-label="Personel ara"
              className="h-11 pl-9"
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
                setSelectedIds([]);
              }}
              placeholder="İsim, departman, görev veya firma ara..."
              value={query}
            />
          </div>
          {selectedIds.length > 0 && (
            <div className="border-brand-outline bg-brand-soft mt-4 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2">
              <span className="text-brand flex items-center gap-2 text-xs font-semibold">
                <CheckSquare className="size-4" /> {selectedIds.length} personel seçildi
              </span>
              <span className="bg-brand-soft-fg/20 h-4 w-px" />
              <Button onClick={() => bulkUpdateResult("Sonuç var")} size="xs" variant="soft">
                Sonuç var
              </Button>
              <Button onClick={() => bulkUpdateResult("Bekliyor")} size="xs" variant="soft">
                Bekliyor
              </Button>
              <Button onClick={() => bulkUpdateResult("Eksik")} size="xs" variant="soft">
                Eksik
              </Button>
              <Button className="ml-auto" onClick={removeSelected} size="xs" variant="danger">
                Seçilenleri sil
              </Button>
            </div>
          )}
          {viewMode === "table" ? (
            <div className="border-border mt-4 overflow-x-auto rounded-2xl border">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-card-muted text-subtle">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        aria-label="Görünen personellerin tümünü seç"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                        type="checkbox"
                      />
                    </th>
                    <th className="px-4 py-3">Personel</th>
                    <th className="px-4 py-3">Firma</th>
                    <th className="px-4 py-3">Departman / görev</th>
                    <th className="px-4 py-3">Sonuç durumu</th>
                    <th className="px-4 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-divider divide-y">
                  {filtered.length === 0 ? (
                    <tr>
                      <td className="text-muted px-4 py-10 text-center" colSpan={6}>
                        Filtrelerle eşleşen personel bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    pagedEmployees.map((employee) => (
                      <tr className="hover:bg-card-muted/60" key={employee.id}>
                        <td className="px-4 py-3">
                          <input
                            aria-label={`${employee.name} seç`}
                            checked={selectedIds.includes(employee.id)}
                            onChange={() => toggleSelected(employee.id)}
                            type="checkbox"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="bg-brand-soft text-brand flex size-9 items-center justify-center rounded-xl text-xs font-bold">
                              {initials(employee.name)}
                            </span>
                            <span>
                              <span className="text-heading block font-semibold">{employee.name}</span>
                              <span className="text-subtle mt-0.5 block">{employee.email || "E-posta yok"}</span>
                            </span>
                          </div>
                        </td>
                        <td className="text-muted px-4 py-3">{companyName(employee.companyId)}</td>
                        <td className="px-4 py-3">
                          <span className="text-heading block font-medium">{employee.department || "—"}</span>
                          <span className="text-subtle mt-0.5 block">{employee.position || "Görev belirtilmedi"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={resultTone[employee.lastResult]}>{employee.lastResult}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button aria-label={`${employee.name} detayını aç`} asChild size="icon-sm" variant="ghost">
                              <Link href={`/personeller/${employee.id}`}>
                                <Eye />
                              </Link>
                            </Button>
                            <Button
                              aria-label={`${employee.name} düzenle`}
                              onClick={() => setEditor({ open: true, employee })}
                              size="icon-sm"
                              variant="ghost"
                            >
                              <UserRound />
                            </Button>
                            <Button
                              aria-label={`${employee.name} sil`}
                              onClick={() => removeEmployee(employee)}
                              size="icon-sm"
                              variant="danger"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {pagedEmployees.length === 0 ? (
                <div className="border-border bg-card-muted text-muted rounded-2xl border border-dashed p-10 text-center text-xs md:col-span-2">
                  Filtrelerle eşleşen personel bulunamadı.
                </div>
              ) : (
                pagedEmployees.map((employee) => (
                  <Card className="p-4" key={employee.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <input
                          aria-label={`${employee.name} seç`}
                          checked={selectedIds.includes(employee.id)}
                          onChange={() => toggleSelected(employee.id)}
                          type="checkbox"
                        />
                        <span className="bg-brand-soft text-brand flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold">
                          {initials(employee.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-heading truncate text-sm font-semibold">{employee.name}</p>
                          <p className="text-subtle mt-0.5 truncate text-xs">{companyName(employee.companyId)}</p>
                        </div>
                      </div>
                      <Badge tone={resultTone[employee.lastResult]}>{employee.lastResult}</Badge>
                    </div>
                    <div className="border-border mt-4 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
                      <div>
                        <p className="text-subtle">Departman</p>
                        <p className="text-heading mt-1 truncate font-medium">
                          {employee.department || "Belirtilmedi"}
                        </p>
                      </div>
                      <div>
                        <p className="text-subtle">Görev</p>
                        <p className="text-heading mt-1 truncate font-medium">{employee.position || "Belirtilmedi"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-1">
                      <Button aria-label={`${employee.name} detayını aç`} asChild size="icon-sm" variant="ghost">
                        <Link href={`/personeller/${employee.id}`}>
                          <Eye />
                        </Link>
                      </Button>
                      <Button
                        aria-label={`${employee.name} düzenle`}
                        onClick={() => setEditor({ open: true, employee })}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <UserRound />
                      </Button>
                      <Button
                        aria-label={`${employee.name} sil`}
                        onClick={() => removeEmployee(employee)}
                        size="icon-sm"
                        variant="danger"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
          <div className="border-border mt-4 flex flex-col gap-3 border-t pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted">
              {filtered.length
                ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filtered.length)} arası gösteriliyor`
                : "Kayıt bulunamadı"}{" "}
              · Toplam {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                aria-label="Önceki sayfa"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                size="icon-sm"
                variant="outline"
              >
                <ChevronLeft />
              </Button>
              <span className="text-heading min-w-16 text-center font-medium">
                {currentPage} / {pageCount}
              </span>
              <Button
                aria-label="Sonraki sayfa"
                disabled={currentPage === pageCount}
                onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                size="icon-sm"
                variant="outline"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </Card>
      </div>
      <EmployeeModal
        key={`${editor.open ? "open" : "closed"}-${editor.employee?.id ?? "new"}`}
        companies={companies}
        employee={editor.employee}
        onClose={() => setEditor({ open: false, employee: null })}
        onSave={saveEmployee}
        open={editor.open}
      />
      <ExcelImportModal
        companies={companies}
        employees={safeEmployees}
        onClose={() => setExcelOpen(false)}
        onImport={importEmployees}
        open={excelOpen}
      />
      <ConfirmDialog onClose={closeConfirm} request={confirmRequest} />
    </Page>
  );
}

function EmployeeModal({
  open,
  employee,
  companies,
  onClose,
  onSave,
}: {
  open: boolean;
  employee: Employee | null;
  companies: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSave: (values: EmployeeForm) => void;
}) {
  const [form, setForm] = useState<EmployeeForm>(employee ? { ...employee } : emptyEmployee);
  const setField = <K extends keyof EmployeeForm>(key: K, value: EmployeeForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <Modal
      description="Firma çalışanı ve iletişim bilgilerini kaydedin."
      eyebrow="Çalışan kaydı"
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Vazgeç
          </Button>
          <Button onClick={() => onSave(form)}>
            <Check /> Kaydet
          </Button>
        </>
      }
      icon={UserRound}
      onClose={onClose}
      open={open}
      size="lg"
      title={employee ? "Personeli düzenle" : "Yeni personel ekle"}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2" label="Firma" required>
          <Select onChange={(event) => setField("companyId", Number(event.target.value))} value={form.companyId}>
            <option value={0}>Firma seçin</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field className="sm:col-span-2" label="Ad soyad" required>
          <Input
            onChange={(event) => setField("name", event.target.value)}
            placeholder="Örn. Ahmet Yılmaz"
            value={form.name}
          />
        </Field>
        <Field label="Departman">
          <Input
            onChange={(event) => setField("department", event.target.value)}
            placeholder="Üretim, kalite..."
            value={form.department}
          />
        </Field>
        <Field label="Görev">
          <Input
            onChange={(event) => setField("position", event.target.value)}
            placeholder="Görev veya unvan"
            value={form.position}
          />
        </Field>
        <Field label="E-posta">
          <Input onChange={(event) => setField("email", event.target.value)} type="email" value={form.email} />
        </Field>
        <Field label="Telefon">
          <Input onChange={(event) => setField("phone", event.target.value)} type="tel" value={form.phone} />
        </Field>
        <Field label="Doğum tarihi">
          <Input
            onChange={(event) => setField("birthDate", event.target.value)}
            placeholder="GG.AA.YYYY"
            value={form.birthDate ?? ""}
          />
        </Field>
        <Field label="Cinsiyet">
          <Input
            onChange={(event) => setField("gender", event.target.value)}
            placeholder="Kadın / Erkek"
            value={form.gender ?? ""}
          />
        </Field>
        <Field label="Personel durumu">
          <Select onChange={(event) => setField("status", event.target.value as EmployeeStatus)} value={form.status}>
            <option>Aktif</option>
            <option>Pasif</option>
          </Select>
        </Field>
        <Field label="Sonuç durumu">
          <Select
            onChange={(event) => setField("lastResult", event.target.value as ResultStatus)}
            value={form.lastResult}
          >
            <option>Bekliyor</option>
            <option>Sonuç var</option>
            <option>Eksik</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

export async function extractResultText(file: File, onProgress?: (message: string) => void) {
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
      onProgress?.("OCR kullanılamadı; dosya adıyla eşleştirme deneniyor");
    }
  }
  return text;
}

export function fileToDataUrl(file: File) {
  return new Promise<string | undefined>((resolve) => {
    if (file.size > 3_000_000) {
      resolve(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

const resultNameStopWords = new Set([
  "sonuc",
  "sonuç",
  "tarih",
  "saat",
  "normal",
  "rapor",
  "tetkik",
  "laboratuvar",
  "radyoloji",
  "deger",
  "değer",
  "firma",
  "sirket",
  "şirket",
  "personel",
]);

export function findUnknownResultNames(text: string, knownEmployees: Employee[], companyName: string) {
  const known = new Set(knownEmployees.map((employee) => normalizeResultText(employee.name)));
  const company = normalizeResultText(companyName);
  const candidates = new Set<string>();
  const patterns = [
    /\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+){1,2}\b/g,
    /\b[A-ZÇĞİÖŞÜ]{2,}(?:\s+[A-ZÇĞİÖŞÜ]{2,}){1,2}\b/g,
  ];
  for (const line of text.split(/\r?\n/)) {
    const labeledName = line
      .match(/(?:ad\s*soyad|personel|çalışan|calisan|hasta|isim)\s*[:：-]\s*([^|;,]+)/i)?.[1]
      ?.trim();
    if (labeledName) candidates.add(labeledName.replace(/\s+/g, " "));
    for (const pattern of patterns) {
      for (const match of line.matchAll(pattern)) {
        const candidate = match[0].trim();
        const normalized = normalizeResultText(candidate);
        const words = normalized.match(/[a-z0-9]+/g) ?? [];
        if (
          words.length < 2 ||
          words.some((word) => resultNameStopWords.has(word)) ||
          company.includes(normalized) ||
          known.has(normalized)
        )
          continue;
        candidates.add(candidate.replace(/\s+/g, " "));
      }
    }
  }
  return Array.from(candidates)
    .filter((candidate) => {
      const normalized = normalizeResultText(candidate);
      const words = normalized.match(/[a-z0-9]+/g) ?? [];
      return (
        words.length >= 2 &&
        !words.some((word) => resultNameStopWords.has(word)) &&
        !company.includes(normalized) &&
        !known.has(normalized)
      );
    })
    .slice(0, 30);
}

export function findNameCandidatesFromFiles(files: File[], knownEmployees: Employee[], companyName: string) {
  const known = new Set(knownEmployees.map((employee) => normalizeResultText(employee.name)));
  const company = normalizeResultText(companyName);
  return files
    .map((file) =>
      file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[_.-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((candidate) => {
      const normalized = normalizeResultText(candidate);
      const words = candidate.split(" ").filter(Boolean);
      return (
        words.length >= 2 &&
        normalized.length >= 5 &&
        !known.has(normalized) &&
        !company.includes(normalized) &&
        !words.some((word) => resultNameStopWords.has(normalizeResultText(word)))
      );
    });
}

function ResultImportModal({
  open,
  companies,
  employees,
  onClose,
  onMatched,
}: {
  open: boolean;
  companies: Array<{ id: number; name: string }>;
  employees: Employee[];
  onClose: () => void;
  onMatched: (
    employeeIds: number[],
    fileCount: number,
    newNames: string[],
    companyId: number,
    records?: ResultRecord[],
  ) => void;
}) {
  const [selectedCompany, setSelectedCompany] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [matching, setMatching] = useState(false);
  const [progress, setProgress] = useState("");
  const [matchError, setMatchError] = useState("");
  const [matchResult, setMatchResult] = useState<{
    matched: Employee[];
    missing: string[];
    unknown: string[];
    records: ResultRecord[];
    unknownRecords: ResultRecord[];
    analysisSummary: { normal: number; attention: number; unreadable: number };
  } | null>(null);
  const operationRef = useRef(0);
  const companyEmployees = employees.filter((employee) => employee.companyId === selectedCompany);
  const chooseFiles = (nextFiles: FileList | null) => {
    if (nextFiles?.length) {
      setFiles((current) => {
        const existing = new Set(current.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
        return [...current, ...Array.from(nextFiles)].filter((file, index, all) => {
          const key = `${file.name}-${file.size}-${file.lastModified}`;
          return (
            !existing.has(key) ||
            all.findIndex((item) => `${item.name}-${item.size}-${item.lastModified}` === key) === index
          );
        });
      });
    }
  };
  const removeFile = (fileToRemove: File) => {
    setFiles((current) =>
      current.filter(
        (file) =>
          `${file.name}-${file.size}-${file.lastModified}` !==
          `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`,
      ),
    );
    setMatchResult(null);
    setMatchError("");
  };
  const closeModal = () => {
    operationRef.current += 1;
    setMatching(false);
    setProgress("");
    setFiles([]);
    setMatchResult(null);
    setMatchError("");
    setSelectedCompany(0);
    onClose();
  };
  const matchFiles = async () => {
    const operationId = ++operationRef.current;
    setMatching(true);
    setMatchResult(null);
    setMatchError("");
    setProgress(`0 / ${files.length} dosya okunuyor`);
    try {
      const chunks: string[] = [];
      for (const [index, file] of files.entries()) {
        if (operationRef.current !== operationId) return;
        setProgress(`${index + 1} / ${files.length} dosya okunuyor`);
        try {
          chunks.push(await extractResultText(file, setProgress));
        } catch (error) {
          throw new Error(
            `${file.name} okunamadı: ${error instanceof Error ? error.message : "dosya içeriği çözümlenemedi"}`,
          );
        }
      }
      if (operationRef.current !== operationId) return;
      const extractedText = chunks.join("\n");
      const fileNameText = files.map((file) => file.name.replace(/\.[^.]+$/, "")).join("\n");
      const searchableText = `${extractedText}\n${fileNameText}`;
      const normalizedText = normalizeResultText(searchableText);
      const matched = companyEmployees.filter((employee) =>
        normalizedText.includes(normalizeResultText(employee.name)),
      );
      const missing = companyEmployees
        .filter((employee) => !matched.some((item) => item.id === employee.id))
        .map((employee) => employee.name);
      const companyName = companies.find((company) => company.id === selectedCompany)?.name ?? "";
      const unknown = Array.from(
        new Set([
          ...findUnknownResultNames(searchableText, companyEmployees, companyName),
          ...findNameCandidatesFromFiles(files, companyEmployees, companyName),
        ]),
      ).slice(0, 30);
      if (!extractedText.trim() && !fileNameText.trim())
        throw new Error(
          "PDF içinde seçilebilir metin bulunamadı. Dosya adında çalışan adı yoksa taranmış görüntü için OCR destekli bir PDF kullanın.",
        );
      const dataUrls = await Promise.all(files.map((file) => fileToDataUrl(file)));
      const records: ResultRecord[] = [];
      const unknownRecords: ResultRecord[] = [];
      const analysisSummary = { normal: 0, attention: 0, unreadable: 0 };
      files.forEach((file, index) => {
        const fileText = chunks[index] ?? "";
        const fileSearch = normalizeResultText(`${fileText}\n${file.name.replace(/\.[^.]+$/, "")}`);
        const fileMatched = matched.filter((employee) => fileSearch.includes(normalizeResultText(employee.name)));
        const fileUnknown = unknown.filter((name) => fileSearch.includes(normalizeResultText(name)));
        const fileAnalysis = analyzeResultText(fileText);
        analysisSummary[fileAnalysis.status] += 1;
        const screeningType = detectScreeningType(`${fileText}\n${file.name}`);
        const makeRecord = (
          employeeName: string,
          employeeId: number | null,
          profile?: ReturnType<typeof extractEmployeeProfile>,
        ) => ({
          id: createResultId(),
          employeeId,
          employeeName,
          companyId: selectedCompany,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          extractedText: fileText.slice(0, 100_000),
          dataUrl: dataUrls[index],
          analysis: fileAnalysis,
          screeningType,
          profile,
        });
        fileMatched.forEach((employee) => records.push(makeRecord(employee.name, employee.id)));
        fileUnknown.forEach((name) =>
          unknownRecords.push(makeRecord(name, null, extractEmployeeProfile(fileText, name))),
        );
        if (!fileMatched.length && !fileUnknown.length) records.push(makeRecord("Eşleşmeyen rapor", null));
      });
      setMatchResult({ matched, missing, unknown, records, unknownRecords, analysisSummary });
      if (!unknown.length)
        onMatched(
          matched.map((employee) => employee.id),
          files.length,
          [],
          selectedCompany,
          records,
        );
    } catch (error) {
      setMatchError(
        error instanceof Error ? error.message : "PDF okunamadı. Dosyanın metin içeren bir PDF olduğundan emin olun.",
      );
    } finally {
      if (operationRef.current === operationId) {
        setMatching(false);
        setProgress("");
      }
    }
  };
  return (
    <Modal
      description="Birden fazla PDF veya sonuç dosyasını okuyup isimleri seçtiğiniz firmanın çalışanlarıyla eşleştirin."
      eyebrow="Toplu sonuç aktarımı"
      footer={
        <>
          <Button onClick={closeModal} variant="ghost">
            Kapat
          </Button>
          <Button disabled={!selectedCompany || !files.length || matching} onClick={() => void matchFiles()}>
            <ClipboardCheck />{" "}
            {matching
              ? progress || "PDF okunuyor…"
              : files.length
                ? `${files.length} dosyayı eşleştir`
                : "Eşleştirmeyi başlat"}
          </Button>
        </>
      }
      icon={FileUp}
      onClose={closeModal}
      open={open}
      size="xl"
      title="Sonuç dosyalarını aktar"
    >
      <div className="space-y-5">
        <div className="bg-card-muted border-border grid gap-2 rounded-2xl border p-2 sm:grid-cols-3">
          {["Firma seç", "Dosyaları yükle", "Eşleştir ve aktar"].map((step, index) => (
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5",
                index === 0 && selectedCompany ? "bg-brand-soft" : "bg-card",
              )}
              key={step}
            >
              <span className="bg-brand-soft text-brand flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                {index + 1}
              </span>
              <span className="text-heading text-xs font-semibold">{step}</span>
            </div>
          ))}
        </div>
        <Field label="Sonuçların ait olduğu firma" required>
          <Select
            onChange={(event) => {
              setSelectedCompany(Number(event.target.value));
              setMatchResult(null);
              setMatchError("");
            }}
            value={selectedCompany}
          >
            <option value={0}>Firma seçin</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
        </Field>
        <label className="border-border-strong bg-card-muted hover:border-brand-outline flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-7 text-center transition-colors">
          <span className="bg-brand-soft text-brand flex size-12 items-center justify-center rounded-2xl">
            <FileUp className="size-6" />
          </span>
          <span className="text-heading mt-3 text-sm font-semibold">
            {files.length ? `${files.length} dosya seçildi` : "PDF veya sonuç dosyalarını seçin"}
          </span>
          <span className="text-muted mt-1 text-xs">
            Birden fazla PDF, CSV veya TXT seçebilirsiniz. Aynı dosya tekrar eklenmez.
          </span>
          <input
            accept=".pdf,.csv,.txt"
            className="sr-only"
            multiple
            onChange={(event) => {
              chooseFiles(event.target.files);
              setMatchResult(null);
              setMatchError("");
            }}
            type="file"
          />
        </label>
        {matchError && <Alert tone="danger">{matchError}</Alert>}
        {matching && (
          <div className="bg-brand-soft text-brand rounded-xl px-4 py-3 text-sm font-medium">
            {progress || "Dosyalar okunuyor…"}
          </div>
        )}
        {files.length > 0 && (
          <div className="border-border bg-card-muted/50 rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-heading text-sm font-semibold">Seçilen dosyalar</p>
                <p className="text-muted mt-1 text-xs">
                  {files.length} dosya seçildi, PDF metni eşleştirme sırasında okunacak.
                </p>
              </div>
              <Badge tone="info">{files.length} dosya</Badge>
            </div>
            <div className="mt-3 max-h-28 space-y-2 overflow-y-auto">
              {files.map((file) => (
                <div
                  className="bg-card border-border flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"
                  key={`${file.name}-${file.lastModified}`}
                >
                  <FileCheck2 className="text-brand size-4 shrink-0" />
                  <span className="text-foreground truncate">{file.name}</span>
                  <span className="text-subtle ml-auto shrink-0">{Math.max(1, Math.round(file.size / 1024))} KB</span>
                  <button
                    aria-label={`${file.name} dosyasını kaldır`}
                    className="text-muted hover:bg-danger-soft hover:text-danger rounded-md p-1 transition-colors"
                    onClick={() => removeFile(file)}
                    type="button"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {selectedCompany && files.length > 0 && (
          <div className="border-border bg-card-muted/50 rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-heading text-sm font-semibold">Eşleştirme önizlemesi</p>
                <p className="text-muted mt-1 text-xs">Firma çalışanları PDF metni içinde aranacak.</p>
              </div>
              <Badge tone={matchResult ? "brand" : "info"}>
                {matchResult ? `${matchResult.matched.length} eşleşti` : "Hazır"}
              </Badge>
            </div>
            {matchResult && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  ["Eşleşen", matchResult.matched.length, "brand"],
                  ["Yeni kayıt", matchResult.unknown.length, "warning"],
                  [
                    "İncelenecek",
                    matchResult.analysisSummary.attention + matchResult.analysisSummary.unreadable,
                    "danger",
                  ],
                ].map(([label, value, tone]) => (
                  <div className="bg-card border-border rounded-xl border px-3 py-2" key={String(label)}>
                    <p className="text-muted text-[10px] font-medium">{label}</p>
                    <p
                      className={cn(
                        "mt-1 text-lg font-semibold",
                        tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : "text-brand",
                      )}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 space-y-2">
              {(matchResult ? matchResult.matched : companyEmployees).slice(0, 5).map((employee) => (
                <div
                  className="bg-card border-border flex items-center justify-between rounded-xl border px-3 py-2.5"
                  key={employee.id}
                >
                  <span className="text-foreground flex items-center gap-2 text-xs font-medium">
                    <span className="bg-brand-soft text-brand flex size-7 items-center justify-center rounded-lg text-[10px] font-bold">
                      {initials(employee.name)}
                    </span>
                    {employee.name}
                  </span>
                  <span className="text-brand text-[10px] font-semibold">
                    {matchResult ? "Eşleşti" : "Kontrol edilecek"}
                  </span>
                </div>
              ))}
              {matchResult && (
                <p className="text-muted pt-2 text-xs">
                  {matchResult.missing.length
                    ? `${matchResult.missing.length} kayıtlı personel dosyalarda bulunamadı.`
                    : "Tüm kayıtlı firma çalışanları dosyalarda bulundu."}
                </p>
              )}
              {matchResult && !matchResult.matched.length && !matchResult.unknown.length && (
                <Alert tone="warning">
                  Kayıtlı bir isim bulunamadı. PDF metni taranmış görüntü ise isimleri okuyabilmek için metin içeren bir
                  PDF veya OCR çıktısı kullanın.
                </Alert>
              )}
            </div>
          </div>
        )}
        {matchResult?.unknown.length ? (
          <div className="border-warning bg-warning-soft rounded-2xl border p-4">
            <p className="text-heading text-sm font-semibold">Kayıtlı olmayan kişiler bulundu</p>
            <p className="text-muted mt-1 text-xs">
              Bu isimler seçilen firmada kayıtlı değil. Yeni personel kaydı açıp sonuçlarını eşleştirelim mi?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {matchResult.unknown.map((name) => (
                <Badge key={name} tone="warning">
                  {name}
                </Badge>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  onMatched(
                    matchResult.matched.map((employee) => employee.id),
                    files.length,
                    matchResult.unknown,
                    selectedCompany,
                    [...matchResult.records, ...matchResult.unknownRecords],
                  );
                  setMatchResult({ ...matchResult, unknown: [] });
                }}
              >
                <UserRound /> Evet, yeni kayıtları aç ve eşleştir
              </Button>
              <Button onClick={() => setMatchResult({ ...matchResult, unknown: [] })} variant="secondary">
                Hayır, sadece kayıtlıları eşleştir
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

type ImportedEmployeeRow = EmployeeForm & { valid: boolean; message: string };

const normalizeImportHeader = (value: unknown) =>
  String(value ?? "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[^a-z0-9]/g, "");

const importAliases = {
  name: ["adsoyad", "ad", "isim", "personel", "calisan", "calisanadsoyad", "fullname"],
  company: ["firma", "sirket", "company"],
  department: ["departman", "bolum", "birim", "department"],
  position: ["gorev", "unvan", "pozisyon", "position"],
  email: ["eposta", "email", "mail"],
  phone: ["telefon", "gsm", "phone", "tel"],
  status: ["durum", "status"],
} as const;

function findImportValue(row: Record<string, unknown>, aliases: readonly string[]) {
  const entry = Object.entries(row).find(([key]) => aliases.includes(normalizeImportHeader(key)));
  return String(entry?.[1] ?? "").trim();
}

function splitCsvLine(line: string, separator: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === separator && !quoted) {
      values.push(value.trim());
      value = "";
    } else value += character;
  }
  values.push(value.trim());
  return values;
}

function ExcelImportModal({
  open,
  companies,
  employees,
  onClose,
  onImport,
}: {
  open: boolean;
  companies: Array<{ id: number; name: string }>;
  employees: Employee[];
  onClose: () => void;
  onImport: (rows: EmployeeForm[]) => void;
}) {
  const [fallbackCompanyId, setFallbackCompanyId] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportedEmployeeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setFile(null);
    setRows([]);
    setLoading(false);
    setError("");
  };
  const close = () => {
    reset();
    onClose();
  };
  const companyByName = (value: string) =>
    companies.find((company) => company.name.toLocaleLowerCase("tr-TR") === value.toLocaleLowerCase("tr-TR"));
  const parseFile = async (nextFile: File) => {
    setFile(nextFile);
    setRows([]);
    setError("");
    setLoading(true);
    try {
      let records: Record<string, unknown>[] = [];
      if (nextFile.name.toLocaleLowerCase("tr-TR").endsWith(".csv")) {
        const text = await nextFile.text();
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length > 1) {
          const separator = (lines[0].match(/;/g) ?? []).length > (lines[0].match(/,/g) ?? []).length ? ";" : ",";
          const headers = splitCsvLine(lines[0], separator);
          records = lines
            .slice(1)
            .map((line) =>
              Object.fromEntries(headers.map((header, index) => [header, splitCsvLine(line, separator)[index] ?? ""])),
            );
        }
      } else {
        const { Workbook } = await import("exceljs");
        const workbook = new Workbook();
        await workbook.xlsx.load(await nextFile.arrayBuffer());
        const worksheet = workbook.worksheets[0];
        const matrix: unknown[][] = [];
        worksheet?.eachRow({ includeEmpty: false }, (row) => {
          const values = Array.isArray(row.values) ? row.values.slice(1) : [];
          matrix.push(values as unknown[]);
        });
        const headers = matrix[0] ?? [];
        records = matrix
          .slice(1)
          .map((values) =>
            Object.fromEntries(headers.map((header, index) => [String(header ?? ""), values[index] ?? ""])),
          );
      }
      if (!records.length) throw new Error("Dosyada aktarılabilir satır bulunamadı.");
      const imported = records.map((record) => {
        const name = findImportValue(record, importAliases.name);
        const companyText = findImportValue(record, importAliases.company);
        const matchedCompany = companyText ? companyByName(companyText) : undefined;
        const companyId = matchedCompany?.id ?? fallbackCompanyId;
        const form: EmployeeForm = {
          companyId,
          name,
          department: findImportValue(record, importAliases.department),
          position: findImportValue(record, importAliases.position),
          email: findImportValue(record, importAliases.email),
          phone: findImportValue(record, importAliases.phone),
          status:
            findImportValue(record, importAliases.status).toLocaleLowerCase("tr-TR") === "pasif" ? "Pasif" : "Aktif",
          lastResult: "Bekliyor",
        };
        const valid = Boolean(name && companyId);
        const existing = valid
          ? employees.find(
              (employee) =>
                employee.companyId === companyId &&
                employee.name.toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR"),
            )
          : undefined;
        const message = !name
          ? "Ad soyad eksik"
          : !companyId
            ? "Firma eşleşmedi"
            : existing
              ? "Güncellenecek"
              : "Yeni kayıt";
        return { ...form, valid, message };
      });
      setRows(imported);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Dosya okunamadı. Excel başlıklarını kontrol edin.");
    } finally {
      setLoading(false);
    }
  };
  const validRows = rows.filter((row) => row.valid);
  const newCount = validRows.filter((row) => row.message === "Yeni kayıt").length;
  const updateCount = validRows.filter((row) => row.message === "Güncellenecek").length;
  const chooseFallback = (value: string) => {
    const nextId = Number(value);
    setFallbackCompanyId(nextId);
    if (file && rows.some((row) => !row.valid && row.message === "Firma eşleşmedi")) void parseFile(file);
  };

  return (
    <Modal
      description="XLSX veya CSV dosyasındaki personel bilgilerini otomatik tanıyıp firma kayıtlarına aktarın."
      eyebrow="Excel personel aktarımı"
      footer={
        <>
          <Button onClick={close} variant="ghost">
            Vazgeç
          </Button>
          <Button
            disabled={!validRows.length || loading}
            onClick={() => {
              onImport(validRows.map(({ valid: _valid, message: _message, ...row }) => row));
              reset();
            }}
          >
            <FileSpreadsheet /> {validRows.length ? `${validRows.length} kaydı aktar` : "Aktarılacak kayıt yok"}
          </Button>
        </>
      }
      icon={FileSpreadsheet}
      onClose={close}
      open={open}
      size="xl"
      title="Personel listesini Excel'den aktar"
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
          <Field label="Firma sütunu yoksa kullanılacak firma">
            <Select onChange={(event) => chooseFallback(event.target.value)} value={fallbackCompanyId}>
              <option value={0}>Firma seçmeden devam et</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
          </Field>
          <label className="border-border-strong bg-card-muted hover:border-brand-outline flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-4 py-3 transition-colors">
            <span className="bg-brand-soft text-brand flex size-10 shrink-0 items-center justify-center rounded-xl">
              <FileSpreadsheet className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="text-heading block truncate text-sm font-semibold">
                {file ? file.name : "Excel dosyası seçin"}
              </span>
              <span className="text-muted mt-1 block text-xs">.xlsx veya .csv</span>
            </span>
            <input
              accept=".xlsx,.csv"
              className="sr-only"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) void parseFile(selected);
              }}
              type="file"
            />
          </label>
        </div>
        {loading && (
          <div className="bg-card-muted text-muted rounded-xl px-4 py-3 text-sm">
            Excel dosyası okunuyor ve başlıklar eşleştiriliyor…
          </div>
        )}
        {error && <Alert tone="danger">{error}</Alert>}
        {rows.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Badge tone="info">{rows.length} satır</Badge>
              <Badge tone="brand">{newCount} yeni</Badge>
              <Badge tone={rows.length - validRows.length ? "danger" : "warning"}>
                {updateCount} güncelleme · {rows.length - validRows.length} hatalı
              </Badge>
            </div>
            <div className="border-border overflow-x-auto rounded-2xl border">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-card-muted text-subtle">
                  <tr>
                    <th className="px-3 py-2.5">Personel</th>
                    <th className="px-3 py-2.5">Firma</th>
                    <th className="px-3 py-2.5">Departman</th>
                    <th className="px-3 py-2.5">Görev</th>
                    <th className="px-3 py-2.5">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-divider divide-y">
                  {rows.slice(0, 12).map((row, index) => (
                    <tr key={`${row.name}-${index}`}>
                      <td className="text-heading px-3 py-2.5 font-medium">{row.name || "—"}</td>
                      <td className="text-muted px-3 py-2.5">
                        {companies.find((company) => company.id === row.companyId)?.name ?? "Eşleşmedi"}
                      </td>
                      <td className="text-muted px-3 py-2.5">{row.department || "—"}</td>
                      <td className="text-muted px-3 py-2.5">{row.position || "—"}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={row.valid ? (row.message === "Yeni kayıt" ? "brand" : "warning") : "danger"}>
                          {row.message}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 12 && (
                <p className="text-muted px-3 py-2 text-xs">
                  İlk 12 satır gösteriliyor, aktarımda {rows.length} satırın tamamı kullanılacak.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
