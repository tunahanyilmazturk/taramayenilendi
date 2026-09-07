import type { AnalyzedValue } from "@/lib/pdf-analysis/types";

type ResultRule = {
  key: string;
  group: string;
  label: string;
  aliases: string[];
  defaultUnit?: string;
};

export const resultRules: ResultRule[] = [
  { key: "bio_glucose", group: "Biyokimya", label: "Glukoz (Açlık)", aliases: ["glukoz (açlık)", "glukoz açlık", "açlık kan şekeri", "glukoz", "glucose"], defaultUnit: "mg/dL" },
  { key: "bio_creatinine", group: "Biyokimya", label: "Kreatinin", aliases: ["kreatinin", "creatinine"], defaultUnit: "mg/dL" },
  { key: "bio_ast", group: "Biyokimya", label: "AST", aliases: ["ast (aspartat", "ast (sgot)", "ast", "sgot"], defaultUnit: "U/L" },
  { key: "bio_alt", group: "Biyokimya", label: "ALT", aliases: ["alt(alanin aminotransferaz,", "alt (sgpt)", "alt", "sgpt"], defaultUnit: "U/L" },
  { key: "bio_ggt", group: "Biyokimya", label: "GGT", aliases: ["ggt(gamma glutamil", "gama glutamil transferaz", "gamma glutamyl transferase", "ggt"], defaultUnit: "U/L" },
  { key: "bio_urea", group: "Biyokimya", label: "Üre", aliases: ["üre", "urea"], defaultUnit: "mg/dL" },
  { key: "bio_hba1c", group: "Biyokimya", label: "HbA1c", aliases: ["hemoglobin a1c", "hba1c"], defaultUnit: "%" },
  { key: "serology_hbsag", group: "Seroloji", label: "HBsAg", aliases: ["hbsag"], defaultUnit: "" },

  { key: "hem_wbc", group: "Hemogram", label: "WBC", aliases: ["wbc"], defaultUnit: "K/uL" },
  { key: "hem_lymph_abs", group: "Hemogram", label: "LYMP#", aliases: ["lymp #", "lymph#", "lym#"], defaultUnit: "K/uL" },
  { key: "hem_mon_abs", group: "Hemogram", label: "MON#", aliases: ["mon #", "mon#"], defaultUnit: "K/uL" },
  { key: "hem_neu_abs", group: "Hemogram", label: "NEU#", aliases: ["neu #", "neu#", "neut#"], defaultUnit: "K/uL" },
  { key: "hem_eos_abs", group: "Hemogram", label: "EOS#", aliases: ["eos #", "eos#"], defaultUnit: "K/uL" },
  { key: "hem_bas_abs", group: "Hemogram", label: "BAS#", aliases: ["bas #", "bas#", "baso#"], defaultUnit: "K/uL" },
  { key: "hem_lym_pct", group: "Hemogram", label: "LYM%", aliases: ["lym %", "lym%", "lymph%"], defaultUnit: "%" },
  { key: "hem_mon_pct", group: "Hemogram", label: "MON%", aliases: ["mon %", "mon%"], defaultUnit: "%" },
  { key: "hem_neu_pct", group: "Hemogram", label: "NEU%", aliases: ["neu %", "neu%", "neut%"], defaultUnit: "%" },
  { key: "hem_eos_pct", group: "Hemogram", label: "EOS%", aliases: ["eos %", "eos%"], defaultUnit: "%" },
  { key: "hem_bas_pct", group: "Hemogram", label: "BAS%", aliases: ["bas %", "bas%", "baso%"], defaultUnit: "%" },
  { key: "hem_hgb", group: "Hemogram", label: "HGB", aliases: ["hemoglobin (hgb)", "hemoglobin", "hgb"], defaultUnit: "g/dL" },
  { key: "hem_rbc", group: "Hemogram", label: "RBC", aliases: ["rbc"], defaultUnit: "K/uL" },
  { key: "hem_hct", group: "Hemogram", label: "HCT", aliases: ["hematokrit", "hematocrit", "hct"], defaultUnit: "%" },
  { key: "hem_mcv", group: "Hemogram", label: "MCV", aliases: ["mcv"], defaultUnit: "fL" },
  { key: "hem_mch", group: "Hemogram", label: "MCH", aliases: ["mch"], defaultUnit: "pg" },
  { key: "hem_mchc", group: "Hemogram", label: "MCHC", aliases: ["mchc"], defaultUnit: "g/dL" },
  { key: "hem_rdw_cv", group: "Hemogram", label: "RDW-CV", aliases: ["rdw_cv", "rdw-cv", "rdw cv"], defaultUnit: "%" },
  { key: "hem_plt", group: "Hemogram", label: "PLT", aliases: ["trombosit", "platelet", "plt"], defaultUnit: "K/uL" },
  { key: "hem_mpv", group: "Hemogram", label: "MPV", aliases: ["mpv"], defaultUnit: "fL" },
  { key: "hem_pdw", group: "Hemogram", label: "PDW", aliases: ["pdw"], defaultUnit: "fL" },
  { key: "hem_pct", group: "Hemogram", label: "PCT", aliases: ["pct"], defaultUnit: "%" },
  { key: "hem_plcr", group: "Hemogram", label: "P-LCR", aliases: ["p-lcr", "p_lcr", "plcr"], defaultUnit: "%" },

  { key: "tit_erythrocyte", group: "TİT", label: "Eritrosit", aliases: ["eritrosit"], defaultUnit: "uL" },
  { key: "tit_bilirubin", group: "TİT", label: "Bilirubin", aliases: ["bilirubin"], defaultUnit: "mg/dL" },
  { key: "tit_urobilinogen", group: "TİT", label: "Ürobilinojen", aliases: ["ürobilinojen", "urobilinojen", "urobilinogen"], defaultUnit: "mg/dL" },
  { key: "tit_ketone", group: "TİT", label: "Keton", aliases: ["keton", "ketone"], defaultUnit: "mg/dL" },
  { key: "tit_protein", group: "TİT", label: "Protein", aliases: ["protein"], defaultUnit: "mg/dL" },
  { key: "tit_nitrite", group: "TİT", label: "Nitrit", aliases: ["nitrit", "nitrite"] },
  { key: "tit_glucose", group: "TİT", label: "Glukoz", aliases: ["glukoz", "glucose"], defaultUnit: "mg/dL" },
  { key: "tit_ph", group: "TİT", label: "pH", aliases: ["ph"] },
  { key: "tit_density", group: "TİT", label: "Dansite", aliases: ["dansite", "özgül ağırlık", "specific gravity"] },
  { key: "tit_leukocyte", group: "TİT", label: "Lökosit (Strip)", aliases: ["lökosit", "leukocyte"], defaultUnit: "uL" },
  { key: "tit_microscopy", group: "TİT", label: "Mikroskopi", aliases: ["mikroskopi"] },
  { key: "tit_leukocyte_hpf", group: "TİT", label: "Lökosit (Mikroskopi)", aliases: ["lokosit", "lökosit (hpf)"], defaultUnit: "HPF" },
];

