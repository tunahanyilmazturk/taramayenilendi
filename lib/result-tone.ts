export type ResultTone = "normal" | "attention" | "neutral";

const ranges: Array<[string, number, number]> = [
  ["glukoz (açlık)", 70, 105], ["hba1c", 4, 6.1], ["hemogram / wbc", 3.91, 10.9], ["hemogram / lymph#", 1.26, 3.35], ["hemogram / lymp#", 1.26, 3.35], ["hemogram / mon#", 0.25, 0.95], ["hemogram / neu#", 1.8, 6.98], ["hemogram / eos#", 0.01, 0.59], ["hemogram / bas#", 0, 0.06], ["hemogram / hgb", 13.5, 16.9],
  ["hemogram / hct", 40, 50], ["hemogram / plt", 100, 390], ["hemogram / mcv", 81.8, 98], ["hemogram / mch", 27, 32.3],
  ["hemogram / mchc", 31.8, 35], ["hemogram / rdw-cv", 12, 14.3], ["hemogram / lym%", 18.3, 47.9], ["hemogram / mon%", 4.2, 15.2], ["hemogram / neu%", 41, 74.3], ["hemogram / eos%", 0.2, 7.6], ["hemogram / bas%", 0, 1], ["hemogram / mpv", 9.1, 12.1], ["hemogram / pdw", 9.9, 16.1],
  ["hemogram / pct", 0.18, 0.39], ["hemogram / p-lcr", 17.5, 42.3], ["biyokimya / kreatinin", 0.72, 1.25],
  ["biyokimya / ast", 5, 34], ["biyokimya / alt", 0, 55], ["biyokimya / ggt", 12, 64], ["biyokimya / üre", 17.9, 54.9],
];

export function resultTone(header: string, value: string): ResultTone {
  const text = value.trim().toLocaleLowerCase("tr-TR");
  if (!text) return "neutral";
  if (/\b(yüksek|yüksekliği|düşük|pozitif|reaktif|anormal|işitme kaybı|fraktür|restriktif|obstriks|kontrol gerekli)\b/i.test(text)) return "attention";
  if (/\b(normal|negatif|uygun|sağlam|nonreaktif|tespit edilmedi)\b/i.test(text)) return "normal";
  const normalizedHeader = header.trim().toLocaleLowerCase("tr-TR");
  const range = ranges.find(([name]) => normalizedHeader.includes(name));
  if (!range) return "neutral";
  const number = Number(text.match(/-?(?:\d+(?:[.,]\d+)?|[.,]\d+)/)?.[0]?.replace(",", "."));
  if (!Number.isFinite(number)) return "neutral";
  return number >= range[1] && number <= range[2] ? "normal" : "attention";
}
