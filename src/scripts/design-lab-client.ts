import { builtInPresets } from "../design-system/presets";
import { phases, type OpeningPhase } from "../design-system/motion-presets";
import {
  isProtocolMessage,
  PROTOCOL,
  PROTOCOL_VERSION,
  type MotionAction,
} from "../design-system/protocol";
import { canonicalTokens, cloneTokens, sanitiseTokens } from "../design-system/tokens";
import {
  clearLabState,
  loadLabState,
  saveLabState,
  type LabState,
  type SavedPreset,
} from "../design-system/token-storage";
import { downloadText, exportBundle } from "../design-system/token-export";
import type { MotionMode, WeddingTokens } from "../design-system/token-types";

const state: LabState = loadLabState();
const origin = window.location.origin;
const frames = new Map<"current" | "experiment", HTMLIFrameElement>();
document
  .querySelectorAll<HTMLIFrameElement>("[data-preview-frame]")
  .forEach((frame) => frames.set(frame.dataset.previewFrame as "current" | "experiment", frame));

const presets = new Map(builtInPresets.map((preset) => [preset.id, preset]));
const workspace = document.querySelector<HTMLElement>(".lab-workspace");
const status = document.querySelector<HTMLElement>("[data-lab-status]");
const statusWrap = status?.closest(".lab-status");
const canvas = document.querySelector<HTMLElement>("[data-preview-canvas]");
const shells = Array.from(document.querySelectorAll<HTMLElement>("[data-frame-shell]"));

function activeTokens(): WeddingTokens {
  return state[state.editTarget];
}

function valueAt(tokens: WeddingTokens, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined,
      tokens,
    );
}

function setAt(tokens: WeddingTokens, path: string, value: unknown): WeddingTokens {
  const clone = structuredClone(tokens) as unknown as Record<string, unknown>;
  const keys = path.split(".");
  let node = clone;
  for (const key of keys.slice(0, -1)) {
    node[key] = { ...((node[key] as Record<string, unknown>) ?? {}) };
    node = node[key] as Record<string, unknown>;
  }
  const last = keys.at(-1);
  if (last) node[last] = value;
  return sanitiseTokens(clone);
}

function sendTo(target: "current" | "experiment", type: string, payload?: unknown): void {
  const frame = frames.get(target);
  frame?.contentWindow?.postMessage(
    {
      protocol: PROTOCOL,
      version: PROTOCOL_VERSION,
      type,
      ...(payload === undefined ? {} : { payload }),
    },
    origin,
  );
}

function sendTokens(target: "current" | "experiment"): void {
  sendTo(target, "TOKENS_UPDATE", state[target]);
}

function sendAllTokens(): void {
  sendTokens("current");
  sendTokens("experiment");
}

function motion(action: MotionAction, extra: Record<string, unknown> = {}): void {
  const targets: ("current" | "experiment")[] =
    state.compare && state.syncPlayback ? ["current", "experiment"] : [state.editTarget];
  targets.forEach((target) =>
    sendTo(target, "MOTION_COMMAND", {
      action,
      speed: state.playbackSpeed,
      mode: state.motionMode,
      ...extra,
    }),
  );
}

function persist(): void {
  saveLabState(state);
  updateExportPreview();
}

function parseControlValue(input: HTMLInputElement | HTMLSelectElement): unknown {
  if (input instanceof HTMLInputElement && input.type === "checkbox") return input.checked;
  if (input instanceof HTMLInputElement && ["range", "number"].includes(input.type))
    return Number(input.value);
  return input.value;
}

