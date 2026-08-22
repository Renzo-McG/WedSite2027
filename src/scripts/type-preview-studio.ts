import {
  CONTRAST_FLOOR,
  CONTROLS,
  PRESETS_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  coerceSettings,
  defaultSettings,
  estimateContrast,
  exportPayload,
  type Control,
  type Settings,
} from "../lib/type-preview-settings";

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

function syncAllControls(): void {
  for (const control of CONTROLS) syncControl(control);
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
    window.setTimeout(requestLuminance, 400);
  }

  if (message.type === "tp:luminance-result" && typeof message.value === "number") {
    backdropLuminance = message.value;
    refreshContrastWarning();
  }
});

window.addEventListener("resize", () => {
  if (zoom === 0) applyViewport();
});

settings = loadSettings();
syncAllControls();
wireControls();
wirePreviewAids();
wireExport();
renderPresets();
applyViewport();
