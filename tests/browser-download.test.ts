import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlob } from "../src/lib/browser-download";

/**
 * The real bug lived at the browser level (Chrome silently discards a second
 * script-triggered download from the same origin, with no signal a page can
 * observe) — that was confirmed instead by writing real files to disk through
 * a real browser during the fix, not something a unit test can reproduce.
 *
 * The project has no DOM test environment (every other suite tests pure data
 * functions), and adding one is out of scope for a hotfix. This suite stands
 * up the minimum fake `document`/`URL` needed to exercise the function's own
 * logic in plain Node: the anchor is built, attached, clicked and always
 * removed; the object URL is revoked late rather than immediately; a thrown
 * error is reported rather than left to escape.
 */

interface FakeAnchor {
  tagName: "A";
  href: string;
  download: string;
  rel: string;
  style: { display: string };
  click: () => void;
  parentNode: unknown;
}

function installFakeDom(clickImpl: () => void = () => undefined): {
  anchors: FakeAnchor[];
  body: { appendChild: ReturnType<typeof vi.fn>; contains: (a: FakeAnchor) => boolean };
} {
  const anchors: FakeAnchor[] = [];
  const attached = new Set<FakeAnchor>();

  const body = {
    appendChild: vi.fn((el: FakeAnchor) => {
      attached.add(el);
      el.parentNode = body;
    }),
    contains: (el: FakeAnchor) => attached.has(el),
  };

  const fakeDocument = {
    createElement: vi.fn((tag: string) => {
      if (tag !== "a") throw new Error(`unexpected tag ${tag}`);
      const anchor: FakeAnchor = {
        tagName: "A",
        href: "",
        download: "",
        rel: "",
        style: { display: "" },
        click: vi.fn(clickImpl),
        parentNode: null,
      };
      anchors.push(anchor);
      return anchor as unknown as HTMLAnchorElement;
    }),
    body: {
      ...body,
      // `.remove()` on the returned anchor is really `parentNode.removeChild`,
      // but jsdom-style elements expose `.remove()` directly, so the fake
      // anchor gets one that detaches it from this fake body.
    },
  };

  // The anchor's own `.remove()` needs to know about `attached`.
  const originalCreate = fakeDocument.createElement.getMockImplementation()!;
  fakeDocument.createElement.mockImplementation((tag: string) => {
    const anchor = originalCreate(tag) as unknown as FakeAnchor;
    (anchor as unknown as { remove: () => void }).remove = () => attached.delete(anchor);
    return anchor as unknown as HTMLAnchorElement;
  });

  vi.stubGlobal("document", fakeDocument);
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:fake-url"),
    revokeObjectURL: vi.fn(),
  });
  vi.stubGlobal("window", { setTimeout, clearTimeout });

  return { anchors, body };
}

describe("downloadBlob", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("creates, attaches, clicks and removes a real anchor", () => {
    const { anchors, body } = installFakeDom();
    const blob = { type: "text/plain" } as Blob;

    const result = downloadBlob(blob, "hello.txt");

    expect(result.ok).toBe(true);
    expect(anchors).toHaveLength(1);
    const anchor = anchors[0]!;
    expect(anchor.download).toBe("hello.txt");
    expect(anchor.href).toBe("blob:fake-url");
    expect(anchor.click).toHaveBeenCalledOnce();
    expect(body.appendChild).toHaveBeenCalledWith(anchor);
    expect(body.contains(anchor)).toBe(false);
  });

  /* The whole point of the fix: revoking too early is the classic cause of a
     download silently failing to read the blob's bytes in time. */
  it("does not revoke the object URL synchronously", () => {
    installFakeDom();
    downloadBlob({} as Blob, "x.txt");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("revokes the object URL once enough time has passed", () => {
    installFakeDom();
    downloadBlob({} as Blob, "x.txt");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("reports failure instead of throwing when the browser refuses", () => {
    installFakeDom();
    vi.mocked(URL.createObjectURL).mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const result = downloadBlob({} as Blob, "x.txt");
    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(DOMException);
  });

  it("never leaves a stray anchor attached even when click() throws", () => {
    const { anchors, body } = installFakeDom(() => {
      throw new Error("click failed");
    });
    const result = downloadBlob({} as Blob, "x.txt");
    expect(result.ok).toBe(false);
    expect(body.contains(anchors[0]!)).toBe(false);
  });

  it("still schedules a revoke even when click() throws, so the URL is not leaked", () => {
    installFakeDom(() => {
      throw new Error("click failed");
    });
    downloadBlob({} as Blob, "x.txt");
    vi.advanceTimersByTime(30_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });
});
