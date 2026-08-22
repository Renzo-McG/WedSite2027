import {
  CONTRAST_FLOOR,
  CONTROLS,
  PRESETS_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  coerceSettings,
  defaultSettings,
  estimateContrast,
  exportPayload,
  frostBand,
  functionalZoneEscapes,
  type Control,
  type Settings,
} from "../lib/type-preview-settings";
import { inspectSvg, type ArtworkInspection } from "../lib/svg-artwork";
import {
  artworkObjectUrl,
  clearArtwork,
  markCurrentApproved,
  putCurrentArtwork,
  readArtwork,
  type ArtworkSlot,
} from "../lib/artwork-store";
import { buildZip, productionPackage } from "../lib/production-package";

/**
 * Panel side of the studio.
 *
 * Owns the settings, persists them, and pushes them into the preview iframe on
 * every change so editing feels immediate. Nothing here writes to source: the
 * output of a session is the exported settings file.
 */

const frame = document.querySelector<HTMLIFrameElement>("[data-frame]");
const frameWrap = document.querySelector<HTMLElement>("[data-frame-wrap]");
const caption = document.querySelector<HTMLElement>("[data-caption]");
const toast = document.querySelector<HTMLElement>("[data-toast]");

let settings: Settings = defaultSettings();
let viewport = { w: 1440, h: 900, label: "Desktop invitation", note: "540 × 756 card" };
let zoom = 0; // 0 means fit-to-window
let frameReady = false;
let showingSlot: ArtworkSlot = "current";
let currentInspection: ArtworkInspection | null = null;

/* ----------------------------------------------------------- persistence */

function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return coerceSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultSettings();
  }
}

function saveSettings(): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    showToast("Could not save — this browser is blocking storage.");
  }
}

type PresetMap = Record<string, Settings>;

function loadPresets(): PresetMap {
  try {
    const raw = window.localStorage.getItem(PRESETS_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: PresetMap = {};
    for (const [name, value] of Object.entries(parsed as Record<string, unknown>)) {
      out[name] = coerceSettings(value);
    }
    return out;
  } catch {
    return {};
  }
}

function savePresets(presets: PresetMap): void {
  try {
    window.localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    showToast("Could not save — this browser is blocking storage.");
  }
}

/* ---------------------------------------------------------------- toast */

let toastTimer: number | undefined;

function showToast(message: string): void {
  if (!toast) return;
  toast.textContent = message;
  toast.dataset.visible = "true";
  if (toastTimer !== undefined) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => delete toast.dataset.visible, 2200);
}

/* ------------------------------------------------------------- preview */

function postToFrame(message: Record<string, unknown>): void {
  frame?.contentWindow?.postMessage(message, window.location.origin);
}

function pushSettings(): void {
  postToFrame({ type: "tp:settings", settings });
}

/** Human-facing readout: whole numbers where sensible, never CSS units. */
function formatValue(control: Control, value: number | string): string {
  if (control.kind === "choice") return "";
  const numeric = typeof value === "number" ? value : Number(value);
  const suffix = control.display ?? "";
  const decimals = control.step >= 1 ? 0 : control.step >= 0.1 ? 1 : 2;
  return `${numeric.toFixed(decimals)}${suffix}`;
}

function syncControl(control: Control): void {
  const input = document.querySelector<HTMLInputElement | HTMLSelectElement>(
    `[data-input="${control.id}"]`,
  );
  const readout = document.querySelector<HTMLElement>(`[data-value-for="${control.id}"]`);
  const value = settings[control.id] ?? control.value;
  if (input) input.value = String(value);
  if (readout) readout.textContent = formatValue(control, value);
}

/**
 * Shows only the controls that make sense for the active artwork mode. The
 * hidden ones stay in the DOM with their values intact, so switching back to
 * the built-in wording restores exactly what was there before.
 */
