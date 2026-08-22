import { describe, expect, it } from "vitest";
import { wedding } from "../src/config/wedding";
import { STAGE_VIDEO_STORAGE_KEY, selectStageVideo, type StageVideo } from "../src/lib/stage-video";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
}

function clip(id: string): StageVideo {
  return {
    id,
    src: `assets/stage/video/${id}.mp4`,
    poster: `assets/stage/video/${id}-poster.webp`,
    durationSeconds: 18,
    desktopPosition: "50% 50%",
    mobilePosition: "50% 50%",
    overlayStrength: 0.46,
    brightness: 0.95,
    saturation: 0.94,
    playbackRate: 1,
  };
}

/**
 * Driven by fixtures rather than the shipped config, so the selection rules stay
 * under test whether the stage carries one venue film or a review set.
 */
const fixtures: readonly StageVideo[] = [clip("a"), clip("b"), clip("c")];

describe("stage video selection", () => {
  it("selects and stores one random clip for a new session", () => {
    const storage = memoryStorage();
    const selection = selectStageVideo("", storage, () => 0.51, fixtures);
    expect(selection.video?.id).toBe("b");
    expect(selection.source).toBe("random");
    expect(storage.getItem(STAGE_VIDEO_STORAGE_KEY)).toBe("b");
  });

  it("reuses the persisted session choice", () => {
    const storage = memoryStorage({ [STAGE_VIDEO_STORAGE_KEY]: "c" });
    const selection = selectStageVideo("", storage, () => 0.99, fixtures);
    expect(selection.video?.id).toBe("c");
    expect(selection.source).toBe("session");
  });

  it("honours a QA override without corrupting the stored choice", () => {
    const storage = memoryStorage({ [STAGE_VIDEO_STORAGE_KEY]: "b" });
    const selection = selectStageVideo("?video=c", storage, () => 0, fixtures);
    expect(selection.video?.id).toBe("c");
    expect(selection.source).toBe("override");
    expect(storage.getItem(STAGE_VIDEO_STORAGE_KEY)).toBe("b");
  });

  it("supports the static QA mode and safely ignores invalid overrides", () => {
    const storage = memoryStorage({ [STAGE_VIDEO_STORAGE_KEY]: "a" });
    expect(selectStageVideo("?video=none", storage, Math.random, fixtures).video).toBeNull();
    expect(selectStageVideo("?video=99", storage, Math.random, fixtures).video?.id).toBe("a");
  });

  it("never returns a clip when the stage carries no media", () => {
    const selection = selectStageVideo("", memoryStorage(), () => 0, []);
    expect(selection.video).toBeNull();
    expect(selection.source).toBe("none");
  });
});

describe("the shipped Ocean Pavilion stage", () => {
  it("ships exactly one authentic venue film", () => {
    expect(wedding.stage.videos).toHaveLength(1);
    expect(wedding.stage.temporary).toBe(false);
  });

  it("selects the venue film whatever the random draw", () => {
    for (const draw of [0, 0.5, 0.999_999]) {
      const selection = selectStageVideo("", memoryStorage(), () => draw);
      expect(selection.video?.id).toBe("ocean-pavilion");
    }
  });

  it("falls back to the venue film's own poster, not unrelated art", () => {
    const [venue] = wedding.stage.videos;
    expect(wedding.stage.image).toBe(venue.poster);
  });

  it("plays the venue film at its native rate for its full length", () => {
    const [venue] = wedding.stage.videos;
    expect(venue.playbackRate).toBe(1);
    const effectiveDuration = venue.durationSeconds / venue.playbackRate;
    expect(effectiveDuration).toBeGreaterThanOrEqual(15);
    expect(effectiveDuration).toBeLessThanOrEqual(20.1);
  });
});
