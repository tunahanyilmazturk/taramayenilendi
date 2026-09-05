export type ResultFindingStatus = "normal" | "low" | "high" | "review";

export type ResultFinding = {
  label: string;
  value: number;
  unit: string;
  status: ResultFindingStatus;
  reference: string;
  comment: string;
};

export type ResultAnalysis = {
  status: "normal" | "attention" | "unreadable";
  summary: string;
  findings: ResultFinding[];
  insights: string[];
  eyeExam?: EyeExamResult;
  specialTests?: SpecialTestResult[];
  highlightedText?: string[];
  analyzedAt: string;
};

export type EyeMeasurement = {
  sph?: string;
  cyl?: string;
  axis?: string;
  visualAcuity?: string;
  correctedVisualAcuity?: string;
  eyePressure?: string;
};

export type EyeExamResult = {
  left?: EyeMeasurement;
  right?: EyeMeasurement;
  colorBlindness?: string;
  conclusion?: string;
  assessment?: string;
  diagnosis?: string;
};

export type SpecialTestField = {
  label: string;
  value: string;
};

export type SpecialTestResult = {
  type: "EKG" | "İşitme testi" | "Röntgen" | "SFT / Spirometri";
  fields: SpecialTestField[];
  conclusion?: string;
  assessment?: string;
};

export type ResultRecord = {
  id: string;
  employeeId: number | null;
  employeeName: string;
  companyId: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  extractedText: string;
  dataUrl?: string;
  analysis: ResultAnalysis;
  screeningType: ScreeningType;
  profile?: ParsedEmployeeProfile;
};

export type ParsedEmployeeProfile = {
  name: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  email?: string;
  position?: string;
  department?: string;
};

export type ScreeningType = "İşe giriş muayenesi" | "Periyodik sağlık taraması" | "Diğer";

type ReferenceRule = {
  label: string;
  aliases: string[];
  min: number;
  max: number;
  unit: string;
  reference: string;
};

const rules: ReferenceRule[] = [
  {
    label: "HbA1c",
    aliases: ["hba1c", "hb a1c", "glikozile hemoglobin"],
    min: 4,
    max: 6.1,
    unit: "%",
    reference: "4 - 6,1 %",
  },
  {
    label: "Hemoglobin",
    aliases: ["hemoglobin", "hgb", "hb"],
    min: 12,
    max: 17.5,
    unit: "g/dL",
    reference: "12 - 17,5 g/dL",
  },
  {
    label: "Glukoz",
    aliases: ["glukoz", "glikoz", "glucose", "kan sekeri", "kan şekeri", "tkş", "tks"],
    min: 70,
    max: 100,
    unit: "mg/dL",
    reference: "70 - 100 mg/dL",
  },
  {
    label: "İdrar pH",
    aliases: ["ph"],
    min: 5,
    max: 7.5,
    unit: "pH",
    reference: "5,0 - 7,5",
  },
  {
    label: "İdrar dansitesi",
    aliases: ["dansite", "dansİte", "yoğunluk", "yogunluk"],
    min: 1005,
    max: 1030,
    unit: "SG",
    reference: "1005 - 1030",
  },
  {
    label: "Kreatinin",
    aliases: ["kreatinin", "creatinine", "kre"],
    min: 0.72,
    max: 1.25,
    unit: "mg/dL",
    reference: "0,72 - 1,25 mg/dL",
  },
  { label: "Üre", aliases: ["üre", "ure", "bun"], min: 17.9, max: 54.9, unit: "mg/dL", reference: "17,9 - 54,9 mg/dL" },
  {
    label: "GGT",
    aliases: ["ggt", "gamma glutamil transferaz"],
    min: 12,
    max: 64,
    unit: "U/L",
    reference: "12 - 64 U/L",
  },
  {
    label: "Toplam kolesterol",
    aliases: ["total cholesterol", "toplam kolesterol", "kolesterol"],
    min: 0,
    max: 200,
    unit: "mg/dL",
    reference: "0 - 200 mg/dL",
  },
  { label: "LDL", aliases: ["ldl"], min: 0, max: 130, unit: "mg/dL", reference: "0 - 130 mg/dL" },
  { label: "HDL", aliases: ["hdl"], min: 40, max: 1000, unit: "mg/dL", reference: ">= 40 mg/dL" },
  {
    label: "Trigliserid",
    aliases: ["trigliserid", "triglyceride"],
    min: 0,
    max: 150,
    unit: "mg/dL",
    reference: "0 - 150 mg/dL",
  },
  { label: "ALT", aliases: ["alt"], min: 0, max: 45, unit: "U/L", reference: "0 - 45 U/L" },
  { label: "AST", aliases: ["ast"], min: 0, max: 40, unit: "U/L", reference: "0 - 40 U/L" },
  {
    label: "Vücut kitle indeksi",
    aliases: ["vki", "bmi", "vucut kitle indeksi", "vücut kitle indeksi"],
    min: 18.5,
    max: 24.9,
    unit: "kg/m²",
    reference: "18,5 - 24,9 kg/m²",
  },
  {
    label: "Lökosit",
    aliases: ["lokosit", "lökosit", "wbc"],
    min: 4,
    max: 10,
    unit: "10³/µL",
    reference: "4 - 10 10³/µL",
  },
  {
    label: "Eritrosit",
    aliases: ["rbc", "eritrosit"],
    min: 4.44,
    max: 5.61,
    unit: "K/µL",
    reference: "4,44 - 5,61 K/µL",
  },
  { label: "Hematokrit", aliases: ["hct", "hematokrit"], min: 40, max: 50, unit: "%", reference: "40 - 50 %" },
  { label: "MCV", aliases: ["mcv"], min: 81.8, max: 98, unit: "fL", reference: "81,8 - 98 fL" },
  { label: "MCH", aliases: ["mch"], min: 27, max: 32.3, unit: "pg", reference: "27 - 32,3 pg" },
  { label: "MCHC", aliases: ["mchc"], min: 31.8, max: 35, unit: "g/dL", reference: "31,8 - 35 g/dL" },
  { label: "RDW", aliases: ["rdw_cv", "rdw-cv", "rdw"], min: 12, max: 14.3, unit: "%", reference: "12 - 14,3 %" },
  { label: "Trombosit", aliases: ["plt", "trombosit"], min: 100, max: 390, unit: "K/µL", reference: "100 - 390 K/µL" },
  { label: "MPV", aliases: ["mpv"], min: 9.1, max: 12.1, unit: "fL", reference: "9,1 - 12,1 fL" },
  { label: "PDW", aliases: ["pdw"], min: 9.9, max: 16.1, unit: "fL", reference: "9,9 - 16,1 fL" },
  { label: "PCT", aliases: ["pct"], min: 0.18, max: 0.39, unit: "%", reference: "0,18 - 0,39 %" },
  { label: "P-LCR", aliases: ["p-lcr", "p_lcr", "plcr"], min: 17.5, max: 42.3, unit: "%", reference: "17,5 - 42,3 %" },
  {
    label: "Lenfosit %",
    aliases: ["lym %", "lym%", "%lym"],
    min: 18.3,
    max: 47.9,
    unit: "%",
    reference: "18,3 - 47,9 %",
  },
  { label: "Monosit %", aliases: ["mon %", "mon%", "%mon"], min: 4.2, max: 15.2, unit: "%", reference: "4,2 - 15,2 %" },
  {
    label: "Nötrofil %",
    aliases: ["neu %", "neu%", "neut %", "neut%"],
    min: 41,
    max: 74.3,
    unit: "%",
    reference: "41 - 74,3 %",
  },
  { label: "Eozinofil %", aliases: ["eos %", "eos%"], min: 0.2, max: 7.6, unit: "%", reference: "0,2 - 7,6 %" },
  { label: "Bazofil %", aliases: ["bas %", "bas%"], min: 0, max: 1, unit: "%", reference: "0 - 1 %" },
  {
    label: "Lenfosit #",
    aliases: ["lymp #", "lym #", "#lym"],
    min: 1.26,
    max: 3.35,
    unit: "K/µL",
    reference: "1,26 - 3,35 K/µL",
  },
  { label: "Monosit #", aliases: ["mon #", "#mon"], min: 0.25, max: 0.95, unit: "K/µL", reference: "0,25 - 0,95 K/µL" },
  {
    label: "Nötrofil #",
    aliases: ["neu #", "#neu", "neut #"],
    min: 1.8,
    max: 6.98,
    unit: "K/µL",
    reference: "1,80 - 6,98 K/µL",
  },
  {
    label: "Eozinofil #",
    aliases: ["eos #", "#eos"],
    min: 0.01,
    max: 0.59,
    unit: "K/µL",
    reference: "0,01 - 0,59 K/µL",
  },
  { label: "Bazofil #", aliases: ["bas #", "#bas"], min: 0, max: 0.06, unit: "K/µL", reference: "0 - 0,06 K/µL" },
  {
    label: "Sistolik tansiyon",
    aliases: ["ta", "sistolik tansiyon"],
    min: 90,
    max: 140,
    unit: "mmHg",
    reference: "90 - 140 mmHg",
  },
  { label: "Nabız", aliases: ["nb", "nabız", "nabiz"], min: 50, max: 100, unit: "bpm", reference: "50 - 100 bpm" },
  { label: "FEV1/FVC", aliases: ["fev1/fvc", "fev1/ fvc"], min: 70, max: 90, unit: "%", reference: "70 - 90 %" },
  { label: "PEF", aliases: ["pef"], min: 3, max: 10, unit: "L/s", reference: "3 - 10 L/s" },
  { label: "FEF25-75", aliases: ["fef2575", "fef25-75"], min: 1, max: 5, unit: "L/s", reference: "1 - 5 L/s" },
];

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[^a-z0-9]/g, "");