function applyModeVisibility(): void {
  const mode = String(settings.artworkMode ?? "native");
  for (const control of CONTROLS) {
    const node = document.querySelector<HTMLElement>(`[data-control="${control.id}"]`);
    if (!node) continue;
    node.hidden = control.showWhen !== undefined && control.showWhen.artworkMode !== mode;
  }

  // A whole section disappears when every control in it is irrelevant.
  document.querySelectorAll<HTMLElement>("[data-group-section]").forEach((section) => {
    const controls = section.querySelectorAll<HTMLElement>("[data-control]");
    const anyVisible = [...controls].some((node) => !node.hidden);
    section.hidden = controls.length > 0 && !anyVisible;
  });

  const desktopNote = document.querySelector<HTMLElement>("[data-desktop-note]");
  if (desktopNote) desktopNote.hidden = viewport.w < 768;
}

function syncAllControls(): void {
  for (const control of CONTROLS) syncControl(control);
  applyModeVisibility();
  refreshContrastWarning();
}

/* -------------------------------------------------- readability guide */

let backdropLuminance = 0.45;

function refreshContrastWarning(): void {
  const warning = document.querySelector<HTMLElement>("[data-contrast-warning]");
  if (!warning) return;

  const invitation = Number(settings.invitationStrength ?? 0.76);
  const veil = Number(settings.textVeil ?? 0.18);
  const ratio = estimateContrast(backdropLuminance, invitation, veil);
  warning.hidden = ratio >= CONTRAST_FLOOR;
}

/** Ask the frame what the film actually looks like behind the wording. */
function requestLuminance(): void {
  if (frameReady) postToFrame({ type: "tp:luminance" });
}

/* ------------------------------------------------------------- artwork */

let artworkUrl: string | null = null;

function renderCheck(inspection: ArtworkInspection | null): void {
  const box = document.querySelector<HTMLElement>("[data-check]");
  if (!box) return;
  if (!inspection) {
    box.hidden = true;
    box.replaceChildren();
    return;
  }

  box.hidden = false;
  const lines: HTMLElement[] = [];
  const strong = document.createElement("p");
  strong.textContent = "Artwork check";
  strong.style.fontWeight = "700";
  lines.push(strong);

  for (const pass of inspection.passed) {
    const row = document.createElement("p");
    row.className = "ok";
    row.textContent = `✓ ${pass}`;
    lines.push(row);
  }
  for (const warning of inspection.warnings) {
    const row = document.createElement("p");
    row.className = warning.blocking ? "bad" : "warn";
    row.textContent = `⚠ ${warning.message}`;
    lines.push(row);
  }
  box.replaceChildren(...lines);
}

/** Points the preview at one of the two stored artworks. */
async function showArtwork(slot: ArtworkSlot): Promise<void> {
  const record = await readArtwork(slot);
  if (artworkUrl) URL.revokeObjectURL(artworkUrl);
  artworkUrl = record ? artworkObjectUrl(record.source) : null;
  showingSlot = slot;
  postToFrame({ type: "tp:artwork", url: artworkUrl });
}

async function refreshArtworkUi(): Promise<void> {
  const current = await readArtwork("current");
  const previous = await readArtwork("previous");

  const title = document.querySelector<HTMLElement>("[data-drop-title]");
  const help = document.querySelector<HTMLElement>("[data-drop-help]");
  const actions = document.querySelector<HTMLElement>("[data-artwork-actions]");
  const compare = document.querySelector<HTMLButtonElement>("[data-compare-artwork]");

  if (title) title.textContent = current ? "Replace Canva artwork" : "Upload Canva artwork";
  if (help) {
    help.textContent = current
      ? "Load your latest Canva export. Your size, position, video and frost settings all stay exactly as they are."
      : "Drop the SVG here, or click to choose the file.";
  }
  if (actions) actions.hidden = !current;
  if (compare) {
    compare.hidden = !previous;
    compare.textContent = showingSlot === "current" ? "Compare with previous" : "Back to latest";
  }

  renderCheck(currentInspection);
}

/**
 * Reads an SVG chosen by the user, checks it, stores it and shows it.
 * Deliberately touches no other setting: replacing artwork must never undo the
 * placement work already done around it.
 */
