import type { TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import type { Organization } from "@/lib/data";
import type { Offer } from "@/lib/demo-data";
import { money } from "@/lib/format";
import QRCode from "qrcode";
import { resolvePdfBrandColor } from "@/lib/pdf/colors";

type PdfMakeBrowser = typeof import("pdfmake/build/pdfmake");

function safeText(value: string | number | undefined | null) {
  return String(value ?? "").trim() || "Belirtilmedi";
}

function splitLines(value: string) {
  return value.split(/\r?\n/).map((line) => ({ text: line || " ", style: "body" }));
}

async function buildOfferPdf(
  offer: Offer,
  organization: Organization,
  company?: {
    name: string;
    email: string;
    phone: string;
    employees?: number;
    address?: string;
    city?: string;
    district?: string;
  },
) {
  const pdfMakeModule = (await import("pdfmake/build/pdfmake")) as PdfMakeBrowser & { default?: PdfMakeBrowser };
  const fontsModule = (await import("pdfmake/build/vfs_fonts")) as { default?: Record<string, string> } & Record<
    string,
    string
  >;
  const pdfMake = pdfMakeModule.default ?? pdfMakeModule;
  pdfMake.addVirtualFileSystem(fontsModule.default ?? fontsModule);

  const lines = offer.lines ?? [];
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) || offer.total;
  const discount = Math.min(offer.discount ?? 0, subtotal);
  const net = subtotal - discount;
  const taxRate = offer.tax ?? 0;
  const taxAmount = Math.round((net * taxRate) / 100);
  const total = net + taxAmount;
  const companyAddress = [company?.address, company?.district, company?.city].filter(Boolean).join(", ");
  const primaryColor = resolvePdfBrandColor(organization.primaryColor, "#256da8");
  const secondaryColor = resolvePdfBrandColor(organization.secondaryColor, "#123d56");
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/teklif-yanit/${offer.id}?paylas=${encodeURIComponent(offer.shareToken || String(offer.id))}`
      : `https://app.hantech.local/teklifler/${offer.id}`;
  const qrDataUrl = await QRCode.toDataURL(shareUrl, {
    margin: 1,
    width: 96,
    color: { dark: secondaryColor, light: "#ffffff" },
  });
  const fileSlug = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i")
      .replace(/İ/g, "I")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLocaleLowerCase("en-US");
  const pricingRows: TableCell[][] = [
    [{ text: "FİYAT ÖZETİ", colSpan: 2, style: "pricingHeader" }, ""],
    [
      { text: "Ara toplam", style: "pricingLabel" },
      { text: money(subtotal), style: "pricingValue", alignment: "right" as const },
    ],
    ...(discount > 0
      ? [
          [
            { text: "İndirim", style: "pricingLabel" },
            { text: `-${money(discount)}`, style: "pricingValue", alignment: "right" as const },
          ] as TableCell[],
        ]
      : []),
    ...(taxRate > 0
      ? [
          [
            { text: `KDV (%${taxRate})`, style: "pricingLabel" },
            { text: money(taxAmount), style: "pricingValue", alignment: "right" as const },
          ] as TableCell[],
        ]
      : []),
    [
      { text: "GENEL TOPLAM", style: "grandLabel" },
      { text: money(total), style: "grandTotal", alignment: "right" as const },
    ],
  ];

  const document: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [42, 44, 42, 48],
    header: (currentPage) => ({
      margin: [42, 24, 42, 0],
      columns: [
        { text: organization.shortName || organization.title, style: "brand" },
        { text: `TEKLİF · ${offer.number}`, alignment: "right", style: "headerMeta" },
      ],
    }),
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
                          width: 32,
                          height: 32,
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
                  {
                    text:
                      [organization.address, organization.district, organization.city].filter(Boolean).join(", ") ||
                      "Adres bilgisi belirtilmedi",
                    style: "institutionMeta",
                  },
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
                  { text: "HİZMET TEKLİFİ", style: "heroEyebrow" },
                  { text: offer.title, style: "heroTitle" },
                  { text: `${offer.offerType ?? "OSGB hizmetleri"} · ${offer.createdAt}`, style: "heroMeta" },
                ],
                fillColor: secondaryColor,
                margin: [18, 18, 12, 18],
              },
              {
                stack: [
                  { text: "DURUM", style: "heroLabel" },
                  { text: offer.status.toUpperCase(), style: "heroStatus" },
                  { text: offer.number, style: "heroMeta" },
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
              { text: "TEKLİF ALANI", style: "sectionLabel" },
              { text: offer.company, style: "sectionValue" },
              ...(companyAddress ? [{ text: companyAddress, style: "muted" }] : []),
              ...(company?.phone ? [{ text: company.phone, style: "muted" }] : []),
              ...(company?.email ? [{ text: company.email, style: "muted" }] : []),
            ],
          },
          {
            width: 180,
            stack: [
              { text: "GEÇERLİLİK", style: "sectionLabel" },
              { text: offer.validUntil, style: "sectionValue" },
              { text: `Yetkili: ${safeText(offer.contact)}`, style: "muted" },
            ],
          },
        ],
        style: "infoBox",
      },
      {
        margin: [0, 12, 0, 0],
        table: {
          widths: ["*", "*", "*"],
          body: [
            [
              {
                stack: [
                  { text: "ÇALIŞAN SAYISI", style: "metricLabel" },
                  { text: `${company?.employees ? company.employees : "-"} kişi`, style: "metricValue" },
                ],
                style: "metricCell",
              },
              {
                stack: [
                  { text: "HİZMET KALEMİ", style: "metricLabel" },
                  { text: `${lines.length || offer.items} kalem`, style: "metricValue" },
                ],
                style: "metricCell",
              },
              {
                stack: [
                  { text: "TESLİM SÜRESİ", style: "metricLabel" },
                  { text: offer.deliveryDays ? `${offer.deliveryDays} iş günü` : "Belirtilmedi", style: "metricValue" },
                ],
                style: "metricCell",
              },
            ],
          ],
        },
        layout: "noBorders",
      },
      ...(offer.notes
        ? [
            { text: "Teklif notu", style: "sectionTitle" },
            { text: offer.notes, style: "noteBox" },
          ]
        : []),
      ...(offer.coverLetterText
        ? [{ text: "Ön yazı", style: "sectionTitle" }, ...splitLines(offer.coverLetterText)]
        : []),
      ...(offer.conditionsText
        ? [{ text: "Şartlar ve koşullar", style: "sectionTitle" }, ...splitLines(offer.conditionsText)]
        : []),
      {
        pageBreak: "before",
        stack: [
          { text: "HİZMET VE FİYAT ÖZETİ", style: "pageEyebrow" },
          { text: "Hizmet kapsamı", style: "pageTitle" },
          { text: `${offer.company} için hazırlanan hizmet kalemleri ve fiyatlandırma`, style: "pageSubtitle" },
        ],
        style: "serviceHero",
      },
      {
        table: {
          headerRows: 1,
          widths: [30, "*", 58, 72, 82],
          body: [
            [
              { text: "NO", style: "tableHeader", alignment: "center" as const },
              { text: "HİZMET KALEMİ", style: "tableHeader" },
              { text: "ADET", style: "tableHeader", alignment: "center" as const },
              { text: "BİRİM", style: "tableHeader", alignment: "right" as const },
              { text: "TUTAR", style: "tableHeader", alignment: "right" as const },
            ],
            ...lines.map((line, index) => [
              {
                text: String(index + 1).padStart(2, "0"),
                style: index % 2 ? "serviceNumberAlt" : "serviceNumber",
                alignment: "center" as const,
              },
              { text: line.name, style: index % 2 ? "serviceCellAlt" : "serviceCell" },
              {
                text: String(line.quantity),
                style: index % 2 ? "serviceCellAlt" : "serviceCell",
                alignment: "center" as const,
              },
              {
                text: money(line.unitPrice),
                style: index % 2 ? "serviceCellAlt" : "serviceCell",
                alignment: "right" as const,
              },
              {
                text: money(line.unitPrice * line.quantity),
                style: index % 2 ? "serviceAmountAlt" : "serviceAmount",
                alignment: "right" as const,
              },
            ]),
            [
              { text: "HİZMETLER ARA TOPLAMI", colSpan: 4, alignment: "right", style: "tableTotal" },
              {},
              {},
              {},
              { text: money(subtotal), style: "tableTotal", alignment: "right" },
            ],
          ],
        },
        layout: {
          hLineColor: () => "#d6e2ec",
          hLineWidth: (lineIndex: number) => (lineIndex === 1 ? 1.5 : 0.7),
          vLineWidth: () => 0,
          paddingTop: () => 9,
          paddingBottom: () => 9,
          paddingLeft: () => 10,
          paddingRight: () => 10,
        },
      },
      {
        margin: [0, 18, 0, 0],
        columns: [
          {
            width: "*",
            stack: [
              { text: "FİYATLANDIRMA NOTU", style: "sectionLabel" },
              { text: "Birim fiyatlar ve adetler teklif kapsamına göre hesaplanmıştır.", style: "muted" },
            ],
            style: "pricingNote",
          },
          {
            width: 215,
            table: {
              widths: ["*", 88],
              body: pricingRows,
            },
            layout: {
              hLineColor: () => "#d6e2ec",
              hLineWidth: (lineIndex: number) => (lineIndex === 1 || lineIndex === pricingRows.length - 1 ? 1 : 0.5),
              vLineWidth: () => 0,
              paddingTop: (rowIndex: number) => (rowIndex === 0 ? 10 : 7),
              paddingBottom: (rowIndex: number) => (rowIndex === 0 ? 10 : 7),
              paddingLeft: () => 12,
              paddingRight: () => 12,
              fillColor: (rowIndex: number) =>
                rowIndex === 0 ? primaryColor : rowIndex === pricingRows.length - 1 ? "#e8f0f8" : "#ffffff",
            },
          },
        ],
      },
      {
        margin: [0, 16, 0, 0],
        columns: [
          {
            width: "*",
            stack: [
              { text: "YETKİLİ ONAYI", style: "sectionLabel" },
              {
                text: "Teklif uygun bulunduğu takdirde aşağıdaki alan yetkili imzası için kullanılabilir.",
                style: "muted",
              },
              { text: "________________________________", margin: [0, 15, 0, 0] },
              { text: safeText(offer.signatureName || offer.contact), style: "signatureName" },
            ],
            style: "signatureBox",
          },
          {
            width: 118,
            stack: [
              { image: qrDataUrl, width: 64, height: 64, alignment: "center" },
              ...(organization.stampDataUrl
                ? [
                    {
                      image: organization.stampDataUrl,
                      width: 76,
                      height: 38,
                      alignment: "center" as const,
                      margin: [0, 5, 0, 0] as [number, number, number, number],
                    },
                  ]
                : []),
              { text: "Teklifi görüntüle ve yanıtla", style: "qrLabel", alignment: "center" },
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
      eyebrow: { color: "#256da8", fontSize: 8, bold: true, characterSpacing: 1.5 },
      title: { color: "#123d56", fontSize: 20, bold: true, margin: [0, 5, 0, 5] },
      muted: { color: "#66798b", fontSize: 9, lineHeight: 1.35 },
      status: { color: "#1d5b91", fontSize: 8, bold: true, background: "#e8f0f8", margin: [0, 3, 0, 0] },
      heroEyebrow: { color: "#78b9e8", fontSize: 8, bold: true, characterSpacing: 1.5 },
      heroTitle: { color: "#ffffff", fontSize: 17, bold: true, margin: [0, 6, 0, 5] },
      heroMeta: { color: "#c9ddec", fontSize: 8 },
      heroLabel: { color: "#dceeff", fontSize: 7, bold: true, characterSpacing: 1 },
      heroStatus: { color: "#ffffff", fontSize: 12, bold: true, margin: [0, 7, 0, 7] },
      metricCell: { fillColor: "#e8f0f8", margin: [12, 10, 12, 10] },
      metricLabel: { color: "#66798b", fontSize: 7, bold: true, characterSpacing: 0.8 },
      metricValue: { color: "#123d56", fontSize: 11, bold: true, margin: [0, 4, 0, 0] },
      noteBox: { color: "#38546c", fontSize: 9, lineHeight: 1.4, background: "#fff8e7", margin: [12, 10, 12, 10] },
      institutionCell: { fillColor: "#f1f5f8", margin: [14, 12, 14, 12] },
      sectionLabel: { color: "#8999a8", fontSize: 7, bold: true, characterSpacing: 1 },
      sectionValue: { color: "#123d56", fontSize: 10, bold: true, margin: [0, 3, 0, 3] },
      sectionTitle: { color: "#123d56", fontSize: 13, bold: true, margin: [0, 22, 0, 8] },
      pageEyebrow: { color: "#256da8", fontSize: 8, bold: true, characterSpacing: 1.5 },
      pageTitle: { color: "#123d56", fontSize: 19, bold: true, margin: [0, 4, 0, 3] },
      pageSubtitle: { color: "#66798b", fontSize: 8.5 },
      serviceHero: { fillColor: "#e8f0f8", margin: [14, 14, 14, 14] },
      pricingNote: { fillColor: "#f1f5f8", margin: [12, 12, 12, 12] },
      tableHeader: { color: "#ffffff", fontSize: 7.5, bold: true, characterSpacing: 0.7 },
      serviceCell: { color: "#38546c", fontSize: 8.5, fillColor: "#ffffff" },
      serviceCellAlt: { color: "#38546c", fontSize: 8.5, fillColor: "#f1f5f8" },
      serviceNumber: { color: "#256da8", fontSize: 8, bold: true, fillColor: "#ffffff" },
      serviceNumberAlt: { color: "#256da8", fontSize: 8, bold: true, fillColor: "#f1f5f8" },
      serviceAmount: { color: "#123d56", fontSize: 8.5, bold: true, fillColor: "#ffffff" },
      serviceAmountAlt: { color: "#123d56", fontSize: 8.5, bold: true, fillColor: "#f1f5f8" },
      tableTotal: { color: "#123d56", bold: true, fontSize: 9 },
      pricingHeader: { color: "#ffffff", fontSize: 8, bold: true, characterSpacing: 1 },
      pricingLabel: { color: "#66798b", fontSize: 8.5 },
      pricingValue: { color: "#38546c", fontSize: 8.5, bold: true },
      signatureBox: { fillColor: "#f1f5f8", margin: [12, 12, 12, 12] },
      signatureName: { color: secondaryColor, fontSize: 8, bold: true, margin: [0, 5, 0, 0] },
      qrBox: { fillColor: "#e8f0f8", margin: [10, 10, 10, 10] },
      qrLabel: { color: secondaryColor, fontSize: 6.5, lineHeight: 1.2, margin: [0, 4, 0, 0] },
      grandLabel: { color: "#123d56", bold: true, fontSize: 9 },
      grandTotal: { color: primaryColor, bold: true, fontSize: 12 },
      body: { color: "#38546c", fontSize: 9, lineHeight: 1.4 },
      institutionHeaderCell: { fillColor: "#f1f5f8", margin: [14, 10, 14, 10] },
      institutionTitle: { color: "#123d56", fontSize: 13, bold: true },
      institutionShortName: { color: primaryColor, fontSize: 8, bold: true, margin: [0, 3, 0, 0], characterSpacing: 1 },
      institutionMeta: { color: "#66798b", fontSize: 7.5, lineHeight: 1.3 },
    },
  };

  return {
    pdfMake,
    document,
    fileName: `${fileSlug(offer.number)}_${fileSlug(offer.company)}_${fileSlug(offer.offerType || "hizmet-teklifi")}.pdf`,
  };
}

export async function downloadServiceSummaryPdf(
  offer: Offer,
  organization: Organization,
  company?: { name: string; employees?: number },
) {
  const pdfMakeModule = (await import("pdfmake/build/pdfmake")) as PdfMakeBrowser & { default?: PdfMakeBrowser };
  const fontsModule = (await import("pdfmake/build/vfs_fonts")) as { default?: Record<string, string> } & Record<
    string,
    string
  >;
  const pdfMake = pdfMakeModule.default ?? pdfMakeModule;
  pdfMake.addVirtualFileSystem(fontsModule.default ?? fontsModule);
  const lines = offer.lines ?? [];
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) || offer.total;
  const discount = Math.min(offer.discount ?? 0, subtotal);
  const net = subtotal - discount;
  const taxRate = offer.tax ?? 0;
  const total = net + Math.round((net * taxRate) / 100);
  const primaryColor = resolvePdfBrandColor(organization.primaryColor, "#256da8");
  const body: TableCell[][] = [
    [
      { text: "NO", style: "head", alignment: "center" },
      { text: "TEST / HİZMET", style: "head" },
      { text: "ADET", style: "head", alignment: "right" },
      { text: "BİRİM", style: "head", alignment: "right" },
      { text: "TUTAR", style: "head", alignment: "right" },
    ],
    ...lines.map((line, index) => [
      { text: String(index + 1).padStart(2, "0"), style: "number" },
      line.name,
      String(line.quantity),
      money(line.unitPrice),
      money(line.unitPrice * line.quantity),
    ]),
  ];
  const document: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [42, 42, 42, 48],
    header: {
      margin: [42, 22, 42, 0],
      columns: [
        { text: organization.title, style: "brand" },
        { text: "HİZMET ÖZETİ", style: "meta", alignment: "right" },
      ],
    },
    footer: (currentPage, pageCount) => ({
      margin: [42, 0, 42, 22],
      columns: [
        { text: "Sağlıklı çalışma, güvenli yarınlar.", style: "footer" },
        { text: `${currentPage} / ${pageCount}`, alignment: "right", style: "footer" },
      ],
    }),
    content: [
      { text: "HİZMET KAPSAMI", style: "eyebrow" },
      { text: offer.company, style: "title" },
      {
        text: `${offer.number} · ${offer.offerType || "OSGB hizmetleri"} · ${company?.employees || 0} çalışan`,
        style: "muted",
      },
      { text: "Test ve muayene kalemleri", style: "section" },
      {
        table: { headerRows: 1, widths: [30, "*", 52, 68, 78], body },
        layout: {
          hLineColor: () => "#d6e2ec",
          vLineWidth: () => 0,
          paddingTop: () => 9,
          paddingBottom: () => 9,
          paddingLeft: () => 9,
          paddingRight: () => 9,
          fillColor: (row: number) => (row === 0 ? primaryColor : row % 2 ? "#ffffff" : "#f1f5f8"),
        },
      },
      {
        margin: [0, 24, 0, 0],
        columns: [
          {
            width: "*",
            text: "Teklif kapsamındaki tüm hizmetler seçilen adet ve birim fiyatlar üzerinden hesaplanmıştır.",
            style: "muted",
          },
          {
            width: 210,
            table: {
              widths: ["*", 82],
              body: [
                [
                  { text: "ARA TOPLAM", style: "label" },
                  { text: money(subtotal), alignment: "right" },
                ],
                ...(discount
                  ? [
                      [
                        { text: "İNDİRİM", style: "label" },
                        { text: `-${money(discount)}`, alignment: "right" },
                      ] as TableCell[],
                    ]
                  : []),
                ...(taxRate
                  ? [
                      [
                        { text: `KDV (%${taxRate})`, style: "label" },
                        { text: money(Math.round((net * taxRate) / 100)), alignment: "right" },
                      ] as TableCell[],
                    ]
                  : []),
                [
                  { text: "GENEL TOPLAM", style: "grandLabel" },
                  { text: money(total), style: "grandTotal", alignment: "right" },
                ],
              ],
            },
            layout: "lightHorizontalLines",
          },
        ],
      },
    ],
    defaultStyle: { font: "Roboto" },
    styles: {
      brand: { color: primaryColor, fontSize: 11, bold: true },
      meta: { color: "#66798b", fontSize: 8, bold: true },
      footer: { color: "#8999a8", fontSize: 7 },
      eyebrow: { color: primaryColor, fontSize: 8, bold: true, characterSpacing: 1.5 },
      title: { color: "#123d56", fontSize: 22, bold: true, margin: [0, 6, 0, 4] },
      muted: { color: "#66798b", fontSize: 9, lineHeight: 1.35 },
      section: { color: "#123d56", fontSize: 13, bold: true, margin: [0, 24, 0, 9] },
      head: { color: "#ffffff", fontSize: 7.5, bold: true },
      number: { color: primaryColor, fontSize: 8, bold: true },
      label: { color: "#66798b", fontSize: 8.5 },
      grandLabel: { color: "#123d56", bold: true, fontSize: 9 },
      grandTotal: { color: primaryColor, bold: true, fontSize: 12 },
    },
  };
  pdfMake
    .createPdf(document)
    .download(
      `${offer.number.replace(/[^a-zA-Z0-9-]/g, "-")}_${offer.company.replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ]+/gi, "-")}_hizmet-ozeti.pdf`,
    );
}

export async function downloadOfferPdf(
  offer: Offer,
  organization: Organization,
  company?: {
    name: string;
    email: string;
    phone: string;
    employees?: number;
    address?: string;
    city?: string;
    district?: string;
  },
) {
  const { pdfMake, document, fileName } = await buildOfferPdf(offer, organization, company);
  pdfMake.createPdf(document).download(fileName);
}

export async function previewOfferPdf(
  offer: Offer,
  organization: Organization,
  company?: {
    name: string;
    email: string;
    phone: string;
    employees?: number;
    address?: string;
    city?: string;
    district?: string;
  },
) {
  const previewWindow = window.open("about:blank", "_blank");
  if (!previewWindow) throw new Error("PDF önizleme sekmesi açılamadı.");

  const { pdfMake, document } = await buildOfferPdf(offer, organization, company);
  const blob = await pdfMake.createPdf(document).getBlob();
  const previewUrl = URL.createObjectURL(blob);
  previewWindow.location.href = previewUrl;
  window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000);
}
