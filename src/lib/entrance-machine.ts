/**
 * The Save the Date entrance, as one explicit timeline.
 *
 * Every meaningful duration lives in the studio's settings and flows through
 * `buildEntrance()` into a single ordered list of steps. Nothing schedules
 * itself: the controller walks this list, so replay, cancellation and reset
 * are all the same operation, and a future reverse choreography can read the
 * same timeline backwards rather than needing its own implementation.
 *
 * Deliberately free of DOM and timers so the pacing can be unit tested.
 */

export type EntrancePhase =
  "closed" | "acknowledge" | "opening" | "venue" | "material" | "content" | "functional" | "still";

export interface EntranceStep {
  phase: EntrancePhase;
  /** Absolute milliseconds from the press. */
  at: number;
}

export interface EntranceTiming {
  /** How long the inner mark's press acknowledgement runs before the cover moves. */
  acknowledge: number;
  /** Cover panel travel. */
  coverOpen: number;
  /** The clear Ocean Pavilion beat, with nothing of the invitation on screen. */
  venueHold: number;
  /** Frosted material developing over the film. */
  frostArrival: number;
  /** Editorial artwork resolving. */
  artworkArrival: number;
  /** Countdown and calendar waiting after the artwork begins. */
  functionalDelay: number;
  /** Whether the artwork waits for the frost or arrives with it. */
  arrivalMode: ArrivalMode;
}

export type ArrivalMode = "sequential" | "together";

/**
 * The recommended starting point: press, physical opening, about a second and
 * a half of clear venue, then material, wording and functional content in
 * turn. Every value is a studio control — these are only defaults.
 */
export const DEFAULT_TIMING: EntranceTiming = {
  acknowledge: 180,
  coverOpen: 1400,
  venueHold: 1500,
  frostArrival: 900,
  artworkArrival: 900,
  functionalDelay: 450,
  arrivalMode: "sequential",
};

/**
 * Reduced motion gets a deliberately authored short sequence rather than the
 * same one with the durations zeroed: the cover still clears and the venue is
 * still briefly its own moment, so the interaction remains legible, but
 * nothing lingers and nothing loops.
 */
export const REDUCED_TIMING: EntranceTiming = {
  acknowledge: 0,
  coverOpen: 220,
  venueHold: 320,
  frostArrival: 200,
  artworkArrival: 200,
  functionalDelay: 0,
  arrivalMode: "together",
};

/**
 * Turns the chosen timings into the ordered timeline the controller plays.
 *
 * In `together` mode the wording resolves alongside the material rather than
 * after it, so the two orderings can be compared without rebuilding anything.
 */
export function buildEntrance(timing: EntranceTiming): EntranceStep[] {
  const acknowledgeAt = 0;
  const openingAt = acknowledgeAt + Math.max(0, timing.acknowledge);
  const venueAt = openingAt + Math.max(0, timing.coverOpen);
  const materialAt = venueAt + Math.max(0, timing.venueHold);

  const contentAt =
    timing.arrivalMode === "together" ? materialAt : materialAt + Math.max(0, timing.frostArrival);

  const functionalAt = contentAt + Math.max(0, timing.functionalDelay);
  const stillAt = functionalAt + Math.max(0, timing.artworkArrival);

  return [
    { phase: "acknowledge", at: acknowledgeAt },
    { phase: "opening", at: openingAt },
    { phase: "venue", at: venueAt },
    { phase: "material", at: materialAt },
    { phase: "content", at: contentAt },
    { phase: "functional", at: functionalAt },
    { phase: "still", at: stillAt },
  ];
}

/** Total run time of an entrance, for progress reporting and QA. */
export function entranceDuration(timing: EntranceTiming): number {
  const steps = buildEntrance(timing);
  return steps[steps.length - 1]?.at ?? 0;
}

/**
 * The moment the venue is on its own — cover gone, nothing of the invitation
 * yet. Used by the studio's "jump to the venue moment" checkpoint and by the
 * tests that guarantee the beat actually exists.
 */
export function venueWindow(timing: EntranceTiming): { start: number; end: number } {
  const steps = buildEntrance(timing);
  const start = steps.find((step) => step.phase === "venue")?.at ?? 0;
  const end = steps.find((step) => step.phase === "material")?.at ?? start;
  return { start, end };
}

/** Phases in which the invitation's own content is deliberately absent. */
const VENUE_ONLY: readonly EntrancePhase[] = ["closed", "acknowledge", "opening", "venue"];

export function isVenueOnly(phase: EntrancePhase): boolean {
  return VENUE_ONLY.includes(phase);
}

/** True once the cover has finished travelling and the film is uncovered. */
export function coverHasCleared(phase: EntrancePhase): boolean {
  return !["closed", "acknowledge", "opening"].includes(phase);
}

/** The phase to show when the studio jumps straight to a checkpoint. */
export function checkpointPhase(checkpoint: "closed" | "venue" | "finished"): EntrancePhase {
  if (checkpoint === "closed") return "closed";
  return checkpoint === "venue" ? "venue" : "still";
}

/* ------------------------------------------------------------- monogram */

export interface MonogramMotion {
  rotate: boolean;
  /** Seconds for one full turn. */
  rotationSeconds: number;
  direction: "cw" | "ccw";
  startAngle: number;
  breathe: boolean;
  /** Peak growth as a percentage above rest, e.g. 1.5 means 101.5%. */
  breathAmount: number;
  breathSeconds: number;
}

/**
 * The CSS custom properties that drive the monogram's idle motion.
 *
 * Direction is expressed as a signed end angle rather than two keyframe sets,
 * so reversing never restarts the animation mid-turn.
 */
export function monogramVars(motion: MonogramMotion): Record<string, string> {
  const turn = motion.direction === "ccw" ? -360 : 360;
  return {
    "--tp-mono-rotate-duration": `${Math.max(1, motion.rotationSeconds)}s`,
    "--tp-mono-rotate-to": `${motion.startAngle + turn}deg`,
    "--tp-mono-rotate-from": `${motion.startAngle}deg`,
    "--tp-mono-rotate-state": motion.rotate ? "running" : "paused",
    "--tp-mono-breath-duration": `${Math.max(1, motion.breathSeconds)}s`,
    "--tp-mono-breath-scale": `${1 + Math.max(0, motion.breathAmount) / 100}`,
    "--tp-mono-breath-state": motion.breathe ? "running" : "paused",
  };
}