async function acceptFile(file: File): Promise<void> {
  if (!/\.svg$/i.test(file.name) && file.type !== "image/svg+xml") {
    showToast("That is not an SVG. Export your design from Canva as SVG.");
    return;
  }

  const source = await file.text();
  const inspection = inspectSvg(source);
  currentInspection = inspection;

  if (!inspection.ok) {
    renderCheck(inspection);
    showToast("That file was not loaded — see the artwork check.");
    return;
  }

  await putCurrentArtwork(source, file.name);
  settings.artworkMode = "svg";
  saveSettings();
  syncAllControls();
  pushSettings();
  await showArtwork("current");
  await refreshArtworkUi();
  showToast(`Loaded ${file.name}. Your settings are unchanged.`);
}

function wireArtwork(): void {
  const drop = document.querySelector<HTMLElement>("[data-drop]");
  const input = document.querySelector<HTMLInputElement>("[data-file]");

  drop?.addEventListener("click", () => input?.click());
  drop?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input?.click();
    }
  });

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) void acceptFile(file);
    input.value = "";
  });

  for (const name of ["dragenter", "dragover"]) {
    drop?.addEventListener(name, (event) => {
      event.preventDefault();
      drop.dataset.active = "true";
    });
  }
  for (const name of ["dragleave", "drop"]) {
    drop?.addEventListener(name, (event) => {
      event.preventDefault();
      delete drop.dataset.active;
    });
  }
  drop?.addEventListener("drop", (event) => {
    const file = (event as DragEvent).dataTransfer?.files?.[0];
    if (file) void acceptFile(file);
  });

  document
    .querySelector<HTMLButtonElement>("[data-compare-artwork]")
    ?.addEventListener("click", () => {
      void showArtwork(showingSlot === "current" ? "previous" : "current").then(() => {
        showToast(showingSlot === "current" ? "Showing the latest." : "Showing the previous.");
        return refreshArtworkUi();
      });
    });

  document.querySelector<HTMLButtonElement>("[data-approve]")?.addEventListener("click", () => {
    void markCurrentApproved().then(() => showToast("Marked as the version to take forward."));
  });

  document
    .querySelector<HTMLButtonElement>("[data-remove-artwork]")
    ?.addEventListener("click", () => {
      if (!window.confirm("Remove the saved Canva artwork and go back to the built-in wording?")) {
        return;
      }
      void clearArtwork().then(async () => {
        currentInspection = null;
        settings.artworkMode = "native";
        saveSettings();
        syncAllControls();
        pushSettings();
        await showArtwork("current");
        await refreshArtworkUi();
        showToast("Artwork removed.");
      });
    });

  document.querySelector<HTMLButtonElement>("[data-fit-artwork]")?.addEventListener("click", () => {
    const key = viewport.w >= 768 ? "artDesktopScale" : "artMobileScale";
    const scale = Number(settings[key] ?? 100);
    settings[key] = Math.max(20, scale - 6);
    saveSettings();
    syncAllControls();
    pushSettings();
    showToast("Artwork brought back inside the invitation.");
  });
}

/* ------------------------------------------------------------ viewport */

