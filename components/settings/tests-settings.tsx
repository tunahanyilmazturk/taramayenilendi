"use client";

/* Frontend-only test catalog is persisted in localStorage until the backend is added. */
/* eslint-disable react-hooks/set-state-in-effect */

import ExcelJS from "exceljs";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Edit3,
  FileSpreadsheet,
  FlaskConical,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import SettingsCard from "./settings-card";

type TestItem = { id: number; code: string; name: string; category: string; price: number; active: boolean };
type TestForm = Omit<TestItem, "id" | "active">;
type ImportResult = { added: number; updated: number; errors: string[] };

const initialTests: TestItem[] = [
  { id: 1, code: "AKC-001", name: "Akciğer grafisi", category: "Radyoloji", price: 350, active: true },
  { id: 2, code: "ODY-001", name: "Odyometri", category: "İşitme", price: 180, active: true },
  { id: 3, code: "SFT-001", name: "Solunum fonksiyon testi", category: "Solunum", price: 220, active: true },
  { id: 4, code: "KAN-001", name: "Hemogram", category: "Laboratuvar", price: 160, active: true },
  { id: 5, code: "GÖZ-001", name: "Göz muayenesi", category: "Muayene", price: 200, active: false },
];
const emptyForm: TestForm = { code: "", name: "", category: "", price: 0 };
const defaultCategories = ["Radyoloji", "İşitme", "Solunum", "Laboratuvar", "Muayene"];
const categoryPrefixes: Record<string, string> = {
  Radyoloji: "RAD",
  İşitme: "ODY",
  Solunum: "SOL",
  Laboratuvar: "LAB",
  Muayene: "MUY",
};
const generateTestCode = (category: string, tests: TestItem[]) => {
  const prefix =
    (categoryPrefixes[category] ??
      category
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 3)
        .toUpperCase()) ||
    "TST";
  const highest = tests.reduce((max, test) => {
    const match = test.code.match(new RegExp(`^${prefix}-(\\d+)$`));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(3, "0")}`;
};
const ensureTestCodes = (items: TestItem[]) =>
  items.reduce<TestItem[]>(
    (result, test) => [...result, { ...test, code: test.code?.trim() || generateTestCode(test.category, result) }],
    [],
  );

export default function TestsSettings() {
  const [tests, setTests] = useState(initialTests);
  const [categoryList, setCategoryList] = useState(defaultCategories);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tüm kategoriler");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("hantech-tests");
      const storedCategories = window.localStorage.getItem("hantech-test-categories");
      if (stored) {
        const parsed = JSON.parse(stored) as TestItem[];
        if (Array.isArray(parsed)) setTests(ensureTestCodes(parsed));
      }
      if (storedCategories) {
        const parsed = JSON.parse(storedCategories) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) setCategoryList(parsed);
      }
    } catch {
      /* Keep demo catalog when storage is unavailable. */
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem("hantech-tests", JSON.stringify(tests));
  }, [tests, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem("hantech-test-categories", JSON.stringify(categoryList));
  }, [categoryList, hydrated]);
  useEffect(() => {
    const missing = tests.map((test) => test.category).filter((item) => item && !categoryList.includes(item));
    if (missing.length > 0)
      setCategoryList((current) => [...current, ...missing.filter((item, index) => missing.indexOf(item) === index)]);
  }, [tests, categoryList]);
  const categories = useMemo(() => ["Tüm kategoriler", ...categoryList], [categoryList]);
  const filtered = useMemo(
    () =>
      tests.filter(
        (test) =>
          (category === "Tüm kategoriler" || test.category === category) &&
          `${test.code} ${test.name} ${test.category}`
            .toLocaleLowerCase("tr-TR")
            .includes(query.toLocaleLowerCase("tr-TR")),
      ),
    [tests, category, query],
  );
  const money = (value: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value);
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };
  const setField = (key: keyof TestForm, value: string) =>
    setForm((current) => ({ ...current, [key]: key === "price" ? Number(value) : value }));
  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(true);
  };
  const openEdit = (test: TestItem) => {
    setForm({ code: test.code, name: test.name, category: test.category, price: test.price });
    setEditingId(test.id);
    setFormOpen(true);
  };
  const save = () => {
    if (!form.name.trim() || !form.category.trim() || form.price < 0) return;
    const normalized = {
      ...form,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      category: form.category.trim(),
    };
    if (editingId === null)
      setTests((current) => [
        ...current,
        { ...normalized, code: generateTestCode(normalized.category, current), id: Date.now(), active: true },
      ]);
    else setTests((current) => current.map((test) => (test.id === editingId ? { ...test, ...normalized } : test)));
    setFormOpen(false);
    setEditingId(null);
    showNotice("Test kataloğu güncellendi.");
  };
  const remove = (test: TestItem) => {
    if (!window.confirm(`${test.name} testini katalogdan kaldırmak istediğinize emin misiniz?`)) return;
    setTests((current) => current.filter((item) => item.id !== test.id));
    showNotice("Test katalogdan kaldırıldı.");
  };
  const toggleActive = (test: TestItem) =>
    setTests((current) => current.map((item) => (item.id === test.id ? { ...item, active: !item.active } : item)));
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "HanTech OSGB Yönetim Sistemi";
    const sheet = workbook.addWorksheet("Testler");
    sheet.columns = [
      { header: "Test Adı", key: "name", width: 32 },
      { header: "Kategori", key: "category", width: 22 },
      { header: "Birim Fiyat (₺)", key: "price", width: 18 },
    ];
    tests
      .filter((test) => test.active)
      .forEach((test) => sheet.addRow({ name: test.name, category: test.category, price: test.price }));
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF103C3A" } };
    sheet.getColumn(3).numFmt = "₺#,##0";
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = { from: "A1", to: `C${Math.max(1, tests.filter((test) => test.active).length + 1)}` };
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
    const workbook = new ExcelJS.Workbook();
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
      const text = String(value ?? "")
        .replace(/₺/g, "")
        .replace(/\s/g, "");
      return Number(text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text);
    };
    const errors: string[] = [];
    const imported: TestForm[] = [];
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
      imported.push({ code: "", name, category: itemCategory, price });
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
        current.map((test) => [
          `${test.name.toLocaleLowerCase("tr-TR")}|${test.category.toLocaleLowerCase("tr-TR")}`,
          test,
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
    <SettingsCard
      icon={ClipboardCheck}
      title="Test kataloğu"
      description="Taramalarda ve tekliflerde kullanılacak testleri, kategorileri ve birim fiyatlarını yönetin."
    >
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">
              Kayıtlı testler{" "}
              <span className="ml-1 rounded-full bg-[#e5f5ec] px-2 py-1 text-[10px] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
                {tests.length}
              </span>
            </p>
            <p className="mt-1 text-xs text-[#81958f]">Aktif testler yeni tarama ve teklif formlarında seçilebilir.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-[#cfe6da] bg-white px-3 py-2.5 text-xs font-semibold text-[#278b70] transition hover:bg-[#effaf4] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-[#a7f3d0] dark:hover:bg-[#174638]"
              onClick={() => {
                setImportResult(null);
                setImportOpen(true);
              }}
              type="button"
            >
              <Upload className="size-4" /> Toplu test yükle
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-[#cfe6da] bg-white px-3 py-2.5 text-xs font-semibold text-[#278b70] transition hover:bg-[#effaf4] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-[#a7f3d0] dark:hover:bg-[#174638]"
              onClick={() => setCategoryOpen(true)}
              type="button"
            >
              <Tag className="size-4" /> Kategori yönetimi
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-[#103c3a] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#174e4b]"
              onClick={openNew}
              type="button"
            >
              <Plus className="size-4" /> Yeni test ekle
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9ab1ab]" />
            <input
              aria-label="Test ara"
              className="h-10 w-full rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] pr-3 pl-9 text-sm outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Test kodu, adı veya kategori ara..."
              value={query}
            />
          </div>
          <select
            aria-label="Kategori filtresi"
            className="h-10 rounded-xl border border-[#dbe9e4] bg-white px-3 text-xs font-medium text-[#52776d] outline-none dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-[#c4dfd5]"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        {notice && (
          <p className="rounded-xl bg-[#e5f5ec] px-3 py-2 text-xs font-semibold text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
            {notice}
          </p>
        )}
        <div className="overflow-hidden rounded-2xl border border-[#e0ece8] dark:border-[#1d4941]">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead className="border-b border-[#edf3f0] bg-[#fbfdfc] dark:border-[#1d4941] dark:bg-[#102f2d]">
                <tr>
                  {["Test kodu", "Test adı", "Kategori", "Birim fiyat", "Durum", ""].map((heading) => (
                    <th
                      className="px-4 py-3 text-[10px] font-bold tracking-[0.12em] text-[#91a49f] uppercase"
                      key={heading}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3f0] dark:divide-[#1d4941]">
                {filtered.map((test) => (
                  <TestRow
                    key={test.id}
                    test={test}
                    money={money}
                    onEdit={openEdit}
                    onRemove={remove}
                    onToggle={toggleActive}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-[#edf3f0] md:hidden dark:divide-[#1d4941]">
            {filtered.map((test) => (
              <div className="flex items-center justify-between gap-3 p-4" key={test.id}>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.08em] text-[#278b70]">{test.code}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">{test.name}</p>
                  <p className="mt-1 text-xs text-[#81958f]">
                    {test.category} · {money(test.price)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    aria-label={`${test.name} düzenle`}
                    className="rounded-lg p-2 text-[#81958f]"
                    onClick={() => openEdit(test)}
                    type="button"
                  >
                    <Edit3 className="size-4" />
                  </button>
                  <button
                    aria-label={`${test.name} sil`}
                    className="rounded-lg p-2 text-[#a66f60]"
                    onClick={() => remove(test)}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-[#81958f]">Filtrelerle eşleşen test bulunamadı.</p>
          )}
        </div>
      </div>
      {formOpen && (
        <TestForm
          form={form}
          categories={categoryList}
          tests={tests}
          editing={editingId !== null}
          setField={setField}
          onClose={() => setFormOpen(false)}
          onSave={save}
        />
      )}
      {importOpen && (
        <ImportModal
          result={importResult}
          onClose={() => setImportOpen(false)}
          onDownload={downloadTemplate}
          onImport={handleImport}
        />
      )}
      {categoryOpen && (
        <CategoryManager
          categories={categoryList}
          setCategories={setCategoryList}
          setTests={setTests}
          onClose={() => setCategoryOpen(false)}
        />
      )}
    </SettingsCard>
  );
}

function TestRow({
  test,
  money,
  onEdit,
  onRemove,
  onToggle,
}: {
  test: TestItem;
  money: (value: number) => string;
  onEdit: (test: TestItem) => void;
  onRemove: (test: TestItem) => void;
  onToggle: (test: TestItem) => void;
}) {
  return (
    <tr className="transition hover:bg-[#f8fcfa] dark:hover:bg-[#12372f]">
      <td className="px-4 py-3 text-xs font-bold tracking-[0.08em] text-[#278b70]">{test.code}</td>
      <td className="px-4 py-3 text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">{test.name}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0faf4] px-2.5 py-1 text-[10px] font-semibold text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
          <Tag className="size-3" />
          {test.category}
        </span>
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">{money(test.price)}</td>
      <td className="px-4 py-3">
        <button
          aria-pressed={test.active}
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${test.active ? "bg-[#dff6eb] text-[#258b71] dark:bg-[#174638] dark:text-[#a7f3d0]" : "bg-[#f1e8e5] text-[#a66f60] dark:bg-[#49302c] dark:text-[#f0b3a5]"}`}
          onClick={() => onToggle(test)}
          type="button"
        >
          {test.active ? "Aktif" : "Pasif"}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <button
            aria-label={`${test.name} düzenle`}
            className="rounded-lg p-2 text-[#81958f] hover:bg-[#ebf6f0] hover:text-[#278b70]"
            onClick={() => onEdit(test)}
            type="button"
          >
            <Edit3 className="size-4" />
          </button>
          <button
            aria-label={`${test.name} sil`}
            className="rounded-lg p-2 text-[#a66f60] hover:bg-[#fff1ed] dark:hover:bg-[#49302c]"
            onClick={() => onRemove(test)}
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CategoryManager({
  categories,
  setCategories,
  setTests,
  onClose,
}: {
  categories: string[];
  setCategories: (categories: string[]) => void;
  setTests: (updater: (tests: TestItem[]) => TestItem[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const save = () => {
    const value = draft.trim();
    if (!value) return;
    if (editing) {
      setCategories(categories.map((category) => (category === editing ? value : category)));
      setTests((current) => current.map((test) => (test.category === editing ? { ...test, category: value } : test)));
    } else if (!categories.some((category) => category.toLocaleLowerCase("tr-TR") === value.toLocaleLowerCase("tr-TR")))
      setCategories([...categories, value]);
    setDraft("");
    setEditing(null);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#082421]/55 p-4 backdrop-blur-[3px]">
      <section
        aria-label="Kategori yönetimi"
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
              <p className="text-[10px] font-bold tracking-[0.14em] text-[#299b7c] uppercase">Test tanımlamaları</p>
              <h2 className="mt-1 text-xl font-semibold text-[#173e3b] dark:text-[#e8f7f1]">Kategori yönetimi</h2>
              <p className="mt-1 text-xs text-[#81958f]">Test kategorilerini merkezi olarak yönetin.</p>
            </div>
          </div>
          <button
            aria-label="Kategori yönetimini kapat"
            className="rounded-xl p-2 text-[#81958f] hover:bg-[#ebf6f0] dark:hover:bg-[#174638]"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-6 flex gap-2">
          <input
            aria-label="Kategori adı"
            className="h-11 min-w-0 flex-1 rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] px-3 text-sm outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") save();
            }}
            placeholder="Yeni kategori adı"
            value={draft}
          />
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-[#103c3a] px-3.5 text-sm font-semibold text-white hover:bg-[#174e4b]"
            onClick={save}
            type="button"
          >
            <Plus className="size-4" />
            {editing ? "Güncelle" : "Ekle"}
          </button>
        </div>
        <div className="mt-5 divide-y divide-[#edf3f0] rounded-2xl border border-[#e1eee8] dark:divide-[#1d4941] dark:border-[#1d4941]">
          {categories.map((category) => (
            <div className="flex items-center justify-between gap-3 px-4 py-3" key={category}>
              <span className="text-sm font-medium text-[#31534f] dark:text-[#d3ebe2]">{category}</span>
              <div className="flex gap-1">
                <button
                  aria-label={`${category} düzenle`}
                  className="rounded-lg p-2 text-[#81958f] hover:bg-[#ebf6f0] hover:text-[#278b70]"
                  onClick={() => {
                    setEditing(category);
                    setDraft(category);
                  }}
                  type="button"
                >
                  <Edit3 className="size-4" />
                </button>
                <button
                  aria-label={`${category} sil`}
                  className="rounded-lg p-2 text-[#a66f60] hover:bg-[#fff1ed] dark:hover:bg-[#49302c]"
                  onClick={() => {
                    if (!window.confirm(`${category} kategorisini silmek istediğinize emin misiniz?`)) return;
                    const fallback = categories.find((item) => item !== category) ?? "Diğer";
                    setCategories(categories.filter((item) => item !== category));
                    setTests((current) =>
                      current.map((test) => (test.category === category ? { ...test, category: fallback } : test)),
                    );
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

function ImportModal({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#082421]/55 p-4 backdrop-blur-[3px]">
      <section
        aria-label="Toplu test yükleme"
        aria-modal="true"
        className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-7 dark:bg-[#0e2927]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#d8f0e4] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
              <FileSpreadsheet className="size-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-[#299b7c] uppercase">Excel aktarımı</p>
              <h2 className="mt-1 text-xl font-semibold text-[#173e3b] dark:text-[#e8f7f1]">Toplu test yükle</h2>
              <p className="mt-1 text-xs text-[#81958f]">
                Aktif testlerden şablon oluşturun, düzenleyin ve tekrar yükleyin.
              </p>
            </div>
          </div>
          <button
            aria-label="Toplu test yüklemeyi kapat"
            className="rounded-xl p-2 text-[#81958f] hover:bg-[#ebf6f0] dark:hover:bg-[#174638]"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#dceee4] bg-[#f7fcf9] p-4 dark:border-[#1d4941] dark:bg-[#102f2d]">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">
              <Download className="size-4 text-[#278b70]" /> 1. Şablonu indir
            </p>
            <p className="mt-2 text-xs leading-5 text-[#81958f]">
              Mevcut aktif testler ve kullanım notları Excel dosyasına eklenir.
            </p>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#bfe3d0] bg-white px-3 py-2 text-xs font-semibold text-[#278b70] hover:bg-[#effaf4] dark:border-[#1d4941] dark:bg-[#0e2927] dark:text-[#a7f3d0]"
              onClick={onDownload}
              type="button"
            >
              <Download className="size-3.5" /> Şablon indir
            </button>
          </div>
          <label className="cursor-pointer rounded-2xl border border-dashed border-[#9ed0b6] bg-[#fbfdfc] p-4 transition hover:bg-[#f0faf4] dark:border-[#286050] dark:bg-[#102f2d] dark:hover:bg-[#174638]">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#31534f] dark:text-[#d3ebe2]">
              <Upload className="size-4 text-[#278b70]" /> 2. Excel’i yükle
            </p>
            <p className="mt-2 text-xs leading-5 text-[#81958f]">
              Düzenlediğiniz .xlsx dosyasını seçin. Aynı test adı ve kategori güncellenir, yeni testlere kod otomatik
              atanır.
            </p>
            <span className="mt-4 inline-flex rounded-xl bg-[#103c3a] px-3 py-2 text-xs font-semibold text-white">
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
          <div className="mt-5 rounded-2xl border border-[#dceee4] bg-[#f7fcf9] p-4 dark:border-[#1d4941] dark:bg-[#102f2d]">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#278b70]">
              <CheckCircle2 className="size-4" /> Aktarım özeti
            </p>
            <p className="mt-2 text-xs text-[#52776d] dark:text-[#a7c9be]">
              {result.added} yeni test eklendi, {result.updated} test güncellendi.
            </p>
            {result.errors.length > 0 && (
              <div className="mt-3 space-y-1 text-xs text-[#a66f60]">
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
        <div className="mt-6 flex justify-end border-t border-[#edf3f0] pt-4 dark:border-[#1d4941]">
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

function TestForm({
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#082421]/55 p-4 backdrop-blur-[3px]">
      <section
        aria-label="Test formu"
        aria-modal="true"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7 dark:bg-[#0e2927]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#d8f0e4] text-[#278b70] dark:bg-[#174638] dark:text-[#a7f3d0]">
              <FlaskConical className="size-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-[#299b7c] uppercase">Test kataloğu</p>
              <h2 className="mt-1 text-xl font-semibold text-[#173e3b] dark:text-[#e8f7f1]">
                {editing ? "Testi düzenle" : "Yeni test ekle"}
              </h2>
            </div>
          </div>
          <button
            aria-label="Test formunu kapat"
            className="rounded-xl p-2 text-[#81958f] hover:bg-[#ebf6f0] dark:hover:bg-[#174638]"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
            Otomatik test kodu
            <input
              className="mt-2 h-11 w-full rounded-xl border border-[#dbe9e4] bg-[#f3faf6] px-3 text-sm font-bold tracking-[0.08em] text-[#278b70] outline-none dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-[#a7f3d0]"
              readOnly
              value={editing ? form.code : form.category ? generateTestCode(form.category, tests) : "Kategori seçin"}
            />
          </label>
          <label className="text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
            Kategori
            <select
              className="mt-2 h-11 w-full rounded-xl border border-[#dbe9e4] bg-white px-3 text-sm outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white"
              onChange={(event) => setField("category", event.target.value)}
              value={form.category}
            >
              <option value="">Kategori seçin</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-[#31534f] sm:col-span-2 dark:text-[#c4dfd5]">
            Test adı
            <input
              className="mt-2 h-11 w-full rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] px-3 text-sm outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white"
              onChange={(event) => setField("name", event.target.value)}
              placeholder="Örn. Akciğer grafisi"
              value={form.name}
            />
          </label>
          <label className="text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
            Birim fiyat (₺)
            <input
              className="mt-2 h-11 w-full rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] px-3 text-sm outline-none focus:border-[#55b99c] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-white"
              min="0"
              onChange={(event) => setField("price", event.target.value)}
              step="1"
              type="number"
              value={form.price || ""}
            />
          </label>
        </div>
        <div className="mt-7 flex justify-end gap-3 border-t border-[#edf3f0] pt-5 dark:border-[#1d4941]">
          <button
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#718783] hover:bg-[#ebf6f0] dark:hover:bg-[#174638]"
            onClick={onClose}
            type="button"
          >
            Vazgeç
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-[#103c3a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#174e4b]"
            onClick={onSave}
            type="button"
          >
            <ClipboardCheck className="size-4" /> {editing ? "Kaydet" : "Testi ekle"}
          </button>
        </div>
      </section>
    </div>
  );
}
