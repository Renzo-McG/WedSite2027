import {
  CONTROLS,
  SETTINGS_STORAGE_KEY,
  coerceSettings,
  cssValue,
  type Settings,
} from "../lib/type-preview-settings";

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
}

window.addEventListener("message", (event: MessageEvent) => {
  if (event.origin !== window.location.origin) return;
  const message = event.data as FrameMessage | null;
  if (!message || typeof message.type !== "string") return;

  switch (message.type) {
    case "tp:settings":
      applySettings(coerceSettings(message.settings));
      break;
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
seekFilm(0.06);

// Tell the panel the frame is ready to receive settings after a reload.
window.parent.postMessage({ type: "tp:ready" }, window.location.origin);