export function analyzeResultText(text: string): ResultAnalysis {
  const findings: ResultFinding[] = [];
  const seen = new Set<string>();
  const urine = buildUrinalysisInsights(text);
  const isUrinalysis = urine.detected;
  const eye = buildEyeExamInsights(text);
  for (const rule of rules) {
    // İdrar strip sonuçlarında glukoz, eritrosit ve lökosit çoğunlukla
    // "NEGATİF" olarak yazılır. Genel sayısal kuralın ilerideki pH/dansite
    // değerini bu satırın sonucu sanmasını engelliyoruz.
    if (isUrinalysis && ["Glukoz", "Eritrosit", "Lökosit"].includes(rule.label)) continue;
    const aliases = rule.aliases.map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const labelPattern = new RegExp(`(?:^|[^a-zA-ZçÇğĞıİöÖşŞüÜ])(?:${aliases})(?![a-zA-ZçÇğĞıİöÖşŞüÜ])`, "ig");
    let match: RegExpExecArray | null = null;
    let rawValue: string | undefined;
    while ((match = labelPattern.exec(text))) {
      const context = text
        .slice(match.index + match[0].length, match.index + match[0].length + 220)
        .replace(/\d{1,2}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{2,4}/g, " ")
        .replace(/\d{1,2}\s*:\s*\d{2}(?::\s*\d{2})?/g, " ");
      const candidates = [...context.matchAll(/-?\d+(?:[.,]\d+)?/g)].map((item) => item[0]);
      const candidate =
        rule.label === "HbA1c"
          ? (candidates.find((item) => Number(item.replace(",", ".")) >= 3 && Number(item.replace(",", ".")) <= 20) ??
            candidates[0])
          : candidates[0];
      if (candidate) {
        rawValue = candidate;
        break;
      }
    }
    if (!rawValue || seen.has(rule.label)) continue;
    const value = Number(rawValue.replace(",", "."));
    if (!Number.isFinite(value)) continue;
    seen.add(rule.label);
    const status: ResultFindingStatus = value < rule.min ? "low" : value > rule.max ? "high" : "normal";
    findings.push({
      label: rule.label,
      value,
      unit: rule.unit,
      status,
      reference: rule.reference,
      comment:
        status === "normal"
          ? "Referans aralığı içinde."
          : status === "low"
            ? "Referans aralığının altında; hekim değerlendirmesi gerekir."
            : "Referans aralığının üzerinde; hekim değerlendirmesi gerekir.",
    });
  }
  const numericAttentionCount = findings.filter(
    (finding) => finding.status === "low" || finding.status === "high",
  ).length;
  const attentionCount = numericAttentionCount + (urine.attention ? 1 : 0) + (eye.attention ? 1 : 0);
  const special = buildSpecialTestInsights(text, findings);
  const highlightedText = [...text.matchAll(/\[VURGULU\]\s*([^\n]+)/g)]
    .map((match) => match[1].trim())
    .filter((value) => value.length > 2);
  const insights = [
    ...buildHemogramInsights(findings),
    ...urine.insights,
    ...eye.insights,
    ...special.insights,
    ...(highlightedText.length ? ["Raporda vurgulanan alanlar ayrıca işaretlendi."] : []),
  ];
  const totalAttentionCount = attentionCount + (special.attention ? 1 : 0);
  const hasReadableAnalysis = Boolean(
    findings.length || urine.detected || eye.detected || special.detected || highlightedText.length,
  );
  const hemogramCount = findings.filter((finding) => hemogramLabels.has(finding.label)).length;
  return {
    status: !text.trim() || !hasReadableAnalysis ? "unreadable" : totalAttentionCount ? "attention" : "normal",
    summary:
      !text.trim() || !hasReadableAnalysis
        ? "Dosyadan analiz edilebilir metin çıkarılamadı."
        : totalAttentionCount
          ? isUrinalysis
            ? "İdrar tahlilinde dikkat gerektiren bir veya daha fazla bulgu görüldü; sonuçlar klinik bilgilerle birlikte değerlendirilmelidir."
            : eye.detected
              ? "Göz muayenesi raporunda dikkat gerektiren bir bulgu görüldü; sonuçlar klinik bilgilerle birlikte değerlendirilmelidir."
              : special.detected
                ? "Özel test raporunda dikkat gerektiren bir bulgu görüldü; sonuçlar klinik bilgilerle birlikte değerlendirilmelidir."
                : attentionCount + " değer referans aralığı dışında görünüyor."
          : isUrinalysis
            ? "İdrar tahlilindeki kimyasal, fiziksel ve mikroskobik bulgular tarandı; belirgin pozitif bulgu görülmedi."
            : eye.detected
              ? "Göz muayenesi raporundaki dolu alanlar ve değerlendirme metinleri tarandı."
              : special.detected
                ? "Özel test raporundaki ölçümler, sonuç ve değerlendirme alanları analiz edildi."
                : hemogramCount >= 10
                  ? `Hemogramdaki ${hemogramCount} parametrenin tamamı tanımlı referans aralıklarında görünüyor.`
                  : findings.length
                    ? "Okunan değerler tanımlı referans aralıklarında görünüyor."
                    : "Metin okundu ancak tanımlı ölçüm bulunamadı.",
    findings,
    insights,
    eyeExam: eye.detected ? eye.result : undefined,
    specialTests: special.detected ? special.tests : undefined,
    highlightedText: highlightedText.length ? highlightedText : undefined,
    analyzedAt: new Date().toISOString(),
  };
}

