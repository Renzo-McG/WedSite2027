import { describe, expect, it } from "vitest";
import {
  onVideoRequest,
  parseRange,
  serveVideo,
  sliceStream,
  type VideoFunctionContext,
} from "../src/lib/video-range";
import routes from "../public/_routes.json";
import stageFunction from "../functions/assets/stage/video/[file].ts?raw";
import filmFunction from "../functions/assets/guide/film/[file].ts?raw";
import { wedding } from "../src/config/wedding";
import travelPage from "../src/pages/travel/index.astro?raw";
import weddingPage from "../src/pages/wedding/index.astro?raw";

const films = import.meta.glob("../public/**/*.{mp4,webm,mov,m4v}");

/** A realistic file: patterned bytes, delivered in uneven chunks like a network body. */
const SIZE = 300_007;
const bytes = Uint8Array.from({ length: SIZE }, (_, i) => (i * 31 + 7) % 251);
const ETAG = '"film-v1"';

function asset(chunk = 7_919, size = SIZE): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < size; i += chunk)
        controller.enqueue(bytes.slice(i, Math.min(size, i + chunk)));
      controller.close();
    },
  });
  return new Response(body, {
    headers: {
      "content-type": "video/mp4",
      "content-length": String(size),
      etag: ETAG,
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}

function get(headers: Record<string, string> = {}, method = "GET"): Request {
  return new Request("https://example.pages.dev/assets/guide/film/pavilion-coast.mp4", {
    method,
    headers,
  });
}

async function body(response: Response): Promise<Uint8Array> {
  return new Uint8Array(await response.arrayBuffer());
}

describe("parseRange", () => {
  it("reads single byte ranges, open-ended and suffix ranges", () => {
    expect(parseRange("bytes=0-1", 100)).toEqual({ start: 0, end: 1 });
    expect(parseRange("bytes=50-", 100)).toEqual({ start: 50, end: 99 });
    expect(parseRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange("bytes=-500", 100)).toEqual({ start: 0, end: 99 });
    expect(parseRange("bytes=90-5000", 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange("bytes=99-99", 100)).toEqual({ start: 99, end: 99 });
    expect(parseRange(" Bytes= 10-20 ", 100)).toEqual({ start: 10, end: 20 });
  });

  it("serves the whole file for no range, other units and multiple ranges", () => {
    expect(parseRange(null, 100)).toBeNull();
    expect(parseRange("items=0-1", 100)).toBeNull();
    expect(parseRange("bytes=0-1,5-6", 100)).toBeNull();
  });

  it("rejects malformed and unsatisfiable ranges", () => {
    for (const header of [
      "bytes=",
      "bytes=-",
      "bytes=abc",
      "bytes=1-x",
      "bytes=5-2",
      "bytes=-0",
      "bytes=100-",
      "bytes=250-300",
    ]) {
      expect(parseRange(header, 100), header).toBe("unsatisfiable");
    }
    expect(parseRange("bytes=0-0", 0)).toBe("unsatisfiable");
  });
});

describe("sliceStream", () => {
  it("returns exactly the requested bytes across uneven chunk boundaries", async () => {
    for (const [start, end] of [
      [0, 0],
      [0, 7_918],
      [7_918, 7_920],
      [12_345, 200_000],
      [SIZE - 1, SIZE - 1],
    ] as const) {
      const sliced = await body(new Response(sliceStream(asset().body!, start, end)));
      expect(sliced).toEqual(bytes.slice(start, end + 1));
    }
  });

  it("stops reading the source once the range is complete", async () => {
    let pulled = 0;
    const source = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        controller.enqueue(new Uint8Array(1_000));
      },
    });
    await body(new Response(sliceStream(source, 0, 2_499)));
    expect(pulled).toBeLessThanOrEqual(4);
  });
});