function applyViewport(): void {
  if (!frame || !frameWrap) return;

  frame.width = String(viewport.w);
  frame.height = String(viewport.h);
  frame.style.width = `${viewport.w}px`;
  frame.style.height = `${viewport.h}px`;

  const stage = document.querySelector<HTMLElement>(".tps__stage");
  let scale = zoom > 0 ? zoom / 100 : 1;

  if (zoom === 0 && stage) {
    const availableW = stage.clientWidth - 48;
    const availableH = stage.clientHeight - 72;
    scale = Math.min(availableW / viewport.w, availableH / viewport.h, 1);
  }

  frameWrap.style.transform = `scale(${scale})`;
  frameWrap.style.width = `${viewport.w}px`;
  frameWrap.style.height = `${viewport.h}px`;
  // Keep the scaled box from reserving its unscaled footprint in the layout.
  frameWrap.style.margin = `${(viewport.h * (scale - 1)) / 2}px ${(viewport.w * (scale - 1)) / 2}px`;

  if (caption) {
    const percent = Math.round(scale * 100);
    caption.textContent = `${viewport.label} — ${viewport.w} × ${viewport.h}${
      viewport.note ? ` (${viewport.note})` : ""
    } · ${percent}%`;
  }

  const zoomReadout = document.querySelector<HTMLElement>('[data-readout="zoom"]');
  if (zoomReadout) zoomReadout.textContent = zoom > 0 ? `${zoom}%` : "Fit";

  // The custom sliders and the preset buttons are two views of one value.
  const wInput = document.querySelector<HTMLInputElement>("[data-vw]");
  const hInput = document.querySelector<HTMLInputElement>("[data-vh]");
  if (wInput && Number(wInput.value) !== viewport.w) wInput.value = String(viewport.w);
  if (hInput && Number(hInput.value) !== viewport.h) hInput.value = String(viewport.h);
  const wOut = document.querySelector<HTMLElement>('[data-readout="vw"]');
  const hOut = document.querySelector<HTMLElement>('[data-readout="vh"]');
  if (wOut) wOut.textContent = String(viewport.w);
  if (hOut) hOut.textContent = String(viewport.h);

  applyModeVisibility();
  postToFrame({ type: "tp:geometry" });

  document.querySelectorAll<HTMLElement>("[data-viewport]").forEach((button) => {
    // Two presets share a 390px width, so both dimensions have to match.
    const active =
      Number(button.dataset.w) === viewport.w && Number(button.dataset.h) === viewport.h;
    button.classList.toggle("tps__btn--active", active);
  });
}

/* ------------------------------------------------------------- presets */

function renderPresets(): void {
  const list = document.querySelector<HTMLElement>("[data-preset-list]");
  const empty = document.querySelector<HTMLElement>("[data-preset-empty]");
  if (!list) return;

  const presets = loadPresets();
  const names = Object.keys(presets).sort();
  list.replaceChildren();
  if (empty) empty.hidden = names.length > 0;

  for (const name of names) {
    const row = document.createElement("div");
    row.className = "tps__preset";

    const label = document.createElement("span");
    label.className = "tps__preset-name";
    label.textContent = name;

    const actions = document.createElement("span");
    actions.className = "tps__row";

    const load = document.createElement("button");
    load.className = "tps__btn tps__btn--tiny";
    load.type = "button";
    load.textContent = "Load";
    load.addEventListener("click", () => {
      const stored = loadPresets()[name];
      if (!stored) return;
      settings = coerceSettings(stored);
      saveSettings();
      syncAllControls();
      pushSettings();
      showToast(`Loaded “${name}”.`);
    });

    const remove = document.createElement("button");
    remove.className = "tps__btn tps__btn--tiny tps__btn--danger";
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      if (!window.confirm(`Delete the saved version “${name}”?`)) return;
      const next = loadPresets();
      delete next[name];
      savePresets(next);
      renderPresets();
      showToast(`Deleted “${name}”.`);
    });

    actions.append(load, remove);
    row.append(label, actions);
    list.append(row);
  }
}

/* --------------------------------------------------------------- wiring */

function wireControls(): void {
  for (const control of CONTROLS) {
    const input = document.querySelector<HTMLInputElement | HTMLSelectElement>(
      `[data-input="${control.id}"]`,
    );
    if (!input) continue;

    const handler = (): void => {
      settings[control.id] = control.kind === "slider" ? Number(input.value) : String(input.value);
      syncControl(control);
      saveSettings();
      pushSettings();
      // Switching artwork mode changes which controls are relevant, so the
      // whole panel has to be re-evaluated rather than just this one row.
      if (control.id === "artworkMode") applyModeVisibility();
      if (control.group === "material") refreshContrastWarning();
    };

    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  }

  document.querySelectorAll<HTMLButtonElement>("[data-reset-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.resetGroup;
      const base = defaultSettings();
      for (const control of CONTROLS) {
        if (control.group === group) settings[control.id] = base[control.id] ?? control.value;
      }
      saveSettings();
      syncAllControls();
      pushSettings();
      showToast("Section reset.");
    });
  });

  document.querySelector<HTMLButtonElement>("[data-reset-all]")?.addEventListener("click", () => {
    if (
      !window.confirm(
        "Reset every setting back to the Canva starting point? Your saved versions are kept.",
      )
    ) {
      return;
    }
    settings = defaultSettings();
    saveSettings();
    syncAllControls();
    pushSettings();
    showToast("Everything reset to the Canva starting point.");
  });
}