const hemogramLabels = new Set([
  "Lökosit",
  "Lenfosit %",
  "Monosit %",
  "Nötrofil %",
  "Eozinofil %",
  "Bazofil %",
  "Lenfosit #",
  "Monosit #",
  "Nötrofil #",
  "Eozinofil #",
  "Bazofil #",
  "Hemoglobin",
  "Eritrosit",
  "Hematokrit",
  "MCV",
  "MCH",
  "MCHC",
  "RDW",
  "Trombosit",
  "MPV",
  "PDW",
  "PCT",
  "P-LCR",
]);

function buildHemogramInsights(findings: ResultFinding[]) {
  const values = new Map(findings.map((finding) => [finding.label, finding]));
  const hemogram = findings.filter((finding) => hemogramLabels.has(finding.label));
  if (hemogram.length < 10) return [];
  const insights: string[] = [];
  const abnormal = (labels: string[]) =>
    labels
      .map((label) => values.get(label))
      .filter((finding): finding is ResultFinding => Boolean(finding && finding.status !== "normal"));
  const whiteCellFindings = abnormal([
    "Lökosit",
    "Nötrofil %",
    "Nötrofil #",
    "Lenfosit %",
    "Lenfosit #",
    "Monosit %",
    "Monosit #",
    "Eozinofil %",
    "Eozinofil #",
    "Bazofil %",
    "Bazofil #",
  ]);
  const redCellFindings = abnormal(["Hemoglobin", "Eritrosit", "Hematokrit", "MCV", "MCH", "MCHC", "RDW"]);
  const plateletFindings = abnormal(["Trombosit", "MPV", "PDW", "PCT", "P-LCR"]);
  const whiteCellInsight = (() => {
    const wbc = values.get("Lökosit");
    const neutrophil = values.get("Nötrofil %") ?? values.get("Nötrofil #");
    const eosinophil = values.get("Eozinofil %") ?? values.get("Eozinofil #");
    if (wbc?.status === "high" && neutrophil?.status === "high")
      return "Lökosit ve nötrofil yüksekliği birlikte görülüyor; bu durum enfeksiyon veya inflamasyonla ilişkili olabilir ve klinik bulgularla değerlendirilmelidir.";
    if (eosinophil?.status === "high")
      return "Eozinofil yüksekliği görülüyor; alerjik durumlar ve diğer klinik nedenler açısından hekim değerlendirmesi gerekebilir.";
    return undefined;
  })();
  if (whiteCellInsight) insights.push(whiteCellInsight);
  else if (!whiteCellFindings.length)
    insights.push("Lökosit ve beyaz küre dağılımı dengeli görünüyor; belirgin bir diferansiyel sapması okunmadı.");
  else
    insights.push(
      `Beyaz küre değerlendirmesinde ${whiteCellFindings.map((finding) => finding.label).join(", ")} referans dışında görünüyor.`,
    );
  if (!redCellFindings.length)
    insights.push(
      "Hemoglobin, eritrosit, hematokrit ve eritrosit indeksleri referans aralığında; belirgin anemi paterni izlenmedi.",
    );
  else {
    const hemoglobin = values.get("Hemoglobin");
    const mcv = values.get("MCV");
    const pattern =
      hemoglobin?.status === "low" && mcv?.status === "low"
        ? "mikrositik"
        : hemoglobin?.status === "low" && mcv?.status === "high"
          ? "makrositik"
          : "karma";
    insights.push(
      `Eritrosit grubunda ${redCellFindings.map((finding) => finding.label).join(", ")} referans dışında; ${pattern} değişiklik açısından hekim değerlendirmesi önerilir.`,
    );
  }
  if (!plateletFindings.length)
    insights.push("Trombosit sayısı ve trombosit indeksleri referans aralığında görünüyor.");
  else
    insights.push(
      `Trombosit değerlendirmesinde ${plateletFindings.map((finding) => finding.label).join(", ")} referans dışında görünüyor.`,
    );
  return insights;
}

