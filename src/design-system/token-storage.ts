import { cloneTokens, sanitiseTokens } from "./tokens";
import type { MotionMode, WeddingTokens } from "./token-types";

const STORAGE_KEY = "wedding-design-lab:v1";

export interface SavedPreset {
  id: string;
  name: string;
  tokens: WeddingTokens;
}

export interface LabState {
  schemaVersion: 1;
  current: WeddingTokens;
  experiment: WeddingTokens;
  selectedSection: string;
  selectedPreset: string;
  customPresets: SavedPreset[];
  editTarget: "current" | "experiment";
  compare: boolean;
  syncPlayback: boolean;
  viewportPreset: string;
  customWidth: number;
  customHeight: number;
  fitMode: "fit" | "actual";
  motionMode: MotionMode;
  playbackSpeed: number;
}

export function defaultLabState(): LabState {
  return {
    schemaVersion: 1,
    current: cloneTokens(),
    experiment: cloneTokens(),
    selectedSection: "overview",
    selectedPreset: "canonical",
    customPresets: [],
    editTarget: "current",
    compare: false,
    syncPlayback: true,
    viewportPreset: "responsive",
    customWidth: 390,
    customHeight: 844,
    fitMode: "fit",
    motionMode: "normal",
    playbackSpeed: 1,
  };
}

export function loadLabState(): LabState {
  const fallback = defaultLabState();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return fallback;
    const raw = JSON.parse(stored) as Partial<LabState>;
    return {
      ...fallback,
      ...raw,
      schemaVersion: 1,
      current: sanitiseTokens(raw.current),
      experiment: sanitiseTokens(raw.experiment),
      customPresets: Array.isArray(raw.customPresets)
        ? raw.customPresets
            .filter((item): item is SavedPreset => Boolean(item && item.id && item.name))
            .map((item) => ({ ...item, tokens: sanitiseTokens(item.tokens) }))
        : [],
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return fallback;
  }
}

export function saveLabState(state: LabState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearLabState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
