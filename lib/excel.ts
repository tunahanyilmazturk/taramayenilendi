export type ExcelColumn<T> = {
  header: string;
  width?: number;
  value: (item: T) => unknown;
};

export type ExcelContext = [string, string][];

/** Creates a compact, filterable workbook for a frontend list export. */
export async function exportListToExcel<T>({
  columns,
  context = [],
  filename,
  items,
  sheetName,
  title,
}: {
  columns: ExcelColumn<T>[];
  context?: ExcelContext;
  filename: string;
  items: T[];
  sheetName: string;
  title: string;
}) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  const columnCount = columns.length;
  const titleRow = worksheet.addRow([title]);
  worksheet.mergeCells(1, 1, 1, columnCount);
  titleRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };
  titleRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF155E75" } };
  titleRow.alignment = { vertical: "middle" };
  titleRow.height = 26;

  const metaRow = worksheet.addRow([`HanTech OSGB · Aktarım tarihi: ${new Date().toLocaleDateString("tr-TR")} · ${items.length} kayıt`]);
  worksheet.mergeCells(2, 1, 2, columnCount);
  metaRow.font = { italic: true, color: { argb: "FF526B7A" }, size: 10 };

  let rowIndex = 3;
  if (context.length > 0) {
    context.forEach(([label, value]) => {
      const row = worksheet.addRow([label, value]);
      row.getCell(1).font = { bold: true, color: { argb: "FF526B7A" }, size: 10 };
      row.getCell(2).font = { color: { argb: "FF263746" }, size: 10 };
      if (columnCount > 2) worksheet.mergeCells(rowIndex, 2, rowIndex, columnCount);
      rowIndex += 1;
    });
  }

  const headerRow = worksheet.addRow(columns.map((column) => column.header));
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334E68" } };
  headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  headerRow.height = 28;

  items.forEach((item) => worksheet.addRow(columns.map((column) => column.value(item))));

  const dataStart = rowIndex + 1;
  const dataEnd = dataStart + items.length;
  if (items.length > 0) {
    worksheet.autoFilter = { from: { row: rowIndex, column: 1 }, to: { row: dataEnd - 1, column: columnCount } };
    worksheet.views = [{ state: "frozen", ySplit: rowIndex }];
    worksheet.getRows(dataStart, items.length)?.forEach((row: { alignment: object }) => {
      row.alignment = { vertical: "middle", wrapText: false };
    });
  }
  worksheet.columns = columns.map((column) => ({ header: column.header, key: column.header, width: column.width ?? 18 }));
  worksheet.getColumn(1).width = Math.max(14, worksheet.getColumn(1).width ?? 14);
  worksheet.eachRow((row: { eachCell: (callback: (cell: { border: object }) => void) => void }) => {
    row.eachCell((cell) => {
      cell.border = { bottom: { style: "hair", color: { argb: "FFD9E2EC" } } };
    });
  });
  worksheet.pageSetup.orientation = "landscape";
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToPage = true;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