type UrinalysisInsightResult = {
  detected: boolean;
  attention: boolean;
  insights: string[];
};

const urineQualitativeParameters = [
  { label: "Eritrosit", aliases: ["eritrosit"] },
  { label: "Bilirubin", aliases: ["bilirubin", "bilirübin"] },
  { label: "Ürobilinojen", aliases: ["urobilinojen", "ürobilinojen"] },
  { label: "Keton", aliases: ["keton"] },
  { label: "Protein", aliases: ["protein"] },
  { label: "Nitrit", aliases: ["nitrit"] },
  { label: "Glukoz", aliases: ["glukoz", "glikoz"] },
  { label: "Lökosit", aliases: ["lökosit", "lokosit"] },
];

function buildUrinalysisInsights(text: string): UrinalysisInsightResult {
  const compact = text.replace(/\s+/g, " ").trim();
  const searchable = compact
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c");
  const markerCount = urineQualitativeParameters.filter(({ aliases }) =>
    aliases.some((alias) => new RegExp("(?:^|[^a-zA-Z])" + normalize(alias) + "(?![a-zA-Z])").test(searchable)),
  ).length;
  const detected = /(?:tam\s*idrar|idrar\s*tahlili|urinalysis|mikroskopi)/.test(searchable) || markerCount >= 3;
  if (!detected) return { detected: false, attention: false, insights: [] };

  const observations = urineQualitativeParameters.flatMap(({ label, aliases }) => {
    for (const alias of aliases) {
      const escaped = normalize(alias).replace(/[.*+?^\$\{\}()|[\]\\]/g, "\\$&");
      const match = searchable.match(
        new RegExp(
          "(?:^|[^a-zA-Z])" + escaped + "(?![a-zA-Z])[^a-zA-Z]{0,24}(negatif|pozitif|normal|eser|trace|\\u002b{1,4})",
        ),
      );
      if (match) return [{ label, value: match[1] }];
    }
    return [];
  });
  const attentionObservations = observations.filter(({ value }) => !["negatif", "normal"].includes(value));
  const expectedNegative = observations.filter(({ value }) => value === "negatif").map(({ label }) => label);
  const expectedNormal = observations.filter(({ value }) => value === "normal").map(({ label }) => label);
  const insights: string[] = [];
  if (expectedNegative.length) {
    insights.push(
      "Kimyasal taramada " +
        expectedNegative.join(", ") +
        " negatif görünüyor; bu parametrelerde belirgin pozitiflik okunmadı.",
    );
  }
  if (expectedNormal.length) insights.push(expectedNormal.join(", ") + " normal olarak raporlanmış.");
  if (attentionObservations.length) {
    insights.push(
      attentionObservations.map(({ label, value }) => label + ": " + value).join(", ") +
        " şeklinde dikkat gerektiren bulgu var; hekim değerlendirmesi önerilir.",
    );
    const abnormalLabels = new Set(attentionObservations.map(({ label }) => label));
    if (abnormalLabels.has("Nitrit") || abnormalLabels.has("Lökosit"))
      insights.push(
        "Nitrit veya lökosit pozitifliği idrar yolu enfeksiyonu açısından klinik değerlendirme gerektirebilir.",
      );
    if (abnormalLabels.has("Protein") || abnormalLabels.has("Eritrosit"))
      insights.push(
        "Protein veya eritrosit pozitifliği üriner sistem açısından hekim tarafından değerlendirilmelidir.",
      );
    if (abnormalLabels.has("Glukoz") || abnormalLabels.has("Keton"))
      insights.push(
        "Glukoz veya keton pozitifliği metabolik durum ve açlık/tokluk bilgisiyle birlikte değerlendirilmelidir.",
      );
  }

  const microscopy = searchable.match(
    /(?:mikroskopi[^.]{0,80})?(?:lokosit)\s*[:\-]?\s*(\d+(?:\s*[-/]\s*\d+)?)\s*(hpf|saha)?/,
  );
  if (microscopy) {
    insights.push(
      "Mikroskopide lökosit " +
        microscopy[1].replace(/\s+/g, "") +
        " " +
        (microscopy[2] ?? "HPF") +
        " olarak raporlanmış; klinik bulgularla birlikte değerlendirilmelidir.",
    );
  }
  if (!insights.length)
    insights.push(
      "İdrar tahlili parametreleri okundu; yorum için raporun tamamı ve klinik bilgiler birlikte ele alınmalıdır.",
    );
  return { detected: true, attention: attentionObservations.length > 0, insights };
}

type EyeExamInsightResult = {
  detected: boolean;
  attention: boolean;
  result?: EyeExamResult;
  insights: string[];
};

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c");
}

