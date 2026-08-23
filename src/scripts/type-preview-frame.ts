import {
  CONTROLS,
  SETTINGS_STORAGE_KEY,
  coerceSettings,
  cssValue,
  type Settings,
} from "../lib/type-preview-settings";
import {
  DEFAULT_TIMING,
  REDUCED_TIMING,
  buildEntrance,
  checkpointPhase,
  monogramVars,
  type EntrancePhase,
  type EntranceTiming,
} from "../lib/entrance-machine";

/**
 * Preview-frame side of the studio.
 *
 * Applies tuning values as CSS custom properties on the frame's own root, and
 * answers the small set of commands the panel sends over postMessage. Reading
 * the saved settings here as well as receiving them means the frame renders
 * correctly on its own — a direct visit, or a dev-server reload — instead of
 * flashing the defaults until the panel next posts.
 */

function applySettings(settings: Settings): void {
  const root = document.documentElement;
  for (const control of CONTROLS) {
    root.style.setProperty(control.cssVar, cssValue(control, settings));
  }
  // Mode drives which layer is visible, so it is an attribute rather than a
  // custom property — CSS cannot branch on a variable's value.
  document.body.dataset.artworkMode = String(settings.artworkMode ?? "native");
  document.body.dataset.coverMode = String(settings.coverMode ?? "monogram");

  // Idle motion is derived rather than read straight from the controls: the
  // machine turns direction and amount into the exact custom properties the
  // keyframes expect, so the same values drive the preview and the tests.
  for (const [name, value] of Object.entries(
    monogramVars({
      rotate: settings.outerRotation !== "off",
      rotationSeconds: Number(settings.rotationSeconds ?? 46),
      direction: settings.rotationDirection === "ccw" ? "ccw" : "cw",
      startAngle: 0,
      breathe: settings.innerBreathing !== "off",
      breathAmount: Number(settings.breathAmount ?? 1.6),
      breathSeconds: Number(settings.breathSeconds ?? 6.5),
    }),
  )) {
    root.style.setProperty(name, value);
  }

  // The monogram is sized against the invitation's own width, so one value
  // holds from a 320px phone to the desktop card without a second setting.
  root.style.setProperty("--tp-mono-size", `${Number(settings.monogramScale ?? 38)}cqw`);

  currentTiming = timingFrom(settings);
  positionVeil();
}

/* ------------------------------------------------------------ entrance */

/**
 * Studio settings are authored in seconds because that is how a person thinks
 * about pacing; the machine works in milliseconds.
 */
function timingFrom(settings: Settings): EntranceTiming {
  return {
    acknowledge: DEFAULT_TIMING.acknowledge,
    coverOpen: Number(settings.coverOpenSeconds ?? 1.4) * 1000,
    venueHold: Number(settings.venueHoldSeconds ?? 1.5) * 1000,
    frostArrival: Number(settings.frostArrivalSeconds ?? 0.9) * 1000,
    artworkArrival: Number(settings.artworkArrivalSeconds ?? 0.9) * 1000,
    functionalDelay: Number(settings.functionalDelaySeconds ?? 0.45) * 1000,
    arrivalMode: settings.arrivalMode === "together" ? "together" : "sequential",
  };
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let currentTiming: EntranceTiming = DEFAULT_TIMING;
let entranceTimers: number[] = [];
let entrancePhase: EntrancePhase = "closed";

function setEntrancePhase(phase: EntrancePhase): void {
  entrancePhase = phase;
  document.body.dataset.entrance = phase;
  window.parent.postMessage({ type: "tp:entrance-phase", phase }, window.location.origin);
}

function clearEntranceTimers(): void {
  for (const timer of entranceTimers) window.clearTimeout(timer);
  entranceTimers = [];
}

/**
 * Returns to the closed cover: timers cancelled, film rewound to its poster
 * moment, idle motion resumed. Replay is this followed by a fresh play, so
 * the two can never drift apart.
 */
function resetEntrance(): void {
  clearEntranceTimers();
  setEntrancePhase("closed");
  const video = document.querySelector<HTMLVideoElement>("[data-stage-video]");
  if (video) {
    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      /* A source that never loaded is already showing its poster. */
    }
  }
}

