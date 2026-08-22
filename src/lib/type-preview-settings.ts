/**
 * Tuning model for the native typography studio at /type-preview/.
 *
 * One manifest drives everything: the control panel renders from it, the
 * preview applies it as CSS custom properties, and the exported settings file
 * is keyed by it. Adding a control means adding one entry here.
 *
 * Sizes and gaps are expressed in `cqw` — a share of the invitation's own
 * width. Both Canva reference mocks scale by width to within ~2%, so one
 * width-tied system holds from a 320px phone to the 540px desktop card, and
 * the only thing that genuinely differs between them is where the block sits
 * vertically.
 */

export const SETTINGS_VERSION = 1;
export const SETTINGS_STORAGE_KEY = "eandl.type-preview.settings:v1";
export const PRESETS_STORAGE_KEY = "eandl.type-preview.presets:v1";

export type ControlGroupId =
  "position" | "size" | "script" | "date" | "material" | "functional" | "fonts";

export interface ControlGroup {
  id: ControlGroupId;
  /** Plain-English section heading shown in the panel. */
  title: string;
  /** One line telling a non-developer what this section is for. */
  blurb: string;
}

export const CONTROL_GROUPS: readonly ControlGroup[] = [
  {
    id: "position",
    title: "Position & spacing",
    blurb: "Where the wording sits on the invitation, and how much room each part gets.",
  },
  {
    id: "size",
    title: "Text size",
    blurb: "How large each line of the invitation is.",
  },
  {
    id: "script",
    title: "Handwritten words",
    blurb: "Fine-tune the handwritten words that join the printed ones.",
  },
  { id: "date", title: "Date", blurb: "How the three parts of the date sit together." },
  {
    id: "material",
    title: "Video visibility & invitation background",
    blurb: "How much of the Ocean Pavilion film shows through the invitation.",
  },
  {
    id: "functional",
    title: "Countdown & calendar",
    blurb: "Where the timer and the Save to Calendar button sit.",
  },
  {
    id: "fonts",
    title: "Lettering style",
    blurb: "Which lettering the preview uses while the final fonts are unavailable.",
  },
];

export interface SliderControl {
  kind: "slider";
  id: string;
  group: ControlGroupId;
  /** Plain-English title — never a CSS property name. */
  label: string;
  /** One-line explanation written for a non-developer. */
  help: string;
  cssVar: string;
  min: number;
  max: number;
  step: number;
  /** Appended when writing the CSS custom property. */
  unit: string;
  /** Default, and what "reset" returns to. */
  value: number;
  /** Human-facing readout suffix, e.g. "%" — omitted when a bare number reads better. */
  display?: string;
}

export interface ChoiceControl {
  kind: "choice";
  id: string;
  group: ControlGroupId;
  label: string;
  help: string;
  cssVar: string;
  value: string;
  options: readonly { value: string; label: string }[];
}

export type Control = SliderControl | ChoiceControl;

/**
 * Baselines reconstructed from the two Canva mocks.
 *
 * Measured from the reference bounding boxes in the brief: on the 540x756
 * mock the names cap-height is 31px (5.74% of width) and on the 390x884 mock
 * it is 22px (5.64%) — the same system at two sizes. Font sizes below are
 * those cap-heights divided by the fallback face's cap-height ratio, then
 * checked against the overlay.
 */
