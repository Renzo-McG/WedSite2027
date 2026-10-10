/**
 * Byte-range responses for the wedding films.
 *
 * Cloudflare Pages serves static assets whole (200) even when a request asks
 * for a byte range, and Safari / iOS will not play a video from a server that
 * does that (AVFoundation error -11850). The Pages Functions in functions/assets/
 * pass the deployed MP4 to `serveVideo()`, which answers a Range request with
 * 206 and exactly the requested bytes. public/_routes.json limits those
 * Functions to the three film files; everything else stays static.
 *
 * The slice is streamed: the deployed file is read only as far as the end of
 * the range, never held in memory, and the response goes out through a
 * FixedLengthStream so the Workers runtime sends an exact Content-Length.
 */

export interface ByteRange {
  start: number;
  /** Inclusive. */
  end: number;
}

/**
 * Reads a single `bytes=` range (RFC 9110 §14.1.2).
 *
 * - `null`: no usable Range, so send the whole file. That covers a missing
 *   header, other units and multiple ranges, which a server may ignore.
 * - `"unsatisfiable"`: a malformed byte range or one outside the file (416).
 */
export function parseRange(
  header: string | null,
  size: number,
): ByteRange | "unsatisfiable" | null {
  if (header === null) return null;
  const value = header.trim();
  if (!/^bytes=/i.test(value)) return null;
  const spec = value.slice("bytes=".length).trim();
  if (spec.includes(",")) return null;

  const match = /^(\d*)-(\d*)$/.exec(spec);
  if (!match || (match[1] === "" && match[2] === "") || size <= 0) return "unsatisfiable";
  const [, first = "", last = ""] = match;

  if (first === "") {
    const suffix = Number(last);
    if (suffix === 0) return "unsatisfiable";
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }

  const start = Number(first);
  if (start >= size) return "unsatisfiable";
  if (last === "") return { start, end: size - 1 };
  const end = Number(last);
  if (end < start) return "unsatisfiable";
  return { start, end: Math.min(end, size - 1) };
}

/** Streams bytes `start`..`end` (inclusive) of `body`, then stops reading. */
export function sliceStream(
  body: ReadableStream<Uint8Array>,
  start: number,
  end: number,
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  let offset = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        const chunkStart = offset;
        offset += value.byteLength;
        if (offset <= start) continue;
        const from = Math.max(0, start - chunkStart);
        const to = Math.min(value.byteLength, end + 1 - chunkStart);
        if (to > from) controller.enqueue(value.subarray(from, to));
        if (offset > end) {
          controller.close();
          await reader.cancel();
        }
        return;
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

/** Workers-only identity stream that makes the runtime send a fixed Content-Length. */
type FixedLengthStreamConstructor = new (length: number) => TransformStream<Uint8Array, Uint8Array>;

function withExactLength(
  stream: ReadableStream<Uint8Array>,
  length: number,
): ReadableStream<Uint8Array> {
  const Fixed = (globalThis as { FixedLengthStream?: FixedLengthStreamConstructor })
    .FixedLengthStream;
  if (!Fixed) return stream;
  const { readable, writable } = new Fixed(length);
  stream.pipeTo(writable).catch(() => undefined);
  return readable;
}

/**
 * Answers a GET or HEAD for a film from the complete deployed asset.
 * `asset` must be an unconditional, non-range GET of the same file.
 */
export function serveVideo(request: Request, asset: Response): Response {
  const declared = asset.headers.get("content-length");
  const size = declared === null ? NaN : Number(declared);
  if (!asset.ok || !asset.body || !Number.isInteger(size) || size < 0) return asset;

  const headers = new Headers();
  headers.set("Content-Type", asset.headers.get("content-type") ?? "video/mp4");
  headers.set("Accept-Ranges", "bytes");
  for (const name of ["etag", "last-modified", "cache-control"]) {
    const value = asset.headers.get(name);
    if (value) headers.set(name, value);
  }

  const etag = asset.headers.get("etag");
  const isHead = request.method === "HEAD";
  const whole = (status = 200): Response => {
    if (status !== 304) headers.set("Content-Length", String(size));
    if (isHead || status === 304) {
      void asset.body?.cancel();
      return new Response(null, { status, headers });
    }
    return new Response(asset.body, { status, headers });
  };

  if (etag && request.headers.get("if-none-match") === etag) return whole(304);
  if (isHead) return whole();

  // If-Range: only honour the range when the client's copy is still current.
  const ifRange = request.headers.get("if-range");
  if (ifRange !== null && ifRange !== etag) return whole();

  const range = parseRange(request.headers.get("range"), size);
  if (range === null) return whole();
  if (range === "unsatisfiable") {
    void asset.body.cancel();
    headers.set("Content-Range", `bytes */${size}`);
    headers.set("Content-Length", "0");
    return new Response(null, { status: 416, headers });
  }

  const length = range.end - range.start + 1;
  headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
  headers.set("Content-Length", String(length));
  const body = withExactLength(sliceStream(asset.body, range.start, range.end), length);
  return new Response(body, { status: 206, headers });
}

/** The subset of the Pages Functions context this handler uses. */
export interface VideoFunctionContext {
  request: Request;
  env: { ASSETS: { fetch(input: Request | string): Promise<Response> } };
  next(): Promise<Response>;
}

/** Pages Function handler shared by the film routes in functions/assets/. */
export async function onVideoRequest(context: VideoFunctionContext): Promise<Response> {
  const { request, env } = context;
  const { pathname } = new URL(request.url);
  if (!pathname.endsWith(".mp4") || (request.method !== "GET" && request.method !== "HEAD")) {
    return context.next();
  }
  // An unconditional whole-file GET of the deployed asset; the range is cut here.
  const asset = await env.ASSETS.fetch(new Request(request.url, { method: "GET" }));
  const response = serveVideo(request, asset);
  // TEMPORARY preview diagnostic (remove before merge): which path served the film.
  const tagged = new Response(response.body, response);
  tagged.headers.set(
    "X-Video-Range",
    `${response === asset ? "passthrough" : "served"}; asset=${asset.status}; asset-length=${asset.headers.get("content-length") ?? "none"}`,
  );
  return tagged;
}