/**
 * Plays the entrance from wherever it currently is, always starting by
 * resetting so a second press cannot stack two timelines. The film is released
 * as the cover begins to travel, matching the production model.
 */
function playEntrance(): void {
  clearEntranceTimers();
  const timing = prefersReducedMotion() ? REDUCED_TIMING : currentTiming;

  setEntrancePhase("acknowledge");
  for (const step of buildEntrance(timing)) {
    if (step.at === 0) continue;
    entranceTimers.push(
      window.setTimeout(() => {
        setEntrancePhase(step.phase);
        if (step.phase === "opening") releaseFilm();
      }, step.at),
    );
  }
}

/** Starts the venue film once, letting it rest on its final frame. */
function releaseFilm(): void {
  const video = document.querySelector<HTMLVideoElement>("[data-stage-video]");
  if (!video) return;
  const promise = video.play();
  if (promise) promise.catch(() => undefined);
}

function wireOpener(): void {
  const opener = document.querySelector<HTMLButtonElement>("[data-cover-opener]");
  opener?.addEventListener("click", () => {
    // Only the closed cover opens. Rapid double taps, or a click arriving
    // mid-sequence, are ignored rather than restarting the timeline.
    if (entrancePhase !== "closed") return;
    playEntrance();
  });
}

/**
 * Keeps the readability veil centred on whatever is actually being read — the
 * Canva artwork in SVG mode, the native block otherwise — so lowering the veil
 * reveals video around the real composition rather than around a fixed strip.
 */
function positionVeil(): void {
  const surface = document.querySelector<HTMLElement>(".invitation__surface");
  const artwork = document.querySelector<HTMLElement>("[data-artwork]");
  const editorial = document.querySelector<HTMLElement>(".tp-editorial");
  if (!surface) return;

  const svgMode = document.body.dataset.artworkMode === "svg";
  const target = svgMode ? artwork : editorial;
  if (!target) return;

  const host = surface.getBoundingClientRect();
  const box = target.getBoundingClientRect();
  if (host.height === 0 || box.height === 0) return;

  const centre = ((box.top + box.height / 2 - host.top) / host.height) * 100;
  // Generous padding so the soft mask fades out well clear of the wording.
  const height = Math.min(100, (box.height / host.height) * 100 + 26);

  const root = document.documentElement;
  root.style.setProperty("--tp-veil-y", `${centre.toFixed(2)}%`);
  root.style.setProperty("--tp-veil-height", `${height.toFixed(2)}%`);
}

/**
 * Saved settings, with any control overridable by query string —
 * `?invitationStrength=0.15&textVeil=0.05`.
 *
 * Lets a particular look be captured or shared as a plain link, without
 * depending on whatever happens to be in that browser's storage. Values go
 * through the same clamping as everything else.
 */
function readStoredSettings(): Settings {
  let stored: unknown;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    stored = raw ? JSON.parse(raw) : null;
  } catch {
    stored = null;
  }

  const settings = coerceSettings(stored);
  const overrides: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(window.location.search)) {
    overrides[key] = value;
  }
  return Object.keys(overrides).length > 0
    ? coerceSettings({ ...settings, ...overrides })
    : settings;
}

function stageVideo(): HTMLVideoElement | null {
  return document.querySelector<HTMLVideoElement>("[data-stage-video]");
}

/**
 * The film is the thing the wording has to stay readable over, so the studio
 * can hold it on any frame. Production starts playback from the opening
 * sequence, which never runs here, so the studio drives it directly.
 */