export const CONTROLS: readonly Control[] = [
  /* ------------------------------------------------------ position */
  {
    kind: "slider",
    id: "desktopY",
    group: "position",
    label: "Move all invitation text up / down (desktop)",
    help: "Moves the whole block of wording higher or lower on the portrait invitation shown on a computer. Does not change its size.",
    cssVar: "--tp-desktop-y",
    min: 5,
    max: 60,
    step: 0.5,
    unit: "%",
    value: 24.03,
    display: "%",
  },
  {
    kind: "slider",
    id: "mobileY",
    group: "position",
    label: "Move all invitation text up / down (phone)",
    help: "The same thing on a phone, where the invitation is taller and fills the screen.",
    cssVar: "--tp-mobile-y",
    min: 5,
    max: 70,
    step: 0.5,
    unit: "%",
    value: 36.45,
    display: "%",
  },
  {
    kind: "slider",
    id: "inset",
    group: "position",
    label: "Move text left / right",
    help: "Changes how far in from the left edge the wording starts.",
    cssVar: "--tp-inset",
    min: 0,
    max: 30,
    step: 0.25,
    unit: "%",
    value: 10.2,
    display: "%",
  },
  {
    kind: "slider",
    id: "gapCueNames",
    group: "position",
    label: "Space between Save the Date and names",
    help: "Changes the amount of empty space before EMILY and LAWRENCE.",
    cssVar: "--tp-gap-cue-names",
    min: 0,
    max: 25,
    step: 0.2,
    unit: "cqw",
    value: 5.75,
  },
  {
    kind: "slider",
    id: "gapNamesDate",
    group: "position",
    label: "Space between names and date",
    help: "Changes the gap below EMILY and LAWRENCE.",
    cssVar: "--tp-gap-names-date",
    min: 0,
    max: 25,
    step: 0.2,
    unit: "cqw",
    value: 3.15,
  },
  {
    kind: "slider",
    id: "gapDateVenue",
    group: "position",
    label: "Space between date and venue",
    help: "Changes the gap between 24 10 2027 and Shangri-La Mactan.",
    cssVar: "--tp-gap-date-venue",
    min: 0,
    max: 20,
    step: 0.2,
    unit: "cqw",
    value: 1.52,
  },
  {
    kind: "slider",
    id: "gapVenueLines",
    group: "position",
    label: "Space between venue lines",
    help: "Changes the space between Shangri-La Mactan and CEBU, PHILIPPINES.",
    cssVar: "--tp-gap-venue-lines",
    min: 0,
    max: 12,
    step: 0.1,
    unit: "cqw",
    value: 0.26,
  },
  {
    kind: "slider",
    id: "gapBeforeNote",
    group: "position",
    label: "Space before Formal invitation to follow",
    help: "Changes the breathing room before the handwritten final line.",
    cssVar: "--tp-gap-before-note",
    min: 0,
    max: 25,
    step: 0.2,
    unit: "cqw",
    value: 7.06,
  },

  /* ---------------------------------------------------------- size */
  {
    kind: "slider",
    id: "sizeCue",
    group: "size",
    label: "Save the Date size",
    help: "Makes the SAVE the DATE lockup larger or smaller.",
    cssVar: "--tp-size-cue",
    min: 2,
    max: 12,
    step: 0.05,
    unit: "cqw",
    value: 6.75,
  },
  {
    kind: "slider",
    id: "sizeNames",
    group: "size",
    label: "Names size",
    help: "Makes EMILY and LAWRENCE larger or smaller. This is the main headline.",
    cssVar: "--tp-size-names",
    min: 4,
    max: 16,
    step: 0.05,
    unit: "cqw",
    value: 10.6,
  },
  {
    kind: "slider",
    id: "sizeDate",
    group: "size",
    label: "Date size",
    help: "Changes the size of 24 10 2027.",
    cssVar: "--tp-size-date",
    min: 3,
    max: 14,
    step: 0.05,
    unit: "cqw",
    value: 8.6,
  },
  {
    kind: "slider",
    id: "sizeVenue",
    group: "size",
    label: "Venue size",
    help: "Changes Shangri-La Mactan.",
    cssVar: "--tp-size-venue",
    min: 2,
    max: 10,
    step: 0.05,
    unit: "cqw",
    value: 6.05,
  },
  {
    kind: "slider",
    id: "sizeLocation",
    group: "size",
    label: "Location size",
    help: "Changes CEBU, PHILIPPINES.",
    cssVar: "--tp-size-location",
    min: 2,
    max: 10,
    step: 0.05,
    unit: "cqw",
    value: 6,
  },
  {
    kind: "slider",
    id: "sizeNote",
    group: "size",
    label: "Formal note size",
    help: "Changes the handwritten Formal invitation to follow line.",
    cssVar: "--tp-size-note",
    min: 2,
    max: 12,
    step: 0.05,
    unit: "cqw",
    value: 5,
  },
  {
    kind: "slider",
    id: "tracking",
    group: "size",
    label: "Letter spacing",
    help: "Spreads the capital letters further apart or pulls them tighter together.",
    cssVar: "--tp-tracking",
    min: -0.04,
    max: 0.2,
    step: 0.002,
    unit: "em",
    value: 0.012,
  },

  /* -------------------------------------------------------- script */
  {
    kind: "slider",
    id: "theSize",
    group: "script",
    label: "Size of “the”",
    help: "Changes only the handwritten word “the” inside SAVE the DATE.",
    cssVar: "--tp-the-size",
    min: 0.4,
    max: 2.2,
    step: 0.01,
    unit: "em",
    value: 1.12,
    display: "×",
  },
  {
    kind: "slider",
    id: "theX",
    group: "script",
    label: "Move “the” left / right",
    help: "Fine-tunes how the handwritten word sits between SAVE and DATE.",
    cssVar: "--tp-the-x",
    min: -1,
    max: 1,
    step: 0.01,
    unit: "em",
    value: 0,
  },
  {
    kind: "slider",
    id: "theY",
    group: "script",
    label: "Move “the” up / down",
    help: "Moves the handwritten word vertically without moving SAVE or DATE.",
    cssVar: "--tp-the-y",
    min: -0.8,
    max: 0.8,
    step: 0.01,
    unit: "em",
    value: -0.04,
  },
  {
    kind: "slider",
    id: "andSize",
    group: "script",
    label: "Size of “and”",
    help: "Changes only the handwritten word between EMILY and LAWRENCE.",
    cssVar: "--tp-and-size",
    min: 0.4,
    max: 2.2,
    step: 0.01,
    unit: "em",
    value: 0.92,
    display: "×",
  },
  {
    kind: "slider",
    id: "andX",
    group: "script",
    label: "Move “and” left / right",
    help: "Adjusts how tightly the handwritten word connects the two names.",
    cssVar: "--tp-and-x",
    min: -1,
    max: 1,
    step: 0.01,
    unit: "em",
    value: 0,
  },
  {
    kind: "slider",
    id: "andY",
    group: "script",
    label: "Move “and” up / down",
    help: "Adjusts its vertical position between the names.",
    cssVar: "--tp-and-y",
    min: -0.8,
    max: 0.8,
    step: 0.01,
    unit: "em",
    value: -0.02,
  },

  /* ---------------------------------------------------------- date */
  {
    kind: "slider",
    id: "dateGap",
    group: "date",
    label: "Space between 24, 10 and 2027",
    help: "Makes the three parts of the date feel more tightly grouped or more spread out.",
    cssVar: "--tp-date-gap",
    min: 0,
    max: 1.6,
    step: 0.01,
    unit: "em",
    value: 0.85,
  },

  /* ------------------------------------------------------ material */
  {
    kind: "slider",
    id: "invitationStrength",
    group: "material",
    label: "Invitation background strength",
    help: "How solid the frosted invitation looks. Lower reveals more of the Ocean Pavilion film. Higher makes it cleaner and more paper-like.",
    cssVar: "--tp-invitation-alpha",
    min: 0,
    max: 1,
    step: 0.01,
    unit: "",
    value: 0.76,
  },
  {
    kind: "slider",
    id: "textVeil",
    group: "material",
    label: "Text background strength",
    help: "The extra soft layer directly behind the wording. Lower lets more film show through the text. Higher makes the wording easier to read.",
    cssVar: "--tp-text-veil",
    min: 0,
    max: 1,
    step: 0.01,
    unit: "",
    value: 0.18,
  },
  {
    kind: "slider",
    id: "blur",
    group: "material",
    label: "Frost / blur strength",
    help: "How blurred the film looks through the invitation. Lower feels clearer and glass-like. Higher feels softer and more frosted.",
    cssVar: "--tp-blur",
    min: 0,
    max: 48,
    step: 1,
    unit: "px",
    value: 20,
    display: "px",
  },
  {
    kind: "slider",
    id: "wash",
    group: "material",
    label: "Background darkness",
    help: "Makes the moving film behind the invitation lighter or darker. The video file itself is not changed.",
    cssVar: "--tp-wash",
    min: 0,
    max: 1,
    step: 0.01,
    unit: "",
    value: 0.46,
  },

  /* ---------------------------------------------------- functional */
  {
    kind: "slider",
    id: "zoneY",
    group: "functional",
    label: "Move countdown and button together",
    help: "Moves the whole functional section — timer and button — up or down as one.",
    cssVar: "--tp-zone-y",
    min: -30,
    max: 15,
    step: 0.5,
    unit: "%",
    value: 0,
    display: "%",
  },
  {
    kind: "slider",
    id: "countdownY",
    group: "functional",
    label: "Move countdown up / down",
    help: "Moves the countdown on its own, without moving the main invitation wording.",
    cssVar: "--tp-countdown-y",
    min: -12,
    max: 12,
    step: 0.2,
    unit: "cqw",
    value: 0,
  },
  {
    kind: "slider",
    id: "gapCountdownCta",
    group: "functional",
    label: "Space between countdown and Save to Calendar",
    help: "Controls the gap between the timer and the button.",
    cssVar: "--tp-gap-countdown-cta",
    min: 0,
    max: 15,
    step: 0.2,
    unit: "cqw",
    value: 3.3,
  },

  /* --------------------------------------------------------- fonts */
  {
    kind: "choice",
    id: "displayFont",
    group: "fonts",
    label: "Printed lettering",
    help: "Stands in for The Seasons, which is a commercial font and is not installed. Pick whichever looks closest.",
    cssVar: "--tp-font-display",
    value: '"Instrument Serif", Georgia, serif',
    options: [
      { value: '"Instrument Serif", Georgia, serif', label: "Instrument Serif (closest)" },
      { value: "Georgia, 'Times New Roman', serif", label: "Georgia" },
      { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
    ],
  },
  {
    kind: "choice",
    id: "scriptFont",
    group: "fonts",
    label: "Handwritten lettering",
    help: "Stands in for Above the Beyond Script, which is also commercial and not installed.",
    cssVar: "--tp-font-script",
    value: '"Parisienne", cursive',
    options: [
      { value: '"Parisienne", cursive', label: "Parisienne (closest)" },
      { value: '"Corinthia", cursive', label: "Corinthia" },
      { value: '"MonteCarlo", cursive', label: "MonteCarlo" },
      { value: '"Sirivennela", cursive', label: "Sirivennela" },
    ],
  },
];

export type Settings = Record<string, number | string>;

/** The Canva-derived starting point, and what "reset everything" returns to. */
export function defaultSettings(): Settings {
  const out: Settings = {};
  for (const control of CONTROLS) out[control.id] = control.value;
  return out;
}

function controlById(id: string): Control | undefined {
  return CONTROLS.find((control) => control.id === id);
}

/**
 * Accepts anything (a pasted file, an older save, a hand-edited export) and
 * returns a settings object that is safe to apply: unknown keys dropped,
 * numbers clamped to their slider range, choices restricted to real options,
 * anything missing filled from the Canva baseline.
 */
export function coerceSettings(input: unknown): Settings {
  const base = defaultSettings();
  if (typeof input !== "object" || input === null) return base;

  const raw = input as Record<string, unknown>;
  const source =
    typeof raw.settings === "object" && raw.settings !== null
      ? (raw.settings as Record<string, unknown>)
      : raw;

  for (const [id, value] of Object.entries(source)) {
    const control = controlById(id);
    if (!control) continue;

    if (control.kind === "slider") {
      const numeric = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(numeric)) continue;
      base[id] = Math.min(control.max, Math.max(control.min, numeric));
    } else if (control.options.some((option) => option.value === value)) {
      base[id] = value as string;
    }
  }

  return base;
}

