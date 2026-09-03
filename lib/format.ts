const monthShort = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

/** Turkish currency without decimals, e.g. "₺86.800". */
export const money = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value);

/** ISO date (yyyy-mm-dd) → display label "02 Eyl 2026". Returns "" for empty input. */
export function isoToLabel(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  const index = Number(month) - 1;
  return year && day && monthShort[index] ? `${day.padStart(2, "0")} ${monthShort[index]} ${year}` : value;
}

/** Display label "02 Eyl 2026" → ISO date (yyyy-mm-dd). Returns "" if it can't be parsed. */
export function labelToIso(value: string) {
  const match = value.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  if (!match) return "";
  const month = monthShort.indexOf(match[2]) + 1;
  return month ? `${match[3]}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}` : "";
}

/** ISO date → long label "02 Eylül 2026". */
export function isoToLongLabel(value: string, fallback = "Tarih seçilmedi") {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(`${value}T12:00:00`),
  );
}

/** Today's date as ISO (local time). */
export function todayIso(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "02 Eylül 2026, Çarşamba" */
export function longDateWithWeekday(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric", weekday: "long" }).format(
    date,
  );
}

export function greeting(date: Date) {
  const hour = date.getHours();
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}
