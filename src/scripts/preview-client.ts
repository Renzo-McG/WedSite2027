import { phases, type OpeningPhase } from "../design-system/motion-presets";
import { isProtocolMessage, PROTOCOL, PROTOCOL_VERSION } from "../design-system/protocol";
import { applyTokens } from "../design-system/token-css";
import { canonicalTokens, sanitiseTokens } from "../design-system/tokens";
import type { MotionMode, WeddingTokens } from "../design-system/token-types";

document.documentElement.classList.add("js");

const invitationRoot = document.querySelector<HTMLElement>("[data-invitation-root]");
if (!invitationRoot) throw new Error("Invitation root is missing");
const root: HTMLElement = invitationRoot;

let tokens: WeddingTokens = structuredClone(canonicalTokens);
let phase: OpeningPhase = "closed";
let phaseStarted = performance.now();
let phaseElapsed = 0;
let timer: number | undefined;
let paused = false;
let speed = 1;
let mode: MotionMode = "normal";
let restoreFocus: HTMLElement | null = null;
let gustTimer: number | undefined;
let previewVisible = true;

const origin = window.location.origin;
const parentWindow = window.parent;

function post(type: "PREVIEW_READY" | "PREVIEW_STATE" | "ERROR_REPORT", payload?: unknown): void {
  parentWindow.postMessage(
    {
      protocol: PROTOCOL,
      version: PROTOCOL_VERSION,
      type,
      ...(payload === undefined ? {} : { payload }),
    },
    origin,
  );
}

function phaseDuration(value: OpeningPhase): number | undefined {
  const m = tokens.motion;
  const durations: Partial<Record<OpeningPhase, number>> = {
    "control-active": m.localDuration,
    "control-exiting": m.controlFadeDuration,
    "seam-active": m.seamPauseDuration + m.seamDuration,
    "panels-opening": m.curtainDuration,
    "content-revealing": m.contentDuration + m.revealStagger * 3,
    "sheet-opening": m.sheetDuration,
    "sheet-closing": m.sheetDuration,
  };
  return durations[value];
}

function notify(): void {
  post("PREVIEW_STATE", {
    phase,
    elapsed: Math.round(phaseElapsed),
    paused,
    speed,
  });
}

function clearPhaseTimer(): void {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = undefined;
}

function nextPhase(value: OpeningPhase): OpeningPhase | undefined {
  if (value === "content-revealing") return "composed";
  if (value === "sheet-opening") return "sheet-open";
  if (value === "sheet-closing") return "composed";
  const index = phases.indexOf(value);
  const next = phases[index + 1];
  return next === "sheet-opening" ? undefined : next;
}

function schedule(remaining?: number): void {
  clearPhaseTimer();
  const duration = remaining ?? phaseDuration(phase);
  if (duration === undefined || paused || mode === "static") return;
  phaseStarted = performance.now() - phaseElapsed / speed;
  timer = window.setTimeout(
    () => {
      phaseElapsed = 0;
      const next = nextPhase(phase);
      if (next) setPhase(next, true);
    },
    Math.max(1, duration / speed),
  );
}

function setPhase(value: OpeningPhase, auto = false): void {
  clearPhaseTimer();
  phase = value;
  phaseElapsed = 0;
  phaseStarted = performance.now();
  root.dataset.phase = value;
  notify();
  if (auto) schedule();
}

function beginOpening(): void {
  if (phase !== "closed" && phase !== "composed") return;
  setPhase("control-active", true);
}

function replay(): void {
  closeSheet(true);
  paused = false;
  setPhase("closed");
}

function pause(): void {
  if (paused) return;
  paused = true;
  phaseElapsed = (performance.now() - phaseStarted) * speed;
  clearPhaseTimer();
  root.classList.add("motion-paused");
  notify();
}

function resume(): void {
  if (!paused) return;
  paused = false;
  root.classList.remove("motion-paused");
  const duration = phaseDuration(phase);
  schedule(duration === undefined ? undefined : Math.max(0, duration - phaseElapsed));
  notify();
}

function step(direction: -1 | 1): void {
  const index = phases.indexOf(phase);
  const target = phases[Math.min(phases.length - 1, Math.max(0, index + direction))];
  if (target) setPhase(target);
}

function applyMode(value: MotionMode): void {
  mode = value;
  root.classList.toggle("force-reduced", value === "reduced");
  root.classList.toggle("force-static", value === "static");
  if (value === "static") setPhase("composed");
  else if (phase === "composed" || phase === "closed") setPhase(phase);
  updateAmbientPause();
}

function updateCountdown(): void {
  const target = Date.UTC(2027, 9, 23, 16, 0, 0); // Midnight in Cebu (UTC+08:00).
  const difference = Math.max(0, target - Date.now());
  const days = Math.floor(difference / 86_400_000);
  const hours = Math.floor((difference / 3_600_000) % 24);
  const minutes = Math.floor((difference / 60_000) % 60);
  const seconds = Math.floor((difference / 1000) % 60);
  const values = {
    days: String(days).padStart(3, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
  for (const [key, value] of Object.entries(values)) {
    document.querySelectorAll<HTMLElement>(`[data-${key}]`).forEach((node) => {
      node.textContent = value;
    });
  }
  document.querySelectorAll<HTMLElement>("[data-seconds-wrap]").forEach((node) => {
    node.hidden = !tokens.countdownSeconds;
  });
}

function focusableSheetElements(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      "[data-calendar-sheet] button:not([disabled]), [data-calendar-sheet] a[href]",
    ),
  );
}

