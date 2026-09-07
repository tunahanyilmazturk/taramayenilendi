import type { AnalysisOptions, AnalyzedPdf, ExtractionMode } from "@/lib/pdf-analysis/types";
import { detectDocumentType, extractAllValues } from "@/lib/pdf-analysis/rules";

type PdfPage = Awaited<ReturnType<Awaited<ReturnType<typeof import("pdfjs-dist")["getDocument"]>["promise"]>["getPage"]>>;

function normalizeText(text: string) {
  return text.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractPageText(page: PdfPage) {
  const content = await page.getTextContent();
  const items = content.items
    .filter((item): item is Extract<(typeof content.items)[number], { str: string }> => "str" in item)
    .map((item) => ({ text: item.str.trim(), x: item.transform[4], y: item.transform[5] }))
    .filter((item) => item.text);
  const lines: Array<{ y: number; items: typeof items }> = [];
  for (const item of items.sort((a, b) => b.y - a.y || a.x - b.x)) {
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) < 3);
    if (line) line.items.push(item);
    else lines.push({ y: item.y, items: [item] });
  }
  return normalizeText(lines.map((line) => line.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(" ")).join("\n"));
}

async function renderPage(page: PdfPage) {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("PDF sayfası görüntülenemedi.");
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas;
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)?.[1];
    if (match) return match.replace(/\s+/g, " ").trim();
  }
  return "";
}

function parseMetadata(text: string) {
  const patientName = firstMatch(text, [
    /(?:adı\s*soyadı|adi\s*soyadi|ad\s*soyad|hastanın\s*adı\s*,?\s*soyadı|hasta\s*(?:adı|adi)|çalışan\s*(?:adı|adi))\s*[:=-]\s*(.{3,80}?)(?=\s+(?:numune\s*alma\s*tarihi|pasaport\s*no|t\.?\s*c\.?\s*kimlik|kimlik\s*no|doğum|cinsiyet|protokol)|\n|$)/i,
    /(?:patient\s*name|name\s*surname)\s*[:=-]\s*([^\n]{3,70})/i,
  ]).replace(/\s+(?:tc|t\.c\.|kimlik|protokol|numune).*$/i, "");
  const identityNumber = firstMatch(text, [/(?:t\.?\s*c\.?\s*kimlik\s*(?:no|numarası)?|kimlik\s*no)\s*[:=-]?\s*(\d{11})/i, /\b(\d{11})\b/]);
  const documentDate = firstMatch(text, [/(?:numune\s*alma|rapor|sonuç|işlem)\s*tarihi\s*[:=-]\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i, /\b(\d{1,2}[./-]\d{1,2}[./-]\d{4})\b/]);
  return { patientName, identityNumber, documentDate };
}

export async function analyzePdfFiles(files: File[], options: AnalysisOptions = {}): Promise<AnalyzedPdf[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  let ocrWorker: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>> | null = null;
  const results: AnalyzedPdf[] = [];

  try {
    for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
      const file = files[fileIndex];
      const data = new Uint8Array(await file.arrayBuffer());
      const loadingTask = pdfjs.getDocument({ data });
      const pdf = await loadingTask.promise;
      const pageTexts: string[] = [];
      let usedText = false;
      let usedOcr = false;

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        options.onProgress?.({ fileIndex, fileCount: files.length, fileName: file.name, page: pageNumber, pageCount: pdf.numPages, phase: "reading", percent: Math.round(((fileIndex + (pageNumber - 1) / pdf.numPages) / files.length) * 100), message: `${pageNumber}. sayfanın metin katmanı okunuyor` });
        const page = await pdf.getPage(pageNumber);
        let pageText = await extractPageText(page);
        if (pageText.replace(/\s/g, "").length >= 40) usedText = true;
        else {
          usedOcr = true;
          options.onProgress?.({ fileIndex, fileCount: files.length, fileName: file.name, page: pageNumber, pageCount: pdf.numPages, phase: "ocr", percent: Math.round(((fileIndex + (pageNumber - 0.5) / pdf.numPages) / files.length) * 100), message: `${pageNumber}. sayfa OCR ile okunuyor` });
          if (!ocrWorker) {
            const { createWorker } = await import("tesseract.js");
            ocrWorker = await createWorker(["tur", "eng"], 1, { langPath: "/tessdata" });
          }
          const canvas = await renderPage(page);
          const recognition = await ocrWorker.recognize(canvas);
          pageText = normalizeText(recognition.data.text);
        }
        pageTexts.push(pageText);
        page.cleanup();
      }

      options.onProgress?.({ fileIndex, fileCount: files.length, fileName: file.name, page: pdf.numPages, pageCount: pdf.numPages, phase: "interpreting", percent: Math.round(((fileIndex + 0.95) / files.length) * 100), message: "Kimlik ve test değerleri eşleştiriliyor" });
      const rawText = normalizeText(pageTexts.join("\n\n"));
      const metadata = parseMetadata(rawText);
      const values = extractAllValues(rawText);
      const extractionMode: ExtractionMode = usedOcr && usedText ? "mixed" : usedOcr ? "ocr" : "text";
      const warnings: string[] = [];
      if (!metadata.patientName) warnings.push("Ad soyad güvenle bulunamadı.");
      if (!metadata.identityNumber) warnings.push("T.C. kimlik numarası bulunamadı.");
      if (!values.length) warnings.push("Tanımlı test değerlerinden hiçbiri eşleşmedi.");
      if (rawText.length < 80) warnings.push("Belgeden çok az metin çıkarıldı; görüntü kalitesini kontrol edin.");
      const metadataScore = [metadata.patientName, metadata.identityNumber, metadata.documentDate].filter(Boolean).length / 3;
      const confidence = Math.round(
        Math.min(98, Math.max(20, (metadataScore * 0.45 + Math.min(values.length / 4, 1) * 0.45 + (rawText.length > 150 ? 0.1 : 0)) * 100)),
      );
      results.push({ id: `${file.name}-${file.lastModified}-${fileIndex}`, fileName: file.name, pages: pdf.numPages, extractionMode, ...metadata, documentType: detectDocumentType(rawText, options.knownTestNames), values, confidence, warnings, rawText });
      await loadingTask.destroy();
    }
    options.onProgress?.({ fileIndex: files.length - 1, fileCount: files.length, fileName: files.at(-1)?.name ?? "", page: 1, pageCount: 1, phase: "interpreting", percent: 100, message: "Analiz tamamlandı" });
    return results;
  } finally {
    await ocrWorker?.terminate();
  }
}