function wirePreviewAids(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-viewport]").forEach((button) => {
    button.addEventListener("click", () => {
      viewport = {
        w: Number(button.dataset.w),
        h: Number(button.dataset.h),
        label: button.textContent?.trim() ?? "",
        note: Number(button.dataset.w) === 1440 ? "540 × 756 card" : "",
      };
      applyViewport();
    });
  });

  const zoomInput = document.querySelector<HTMLInputElement>("[data-zoom]");
  zoomInput?.addEventListener("input", () => {
    zoom = Number(zoomInput.value);
    applyViewport();
  });

  document.querySelector<HTMLButtonElement>("[data-zoom-fit]")?.addEventListener("click", () => {
    zoom = 0;
    applyViewport();
  });

  document.querySelector<HTMLButtonElement>("[data-zoom-100]")?.addEventListener("click", () => {
    zoom = 100;
    if (zoomInput) zoomInput.value = "100";
    applyViewport();
  });

  const film = document.querySelector<HTMLInputElement>("[data-film]");
  film?.addEventListener("input", () => {
    const fraction = Number(film.value) / 100;
    postToFrame({ type: "tp:seek", fraction });
    const readout = document.querySelector<HTMLElement>('[data-readout="film"]');
    if (readout) readout.textContent = `${film.value}%`;
    window.setTimeout(requestLuminance, 120);
  });

  document.querySelector<HTMLButtonElement>("[data-film-play]")?.addEventListener("click", () => {
    postToFrame({ type: "tp:play" });
  });

  /* --------------------------------------------------- Canva overlay */

  const base = document.querySelector<HTMLImageElement>("[data-reference-image]")?.src ?? "";
  const opacityInput = document.querySelector<HTMLInputElement>("[data-reference-opacity]");
  let blend = "normal";

  const referenceUrl = (): string =>
    base.replace(
      /reference-\d+x\d+\.png$/,
      viewport.w === 1440 ? "reference-540x756.png" : "reference-390x884.png",
    );

  const pushReference = (): void => {
    const opacity = Number(opacityInput?.value ?? 0) / 100;
    postToFrame({ type: "tp:reference", url: referenceUrl(), opacity, blend });
    const readout = document.querySelector<HTMLElement>('[data-readout="reference"]');
    if (readout) readout.textContent = opacity === 0 ? "Off" : `${Math.round(opacity * 100)}%`;
  };

  opacityInput?.addEventListener("input", pushReference);

  document
    .querySelector<HTMLButtonElement>("[data-reference-difference]")
    ?.addEventListener("click", (event) => {
      blend = blend === "normal" ? "difference" : "normal";
      (event.currentTarget as HTMLElement).classList.toggle(
        "tps__btn--active",
        blend === "difference",
      );
      if (opacityInput && Number(opacityInput.value) === 0) opacityInput.value = "100";
      pushReference();
    });

  document
    .querySelector<HTMLButtonElement>("[data-compare]")
    ?.addEventListener("click", (event) => {
      const pane = document.querySelector<HTMLElement>("[data-reference-pane]");
      const image = document.querySelector<HTMLImageElement>("[data-reference-image]");
      if (!pane || !image) return;
      pane.hidden = !pane.hidden;
      (event.currentTarget as HTMLElement).classList.toggle("tps__btn--active", !pane.hidden);
      if (!pane.hidden) {
        image.src = referenceUrl();
        image.width = viewport.w === 1440 ? 540 : 390;
      }
      applyViewport();
    });
}

function setViewport(w: number, h: number, label: string, note = ""): void {
  viewport = { w, h, label, note };
  applyViewport();
}