function openSheet(): void {
  if (phase !== "composed" && phase !== "sheet-closing") return;
  restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const layer = root.querySelector<HTMLElement>("[data-sheet-layer]");
  if (!layer) return;
  layer.setAttribute("aria-hidden", "false");
  const content = root.querySelector<HTMLElement>("[data-content]");
  if (content) content.inert = true;
  document.body.style.overflow = "hidden";
  setPhase("sheet-opening", true);
  window.setTimeout(
    () => focusableSheetElements()[0]?.focus(),
    Math.min(tokens.motion.sheetDuration, 300),
  );
}

function closeSheet(immediate = false): void {
  const layer = root.querySelector<HTMLElement>("[data-sheet-layer]");
  if (!layer || layer.getAttribute("aria-hidden") === "true") return;
  setPhase("sheet-closing", !immediate);
  const finish = () => {
    layer.setAttribute("aria-hidden", "true");
    const content = root.querySelector<HTMLElement>("[data-content]");
    if (content) content.inert = false;
    document.body.style.overflow = "";
    if (!immediate) restoreFocus?.focus();
    if (immediate) setPhase("composed");
  };
  if (immediate || mode !== "normal") finish();
  else window.setTimeout(finish, tokens.motion.sheetDuration);
}

function trapSheetFocus(event: KeyboardEvent): void {
  const layer = root.querySelector<HTMLElement>("[data-sheet-layer]");
  if (layer?.getAttribute("aria-hidden") !== "false") return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeSheet();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = focusableSheetElements();
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function seededFraction(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function scheduleGust(): void {
  if (gustTimer !== undefined) window.clearTimeout(gustTimer);
  if (!tokens.foliage.enabled || mode !== "normal" || document.hidden || !previewVisible) return;
  const frequency = Math.max(0.05, tokens.foliage.gustFrequency);
  const delay =
    (8000 + seededFraction(tokens.foliage.seed + Date.now() / 1000) * 16000) / frequency;
  gustTimer = window.setTimeout(() => {
    root.classList.add("gust");
    window.setTimeout(() => root.classList.remove("gust"), 1900);
    scheduleGust();
  }, delay);
}

function updateAmbientPause(): void {
  const shouldPause =
    document.hidden || !previewVisible || mode !== "normal" || !tokens.foliage.enabled;
  root.classList.toggle("ambient-paused", shouldPause);
  scheduleGust();
}

root.querySelector("[data-open-control]")?.addEventListener("click", beginOpening);
root.querySelector("[data-replay]")?.addEventListener("click", replay);
root.querySelector("[data-sheet-open]")?.addEventListener("click", openSheet);
root
  .querySelectorAll("[data-sheet-close]")
  .forEach((button) => button.addEventListener("click", () => closeSheet()));
document.addEventListener("keydown", trapSheetFocus);
document.addEventListener("visibilitychange", updateAmbientPause);

const observer = new IntersectionObserver(([entry]) => {
  previewVisible = entry?.isIntersecting ?? true;
  updateAmbientPause();
});
observer.observe(root);

window.addEventListener("message", (event) => {
  if (event.origin !== origin || event.source !== parentWindow || !isProtocolMessage(event.data))
    return;
  const message = event.data;
  if (message.type === "TOKENS_UPDATE") {
    tokens = sanitiseTokens(message.payload);
    applyTokens(root, tokens);
    updateCountdown();
    updateAmbientPause();
  }
  if (message.type === "MOTION_COMMAND") {
    const {
      action,
      phase: requestedPhase,
      speed: requestedSpeed,
      mode: requestedMode,
    } = message.payload;
    if (requestedSpeed && [0.5, 1, 1.5].includes(requestedSpeed)) speed = requestedSpeed;
    if (requestedMode) applyMode(requestedMode);
    if (requestedPhase && phases.includes(requestedPhase)) setPhase(requestedPhase);
    else if (action === "OPEN") beginOpening();
    else if (action === "REPLAY") replay();
    else if (action === "PAUSE") pause();
    else if (action === "RESUME") resume();
    else if (action === "STEP_BACK") step(-1);
    else if (action === "STEP_FORWARD") step(1);
    else if (action === "OPEN_SHEET") openSheet();
    else if (action === "CLOSE_SHEET") closeSheet();
  }
});

window.addEventListener("beforeunload", () => {
  clearPhaseTimer();
  if (gustTimer !== undefined) window.clearTimeout(gustTimer);
  if (timelineInterval !== undefined) window.clearInterval(timelineInterval);
  observer.disconnect();
});

applyTokens(root, tokens);
updateCountdown();
window.setInterval(updateCountdown, 1000);
updateAmbientPause();
const timelineInterval = window.setInterval(() => {
  if (!paused && phaseDuration(phase) !== undefined) {
    phaseElapsed = (performance.now() - phaseStarted) * speed;
    notify();
  }
}, 100);
post("PREVIEW_READY");
notify();
