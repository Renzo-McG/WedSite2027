export type ExperiencePhase =
  | "sealed"
  | "engaging"
  | "aligning"
  | "unlocking"
  | "seam-release"
  | "aperture-opening"
  | "venue-hold"
  | "material-revealing"
  | "material-settling"
  | "content-revealing"
  | "composed"
  | "calendar-cue"
  | "calendar-opening"
  | "calendar-open"
  | "calendar-closing"
  | "reseal-softening"
  | "reseal-panels"
  | "reseal-seam"
  | "reseal-locking";

export interface ExperienceStep {
  phase: ExperiencePhase;
  /** Absolute milliseconds from the initiating visitor action. */
  at: number;
}

export const OPEN_SEQUENCE: readonly ExperienceStep[] = [
  { phase: "engaging", at: 0 },
  { phase: "aligning", at: 170 },
  { phase: "unlocking", at: 520 },
  { phase: "seam-release", at: 760 },
  { phase: "aperture-opening", at: 980 },
  { phase: "venue-hold", at: 2400 },
  { phase: "material-revealing", at: 5900 },
  { phase: "material-settling", at: 6950 },
  { phase: "content-revealing", at: 7250 },
  { phase: "composed", at: 9650 },
];

export const RESEAL_SEQUENCE: readonly ExperienceStep[] = [
  { phase: "reseal-softening", at: 0 },
  { phase: "reseal-panels", at: 180 },
  { phase: "reseal-seam", at: 1360 },
  { phase: "reseal-locking", at: 1510 },
  { phase: "sealed", at: 1720 },
];

export const REDUCED_OPEN_SEQUENCE: readonly ExperienceStep[] = [
  { phase: "engaging", at: 0 },
  { phase: "venue-hold", at: 70 },
  { phase: "material-revealing", at: 1370 },
  { phase: "material-settling", at: 1490 },
  { phase: "content-revealing", at: 1610 },
  { phase: "composed", at: 1740 },
];

export const REDUCED_RESEAL_SEQUENCE: readonly ExperienceStep[] = [
  { phase: "reseal-softening", at: 0 },
  { phase: "sealed", at: 120 },
];

export const CALENDAR_OPEN_SEQUENCE: readonly ExperienceStep[] = [
  { phase: "calendar-opening", at: 0 },
  { phase: "calendar-open", at: 620 },
];

export const CALENDAR_CLOSE_SEQUENCE: readonly ExperienceStep[] = [
  { phase: "calendar-closing", at: 0 },
  { phase: "composed", at: 620 },
];

export const REDUCED_CALENDAR_OPEN_SEQUENCE: readonly ExperienceStep[] = [
  { phase: "calendar-opening", at: 0 },
  { phase: "calendar-open", at: 90 },
];

export const REDUCED_CALENDAR_CLOSE_SEQUENCE: readonly ExperienceStep[] = [
  { phase: "calendar-closing", at: 0 },
  { phase: "composed", at: 90 },
];

export function finalPhase(sequence: readonly ExperienceStep[]): ExperiencePhase {
  return sequence[sequence.length - 1]?.phase ?? "sealed";
}

export function isFullyOpen(phase: ExperiencePhase): boolean {
  return [
    "composed",
    "calendar-cue",
    "calendar-opening",
    "calendar-open",
    "calendar-closing",
    "reseal-softening",
  ].includes(phase);
}

/** The final frame may only be rewound beneath the fully sealed cover. */
export function isStageVideoResetPoint(phase: ExperiencePhase): boolean {
  return phase === "sealed";
}