const valuePattern = "([<>]?\\s*-?(?:\\d+(?:[.,]\\d+)?|[.,]\\d+)(?:\\s*-\\s*(?:\\d+(?:[.,]\\d+)?|[.,]\\d+))?|pozitif|negatif|normal|eser|reaktif|nonreaktif|tespit edilmedi)";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function fold(value: string) {
  return normalize(value).toLocaleLowerCase("tr-TR").replace(/[‐‑–—]/g, "-");
}

function statusFrom(source: string, value: string, reference?: string): AnalyzedValue["status"] {
  if (/\b(yüksek|dusuk|düşük|high|low|pozitif|reaktif|tekrar|anormal)\b/i.test(source) || /\s[YHDL]\s/i.test(source)) return "attention";
  if (/\b(normal|negatif|uygun|nonreaktif|tespit edilmedi)\b/i.test(value)) return "normal";
  if (!reference) return "unknown";
  const number = Number(value.replace(",", ".").replace(/[^0-9.-]/g, ""));
  const bounds = reference.match(/^\s*([<>]?\s*-?(?:\d+(?:[.,]\d+)?|[.,]\d+))\s*[-–]\s*([<>]?\s*-?(?:\d+(?:[.,]\d+)?|[.,]\d+))\s*$/);
  if (!Number.isFinite(number) || !bounds) return "unknown";
  const lower = Number(bounds[1].replace(",", ".").replace(/[^0-9.-]/g, ""));
  const upper = Number(bounds[2].replace(",", ".").replace(/[^0-9.-]/g, ""));
  return number >= lower && number <= upper ? "normal" : "attention";
}

