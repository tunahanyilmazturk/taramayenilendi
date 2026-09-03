import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** First letters of the first two words, e.g. "Artemis Otomotiv A.Ş." → "AO". */
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR") ?? "")
    .join("");
}

export function includesQuery(haystack: string, query: string) {
  return haystack.toLocaleLowerCase("tr-TR").includes(query.trim().toLocaleLowerCase("tr-TR"));
}

export function compareTr(a: string | number, b: string | number) {
  return typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "tr");
}

/** Slices a 1-based page window (max `size` items) around the current page. */
export function pageWindow(page: number, pageCount: number, size = 5) {
  const start = Math.max(1, Math.min(page - Math.floor(size / 2), pageCount - size + 1));
  return Array.from({ length: Math.min(size, pageCount) }, (_, index) => start + index);
}