function wireCustomViewport(): void {
  const wInput = document.querySelector<HTMLInputElement>("[data-vw]");
  const hInput = document.querySelector<HTMLInputElement>("[data-vh]");

  const update = (): void => {
    setViewport(
      Number(wInput?.value ?? viewport.w),
      Number(hInput?.value ?? viewport.h),
      "Custom screen",
    );
  };
  wInput?.addEventListener("input", update);
  hInput?.addEventListener("input", update);

  const page = document.querySelector<HTMLElement>(".tps-page") ?? document.body;
  const showBtn = document.querySelector<HTMLElement>("[data-show-panel]");

  document.querySelector<HTMLButtonElement>("[data-hide-panel]")?.addEventListener("click", () => {
    page.dataset.panelHidden = "true";
    if (showBtn) showBtn.hidden = false;
    applyViewport();
  });

  showBtn?.addEventListener("click", () => {
    delete page.dataset.panelHidden;
    showBtn.hidden = true;
    applyViewport();
  });

  document.querySelector<HTMLButtonElement>("[data-fullscreen]")?.addEventListener("click", () => {
    const stage = document.querySelector<HTMLElement>(".tps__stage");
    if (!document.fullscreenElement) void stage?.requestFullscreen?.().catch(() => undefined);
    else void document.exitFullscreen().catch(() => undefined);
  });
}

/* --------------------------------------------------------------- sweep */

/**
 * Steps the preview through a broad range of screen shapes and reports the
 * structural problems that actually matter. Programmatic rather than
 * screenshot-based, so it is fast enough to run on demand and does not go
 * stale the moment a colour changes.
 */
const SWEEP_SIZES: readonly (readonly [number, number, string])[] = [
  [280, 653, "very narrow phone"],
  [320, 568, "small phone"],
  [360, 780, "compact phone"],
  [375, 667, "older phone"],
  [390, 844, "normal phone"],
  [412, 915, "large android"],
  [430, 932, "large phone"],
  [480, 800, "phablet"],
  [600, 960, "small tablet"],
  [768, 1024, "tablet portrait"],
  [820, 1180, "tablet"],
  [844, 390, "phone landscape"],
  [1024, 768, "tablet landscape"],
  [1280, 720, "laptop"],
  [1366, 768, "laptop"],
  [1440, 900, "desktop"],
  [1728, 1117, "large desktop"],
  [1920, 1080, "full HD"],
];

interface GeometryReport {
  artworkClipped: boolean;
  zoneTopPct: number | null;
  zoneBottomPct: number | null;
  documentOverflows: boolean;
}

let geometryResolve: ((value: GeometryReport) => void) | null = null;

function requestGeometry(): Promise<GeometryReport> {
  return new Promise((resolve) => {
    geometryResolve = resolve;
    postToFrame({ type: "tp:geometry" });
    window.setTimeout(() => {
      if (geometryResolve === resolve) {
        geometryResolve = null;
        resolve({
          artworkClipped: false,
          zoneTopPct: null,
          zoneBottomPct: null,
          documentOverflows: false,
        });
      }
    }, 600);
  });
}

async function runSweep(): Promise<void> {
  const box = document.querySelector<HTMLElement>("[data-sweep-result]");
  if (!box) return;
  box.hidden = false;
  box.replaceChildren(Object.assign(document.createElement("p"), { textContent: "Checking…" }));

  const restore = { ...viewport };
  const problems: string[] = [];

  for (const [w, h, name] of SWEEP_SIZES) {
    setViewport(w, h, name);
    await new Promise((resolve) => window.setTimeout(resolve, 130));
    const report = await requestGeometry();
    if (report.documentOverflows) problems.push(`${w}×${h} (${name}): content overflows sideways`);
    if (report.artworkClipped) problems.push(`${w}×${h} (${name}): artwork is cut off`);
  }

  setViewport(restore.w, restore.h, restore.label, restore.note);

  const lines: HTMLElement[] = [];
  const heading = document.createElement("p");
  heading.style.fontWeight = "700";
  heading.textContent = `Checked ${SWEEP_SIZES.length} screen sizes`;
  lines.push(heading);

  if (problems.length === 0) {
    const ok = document.createElement("p");
    ok.className = "ok";
    ok.textContent = "✓ No overflow or clipping found at any size.";
    lines.push(ok);
  } else {
    for (const problem of problems) {
      const row = document.createElement("p");
      row.className = "warn";
      row.textContent = `⚠ ${problem}`;
      lines.push(row);
    }
  }
  box.replaceChildren(...lines);
}