/** The value written to a CSS custom property, including its unit. */
export function cssValue(control: Control, settings: Settings): string {
  const value = settings[control.id] ?? control.value;
  if (control.kind === "choice") return String(value);
  return `${value}${control.unit}`;
}

export interface ExportedSettings {
  version: number;
  exportedAt: string;
  note: string;
  settings: Settings;
}

export function exportPayload(settings: Settings, now: Date = new Date()): ExportedSettings {
  return {
    version: SETTINGS_VERSION,
    exportedAt: now.toISOString(),
    note: "Approved Save the Date composition from /type-preview/. Sizes and gaps are a percentage of the invitation's own width (cqw).",
    settings: coerceSettings(settings),
  };
}

/**
 * Readability guide for the transparency controls.
 *
 * Composites the paper colour over a backdrop luminance at the current
 * invitation and veil strengths, then returns the contrast ratio against the
 * ink. The caller passes the *dark* end of the current film frame rather than
 * its average, because near-black wording fails over the film's shadows, not
 * over its bright water.
 *
 * Deliberately advisory: it never changes the user's values, it only tells
 * them when the wording is likely to be hard to read.
 */
export function estimateContrast(
  backdropLuminance: number,
  invitationStrength: number,
  textVeil: number,
): number {
  const paperLuminance = 0.86; // relative luminance of the warm off-white paper
  const inkLuminance = 0.012; // relative luminance of the near-black ink

  // Two translucent layers over the film: the invitation surface, then the veil.
  const afterSurface =
    backdropLuminance * (1 - invitationStrength) + paperLuminance * invitationStrength;
  const effective = afterSurface * (1 - textVeil) + paperLuminance * textVeil;

  const lighter = Math.max(effective, inkLuminance);
  const darker = Math.min(effective, inkLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export const CONTRAST_FLOOR = 4.5;