function extractEyeMeasurement(segment: string): EyeMeasurement {
  const measurement: EyeMeasurement = {};
  const direct = (pattern: RegExp) => segment.match(pattern)?.[1]?.trim();
  const sph = direct(/\bsph\.?\s*[:=]?\s*([+-]?\d+(?:[.,]\d+)?)/i);
  const cyl = direct(/\bcyl\.?\s*[:=]?\s*([+-]?\d+(?:[.,]\d+)?)/i);
  const axis = direct(/\b(?:ax|axis)\.?\s*[:=]?\s*(\d{1,3})/i);
  const pressure = direct(/(?:goz\s*tansiyonu|tansiyon)\s*[:=]?\s*(?!\d+\s*\/)(\d+(?:[.,]\d+)?)/i);
  const visualValues = [...segment.matchAll(/\b(\d{1,3}\s*\/\s*\d{1,3})\b/g)].map((match) =>
    match[1].replace(/\s+/g, ""),
  );
  if (sph) measurement.sph = sph;
  if (cyl) measurement.cyl = cyl;
  if (axis) measurement.axis = axis;
  if (pressure) measurement.eyePressure = pressure;
  if (visualValues[0]) measurement.visualAcuity = visualValues[0];
  if (visualValues[1]) measurement.correctedVisualAcuity = visualValues[1];

  // Bazı laboratuvar PDF'lerinde tablo önce tüm başlıkları, ardından tek satır
  // değerleri verir. Görme keskinliğinden önceki sayıları Sph/Cyl/Ax sırasıyla
  // eşleştiriyoruz; böylece dolu reçete değerleri de kaybolmuyor.
  const tokens = [...segment.matchAll(/[-+]?\d+(?:[.,]\d+)?(?:\/\d+)?/g)].map((match) => match[0]);
  const firstVisualIndex = tokens.findIndex((token) => token.includes("/"));
  if (firstVisualIndex >= 0) {
    const refraction = tokens.slice(0, firstVisualIndex).filter((token) => !token.includes("/"));
    if (!measurement.sph && refraction[0]) measurement.sph = refraction[0];
    if (!measurement.cyl && refraction[1]) measurement.cyl = refraction[1];
    if (!measurement.axis && refraction[2]) measurement.axis = refraction[2];
  }
  return measurement;
}

function cleanEyeNarrative(value: string | undefined) {
  if (!value) return undefined;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (
    /(?:ad[ıi]\s*,?\s*soyad[ıi]|tc\s*kimlik|doğum\s*tarihi|dogum\s*tarihi|cinsiyet[iı]?\s*:|protokol\s*\/?\s*işlem|protokol\s*\/?\s*islem)/i.test(
      cleaned,
    )
  )
    return undefined;
  return cleaned.length > 240 ? cleaned.slice(0, 237).trimEnd() + "…" : cleaned;
}

function extractSftNarrative(text: string) {
  const yorum = text.match(/\byorum(?!lar)\s*[:\-]?\s*([^.!?\n]{3,120})/i)?.[1]?.trim();
  const result = text.match(/sonuç\s*\/\s*tıbbi\s*rapor\s*[:\-]?\s*([^.!?\n]{3,120})/i)?.[1]?.trim();
  const value = yorum || result;
  if (!value) return undefined;
  const cleaned = value
    .replace(/\s+/g, " ")
    .split(/\b(?:PRE|Parametreler|Test\s+tarihi|İmza|Imza|Cihaz|Minispir|Kalibrasyon|Beklenen|\*Tüm|Tum)\b/i)[0]
    .trim();
  if (!cleaned || /(?:tıbbi\s+rapor|BTPS|NHANES|imza|cihaz|kalibrasyon)/i.test(cleaned)) return undefined;
  if (/normal\s+spirometri/i.test(cleaned)) return "Normal Spirometri";
  return cleaned.length > 180 ? cleaned.slice(0, 177).trimEnd() + "…" : cleaned;
}

function buildEyeExamInsights(text: string): EyeExamInsightResult {
  const normalizedText = normalizeSearchText(text).replace(/\s+/g, " ").trim();
  const detected = /(?:otorefraktometre|sph\.?|cyl\.?|goz\s+muayenesi|renk\s+korlugu|goz\s+tansiyonu)/i.test(
    normalizedText,
  );
  if (!detected) return { detected: false, attention: false, insights: [] };
  const eyeText = extractTestSection(
    text,
    [/Otorefraktometre|Göz\s+Ölçüm|Goz\s+Olcum|Göz\s+Muayenesi|Goz\s+Muayenesi/i],
    [
      /CETKA\s+EKG|EKG\s+Raporu|Radyoloji|PA\s+Akciğer|PA\s+Akciger|Akciğer\s+Fonksiyon|Akciger\s+Fonksiyon|Spirometri|\bSFT\b/i,
    ],
  );
  const searchable = normalizeSearchText(eyeText).replace(/\s+/g, " ").trim();

  const leftStart = searchable.indexOf("sol goz");
  const rightStart = searchable.indexOf("sag goz");
  const leftSegment =
    leftStart >= 0 ? searchable.slice(leftStart, rightStart > leftStart ? rightStart : undefined) : "";
  const rightSegment = rightStart >= 0 ? searchable.slice(rightStart) : "";
  const left = leftSegment ? extractEyeMeasurement(leftSegment) : undefined;
  const right = rightSegment ? extractEyeMeasurement(rightSegment) : undefined;
  const result: EyeExamResult = { left, right };
  const colorBlindness = searchable
    .match(/renk\s+korlugu\s*[:\-]?\s*(yoktur|var|[a-z ]{3,40}?)(?=sonuc|$)/i)?.[1]
    ?.trim();
  const conclusion = searchable.match(/sonuc\s*[:\-]?\s*([^.!?\n]{2,100})/i)?.[1]?.trim();
  const assessment = cleanEyeNarrative(searchable.match(/degerlendirme\s*[:\-]?\s*([^.!?\n]{3,180})/i)?.[1]);
  const diagnosis = cleanEyeNarrative(searchable.match(/(?:tanim|tani)\s*[:\-]?\s*([^.!?\n]{3,180})/i)?.[1]);
  if (colorBlindness) result.colorBlindness = colorBlindness;
  if (conclusion) result.conclusion = conclusion;
  if (assessment) result.assessment = assessment;
  if (diagnosis) result.diagnosis = diagnosis;

  const insights: string[] = [];
  const eyeSummary = (label: string, measurement?: EyeMeasurement) => {
    if (!measurement || !Object.keys(measurement).length) return;
    const values = [
      measurement.sph && "Sph " + measurement.sph,
      measurement.cyl && "Cyl " + measurement.cyl,
      measurement.axis && "Ax " + measurement.axis,
      measurement.visualAcuity && "Görme " + measurement.visualAcuity,
      measurement.correctedVisualAcuity && "Gözlüklü görme " + measurement.correctedVisualAcuity,
      measurement.eyePressure && "Göz tansiyonu " + measurement.eyePressure,
    ].filter(Boolean);
    insights.push(label + " göz: " + values.join(", ") + ".");
  };
  eyeSummary("Sol", left);
  eyeSummary("Sağ", right);
  if (colorBlindness) insights.push("Renk körlüğü: " + colorBlindness + ".");
  if (conclusion) insights.push("Sonuç: " + conclusion + ".");
  if (assessment) insights.push("Değerlendirme: " + assessment + ".");
  if (diagnosis) insights.push("Tanı: " + diagnosis + ".");
  if (!insights.length)
    insights.push("Göz muayenesi raporu algılandı; ancak okunabilir bir değer veya değerlendirme metni bulunamadı.");

  const attention = Boolean(
    (colorBlindness && !/yoktur|yok|normal/i.test(colorBlindness)) ||
    (conclusion && !/saglam|normal|uygun/i.test(conclusion)) ||
    assessment ||
    diagnosis,
  );
  return { detected: true, attention, result, insights };
}