function canonicalValue(value: string) {
  const labels: Record<string, string> = {
    negatif: "Negatif",
    pozitif: "Pozitif",
    normal: "Normal",
    eser: "Eser",
    reaktif: "Reaktif",
    nonreaktif: "Nonreaktif",
    "tespit edilmedi": "Tespit edilmedi",
  };
  return labels[fold(value)] ?? normalize(value);
}

function sectionForLine(lines: string[], lineIndex: number) {
  const context = fold(lines.slice(Math.max(0, lineIndex - 45), lineIndex + 1).join("\n"));
  const markers = [
    { group: "TİT", index: Math.max(context.lastIndexOf("tam idrar tahlili"), context.lastIndexOf("idrar tetkiki")) },
    { group: "Hemogram", index: Math.max(context.lastIndexOf("hemogram"), context.lastIndexOf("tam kan sayımı")) },
    { group: "Biyokimya", index: context.lastIndexOf("biyokimya") },
    { group: "Seroloji", index: Math.max(context.lastIndexOf("seroloji"), context.lastIndexOf("hbsag")) },
  ];
  return markers.sort((a, b) => b.index - a.index)[0]?.index >= 0 ? markers.sort((a, b) => b.index - a.index)[0].group : "";
}

function referenceFrom(source: string, value: string) {
  const valueIndex = source.toLocaleLowerCase("tr-TR").indexOf(value.toLocaleLowerCase("tr-TR"));
  const remainder = valueIndex >= 0 ? source.slice(valueIndex + value.length) : source;
  const match = remainder.match(/([<>]?\s*(?:\d+(?:[.,]\d+)?|[.,]\d+))\s*[-–]\s*([<>]?\s*(?:\d+(?:[.,]\d+)?|[.,]\d+))/);
  return match ? `${normalize(match[1])}-${normalize(match[2])}` : undefined;
}

export function extractKnownValues(text: string): AnalyzedValue[] {
  const values: AnalyzedValue[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\n+/).map(normalize).filter(Boolean);
  for (const rule of resultRules) {
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const source = lines[lineIndex];
      const lineSection = sectionForLine(lines, lineIndex);
      if (lineSection !== rule.group && !(rule.group === "Seroloji" && /hbsag/i.test(source))) continue;
      for (const alias of [...rule.aliases].sort((a, b) => b.length - a.length)) {
        const foldedSource = fold(source);
        const match = foldedSource.match(new RegExp(`^\\s*${escapeRegExp(fold(alias))}(?:\\s*\\([^)]*\\))?\\s*[:=]?\\s*${valuePattern}(?:\\s+([yhdl]))?`, "i"));
        if (!match || seen.has(rule.key)) continue;
        const value = canonicalValue(match[1]);
        const reference = referenceFrom(foldedSource, fold(match[1]));
        values.push({
          key: rule.key,
          group: rule.group,
          label: rule.label,
          value,
          unit: rule.defaultUnit || undefined,
          reference,
          status: statusFrom(`${source} ${match[2] ?? ""}`, value, reference),
          confidence: 0.96,
          source,
        });
        seen.add(rule.key);
        break;
      }
      if (seen.has(rule.key)) break;
    }
  }
  return values;
}