describe("serveVideo", () => {
  it("answers a request without Range with the whole film and advertises ranges", async () => {
    const response = serveVideo(get(), asset());
    expect(response.status).toBe(200);
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(response.headers.get("content-type")).toBe("video/mp4");
    expect(response.headers.get("content-length")).toBe(String(SIZE));
    expect(response.headers.get("etag")).toBe(ETAG);
    expect(await body(response)).toEqual(bytes);
  });

  it.each([
    ["bytes=0-1", 0, 1],
    ["bytes=150000-150999", 150_000, 150_999],
    ["bytes=250000-", 250_000, SIZE - 1],
    [`bytes=${SIZE - 1}-${SIZE - 1}`, SIZE - 1, SIZE - 1],
    ["bytes=-1000", SIZE - 1_000, SIZE - 1],
  ])("answers %s with 206 and exactly those bytes", async (range, start, end) => {
    const response = serveVideo(get({ range }), asset());
    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe(`bytes ${start}-${end}/${SIZE}`);
    expect(response.headers.get("content-length")).toBe(String(end - start + 1));
    expect(response.headers.get("content-type")).toBe("video/mp4");
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(await body(response)).toEqual(bytes.slice(start, end + 1));
  });

  it.each(["bytes=400000-", "bytes=abc", "bytes=9-3", "bytes=-0"])(
    "answers %s with 416 and the file size",
    async (range) => {
      const response = serveVideo(get({ range }), asset());
      expect(response.status).toBe(416);
      expect(response.headers.get("content-range")).toBe(`bytes */${SIZE}`);
      expect((await body(response)).byteLength).toBe(0);
    },
  );

  it("answers HEAD with the film's headers and no body", async () => {
    const response = serveVideo(get({ range: "bytes=0-1" }, "HEAD"), asset());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-length")).toBe(String(SIZE));
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(response.body).toBeNull();
  });

  it("honours If-Range and If-None-Match against the ETag", async () => {
    expect(serveVideo(get({ range: "bytes=0-1", "if-range": ETAG }), asset()).status).toBe(206);
    expect(serveVideo(get({ range: "bytes=0-1", "if-range": '"old"' }), asset()).status).toBe(200);
    expect(serveVideo(get({ "if-none-match": ETAG }), asset()).status).toBe(304);
  });

  it("passes through a missing file or one without a known length", async () => {
    const missing = new Response("Not found", { status: 404 });
    expect(serveVideo(get({ range: "bytes=0-1" }), missing)).toBe(missing);
    const unknown = new Response(new ReadableStream(), {
      headers: { "content-type": "video/mp4" },
    });
    expect(serveVideo(get({ range: "bytes=0-1" }), unknown)).toBe(unknown);
  });
});

describe("Pages Function", () => {
  const context = (url: string, method = "GET", range?: string) => {
    const calls: string[] = [];
    const next = new Response("static");
    const ctx: VideoFunctionContext = {
      request: new Request(url, { method, headers: range ? { range } : {} }),
      env: {
        ASSETS: {
          fetch: async (input) => {
            const request = input instanceof Request ? input : new Request(input);
            calls.push(`${request.method} ${request.headers.get("range") ?? "whole"}`);
            return asset();
          },
        },
      },
      next: async () => next,
    };
    return { ctx, calls, next };
  };

  it("fetches the whole deployed film once and cuts the range itself", async () => {
    const { ctx, calls } = context(
      "https://x.pages.dev/assets/guide/film/pavilion-coast.mp4",
      "GET",
      "bytes=10-19",
    );
    const response = await onVideoRequest(ctx);
    expect(calls).toEqual(["GET whole"]);
    expect(response.status).toBe(206);
    expect(await body(response)).toEqual(bytes.slice(10, 20));
  });

  it("hands anything that is not a film, or not GET/HEAD, back to static serving", async () => {
    for (const [url, method] of [
      ["https://x.pages.dev/assets/stage/video/venue-ocean-pavilion-poster.webp", "GET"],
      ["https://x.pages.dev/assets/guide/film/pavilion-coast.mp4", "POST"],
    ] as const) {
      const { ctx, calls, next } = context(url, method);
      expect(await onVideoRequest(ctx)).toBe(next);
      expect(calls).toEqual([]);
    }
  });

  it("is mounted only at the two film folders", () => {
    for (const source of [stageFunction, filmFunction]) {
      expect(source).toContain(
        'export { onVideoRequest as onRequest } from "../../../../src/lib/video-range"',
      );
    }
  });
});

describe("Function routing", () => {
  const filmPaths = Object.keys(films)
    .map((file) => file.replace("../public", ""))
    .sort();

  it("invokes the Function for exactly the films, and every film is covered", () => {
    expect(routes.version).toBe(1);
    expect(routes.exclude).toEqual([]);
    expect([...routes.include].sort()).toEqual(filmPaths);
    expect(routes.include.every((path) => !path.includes("*"))).toBe(true);
  });

  it("covers every film the guest pages actually play", () => {
    const used = [
      ...wedding.stage.videos.map((video) => `/${video.src}`),
      ...[travelPage, weddingPage].flatMap((page) =>
        [...page.matchAll(/assets\/guide\/film\/[\w-]+\.mp4/g)].map(([path]) => `/${path}`),
      ),
    ];
    expect(used.length).toBe(3);
    for (const path of used) expect(routes.include).toContain(path);
  });
});
