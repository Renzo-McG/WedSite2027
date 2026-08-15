export const DISPLAY_FONT_IDS = ["sirivennela", "montecarlo", "corinthia", "parisienne"] as const;

export type DisplayFontId = (typeof DISPLAY_FONT_IDS)[number];

export const DEFAULT_DISPLAY_FONT: DisplayFontId = "sirivennela";

export function isDisplayFontId(value: string | null): value is DisplayFontId {
  return DISPLAY_FONT_IDS.some((candidate) => candidate === value);
}

/** Invalid or absent query values safely use the provisional default. */
export function displayFontFromSearch(search: string): DisplayFontId {
  const candidate = new URLSearchParams(search).get("type");
  return isDisplayFontId(candidate) ? candidate : DEFAULT_DISPLAY_FONT;
}