function syncControls(): void {
  const tokens = activeTokens();
  document
    .querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-token]")
    .forEach((input) => {
      const path = input.dataset.token;
      if (!path) return;
      const value = valueAt(tokens, path);
      if (
        input instanceof HTMLInputElement &&
        (input.type === "radio" || input.type === "checkbox")
      ) {
        input.checked = input.type === "checkbox" ? Boolean(value) : input.value === String(value);
      } else if (value !== undefined && document.activeElement !== input)
        input.value = String(value);
    });
  document.querySelectorAll<HTMLOutputElement>("[data-output]").forEach((output) => {
    const path = output.dataset.output;
    if (!path) return;
    const value = valueAt(tokens, path);
    const unit = output.dataset.unit ?? (path.startsWith("motion.") ? "ms" : "");
    output.value = `${value ?? ""}${unit}`;
  });
  document.querySelectorAll<HTMLInputElement>("[data-colour-picker]").forEach((picker) => {
    const path = picker.dataset.colourPicker;
    const value = path ? valueAt(tokens, path) : undefined;
    if (typeof value === "string") picker.value = value;
  });
  document
    .querySelectorAll<HTMLElement>("[data-edit-target]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.editTarget === state.editTarget)),
    );
  const compare = document.querySelector<HTMLInputElement>("[data-compare-toggle]");
  if (compare) compare.checked = state.compare;
  const sync = document.querySelector<HTMLInputElement>("[data-sync-playback]");
  if (sync) sync.checked = state.syncPlayback;
  document.querySelectorAll<HTMLInputElement>("[data-motion-mode]").forEach((input) => {
    input.checked = input.value === state.motionMode;
  });
  document
    .querySelectorAll<HTMLElement>("[data-speed]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.speed) === state.playbackSpeed),
      ),
    );
  updateContrast();
}

