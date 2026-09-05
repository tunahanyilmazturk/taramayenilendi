const legacyGreenToBlue: Record<string, string> = {
  "#299b7c": "#256da8",
  "#1f8068": "#1b568a",
  "#103c3a": "#123d56",
  "#174e4b": "#1b5269",
  "#3fb593": "#58a6df",
  "#a7f3d0": "#b5dcf6",
};

/** Keeps saved organization colors compatible with the current blue PDF theme. */
export function resolvePdfBrandColor(value: string | undefined, fallback: string) {
  const normalized = value?.trim().toLowerCase();
  return (normalized && legacyGreenToBlue[normalized]) || value || fallback;
}
