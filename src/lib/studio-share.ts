/**
 * Sharing a look between Emily's browser and Lawrence's.
 *
 * There is no server, so collaboration is three deliberately simple things:
 * a starting design bundled with the site, a settings link, and a downloadable
 * look package. This module owns the first two — the encoding that survives a
 * round trip through a URL.
 *
 * A share link carries settings only, never the artwork: an SVG export is far
 * too large for a query string, and the receiving browser already has either
 * the bundled starting artwork or its own upload.
 */

import { SETTINGS_VERSION, coerceSettings, type Settings } from "./type-preview-settings";

export const SHARE_PARAM = "look";

export interface SharePayload {
  /** Bumped when the encoding itself changes, not when a control is added. */
  v: number;
  s: Settings;
}

/* ------------------------------------------------------------- base64url */

/** Base64url keeps the link clean: no +, / or = to be mangled in a message. */
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------- encode */

/**
 * Only values that differ from the baseline travel, which keeps a typical link
 * short enough to paste into a message without it looking alarming.
 */
export function encodeLook(settings: Settings, baseline: Settings): string {
  const diff: Settings = {};
  for (const [key, value] of Object.entries(settings)) {
    if (baseline[key] !== value) diff[key] = value;
  }
  const payload: SharePayload = { v: SETTINGS_VERSION, s: diff };
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

export type DecodeOutcome =
  | { ok: true; settings: Settings; version: number }
  | { ok: false; reason: "malformed" | "version" };

/**
 * Decodes a share link. Anything unreadable comes back as a plain reason the
 * studio can put in front of a non-technical user, rather than throwing.
 */
export function decodeLook(encoded: string, baseline: Settings): DecodeOutcome {
  const bytes = fromBase64Url(encoded);
  if (!bytes) return { ok: false, reason: "malformed" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (typeof parsed !== "object" || parsed === null) return { ok: false, reason: "malformed" };
  const payload = parsed as Partial<SharePayload>;
  if (typeof payload.v !== "number") return { ok: false, reason: "malformed" };

  // A link from a newer studio may reference controls this build cannot honour.
  if (payload.v > SETTINGS_VERSION) return { ok: false, reason: "version" };
  if (typeof payload.s !== "object" || payload.s === null) {
    return { ok: false, reason: "malformed" };
  }

  return {
    ok: true,
    version: payload.v,
    settings: coerceSettings({ ...baseline, ...payload.s }),
  };
}

/** The full share URL for the current look. */
export function shareUrl(origin: string, pathname: string, encoded: string): string {
  const url = new URL(pathname, origin);
  url.searchParams.set(SHARE_PARAM, encoded);
  return url.toString();
}

/* ------------------------------------------------- what am I looking at? */

export type ArtworkSource = "starting" | "local" | "imported" | "none";

export interface StudioStatus {
  artwork: ArtworkSource;
  fromSharedLink: boolean;
}

/**
 * The one-line description shown in the studio's status area, so the user
 * always knows whether they are editing the bundled design, their own upload,
 * or somebody else's shared settings.
 */
export function statusLabel(status: StudioStatus): string {
  const artwork =
    status.artwork === "starting"
      ? "Starting design"
      : status.artwork === "local"
        ? "Your Canva artwork"
        : status.artwork === "imported"
          ? "Imported look"
          : "Built-in wording";
  return status.fromSharedLink ? `${artwork} · shared settings` : artwork;
}

/**
 * A share link reproduces the look faithfully only when the other person will
 * see the same picture. Their browser cannot receive a local upload through a
 * URL, so the studio has to say so rather than hand over a link that looks
 * complete and is not.
 */
export function shareLinkCarriesArtwork(artwork: ArtworkSource): boolean {
  return artwork === "starting" || artwork === "none";
}
