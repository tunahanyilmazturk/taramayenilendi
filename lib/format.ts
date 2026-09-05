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
  if (!value) return "";
  const text = value.trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  const numeric = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  const label = text.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  const year = Number(iso?.[1] ?? numeric?.[3] ?? label?.[3]);
  const month = iso ? Number(iso[2]) : numeric ? Number(numeric[2]) : label ? monthShort.indexOf(label[2]) + 1 : 0;
  const day = Number(iso?.[3] ?? numeric?.[1] ?? label?.[1]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** ISO date → long label "02 Eylül 2026". */
export function isoToLongLabel(value: string, fallback = "Tarih seçilmedi") {
  const iso = labelToIso(value);
  if (!iso) return fallback;
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(`${iso}T12:00:00`),
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
