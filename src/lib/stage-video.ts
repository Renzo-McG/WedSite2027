import { wedding } from "../config/wedding";

export const STAGE_VIDEO_STORAGE_KEY = "wedding-stage-video:v1";

export type StageVideo = (typeof wedding.stage.videos)[number];
export type StageVideoSource = "override" | "session" | "random" | "none";

export interface StageVideoSelection {
  video: StageVideo | null;
  source: StageVideoSource;
}

interface SessionStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function findVideo(id: string | null): StageVideo | null {
  return wedding.stage.videos.find((video) => video.id === id) ?? null;
}

/**
 * A valid query override wins without changing the normal session choice.
 * Invalid overrides deliberately fall through to the same safe session logic
 * used when no override exists.
 */
export function selectStageVideo(
  search: string,
  storage: SessionStore | null,
  random: () => number = Math.random,
): StageVideoSelection {
  const override = new URLSearchParams(search).get("video");
  if (override === "none") return { video: null, source: "none" };

  const overriddenVideo = findVideo(override);
  if (overriddenVideo) return { video: overriddenVideo, source: "override" };

  if (storage) {
    try {
      const storedVideo = findVideo(storage.getItem(STAGE_VIDEO_STORAGE_KEY));
      if (storedVideo) return { video: storedVideo, source: "session" };
      storage.removeItem(STAGE_VIDEO_STORAGE_KEY);
    } catch {
      // Blocked session storage simply uses an in-memory random choice.
    }
  }

  const boundedRandom = Math.max(0, Math.min(0.999_999, random()));
  const selected = wedding.stage.videos[Math.floor(boundedRandom * wedding.stage.videos.length)];
  if (!selected) return { video: null, source: "none" };

  if (storage) {
    try {
      storage.setItem(STAGE_VIDEO_STORAGE_KEY, selected.id);
    } catch {
      // The selected clip still works for this page even when storage is blocked.
    }
  }

  return { video: selected, source: "random" };
}