function includesAny(text: string, aliases: readonly string[]) {
  return aliases.some((alias) => text.includes(alias));
}

function extractConclusion(text: string, aliases: readonly string[]) {
  const normalized = fold(text);
  const start = aliases.map((alias) => normalized.indexOf(fold(alias))).filter((index) => index >= 0).sort((a, b) => a - b)[0];
  if (start === undefined) return "";
  const section = text.slice(start, start + 3500);
  const match = section.match(/(?:sonuç|sonuc|değerlendirme|yorum)\s*:\s*([\s\S]{3,500}?)(?=\s*(?:\*\s*değerlendirme|imza|bu rapor|ömerağa|tel:|rapor revizyon|$))/i);
  return match?.[1].replace(/\s+/g, " ").trim().replace(/\s*[-–]\s*/g, " — ") ?? "";
}

export function extractReportValues(text: string): AnalyzedValue[] {
  const values: AnalyzedValue[] = [];
  const push = (value: AnalyzedValue) => {
    if (!values.some((item) => item.key === value.key)) values.push(value);
  };
  const scalar = (key: string, group: string, label: string, pattern: RegExp, unit?: string) => {
    const match = text.match(pattern);
    if (!match) return;
    const value = normalize(match[1]);
    push({ key, group, label, value, unit, status: "unknown", confidence: 0.9, source: normalize(match[0]) });
  };
  scalar("vital_blood_pressure", "Muayene", "Tansiyon", /(?:tansiyon|TA)\s*[:=]?\s*(\d{2,3}\s*\/\s*\d{2,3})/i, "mmHg");
  scalar("vital_pulse", "Muayene", "Nabız", /nab\s*[ıi]\s*z\s*[:=]?\s*(\d{2,3})/i, "/dk");
  scalar("vital_height", "Muayene", "Boy", /boy\s*[:=]?\s*(\d{2,3}(?:[.,]\d+)?)/i, "cm");
  scalar("vital_weight", "Muayene", "Kilo", /(?:kilo|ağırlık)\s*[:=]?\s*(\d{2,3}(?:[.,]\d+)?)/i, "kg");
  scalar("vital_bmi", "Muayene", "BKİ", /(?:BKİ|BMI|vücut kitle indeksi)\s*[:=]?\s*(\d{1,2}(?:[.,]\d+)?)/i);

  const sftConclusion = text.match(/(?:sonuç\s*\/\s*t\s*[ıi]\s*bbi rapor|yorum)\s*\n\s*([^\n]+)/i)?.[1];
  if (sftConclusion) push({ key: "sft_conclusion", group: "SFT", label: "SFT yorumu", value: normalize(sftConclusion), status: "unknown", confidence: 0.9, source: normalize(sftConclusion) });


  const eyeValues = text.match(/\n\s*(\d{1,2}\s*\/\s*\d{1,2})\s+(\d{1,2}\s*\/\s*\d{1,2})\s*\n\s*renk körlüğü/i);
  if (eyeValues) {
    push({ key: "vision_left", group: "Göz", label: "Sol görme keskinliği", value: normalize(eyeValues[1]), status: "normal", confidence: 0.92, source: normalize(eyeValues[0]) });
    push({ key: "vision_right", group: "Göz", label: "Sağ görme keskinliği", value: normalize(eyeValues[2]), status: "normal", confidence: 0.92, source: normalize(eyeValues[0]) });
  }

  const normalized = fold(text);
  const ekgMarker = normalized.indexOf("yorumlar:");
  const ekgEndMarker = ekgMarker >= 0 ? normalized.indexOf("onayla ve imzala", ekgMarker) : -1;
  const rawEkgCandidate = text.match(/yorumlar?\s*:\s*([\s\S]{3,220}?)(?=\s+onayla\s+ve\s+[iİ]mzala\s*:)/i)?.[1] ?? (ekgMarker >= 0 ? text.slice(ekgMarker + "yorumlar:".length, ekgEndMarker > ekgMarker ? ekgEndMarker : ekgMarker + 220) : "");
  const ekgStop = rawEkgCandidate.search(/\s+onayla\b/i);
  const rawEkgComment = rawEkgCandidate.slice(0, ekgStop >= 0 ? ekgStop : rawEkgCandidate.length).replace(/\s+/g, " ").trim();
  const isNoise = (value: string) => !value || /^(?:[a-zçğıöşüİ]{1}\s*){3,}$/i.test(value) || value.split(/\s+/).filter((part) => part.length > 1).length < 2;
  const narrativeEkgComment = text.match(/((?:normal\s+s[iı]n[üu]s\s+ritmi|sinus\s+rhythm|normal\s+ecg)[\s\S]{0,240})/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  const ekgComment = !isNoise(rawEkgComment) ? rawEkgComment : narrativeEkgComment;
  const cleanEkgComment = normalize(ekgComment).replace(/\s+Onayla[\s\S]*$/u, "").trim();
  if (cleanEkgComment) push({ key: "ecg_result", group: "EKG", label: "Sonuç yorumu", value: cleanEkgComment, status: "unknown", confidence: 0.96, source: cleanEkgComment });
  const narratives = [
    { key: "xray_result", group: "Radyoloji", label: "PA Akciğer sonucu", aliases: ["pa akciğer grafisi", "pa akciğer", "radyoloji"] as const },
    { key: "hearing_result", group: "Odyometri", label: "İşitme sonucu", aliases: ["odyometri", "odyogram"] as const },
    { key: "vision_result", group: "Göz", label: "Göz muayenesi", aliases: ["göz muayenesi", "görme"] as const },
  ];
  for (const item of narratives) {
    if (!includesAny(normalized, item.aliases)) continue;
    const result = extractConclusion(text, item.aliases) || "Sonuç metni bulunamadı";
    push({ key: item.key, group: item.group, label: item.label, value: result, status: "unknown", confidence: result === "Sonuç metni bulunamadı" ? 0.35 : 0.96, source: result });
  }
  return values;
}

export function extractAllValues(text: string) {
  const values = [...extractKnownValues(text), ...extractReportValues(text)];
  return Array.from(new Map(values.map((value) => [value.key, value])).values());
}

export function detectDocumentType(text: string, knownTestNames: string[] = []) {
  const normalized = text.toLocaleLowerCase("tr-TR");
  const configured = knownTestNames.filter((name) => normalized.includes(name.toLocaleLowerCase("tr-TR")));
  const candidates = [
    ["Hemogram", ["hemogram", "tam kan sayımı", "tam kan sayimi"]],
    ["TİT", ["tam idrar tahlili", "idrar tetkiki"]],
    ["Biyokimya", ["biyokimya", "kreatinin"]],
    ["Odyometri", ["odyometri", "odyogram"]],
    ["SFT", ["spirometri", "solunum fonksiyon", "sft"]],
    ["Akciğer Grafisi", ["akciğer grafisi", "akciger grafisi", "radyoloji"]],
    ["Göz Muayenesi", ["göz muayenesi", "goz muayenesi", "görme testi"]],
    ["EKG", ["elektrokardiyografi", "ekg", "ecg"]],
  ] as const;
  const detected = candidates.filter(([, aliases]) => aliases.some((alias) => normalized.includes(alias))).map(([name]) => name);
  const types = Array.from(new Set(detected.length ? detected : configured.slice(0, 1)));
  if (types.length > 1) return `Birleşik sağlık raporu (${types.join(", ")})`;
  return types[0] ?? "Tanımlanamayan rapor";
}
