"use client";

import type ExcelJS from "exceljs";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Edit3,
  FileSpreadsheet,
  FlaskConical,
  Plus,
  Tag,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/settings/settings-card";
import { Badge, CountPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FilterSelect, Input, SearchInput, Select } from "@/components/ui/field";
import { Alert, ConfirmDialog, Modal } from "@/components/ui/modal";
import { useTestCategories, useTests } from "@/lib/data";
import { type TestItem } from "@/lib/demo-data";
import { money } from "@/lib/format";
import { useConfirm, useNotice } from "@/lib/hooks";
import { includesQuery } from "@/lib/utils";

type TestForm = { code: string; name: string; category: string; price: string };
type FormErrors = Partial<Record<keyof TestForm, string>>;
type ImportResult = { added: number; updated: number; errors: string[] };

const emptyForm: TestForm = { code: "", name: "", category: "", price: "0" };
const allCategories = "Tüm kategoriler";

const categoryPrefixes: Record<string, string> = {
  Radyoloji: "RAD",
  İşitme: "ODY",
  Solunum: "SOL",
  Laboratuvar: "LAB",
  Muayene: "MUY",
};

function generateTestCode(category: string, tests: TestItem[]) {
  const prefix =
    (categoryPrefixes[category] ??
      category
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 3)
        .toUpperCase()) || "TST";
  const highest = tests.reduce((max, test) => {
    const match = test.code.match(new RegExp(`^${prefix}-(\\d+)$`));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(3, "0")}`;
}

function validateForm(form: TestForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Test adı zorunludur.";
  if (!form.category.trim()) errors.category = "Kategori seçin.";
  if (Number(form.price) < 0) errors.price = "Fiyat negatif olamaz.";
  return errors;
}

export default function TestsSettings() {
  const [tests, setTests] = useTests();
  const [categories, setCategories] = useTestCategories();
  const [notice, showNotice] = useNotice();
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(allCategories);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TestForm>(emptyForm);
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const missing = tests.map((t) => t.category).filter((c) => c && !categories.includes(c));
    if (missing.length > 0) {
      const unique = missing.filter((item, index) => missing.indexOf(item) === index);
      setCategories((current) => [...current, ...unique]);
    }
  }, [tests, categories, setCategories]);

  const filtered = useMemo(
    () =>
      tests.filter(
        (test) =>
          (category === allCategories || test.category === category) &&
          includesQuery(`${test.code} ${test.name} ${test.category}`, query),
      ),
    [tests, category, query],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, filtered.length);
  const setField = (key: keyof TestForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(true);
  };
  const openEdit = (test: TestItem) => {
    setForm({ code: test.code, name: test.name, category: test.category, price: String(test.price) });
    setEditingId(test.id);
    setFormOpen(true);
  };
  const save = () => {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) return;
    const normalized = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      category: form.category.trim(),
      price: Math.max(0, Number(form.price) || 0),
    };
    if (editingId === null) {
      setTests((current) => [
        ...current,
        { ...normalized, code: generateTestCode(normalized.category, current), id: Date.now(), active: true },
      ]);
      showNotice("Yeni test eklendi.");
    } else {
      setTests((current) => current.map((t) => (t.id === editingId ? { ...t, ...normalized } : t)));
      showNotice("Test güncellendi.");
    }
    setFormOpen(false);
    setEditingId(null);
  };
  const remove = (test: TestItem) => {
    confirm({ title: "Testi katalogdan kaldır", description: `${test.name} katalogdan kaldırılacak.`, onConfirm: () => {
      setTests((current) => current.filter((t) => t.id !== test.id));
      showNotice("Test katalogdan kaldırıldı.");
    }});
  };
  const toggleActive = (test: TestItem) => {
    setTests((current) => current.map((t) => (t.id === test.id ? { ...t, active: !t.active } : t)));
    showNotice(test.active ? `${test.name} pasifleştirildi.` : `${test.name} aktifleştirildi.`);
  };

  const downloadTemplate = async () => {
    const { Workbook } = await import("exceljs/dist/exceljs.min.js");
    const workbook = new Workbook();
    workbook.creator = "HanTech OSGB Yönetim Sistemi";
    const sheet = workbook.addWorksheet("Testler");
    sheet.columns = [
      { header: "Test Adı", key: "name", width: 32 },
      { header: "Kategori", key: "category", width: 22 },
      { header: "Birim Fiyat (₺)", key: "price", width: 18 },
    ];
    tests.filter((t) => t.active).forEach((t) => sheet.addRow({ name: t.name, category: t.category, price: t.price }));
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF103C3A" } };
    sheet.getColumn(3).numFmt = "₺#,##0";
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = { from: "A1", to: `C${Math.max(1, tests.filter((t) => t.active).length + 1)}` };
    const guide = workbook.addWorksheet("Kullanım");
    guide.columns = [
      { header: "Bilgi", key: "info", width: 28 },
      { header: "Açıklama", key: "description", width: 90 },
    ];
    guide.addRows([
      ["Amaç", "Bu dosyayı düzenleyerek testleri toplu ekleyebilir veya güncelleyebilirsiniz."],
      ["Zorunlu alanlar", "Test Adı, Kategori ve Birim Fiyat zorunludur. Test kodu sistem tarafından atanır."],
      ["Güncelleme", "Aynı test adı ve kategori mevcutsa güncellenir; yeni testlere kod otomatik atanır."],
      ["Dosya", "Yalnızca .xlsx formatı desteklenir."],
    ]);
    guide.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    guide.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF299B7C" } };
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hantech-test-katalogu-sablon.xlsx";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importWorkbook = async (file: File) => {
    const { Workbook } = await import("exceljs/dist/exceljs.min.js");
    const workbook = new Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("Dosyada çalışma sayfası bulunamadı.");
    const headers = new Map<string, number>();
    sheet.getRow(1).eachCell((cell, index) => headers.set(cell.text.trim().toLocaleLowerCase("tr-TR"), index));
    const required = ["test adı", "kategori", "birim fiyat (₺)"];
    const missing = required.filter((header) => !headers.has(header));
    if (missing.length > 0) throw new Error(`Eksik sütun: ${missing.join(", ")}`);
    const read = (row: ExcelJS.Row, header: string) => row.getCell(headers.get(header) ?? 0).value;
    const parsePrice = (value: unknown) => {
      if (typeof value === "number") return value;
      const text = String(value ?? "").replace(/₺/g, "").replace(/\s/g, "");
      return Number(text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text);
    };
    const errors: string[] = [];
    const imported: Array<{ name: string; category: string; price: number }> = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const name = String(read(row, "test adı") ?? "").trim();
      const itemCategory = String(read(row, "kategori") ?? "").trim();
      const rawPrice = read(row, "birim fiyat (₺)");
      const price = parsePrice(rawPrice);
      if (!name && !itemCategory && !String(rawPrice ?? "").trim()) return;
      if (!name || !itemCategory || !Number.isFinite(price) || price < 0) {
        errors.push(`${rowNumber}. satır: Ad, kategori ve geçerli fiyat zorunludur.`);
        return;
      }
      imported.push({ name, category: itemCategory, price });
    });
    const unique = Array.from(
      new Map(
        imported.map((item) => [
          `${item.name.toLocaleLowerCase("tr-TR")}|${item.category.toLocaleLowerCase("tr-TR")}`,
          item,
        ]),
      ).values(),
    );
    let added = 0;
    let updated = 0;
    setTests((current) => {
      const byName = new Map(
        current.map((t) => [
          `${t.name.toLocaleLowerCase("tr-TR")}|${t.category.toLocaleLowerCase("tr-TR")}`,
          t,
        ]),
      );
      unique.forEach((item) => {
        const key = `${item.name.toLocaleLowerCase("tr-TR")}|${item.category.toLocaleLowerCase("tr-TR")}`;
        const existing = byName.get(key);
        if (existing) {
          byName.set(key, {
            ...existing,
            name: item.name,
            category: item.category,
            price: item.price,
            code: existing.code || generateTestCode(item.category, Array.from(byName.values())),
          });
          updated += 1;
        } else {
          byName.set(key, {
            ...item,
            code: generateTestCode(item.category, Array.from(byName.values())),
            id: Date.now() + added,
            active: true,
          });
          added += 1;
        }
      });
      return Array.from(byName.values());
    });
    setImportResult({ added, updated, errors });
  };
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLocaleLowerCase("tr-TR").endsWith(".xlsx")) {
      setImportResult({ added: 0, updated: 0, errors: ["Sadece .xlsx uzantılı Excel dosyaları yüklenebilir."] });
      return;
    }
    try {
      await importWorkbook(file);
    } catch (error) {
      setImportResult({
        added: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : "Excel dosyası okunamadı."],
      });
    }
  };

  return (
    <Card className="p-5 sm:p-7">
      <div className="">
        <SectionHeading
          action={
            <>
              <Button onClick={() => { setImportResult(null); setImportOpen(true); }} size="sm" variant="outline">
                <Upload /> Toplu yükle
              </Button>
              <Button onClick={() => setCategoryOpen(true)} size="sm" variant="outline">
                <Tag /> Kategoriler
              </Button>
              <Button onClick={openNew} size="sm">
                <Plus /> Yeni test
              </Button>
            </>
          }
          description="Aktif testler yeni tarama ve teklif formlarında seçilebilir."
          title="Test listesi"
        />
      </div>

      {notice && <Alert className="mt-4" icon={Check}>{notice}</Alert>}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          aria-label="Test ara"
          className="min-w-0 flex-1"
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Test kodu, adı veya kategori ara..."
          value={query}
        />
        <FilterSelect
          label="Kategori"
          onChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
          options={[allCategories, ...categories]}
          value={category}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead className="border-b border-divider bg-card-muted">
              <tr>
                {["Kod", "Test adı", "Kategori", "Fiyat", "Durum", ""].map((heading) => (
                  <th className="px-4 py-3 text-[10px] font-bold tracking-[0.12em] text-subtle uppercase" key={heading}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {paged.map((test) => (
                <tr className="transition-colors hover:bg-card-muted" key={test.id}>
                  <td className="px-4 py-3 text-xs font-bold tracking-[0.08em] text-brand">{test.code}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{test.name}</td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">
                      <Tag className="size-3" />
                      {test.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{money(test.price)}</td>
                  <td className="px-4 py-3">
                    <button
                      aria-pressed={test.active}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                        test.active
                          ? "bg-brand-soft text-brand-soft-fg"
                          : "bg-danger-soft text-danger"
                      }`}
                      onClick={() => toggleActive(test)}
                      type="button"
                    >
                      {test.active ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        aria-label={`${test.name} düzenle`}
                        onClick={() => openEdit(test)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Edit3 />
                      </Button>
                      <Button
                        aria-label={`${test.name} sil`}
                        onClick={() => remove(test)}
                        size="icon-sm"
                        variant="danger"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-divider md:hidden">
          {paged.map((test) => (
            <div className="flex items-center justify-between gap-3 p-4" key={test.id}>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.08em] text-brand">{test.code}</p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">{test.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {test.category} · {money(test.price)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button aria-label={`${test.name} düzenle`} onClick={() => openEdit(test)} size="icon-sm" variant="ghost">
                  <Edit3 />
                </Button>
                <Button aria-label={`${test.name} sil`} onClick={() => remove(test)} size="icon-sm" variant="danger">
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <EmptyState
            compact
            description="Arama veya kategori filtresini değiştirerek tekrar deneyin."
            icon={ClipboardCheck}
            title="Filtrelerle eşleşen test yok"
          />
        )}
      </div>

      {filtered.length > pageSize && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted">
            {pageStart}–{pageEnd} / {filtered.length} test
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              aria-label="Önceki sayfa"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              size="icon-sm"
              variant="outline"
            >
              <ChevronLeft />
            </Button>
            {pageNumbers(currentPage, totalPages).map((num, idx) =>
              num === "..." ? (
                <span className="px-1 text-xs text-subtle" key={`gap-${idx}`}>
                  …
                </span>
              ) : (
                <button
                  aria-current={num === currentPage}
                  aria-label={`Sayfa ${num}`}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors ${
                    num === currentPage
                      ? "bg-brand text-brand-fg"
                      : "border border-border text-muted hover:border-brand-outline hover:text-brand"
                  }`}
                  key={num}
                  onClick={() => setPage(num)}
                  type="button"
                >
                  {num}
                </button>
              ),
            )}
            <Button
              aria-label="Sonraki sayfa"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              size="icon-sm"
              variant="outline"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      {formOpen && (
        <TestFormDialog
          categories={categories}
          editing={editingId !== null}
          form={form}
          setField={setField}
          tests={tests}
          onClose={() => setFormOpen(false)}
          onSave={save}
        />
      )}
      {importOpen && (
      <ImportDialog
          onClose={() => setImportOpen(false)}
          onDownload={downloadTemplate}
          onImport={handleImport}
          result={importResult}
      />
      )}
      {categoryOpen && (
        <CategoryDialog
          categories={categories}
          onClose={() => setCategoryOpen(false)}
          onSave={(next) => setCategories(next)}
          onRename={(from, to) => {
            setCategories((current) => current.map((c) => (c === from ? to : c)));
            setTests((current) => current.map((t) => (t.category === from ? { ...t, category: to } : t)));
          }}
        />
      )}
      <ConfirmDialog onClose={closeConfirm} request={confirmRequest} />
    </Card>
  );
}

function TestFormDialog({
  form,
  categories,
  tests,
  editing,
  setField,
  onClose,
  onSave,
}: {
  form: TestForm;
  categories: string[];
  tests: TestItem[];
  editing: boolean;
  setField: (key: keyof TestForm, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const errors = validateForm(form);
  const shown = submitted ? errors : {};
  const previewCode = editing ? form.code : form.category ? generateTestCode(form.category, tests) : "—";
  const submit = () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    onSave();
  };
  return (
    <Modal
      description="Test adı, kategori ve birim fiyatını belirleyin. Kod otomatik atanır."
      eyebrow="Test kataloğu"
      footer={
        <>
          <Button onClick={onClose} variant="ghost">
            Vazgeç
          </Button>
          <Button onClick={submit}>
            <Check /> {editing ? "Kaydet" : "Testi ekle"}
          </Button>
        </>
      }
      icon={FlaskConical}
      onClose={onClose}
      open
      size="lg"
      title={editing ? "Testi düzenle" : "Yeni test ekle"}
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field label="Otomatik kod">
          <Input className="font-bold tracking-[0.08em] text-brand" readOnly value={previewCode} />
        </Field>
        <Field error={shown.category} label="Kategori" required>
          <Select
            invalid={Boolean(shown.category)}
            onChange={(event) => setField("category", event.target.value)}
            value={form.category}
          >
            <option value="">Kategori seçin</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field className="sm:col-span-2" error={shown.name} label="Test adı" required>
          <Input
            invalid={Boolean(shown.name)}
            onChange={(event) => setField("name", event.target.value)}
            placeholder="Örn. Akciğer grafisi"
            value={form.name}
          />
        </Field>
        <Field error={shown.price} label="Birim fiyat (₺)" required>
          <Input
            invalid={Boolean(shown.price)}
            min={0}
            onChange={(event) => setField("price", event.target.value)}
            type="number"
            value={form.price}
          />
        </Field>
        <button className="hidden" type="submit" />
      </form>
    </Modal>
  );
}

function CategoryDialog({
  categories,
  onClose,
  onSave,
  onRename,
}: {
  categories: string[];
  onClose: () => void;
  onSave: (next: string[]) => void;
  onRename: (from: string, to: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const { request: confirmRequest, confirm, close: closeConfirm } = useConfirm();
  const save = () => {
    const value = draft.trim();
    if (!value) return;
    if (editing) {
      onRename(editing, value);
      setEditing(null);
    } else if (!categories.some((c) => c.toLocaleLowerCase("tr-TR") === value.toLocaleLowerCase("tr-TR"))) {
      onSave([...categories, value]);
    }
    setDraft("");
  };
  return (
    <>
    <Modal
      description="Test kategorilerini merkezi olarak yönetin."
      eyebrow="Test tanımlamaları"
      footer={
        <Button onClick={onClose} variant="ghost">
          Tamam
        </Button>
      }
      icon={Tag}
      onClose={onClose}
      open
      size="lg"
      title="Kategori yönetimi"
    >
      <div className="flex gap-2">
        <Input
          aria-label="Kategori adı"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
          placeholder="Yeni kategori adı"
          value={draft}
        />
        <Button onClick={save} variant="secondary">
          <Plus /> {editing ? "Güncelle" : "Ekle"}
        </Button>
      </div>
      <div className="mt-5 divide-y divide-divider rounded-2xl border border-border">
        {categories.map((cat) => (
          <div className="flex items-center justify-between gap-3 px-4 py-3" key={cat}>
            <span className="text-sm font-medium text-foreground">{cat}</span>
            <div className="flex gap-1">
              <Button
                aria-label={`${cat} düzenle`}
                onClick={() => {
                  setEditing(cat);
                  setDraft(cat);
                }}
                size="icon-sm"
                variant="ghost"
              >
                <Edit3 />
              </Button>
              <Button
                aria-label={`${cat} sil`}
                onClick={() => {
                  confirm({ title: "Kategoriyi sil", description: `${cat} kategorisi silinecek.`, onConfirm: () => {
                    const fallback = categories.find((item) => item !== cat) ?? "Diğer";
                    onRename(cat, fallback);
                    onSave(categories.filter((item) => item !== cat));
                  }});
                }}
                size="icon-sm"
                variant="danger"
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
    <ConfirmDialog onClose={closeConfirm} request={confirmRequest} />
    </>
  );
}

function ImportDialog({
  result,
  onClose,
  onDownload,
  onImport,
}: {
  result: ImportResult | null;
  onClose: () => void;
  onDownload: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Modal
      description="Aktif testlerden şablon oluşturun, düzenleyin ve tekrar yükleyin."
      eyebrow="Excel aktarımı"
      footer={
        <Button onClick={onClose} variant="ghost">
          Tamam
        </Button>
      }
      icon={FileSpreadsheet}
      onClose={onClose}
      open
      size="xl"
      title="Toplu test yükle"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card-muted p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Download className="size-4 text-brand" /> 1. Şablonu indir
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">
            Mevcut aktif testler ve kullanım notları Excel dosyasına eklenir.
          </p>
          <Button className="mt-4" onClick={onDownload} size="sm" variant="outline">
            <Download /> Şablon indir
          </Button>
        </div>
        <label className="cursor-pointer rounded-2xl border border-dashed border-border-strong bg-card-muted p-4 transition-colors hover:border-brand-outline hover:bg-brand-soft/40">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Upload className="size-4 text-brand" /> 2. Excel&rsquo;i yükle
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">
            Düzenlediğiniz .xlsx dosyasını seçin. Aynı test adı ve kategori güncellenir, yeni testlere kod otomatik atanır.
          </p>
          <span className="mt-4 inline-flex rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-brand-fg">
            Dosya seç
          </span>
          <input
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={onImport}
            type="file"
          />
        </label>
      </div>
      {result && (
        <div className="mt-5 rounded-2xl border border-border bg-card-muted p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-soft-fg">
            <CheckCircle2 className="size-4" /> Aktarım özeti
            <CountPill>{result.added + result.updated} kayıt</CountPill>
          </p>
          <p className="mt-2 text-xs text-muted">
            {result.added} yeni test eklendi, {result.updated} test güncellendi.
          </p>
          {result.errors.length > 0 && (
            <div className="mt-3 space-y-1 text-xs text-danger">
              <p className="flex items-center gap-1 font-semibold">
                <AlertCircle className="size-3.5" /> Düzeltilmesi gereken satırlar
              </p>
              {result.errors.slice(0, 5).map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function pageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}
