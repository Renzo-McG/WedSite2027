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

export type ArtworkSlot = "current" | "previous";

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