function wireExport(): void {
  document.querySelector<HTMLButtonElement>("[data-copy]")?.addEventListener("click", async () => {
    const text = JSON.stringify(exportPayload(settings), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      showToast("Settings copied — paste them into a message.");
    } catch {
      // Clipboard permission can be refused; falling back keeps the value reachable.
      window.prompt("Copy these settings:", text);
    }
  });

  document.querySelector<HTMLButtonElement>("[data-download]")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(exportPayload(settings), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "save-the-date-type-settings.json";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded save-the-date-type-settings.json");
  });

  document.querySelector<HTMLButtonElement>("[data-package]")?.addEventListener("click", () => {
    void (async () => {
      const record = await readArtwork("current");
      const dimensions = currentInspection?.width
        ? `${Math.round(currentInspection.width)} × ${Math.round(currentInspection.height ?? 0)} SVG`
        : "SVG";
      const files = productionPackage({
        artworkSvg: record?.source ?? null,
        settingsJson: JSON.stringify(exportPayload(settings), null, 2),
        artworkDimensions: dimensions,
        exportedAt: new Date().toISOString(),
      });
      const blob = new Blob([buildZip(files) as BlobPart], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "save-the-date-approved.zip";
      link.click();
      URL.revokeObjectURL(url);
      showToast("Downloaded save-the-date-approved.zip");
    })();
  });

  document.querySelector<HTMLButtonElement>("[data-sweep]")?.addEventListener("click", () => {
    void runSweep();
  });

  document.querySelector<HTMLButtonElement>("[data-preset-save]")?.addEventListener("click", () => {
    const field = document.querySelector<HTMLInputElement>("[data-preset-name]");
    const name = field?.value.trim();
    if (!name) {
      showToast("Give this version a name first.");
      return;
    }
    const presets = loadPresets();
    presets[name] = { ...settings };
    savePresets(presets);
    if (field) field.value = "";
    renderPresets();
    showToast(`Saved “${name}”.`);
  });
}

/* ----------------------------------------------------------------- boot */

window.addEventListener("message", (event: MessageEvent) => {
  if (event.origin !== window.location.origin) return;
  const message = event.data as { type?: string; value?: number | null } | null;
  if (!message?.type) return;

  if (message.type === "tp:ready") {
    frameReady = true;
    pushSettings();
    void showArtwork(showingSlot).then(refreshArtworkUi);
    window.setTimeout(requestLuminance, 400);
  }

  if (message.type === "tp:luminance-result" && typeof message.value === "number") {
    backdropLuminance = message.value;
    refreshContrastWarning();
  }

  if (message.type === "tp:geometry-result") {
    const report = event.data as GeometryReport;
    geometryResolve?.(report);
    geometryResolve = null;

    const clip = document.querySelector<HTMLElement>("[data-clip-warning]");
    const fitRow = document.querySelector<HTMLElement>("[data-fit-row]");
    const svgMode = String(settings.artworkMode ?? "native") === "svg";
    if (clip) clip.hidden = !(svgMode && report.artworkClipped);
    if (fitRow) fitRow.hidden = !(svgMode && report.artworkClipped);

    // Only meaningful on a phone, where the frosted band is a band at all.
    const zone = document.querySelector<HTMLElement>("[data-zone-warning]");
    if (zone) {
      const band = frostBand(
        Number(settings.mobileFrostHeight ?? 100),
        Number(settings.mobileFrostY ?? 50),
      );
      const escapes =
        viewport.w < 768 &&
        report.zoneTopPct !== null &&
        report.zoneBottomPct !== null &&
        functionalZoneEscapes(band, report.zoneTopPct, report.zoneBottomPct);
      zone.hidden = !escapes;
    }
  }
});

window.addEventListener("resize", () => {
  if (zoom === 0) applyViewport();
});

settings = loadSettings();
syncAllControls();
wireControls();
wirePreviewAids();
wireCustomViewport();
wireArtwork();
wireExport();
renderPresets();
applyViewport();
void readArtwork("current").then((record) => {
  if (record) currentInspection = inspectSvg(record.source);
  return refreshArtworkUi();
});
