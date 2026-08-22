/**
 * Inspection of a Canva SVG export, for the Save the Date Studio.
 *
 * Pure string/DOM-free parsing so it can be unit tested. The studio calls this
 * on upload and shows the result as a short, plain-English check list — the
 * point is to catch the handful of Canva export mistakes that actually cause
 * trouble (opaque background, live text, embedded bitmaps), not to lecture the
 * user about SVG internals.
 */

export const ARTWORK_WIDTH = 540;
export const ARTWORK_HEIGHT = 756;
export const ARTWORK_RATIO = ARTWORK_WIDTH / ARTWORK_HEIGHT;

export type ArtworkWarningCode = "ratio" | "background" | "text" | "raster" | "external" | "active";

export interface ArtworkWarning {
  code: ArtworkWarningCode;
  /** Written for someone who has never opened a developer console. */
  message: string;
  /** True when the file should not be rendered at all. */
  blocking: boolean;
}

export interface ArtworkInspection {
  ok: boolean;
  width: number | null;
  height: number | null;
  ratio: number | null;
  /** Within half a percent of 5:7. */
  ratioMatches: boolean;
  hasViewBox: boolean;
  warnings: ArtworkWarning[];
  /** Short affirmative lines for the status box. */
  passed: string[];
}

function parseLength(value: string | undefined): number | null {
  if (!value) return null;
  const match = /^\s*(-?[\d.]+)\s*(px|pt|mm|cm|in)?\s*$/.exec(value);
  if (!match?.[1]) return null;
  const numeric = Number(match[1]);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function attr(tag: string, name: string): string | undefined {
  const match = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag);
  return match?.[2] ?? match?.[3];
}

/** Strips comments and CDATA so their contents never trip the content checks. */
function stripInert(svg: string): string {
  return svg.replace(/<!--[\s\S]*?-->/g, "").replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
}

/**
 * A full-canvas opaque rect is what a Canva export looks like when
 * "Transparent Background" was left off. Detected by comparing the first
 * rect's dimensions against the canvas, allowing for a percentage form.
 */
function hasOpaqueBackdrop(body: string, width: number | null, height: number | null): boolean {
  const rects = body.match(/<rect\b[^>]*>/gi) ?? [];
  for (const rect of rects) {
    const fill = (attr(rect, "fill") ?? "").trim().toLowerCase();
    if (fill === "none" || fill === "transparent") continue;

    const opacity = attr(rect, "fill-opacity") ?? attr(rect, "opacity");
    if (opacity !== undefined && Number(opacity) === 0) continue;

    const w = attr(rect, "width") ?? "";
    const h = attr(rect, "height") ?? "";
    const coversByPercent = w.trim() === "100%" && h.trim() === "100%";
    const rw = parseLength(w);
    const rh = parseLength(h);
    const coversByLength =
      width !== null &&
      height !== null &&
      rw !== null &&
      rh !== null &&
      rw >= width * 0.98 &&
      rh >= height * 0.98;

    if (coversByPercent || coversByLength) return true;
  }
  return false;
}

/**
 * Reads a Canva SVG export and reports what the studio needs the user to know.
 * Never throws: an unreadable file comes back as a blocking warning.
 */
export function inspectSvg(source: string): ArtworkInspection {
  const warnings: ArtworkWarning[] = [];
  const passed: string[] = [];

  const openTag = /<svg\b[^>]*>/i.exec(source)?.[0];
  if (!openTag) {
    return {
      ok: false,
      width: null,
      height: null,
      ratio: null,
      ratioMatches: false,
      hasViewBox: false,
      passed: [],
      warnings: [
        {
          code: "active",
          blocking: true,
          message: "This file does not look like an SVG. Export it again from Canva as SVG.",
        },
      ],
    };
  }

  const body = stripInert(source);
  passed.push("SVG loaded");

  /* ------------------------------------------------------- dimensions */

  const viewBox = attr(openTag, "viewBox");
  const hasViewBox = Boolean(viewBox);
  let width = parseLength(attr(openTag, "width"));
  let height = parseLength(attr(openTag, "height"));

  if (viewBox) {
    const parts = viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      const vw = parts[2] ?? 0;
      const vh = parts[3] ?? 0;
      if (vw > 0 && vh > 0) {
        // The viewBox is the real coordinate system, so it wins over any
        // width/height attributes, which Canva sometimes writes in points.
        width = vw;
        height = vh;
      }
    }
  }

  const ratio = width !== null && height !== null && height > 0 ? width / height : null;
  const ratioMatches = ratio !== null && Math.abs(ratio - ARTWORK_RATIO) < 0.005;

  if (width !== null && height !== null) {
    passed.push(`${Math.round(width)} × ${Math.round(height)} canvas`);
  }

  if (ratioMatches) {
    passed.push("5:7 proportions");
  } else if (ratio !== null) {
    warnings.push({
      code: "ratio",
      blocking: false,
      message:
        "This artwork is not 540 × 756 (5:7). It will still be placed, but it may not line up with the invitation the way you expect.",
    });
  }

  /* ---------------------------------------------------------- content */

  if (/<script\b/i.test(body) || /\bon[a-z]+\s*=/i.test(body) || /<foreignObject\b/i.test(body)) {
    warnings.push({
      code: "active",
      blocking: true,
      message:
        "This SVG contains active content (a script or embedded HTML). It has not been loaded. Re-export a plain artwork SVG from Canva.",
    });
  }

  if (hasOpaqueBackdrop(body, width, height)) {
    warnings.push({
      code: "background",
      blocking: false,
      message:
        "This artwork appears to have a solid background. Export it again from Canva with Transparent Background switched on, or the venue video will be hidden behind it.",
    });
  } else {
    passed.push("Transparent background");
  }

  const hasRaster =
    /<image\b/i.test(body) || /xlink:href\s*=\s*["']data:image\/(png|jpe?g|gif|webp)/i.test(body);
  if (hasRaster) {
    warnings.push({
      code: "raster",
      blocking: false,
      message:
        "Part of this artwork is a bitmap image rather than vector shapes, so it may look soft when enlarged.",
    });
  } else {
    passed.push("Vector artwork");
  }

  if (/<text\b/i.test(body) || /<tspan\b/i.test(body)) {
    warnings.push({
      code: "text",
      blocking: false,
      message:
        "This SVG still contains live text rather than outlines. It may render with the wrong font on another computer. In Canva, export with text converted to outlines if you can.",
    });
  }

  // Anything the browser would have to fetch from elsewhere to draw this file.
  const externalHref = /\b(?:xlink:)?href\s*=\s*["'](?!#|data:)([^"']+)["']/i.test(body);
  const externalCss = /@import\b/i.test(body) || /url\(\s*["']?https?:/i.test(body);
  if (externalHref || externalCss) {
    warnings.push({
      code: "external",
      blocking: false,
      message:
        "This artwork refers to a file somewhere else. It may not draw correctly offline or on another computer.",
    });
  } else {
    passed.push("No external resources");
  }

  return {
    ok: !warnings.some((warning) => warning.blocking),
    width,
    height,
    ratio,
    ratioMatches,
    hasViewBox,
    warnings,
    passed,
  };
}