function showSection(id: string): void {
  state.selectedSection = id;
  document.querySelectorAll<HTMLElement>("[data-section]").forEach((section) => {
    section.hidden = section.dataset.section !== id;
  });
  document.querySelectorAll<HTMLElement>("[data-section-button]").forEach((button) => {
    if (button.dataset.sectionButton === id) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  persist();
}

function applyControl(input: HTMLInputElement | HTMLSelectElement): void {
  const path = input.dataset.token;
  if (!path || (input instanceof HTMLInputElement && input.type === "radio" && !input.checked))
    return;
  const value = parseControlValue(input);
  state[state.editTarget] = setAt(activeTokens(), path, value);
  sendTokens(state.editTarget);
  syncControls();
  persist();
}

function contrastRatio(hexA: string, hexB: string): number {
  const luminance = (hex: string): number => {
    const channels = [1, 3, 5]
      .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
      .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
    return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
  };
  const [light, dark] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

function updateContrast(): void {
  const report = document.querySelector<HTMLElement>("[data-contrast-report]");
  if (!report) return;
  const { paper, ink, inkSoft, sageDeep } = activeTokens().colour;
  const pairs = [
    ["Ink on paper", ink, paper],
    ["Soft ink on paper", inkSoft, paper],
    ["Sage deep on paper", sageDeep, paper],
  ] as const;
  report.innerHTML = pairs
    .map(([label, foreground, background]) => {
      const ratio = contrastRatio(foreground, background);
      return `<div><strong>${label}:</strong> ${ratio.toFixed(2)}:1 — ${ratio >= 4.5 ? "Passes AA for normal text" : ratio >= 3 ? "Large text only" : "Needs review"}</div>`;
    })
    .join("");
}

function updateCompare(): void {
  const experimentShell = document.querySelector<HTMLElement>("[data-frame-shell='experiment']");
  const labels = document.querySelector<HTMLElement>("[data-compare-labels]");
  if (experimentShell) experimentShell.hidden = !state.compare;
  if (labels) labels.hidden = !state.compare;
  document
    .querySelector<HTMLElement>("[data-frames]")
    ?.classList.toggle("is-compare", state.compare);
  sizeFrames();
}

const viewportPresets: Record<string, [number, number] | undefined> = {
  responsive: undefined,
  "320x568": [320, 568],
  "390x844": [390, 844],
  "430x932": [430, 932],
  "768x1024": [768, 1024],
  "1024x768": [1024, 768],
  "1440x900": [1440, 900],
};

function selectedDimensions(): [number, number] | undefined {
  return state.viewportPreset === "custom"
    ? [state.customWidth, state.customHeight]
    : viewportPresets[state.viewportPreset];
}

function sizeFrames(): void {
  if (!canvas) return;
  const dimensions = selectedDimensions();
  const activeShells = shells.filter((shell) => !shell.hidden);
  const canvasWidth = Math.max(280, canvas.clientWidth - 36);
  const canvasHeight = Math.max(360, canvas.clientHeight - (state.compare ? 72 : 36));
  const availableWidth = (canvasWidth - (activeShells.length - 1) * 16) / activeShells.length;
  const width = dimensions?.[0] ?? Math.floor(availableWidth);
  const height = dimensions?.[1] ?? Math.floor(canvasHeight);
  let scale =
    state.fitMode === "actual" ? 1 : Math.min(1, availableWidth / width, canvasHeight / height);
  if (!dimensions) scale = 1;
  activeShells.forEach((shell) => {
    shell.style.width = `${width}px`;
    shell.style.height = `${height}px`;
    shell.style.transform = `scale(${scale})`;
    shell.style.marginInline = `${(width * (scale - 1)) / 2}px`;
    shell.style.marginBlock = `${(height * (scale - 1)) / 2}px`;
  });
  const dimensionsReadout = document.querySelector<HTMLElement>("[data-viewport-dimensions]");
  const scaleReadout = document.querySelector<HTMLElement>("[data-viewport-scale]");
  if (dimensionsReadout)
    dimensionsReadout.textContent = dimensions ? `${width} × ${height}` : "Responsive";
  if (scaleReadout) scaleReadout.textContent = `${Math.round(scale * 100)}%`;
}

function updateViewportControls(): void {
  const select = document.querySelector<HTMLSelectElement>("[data-viewport-preset]");
  if (select) select.value = state.viewportPreset;
  const custom = document.querySelector<HTMLElement>("[data-custom-dimensions]");
  if (custom) custom.hidden = state.viewportPreset !== "custom";
  const width = document.querySelector<HTMLInputElement>("[data-custom-width]");
  const height = document.querySelector<HTMLInputElement>("[data-custom-height]");
  if (width) width.value = String(state.customWidth);
  if (height) height.value = String(state.customHeight);
  document
    .querySelectorAll<HTMLElement>("[data-fit-mode]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.fitMode === state.fitMode)),
    );
  sizeFrames();
}

function updateExportPreview(filename = "design-tokens.css"): void {
  const bundle = exportBundle(state.current);
  const preview = document.querySelector<HTMLElement>("[data-export-preview]");
  if (preview) preview.textContent = bundle[filename] ?? "";
  document.querySelectorAll<HTMLElement>("[data-export-size]").forEach((node) => {
    const value = node.dataset.exportSize ? bundle[node.dataset.exportSize] : undefined;
    if (value) node.textContent = `${new Blob([value]).size.toLocaleString()} bytes`;
  });
}

function renderCustomPresets(): void {
  const container = document.querySelector<HTMLElement>("[data-custom-presets]");
  if (!container) return;
  container.replaceChildren(
    ...state.customPresets.map((preset) => {
      const row = document.createElement("div");
      const load = document.createElement("button");
      load.type = "button";
      load.textContent = preset.name;
      load.className = "studio-button";
      load.addEventListener("click", () => {
        state[state.editTarget] = cloneTokens(preset.tokens);
        sendTokens(state.editTarget);
        syncControls();
        persist();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.className = "danger-link";
      remove.addEventListener("click", () => {
        state.customPresets = state.customPresets.filter((item) => item.id !== preset.id);
        renderCustomPresets();
        persist();
      });
      row.append(load, remove);
      return row;
    }),
  );
}

document.querySelectorAll<HTMLElement>(".range-control").forEach((control) => {
  const input = control.querySelector<HTMLInputElement>("[data-token]");
  const path = input?.dataset.token;
  if (!path) return;
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "range-reset";
  reset.dataset.resetToken = path;
  reset.textContent = "Reset token";
  control.append(reset);
});

document
  .querySelectorAll<HTMLElement>("[data-section-button]")
  .forEach((button) =>
    button.addEventListener("click", () => showSection(button.dataset.sectionButton ?? "overview")),
  );
document.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-token]").forEach((input) => {
  input.addEventListener("input", () => applyControl(input));
  input.addEventListener("change", () => applyControl(input));
});
document.querySelectorAll<HTMLInputElement>("[data-colour-picker]").forEach((picker) =>
  picker.addEventListener("input", () => {
    const textInput = document.querySelector<HTMLInputElement>(
      `[data-token='${picker.dataset.colourPicker}']`,
    );
    if (textInput) {
      textInput.value = picker.value;
      applyControl(textInput);
    }
  }),
);
document.querySelectorAll<HTMLElement>("[data-reset-token]").forEach((button) =>
  button.addEventListener("click", () => {
    const path = button.dataset.resetToken;
    if (!path) return;
    state[state.editTarget] = setAt(activeTokens(), path, valueAt(canonicalTokens, path));
    sendTokens(state.editTarget);
    syncControls();
    persist();
  }),
);
document
  .querySelectorAll<HTMLElement>("[data-motion-action]")
  .forEach((button) =>
    button.addEventListener("click", () => motion(button.dataset.motionAction as MotionAction)),
  );
document
  .querySelector<HTMLSelectElement>("[data-phase-jump]")
  ?.addEventListener("change", (event) =>
    motion("STEP_FORWARD", { phase: (event.target as HTMLSelectElement).value as OpeningPhase }),
  );
document
  .querySelectorAll<HTMLElement>("[data-timeline-phase]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      motion("STEP_FORWARD", { phase: button.dataset.timelinePhase }),
    ),
  );
document.querySelectorAll<HTMLElement>("[data-speed]").forEach((button) =>
  button.addEventListener("click", () => {
    state.playbackSpeed = Number(button.dataset.speed);
    syncControls();
    motion("RESUME");
    persist();
  }),
);
document.querySelectorAll<HTMLInputElement>("[data-motion-mode]").forEach((input) =>
  input.addEventListener("change", () => {
    if (!input.checked) return;
    state.motionMode = input.value as MotionMode;
    motion("RESUME", { mode: state.motionMode });
    persist();
  }),
);
document.querySelectorAll<HTMLElement>("[data-component-state]").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelector<HTMLElement>("[data-gallery-state]")
      ?.setAttribute("data-gallery-state", button.dataset.componentState ?? "rest");
    document
      .querySelectorAll<HTMLElement>("[data-component-state]")
      .forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  }),
);
document.querySelectorAll<HTMLElement>("[data-preset]").forEach((button) =>
  button.addEventListener("click", () => {
    const preset = presets.get(button.dataset.preset ?? "");
    if (!preset) return;
    state[state.editTarget] = cloneTokens(preset.tokens);
    state.selectedPreset = preset.id;
    sendTokens(state.editTarget);
    syncControls();
    persist();
  }),
);
document
  .querySelector<HTMLInputElement>("[data-compare-toggle]")
  ?.addEventListener("change", (event) => {
    state.compare = (event.target as HTMLInputElement).checked;
    updateCompare();
    persist();
  });
