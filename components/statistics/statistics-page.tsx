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
  Gauge,
  ListChecks,
  Package,
  RotateCcw,
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
import { useCompanies, useEquipment, useOffers, useScreenings, useTeam } from "@/lib/data";
import { useNotice } from "@/lib/hooks";
import {
  equipmentStatuses,
  screeningStatuses,
  type Company,
  type Equipment,
  type Offer,
  type Screening,
  type ScreeningStatus,
  type TeamMember,
} from "@/lib/demo-data";
import { labelToIso, money } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tab = "overview" | "operations" | "offers" | "screenings" | "companies" | "equipment";
type ExportColumn = { header: string; key: string; width?: number; currency?: boolean };
type ExportRow = Record<string, string | number>;
type DatePreset = "all" | "month" | "last30" | "custom";

const tabs: Array<{ id: Tab; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "Genel bakış", icon: BarChart3 },
  { id: "operations", label: "Operasyon", icon: ClipboardCheck },
  { id: "offers", label: "Teklifler", icon: FileText },
  { id: "screenings", label: "Taramalar", icon: ClipboardList },
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

function exportFallbackExcel(name: string, title: string, columns: ExportColumn[], rows: ExportRow[]) {
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
  const html = `<html><head><meta charset="utf-8"><style>body{font-family:Arial;color:#17324d}table{border-collapse:collapse}th,td{border:1px solid #d9e2ea;padding:8px 10px;text-align:left}th{background:#2878b5;color:white}h1{color:#17324d}</style></head><body><h1>${escapeHtml(title)}</h1><p>HanTech OSGB · ${escapeHtml(new Date().toLocaleDateString("tr-TR"))}</p><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  downloadBlob(new Blob(["\ufeff", html], { type: "application/vnd.ms-excel" }), `${name}.xls`);
}

async function exportToExcel(name: string, title: string, columns: ExportColumn[], rows: ExportRow[]) {
  try {
    const { Workbook } = await Promise.race([
      import("exceljs/dist/exceljs.min.js"),
      new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("Excel modülü zamanında yüklenemedi.")), 5_000),
      ),
    ]);
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet(name.slice(0, 31));
    sheet.mergeCells(1, 1, 1, columns.length);
    sheet.getCell(1, 1).value = title;
    sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    sheet.getCell(1, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17324D" } };
    sheet.getCell(1, 1).alignment = { vertical: "middle" };
    sheet.getRow(1).height = 28;
    sheet.mergeCells(2, 1, 2, columns.length);
    sheet.getCell(2, 1).value = `HanTech OSGB · ${new Date().toLocaleDateString("tr-TR")}`;
    sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF64748B" } };
    const header = sheet.addRow(columns.map((column) => column.header));
    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2878B5" } };
      cell.alignment = { vertical: "middle" };
    });
    rows.forEach((row) => sheet.addRow(columns.map((column) => row[column.key] ?? "")));
    sheet.columns = columns.map((column) => ({ key: column.key, width: column.width ?? 18 }));
    rows.forEach((_, rowIndex) => {
      columns.forEach((column, columnIndex) => {
        if (column.currency) sheet.getCell(rowIndex + 4, columnIndex + 1).numFmt = "₺#,##0";
      });
      if (rowIndex % 2 === 1) {
        sheet.getRow(rowIndex + 4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
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
    exportFallbackExcel(name, title, columns, rows);
  }
}

export default function StatisticsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [isExporting, setIsExporting] = useState(false);
  const [notice, showNotice] = useNotice(3500);
  const [companies] = useCompanies();
  const [offers] = useOffers();
  const [screenings] = useScreenings();
  const [equipment] = useEquipment();
  const [team] = useTeam();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState("Tümü");

  const applyDatePreset = (preset: Exclude<DatePreset, "custom">) => {
    setDatePreset(preset);
    if (preset === "all") {
      setDateFrom("");
      setDateTo("");
      return;
    }
    const today = new Date();
    const from = new Date(today);
    if (preset === "month") from.setDate(1);
    else from.setDate(today.getDate() - 29);
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
    () => offers.filter((offer) => inDateRange(offer.createdAt) && (selectedCompanyId === "Tümü" || offer.companyId === Number(selectedCompanyId))),
    [offers, inDateRange, selectedCompanyId],
  );
  const reportScreenings = useMemo(
    () => screenings.filter((item) => inDateRange(item.date) && (selectedCompanyId === "Tümü" || item.companyId === Number(selectedCompanyId))),
    [screenings, inDateRange, selectedCompanyId],
  );
  const reportCompanies = useMemo(
    () => companies.filter((company) => inDateRange(company.lastScreening) && (selectedCompanyId === "Tümü" || company.id === Number(selectedCompanyId))),
    [companies, inDateRange, selectedCompanyId],
  );
  const reportEquipment = useMemo(
    () => equipment.filter((item) => inDateRange(item.lastMaintenance || item.calibrationDate || "")),
    [equipment, inDateRange],
  );
  const hasDateFilter = Boolean(dateFrom || dateTo);

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
  const operationsRows = useMemo(
    () => reportScreenings.map((screening) => ({
      tarih: screening.date,
      tarama: screening.title,
      firma: screening.company,
      durum: screening.status,
      katilimci: screening.participants,
      tamamlanan: screening.completed,
      ekip: screening.team,
    })),
    [reportScreenings],
  );
  const currentTab = tabs.find((item) => item.id === tab) ?? tabs[0];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (tab === "overview") {
        await exportToExcel(
          "genel-bakis",
          "HanTech OSGB Genel İstatistikler",
          [
            { header: "Kategori", key: "category", width: 20 },
            { header: "Metrik", key: "metric", width: 30 },
            { header: "Değer", key: "value", width: 18 },
            { header: "Oran %", key: "ratio", width: 14 },
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
        await exportToExcel(
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
          operationsRows,
        );
      } else if (tab === "offers") {
        await exportToExcel(
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
        await exportToExcel(
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
            { header: "İlerleme %", key: "progress", width: 14 },
            { header: "Ücret PDF’de", key: "showPriceOnPdf", width: 16 },
          ],
          reportScreenings.map((item) => ({
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
      } else if (tab === "companies") {
        await exportToExcel(
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
          reportCompanies.map((company) => ({
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
        await exportToExcel(
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

  return (
    <Page>
      <Card className="border-border bg-card shadow-card rounded-2xl border p-4 sm:p-5">
        <PageHeader
          className="border-0 bg-transparent p-0 pl-0 shadow-none before:hidden"
          actions={
            <Button aria-busy={isExporting} disabled={isExporting} onClick={handleExport}>
              <Download /> {isExporting ? "Hazırlanıyor…" : "Excel'e aktar"}
            </Button>
          }
          description="OSGB operasyonlarınızın performansını, kaynak kullanımını ve saha sonuçlarını tek merkezden izleyin."
          eyebrow="Raporlama ve analiz merkezi"
          title="İstatistikler"
          visual="/headers/reports.png"
        />
        <div className="border-divider mt-4 border-t pt-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-heading flex items-center gap-2 text-sm font-semibold">
                <CalendarRange className="text-brand size-4" /> Gelişmiş rapor filtreleri
              </p>
              <p className="text-muted mt-1 text-xs">
                Tarih, firma ve sekme seçimini kullanarak tüm metrikleri, grafikleri ve Excel çıktısını daraltın.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  ["all", "Tüm zamanlar"],
                  ["month", "Bu ay"],
                  ["last30", "Son 30 gün"],
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
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Firma">
                <Select
                  aria-label="Rapor firması"
                  className="h-10 w-full sm:w-56"
                  onChange={(event) => setSelectedCompanyId(event.target.value)}
                  value={selectedCompanyId}
                >
                  <option value="Tümü">Tüm firmalar</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </Select>
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
              {hasDateFilter && (
                <Button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setDatePreset("all");
                  }}
                  size="sm"
                  variant="danger"
                >
                  <RotateCcw /> Temizle
                </Button>
              )}
            </div>
          </div>
          {hasDateFilter && (
            <div className="border-divider mt-4 flex flex-wrap items-center gap-2 border-t pt-3 text-xs">
              <span className="text-muted">Aktif aralık:</span>
              <CountPill>{dateFrom || "Başlangıç yok"}</CountPill>
              <span className="text-subtle">→</span>
              <CountPill>{dateTo || "Bitiş yok"}</CountPill>
            </div>
          )}
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
      <div className="border-border bg-card-muted/45 mt-5 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconBadge icon={currentTab.icon} size="md" />
          <div className="min-w-0">
            <p className="text-heading truncate text-lg font-semibold">{currentTab.label}</p>
            <p className="text-muted mt-1 text-xs">Güncel kayıtlar üzerinden hesaplanan analizler.</p>
          </div>
        </div>
        <CountPill>{tab === "overview" ? "Özet rapor" : `${currentTab.label} raporu`}</CountPill>
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
        <OperationsTab companies={reportCompanies} equipment={reportEquipment} screenings={reportScreenings} team={team} />
      )}
      {tab === "offers" && <OffersTab offers={reportOffers} stats={offerStats} />}
      {tab === "screenings" && <ScreeningsTab screenings={reportScreenings} stats={screeningStats} />}
      {tab === "companies" && <CompaniesTab companies={reportCompanies} />}
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
            title="Finansal görünüm"
            description="Teklif havuzunun hacmi ve kazanılan değer."
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
            title="Operasyon sağlığı"
            description="Dikkat gerektiren kayıtları hızlıca görün."
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
        <ChartCard title="Tarama durum dağılımı" description="Planlanan saha operasyonlarının güncel durumu.">
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
        </ChartCard>
        <ChartCard title="Teklif dönüş dağılımı" description="Tekliflerin durumlara göre dağılımı.">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie data={offerStats} dataKey="value" innerRadius={62} nameKey="name" outerRadius={92} paddingAngle={3}>
                {offerStats.map((entry, index) => (
                  <Cell fill={offerColors[index % offerColors.length]} key={entry.name} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 text-[10px]">
            {offerStats.map((entry, index) => (
              <span className="text-muted inline-flex items-center gap-1" key={entry.name}>
                <i className="size-2 rounded-full" style={{ background: offerColors[index % offerColors.length] }} />
                {entry.name} ({entry.value})
              </span>
            ))}
          </div>
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
  screenings,
  team,
}: {
  companies: Company[];
  equipment: Equipment[];
  screenings: Screening[];
  team: TeamMember[];
}) {
  const statusRows = screeningStatuses.map((status) => ({ status, count: screenings.filter((item) => item.status === status).length })).filter((row) => row.count > 0);
  const companyRows = companies.map((company) => {
    const rows = screenings.filter((screening) => screening.companyId === company.id);
    return { company, count: rows.length, participants: rows.reduce((sum, item) => sum + item.participants, 0), completed: rows.reduce((sum, item) => sum + item.completed, 0) };
  }).filter((row) => row.count > 0).sort((a, b) => b.count - a.count);
  const teamRows = team.map((member) => {
    const rows = screenings.filter((screening) => screening.teamMembers?.includes(member.name) || screening.team.includes(member.name));
    return { member, total: rows.length, open: rows.filter((item) => !["Tamamlandı", "İptal"].includes(item.status)).length, done: rows.filter((item) => item.status === "Tamamlandı").length };
  }).filter((row) => row.total > 0).sort((a, b) => b.total - a.total);
  const calibrationDue = equipment.filter((item) => item.status === "Kalibrasyon bekliyor" || item.status === "Bakımda").length;
  const openScreenings = screenings.filter((item) => !["Tamamlandı", "İptal"].includes(item.status)).length;
  const participants = screenings.reduce((sum, item) => sum + item.participants, 0);
  const completed = screenings.reduce((sum, item) => sum + item.completed, 0);

  return <>
    <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard icon={ClipboardList} label="Filtrelenen tarama" value={screenings.length} />
      <SummaryCard icon={UsersRound} label="Katılımcı kapasitesi" value={participants} />
      <SummaryCard icon={CheckCircle2} label="Tamamlanan kişi" value={completed} />
      <SummaryCard icon={Clock3} label="Açık saha işi" value={openScreenings} />
    </section>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-5"><CardHeader description="Seçili tarih ve firma filtresindeki tarama durumları." icon={ClipboardCheck} title="Operasyon durumu" /><div className="mt-5 space-y-4">{statusRows.length === 0 ? <EmptyState className="py-8" description="Seçili filtrede tarama bulunmuyor." icon={ClipboardList} title="Veri yok" /> : statusRows.map((row) => <div key={row.status}><div className="flex items-center justify-between gap-3"><Badge tone={screeningTone(row.status)}>{row.status}</Badge><span className="text-xs font-semibold text-heading">{row.count} kayıt · %{percentage(row.count, screenings.length)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-card-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${percentage(row.count, screenings.length)}%` }} /></div></div>)}</div></Card>
      <Card className="p-5"><CardHeader description="Tarama kayıtlarında görünen ekip dağılımı." icon={UsersRound} title="Ekip yükü" /><div className="mt-5 space-y-3">{teamRows.length === 0 ? <p className="rounded-xl bg-card-muted p-5 text-center text-xs text-muted">Ekip verisi bulunmuyor.</p> : teamRows.map((row) => <div className="rounded-xl border border-border bg-card-muted p-3" key={row.member.id}><div className="flex items-center justify-between gap-3"><p className="truncate text-xs font-semibold text-foreground">{row.member.name}</p><span className="text-xs font-bold text-brand">{row.total} tarama</span></div><div className="mt-2 flex gap-3 text-[11px] text-muted"><span>{row.open} açık</span><span>{row.done} tamamlandı</span></div></div>)}</div></Card>
    </div>
    <Card className="mt-5 overflow-hidden"><CardHeader className="p-5" description="Firma bazında saha hacmi ve katılımcı tamamlanma oranı." title="Firma performansı" /><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead className="border-y border-divider bg-card-muted"><tr><th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-subtle">Firma</th><th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-subtle">Tarama</th><th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-subtle">Katılımcı</th><th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-subtle">Tamamlanma</th></tr></thead><tbody className="divide-y divide-divider">{companyRows.map((row) => { const completion = percentage(row.completed, row.participants); return <tr className="hover:bg-card-muted" key={row.company.id}><td className="px-5 py-3 font-semibold text-foreground">{row.company.name}</td><td className="px-5 py-3 text-muted">{row.count}</td><td className="px-5 py-3 text-muted">{row.participants}</td><td className="px-5 py-3"><div className="flex items-center gap-3"><Progress value={completion} /><span className="w-9 text-right font-semibold text-heading">{completion}%</span></div></td></tr>; })}</tbody></table>{companyRows.length === 0 && <p className="p-8 text-center text-xs text-muted">Firma verisi bulunmuyor.</p>}</div></Card>
    <Card className="mt-5 p-5"><CardHeader description="Operasyon yöneticisinin hızlıca aksiyon alması gereken kayıtlar." icon={ShieldAlert} title="Takip merkezi" /><div className="mt-4 grid gap-3 sm:grid-cols-3"><AttentionTile icon={Clock3} label="Açık saha işi" value={openScreenings} tone="info" /><AttentionTile icon={Gauge} label="Bakım / kalibrasyon" value={calibrationDue} tone="warning" /><AttentionTile icon={CheckCircle2} label="Tamamlanma oranı" value={`${percentage(completed, participants)}%`} tone="brand" /></div></Card>
  </>;
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

function ScreeningsTab({
  screenings,
  stats,
}: {
  screenings: Screening[];
  stats: Array<{ name: ScreeningStatus; value: number }>;
}) {
  return (
    <>
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
          : "neutral";
}

function CompaniesTab({ companies }: { companies: Company[] }) {
  return (
    <>
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