type SpecialTestInsightResult = {
  detected: boolean;
  attention: boolean;
  tests: SpecialTestResult[];
  insights: string[];
};

function captureNarrative(text: string, labels: string[]) {
  const pattern = labels.join("|");
  const matches = [
    ...text.matchAll(
      new RegExp("(?:" + pattern + ")(?![A-Za-zÇĞİÖŞÜçğıöşü])(?!\\s*tarihi)\\s*[:\\-]?\\s*([^.!?\\n]{3,180})", "gi"),
    ),
  ];
  const candidates = matches
    .map((match) => match[1].trim().replace(/\s+/g, " "))
    .map((value) =>
      value.split(/\b(?:SFT|SPIROMETRİ|SPIROMETRI|ODYOMETRİ|ODYOMETRİK|RÖNTGEN|AKCİĞER|AKCIGER)\b/i)[0].trim(),
    )
    .filter(
      (value) =>
        value.length > 2 &&
        !/(?:numune\s+alma|protokol\s*no|kimlik\s*no|radyoloji\s*:|tarih\s*:)/i.test(value) &&
        !/(?:mevcut\s+teknik\s+olanaklar|güncel\s+tıbbi\s+bilgiler|tanı\s+amaçlı\s+değildir|klinik.*birlikte\s+değerlendirilmesi)/i.test(
          value,
        ),
    );
  return candidates.at(-1);
}

function cleanEkgNarrative(value: string | undefined) {
  if (!value) return undefined;
  const withoutMetadata = value.split(
    /(?:CETKA\s+EKG|Oluşturma\s+zamanı|Olusturma\s+zamani|\bID\s*:|\bİsim\s*:|\bIsim\s*:|\bHR\s*:|\bYorumlar\s*:)/i,
  )[0];
  const sentences = withoutMetadata
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
  return sentences.length > 360 ? sentences.slice(0, 357).trimEnd() + "…" : sentences || undefined;
}

function extractEkgConclusion(text: string) {
  const clinicalStart = text.search(/normal\s+sin[üu]s\s+ritmi|sinus\s+rhythm|normal\s+ecg/i);
  if (clinicalStart >= 0) {
    const clinicalText = text.slice(clinicalStart).split(/CETKA\s+EKG|\bID\s*:|\bYorumlar\s*:/i)[0];
    return cleanEkgNarrative(clinicalText);
  }
  const firstParagraph = text.split(/CETKA\s+EKG|Oluşturma\s+zamanı|Olusturma\s+zamani/i)[0]?.trim();
  return cleanEkgNarrative(firstParagraph);
}

function extractTestSection(text: string, startPatterns: RegExp[], endPatterns: RegExp[]) {
  const starts = startPatterns.map((pattern) => text.search(pattern)).filter((index) => index >= 0);
  if (!starts.length) return text;
  const start = Math.min(...starts);
  const remainder = text.slice(start);
  const ends = endPatterns.map((pattern) => remainder.search(pattern)).filter((index) => index > 0);
  const end = ends.length ? Math.min(...ends) : remainder.length;
  return remainder.slice(0, end);
}