function seekFilm(fraction: number): void {
  const video = stageVideo();
  if (!video) return;
  const run = (): void => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    video.pause();
    video.currentTime = Math.max(0, Math.min(video.duration - 0.05, video.duration * fraction));
  };
  if (video.readyState >= 1) run();
  else video.addEventListener("loadedmetadata", run, { once: true });
}

function playFilm(): void {
  const video = stageVideo();
  if (!video) return;
  const promise = video.play();
  if (promise) promise.catch(() => undefined);
}

let artworkUrl: string | null = null;

/** Swaps the artwork image, revoking the previous object URL. */
function setArtwork(url: string | null): void {
  const image = document.querySelector<HTMLImageElement>("[data-artwork]");
  if (!image) return;

  if (artworkUrl) URL.revokeObjectURL(artworkUrl);
  artworkUrl = null;

  if (!url) {
    image.removeAttribute("src");
    return;
  }

  artworkUrl = url;
  image.src = url;
  image.addEventListener("load", positionVeil, { once: true });
}

/**
 * Geometry the panel needs for its advisory warnings: whether the artwork has
 * drifted outside the card, and whether the functional zone has left the solid
 * part of the frosted band. Measured from the real layout rather than inferred
 * from the numbers, so it stays honest at any screen shape.
 */
function reportGeometry(): void {
  const surface = document.querySelector<HTMLElement>(".invitation__surface");
  const artwork = document.querySelector<HTMLImageElement>("[data-artwork]");
  const zone = document.querySelector<HTMLElement>(".tp-functional");
  if (!surface) return;

  const host = surface.getBoundingClientRect();
  if (host.height === 0) return;

  const pct = (value: number): number => ((value - host.top) / host.height) * 100;
  const svgMode = document.body.dataset.artworkMode === "svg";

  let artworkClipped = false;
  if (svgMode && artwork?.getAttribute("src")) {
    const box = artwork.getBoundingClientRect();
    artworkClipped =
      box.top < host.top - 1 ||
      box.bottom > host.bottom + 1 ||
      box.left < host.left - 1 ||
      box.right > host.right + 1;
  }

  let zoneTopPct: number | null = null;
  let zoneBottomPct: number | null = null;
  if (zone) {
    const box = zone.getBoundingClientRect();
    zoneTopPct = pct(box.top);
    zoneBottomPct = pct(box.bottom);
  }

  window.parent.postMessage(
    {
      type: "tp:geometry-result",
      artworkClipped,
      zoneTopPct,
      zoneBottomPct,
      documentOverflows: document.documentElement.scrollWidth > window.innerWidth + 1,
    },
    window.location.origin,
  );
}

const monogramUrls: Record<string, string | null> = { outer: null, inner: null };

/** Bundled pair, used until the panel posts an uploaded one. */
const STARTING_MONOGRAM = {
  outer: new URL("../starting-monogram-outer.svg", document.baseURI).pathname,
  inner: new URL("../starting-monogram-inner.svg", document.baseURI).pathname,
} as const;

/** Swaps one monogram layer, revoking the object URL it replaces. */
function setMonogram(layer: "outer" | "inner", url: string | null): void {
  const image = document.querySelector<HTMLImageElement>(
    layer === "outer" ? "[data-monogram-outer]" : "[data-monogram-inner]",
  );
  if (!image) return;

  const previous = monogramUrls[layer];
  if (previous) URL.revokeObjectURL(previous);
  monogramUrls[layer] = null;

  // Falling back rather than clearing keeps the cover from ever going blank.
  if (!url) {
    image.src = STARTING_MONOGRAM[layer];
    return;
  }
  monogramUrls[layer] = url;
  image.src = url;
}

function setReference(url: string | null): void {
  const layer = document.querySelector<HTMLElement>("[data-reference]");
  if (!layer) return;
  layer.style.backgroundImage = url ? `url("${url}")` : "";
}

