import type { TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import QRCode from "qrcode";
import type { Organization } from "@/lib/data";
import type { Screening } from "@/lib/demo-data";
import { money } from "@/lib/format";
import { resolvePdfBrandColor } from "@/lib/pdf/colors";

type PdfMakeBrowser = typeof import("pdfmake/build/pdfmake");
type CompanyInfo = {
  name: string;
  sector: string;
  city: string;
  district: string;
  contact: string;
  email: string;
  phone: string;
  employees: number;
};
type ScreeningLine = { testId: number; name: string; category: string; quantity: number; unitPrice: number };

const safeText = (value: string | number | undefined | null) => String(value ?? "").trim() || "Belirtilmedi";
const bodyLines = (value: string | undefined) =>
  (value || "Belirtilmedi").split(/\r?\n/).map((line) => ({ text: line || " ", style: "body" }));
const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLocaleLowerCase("en-US");

async function buildScreeningPdf(
  screening: Screening,
  organization: Organization,
  company: CompanyInfo | undefined,
  lines: ScreeningLine[],
) {
  const pdfMakeModule = (await import("pdfmake/build/pdfmake")) as PdfMakeBrowser & { default?: PdfMakeBrowser };
  const fontsModule = (await import("pdfmake/build/vfs_fonts")) as { default?: Record<string, string> } & Record<
    string,
    string
  >;
  const pdfMake = pdfMakeModule.default ?? pdfMakeModule;
  pdfMake.addVirtualFileSystem(fontsModule.default ?? fontsModule);

  const primaryColor = resolvePdfBrandColor(organization.primaryColor, "#256da8");
  const secondaryColor = resolvePdfBrandColor(organization.secondaryColor, "#123d56");
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const discount = Math.min(Number(screening.discount) || 0, subtotal);
  const net = subtotal - discount;
  const taxRate = Number(screening.tax) || 0;
  const taxAmount = Math.round((net * taxRate) / 100);
  const total = net + taxAmount;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/taramalar/${screening.id}`
      : `https://app.hantech.local/taramalar/${screening.id}`;
  const qrDataUrl = await QRCode.toDataURL(shareUrl, {
    margin: 1,
    width: 112,
    color: { dark: secondaryColor, light: "#ffffff" },
  });
  const pricingRows: TableCell[][] = [
    [{ text: "FİYAT ÖZETİ", colSpan: 2, style: "pricingHeader" }, ""],
    [
      { text: "Ara toplam", style: "pricingLabel" },
      { text: money(subtotal), style: "pricingValue", alignment: "right" },
    ],
    ...(discount > 0
      ? [
          [
            { text: "İndirim", style: "pricingLabel" },
            { text: `-${money(discount)}`, style: "pricingValue", alignment: "right" },
          ] as TableCell[],
        ]
      : []),
    ...(taxRate > 0
      ? [
          [
            { text: `KDV (%${taxRate})`, style: "pricingLabel" },
            { text: money(taxAmount), style: "pricingValue", alignment: "right" },
          ] as TableCell[],
        ]
      : []),
    [
      { text: "GENEL TOPLAM", style: "grandLabel" },
      { text: money(total), style: "grandTotal", alignment: "right" },
    ],
  ];
  const companyAddress = company ? [company.district, company.city].filter(Boolean).join(", ") : "";
  const organizationAddress = [organization.address, organization.district, organization.city]
    .filter(Boolean)
    .join(", ");
  const showPrice = screening.showPriceOnPdf !== false;
  const conditionText = screening.conditions?.trim() || "";
  const longConditions = conditionText.length > 900 || conditionText.split(/\r?\n/).length > 8;
  const conditionsBlock = conditionText
    ? [
        {
          text: "Şartlar ve koşullar",
          style: "sectionTitle",
          pageBreak: longConditions ? ("before" as const) : undefined,
        },
        ...bodyLines(conditionText),
      ]
    : [];
  const serviceRows: TableCell[][] = showPrice
    ? [
        [
          { text: "NO", style: "tableHeader", alignment: "center" },
          { text: "TEST / HİZMET", style: "tableHeader" },
          { text: "KATEGORİ", style: "tableHeader" },
          { text: "ADET", style: "tableHeader", alignment: "right" },
          { text: "TUTAR", style: "tableHeader", alignment: "right" },
        ],
        ...lines.map<TableCell[]>((line, index) => [
          {
            text: String(index + 1).padStart(2, "0"),
            style: index % 2 ? "serviceNumberAlt" : "serviceNumber",
            alignment: "center",
          },
          { text: line.name, style: index % 2 ? "serviceCellAlt" : "serviceCell" },
          { text: line.category, style: index % 2 ? "serviceCellAlt" : "serviceCell" },
          { text: String(line.quantity), style: index % 2 ? "serviceCellAlt" : "serviceCell", alignment: "right" },
          {
            text: money(line.quantity * line.unitPrice),
            style: index % 2 ? "serviceAmountAlt" : "serviceAmount",
            alignment: "right",
          },
        ]),
        [
          { text: "HİZMETLER ARA TOPLAMI", colSpan: 4, alignment: "right", style: "tableTotal" },
          {},
          {},
          {},
          { text: money(subtotal), style: "tableTotal", alignment: "right" },
        ],
      ]
    : [
        [
          { text: "NO", style: "tableHeader", alignment: "center" },
          { text: "TEST / HİZMET", style: "tableHeader" },
          { text: "KATEGORİ", style: "tableHeader" },
          { text: "ADET", style: "tableHeader", alignment: "right" },
        ],
        ...lines.map<TableCell[]>((line, index) => [
          {
            text: String(index + 1).padStart(2, "0"),
            style: index % 2 ? "serviceNumberAlt" : "serviceNumber",
            alignment: "center",
          },
          { text: line.name, style: index % 2 ? "serviceCellAlt" : "serviceCell" },
          { text: line.category, style: index % 2 ? "serviceCellAlt" : "serviceCell" },
          { text: String(line.quantity), style: index % 2 ? "serviceCellAlt" : "serviceCell", alignment: "right" },
        ]),
      ];

  const document: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [42, 44, 42, 48],
    header: {
      margin: [42, 24, 42, 0],
      columns: [
        { text: organization.shortName || organization.title, style: "brand" },
        { text: "TARAMA PLANI", alignment: "right", style: "headerMeta" },
      ],
    },
    footer: (currentPage, pageCount) => ({
      margin: [42, 0, 42, 22],
      columns: [
        {
          stack: [
            { text: organization.title, style: "footerBrand" },
            { text: "Sağlıklı çalışma, güvenli yarınlar.", style: "footer" },
          ],
        },
        { text: `${currentPage} / ${pageCount}`, alignment: "right", style: "footer" },
      ],
    }),
    content: [
      {
        table: {
          widths: ["*", 205],
          body: [
            [
              {
                columns: [
                  ...(organization.logoDataUrl
                    ? [
                        {
                          image: organization.logoDataUrl,
                          width: 34,
                          height: 34,
                          margin: [0, 0, 10, 0] as [number, number, number, number],
                        },
                      ]
                    : []),
                  {
                    stack: [
                      { text: safeText(organization.title), style: "institutionTitle" },
                      ...(organization.shortName
                        ? [{ text: organization.shortName, style: "institutionShortName" }]
                        : []),
                    ],
                  },
                ],
                style: "institutionHeaderCell",
              },
              {
                stack: [
                  { text: organizationAddress || "Adres bilgisi belirtilmedi", style: "institutionMeta" },
                  {
                    text: `${safeText(organization.phone)}  ·  ${safeText(organization.email)}`,
                    style: "institutionMeta",
                  },
                  ...(organization.taxNumber
                    ? [{ text: `Vergi No: ${organization.taxNumber}`, style: "institutionMeta" }]
                    : []),
                  ...(organization.licenseNumber
                    ? [{ text: `Yetki Belge No: ${organization.licenseNumber}`, style: "institutionMeta" }]
                    : []),
                ],
                alignment: "right",
                style: "institutionHeaderCell",
              },
            ],
          ],
        },
        layout: "noBorders",
      },
      {
        table: {
          widths: ["*", 118],
          body: [
            [
              {
                stack: [
                  { text: "SAHA OPERASYONU", style: "heroEyebrow" },
                  { text: screening.title, style: "heroTitle" },
                  {
                    text: `${screening.screeningType || "Mobil sağlık taraması"} · ${screening.date}`,
                    style: "heroMeta",
                  },
                ],
                fillColor: secondaryColor,
                margin: [18, 18, 12, 18],
              },
              {
                stack: [
                  { text: "DURUM", style: "heroLabel" },
                  { text: screening.status.toUpperCase(), style: "heroStatus" },
                  { text: `TARAMA #${screening.id}`, style: "heroMeta" },
                ],
                fillColor: primaryColor,
                margin: [12, 18, 18, 18],
              },
            ],
          ],
        },
        layout: "noBorders",
      },
      {
        margin: [0, 14, 0, 0],
        columns: [
          {
            width: "*",
            stack: [
              { text: "FİRMA", style: "sectionLabel" },
              { text: screening.company, style: "sectionValue" },
              ...(companyAddress ? [{ text: companyAddress, style: "muted" }] : []),
              ...(company?.phone ? [{ text: company.phone, style: "muted" }] : []),
              ...(company?.email ? [{ text: company.email, style: "muted" }] : []),
            ],
          },
          {
            width: 180,
            stack: [
              { text: "SAHA ZAMANI", style: "sectionLabel" },
              { text: screening.date, style: "sectionValue" },
              { text: `${screening.time}${screening.endTime ? ` – ${screening.endTime}` : ""}`, style: "muted" },
              { text: `Konum: ${safeText(screening.location)}`, style: "muted" },
            ],
          },
        ],
        style: "infoBox",
      },
      {
        margin: [0, 12, 0, 0],
        table: {
          widths: ["*", "*"],
          body: [
            [
              {
                stack: [
                  { text: "KATILIMCI", style: "metricLabel" },
                  { text: `${screening.participants} kişi`, style: "metricValue" },
                ],
                style: "metricCell",
              },
              {
                stack: [
                  { text: "HİZMET KALEMİ", style: "metricLabel" },
                  { text: `${lines.length} kalem`, style: "metricValue" },
                ],
                style: "metricCell",
              },
            ],
          ],
        },
        layout: "noBorders",
      },
      ...(screening.coverLetter
        ? [{ text: "Ön yazı", style: "sectionTitle" }, ...bodyLines(screening.coverLetter)]
        : []),
      ...conditionsBlock,
      {
        pageBreak: "before",
        stack: [
          { text: "SAHA OPERASYONU", style: "pageEyebrow" },
          { text: "Hizmet kapsamı ve saha planı", style: "pageTitle" },
          { text: `${screening.company} için hazırlanan tarama hizmetleri`, style: "pageSubtitle" },
        ],
        style: "serviceHero",
      },
      {
        table: {
          headerRows: 1,
          widths: showPrice ? [30, "*", 78, 62, 78] : [30, "*", 110, 62],
          body: serviceRows,
        },
        layout: {
          hLineColor: () => "#d6e2ec",
          hLineWidth: (lineIndex: number) => (lineIndex === 1 ? 1.5 : 0.7),
          vLineWidth: () => 0,
          paddingTop: () => 8,
          paddingBottom: () => 8,
          paddingLeft: () => 9,
          paddingRight: () => 9,
        },
      },
      {
        margin: [0, 16, 0, 0],
        columns: [
          {
            width: "*",
            stack: [
              { text: "SAHA KAYNAKLARI", style: "sectionLabel" },
              { text: "Tarama sırasında kullanılacak ekipman bilgileri", style: "muted" },
              { text: `Mobil araç: ${safeText(screening.vehicle)}`, style: "resourceValue" },
            ],
            style: "resourceBox",
          },
          ...(showPrice
            ? [
                {
                  width: 215,
                  table: { widths: ["*", 88], body: pricingRows },
                  layout: {
                    hLineColor: () => "#d6e2ec",
                    hLineWidth: (row: number) => (row === 1 || row === pricingRows.length - 1 ? 1 : 0.5),
                    vLineWidth: () => 0,
                    paddingTop: (row: number) => (row === 0 ? 9 : 6),
                    paddingBottom: (row: number) => (row === 0 ? 9 : 6),
                    paddingLeft: () => 11,
                    paddingRight: () => 11,
                    fillColor: (row: number) =>
                      row === 0 ? primaryColor : row === pricingRows.length - 1 ? "#e8f0f8" : "#ffffff",
                  },
                },
              ]
            : []),
        ],
      },
      {
        margin: [0, 18, 0, 0],
        columns: [
          {
            width: "*",
            stack: [
              { text: "OPERASYON NOTU", style: "sectionLabel" },
              { text: safeText(screening.notes), style: "muted" },
            ],
            style: "noteBox",
          },
          {
            width: 126,
            stack: [
              { image: qrDataUrl, width: 72, height: 72, alignment: "center" },
              ...(organization.stampDataUrl
                ? [
                    {
                      image: organization.stampDataUrl,
                      width: 82,
                      height: 40,
                      alignment: "center" as const,
                      margin: [0, 5, 0, 0] as [number, number, number, number],
                    },
                  ]
                : []),
              { text: "Tarama detayını görüntüle", style: "qrLabel", alignment: "center" },
            ],
            style: "qrBox",
          },
        ],
      },
    ],
    defaultStyle: { font: "Roboto" },
    styles: {
      brand: { color: primaryColor, fontSize: 11, bold: true },
      headerMeta: { color: "#66798b", fontSize: 8, bold: true },
      footer: { color: "#8999a8", fontSize: 7 },
      footerBrand: { color: primaryColor, fontSize: 7.5, bold: true, margin: [0, 0, 0, 2] },
      institutionHeaderCell: { fillColor: "#f1f5f8", margin: [14, 10, 14, 10] },
      institutionTitle: { color: "#123d56", fontSize: 13, bold: true },
      institutionShortName: { color: primaryColor, fontSize: 8, bold: true, margin: [0, 3, 0, 0], characterSpacing: 1 },
      institutionMeta: { color: "#66798b", fontSize: 7.5, lineHeight: 1.3 },
      heroEyebrow: { color: "#78b9e8", fontSize: 8, bold: true, characterSpacing: 1.5 },
      heroTitle: { color: "#ffffff", fontSize: 17, bold: true, margin: [0, 6, 0, 5] },
      heroMeta: { color: "#c9ddec", fontSize: 8 },
      heroLabel: { color: "#dceeff", fontSize: 7, bold: true, characterSpacing: 1 },
      heroStatus: { color: "#ffffff", fontSize: 12, bold: true, margin: [0, 7, 0, 7] },
      infoBox: { fillColor: "#f1f5f8", margin: [12, 12, 12, 12] },
      sectionLabel: { color: "#8999a8", fontSize: 7, bold: true, characterSpacing: 1 },
      sectionValue: { color: "#123d56", fontSize: 10, bold: true, margin: [0, 3, 0, 3] },
      sectionTitle: { color: "#123d56", fontSize: 13, bold: true, margin: [0, 20, 0, 8] },
      muted: { color: "#66798b", fontSize: 9, lineHeight: 1.35 },
      body: { color: "#38546c", fontSize: 9, lineHeight: 1.4 },
      metricCell: { fillColor: "#e8f0f8", margin: [12, 10, 12, 10] },
      metricLabel: { color: "#66798b", fontSize: 7, bold: true, characterSpacing: 0.8 },
      metricValue: { color: "#123d56", fontSize: 11, bold: true, margin: [0, 4, 0, 0] },
      pageEyebrow: { color: primaryColor, fontSize: 8, bold: true, characterSpacing: 1.5 },
      pageTitle: { color: "#123d56", fontSize: 19, bold: true, margin: [0, 4, 0, 3] },
      pageSubtitle: { color: "#66798b", fontSize: 8.5 },
      serviceHero: { fillColor: "#e8f0f8", margin: [14, 14, 14, 14] },
      tableHeader: { color: "#ffffff", fontSize: 7.5, bold: true, characterSpacing: 0.7 },
      serviceCell: { color: "#38546c", fontSize: 8.5, fillColor: "#ffffff" },
      serviceCellAlt: { color: "#38546c", fontSize: 8.5, fillColor: "#f1f5f8" },
      serviceNumber: { color: primaryColor, fontSize: 8, bold: true, fillColor: "#ffffff" },
      serviceNumberAlt: { color: primaryColor, fontSize: 8, bold: true, fillColor: "#f1f5f8" },
      serviceAmount: { color: "#123d56", fontSize: 8.5, bold: true, fillColor: "#ffffff" },
      serviceAmountAlt: { color: "#123d56", fontSize: 8.5, bold: true, fillColor: "#f1f5f8" },
      tableTotal: { color: "#123d56", bold: true, fontSize: 9 },
      resourceBox: { fillColor: "#f1f5f8", margin: [12, 12, 12, 12] },
      resourceValue: { color: "#123d56", fontSize: 9, bold: true, margin: [0, 8, 0, 0] },
      pricingHeader: { color: "#ffffff", fontSize: 8, bold: true, characterSpacing: 1 },
      pricingLabel: { color: "#66798b", fontSize: 8.5 },
      pricingValue: { color: "#38546c", fontSize: 8.5, bold: true },
      grandLabel: { color: "#123d56", bold: true, fontSize: 9 },
      grandTotal: { color: primaryColor, bold: true, fontSize: 12 },
      noteBox: { fillColor: "#fff8e7", margin: [12, 12, 12, 12] },
      qrBox: { fillColor: "#e8f0f8", margin: [10, 10, 10, 10] },
      qrLabel: { color: secondaryColor, fontSize: 6.5, lineHeight: 1.2, margin: [0, 4, 0, 0] },
    },
  };
  return { pdfMake, document, fileName: `${slug(screening.company)}_${slug(screening.title)}_tarama-plani.pdf` };
}

export async function downloadScreeningPdf(
  screening: Screening,
  organization: Organization,
  company: CompanyInfo | undefined,
  lines: ScreeningLine[],
) {
  const { pdfMake, document, fileName } = await buildScreeningPdf(screening, organization, company, lines);
  pdfMake.createPdf(document).download(fileName);
}

export async function previewScreeningPdf(
  screening: Screening,
  organization: Organization,
  company: CompanyInfo | undefined,
  lines: ScreeningLine[],
) {
  const previewWindow = window.open("about:blank", "_blank");
  if (!previewWindow) throw new Error("PDF önizleme sekmesi açılamadı.");
  const { pdfMake, document } = await buildScreeningPdf(screening, organization, company, lines);
  const blob = await pdfMake.createPdf(document).getBlob();
  const previewUrl = URL.createObjectURL(blob);
  previewWindow.location.href = previewUrl;
  window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000);
}
