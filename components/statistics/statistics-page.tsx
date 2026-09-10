"use client";

import {
  BarChart3,
  Building2,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  CircleDollarSign,
  Download,
  FileText,
  FlaskConical,
  Gauge,
  ListChecks,
  Package,
  RotateCcw,
  Search,
  ShieldAlert,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, CountPill, contractTone, offerTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, IconBadge, StatTile, SummaryCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/modal";
import { Page, PageHeader } from "@/components/ui/page-header";
import { Field, Input, Select } from "@/components/ui/field";
import { SearchableCompanySelect } from "@/components/ui/searchable-company-select";
import { useCompanies, useEquipment, useOffers, useScreenings, useTeam, useTests } from "@/lib/data";
import { useCan, useNotice } from "@/lib/hooks";
import {
  equipmentStatuses,
  screeningStatuses,
  contractStatuses,
  type Company,
  type Equipment,
  type Offer,
  type Screening,
  type ScreeningStatus,
  type TeamMember,
  type TestItem,
} from "@/lib/demo-data";
import { labelToIso, money, todayIso } from "@/lib/format";
import { cn, includesQuery } from "@/lib/utils";

type Tab = "overview" | "operations" | "offers" | "screenings" | "tests" | "companies" | "equipment";
type ExportColumn = { header: string; key: string; width?: number; currency?: boolean; percent?: boolean };
type ExportRow = Record<string, string | number>;
type ExportContext = Array<{ label: string; value: string | number }>;
type ExportSheet = { name: string; columns: ExportColumn[]; rows: ExportRow[] };
type DatePreset = "all" | "today" | "last7" | "last30" | "month" | "year" | "custom";

const tabs: Array<{ id: Tab; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "Operasyon özeti", icon: BarChart3 },
  { id: "operations", label: "Operasyon", icon: ClipboardCheck },
  { id: "offers", label: "Teklifler", icon: FileText },
  { id: "screenings", label: "Taramalar", icon: ClipboardList },
  { id: "tests", label: "Testler", icon: FlaskConical },
  { id: "companies", label: "Firmalar", icon: Building2 },
  { id: "equipment", label: "Ekipmanlar", icon: Package },
];

const screeningColors: Record<ScreeningStatus, string> = {
  Planlandı: "var(--info)",
  Hazırlanıyor: "var(--warning)",
  "Devam ediyor": "var(--brand)",
  Tamamlandı: "var(--neutral)",
  İptal: "var(--danger)",
};

