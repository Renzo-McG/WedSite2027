/**
 * Saving a generated file to disk from the studio.
 *
 * Both download buttons used to build this inline, and both failed silently
 * in the deployed studio. Traced with real clicks against the live site
 * (writing to the actual ~/Downloads folder, not just asserting a Blob
 * exists): the blob was always valid, the anchor's `click()` always fired,
 * and no exception was ever thrown — so nothing in the page's own JS was
 * broken. What actually happened was Chrome's own repeated-automatic-download
 * protection: the first script-triggered download from an origin is allowed,
 * and every one after it is silently discarded before the OS ever writes a
 * file, with no signal a page can observe. Two buttons that each fire a blob
 * download are exactly the shape that trips it — try one, then the other,
 * and the second vanishes.
 *
 * There is no way to detect that block from JavaScript, so this function
 * cannot promise the file landed on disk. What it can promise is that our own
 * side of the pipeline — the blob, the anchor, the click — completed without
 * error, following the same download pattern real download libraries use:
 * create the object URL, attach a real anchor to the document, click it,
 * remove it, and revoke the URL only well after the browser has had time to
 * start reading it rather than the instant the synchronous click() returns.
 */

export interface DownloadResult {
  ok: boolean;
  error?: unknown;
}

/** Long enough that even a slow disk or a large file has started reading the blob. */
const REVOKE_DELAY_MS = 30_000;

export function downloadBlob(blob: Blob, filename: string): DownloadResult {
  let url: string | undefined;
  const anchor = document.createElement("a");

  try {
    url = URL.createObjectURL(blob);
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  } finally {
    // Removed unconditionally so a thrown click() never leaves it behind.
    anchor.remove();
    if (url) {
      const objectUrl = url;
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), REVOKE_DELAY_MS);
    }
  }
}