document
  .querySelector<HTMLInputElement>("[data-sync-playback]")
  ?.addEventListener("change", (event) => {
    state.syncPlayback = (event.target as HTMLInputElement).checked;
    persist();
  });
document.querySelectorAll<HTMLElement>("[data-edit-target]").forEach((button) =>
  button.addEventListener("click", () => {
    state.editTarget = button.dataset.editTarget as "current" | "experiment";
    syncControls();
    persist();
  }),
);
document.querySelector<HTMLElement>("[data-copy-experiment]")?.addEventListener("click", () => {
  state.experiment = cloneTokens(state.current);
  sendTokens("experiment");
  syncControls();
  persist();
});
document.querySelector<HTMLElement>("[data-accept-experiment]")?.addEventListener("click", () => {
  if (
    !window.confirm(
      "Accept Experiment and replace Current? Export Current first if you need a record.",
    )
  )
    return;
  state.current = cloneTokens(state.experiment);
  state.editTarget = "current";
  sendAllTokens();
  syncControls();
  persist();
});
document.querySelector<HTMLElement>("[data-discard-experiment]")?.addEventListener("click", () => {
  state.experiment = cloneTokens(state.current);
  sendTokens("experiment");
  syncControls();
  persist();
});
document.querySelector<HTMLElement>("[data-reset-canonical]")?.addEventListener("click", () => {
  state[state.editTarget] = cloneTokens();
  sendTokens(state.editTarget);
  syncControls();
  persist();
});
document.querySelector<HTMLElement>("[data-save-preset]")?.addEventListener("click", () => {
  const name = window.prompt("Name this local preset");
  if (!name?.trim()) return;
  const preset: SavedPreset = {
    id: `custom-${Date.now()}`,
    name: name.trim().slice(0, 48),
    tokens: cloneTokens(activeTokens()),
  };
  state.customPresets.push(preset);
  renderCustomPresets();
  persist();
});
document.querySelector<HTMLElement>("[data-clear-state]")?.addEventListener("click", () => {
  if (!window.confirm("Clear all local Design Lab state? Export first if needed.")) return;
  clearLabState();
  window.location.reload();
});
document
  .querySelector<HTMLSelectElement>("[data-viewport-preset]")
  ?.addEventListener("change", (event) => {
    state.viewportPreset = (event.target as HTMLSelectElement).value;
    updateViewportControls();
    persist();
  });
