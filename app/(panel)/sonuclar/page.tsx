"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlertTriangle,
  Bold,
  Check,
  ChevronDown,
  ClipboardPlus,
  Download,
  FileCheck2,
  FileText,
  Filter,
  Italic,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Redo2,
  ScanText,
  Search,
  ShieldCheck,
  Upload,
  Undo2,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useCompanies, useTests } from "@/lib/data";
import { analyzePdfFiles, mergeAnalysesIntoSheet } from "@/lib/pdf-analysis/analyze";
import type { AnalysisProgress, AnalyzedPdf } from "@/lib/pdf-analysis/types";
import { exportResultsExcel } from "@/lib/results-excel";
import { storageKeys, useStoredState } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { resultTone } from "@/lib/result-tone";

const initialColumns = Array.from({ length: 12 }, () => "");
const blankRow = (length = initialColumns.length) => Array.from({ length }, () => "");
const initialRows = Array.from({ length: 20 }, () => blankRow());

type AnalysisState = "setup" | "analyzing" | "review";

function localToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function ResultsRoute() {
  const [companies] = useCompanies();
  const [tests] = useTests();
  const [columns, setColumns] = useStoredState<string[]>(storageKeys.resultColumns, initialColumns);
  const [rows, setRows] = useStoredState<string[][]>(storageKeys.resultRows, initialRows);
  const [selected, setSelected] = useState({ row: 0, col: 0 });
  const [query, setQuery] = useState("");
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDate, setSelectedDate] = useState(localToday);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("setup");
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [analyses, setAnalyses] = useState<AnalyzedPdf[]>([]);
  const [analysisError, setAnalysisError] = useState("");
  const [deleteRequest, setDeleteRequest] = useState<{ index: number; name: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: number } | null>(null);
  const [history, setHistory] = useState<string[][][]>([]);
  const [future, setFuture] = useState<string[][][]>([]);
  const [cellStyles, setCellStyles] = useState<Record<string, { bold?: boolean; italic?: boolean; align?: "left" | "center" }>>({});

  useEffect(() => {
    const removable = new Set(["güven", "durum", "rapor türü", "sft / fvc (best)", "sft / fev1 (best)", "sft / fev1/fvc (best)", "sft / pef (best)", "odyometri / sağ hava ortalaması", "odyometri / sağ kemik ortalaması", "odyometri / sol hava ortalaması", "odyometri / sol kemik ortalaması", "ekg / kalp hızı", "ekg / pr", "ekg / qrs", "ekg / qt/qtc"]);
    const indexes = columns.map((column, index) => ({ column, index })).filter(({ column }) => !removable.has(column.trim().toLocaleLowerCase("tr-TR")));
    const ordered = [...indexes].sort((a, b) => Number(a.column.toLocaleLowerCase("tr-TR").startsWith("muayene /")) - Number(b.column.toLocaleLowerCase("tr-TR").startsWith("muayene /")));
    if (ordered.length === columns.length && ordered.every((item, index) => item.index === index)) return;
    setColumns(ordered.map(({ column }) => column));
    setRows((current) => current.map((row) => ordered.map(({ index }) => row[index] ?? "")));
  }, [columns, setColumns, setRows]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setSelectedRows(new Set(rows.map((row, index) => row.some((cell) => cell.trim()) ? index : -1).filter((index) => index >= 0)));
      }
      if (event.key === "Escape") {
        setSelectedRows(new Set());
        setContextMenu(null);
        setEditingCell(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rows]);

  const filteredCompanies = companies.filter((company) =>
    company.name.toLocaleLowerCase("tr-TR").includes(companyQuery.toLocaleLowerCase("tr-TR")),
  );
  const selectedValue = rows[selected.row]?.[selected.col] ?? "";
  const visibleRows = useMemo(
    () =>
      query
        ? rows.filter((row) => row.some((cell) => cell.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"))))
        : rows,
    [query, rows],
  );
  const recordCount = rows.filter((row) => row.some((cell) => cell.trim())).length;

  const updateCell = (value: string) => {
    setHistory((current) => [...current.slice(-29), rows]);
    setFuture([]);
    setRows((current) => current.map((row, index) => index === selected.row ? row.map((cell, col) => (col === selected.col ? value : cell)) : row));
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((current) => [...current, rows]);
    setRows(previous);
    setHistory((current) => current.slice(0, -1));
  };

  const redo = () => {
    const next = future.at(-1);
    if (!next) return;
    setHistory((current) => [...current, rows]);
    setRows(next);
    setFuture((current) => current.slice(0, -1));
  };

  const toggleCellStyle = (property: "bold" | "italic" | "align") => {
    const key = `${selected.row}:${selected.col}`;
    setCellStyles((current) => {
      const previous = current[key] ?? {};
      return { ...current, [key]: property === "align" ? { ...previous, align: previous.align === "center" ? "left" : "center" } : { ...previous, [property]: !previous[property] } };
    });
  };

  const deleteRow = (index: number) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
    setSelected({ row: 0, col: 0 });
    setSelectedRows(new Set());
  };

  const deleteSelectedRows = () => {
    setRows((current) => current.filter((_, index) => !selectedRows.has(index)));
    setSelectedRows(new Set());
    setSelected({ row: 0, col: 0 });
  };

  const resetImport = () => {
    setSelectedFiles([]);
    setSelectedCompany("");
    setCompanyQuery("");
    setCompanyOpen(false);
    setSelectedDate(localToday());
    setAnalysisState("setup");
    setAnalysisProgress(null);
    setAnalyses([]);
    setAnalysisError("");
  };

  const closeImport = () => {
    if (analysisState === "analyzing") return;
    setBulkImportOpen(false);
    resetImport();
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const invalid = incoming.find((file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"));
    const oversized = incoming.find((file) => file.size > 25 * 1024 * 1024);
    if (invalid) {
      setAnalysisError(`“${invalid.name}” PDF formatında değil.`);
      return;
    }
    if (oversized) {
      setAnalysisError(`“${oversized.name}” 25 MB sınırını aşıyor.`);
      return;
    }
    setAnalysisError("");
    setSelectedFiles((current) => {
      const files = new Map(current.map((file) => [`${file.name}-${file.size}-${file.lastModified}`, file]));
      incoming.forEach((file) => files.set(`${file.name}-${file.size}-${file.lastModified}`, file));
      return Array.from(files.values());
    });
  };

  const runAnalysis = async () => {
    if (!selectedCompany || !selectedDate || !selectedFiles.length) {
      setAnalysisError("Analizi başlatmak için tarih, firma ve en az bir PDF seçin.");
      return;
    }
    setAnalysisState("analyzing");
    setAnalysisError("");
    try {
      const result = await analyzePdfFiles(selectedFiles, {
        knownTestNames: tests.filter((test) => test.active).map((test) => test.name),
        onProgress: setAnalysisProgress,
      });
      setAnalyses(result);
      setAnalysisState("review");
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "PDF analizi sırasında beklenmeyen bir hata oluştu.");
      setAnalysisState("setup");
    }
  };

  const applyAnalysis = () => {
    const sheet = mergeAnalysesIntoSheet(columns, rows, analyses, selectedCompany, selectedDate);
    setColumns(sheet.columns);
    setRows(sheet.rows);
    setSelected({ row: 0, col: 0 });
    closeImport();
  };

  const modalFooter =
    analysisState === "review" ? (
      <>
        <Button onClick={() => setAnalysisState("setup")} size="sm" variant="outline">
          Dosyaları değiştir
        </Button>
        <Button disabled={!analyses.length} onClick={applyAnalysis} size="sm" variant="brand">
          <FileCheck2 /> Onayla ve Excel’e aktar
        </Button>
      </>
    ) : analysisState === "analyzing" ? (
      <Button disabled size="sm" variant="brand">
        <LoaderCircle className="animate-spin" /> Analiz sürüyor
      </Button>
    ) : (
      <>
        <Button onClick={closeImport} size="sm" variant="outline">
          Vazgeç
        </Button>
        <Button disabled={!selectedFiles.length || !selectedCompany || !selectedDate} onClick={runAnalysis} size="sm" variant="brand">
          <ScanText /> PDF’leri analiz et
        </Button>
      </>
    );

  return (
    <main className="mx-auto max-w-[1440px]">
      <section className="border-border bg-card overflow-hidden rounded-2xl border shadow-card">
        <div className="bg-card-muted border-border flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { icon: Undo2, label: "Geri al", action: undo, disabled: !history.length },
              { icon: Redo2, label: "Yinele", action: redo, disabled: !future.length },
              { icon: Bold, label: "Kalın", action: () => toggleCellStyle("bold") },
              { icon: Italic, label: "İtalik", action: () => toggleCellStyle("italic") },
              { icon: AlignLeft, label: "Sola hizala", action: () => setCellStyles((current) => ({ ...current, [`${selected.row}:${selected.col}`]: { ...current[`${selected.row}:${selected.col}`], align: "left" } })) },
              { icon: AlignCenter, label: "Ortala", action: () => toggleCellStyle("align") },
            ].map(({ icon: Icon, label, action, disabled }) => (
              <button aria-label={label} className="text-muted hover:bg-card hover:text-foreground rounded-md p-2 disabled:cursor-not-allowed disabled:opacity-35" disabled={disabled} key={label} onClick={action} type="button">
                <Icon className="size-4" />
              </button>
            ))}
            <span className="bg-border mx-1 h-5 w-px" />
            <button className="text-muted hover:bg-card hover:text-foreground inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs" type="button">
              Arial <ChevronDown className="size-3" />
            </button>
            <button aria-label="Diğer seçenekler" className="text-muted hover:bg-card hover:text-foreground rounded-md p-2" type="button">
              <MoreHorizontal className="size-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {selectedRows.size > 0 && <Button onClick={() => setDeleteRequest({ index: -1, name: `${selectedRows.size} seçili kayıt` })} size="sm" variant="danger"><Trash2 /> Toplu sil ({selectedRows.size})</Button>}
            <Button onClick={() => setBulkImportOpen(true)} size="sm" variant="soft">
              <ClipboardPlus /> Toplu sonuç aktar
            </Button>
            <button className="bg-success text-white hover:bg-success/90 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold shadow-sm transition-colors" onClick={() => void exportResultsExcel(columns, rows)} type="button">
              <Download className="size-3.5" /> Excel’e aktar
            </button>
          </div>
        </div>
        <div className="border-border flex items-center gap-2 border-b px-3 py-2">
          <div className="bg-card-muted text-subtle flex h-8 w-14 items-center justify-center rounded-md border border-border text-xs font-semibold">
            {String.fromCharCode(65 + selected.col)}
            {selected.row + 1}
          </div>
          <span className="text-faint text-lg">ƒx</span>
          <input aria-label="Formül çubuğu" className="text-foreground h-8 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" onChange={(event) => updateCell(event.target.value)} value={selectedValue} />
        </div>
        <div className="bg-card-muted border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2">
          <div className="text-muted flex items-center gap-3 text-xs">
            <span className="text-heading font-semibold">Sonuçlar</span>
            <span>{recordCount} kayıt</span>
            <span className="text-success inline-flex items-center gap-1"><Check className="size-3" /> Kaydedildi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="border-border bg-card flex items-center gap-2 rounded-lg border px-2.5">
              <Search className="text-muted size-3.5" />
              <input aria-label="Sonuçlarda ara" className="h-7 w-40 bg-transparent text-xs outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Ara..." value={query} />
            </div>
            <button className="border-border text-muted hover:bg-card inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs" type="button"><Filter className="size-3.5" /> Filtrele</button>
          </div>
        </div>
        <div className="max-h-[560px] overflow-auto">
          <table className="min-w-[1450px] border-collapse text-left text-xs">
            <thead className="bg-card-muted text-subtle sticky top-0 z-20">
              <tr>
                <th className="border-border bg-card-muted sticky left-0 z-30 w-12 border-r border-b text-center font-medium">#</th>
                {columns.map((column, index) => (
                  <th className="border-border bg-card-muted h-9 min-w-[118px] border-r border-b px-3 font-semibold" key={index}>
                    <span className="text-faint mr-2 font-normal">{String.fromCharCode(65 + index)}</span>{column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, rowIndex) => (
                <tr className={cn("group", selectedRows.has(rows.indexOf(row)) && "bg-brand-soft/30")} key={rowIndex} onContextMenu={(event) => { event.preventDefault(); setContextMenu({ x: event.clientX, y: event.clientY, row: rows.indexOf(row) }); }}>
                  <td className="border-border bg-card-muted text-subtle sticky left-0 z-10 border-r border-b text-center font-medium">
                    <span className="inline-flex items-center gap-1"><span>{rowIndex + 1}</span>{row.some((cell) => cell.trim()) && <button aria-label={`${row[1] || "Bu"} kaydını sil`} className="text-muted hover:text-danger rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => setDeleteRequest({ index: rows.indexOf(row), name: row[1] || "kayıt" })} type="button"><Trash2 className="size-3" /></button>}</span>
                  </td>
                  {row.map((cell, colIndex) => (
                    <td className={cn("border-border min-w-[118px] border-r border-b px-3 py-2.5 whitespace-nowrap", resultTone(columns[colIndex], cell) === "normal" && "bg-success-soft text-success", resultTone(columns[colIndex], cell) === "attention" && "bg-danger-soft text-danger", resultTone(columns[colIndex], cell) === "neutral" && "text-foreground", cellStyles[`${rows.indexOf(row)}:${colIndex}`]?.bold && "font-bold", cellStyles[`${rows.indexOf(row)}:${colIndex}`]?.italic && "italic", cellStyles[`${rows.indexOf(row)}:${colIndex}`]?.align === "center" && "text-center", selected.row === rowIndex && selected.col === colIndex && "ring-brand relative z-10 bg-brand-soft/40 ring-2 ring-inset")} key={`${rowIndex}-${colIndex}`} onClick={() => setSelected({ row: rowIndex, col: colIndex })} onDoubleClick={() => setEditingCell({ row: rows.indexOf(row), col: colIndex })}>
                      {editingCell?.row === rows.indexOf(row) && editingCell.col === colIndex ? <input autoFocus aria-label={`${columns[colIndex] || "Hücre"} düzenle`} className="text-foreground -mx-1 w-full min-w-[100px] bg-transparent outline-none" onBlur={() => setEditingCell(null)} onChange={(event) => { const actualRow = rows.indexOf(row); setRows((current) => current.map((item, index) => index === actualRow ? item.map((itemCell, itemCol) => itemCol === colIndex ? event.target.value : itemCell) : item)); }} onKeyDown={(event) => { if (event.key === "Enter") setEditingCell(null); }} value={cell} /> : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-card-muted border-border flex items-center justify-between border-t px-4 py-2 text-[11px] text-muted">
          <span>Sayfa 1 / 1</span>
          <div className="flex items-center gap-3"><span>Yakınlaştır: 100%</span><button aria-label="Yeni satır ekle" className="text-brand hover:bg-brand-soft rounded-md p-1" onClick={() => setRows((current) => [...current, blankRow(columns.length)])} type="button"><Plus className="size-4" /></button></div>
        </div>
      </section>

      {contextMenu && <div className="border-border bg-card fixed z-[70] min-w-44 rounded-xl border p-1.5 shadow-xl" style={{ left: contextMenu.x, top: contextMenu.y }} onMouseLeave={() => setContextMenu(null)}><button className="text-danger hover:bg-danger-soft flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => { const row = contextMenu.row; setContextMenu(null); setDeleteRequest({ index: row, name: rows[row]?.[1] || "kayıt" }); }} type="button"><Trash2 className="size-3.5" /> Kaydı sil</button><button className="text-foreground hover:bg-card-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs" onClick={() => { setSelectedRows((current) => new Set(current).add(contextMenu.row)); setContextMenu(null); }} type="button"><Check className="size-3.5" /> Satırı seç</button></div>}

      <ConfirmDialog request={deleteRequest ? { title: deleteRequest.index === -1 ? "Seçili kayıtları sil" : "Kaydı sil", description: `${deleteRequest.name} sonuç listesinden kaldırılacak.`, confirmLabel: deleteRequest.index === -1 ? "Seçilenleri sil" : "Kaydı sil", onConfirm: () => deleteRequest.index === -1 ? deleteSelectedRows() : deleteRow(deleteRequest.index) } : null} onClose={() => setDeleteRequest(null)} />

      <Modal description="Belgeler cihazınızda işlenir; sonuçlar Excel’e yazılmadan önce sizin onayınıza sunulur." footer={modalFooter} icon={ClipboardPlus} onClose={closeImport} open={bulkImportOpen} size="xl" title="Toplu sonuç aktar">
        {analysisState === "setup" && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-heading text-xs font-semibold">
                Tarama tarihi
                <input aria-label="Tarama tarihi" className="border-border bg-card text-foreground mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" onChange={(event) => setSelectedDate(event.target.value)} type="date" value={selectedDate} />
              </label>
              <div className="relative">
                <p className="text-heading text-xs font-semibold">Firma</p>
                <button aria-expanded={companyOpen} aria-haspopup="listbox" className="border-border bg-card text-foreground mt-2 flex h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" onClick={() => setCompanyOpen((open) => !open)} type="button">
                  <span className={selectedCompany ? "text-foreground" : "text-muted"}>{selectedCompany || "Firma seçin"}</span>
                  <ChevronDown className={cn("text-muted size-4 transition-transform", companyOpen && "rotate-180")} />
                </button>
                {companyOpen && (
                  <div className="border-border bg-card absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border p-2 shadow-xl">
                    <div className="border-border bg-card-muted flex items-center gap-2 rounded-lg border px-2.5"><Search className="text-muted size-4" /><input autoFocus aria-label="Firma ara" className="h-9 min-w-0 flex-1 bg-transparent text-xs outline-none" onChange={(event) => setCompanyQuery(event.target.value)} placeholder="Firma ara..." value={companyQuery} /></div>
                    <div className="mt-2 max-h-44 overflow-y-auto" role="listbox">
                      {filteredCompanies.length ? filteredCompanies.map((company) => (
                        <button aria-selected={selectedCompany === company.name} className="text-foreground hover:bg-brand-soft hover:text-brand-soft-fg flex w-full rounded-lg px-3 py-2.5 text-left text-xs" key={company.id} onClick={() => { setSelectedCompany(company.name); setCompanyOpen(false); setCompanyQuery(""); }} role="option" type="button">{company.name}</button>
                      )) : <p className="text-muted px-3 py-3 text-xs">Firma bulunamadı.</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-end justify-between gap-3"><div><p className="text-heading text-xs font-semibold">PDF dosyaları</p><p className="text-muted mt-1 text-[11px]">Metin PDF’leri ve taranmış belgeler desteklenir.</p></div>{selectedFiles.length > 0 && <span className="bg-brand-soft text-brand-soft-fg rounded-lg px-2 py-1 text-[11px] font-semibold">{selectedFiles.length} dosya</span>}</div>
              <label className="border-border bg-card-muted hover:border-brand hover:bg-brand-soft/30 mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-8 text-center transition-colors" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}><span className="bg-brand-soft text-brand flex size-11 items-center justify-center rounded-xl"><Upload className="size-5" /></span><span className="text-heading mt-3 text-sm font-semibold">PDF dosyalarını buraya bırakın</span><span className="text-muted mt-1 text-xs">veya bilgisayarınızdan seçin · Dosya başına en fazla 25 MB</span><input accept="application/pdf,.pdf" aria-label="PDF dosyalarını seçin" className="sr-only" multiple onChange={(event) => addFiles(event.target.files)} type="file" /></label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="border-border divide-divider divide-y overflow-hidden rounded-xl border">
                {selectedFiles.map((file) => (
                  <div className="flex items-center gap-3 px-3 py-2.5" key={`${file.name}-${file.size}-${file.lastModified}`}><span className="bg-danger-soft text-danger flex size-8 items-center justify-center rounded-lg"><FileText className="size-4" /></span><span className="text-foreground min-w-0 flex-1 truncate text-xs font-medium">{file.name}</span><span className="text-muted text-[11px]">{(file.size / 1024 / 1024).toFixed(1)} MB</span><button aria-label={`${file.name} dosyasını kaldır`} className="text-muted hover:text-danger rounded-md p-1" onClick={() => setSelectedFiles((current) => current.filter((item) => item !== file))} type="button"><X className="size-4" /></button></div>
                ))}
              </div>
            )}

            {analysisError && <div className="border-danger-border bg-danger-soft text-danger flex items-start gap-2 rounded-xl border px-4 py-3 text-xs"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>{analysisError}</span></div>}
            <div className="border-border bg-brand-soft/40 text-brand-soft-fg flex items-start gap-3 rounded-xl border px-4 py-3 text-xs leading-5"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><span>PDF’ler sunucuya gönderilmeden bu tarayıcıda analiz edilir. Metin katmanı olmayan sayfalarda Türkçe ve İngilizce OCR otomatik devreye girer.</span></div>
          </div>
        )}

        {analysisState === "analyzing" && (
          <div className="flex min-h-72 flex-col items-center justify-center text-center"><span className="bg-brand-soft text-brand flex size-16 items-center justify-center rounded-2xl"><ScanText className="size-8 animate-pulse" /></span><h3 className="text-heading mt-5 text-lg font-semibold">Belgeler akıllı olarak analiz ediliyor</h3><p className="text-muted mt-2 max-w-md text-xs leading-5">Kimlik alanları, rapor türleri, test değerleri, birimler ve referans aralıkları eşleştiriliyor.</p><div className="mt-6 w-full max-w-md"><div className="bg-card-muted h-2 overflow-hidden rounded-full"><div className="bg-brand h-full rounded-full transition-all duration-300" style={{ width: `${analysisProgress?.percent ?? 3}%` }} /></div><div className="text-muted mt-2 flex justify-between gap-3 text-[11px]"><span className="truncate">{analysisProgress?.fileName ?? "Hazırlanıyor"}</span><span>%{analysisProgress?.percent ?? 0}</span></div><p className="text-subtle mt-2 text-[11px]">{analysisProgress?.message ?? "PDF motoru hazırlanıyor"}</p></div></div>
        )}

        {analysisState === "review" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3"><ReviewMetric label="Belge" value={String(analyses.length)} /><ReviewMetric label="Bulunan değer" value={String(analyses.reduce((sum, item) => sum + item.values.length, 0))} /><ReviewMetric label="Ortalama güven" value={`%${Math.round(analyses.reduce((sum, item) => sum + item.confidence, 0) / Math.max(analyses.length, 1))}`} /></div>
            <div className="space-y-3">
              {analyses.map((analysis) => (
                <article className="border-border overflow-hidden rounded-2xl border" key={analysis.id}>
                  <div className="bg-card-muted flex flex-wrap items-center gap-3 px-4 py-3"><span className="bg-brand-soft text-brand flex size-9 items-center justify-center rounded-lg"><FileCheck2 className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-heading truncate text-xs font-semibold">{analysis.fileName}</p><p className="text-muted mt-0.5 text-[11px]">{analysis.pages} sayfa · {analysis.extractionMode === "ocr" ? "OCR" : analysis.extractionMode === "mixed" ? "Metin + OCR" : "Metin katmanı"} · {analysis.documentType}</p></div><span className={cn("rounded-lg px-2 py-1 text-[11px] font-bold", analysis.confidence >= 80 ? "bg-success-soft text-success" : analysis.confidence >= 55 ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger")}>%{analysis.confidence} güven</span></div>
                  <div className="grid gap-3 px-4 py-3 sm:grid-cols-3"><DetectedField label="Ad soyad" value={analysis.patientName} /><DetectedField label="T.C. kimlik no" value={analysis.identityNumber} /><DetectedField label="Belge tarihi" value={analysis.documentDate || selectedDate} /></div>
                  {analysis.values.length > 0 && (
                    <div className="border-divider space-y-3 border-t bg-card-muted/50 p-3">
                      {Array.from(new Set(analysis.values.map((value) => value.group))).map((group) => (
                        <section className="border-border overflow-hidden rounded-xl border bg-card" key={group}>
                          <div className="border-divider flex items-center justify-between border-b bg-card-muted px-3 py-2">
                            <h4 className="text-heading text-[11px] font-bold">{group}</h4>
                            <span className="text-muted text-[10px]">{analysis.values.filter((value) => value.group === group).length} parametre</span>
                          </div>
                          <div className="grid gap-px bg-divider sm:grid-cols-2">
                            {analysis.values.filter((value) => value.group === group).map((value) => (
                              <div className="bg-card flex items-center justify-between gap-3 px-3 py-2.5" key={value.key}>
                                <span className="text-muted text-[11px]">{value.label}</span>
                                <span className={cn("text-xs font-semibold", value.status === "attention" ? "text-warning" : "text-heading")}>
                                  {value.value}{value.unit ? ` ${value.unit}` : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                  {analysis.warnings.length > 0 && <div className="border-warning/30 bg-warning-soft text-warning border-t px-4 py-2.5 text-[11px]">{analysis.warnings.join(" ")}</div>}
                  <details className="border-divider border-t px-4 py-3"><summary className="text-muted hover:text-foreground cursor-pointer text-[11px] font-semibold">Çıkarılan ham metni göster</summary><pre className="bg-card-muted text-subtle mt-3 max-h-48 overflow-auto rounded-xl p-3 text-[10px] leading-5 whitespace-pre-wrap">{analysis.rawText || "Metin bulunamadı."}</pre></details>
                </article>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}

function ReviewMetric({ label, value }: { label: string; value: string }) {
  return <div className="bg-card-muted rounded-xl px-3 py-3 text-center"><p className="text-heading text-lg font-semibold">{value}</p><p className="text-muted mt-1 text-[10px] font-medium uppercase">{label}</p></div>;
}

function DetectedField({ label, value }: { label: string; value: string }) {
  return <div><p className="text-subtle text-[10px] font-semibold uppercase">{label}</p><p className={cn("mt-1 truncate text-xs font-medium", value ? "text-heading" : "text-warning")}>{value || "Bulunamadı"}</p></div>;
}