function buildSpecialTestInsights(text: string, findings: ResultFinding[]): SpecialTestInsightResult {
  const searchable = normalizeSearchText(text).replace(/\s+/g, " ").trim();
  const testEndPatterns = [
    /CETKA\s+EKG|EKG\s+Raporu/i,
    /Radyoloji|PA\s+Akciğer|PA\s+Akciger|Akciğer\s+Grafisi|Akciger\s+Grafisi/i,
    /Akciğer\s+Fonksiyon\s+Test|Akciger\s+Fonksiyon\s+Test|Spirometri|\bSFT\b/i,
    /Otorefraktometre|Göz\s+Ölçüm|Goz\s+Olcum|Odyometri|İşitme\s+Testi|Isitme\s+Testi/i,
  ];
  const tests: SpecialTestResult[] = [];
  const insights: string[] = [];
  let attention = false;

  const ekgDetected = /(?:\bekg\b|sinus\s+rhythm|normal\s+ecg|qrs\s*[:=]|qt\s*\/\s*qtc)/.test(searchable);
  if (ekgDetected) {
    const ekgText = extractTestSection(
      text,
      [/CETKA\s+EKG|EKG\s+Raporu/i],
      [/Radyoloji|PA\s+Akciğer|PA\s+Akciger|Akciğer\s+Fonksiyon|Akciger\s+Fonksiyon|Spirometri|\bSFT\b/i],
    );
    const ekgSearchable = normalizeSearchText(ekgText).replace(/\s+/g, " ").trim();
    const fields: SpecialTestField[] = [];
    const ekgMeasurements: Array<[string, RegExp]> = [
      ["Kalp hızı", /\bhr\s*[:=]?\s*([0-9]+(?:[.,][0-9]+)?)\s*bpm/],
      ["PR", /\bpr\s*[:=]?\s*([0-9]+(?:[.,][0-9]+)?)\s*ms/],
      ["QRS", /\bqrs\s*[:=]?\s*([0-9]+(?:[.,][0-9]+)?)\s*ms/],
      ["QT/QTc", /\bqt\s*\/\s*qtc\s*[:=]?\s*([0-9]+\s*\/\s*[0-9]+)\s*ms/],
      ["P/QRS/T", /\bp\/qrs\/t\s*[:=]?\s*([+-]?[0-9]+\s*\/\s*[+-]?[0-9]+\s*\/\s*[+-]?[0-9]+)/],
      ["RV5/SV1", /\brv5\/sv1\s*[:=]?\s*([0-9.,]+\s*\/\s*[0-9.,]+)\s*mv/],
      ["RV5+SV1", /\brv5\+sv1\s*[:=]?\s*([0-9.,]+)\s*mv/],
    ];
    for (const [label, pattern] of ekgMeasurements) {
      const value = ekgSearchable.match(pattern)?.[1];
      if (value) fields.push({ label, value });
    }
    const conclusion = extractEkgConclusion(text) ?? cleanEkgNarrative(captureNarrative(ekgText, ["Sonuç", "Sonuc"]));
    const rawAssessment = captureNarrative(ekgText, ["Yorum", "Değerlendirme", "Degerlendirme"]);
    const assessment =
      rawAssessment &&
      rawAssessment.length <= 240 &&
      /normal|sinüs|sinus|ritim|patolojik|bulgu|klinik|sağlam|saglam/i.test(rawAssessment)
        ? rawAssessment
        : undefined;
    tests.push({ type: "EKG", fields, conclusion, assessment });
    if (conclusion) {
      const normalizedConclusion = normalizeSearchText(conclusion);
      insights.push(
        /normal\s+sinus|normal\s+ecg|patolojik\s+bulguya\s+rastlanmadi|engel\s+bulunmamaktadir/.test(
          normalizedConclusion,
        )
          ? "EKG özeti: Sinüs ritmi ve normal ECG bulgusu raporlanmış; majör patolojik bulgu belirtilmemiş."
          : "EKG sonucu: " + conclusion + ".",
      );
    }
    if (assessment) insights.push("EKG yorumu: " + assessment + ".");
    if (
      conclusion &&
      !/normal|sinüs|sinus|patolojik bulguya rastlanmadı|patolojik bulguya rastlanmadi|engel bulunmamaktadır|engel bulunmamaktadir/i.test(
        conclusion,
      )
    )
      attention = true;
  }

  const hearingDetected = /(?:isitme\s*testi|odyometri|audiometri|saf\s*ses|hava\s*yolu|kemik\s*yolu)/.test(searchable);
  if (hearingDetected) {
    const hearingText = extractTestSection(text, [/Odyometri|İşitme\s+Testi|Isitme\s+Testi/i], testEndPatterns);
    const hearingSearchable = normalizeSearchText(hearingText).replace(/\s+/g, " ").trim();
    const fields: SpecialTestField[] = [];
    const hearingMeasurements = [
      ...hearingSearchable.matchAll(/(sag|sol)\s*(?:kulak)?[^0-9]{0,45}([+-]?\d+(?:[.,]\d+)?)\s*(db|hz)/g),
    ];
    hearingMeasurements.forEach((match) =>
      fields.push({ label: (match[1] === "sag" ? "Sağ" : "Sol") + " ölçüm", value: match[2] + " " + match[3] }),
    );
    const pathwayMeasurements = [
      ...hearingSearchable.matchAll(/(hava\s*yolu|kemik\s*yolu)[^0-9]{0,45}([+-]?\d+(?:[.,]\d+)?)\s*(db|hz)/g),
    ];
    pathwayMeasurements.forEach((match) => fields.push({ label: match[1], value: match[2] + " " + match[3] }));
    const hearingLoss = hearingSearchable
      .match(/(?:isitme\s*kaybi|kayip)[^0-9]{0,30}([a-z0-9çğıöşü +%.-]{2,40})/i)?.[1]
      ?.trim();
    if (hearingLoss) fields.push({ label: "İşitme kaybı", value: hearingLoss });
    const conclusion = captureNarrative(hearingText, ["Sonuç", "Sonuc"]);
    const assessment = captureNarrative(hearingText, ["Değerlendirme", "Degerlendirme"]);
    const test: SpecialTestResult = { type: "İşitme testi", fields, conclusion, assessment };
    tests.push(test);
    if (conclusion) insights.push("İşitme testi sonucu: " + conclusion + ".");
    if (assessment) insights.push("İşitme testi değerlendirmesi: " + assessment + ".");
    if (hearingLoss && !/yok|normal|sağlam/i.test(hearingLoss)) attention = true;
  }

  const xrayDetected = /(?:rontgen|akciğer\s*grafisi|akciger\s*grafisi|thorax|toraks|pa\s*akciğer|pa\s*akciger)/.test(
    searchable,
  );
  if (xrayDetected) {
    const xrayText = extractTestSection(
      text,
      [/Radyoloji|PA\s+Akciğer|PA\s+Akciger|Akciğer\s+Grafisi|Akciger\s+Grafisi/i],
      testEndPatterns,
    );
    const xraySearchable = normalizeSearchText(xrayText).replace(/\s+/g, " ").trim();
    const fields: SpecialTestField[] = [];
    const projection = xraySearchable.match(/(?:pa|ap|lateral)\s*(?:akciger|akciğer|toraks|thorax)?/i)?.[0]?.trim();
    if (projection) fields.push({ label: "Çekim", value: projection });
    const conclusion = captureNarrative(xrayText, ["Sonuç", "Sonuc", "Rapor sonucu"]);
    const assessment = captureNarrative(xrayText, ["Değerlendirme", "Degerlendirme", "Bulgular", "Bulgu"]);
    const test: SpecialTestResult = { type: "Röntgen", fields, conclusion, assessment };
    tests.push(test);
    if (conclusion) {
      const normalizedConclusion = normalizeSearchText(conclusion);
      insights.push(
        /normal\s+sinirlarda|normal\s+akciger/.test(normalizedConclusion)
          ? "Röntgen özeti: Akciğer grafisi normal sınırlarda raporlanmış."
          : "Röntgen sonucu: " + conclusion + ".",
      );
    }
    if (assessment) insights.push("Röntgen değerlendirmesi: " + assessment + ".");
    if ((conclusion && !/normal|sağlam|saglam|patoloji yok|doğal|dogal/i.test(conclusion)) || assessment)
      attention = true;
  }

  const sftDetected = /(?:\bsft\b|spirometri|solunum\s*fonksiyon|fev1|fvc|pef|fef\s*25)/.test(searchable);
  if (sftDetected) {
    const sftText = extractTestSection(
      text,
      [/Akciğer\s+Fonksiyon\s+Test|Akciger\s+Fonksiyon\s+Test|Spirometri|\bSFT\b/i],
      testEndPatterns,
    );
    const sftSearchable = normalizeSearchText(sftText).replace(/\s+/g, " ").trim();
    const fields: SpecialTestField[] = [];
    const sftRows: Array<[string, RegExp, string]> = [
      ["FVC", /(?:^|\s)fvc\s+l\s+([\s\S]*?)(?=\s+fev1\s+l\b)/g, "L"],
      ["FEV1", /(?:^|\s)fev1\s+l\s+([\s\S]*?)(?=\s+fev1\/fvc\s+%)/g, "L"],
      ["FEV1/FVC", /(?:^|\s)fev1\/fvc\s+%\s+([\s\S]*?)(?=\s+pef\s+l\/s\b)/g, "%"],
      ["PEF", /(?:^|\s)pef\s+l\/s\s+([\s\S]*?)(?=\s+fef2575\s+l\/s\b)/g, "L/s"],
      ["FEF25-75", /(?:^|\s)fef2575\s+l\/s\s+([\s\S]*?)(?=\s+fet\s+s\b)/g, "L/s"],
    ];
    for (const [label, rowPattern, unit] of sftRows) {
      const matches = [...sftSearchable.matchAll(rowPattern)];
      const row = matches.at(-1)?.[1];
      const numbers = row?.match(/[+-]?\d+(?:[.,]\d+)?/g);
      // SFT tablolarında sütun sırası LLN, Beklenen, Best şeklindedir.
      const best = numbers?.[2] ?? numbers?.[0];
      if (best) fields.push({ label, value: best + " " + unit });
    }
    if (!fields.some((field) => field.label === "FEF25-75")) {
      const fefRow = sftSearchable.match(/fef2575\s+l\/s\s+([\s\S]{0,100})/)?.[1];
      const fefBest = fefRow?.match(/[+-]?\d+(?:[.,]\d+)?/g)?.[2];
      if (fefBest) fields.push({ label: "FEF25-75", value: fefBest + " L/s" });
    }
    if (!fields.length) {
      const fallback = findings.filter((finding) => ["FEV1/FVC", "PEF", "FEF25-75"].includes(finding.label));
      fields.push(...fallback.map((finding) => ({ label: finding.label, value: finding.value + " " + finding.unit })));
    }
    const conclusion = extractSftNarrative(sftText) ?? captureNarrative(sftText, ["Değerlendirme", "Degerlendirme"]);
    const assessment = undefined;
    const test: SpecialTestResult = { type: "SFT / Spirometri", fields, conclusion, assessment };
    tests.push(test);
    if (fields.length)
      insights.push(
        "SFT özeti: " +
          fields.map((field) => field.label + " " + field.value).join(", ") +
          " değerleri rapordan ayrıştırıldı.",
      );
    if (conclusion) insights.push("SFT sonucu: " + conclusion + ".");
    if (assessment) insights.push("SFT değerlendirmesi: " + assessment + ".");
    if (
      fields.some(
        (field) =>
          field.label === "FEV1/FVC" && findings.find((finding) => finding.label === "FEV1/FVC")?.status !== "normal",
      )
    )
      attention = true;
  }

  return { detected: tests.length > 0, attention, tests, insights };
}