document.querySelector<HTMLElement>("[data-rotate]")?.addEventListener("click", () => {
  const dimensions = selectedDimensions();
  if (!dimensions) return;
  [state.customWidth, state.customHeight] = [dimensions[1], dimensions[0]];
  state.viewportPreset = "custom";
  updateViewportControls();
  persist();
});
document.querySelectorAll<HTMLElement>("[data-fit-mode]").forEach((button) =>
  button.addEventListener("click", () => {
    state.fitMode = button.dataset.fitMode as "fit" | "actual";
    updateViewportControls();
    persist();
  }),
);
document
  .querySelector<HTMLInputElement>("[data-custom-width]")
  ?.addEventListener("input", (event) => {
    state.customWidth = Number((event.target as HTMLInputElement).value);
    sizeFrames();
    persist();
  });
document
  .querySelector<HTMLInputElement>("[data-custom-height]")
  ?.addEventListener("input", (event) => {
    state.customHeight = Number((event.target as HTMLInputElement).value);
    sizeFrames();
    persist();
  });
document.querySelectorAll<HTMLElement>("[data-copy-export]").forEach((button) =>
  button.addEventListener("click", async () => {
    const filename = button.dataset.copyExport;
    const value = filename ? exportBundle(state.current)[filename] : undefined;
    if (!value) return;
    await navigator.clipboard.writeText(value);
    button.textContent = "Copied";
    updateExportPreview(filename);
    window.setTimeout(() => {
      button.textContent = "Copy";
    }, 1200);
  }),
);
document.querySelectorAll<HTMLElement>("[data-download-export]").forEach((button) =>
  button.addEventListener("click", () => {
    const filename = button.dataset.downloadExport;
    const value = filename ? exportBundle(state.current)[filename] : undefined;
    if (filename && value) {
      downloadText(filename, value);
      updateExportPreview(filename);
    }
  }),
);
document.querySelectorAll<HTMLElement>("[data-mobile-mode]").forEach((button) =>
  button.addEventListener("click", () => {
    const mode = button.dataset.mobileMode ?? "controls";
    if (workspace) workspace.dataset.mobileView = mode;
    document
      .querySelectorAll<HTMLElement>("[data-mobile-mode]")
      .forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    sizeFrames();
  }),
);

window.addEventListener("message", (event) => {
  if (event.origin !== origin || !isProtocolMessage(event.data)) return;
  const sourceTarget = Array.from(frames.entries()).find(
    ([, frame]) => frame.contentWindow === event.source,
  )?.[0];
  if (!sourceTarget) return;
  if (event.data.type === "PREVIEW_READY") {
    sendTokens(sourceTarget);
    sendTo(sourceTarget, "MOTION_COMMAND", {
      action: "RESUME",
      speed: state.playbackSpeed,
      mode: state.motionMode,
    });
    if (status) status.textContent = "Preview connected";
    statusWrap?.classList.add("is-ready");
  }
  if (event.data.type === "PREVIEW_STATE" && sourceTarget === state.editTarget) {
    const current = event.data.payload.phase;
    document.querySelector<HTMLElement>("[data-current-phase]")!.textContent = current;
    document.querySelector<HTMLElement>("[data-elapsed]")!.textContent =
      `${event.data.payload.elapsed} ms`;
    const index = phases.indexOf(current);
    document.querySelectorAll<HTMLElement>("[data-timeline-phase]").forEach((item) => {
      const itemIndex = phases.indexOf(item.dataset.timelinePhase as OpeningPhase);
      item.classList.toggle("is-active", itemIndex === index);
      item.classList.toggle("is-complete", itemIndex < index);
    });
  }
});

new ResizeObserver(sizeFrames).observe(canvas ?? document.body);
showSection(state.selectedSection);
syncControls();
updateCompare();
updateViewportControls();
renderCustomPresets();
updateExportPreview();
sendAllTokens();
