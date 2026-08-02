import { describe, expect, it } from "vitest";
import { canonicalTokens, sanitiseTokens } from "../src/design-system/tokens";
import { cssExport } from "../src/design-system/token-css";
import { motionExport } from "../src/design-system/token-export";
import { loadLabState } from "../src/design-system/token-storage";

describe("canonical design tokens", () => {
  it("keeps the canonical wedding palette", () => {
    expect(canonicalTokens.colour.paper).toBe("#f7f3eb");
    expect(canonicalTokens.colour.ink).toBe("#171712");
    expect(canonicalTokens.motion.direction).toBe("seam");
  });

  it("sanitises unsafe and out-of-range stored values", () => {
    const tokens = sanitiseTokens({
      colour: { paper: "javascript:alert(1)", lineOpacity: 99 },
      motion: { curtainDuration: -20, direction: "unknown" },
    });
    expect(tokens.colour.paper).toBe(canonicalTokens.colour.paper);
    expect(tokens.colour.lineOpacity).toBe(0.7);
    expect(tokens.motion.curtainDuration).toBe(800);
    expect(tokens.motion.direction).toBe("seam");
  });

  it("exports parseable motion JSON and usable CSS", () => {
    expect(() => JSON.parse(motionExport(canonicalTokens))).not.toThrow();
    expect(cssExport(canonicalTokens)).toContain("--paper: #f7f3eb;");
    expect(cssExport(canonicalTokens)).toContain("--duration-curtain: 2400ms;");
  });

  it("recovers safely from corrupt local state", () => {
    let removed = false;
    const storage = {
      getItem: () => "{not-json",
      removeItem: () => {
        removed = true;
      },
      setItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 1,
    } satisfies Storage;
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    expect(loadLabState().current.colour.paper).toBe(canonicalTokens.colour.paper);
    expect(removed).toBe(true);
    Reflect.deleteProperty(globalThis, "localStorage");
  });
});