export function detectScreeningType(text: string): ScreeningType {
  const normalized = normalize(text);
  if (normalized.includes("isegirismuayenesi") || normalized.includes("isegirismuayene")) return "İşe giriş muayenesi";
  if (normalized.includes("periyodiksaglik") || normalized.includes("periyodikmuayene"))
    return "Periyodik sağlık taraması";
  return "Diğer";
}

export function extractEmployeeProfile(text: string, name: string): ParsedEmployeeProfile {
  const profile: ParsedEmployeeProfile = { name };
  const birthStart = text.search(/doğum\s+(?:yeri\s+ve\s+)?tarihi|dogum\s+(?:yeri\s+ve\s+)?tarihi/i);
  const dateCandidates = [...text.matchAll(/\b(\d{1,2}[./-]\d{1,2}[./-]\d{4})\b/g)].map((match) => match[1]);
  const labeledBirthDate =
    birthStart >= 0
      ? text.slice(birthStart, birthStart + 700).match(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/)?.[0]
      : undefined;
  // Bazı PDF'lerde alan başlıkları görsel olarak doğru görünse de font kodlaması
  // nedeniyle metin katmanında eşleşmez. Bu durumda yetişkin doğum tarihi
  // olabilecek ilk eski tarihi güvenli bir geri dönüş olarak kullanıyoruz.
  const birthDate =
    labeledBirthDate ??
    dateCandidates.find((date) => {
      const year = Number(date.split(/[./-]/).at(-1));
      return year >= 1900 && year <= new Date().getFullYear() - 10;
    });
  const gender = text.match(/(?:Cinsiyeti|Cinsiyet)\s*([A-Za-zÇĞİÖŞÜçğıöşü]+)/i)?.[1];
  const phone = (
    text.match(/(?:Tel\s*No\s*\/\s*E-Posta|Telefon|Tel\s*No)[^0-9+]{0,80}(\+?\d[\d\s()-]{8,})/i)?.[1] ??
    text.match(/\b\d{3}\s\d{3}\s\d{2}\s\d{2}\b/)?.[0]
  )
    ?.replace(/\s+/g, " ")
    .trim();
  const email = text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0];
  const position = text
    .match(/\b([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s]{3,})\s+Daha\s+Önce\s+Çalıştığı\s+Yerler/i)?.[1]
    ?.replace(/\s+/g, " ")
    .trim();
  const rawDepartment = text
    .match(/(?:Çalıştığı\s+Bölüm|Calistigi\s+Bolum)\s*[:\-]?\s*([A-Za-zÇĞİÖŞÜçğıöşü0-9 /.-]{2,40})/i)?.[1]
    ?.trim();
  const department = rawDepartment && !/\d|Daha\s+Önce/i.test(rawDepartment) ? rawDepartment : undefined;
  if (birthDate) profile.birthDate = birthDate;
  if (gender) profile.gender = gender;
  if (phone) profile.phone = phone;
  if (email) profile.email = email;
  if (position) profile.position = position;
  if (department && !/^daha önce/i.test(department)) profile.department = department;
  return profile;
}

export function normalizeResultText(value: string) {
  return normalize(value);
}

export function createResultId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