const offerColors = ["var(--brand)", "var(--info)", "var(--warning)", "var(--neutral)", "var(--danger)"];

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function toLocalIso(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

function displayIso(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="bg-card-muted h-2 flex-1 overflow-hidden rounded-full">
      <div
        className="bg-brand h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function exportFallbackExcel(
  name: string,
  title: string,
  columns: ExportColumn[],
  rows: ExportRow[],
  context: ExportContext,
) {
  const escapeHtml = (value: string | number) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const header = columns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join("");
  const body = rows
    .map(
      (row, rowIndex) =>
        `<tr style="background:${rowIndex % 2 ? "#f1f5f9" : "#ffffff"}">${columns
          .map((column) => `<td>${escapeHtml(row[column.key] ?? "")}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  const contextRows = context
    .map((item) => `<tr><td><strong>${escapeHtml(item.label)}</strong></td><td>${escapeHtml(item.value)}</td></tr>`)
    .join("");
  const html = `<html><head><meta charset="utf-8"><style>body{font-family:Arial;color:#17324d}table{border-collapse:collapse;margin-bottom:22px}th,td{border:1px solid #d9e2ea;padding:8px 10px;text-align:left}th{background:#2878b5;color:white}h1{color:#17324d}.meta td:first-child{background:#f1f5f9;width:210px}</style></head><body><h1>${escapeHtml(title)}</h1><p>HanTech OSGB · ${escapeHtml(new Date().toLocaleDateString("tr-TR"))}</p><table class="meta"><thead><tr><th>Rapor bilgisi</th><th>Değer</th></tr></thead><tbody>${contextRows}</tbody></table><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  downloadBlob(new Blob(["\ufeff", html], { type: "application/vnd.ms-excel" }), `${name}.xls`);
}

async function exportToExcel(
  name: string,
  title: string,
  columns: ExportColumn[],
  rows: ExportRow[],
  context: ExportContext = [],
) {
  try {
    const { Workbook } = await Promise.race([
      import("exceljs/dist/exceljs.min.js"),
      new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("Excel modülü zamanında yüklenemedi.")), 5_000),
      ),
    ]);
    const workbook = new Workbook();
    workbook.creator = "HanTech OSGB Yönetim Sistemi";
    workbook.created = new Date();
    workbook.modified = new Date();
    const summary = workbook.addWorksheet("Rapor özeti");
    summary.columns = [
      { key: "label", width: 28 },
      { key: "value", width: 52 },
    ];
    summary.mergeCells(1, 1, 1, 2);
    summary.getCell(1, 1).value = title;
    summary.getCell(1, 1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    summary.getCell(1, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF294E4B" } };
    summary.getCell(1, 1).alignment = { vertical: "middle" };
    summary.getRow(1).height = 28;
    summary.mergeCells(2, 1, 2, 2);
    summary.getCell(2, 1).value = "HanTech OSGB · Rapor özeti";
    summary.getCell(2, 1).font = { italic: true, color: { argb: "FF637783" } };
    const summaryHeader = summary.addRow(["Rapor bilgisi", "Değer"]);
    summaryHeader.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF477873" } };
    });
    [...context, { label: "Aktarılan kayıt", value: rows.length }].forEach((item) =>
      summary.addRow([item.label, item.value]),
    );
    summary.getColumn(1).eachCell((cell, rowNumber) => {
      if (rowNumber >= 4) cell.font = { bold: true, color: { argb: "FF183747" } };
    });
    summary.getColumn(2).eachCell((cell, rowNumber) => {
      if (rowNumber >= 4 && typeof cell.value === "number") cell.numFmt = "#,##0";
    });
    summary.autoFilter = { from: { row: 3, column: 1 }, to: { row: context.length + 3, column: 2 } };
    summary.views = [{ state: "frozen", ySplit: 3 }];

    const sheet = workbook.addWorksheet(name.slice(0, 31));
    sheet.mergeCells(1, 1, 1, columns.length);
    sheet.getCell(1, 1).value = title;
    sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    sheet.getCell(1, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D3433" } };
    sheet.getCell(1, 1).alignment = { vertical: "middle" };
    sheet.getRow(1).height = 28;
    sheet.mergeCells(2, 1, 2, columns.length);
    sheet.getCell(2, 1).value = `HanTech OSGB · ${new Date().toLocaleDateString("tr-TR")}`;
    sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF64748B" } };
    const header = sheet.addRow(columns.map((column) => column.header));
    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF477873" } };
      cell.alignment = { vertical: "middle" };
    });
    rows.forEach((row) => sheet.addRow(columns.map((column) => row[column.key] ?? "")));
    sheet.columns = columns.map((column) => ({ key: column.key, width: column.width ?? 18 }));
    rows.forEach((_, rowIndex) => {
      columns.forEach((column, columnIndex) => {
        if (column.currency) sheet.getCell(rowIndex + 4, columnIndex + 1).numFmt = "₺#,##0";
        if (column.percent) sheet.getCell(rowIndex + 4, columnIndex + 1).numFmt = '0"%"';
      });
      if (rowIndex % 2 === 1) {
        sheet.getRow(rowIndex + 4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F7F5" } };
      }
    });
    sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: rows.length + 3, column: columns.length } };
    sheet.views = [{ state: "frozen", ySplit: 3 }];
    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `${name}.xlsx`,
    );
  } catch (error) {
    console.error("Excel aktarımı başarısız oldu, uyumlu yedek dosya hazırlanıyor.", error);
    exportFallbackExcel(name, title, columns, rows, context);
  }
}

async function exportAllToExcel(name: string, title: string, sheets: ExportSheet[], context: ExportContext = []) {
  try {
    const { Workbook } = await Promise.race([
      import("exceljs/dist/exceljs.min.js"),
      new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("Excel modülü zamanında yüklenemedi.")), 5_000),
      ),
    ]);
    const workbook = new Workbook();
    workbook.creator = "HanTech OSGB Yönetim Sistemi";
    workbook.created = new Date();
    workbook.modified = new Date();
    const summary = workbook.addWorksheet("Rapor özeti");
    summary.columns = [
      { key: "label", width: 28 },
      { key: "value", width: 52 },
    ];
    summary.mergeCells(1, 1, 1, 2);
    summary.getCell(1, 1).value = title;
    summary.getCell(1, 1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    summary.getCell(1, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF294E4B" } };
    summary.addRow(["Oluşturulma tarihi", new Date().toLocaleString("tr-TR")]);
    context.forEach((item) => summary.addRow([item.label, item.value]));
    summary.addRow(["Aktarılan sekme", sheets.length]);
    summary.views = [{ state: "frozen", ySplit: 1 }];
    sheets.forEach((sheetData) => {
      const sheet = workbook.addWorksheet(sheetData.name.slice(0, 31));
      sheet.mergeCells(1, 1, 1, sheetData.columns.length);
      sheet.getCell(1, 1).value = sheetData.name;
      sheet.getCell(1, 1).font = { bold: true, size: 15, color: { argb: "FFFFFFFF" } };
      sheet.getCell(1, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D3433" } };
      sheet.mergeCells(2, 1, 2, sheetData.columns.length);
      sheet.getCell(2, 1).value = "HanTech OSGB · Filtrelenmiş rapor verisi";
      sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF64748B" } };
      const header = sheet.addRow(sheetData.columns.map((column) => column.header));
      header.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF477873" } };
      });
      sheetData.rows.forEach((row) => sheet.addRow(sheetData.columns.map((column) => row[column.key] ?? "")));
      sheet.columns = sheetData.columns.map((column) => ({ key: column.key, width: column.width ?? 18 }));
      sheetData.rows.forEach((_, rowIndex) =>
        sheetData.columns.forEach((column, columnIndex) => {
          if (column.currency) sheet.getCell(rowIndex + 4, columnIndex + 1).numFmt = "₺#,##0";
          if (column.percent) sheet.getCell(rowIndex + 4, columnIndex + 1).numFmt = '0"%"';
        }),
      );
      sheet.autoFilter = {
        from: { row: 3, column: 1 },
        to: { row: sheetData.rows.length + 3, column: sheetData.columns.length },
      };
      sheet.views = [{ state: "frozen", ySplit: 3 }];
    });
    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `${name}.xlsx`,
    );
  } catch (error) {
    console.error("Toplu Excel aktarımı başarısız oldu.", error);
    const first = sheets[0];
    if (first) exportFallbackExcel(name, title, first.columns, first.rows, context);
  }
}

type TestReportRow = {
  id: string;
  testId: number;
  name: string;
  category: string;
  company: string;
  companyId: number;
  screening: string;
  date: string;
  status: ScreeningStatus;
  quantity: number;
  estimatedCompleted: number;
};

function screeningTestLines(screening: Screening, tests: TestItem[]) {
  if (screening.testLines?.length) return screening.testLines;
  return (screening.testIds ?? [])
    .map((testId) => {
      const test = tests.find((item) => item.id === testId);
      return test
        ? { testId, name: test.name, category: test.category, quantity: screening.participants, unitPrice: test.price }
        : null;
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));
}

export default function StatisticsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [isExporting, setIsExporting] = useState(false);
  const can = useCan();
  const [notice, showNotice] = useNotice(3500);
  const [companies] = useCompanies();
  const [offers] = useOffers();
  const [screenings] = useScreenings();
  const [tests] = useTests();
  const [equipment] = useEquipment();
  const [team] = useTeam();
  const [dateFrom, setDateFrom] = useState(() => todayIso());
  const [dateTo, setDateTo] = useState(() => todayIso());
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [selectedCompanyId, setSelectedCompanyId] = useState("Tümü");
  const [screeningQuery, setScreeningQuery] = useState("");
  const [screeningStatus, setScreeningStatus] = useState<"Tümü" | ScreeningStatus>("Tümü");
  const [operationQuery, setOperationQuery] = useState("");
  const [operationStatus, setOperationStatus] = useState<"Tümü" | ScreeningStatus>("Tümü");
  const [operationTeam, setOperationTeam] = useState("Tümü");
  const [companyReportQuery, setCompanyReportQuery] = useState("");
  const [companyReportStatus, setCompanyReportStatus] = useState("Tümü");
  const [companyReportSector, setCompanyReportSector] = useState("Tümü");
  const [companyReportCity, setCompanyReportCity] = useState("Tümü");
  const [companyReportSort, setCompanyReportSort] = useState<"name" | "employees" | "screenings">("name");
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [testQuery, setTestQuery] = useState("");
  const [testCategory, setTestCategory] = useState("Tümü");
  const [testCompanyId, setTestCompanyId] = useState("Tümü");
  const [testDateFrom, setTestDateFrom] = useState(() => todayIso());
  const [testDateTo, setTestDateTo] = useState(() => todayIso());
  const [testDatePreset, setTestDatePreset] = useState<DatePreset>("today");
  const defaultDate = todayIso();

  const applyDatePreset = (preset: Exclude<DatePreset, "custom">) => {
    setDatePreset(preset);
    if (preset === "all") {
      setDateFrom("");
      setDateTo("");
      return;
    }
    const today = new Date();
    const from = new Date(today);
    if (preset === "today") {
      setDateFrom(toLocalIso(today));
      setDateTo(toLocalIso(today));
      return;
    }
    if (preset === "year") from.setMonth(0, 1);
    else if (preset === "month") from.setDate(1);
    else from.setDate(today.getDate() - (preset === "last7" ? 6 : 29));
    setDateFrom(toLocalIso(from));
    setDateTo(toLocalIso(today));
  };

  const inDateRange = useCallback(
    (label: string) => {
      const iso = labelToIso(label);
      if (!iso) return !dateFrom && !dateTo;
      return (!dateFrom || iso >= dateFrom) && (!dateTo || iso <= dateTo);
    },
    [dateFrom, dateTo],
  );
  const reportOffers = useMemo(
    () =>
      offers.filter(
        (offer) =>
          inDateRange(offer.createdAt) &&
          (selectedCompanyId === "Tümü" || offer.companyId === Number(selectedCompanyId)),
      ),
    [offers, inDateRange, selectedCompanyId],
  );
  const reportScreenings = useMemo(
    () =>
      screenings.filter(
        (item) =>
          inDateRange(item.date) && (selectedCompanyId === "Tümü" || item.companyId === Number(selectedCompanyId)),
      ),
    [screenings, inDateRange, selectedCompanyId],
  );
  const screeningReportRows = useMemo(
    () =>
      reportScreenings.filter(
        (item) =>
          (screeningStatus === "Tümü" || item.status === screeningStatus) &&
          includesQuery(`${item.title} ${item.company} ${item.location} ${item.team} ${item.vehicle}`, screeningQuery),
      ),
    [reportScreenings, screeningQuery, screeningStatus],
  );
  const screeningStatsForTab = useMemo(
    () =>
      screeningStatuses.map((status) => ({
        name: status,
        value: screeningReportRows.filter((item) => item.status === status).length,
      })),
    [screeningReportRows],
  );
  const operationTeamOptions = useMemo(
    () => ["Tümü", ...Array.from(new Set(reportScreenings.map((item) => item.team).filter(Boolean)))],
    [reportScreenings],
  );
  const operationReportRows = useMemo(
    () =>
      reportScreenings.filter(
        (item) =>
          (operationStatus === "Tümü" || item.status === operationStatus) &&
          (operationTeam === "Tümü" || item.team === operationTeam) &&
          includesQuery(`${item.title} ${item.company} ${item.location} ${item.team} ${item.vehicle}`, operationQuery),
      ),
    [operationQuery, operationStatus, operationTeam, reportScreenings],
  );
  const testReportRows = useMemo<TestReportRow[]>(
    () =>
      reportScreenings
        .flatMap((screening) =>
          screeningTestLines(screening, tests).map((line) => ({
            id: `${screening.id}-${line.testId}`,
            testId: line.testId,
            name: line.name,
            category: line.category,
            company: screening.company,
            companyId: screening.companyId,
            screening: screening.title,
            date: screening.date,
            status: screening.status,
            quantity: Number(line.quantity) || 0,
            estimatedCompleted: Math.round(
              (Number(line.quantity) || 0) *
                (screening.participants ? screening.completed / screening.participants : 0),
            ),
          })),
        )
        .filter((row) => {
          const iso = labelToIso(row.date);
          return (
            (!selectedTestIds.length || selectedTestIds.includes(row.testId)) &&
            (testCategory === "Tümü" || row.category === testCategory) &&
            (testCompanyId === "Tümü" || row.companyId === Number(testCompanyId)) &&
            (!testDateFrom || iso >= testDateFrom) &&
            (!testDateTo || iso <= testDateTo)
          );
        }),
    [reportScreenings, selectedTestIds, testCategory, testCompanyId, testDateFrom, testDateTo, tests],
  );
  const reportCompanies = useMemo(
    () => companies.filter((company) => selectedCompanyId === "Tümü" || company.id === Number(selectedCompanyId)),
    [companies, selectedCompanyId],
  );
  const companyReportRows = useMemo(() => {
    const rows = reportCompanies.filter(
      (company) =>
        (companyReportStatus === "Tümü" || company.contract === companyReportStatus) &&
        (companyReportSector === "Tümü" || company.sector === companyReportSector) &&
        (companyReportCity === "Tümü" || company.city === companyReportCity) &&
        includesQuery(
          `${company.name} ${company.sector} ${company.city} ${company.district} ${company.contact}`,
          companyReportQuery,
        ),
    );
    return rows.sort((a, b) =>
      companyReportSort === "name"
        ? a.name.localeCompare(b.name, "tr")
        : companyReportSort === "employees"
          ? b.employees - a.employees
          : b.screenings - a.screenings,
    );
  }, [
    companyReportCity,
    companyReportQuery,
    companyReportSector,
    companyReportSort,
    companyReportStatus,
    reportCompanies,
  ]);
  const reportEquipment = useMemo(() => equipment, [equipment]);
  const hasDateFilter = Boolean(dateFrom || dateTo);
  const hasReportFilter = selectedCompanyId !== "Tümü" || dateFrom !== defaultDate || dateTo !== defaultDate;
  const invalidDateRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  const screeningStats = useMemo(
    () =>
      screeningStatuses.map((status) => ({
        name: status,
        value: reportScreenings.filter((item) => item.status === status).length,
      })),
    [reportScreenings],
  );
  const offerStats = useMemo(
    () =>
      Array.from(new Set(reportOffers.map((offer) => offer.status))).map((status) => ({
        name: status,
        value: reportOffers.filter((item) => item.status === status).length,
      })),
    [reportOffers],
  );
  const totalParticipants = reportScreenings.reduce((sum, item) => sum + item.participants, 0);
  const completedParticipants = reportScreenings.reduce((sum, item) => sum + item.completed, 0);
  const activeCompanies = reportCompanies.filter((company) => company.contract === "Aktif").length;
  const openOffers = reportOffers.filter((offer) => ["Gönderildi", "Görüşülüyor"].includes(offer.status)).length;
  const approvedOffers = reportOffers.filter((offer) => offer.status === "Onaylandı").length;
  const equipmentInUse = reportEquipment.filter((item) => item.status === "Kullanımda").length;
  const totalOfferValue = reportOffers.reduce((sum, offer) => sum + offer.total, 0);
  const offerValueWon = reportOffers
    .filter((offer) => offer.status === "Onaylandı")
    .reduce((sum, offer) => sum + offer.total, 0);
  const screeningCompletionRate = percentage(completedParticipants, totalParticipants);
  const attentionCount =
    reportOffers.filter((offer) => offer.status === "Süresi doldu").length +
    reportEquipment.filter((item) => item.status === "Kalibrasyon bekliyor" || item.status === "Bakımda").length;
  const currentTab = tabs.find((item) => item.id === tab) ?? tabs[0];
  const exportContext: ExportContext = [
    { label: "Rapor sekmesi", value: currentTab.label },
    {
      label: "Firma filtresi",
      value:
        selectedCompanyId === "Tümü"
          ? "Tüm firmalar"
          : (companies.find((company) => company.id === Number(selectedCompanyId))?.name ?? "Seçili firma"),
    },
    {
      label: "Tarih aralığı",
      value: dateFrom || dateTo ? `${dateFrom || "Başlangıç yok"} – ${dateTo || "Bitiş yok"}` : "Tüm zamanlar",
    },
    { label: "Oluşturulma tarihi", value: new Date().toLocaleString("tr-TR") },
  ];

  const handleExport = async () => {
    if (!can("statistics.export")) {
      showNotice("İstatistik Excel aktarımı için yetkiniz yok.");
      return;
    }
    if (invalidDateRange) {
      showNotice("Excel aktarımı için başlangıç tarihi, bitiş tarihinden önce olmalıdır.");
      return;
    }
    setIsExporting(true);
    try {
      const exportReport = (name: string, title: string, columns: ExportColumn[], rows: ExportRow[]) =>
        exportToExcel(name, title, columns, rows, exportContext);
      if (tab === "overview") {
        await exportReport(
          "genel-bakis",
          "HanTech OSGB Genel İstatistikler",
          [
            { header: "Kategori", key: "category", width: 20 },
            { header: "Metrik", key: "metric", width: 30 },
            { header: "Değer", key: "value", width: 18 },
            { header: "Oran %", key: "ratio", width: 14, percent: true },
            { header: "Açıklama", key: "description", width: 42 },
          ],
          [
            {
              category: "Firmalar",
              metric: "Toplam firma",
              value: reportCompanies.length,
              ratio: 100,
              description: "Kayıtlı tüm firmalar",
            },
            {
              category: "Firmalar",
              metric: "Aktif firma",
              value: activeCompanies,
              ratio: percentage(activeCompanies, reportCompanies.length),
              description: "Aktif sözleşmesi bulunan firmalar",
            },
            {
              category: "Teklifler",
              metric: "Toplam teklif",
              value: reportOffers.length,
              ratio: 100,
              description: "Tüm teklif kayıtları",
            },
            {
              category: "Teklifler",
              metric: "Açık teklif",
              value: openOffers,
              ratio: percentage(openOffers, reportOffers.length),
              description: "Gönderildi veya görüşülüyor durumundaki teklifler",
            },
            {
              category: "Teklifler",
              metric: "Teklif hacmi",
              value: totalOfferValue,
              ratio: percentage(totalOfferValue, totalOfferValue),
              description: "Tüm tekliflerin toplam tutarı",
            },
            {
              category: "Taramalar",
              metric: "Toplam tarama",
              value: reportScreenings.length,
              ratio: 100,
              description: "Tüm saha operasyonları",
            },
            {
              category: "Taramalar",
              metric: "Toplam katılımcı",
              value: totalParticipants,
              ratio: 100,
              description: "Planlanan toplam kişi sayısı",
            },
            {
              category: "Taramalar",
              metric: "Tamamlanan kişi",
              value: completedParticipants,
              ratio: screeningCompletionRate,
              description: "Tamamlanan katılımcı sayısı",
            },
            {
              category: "Ekipmanlar",
              metric: "Toplam kaynak",
              value: reportEquipment.length,
              ratio: 100,
              description: "Ekipman ve mobil araç toplamı",
            },
            {
              category: "Ekipmanlar",
              metric: "Kullanımda ekipman",
              value: equipmentInUse,
              ratio: percentage(equipmentInUse, reportEquipment.length),
              description: "Aktif olarak saha operasyonlarında kullanılan kaynaklar",
            },
          ],
        );
      } else if (tab === "operations") {
        await exportReport(
          "operasyon-raporu",
          "HanTech OSGB Operasyon Raporu",
          [
            { header: "Tarih", key: "tarih", width: 16 },
            { header: "Tarama", key: "tarama", width: 38 },
            { header: "Firma", key: "firma", width: 28 },
            { header: "Durum", key: "durum", width: 18 },
            { header: "Katılımcı", key: "katilimci", width: 14 },
            { header: "Tamamlanan", key: "tamamlanan", width: 14 },
            { header: "Ekip", key: "ekip", width: 28 },
          ],
          operationReportRows.map((screening) => ({
            tarih: screening.date,
            tarama: screening.title,
            firma: screening.company,
            durum: screening.status,
            katilimci: screening.participants,
            tamamlanan: screening.completed,
            ekip: screening.team,
          })),
        );
      } else if (tab === "offers") {
        await exportReport(
          "teklif-istatistikleri",
          "Teklif İstatistikleri",
          [
            { header: "Teklif no", key: "number", width: 18 },
            { header: "Teklif ID", key: "id", width: 16 },
            { header: "Firma", key: "company", width: 28 },
            { header: "Yetkili", key: "contact", width: 24 },
            { header: "Teklif türü", key: "offerType", width: 24 },
            { header: "Başlık", key: "title", width: 36 },
            { header: "Durum", key: "status", width: 18 },
            { header: "Hizmet kalemi", key: "items", width: 16 },
            { header: "Oluşturulma", key: "createdAt", width: 18 },
            { header: "Toplam", key: "total", width: 16, currency: true },
            { header: "İndirim", key: "discount", width: 16, currency: true },
            { header: "KDV", key: "tax", width: 16, currency: true },
            { header: "Geçerlilik", key: "validUntil", width: 18 },
          ],
          reportOffers.map((offer) => ({
            number: offer.number,
            id: offer.id,
            company: offer.company,
            contact: offer.contact,
            offerType: offer.offerType ?? "—",
            title: offer.title,
            status: offer.status,
            items: offer.items,
            createdAt: offer.createdAt,
            total: offer.total,
            discount: Number(offer.discount ?? 0),
            tax: Number(offer.tax ?? 0),
            validUntil: offer.validUntil,
          })),
        );
      } else if (tab === "screenings") {
        await exportReport(
          "tarama-istatistikleri",
          "Tarama İstatistikleri",
          [
            { header: "Tarama ID", key: "id", width: 16 },
            { header: "Tarama", key: "title", width: 38 },
            { header: "Firma", key: "company", width: 28 },
            { header: "Tarama türü", key: "screeningType", width: 26 },
            { header: "Tarih", key: "date", width: 16 },
            { header: "Bitiş tarihi", key: "endDate", width: 16 },
            { header: "Saat", key: "time", width: 16 },
            { header: "Konum", key: "location", width: 28 },
            { header: "Sorumlu ekip", key: "team", width: 28 },
            { header: "Mobil araç", key: "vehicle", width: 24 },
            { header: "Test sayısı", key: "testCount", width: 14 },
            { header: "Durum", key: "status", width: 18 },
            { header: "Katılımcı", key: "participants", width: 14 },
            { header: "Tamamlanan", key: "completed", width: 14 },
            { header: "İlerleme %", key: "progress", width: 14, percent: true },
            { header: "Ücret PDF’de", key: "showPriceOnPdf", width: 16 },
          ],
          screeningReportRows.map((item) => ({
            id: item.id,
            title: item.title,
            company: item.company,
            screeningType: item.screeningType ?? "—",
            date: item.date,
            endDate: item.endDate ?? item.date,
            time: `${item.time}${item.endTime ? ` - ${item.endTime}` : ""}`,
            location: item.location,
            team: item.team,
            vehicle: item.vehicle,
            testCount: item.testLines?.length ?? item.testIds?.length ?? 0,
            status: item.status,
            participants: item.participants,
            completed: item.completed,
            progress: percentage(item.completed, item.participants),
            showPriceOnPdf: item.showPriceOnPdf ? "Evet" : "Hayır",
          })),
        );
      } else if (tab === "tests") {
        await exportReport(
          "test-istatistikleri",
          "Test Kullanım İstatistikleri",
          [
            { header: "Test", key: "test", width: 34 },
            { header: "Kategori", key: "category", width: 18 },
            { header: "Firma", key: "company", width: 28 },
            { header: "Tarama", key: "screening", width: 34 },
            { header: "Tarih", key: "date", width: 16 },
            { header: "Durum", key: "status", width: 18 },
            { header: "Planlanan adet", key: "quantity", width: 16 },
            { header: "Tamamlanan", key: "completed", width: 16 },
          ],
          testReportRows.map((row) => ({
            test: row.name,
            category: row.category,
            company: row.company,
            screening: row.screening,
            date: row.date,
            status: row.status,
            quantity: row.quantity,
            completed: row.estimatedCompleted,
          })),
        );
      } else if (tab === "companies") {
        await exportReport(
          "firma-istatistikleri",
          "Firma İstatistikleri",
          [
            { header: "Firma ID", key: "id", width: 16 },
            { header: "Firma", key: "name", width: 30 },
            { header: "Sektör", key: "sector", width: 20 },
            { header: "Şehir", key: "city", width: 18 },
            { header: "İlçe", key: "district", width: 18 },
            { header: "Yetkili", key: "contact", width: 24 },
            { header: "E-posta", key: "email", width: 30 },
            { header: "Telefon", key: "phone", width: 18 },
            { header: "Çalışan", key: "employees", width: 14 },
            { header: "Tarama", key: "screenings", width: 14 },
            { header: "Sözleşme", key: "contract", width: 18 },
            { header: "Sözleşme bitişi", key: "contractEnd", width: 18 },
            { header: "Son tarama", key: "lastScreening", width: 18 },
          ],
          companyReportRows.map((company) => ({
            id: company.id,
            name: company.name,
            sector: company.sector,
            city: company.city,
            district: company.district,
            contact: company.contact,
            email: company.email,
            phone: company.phone,
            employees: company.employees,
            screenings: company.screenings,
            contract: company.contract,
            contractEnd: company.contractEnd,
            lastScreening: company.lastScreening,
          })),
        );
      } else {
        await exportReport(
          "ekipman-istatistikleri",
          "Ekipman İstatistikleri",
          [
            { header: "Ekipman ID", key: "id", width: 16 },
            { header: "Ekipman", key: "name", width: 28 },
            { header: "Tür", key: "kind", width: 16 },
            { header: "Alt tür", key: "type", width: 20 },
            { header: "Marka / model", key: "brandModel", width: 24 },
            { header: "Seri no", key: "serialNumber", width: 22 },
            { header: "Durum", key: "status", width: 22 },
            { header: "Sorumlu", key: "responsible", width: 24 },
            { header: "Konum", key: "location", width: 22 },
            { header: "Son kalibrasyon", key: "calibrationDate", width: 20 },
            { header: "Sonraki kalibrasyon", key: "nextCalibration", width: 22 },
            { header: "Son bakım", key: "lastMaintenance", width: 18 },
            { header: "Plaka", key: "plateNumber", width: 14 },
            { header: "Muayene", key: "inspectionDate", width: 18 },
            { header: "Sigorta bitişi", key: "insuranceEnd", width: 18 },
          ],
          reportEquipment.map((item) => ({
            id: item.id,
            name: item.name,
            kind: item.kind,
            type: item.type,
            brandModel: item.brandModel,
            serialNumber: item.serialNumber,
            status: item.status,
            responsible: item.responsible,
            location: item.location,
            calibrationDate: item.calibrationDate,
            nextCalibration: item.nextCalibration,
            lastMaintenance: item.lastMaintenance,
            plateNumber: item.plateNumber ?? "—",
            inspectionDate: item.inspectionDate ?? "—",
            insuranceEnd: item.insuranceEnd ?? "—",
          })),
        );
      }
      showNotice(`${currentTab.label} raporu Excel dosyası olarak indirildi.`);
    } catch (error) {
      console.error("İstatistik raporu oluşturulamadı.", error);
      showNotice("Excel dosyası oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    if (!can("statistics.export")) {
      showNotice("İstatistik Excel aktarımı için yetkiniz yok.");
      return;
    }
    setIsExporting(true);
    try {
      await exportAllToExcel(
        "hantech-tum-raporlar",
        "HanTech OSGB Tüm Raporlar",
        [
          {
            name: "Operasyon özeti",
            columns: [
              { header: "Kategori", key: "category" },
              { header: "Metrik", key: "metric" },
              { header: "Değer", key: "value" },
            ],
            rows: [
              { category: "Firmalar", metric: "Aktif firma", value: activeCompanies },
              { category: "Teklifler", metric: "Toplam teklif hacmi", value: totalOfferValue },
              { category: "Taramalar", metric: "Toplam tarama", value: reportScreenings.length },
              { category: "Taramalar", metric: "Katılımcı", value: totalParticipants },
              { category: "Ekipmanlar", metric: "Toplam kaynak", value: reportEquipment.length },
            ],
          },
          {
            name: "Operasyon",
            columns: [
              { header: "Tarih", key: "date" },
              { header: "Tarama", key: "title" },
              { header: "Firma", key: "company" },
              { header: "Durum", key: "status" },
              { header: "Katılımcı", key: "participants" },
              { header: "Tamamlanan", key: "completed" },
            ],
            rows: operationReportRows.map((item) => ({
              date: item.date,
              title: item.title,
              company: item.company,
              status: item.status,
              participants: item.participants,
              completed: item.completed,
            })),
          },
          {
            name: "Teklifler",
            columns: [
              { header: "Teklif no", key: "number" },
              { header: "Firma", key: "company" },
              { header: "Durum", key: "status" },
              { header: "Toplam", key: "total", currency: true },
            ],
            rows: reportOffers.map((item) => ({
              number: item.number,
              company: item.company,
              status: item.status,
              total: item.total,
            })),
          },
          {
            name: "Taramalar",
            columns: [
              { header: "Tarama", key: "title" },
              { header: "Firma", key: "company" },
              { header: "Tarih", key: "date" },
              { header: "Durum", key: "status" },
              { header: "Katılımcı", key: "participants" },
              { header: "Tamamlanan", key: "completed" },
            ],
            rows: screeningReportRows.map((item) => ({
              title: item.title,
              company: item.company,
              date: item.date,
              status: item.status,
              participants: item.participants,
              completed: item.completed,
            })),
          },
          {
            name: "Testler",
            columns: [
              { header: "Test", key: "name" },
              { header: "Kategori", key: "category" },
              { header: "Firma", key: "company" },
              { header: "Tarama", key: "screening" },
              { header: "Planlanan", key: "quantity" },
              { header: "Tamamlanan", key: "completed" },
            ],
            rows: testReportRows.map((item) => ({
              name: item.name,
              category: item.category,
              company: item.company,
              screening: item.screening,
              quantity: item.quantity,
              completed: item.estimatedCompleted,
            })),
          },
          {
            name: "Firmalar",
            columns: [
              { header: "Firma", key: "name" },
              { header: "Sektör", key: "sector" },
              { header: "Şehir", key: "city" },
              { header: "Çalışan", key: "employees" },
              { header: "Tarama", key: "screenings" },
              { header: "Sözleşme", key: "contract" },
            ],
            rows: companyReportRows.map((item) => ({
              name: item.name,
              sector: item.sector,
              city: item.city,
              employees: item.employees,
              screenings: item.screenings,
              contract: item.contract,
            })),
          },
          {
            name: "Ekipmanlar",
            columns: [
              { header: "Ekipman", key: "name" },
              { header: "Tür", key: "kind" },
              { header: "Durum", key: "status" },
              { header: "Sorumlu", key: "responsible" },
              { header: "Konum", key: "location" },
            ],
            rows: reportEquipment.map((item) => ({
              name: item.name,
              kind: item.kind,
              status: item.status,
              responsible: item.responsible,
              location: item.location,
            })),
          },
        ],
        exportContext,
      );
      showNotice("Tüm raporlar tek Excel dosyası olarak indirildi.");
    } catch (error) {
      console.error("Toplu istatistik raporu oluşturulamadı.", error);
      showNotice("Tüm raporlar aktarılırken bir hata oluştu.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Page className="statistics-page">
      <Card className="statistics-hero-shell border-sidebar-border bg-sidebar shadow-primary relative isolate overflow-hidden rounded-2xl border p-4 sm:p-5">
        <div
          aria-hidden="true"
          className="page-header-visual-image absolute inset-0 z-0 bg-cover bg-right bg-no-repeat"
          style={{ backgroundImage: 'url("/headers/reports.png")' }}
        />
        <div
          aria-hidden="true"
          className="from-sidebar/58 via-sidebar/36 to-sidebar/12 absolute inset-0 z-0 bg-gradient-to-br"
        />
        <div className="relative z-10">
          <PageHeader
            className="border-0 bg-transparent p-0 pl-0 shadow-none before:hidden"
            actions={
              <div className="flex flex-wrap gap-2">
                <Button aria-busy={isExporting} disabled={isExporting} onClick={handleExport} size="sm">
                  <Download /> {isExporting ? "Hazırlanıyor…" : "Excel'e aktar"}
                </Button>
                <Button
                  aria-busy={isExporting}
                  disabled={isExporting}
                  onClick={handleExportAll}
                  size="sm"
                  variant="outline"
                >
                  <Download /> Tüm sekmeleri aktar
                </Button>
              </div>
            }
            description="OSGB operasyonlarınızın performansını, kaynak kullanımını ve saha sonuçlarını tek merkezden izleyin."
            dark
            eyebrow="Raporlama ve analiz merkezi"
            title="İstatistikler"
          />
          <div className="statistics-hero-filter border-sidebar-border/70 mt-4 border-t pt-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-heading flex items-center gap-2 text-sm font-semibold">
                  <CalendarRange className="text-brand size-4" /> Gelişmiş rapor filtreleri
                </p>
                <p className="text-muted mt-1 text-xs">
                  Tarih, firma ve sekme seçimini kullanarak tüm metrikleri, grafikleri ve Excel çıktısını daraltın.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Firma">
                  <SearchableCompanySelect
                    allLabel="Tüm firmalar"
                    companies={companies}
                    includeAll
                    onChange={(value) => setSelectedCompanyId(String(value ?? "Tümü"))}
                    value={selectedCompanyId}
                  />
                </Field>
                <Field label="Başlangıç tarihi">
                  <Input
                    aria-label="Rapor başlangıç tarihi"
                    className="h-10 w-full sm:w-44"
                    onChange={(event) => {
                      setDateFrom(event.target.value);
                      setDatePreset("custom");
                    }}
                    type="date"
                    value={dateFrom}
                  />
                </Field>
                <Field label="Bitiş tarihi">
                  <Input
                    aria-label="Rapor bitiş tarihi"
                    className="h-10 w-full sm:w-44"
                    onChange={(event) => {
                      setDateTo(event.target.value);
                      setDatePreset("custom");
                    }}
                    type="date"
                    value={dateTo}
                  />
                </Field>
                {hasReportFilter && (
                  <Button
                    onClick={() => {
                      const today = todayIso();
                      setDateFrom(today);
                      setDateTo(today);
                      setSelectedCompanyId("Tümü");
                      setDatePreset("today");
                    }}
                    size="sm"
                    variant="danger"
                  >
                    <RotateCcw /> Temizle
                  </Button>
                )}
              </div>
            </div>
            <div className="statistics-hero-divider mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted mr-1 text-[10px] font-bold tracking-[0.12em] uppercase">Hızlı tarih</span>
                {[
                  ["today", "Bugün"],
                  ["last7", "Son 7 gün"],
                  ["last30", "Son 30 gün"],
                  ["month", "Bu ay"],
                  ["year", "Bu yıl"],
                  ["all", "Tüm zamanlar"],
                ].map(([preset, label]) => (
                  <button
                    aria-pressed={datePreset === preset}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition",
                      datePreset === preset
                        ? "border-brand bg-brand text-brand-fg shadow-sm"
                        : "border-border bg-card-muted text-muted hover:border-brand-outline hover:bg-brand-soft hover:text-brand-soft-fg",
                    )}
                    key={preset}
                    onClick={() => applyDatePreset(preset as Exclude<DatePreset, "custom">)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
              {hasDateFilter && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted">Aktif aralık:</span>
                  <CountPill className="statistics-date-pill">
                    {dateFrom ? displayIso(dateFrom) : "Başlangıç yok"}
                  </CountPill>
                  <span className="text-subtle">→</span>
                  <CountPill className="statistics-date-pill">{dateTo ? displayIso(dateTo) : "Bitiş yok"}</CountPill>
                </div>
              )}
            </div>
            {invalidDateRange && (
              <p className="border-danger/30 bg-danger-soft text-danger mt-3 rounded-xl border px-3 py-2 text-xs font-medium">
                Başlangıç tarihi, bitiş tarihinden önce veya aynı gün olmalıdır.
              </p>
            )}
          </div>
        </div>
      </Card>
      {notice && (
        <Alert className="mt-4" tone={notice.includes("oluşturulamadı") ? "danger" : "brand"}>
          {notice}
        </Alert>
      )}
      <div
        className="border-border bg-card shadow-card sticky top-20 z-10 mt-5 flex flex-wrap gap-1.5 rounded-2xl border p-2"
        role="tablist"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            aria-selected={tab === id}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors sm:flex-1 sm:justify-center",
              tab === id ? "bg-brand text-brand-fg" : "text-muted hover:bg-card-muted hover:text-foreground",
            )}
            key={id}
            onClick={() => setTab(id)}
            role="tab"
            type="button"
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      {tab === "overview" && (
        <OverviewTab
          companies={reportCompanies}
          equipment={reportEquipment}
          offers={reportOffers}
          screenings={reportScreenings}
          screeningStats={screeningStats}
          offerStats={offerStats}
          totalParticipants={totalParticipants}
          completedParticipants={completedParticipants}
          activeCompanies={activeCompanies}
          openOffers={openOffers}
          approvedOffers={approvedOffers}
          teamCount={team.filter((member) => member.active).length}
          totalOfferValue={totalOfferValue}
          offerValueWon={offerValueWon}
          screeningCompletionRate={screeningCompletionRate}
          attentionCount={attentionCount}
        />
      )}
      {tab === "operations" && (
        <OperationsTab
          companies={reportCompanies}
          equipment={reportEquipment}
          onQuery={setOperationQuery}
          onStatus={setOperationStatus}
          onTeam={setOperationTeam}
          query={operationQuery}
          screenings={operationReportRows}
          status={operationStatus}
          team={team}
          teamFilter={operationTeam}
          teamOptions={operationTeamOptions}
        />
      )}
      {tab === "offers" && <OffersTab offers={reportOffers} stats={offerStats} />}
      {tab === "screenings" && (
        <ScreeningsTab
          query={screeningQuery}
          setQuery={setScreeningQuery}
          setStatus={setScreeningStatus}
          screenings={screeningReportRows}
          stats={screeningStatsForTab}
          status={screeningStatus}
        />
      )}
      {tab === "tests" && (
        <TestsTab
          categories={Array.from(new Set(tests.map((test) => test.category).filter(Boolean)))}
          companies={companies}
          rows={testReportRows}
          selectedTestIds={selectedTestIds}
          setSelectedTestIds={setSelectedTestIds}
          testCategory={testCategory}
          setTestCategory={setTestCategory}
          testCompanyId={testCompanyId}
          setTestCompanyId={setTestCompanyId}
          testDateFrom={testDateFrom}
          setTestDateFrom={setTestDateFrom}
          testDateTo={testDateTo}
          setTestDateTo={setTestDateTo}
          testDatePreset={testDatePreset}
          setTestDatePreset={setTestDatePreset}
          testQuery={testQuery}
          setTestQuery={setTestQuery}
          tests={tests}
        />
      )}
      {tab === "companies" && (
        <CompaniesTab
          cities={Array.from(new Set(reportCompanies.map((company) => company.city).filter(Boolean)))}
          city={companyReportCity}
          companies={companyReportRows}
          onCity={setCompanyReportCity}
          onQuery={setCompanyReportQuery}
          onSector={setCompanyReportSector}
          onSort={setCompanyReportSort}
          onStatus={setCompanyReportStatus}
          query={companyReportQuery}
          sector={companyReportSector}
          sectors={Array.from(new Set(reportCompanies.map((company) => company.sector).filter(Boolean)))}
          sort={companyReportSort}
          status={companyReportStatus}
        />
      )}
      {tab === "equipment" && <EquipmentTab equipment={reportEquipment} />}
    </Page>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex h-full min-h-[390px] flex-col p-5">
      <CardHeader icon={BarChart3} title={title} description={description} />
      <div className="mt-5 min-h-72 flex-1">{children}</div>
    </Card>
  );
}

function OverviewTab({
  companies,
  equipment,
  offers,
  screenings,
  screeningStats,
  offerStats,
  totalParticipants,
  completedParticipants,
  activeCompanies,
  openOffers,
  approvedOffers,
  teamCount,
  totalOfferValue,
  offerValueWon,
  screeningCompletionRate,
  attentionCount,
}: {
  companies: Company[];
  equipment: Equipment[];
  offers: Offer[];
  screenings: Screening[];
  screeningStats: Array<{ name: ScreeningStatus; value: number }>;
  offerStats: Array<{ name: string; value: number }>;
  totalParticipants: number;
  completedParticipants: number;
  activeCompanies: number;
  openOffers: number;
  approvedOffers: number;
  teamCount: number;
  totalOfferValue: number;
  offerValueWon: number;
  screeningCompletionRate: number;
  attentionCount: number;
}) {
  return (
    <>
      <section aria-label="Genel özet" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Building2} label="Aktif firma" value={`${activeCompanies} / ${companies.length}`} />
        <SummaryCard icon={FileText} label="Açık teklif" value={`${openOffers} / ${offers.length}`} />
        <SummaryCard icon={ClipboardList} label="Toplam tarama" value={screenings.length} />
        <SummaryCard icon={UsersRound} label="Katılımcı ilerlemesi" value={`${screeningCompletionRate}%`} />
      </section>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <CardHeader
            icon={CircleDollarSign}
            title="Teklif hacmi ve kazanım"
            description="Teklif portföyündeki toplam tutar ve onaylanan değer."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MetricBlock label="Toplam teklif hacmi" value={money(totalOfferValue)} />
            <MetricBlock label="Onaylanan değer" value={money(offerValueWon)} />
            <MetricBlock label="Kazanım oranı" value={`${percentage(offerValueWon, totalOfferValue)}%`} />
          </div>
          <div className="mt-5 space-y-3">
            <SignalRow label="Onaylanan teklifler" value={approvedOffers} total={offers.length} tone="brand" />
            <SignalRow label="Açık teklifler" value={openOffers} total={offers.length} tone="info" />
            <SignalRow label="Aktif firmalar" value={activeCompanies} total={companies.length} tone="neutral" />
          </div>
        </Card>
        <Card className="p-5">
          <CardHeader
            icon={ShieldAlert}
            title="Takip gerektiren işler"
            description="Saha, ekipman ve sözleşme kaynaklı öncelikleri görün."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <AttentionTile icon={ShieldAlert} label="Dikkat gerektiren kayıt" value={attentionCount} tone="warning" />
            <AttentionTile icon={Clock3} label="Planlanan tarama" value={screeningStats[0]?.value ?? 0} tone="info" />
            <AttentionTile
              icon={CheckCircle2}
              label="Tarama tamamlanma"
              value={`${screeningCompletionRate}%`}
              tone="brand"
            />
          </div>
        </Card>
      </div>
      <div className="mt-5 grid items-stretch gap-5 xl:grid-cols-2">
        <ChartCard title="Saha planı durumları" description="Planlanan saha operasyonlarının güncel durumu.">
          {screenings.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={screeningStats} layout="vertical" margin={{ left: 8, right: 20 }}>
                <CartesianGrid horizontal={false} stroke="var(--divider)" />
                <XAxis allowDecimals={false} axisLine={false} tickLine={false} type="number" />
                <YAxis
                  axisLine={false}
                  dataKey="name"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  tickLine={false}
                  type="category"
                  width={92}
                />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {screeningStats.map((entry) => (
                    <Cell fill={screeningColors[entry.name]} key={entry.name} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              className="h-full border-0 py-10"
              description="Seçili tarih ve firma filtresinde tarama bulunmuyor."
              icon={ClipboardList}
              title="Tarama verisi yok"
            />
          )}
        </ChartCard>
        <ChartCard title="Teklif yanıt durumu" description="Tekliflerin güncel yanıt ve karar dağılımı.">
          {offerStats.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  data={offerStats}
                  dataKey="value"
                  innerRadius={62}
                  nameKey="name"
                  outerRadius={92}
                  paddingAngle={3}
                >
                  {offerStats.map((entry, index) => (
                    <Cell fill={offerColors[index % offerColors.length]} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              className="h-full border-0 py-10"
              description="Seçili tarih ve firma filtresinde teklif bulunmuyor."
              icon={FileText}
              title="Teklif verisi yok"
            />
          )}
          {offerStats.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 text-[10px]">
              {offerStats.map((entry, index) => (
                <span className="text-muted inline-flex items-center gap-1" key={entry.name}>
                  <i className="size-2 rounded-full" style={{ background: offerColors[index % offerColors.length] }} />
                  {entry.name} ({entry.value})
                </span>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
      <Card className="mt-5 p-5">
        <CardHeader icon={Gauge} title="Operasyon kapasitesi" description="Ekip, katılımcı ve saha planı görünümü." />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <StatTile icon={UsersRound} label="Aktif ekip" value={teamCount} />
          <StatTile icon={UsersRound} label="Toplam katılımcı" value={totalParticipants} />
          <StatTile icon={CheckCircle2} label="Tamamlanan kişi" value={completedParticipants} />
        </div>
      </Card>
      <Card className="mt-5 p-5">
        <CardHeader
          icon={CalendarDays}
          title="Saha operasyonlarının özeti"
          description="Durumlara göre tarama yoğunluğu ve ekip kapasitesi."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {screeningStats.map((item) => (
            <div className="border-border bg-card-muted rounded-xl border p-3" key={item.name}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted text-xs">{item.name}</span>
                <span className="text-foreground text-sm font-semibold">{item.value}</span>
              </div>
              <div className="bg-border mt-3 h-1.5 rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{
                    background: screeningColors[item.name],
                    width: `${percentage(item.value, screenings.length)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <PriorityPanel equipment={equipment} offers={offers} screenings={screenings} />
    </>
  );
}

function PriorityPanel({
  equipment,
  offers,
  screenings,
}: {
  equipment: Equipment[];
  offers: Offer[];
  screenings: Screening[];
}) {
  const actions = [
    ...equipment
      .filter((item) => item.status === "Kalibrasyon bekliyor" || item.status === "Bakımda")
      .slice(0, 2)
      .map((item) => ({
        title: item.name,
        detail:
          item.status === "Kalibrasyon bekliyor" ? "Kalibrasyon planı oluşturulmalı." : "Bakım süreci takip edilmeli.",
        tone: "warning" as const,
        label: item.status,
      })),
    ...offers
      .filter((offer) => offer.status === "Süresi doldu")
      .slice(0, 2)
      .map((offer) => ({
        title: offer.number,
        detail: `${offer.company} teklifinin geçerliliği sona erdi.`,
        tone: "danger" as const,
        label: "Teklif takibi",
      })),
    ...screenings
      .filter((item) => item.status === "Planlandı" || item.status === "Hazırlanıyor")
      .slice(0, 2)
      .map((item) => ({
        title: item.title,
        detail: `${item.date} tarihli saha operasyonu için hazırlık kontrolü gerekli.`,
        tone: "info" as const,
        label: item.status,
      })),
  ].slice(0, 5);

  return (
    <Card className="mt-5 p-5">
      <CardHeader
        icon={ListChecks}
        title="Öncelikli operasyon listesi"
        description="Filtrelenen kayıtlar arasından bugün takip edilmesi gereken başlıklar."
        action={<CountPill>{actions.length} aksiyon</CountPill>}
      />
      {actions.length ? (
        <div className="mt-4 grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => (
            <div
              className="border-border bg-card-muted flex min-w-0 items-start gap-3 rounded-xl border p-3"
              key={`${action.label}-${action.title}`}
            >
              <IconBadge
                icon={action.tone === "danger" ? ShieldAlert : action.tone === "warning" ? Gauge : CalendarDays}
                size="sm"
                tone={action.tone}
              />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-heading truncate text-xs font-semibold">{action.title}</p>
                  <Badge tone={action.tone === "info" ? "info" : action.tone}>{action.label}</Badge>
                </div>
                <p className="text-muted mt-1 text-[11px] leading-4">{action.detail}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-4 py-8"
          description="Seçili tarih aralığında önceliklendirilmiş bir kayıt bulunmuyor."
          icon={CheckCircle2}
          title="Takip gerektiren kayıt yok"
        />
      )}
    </Card>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border rounded-xl border p-3.5">
      <p className="text-subtle text-[10px] font-semibold tracking-wide uppercase">{label}</p>
      <p className="text-heading mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function OperationsTab({
  companies,
  equipment,
  onQuery,
  onStatus,
  onTeam,
  query,
  screenings,
  status,
  team,
  teamFilter,
  teamOptions,
}: {
  companies: Company[];
  equipment: Equipment[];
  onQuery: (value: string) => void;
  onStatus: (value: "Tümü" | ScreeningStatus) => void;
  onTeam: (value: string) => void;
  query: string;
  screenings: Screening[];
  status: "Tümü" | ScreeningStatus;
  team: TeamMember[];
  teamFilter: string;
  teamOptions: string[];
}) {
  const statusRows = screeningStatuses
    .map((status) => ({ status, count: screenings.filter((item) => item.status === status).length }))
    .filter((row) => row.count > 0);
  const companyRows = companies
    .map((company) => {
      const rows = screenings.filter((screening) => screening.companyId === company.id);
      return {
        company,
        count: rows.length,
        participants: rows.reduce((sum, item) => sum + item.participants, 0),
        completed: rows.reduce((sum, item) => sum + item.completed, 0),
      };
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
  const teamRows = team
    .map((member) => {
      const rows = screenings.filter(
        (screening) => screening.teamMembers?.includes(member.name) || screening.team.includes(member.name),
      );
      return {
        member,
        total: rows.length,
        open: rows.filter((item) => !["Tamamlandı", "İptal"].includes(item.status)).length,
        done: rows.filter((item) => item.status === "Tamamlandı").length,
      };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
  const calibrationDue = equipment.filter(
    (item) => item.status === "Kalibrasyon bekliyor" || item.status === "Bakımda",
  ).length;
  const openScreenings = screenings.filter((item) => !["Tamamlandı", "İptal"].includes(item.status)).length;
  const participants = screenings.reduce((sum, item) => sum + item.participants, 0);
  const completed = screenings.reduce((sum, item) => sum + item.completed, 0);
  const hasFilters = Boolean(query || status !== "Tümü" || teamFilter !== "Tümü");

  return (
    <>
      <Card className="border-brand/25 bg-brand-soft/25 mt-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1.6fr)_minmax(180px,0.9fr)_minmax(200px,1fr)_auto] xl:items-end">
          <Field label="Operasyon ara">
            <div className="relative">
              <Search className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                aria-label="Operasyon ara"
                className="h-10 pl-9"
                onChange={(event) => onQuery(event.target.value)}
                placeholder="Tarama, firma, konum, ekip veya araç ara..."
                value={query}
              />
            </div>
          </Field>
          <Field label="Durum">
            <Select
              aria-label="Operasyon durumu filtresi"
              className="h-10"
              onChange={(event) => onStatus(event.target.value as "Tümü" | ScreeningStatus)}
              value={status}
            >
              <option>Tümü</option>
              {screeningStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Ekip">
            <Select
              aria-label="Operasyon ekip filtresi"
              className="h-10"
              onChange={(event) => onTeam(event.target.value)}
              value={teamFilter}
            >
              {teamOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          {hasFilters && (
            <Button
              onClick={() => {
                onQuery("");
                onStatus("Tümü");
                onTeam("Tümü");
              }}
              size="sm"
              variant="danger"
            >
              <RotateCcw /> Temizle
            </Button>
          )}
        </div>
        <p className="text-muted mt-2 text-[11px]">
          {screenings.length} operasyon raporlanıyor. Üstteki tarih ve firma filtresiyle birlikte çalışır.
        </p>
      </Card>
      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={ClipboardList} label="Filtrelenen tarama" value={screenings.length} />
        <SummaryCard icon={UsersRound} label="Katılımcı kapasitesi" value={participants} />
        <SummaryCard icon={CheckCircle2} label="Tamamlanan kişi" value={completed} />
        <SummaryCard icon={Clock3} label="Açık saha işi" value={openScreenings} />
      </section>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <CardHeader
            description="Seçili tarih ve firma filtresindeki tarama durumları."
            icon={ClipboardCheck}
            title="Operasyon durumu"
          />
          <div className="mt-5 space-y-4">
            {statusRows.length === 0 ? (
              <EmptyState
                className="py-8"
                description="Seçili filtrede tarama bulunmuyor."
                icon={ClipboardList}
                title="Veri yok"
              />
            ) : (
              statusRows.map((row) => (
                <div key={row.status}>
                  <div className="flex items-center justify-between gap-3">
                    <Badge tone={screeningTone(row.status)}>{row.status}</Badge>
                    <span className="text-heading text-xs font-semibold">
                      {row.count} kayıt · %{percentage(row.count, screenings.length)}
                    </span>
                  </div>
                  <div className="bg-card-muted mt-2 h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-brand h-full rounded-full"
                      style={{ width: `${percentage(row.count, screenings.length)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card className="p-5">
          <CardHeader description="Tarama kayıtlarında görünen ekip dağılımı." icon={UsersRound} title="Ekip yükü" />
          <div className="mt-5 space-y-3">
            {teamRows.length === 0 ? (
              <p className="bg-card-muted text-muted rounded-xl p-5 text-center text-xs">Ekip verisi bulunmuyor.</p>
            ) : (
              teamRows.map((row) => (
                <div className="border-border bg-card-muted rounded-xl border p-3" key={row.member.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-foreground truncate text-xs font-semibold">{row.member.name}</p>
                    <span className="text-brand text-xs font-bold">{row.total} tarama</span>
                  </div>
                  <div className="text-muted mt-2 flex gap-3 text-[11px]">
                    <span>{row.open} açık</span>
                    <span>{row.done} tamamlandı</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
      <Card className="mt-5 overflow-hidden">
        <CardHeader
          className="p-5"
          description="Firma bazında saha hacmi ve katılımcı tamamlanma oranı."
          title="Firma performansı"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="border-divider bg-card-muted border-y">
              <tr>
                <th className="text-subtle px-5 py-3 text-[10px] font-bold tracking-wide uppercase">Firma</th>
                <th className="text-subtle px-5 py-3 text-[10px] font-bold tracking-wide uppercase">Tarama</th>
                <th className="text-subtle px-5 py-3 text-[10px] font-bold tracking-wide uppercase">Katılımcı</th>
                <th className="text-subtle px-5 py-3 text-[10px] font-bold tracking-wide uppercase">Tamamlanma</th>
              </tr>
            </thead>
            <tbody className="divide-divider divide-y">
              {companyRows.map((row) => {
                const completion = percentage(row.completed, row.participants);
                return (
                  <tr className="hover:bg-card-muted" key={row.company.id}>
                    <td className="text-foreground px-5 py-3 font-semibold">{row.company.name}</td>
                    <td className="text-muted px-5 py-3">{row.count}</td>
                    <td className="text-muted px-5 py-3">{row.participants}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Progress value={completion} />
                        <span className="text-heading w-9 text-right font-semibold">{completion}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {companyRows.length === 0 && <p className="text-muted p-8 text-center text-xs">Firma verisi bulunmuyor.</p>}
        </div>
      </Card>
      <Card className="mt-5 p-5">
        <CardHeader
          description="Operasyon yöneticisinin hızlıca aksiyon alması gereken kayıtlar."
          icon={ShieldAlert}
          title="Takip merkezi"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <AttentionTile icon={Clock3} label="Açık saha işi" value={openScreenings} tone="info" />
          <AttentionTile icon={Gauge} label="Bakım / kalibrasyon" value={calibrationDue} tone="warning" />
          <AttentionTile
            icon={CheckCircle2}
            label="Tamamlanma oranı"
            value={`${percentage(completed, participants)}%`}
            tone="brand"
          />
        </div>
      </Card>
    </>
  );
}

function SignalRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "brand" | "info" | "neutral";
}) {
  const colors = { brand: "bg-brand", info: "bg-info", neutral: "bg-neutral" };
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="text-muted">{label}</span>
        <span className="text-foreground font-semibold">
          {value} / {total}
        </span>
      </div>
      <div className="bg-card-muted h-2 overflow-hidden rounded-full">
        <div className={cn("h-full rounded-full", colors[tone])} style={{ width: `${percentage(value, total)}%` }} />
      </div>
    </div>
  );
}

function AttentionTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ShieldAlert;
  label: string;
  value: string | number;
  tone: "brand" | "info" | "warning";
}) {
  return (
    <div className="border-border bg-card-muted flex items-center gap-3 rounded-xl border p-3.5">
      <IconBadge icon={Icon} size="md" tone={tone} />
      <div className="min-w-0">
        <p className="text-muted text-xs">{label}</p>
        <p className="text-heading mt-1 text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

function OffersTab({ offers, stats }: { offers: Offer[]; stats: Array<{ name: string; value: number }> }) {
  const total = offers.reduce((sum, offer) => sum + offer.total, 0);
  return (
    <>
      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={FileText} label="Toplam teklif" value={offers.length} />
        <SummaryCard icon={TrendingUp} label="Teklif hacmi" value={money(total)} />
        <SummaryCard
          icon={CheckCircle2}
          label="Onay oranı"
          value={`${percentage(offers.filter((item) => item.status === "Onaylandı").length, offers.length)}%`}
        />
        <SummaryCard
          icon={CalendarDays}
          label="Ortalama teklif"
          value={money(offers.length ? total / offers.length : 0)}
        />
      </section>
      <div className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <ChartCard title="Durum dağılımı" description="Teklif havuzunun mevcut görünümü.">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={stats}>
              <CartesianGrid stroke="var(--divider)" vertical={false} />
              <XAxis axisLine={false} dataKey="name" tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }}
              />
              <Bar dataKey="value" fill="var(--brand)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card className="p-5">
          <CardHeader
            icon={FileText}
            title="Teklif kayıtları"
            description="Excel aktarımındaki detaylarla aynı veri seti."
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-subtle border-divider border-b">
                <tr>
                  <th className="px-2 py-3">Teklif</th>
                  <th className="px-2 py-3">Firma</th>
                  <th className="px-2 py-3">Durum</th>
                  <th className="px-2 py-3 text-right">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-divider divide-y">
                {offers.map((offer) => (
                  <tr className="text-muted" key={offer.id}>
                    <td className="text-brand px-2 py-3 font-semibold">{offer.number}</td>
                    <td className="px-2 py-3">{offer.company}</td>
                    <td className="px-2 py-3">
                      <Badge tone={offerTone[offer.status]}>{offer.status}</Badge>
                    </td>
                    <td className="text-foreground px-2 py-3 text-right font-semibold">{money(offer.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function TestsTab({
  categories,
  companies,
  rows,
  selectedTestIds,
  setSelectedTestIds,
  setTestCategory,
  testCompanyId,
  setTestCompanyId,
  testDateFrom,
  setTestDateFrom,
  testDateTo,
  setTestDateTo,
  testCategory,
  testDatePreset,
  setTestDatePreset,
  testQuery,
  setTestQuery,
  tests,
}: {
  categories: string[];
  companies: Company[];
  rows: TestReportRow[];
  selectedTestIds: number[];
  setSelectedTestIds: (value: number[]) => void;
  setTestCategory: (value: string) => void;
  testCompanyId: string;
  setTestCompanyId: (value: string) => void;
  testDateFrom: string;
  setTestDateFrom: (value: string) => void;
  testDateTo: string;
  setTestDateTo: (value: string) => void;
  testCategory: string;
  testDatePreset: DatePreset;
  setTestDatePreset: (value: DatePreset) => void;
  testQuery: string;
  setTestQuery: (value: string) => void;
  tests: TestItem[];
}) {
  const matchingTests = tests.filter(
    (test) =>
      (testCategory === "Tümü" || test.category === testCategory) &&
      `${test.name} ${test.code} ${test.category}`
        .toLocaleLowerCase("tr-TR")
        .includes(testQuery.toLocaleLowerCase("tr-TR")),
  );
  const [testPickerOpen, setTestPickerOpen] = useState(false);
  const applyTestDatePreset = (preset: Exclude<DatePreset, "custom">) => {
    setTestDatePreset(preset);
    if (preset === "all") {
      setTestDateFrom("");
      setTestDateTo("");
      return;
    }
    const today = new Date();
    const from = new Date(today);
    if (preset === "today") {
      setTestDateFrom(toLocalIso(today));
      setTestDateTo(toLocalIso(today));
      return;
    }
    if (preset === "year") from.setMonth(0, 1);
    else if (preset === "month") from.setDate(1);
    else from.setDate(today.getDate() - (preset === "last7" ? 6 : 29));
    setTestDateFrom(toLocalIso(from));
    setTestDateTo(toLocalIso(today));
  };
  const toggleTest = (id: number) =>
    setSelectedTestIds(
      selectedTestIds.includes(id) ? selectedTestIds.filter((item) => item !== id) : [...selectedTestIds, id],
    );
  const clearTestFilters = () => {
    setSelectedTestIds([]);
    setTestQuery("");
    setTestCategory("Tümü");
    setTestCompanyId("Tümü");
    setTestDateFrom(todayIso());
    setTestDateTo(todayIso());
    setTestDatePreset("today");
    setTestPickerOpen(false);
  };
  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
  const totalCompleted = rows.reduce((sum, row) => sum + row.estimatedCompleted, 0);
  const screeningCount = new Set(rows.map((row) => row.id.split("-")[0])).size;
  const companyRows = Array.from(new Set(rows.map((row) => row.companyId)))
    .map((companyId) => {
      const companyRows = rows.filter((row) => row.companyId === companyId);
      return {
        company: companyRows[0]?.company ?? "—",
        screenings: new Set(companyRows.map((row) => row.id.split("-")[0])).size,
        quantity: companyRows.reduce((sum, row) => sum + row.quantity, 0),
        completed: companyRows.reduce((sum, row) => sum + row.estimatedCompleted, 0),
      };
    })
    .sort((a, b) => b.quantity - a.quantity);
  const monthlyRows = Array.from(
    rows.reduce((map, row) => {
      const iso = labelToIso(row.date);
      const key = iso ? iso.slice(0, 7) : "Belirsiz";
      map.set(key, (map.get(key) ?? 0) + row.quantity);
      return map;
    }, new Map<string, number>()),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, quantity]) => ({
      month:
        key === "Belirsiz"
          ? key
          : new Intl.DateTimeFormat("tr-TR", { month: "short", year: "numeric" }).format(
              new Date(`${key}-15T12:00:00`),
            ),
      quantity,
    }));

  return (
    <>
      <Card className="border-brand/25 bg-brand-soft/30 mt-5 p-4">
        <div>
          <p className="text-heading text-sm font-semibold">Test analizi</p>
          <p className="text-muted mt-1 text-xs">
            Bu alana özel tarih, firma ve birden fazla test seçimiyle kullanım adetlerini inceleyin.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1.3fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_160px_160px_auto] xl:items-end">
          <Field label="Test ara ve seç">
            <div className="relative">
              <Search className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                aria-label="Test ara"
                className="h-10 pl-9"
                onChange={(event) => {
                  setTestQuery(event.target.value);
                  setTestPickerOpen(true);
                }}
                onFocus={() => setTestPickerOpen(true)}
                placeholder="Test adı, kodu veya kategori ara..."
                value={testQuery}
              />
            </div>
          </Field>
          <Field label="Firma">
            <SearchableCompanySelect
              allLabel="Tüm firmalar"
              companies={companies}
              includeAll
              onChange={(value) => setTestCompanyId(String(value ?? "Tümü"))}
              value={testCompanyId}
            />
          </Field>
          <Field label="Kategori">
            <Select
              aria-label="Test kategorisi"
              className="h-10"
              onChange={(event) => setTestCategory(event.target.value)}
              value={testCategory}
            >
              <option>Tümü</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </Select>
          </Field>
          <Field label="Başlangıç tarihi">
            <Input
              aria-label="Test raporu başlangıç tarihi"
              className="h-10"
              onChange={(event) => {
                setTestDateFrom(event.target.value);
                setTestDatePreset("custom");
              }}
              type="date"
              value={testDateFrom}
            />
          </Field>
          <Field label="Bitiş tarihi">
            <Input
              aria-label="Test raporu bitiş tarihi"
              className="h-10"
              onChange={(event) => {
                setTestDateTo(event.target.value);
                setTestDatePreset("custom");
              }}
              type="date"
              value={testDateTo}
            />
          </Field>
          <Button onClick={clearTestFilters} size="sm" variant="outline">
            <RotateCcw /> Temizle
          </Button>
        </div>
        <div className="border-divider mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="text-muted mr-1 text-[10px] font-bold tracking-[0.12em] uppercase">Hızlı tarih seçimi</span>
          {[
            ["today", "Bugün"],
            ["last7", "Son 7 gün"],
            ["last30", "Son 30 gün"],
            ["month", "Bu ay"],
            ["year", "Bu yıl"],
            ["all", "Tüm zamanlar"],
          ].map(([preset, label]) => (
            <button
              aria-pressed={testDatePreset === preset}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition",
                testDatePreset === preset
                  ? "border-brand bg-brand text-brand-fg"
                  : "border-border bg-card-muted text-muted hover:border-brand-outline hover:bg-brand-soft hover:text-brand-soft-fg",
              )}
              key={preset}
              onClick={() => applyTestDatePreset(preset as Exclude<DatePreset, "custom">)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="border-border bg-card mt-3 rounded-xl border p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-subtle text-[10px] font-bold tracking-[0.12em] uppercase">Seçilen testler</p>
            <div className="flex items-center gap-2">
              <span className="text-muted text-[10px]">
                {selectedTestIds.length ? `${selectedTestIds.length} test seçildi` : "Tüm testler dahil"}
              </span>
              <Button onClick={() => setTestPickerOpen((open) => !open)} size="xs" variant="outline">
                {testPickerOpen ? "Test listesini gizle" : "Test listesini aç"}
              </Button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTestIds.length ? (
              selectedTestIds.map((id) => {
                const test = tests.find((item) => item.id === id);
                return test ? (
                  <button
                    className="bg-brand-soft text-brand-soft-fg inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    key={id}
                    onClick={() => toggleTest(id)}
                    type="button"
                  >
                    {test.name}
                    <span aria-hidden="true">×</span>
                  </button>
                ) : null;
              })
            ) : (
              <span className="text-muted text-xs">
                Arama sonucundan testleri seçin; seçim yapılmazsa tüm testler raporlanır.
              </span>
            )}
          </div>
          {testPickerOpen && (
            <div className="border-divider mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto border-t pt-3">
              {matchingTests.map((test) => (
                <button
                  aria-pressed={selectedTestIds.includes(test.id)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition",
                    selectedTestIds.includes(test.id)
                      ? "border-brand bg-brand text-brand-fg"
                      : "border-border bg-background text-muted hover:border-brand-outline hover:text-foreground",
                  )}
                  key={test.id}
                  onClick={() => toggleTest(test.id)}
                  type="button"
                >
                  <span className="font-semibold">{test.name}</span>
                  <span className="ml-1 opacity-70">{test.code}</span>
                </button>
              ))}
              {!matchingTests.length && <span className="text-muted text-xs">Aramanızla eşleşen test bulunamadı.</span>}
            </div>
          )}
        </div>
      </Card>
      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard icon={FlaskConical} label="Test uygulama adedi" value={totalQuantity} />
        <SummaryCard icon={CheckCircle2} label="Tamamlanan (tahmini)" value={totalCompleted} />
        <SummaryCard icon={Gauge} label="Tamamlanma oranı" value={`${percentage(totalCompleted, totalQuantity)}%`} />
        <SummaryCard icon={ClipboardList} label="İlgili tarama" value={screeningCount} />
        <SummaryCard icon={Building2} label="Firma" value={companyRows.length} />
      </section>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <CardHeader
            icon={BarChart3}
            title="Aylık test yoğunluğu"
            description="Seçili testlerin planlanan adet bazında dağılımı."
          />
          {monthlyRows.length ? (
            <div className="mt-5 h-72">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={monthlyRows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke="var(--divider)" vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="month"
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar dataKey="quantity" fill="var(--brand)" name="Test adedi" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              className="mt-5 py-10"
              description="Seçili filtrelerde test verisi bulunmuyor."
              icon={FlaskConical}
              title="Test verisi yok"
            />
          )}
        </Card>
        <Card className="p-5">
          <CardHeader icon={Building2} title="Firma dağılımı" description="Test adetlerinin firmalara göre özeti." />
          <div className="mt-4 space-y-4">
            {companyRows.length ? (
              companyRows.slice(0, 6).map((row) => (
                <div key={row.company}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-foreground truncate font-semibold">{row.company}</span>
                    <span className="text-muted">{row.quantity} adet</span>
                  </div>
                  <div className="mt-2">
                    <Progress value={percentage(row.quantity, totalQuantity)} />
                  </div>
                  <p className="text-subtle mt-1 text-[10px]">
                    {row.screenings} tarama · {row.completed} tamamlanan
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted py-8 text-center text-xs">Firma dağılımı için test kaydı bulunmuyor.</p>
            )}
          </div>
        </Card>
      </div>
      <Card className="mt-5 overflow-hidden">
        <CardHeader
          className="p-5"
          icon={ClipboardList}
          title="Test kullanım detayları"
          description="Her tarama ve test kaleminin planlanan ve tamamlanan adetleri."
        />
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="border-divider bg-card-muted border-y">
                <tr>
                  <th className="text-subtle px-5 py-3 text-[10px] font-bold tracking-wide uppercase">Test</th>
                  <th className="text-subtle px-5 py-3 text-[10px] font-bold tracking-wide uppercase">Firma</th>
                  <th className="text-subtle px-5 py-3 text-[10px] font-bold tracking-wide uppercase">
                    Tarama / tarih
                  </th>
                  <th className="text-subtle px-5 py-3 text-[10px] font-bold tracking-wide uppercase">Durum</th>
                  <th className="text-subtle px-5 py-3 text-right text-[10px] font-bold tracking-wide uppercase">
                    Planlanan
                  </th>
                  <th className="text-subtle px-5 py-3 text-right text-[10px] font-bold tracking-wide uppercase">
                    Tamamlanan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-divider divide-y">
                {rows.map((row) => (
                  <tr className="hover:bg-card-muted" key={row.id}>
                    <td className="px-5 py-3">
                      <p className="text-foreground font-semibold">{row.name}</p>
                      <p className="text-muted text-[10px]">{row.category}</p>
                    </td>
                    <td className="text-muted px-5 py-3">{row.company}</td>
                    <td className="px-5 py-3">
                      <p className="text-foreground max-w-[280px] truncate font-medium">{row.screening}</p>
                      <p className="text-muted text-[10px]">{row.date}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={screeningTone(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="text-foreground px-5 py-3 text-right font-semibold">{row.quantity}</td>
                    <td className="text-brand px-5 py-3 text-right font-semibold">{row.estimatedCompleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            className="border-0 py-12"
            description="Test seçimini veya üstteki tarih/firma filtrelerini değiştirin."
            icon={FlaskConical}
            title="Test kaydı bulunamadı"
          />
        )}
      </Card>
    </>
  );
}

function ScreeningsTab({
  query,
  setQuery,
  setStatus,
  screenings,
  stats,
  status,
}: {
  query: string;
  setQuery: (value: string) => void;
  setStatus: (value: "Tümü" | ScreeningStatus) => void;
  screenings: Screening[];
  stats: Array<{ name: ScreeningStatus; value: number }>;
  status: "Tümü" | ScreeningStatus;
}) {
  const clearFilters = () => {
    setQuery("");
    setStatus("Tümü");
  };
  return (
    <>
      <Card className="border-brand/25 bg-brand-soft/25 mt-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field className="min-w-0 flex-1" label="Tarama ara">
            <div className="relative">
              <Search className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                aria-label="İstatistik taraması ara"
                className="h-10 pl-9"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tarama, firma, konum, ekip veya araç ara..."
                value={query}
              />
            </div>
          </Field>
          <Field label="Durum">
            <Select
              aria-label="İstatistik tarama durumu"
              className="h-10 w-full sm:w-48"
              onChange={(event) => setStatus(event.target.value as "Tümü" | ScreeningStatus)}
              value={status}
            >
              <option>Tümü</option>
              {screeningStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          {(query || status !== "Tümü") && (
            <Button onClick={clearFilters} size="sm" variant="danger">
              <RotateCcw /> Temizle
            </Button>
          )}
        </div>
        <p className="text-muted mt-2 text-[11px]">
          {screenings.length} tarama raporlanıyor. Üstteki tarih ve firma filtresiyle birlikte çalışır.
        </p>
      </Card>
      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={ClipboardList} label="Toplam tarama" value={screenings.length} />
        <SummaryCard
          icon={CalendarDays}
          label="Planlanan"
          value={screenings.filter((item) => item.status === "Planlandı").length}
        />
        <SummaryCard
          icon={UsersRound}
          label="Katılımcı"
          value={screenings.reduce((sum, item) => sum + item.participants, 0)}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Tamamlanma"
          value={`${percentage(
            screenings.reduce((sum, item) => sum + item.completed, 0),
            screenings.reduce((sum, item) => sum + item.participants, 0),
          )}%`}
        />
      </section>
      <Card className="mt-5 p-5">
        <CardHeader
          icon={ClipboardList}
          title="Tarama performansı"
          description="Her taramanın katılımcı ve tamamlanma durumu."
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="text-subtle border-divider border-b">
              <tr>
                <th className="px-2 py-3">Tarama</th>
                <th className="px-2 py-3">Firma</th>
                <th className="px-2 py-3">Tarih</th>
                <th className="px-2 py-3">Durum</th>
                <th className="px-2 py-3">İlerleme</th>
                <th className="px-2 py-3 text-right">Kişi</th>
              </tr>
            </thead>
            <tbody className="divide-divider divide-y">
              {screenings.map((item) => (
                <tr className="text-muted" key={item.id}>
                  <td className="text-foreground max-w-[260px] truncate px-2 py-3 font-semibold">{item.title}</td>
                  <td className="px-2 py-3">{item.company}</td>
                  <td className="px-2 py-3">{item.date}</td>
                  <td className="px-2 py-3">
                    <Badge tone={screeningTone(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="w-44 px-2 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={percentage(item.completed, item.participants)} />
                      <span className="text-foreground w-8 text-right font-semibold">
                        {percentage(item.completed, item.participants)}%
                      </span>
                    </div>
                  </td>
                  <td className="text-foreground px-2 py-3 text-right font-semibold">
                    {item.completed} / {item.participants}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-muted mt-5 flex flex-wrap gap-2 text-xs">
          {stats.map((item) => (
            <span className="bg-card-muted rounded-lg px-2.5 py-1.5" key={item.name}>
              {item.name}: <strong className="text-foreground">{item.value}</strong>
            </span>
          ))}
        </div>
      </Card>
    </>
  );
}

function screeningTone(status: ScreeningStatus) {
  return status === "İptal"
    ? "danger"
    : status === "Hazırlanıyor"
      ? "warning"
      : status === "Devam ediyor"
        ? "brand"
        : status === "Planlandı"
          ? "info"
          : "success";
}

function CompaniesTab({
  cities,
  city,
  companies,
  onCity,
  onQuery,
  onSector,
  onSort,
  onStatus,
  query,
  sector,
  sectors,
  sort,
  status,
}: {
  cities: string[];
  city: string;
  companies: Company[];
  onCity: (value: string) => void;
  onQuery: (value: string) => void;
  onSector: (value: string) => void;
  onSort: (value: "name" | "employees" | "screenings") => void;
  onStatus: (value: string) => void;
  query: string;
  sector: string;
  sectors: string[];
  sort: "name" | "employees" | "screenings";
  status: string;
}) {
  const hasFilters = Boolean(query || status !== "Tümü" || sector !== "Tümü" || city !== "Tümü");
  return (
    <>
      <Card className="border-brand/25 bg-brand-soft/25 mt-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_auto] xl:items-end">
          <Field label="Firma ara">
            <div className="relative">
              <Search className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                aria-label="İstatistik firması ara"
                className="h-10 pl-9"
                onChange={(event) => onQuery(event.target.value)}
                placeholder="Firma, sektör, şehir veya yetkili ara..."
                value={query}
              />
            </div>
          </Field>
          <Field label="Sözleşme">
            <Select
              aria-label="İstatistik firma sözleşme durumu"
              className="h-10"
              onChange={(event) => onStatus(event.target.value)}
              value={status}
            >
              <option>Tümü</option>
              {contractStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Sektör">
            <Select
              aria-label="İstatistik firma sektörü"
              className="h-10"
              onChange={(event) => onSector(event.target.value)}
              value={sector}
            >
              <option>Tümü</option>
              {sectors.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Şehir">
            <Select
              aria-label="İstatistik firma şehri"
              className="h-10"
              onChange={(event) => onCity(event.target.value)}
              value={city}
            >
              <option>Tümü</option>
              {cities.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Sırala">
            <Select
              aria-label="İstatistik firma sıralaması"
              className="h-10"
              onChange={(event) => onSort(event.target.value as "name" | "employees" | "screenings")}
              value={sort}
            >
              <option value="name">Firma adına göre</option>
              <option value="employees">Çalışan sayısına göre</option>
              <option value="screenings">Tarama sayısına göre</option>
            </Select>
          </Field>
          {hasFilters && (
            <Button
              onClick={() => {
                onQuery("");
                onStatus("Tümü");
                onSector("Tümü");
                onCity("Tümü");
              }}
              size="sm"
              variant="danger"
            >
              <RotateCcw /> Temizle
            </Button>
          )}
        </div>
        <p className="text-muted mt-2 text-[11px]">
          {companies.length} firma raporlanıyor. Üstteki tarih ve firma filtresiyle birlikte çalışır.
        </p>
      </Card>
      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Building2} label="Toplam firma" value={companies.length} />
        <SummaryCard
          icon={CheckCircle2}
          label="Aktif sözleşme"
          value={companies.filter((item) => item.contract === "Aktif").length}
        />
        <SummaryCard
          icon={UsersRound}
          label="Toplam çalışan"
          value={companies.reduce((sum, item) => sum + item.employees, 0)}
        />
        <SummaryCard
          icon={ClipboardList}
          label="Tarama geçmişi"
          value={companies.reduce((sum, item) => sum + item.screenings, 0)}
        />
      </section>
      <Card className="mt-5 p-5">
        <CardHeader icon={Building2} title="Firma performansı" description="Çalışan, tarama ve sözleşme görünümü." />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="text-subtle border-divider border-b">
              <tr>
                <th className="px-2 py-3">Firma</th>
                <th className="px-2 py-3">Sektör / şehir</th>
                <th className="px-2 py-3 text-right">Çalışan</th>
                <th className="px-2 py-3 text-right">Tarama</th>
                <th className="px-2 py-3">Sözleşme</th>
              </tr>
            </thead>
            <tbody className="divide-divider divide-y">
              {companies.map((company) => (
                <tr className="text-muted" key={company.id}>
                  <td className="text-foreground px-2 py-3 font-semibold">{company.name}</td>
                  <td className="px-2 py-3">
                    {company.sector} · {company.city}
                  </td>
                  <td className="text-foreground px-2 py-3 text-right font-semibold">{company.employees}</td>
                  <td className="text-foreground px-2 py-3 text-right font-semibold">{company.screenings}</td>
                  <td className="px-2 py-3">
                    <Badge tone={contractTone[company.contract]}>{company.contract}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function EquipmentTab({ equipment }: { equipment: Equipment[] }) {
  return (
    <>
      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Package} label="Toplam kaynak" value={equipment.length} />
        <SummaryCard
          icon={CheckCircle2}
          label="Kullanımda"
          value={equipment.filter((item) => item.status === "Kullanımda").length}
        />
        <SummaryCard
          icon={CalendarDays}
          label="Kalibrasyon bekleyen"
          value={equipment.filter((item) => item.status === "Kalibrasyon bekliyor").length}
        />
        <SummaryCard
          icon={Gauge}
          label="Bakımda"
          value={equipment.filter((item) => item.status === "Bakımda").length}
        />
      </section>
      <Card className="mt-5 p-5">
        <CardHeader icon={Package} title="Kaynak kullanımı" description="Ekipman ve mobil araçların güncel durumu." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {equipmentStatuses.map((status) => (
            <StatTile
              icon={Package}
              key={status}
              label={status}
              value={equipment.filter((item) => item.status === status).length}
            />
          ))}
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="text-subtle border-divider border-b">
              <tr>
                <th className="px-2 py-3">Kaynak</th>
                <th className="px-2 py-3">Tür</th>
                <th className="px-2 py-3">Marka / model</th>
                <th className="px-2 py-3">Sorumlu</th>
                <th className="px-2 py-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-divider divide-y">
              {equipment.map((item) => (
                <tr className="text-muted" key={item.id}>
                  <td className="text-foreground px-2 py-3 font-semibold">{item.name}</td>
                  <td className="px-2 py-3">{item.kind}</td>
                  <td className="px-2 py-3">{item.brandModel}</td>
                  <td className="px-2 py-3">{item.responsible || "—"}</td>
                  <td className="px-2 py-3">
                    <Badge
                      tone={
                        item.status === "Kullanımda"
                          ? "info"
                          : item.status === "Pasif"
                            ? "danger"
                            : item.status === "Bakımda"
                              ? "warning"
                              : "neutral"
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
