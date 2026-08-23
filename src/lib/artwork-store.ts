/**
 * Local storage for the uploaded Canva artwork.
 *
 * IndexedDB rather than localStorage because an SVG export can run to
 * hundreds of kilobytes, which localStorage will refuse. Exactly two slots are
 * kept — the current artwork and the one it replaced — which is all the
 * "was the new Canva edit actually better?" comparison needs, without turning
 * into a version-control system.
 */

const DB_NAME = "eandl.save-the-date-studio";
const DB_VERSION = 1;
const STORE = "artwork";

/**
 * Four live slots plus their previous counterparts. The monogram is
 * conceptually one asset in two layers, so both pieces are versioned together
 * by `stashMonogramPair()` — replacing one layer never leaves the studio
 * showing a mismatched outer from today and inner from last week.
 */
export type ArtworkSlot =
  | "current"
  | "previous"
  | "monogram-outer"
  | "monogram-inner"
  | "monogram-outer-previous"
  | "monogram-inner-previous";

export const MONOGRAM_SLOTS = {
  outer: "monogram-outer",
  inner: "monogram-inner",
  outerPrevious: "monogram-outer-previous",
  innerPrevious: "monogram-inner-previous",
} as const;

export interface StoredArtwork {
  slot: ArtworkSlot;
  /** Raw SVG source, kept as text so it can be re-inspected and re-exported. */
  source: string;
  fileName: string;
  savedAt: string;
  approved?: boolean;
  /** How this artwork arrived, so the studio's status line survives a reload. */
  origin?: "local" | "imported";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "slot" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB unavailable"));
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Artwork store failed"));
        transaction.oncomplete = () => db.close();
      }),
  );
}

export async function readArtwork(slot: ArtworkSlot): Promise<StoredArtwork | null> {
  try {
    const value = await tx<StoredArtwork | undefined>("readonly", (store) => store.get(slot));
    return value ?? null;
  } catch {
    return null;
  }
}

async function writeArtwork(record: StoredArtwork): Promise<void> {
  try {
    await tx("readwrite", (store) => store.put(record));
  } catch {
    // A blocked or full store leaves the session working, just not persistent.
  }
}

/**
 * Saves a new artwork, moving whatever was current into the previous slot so
 * the two can be compared. Replacing artwork deliberately touches nothing
 * else: every layout, frost and placement value is stored separately and
 * survives untouched.
 */
export async function putCurrentArtwork(
  source: string,
  fileName: string,
  origin: "local" | "imported" = "local",
): Promise<void> {
  const existing = await readArtwork("current");
  if (existing) {
    await writeArtwork({ ...existing, slot: "previous", approved: false });
  }
  await writeArtwork({
    slot: "current",
    source,
    fileName,
    savedAt: new Date().toISOString(),
    approved: false,
    origin,
  });
}

/**
 * Copies whichever monogram layers are present into their previous slots, so
 * the pair can be compared as a set. Called once before either layer is
 * replaced, never per-layer.
 */
export async function stashMonogramPair(): Promise<void> {
  const outer = await readArtwork(MONOGRAM_SLOTS.outer);
  const inner = await readArtwork(MONOGRAM_SLOTS.inner);
  if (outer) await writeArtwork({ ...outer, slot: MONOGRAM_SLOTS.outerPrevious });
  if (inner) await writeArtwork({ ...inner, slot: MONOGRAM_SLOTS.innerPrevious });
}

/** Stores one monogram layer, having already stashed the outgoing pair. */
export async function putMonogramLayer(
  layer: "outer" | "inner",
  source: string,
  fileName: string,
  origin: "local" | "imported" = "local",
): Promise<void> {
  await writeArtwork({
    slot: layer === "outer" ? MONOGRAM_SLOTS.outer : MONOGRAM_SLOTS.inner,
    source,
    fileName,
    savedAt: new Date().toISOString(),
    approved: false,
    origin,
  });
}

/** Removes both monogram layers, returning the studio to the starting pair. */
export async function clearMonogram(): Promise<void> {
  for (const slot of [MONOGRAM_SLOTS.outer, MONOGRAM_SLOTS.inner]) {
    try {
      await tx("readwrite", (store) => store.delete(slot));
    } catch {
      // Nothing to do: the caller falls back to the bundled starting pair.
    }
  }
}

export async function markCurrentApproved(): Promise<void> {
  const current = await readArtwork("current");
  if (current) await writeArtwork({ ...current, approved: true });
}

export async function clearArtwork(): Promise<void> {
  try {
    await tx("readwrite", (store) => store.clear());
  } catch {
    // Nothing to do: the caller already falls back to the built-in wording.
  }
}

/** An object URL for the stored SVG. Callers revoke it when they swap sources. */
export function artworkObjectUrl(source: string): string {
  return URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
}