/**
 * Luminance of the *dark* end of the current film frame, used by the panel's
 * readability guide.
 *
 * Deliberately a low percentile rather than an average. The wording is near
 * black, so it fails where the film behind it is darkest — the shaded planting
 * and the pavilion's timber — not where it is brightest. An average over this
 * particular film reads as comfortably bright at every moment and would never
 * warn about anything, while the dark tenth is exactly where a very
 * transparent invitation stops being readable.
 */
function backdropLuminance(): number | null {
  const video = stageVideo();
  if (!video || video.readyState < 2 || !video.videoWidth) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  try {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const values: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const r = (data[i] ?? 0) / 255;
      const g = (data[i + 1] ?? 0) / 255;
      const b = (data[i + 2] ?? 0) / 255;
      values.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }
    if (values.length === 0) return null;
    values.sort((a, b) => a - b);
    const index = Math.floor(values.length * 0.1);
    return values[index] ?? null;
  } catch {
    return null;
  }
}

interface FrameMessage {
  type: string;
  settings?: unknown;
  fraction?: number;
  url?: string | null;
  opacity?: number;
  blend?: string;
  layer?: string;
  checkpoint?: string;
}

/** Re-measure after layout settles, so warnings track the real composition. */
function scheduleGeometry(): void {
  window.requestAnimationFrame(() => {
    positionVeil();
    reportGeometry();
  });
}

window.addEventListener("message", (event: MessageEvent) => {
  if (event.origin !== window.location.origin) return;
  const message = event.data as FrameMessage | null;
  if (!message || typeof message.type !== "string") return;

  switch (message.type) {
    case "tp:settings":
      applySettings(coerceSettings(message.settings));
      scheduleGeometry();
      break;
    case "tp:artwork":
      setArtwork(message.url ?? null);
      scheduleGeometry();
      break;
    case "tp:geometry":
      scheduleGeometry();
      break;
    case "tp:monogram":
      setMonogram(message.layer === "inner" ? "inner" : "outer", message.url ?? null);
      break;
    case "tp:entrance-play":
      playEntrance();
      break;
    case "tp:entrance-reset":
      resetEntrance();
      break;
    case "tp:entrance-checkpoint": {
      // Jumping straight to a state so monogram size or frost can be judged
      // without sitting through the whole sequence each time.
      clearEntranceTimers();
      const target = checkpointPhase(
        message.checkpoint === "venue"
          ? "venue"
          : message.checkpoint === "finished"
            ? "finished"
            : "closed",
      );
      setEntrancePhase(target);
      if (target === "closed") resetEntrance();
      break;
    }
    case "tp:seek":
      seekFilm(typeof message.fraction === "number" ? message.fraction : 0);
      break;
    case "tp:play":
      playFilm();
      break;
    case "tp:reference":
      setReference(message.url ?? null);
      document.documentElement.style.setProperty(
        "--tp-reference-opacity",
        String(message.opacity ?? 0),
      );
      document.documentElement.style.setProperty("--tp-reference-blend", message.blend ?? "normal");
      break;
    case "tp:luminance": {
      const value = backdropLuminance();
      window.parent.postMessage({ type: "tp:luminance-result", value }, window.location.origin);
      break;
    }
  }
});

applySettings(readStoredSettings());

/* `?artwork=<url>` loads a design without going through the panel, which is
   how the studio's own screenshots are captured and how a particular look can
   be shared as a plain link. The panel still owns the uploaded artwork. */
const artworkParam = new URLSearchParams(window.location.search).get("artwork");
if (artworkParam) setArtwork(artworkParam);

seekFilm(0.06);
wireOpener();
setMonogram("outer", null);
setMonogram("inner", null);
setEntrancePhase("closed");
window.addEventListener("resize", scheduleGeometry);
scheduleGeometry();

// Tell the panel the frame is ready to receive settings after a reload.
window.parent.postMessage({ type: "tp:ready" }, window.location.origin);
