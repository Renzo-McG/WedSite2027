import { describe, expect, it } from "vitest";
import { STAGE_VIDEO_STORAGE_KEY, selectStageVideo } from "../src/lib/stage-video";

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

describe("per-session stage video selection", () => {
  it("selects and stores one random clip for a new session", () => {
    const storage = memoryStorage();
    const selection = selectStageVideo("", storage, () => 0.51);
    expect(selection.video?.id).toBe("3");
    expect(selection.source).toBe("random");
    expect(storage.getItem(STAGE_VIDEO_STORAGE_KEY)).toBe("3");
  });

  it("reuses the persisted session choice", () => {
    const storage = memoryStorage({ [STAGE_VIDEO_STORAGE_KEY]: "2" });
    const selection = selectStageVideo("", storage, () => 0.99);
    expect(selection.video?.id).toBe("2");
    expect(selection.source).toBe("session");
  });

  it("honours a QA override without corrupting the stored choice", () => {
    const storage = memoryStorage({ [STAGE_VIDEO_STORAGE_KEY]: "2" });
    const selection = selectStageVideo("?video=4", storage, () => 0);
    expect(selection.video?.id).toBe("4");
    expect(selection.source).toBe("override");
    expect(storage.getItem(STAGE_VIDEO_STORAGE_KEY)).toBe("2");
  });

  it("supports the static QA mode and safely ignores invalid overrides", () => {
    const storage = memoryStorage({ [STAGE_VIDEO_STORAGE_KEY]: "1" });
    expect(selectStageVideo("?video=none", storage).video).toBeNull();
    expect(selectStageVideo("?video=99", storage).video?.id).toBe("1");
  });
});
