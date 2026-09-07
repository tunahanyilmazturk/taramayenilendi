import { resultTone } from "@/lib/result-tone";

function columnLetter(index: number) {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

export async function exportResultsExcel(columns: string[], rows: string[][]) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HanTech OSGB";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("Sonuçlar", {
    views: [{ state: "frozen", ySplit: 1, xSplit: 1, showGridLines: true }],
  });
  const exportColumns = columns.length ? columns : ["Sonuçlar"];
  worksheet.columns = exportColumns.map((header, index) => ({
    header: header || `Sütun ${String.fromCharCode(65 + index)}`,
    key: `column-${index}`,
    width: Math.max(14, Math.min(34, (header || "").length + 5)),
  }));
  const dataRows = rows.filter((row) => row.some((cell) => cell.trim()));
  const header = worksheet.getRow(1);
  header.height = 24;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF256DA8" } };
  header.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  header.border = { bottom: { style: "medium", color: { argb: "FF174A73" } } };
  worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Math.max(exportColumns.length, 1) } };
  worksheet.addTable({ name: "SonucTablosu", ref: `A1:${columnLetter(exportColumns.length - 1)}${Math.max(dataRows.length + 1, 2)}`, headerRow: true, totalsRow: false, style: { theme: "TableStyleMedium2", showRowStripes: true, showColumnStripes: false }, columns: exportColumns.map((header, index) => ({ name: header || `Sütun ${index + 1}` })), rows: dataRows.map((row) => exportColumns.map((_, index) => row[index] ?? "")) });
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: "middle", wrapText: true };
    row.eachCell((cell, columnNumber) => {
      const tone = rowNumber > 1 ? resultTone(columns[columnNumber - 1] ?? "", String(cell.value ?? "")) : "neutral";
      if (tone === "normal") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF7EF" } };
        cell.font = { color: { argb: "FF18794E" } };
      } else if (tone === "attention") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFECEB" } };
        cell.font = { color: { argb: "FFB42318" } };
      }
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFDCE3EA" } },
        right: { style: "thin", color: { argb: "FFDCE3EA" } },
      };
    });
  });
  worksheet.eachRow((row, rowNumber) => {
    row.height = rowNumber === 1 ? 30 : 24;
  });
  worksheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
  worksheet.pageSetup.printTitlesRow = "1:1";
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `sonuclar-${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