export function analysesToSheet(analyses: AnalyzedPdf[], company: string, fallbackDate: string) {
  const groupOrder = ["Hemogram", "TİT", "Biyokimya", "Seroloji", "EKG", "SFT", "Odyometri", "Göz", "Radyoloji", "Muayene"];
  const valueColumns = Array.from(new Map(analyses.flatMap((analysis) => analysis.values.map((value) => [value.key, { label: `${value.group} / ${value.label}`, group: value.group }]))).entries())
    .sort(([, a], [, b]) => groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group));
  const headers = ["Dosya", "Ad Soyad", "T.C. Kimlik No", "Firma", "Belge Tarihi", ...valueColumns.map(([, value]) => value.label)];
  const rows = analyses.map((analysis) => {
    const values = new Map(analysis.values.map((value) => [value.key, `${value.value}${value.unit ? ` ${value.unit}` : ""}`]));
    return [analysis.fileName, analysis.patientName, analysis.identityNumber, company, analysis.documentDate || fallbackDate, ...valueColumns.map(([key]) => values.get(key) ?? "")];
  });
  return { headers, rows };
}

function normalizeHeader(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function meaningfulRows(rows: string[][]) {
  return rows.filter((row) => row.some((cell) => cell.trim()));
}

export function mergeAnalysesIntoSheet(
  currentColumns: string[],
  currentRows: string[][],
  analyses: AnalyzedPdf[],
  company: string,
  fallbackDate: string,
) {
  const incoming = analysesToSheet(analyses, company, fallbackDate);
  const legacyHeaders: Record<string, string> = {
    hemoglobin: "Hemogram / HGB",
    hematokrit: "Hemogram / HCT",
    wbc: "Hemogram / WBC",
    rbc: "Hemogram / RBC",
    trombosit: "Hemogram / PLT",
    mcv: "Hemogram / MCV",
    glukoz: "Biyokimya / Glukoz (Açlık)",
  };
  const keptColumnIndexes = currentColumns.map((header, index) => ({ header, index })).filter(({ header }) => !["güven", "durum", "rapor türü"].includes(normalizeHeader(header)));
  const columns = keptColumnIndexes.map(({ header }) => legacyHeaders[normalizeHeader(header)] ?? header);
  const columnIndex = new Map<string, number>();
  columns.forEach((header, index) => {
    if (header.trim()) columnIndex.set(normalizeHeader(header), index);
  });
  for (const header of incoming.headers) {
    const key = normalizeHeader(header);
    if (columnIndex.has(key)) continue;
    const usedIndexes = new Set(columnIndex.values());
    const emptyIndex = columns.findIndex((column, index) => !column.trim() && !usedIndexes.has(index));
    const index = emptyIndex >= 0 ? emptyIndex : columns.length;
    columns[index] = header;
    columnIndex.set(key, index);
  }

  const rows = meaningfulRows(currentRows).map((row) => keptColumnIndexes.map(({ index }) => row[index] ?? "").concat(Array.from({ length: Math.max(0, columns.length - keptColumnIndexes.length) }, () => "")));
  const incomingIndex = new Map(incoming.headers.map((header, index) => [normalizeHeader(header), index]));
  const identityColumn = columnIndex.get(normalizeHeader("T.C. Kimlik No"));
  const nameColumn = columnIndex.get(normalizeHeader("Ad Soyad"));
  const dateColumn = columnIndex.get(normalizeHeader("Belge Tarihi"));

  for (const incomingRow of incoming.rows) {
    const identity = incomingRow[incomingIndex.get(normalizeHeader("T.C. Kimlik No")) ?? -1]?.trim();
    const name = incomingRow[incomingIndex.get(normalizeHeader("Ad Soyad")) ?? -1]?.trim().toLocaleLowerCase("tr-TR");
    const date = incomingRow[incomingIndex.get(normalizeHeader("Belge Tarihi")) ?? -1]?.trim();
    const existingIndex = rows.findIndex((row) => {
      if (identity && identityColumn !== undefined && row[identityColumn]?.trim() === identity) return true;
      return Boolean(name && date && nameColumn !== undefined && dateColumn !== undefined && row[nameColumn]?.trim().toLocaleLowerCase("tr-TR") === name && row[dateColumn]?.trim() === date);
    });
    const target = existingIndex >= 0 ? [...rows[existingIndex]] : Array.from({ length: columns.length }, () => "");
    incoming.headers.forEach((header, sourceIndex) => {
      const targetIndex = columnIndex.get(normalizeHeader(header));
      const value = incomingRow[sourceIndex];
      if (targetIndex !== undefined && value?.trim()) target[targetIndex] = value;
    });
    if (existingIndex >= 0) rows[existingIndex] = target;
    else rows.push(target);
  }

  while (rows.length < 20) rows.push(Array.from({ length: columns.length }, () => ""));
  return { columns, rows };
}
