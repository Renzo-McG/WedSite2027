/**
 * Builds the "download production package" ZIP.
 *
 * Written by hand rather than pulled from a dependency: the archive is three
 * small text files, and a stored (uncompressed) ZIP is a short, well-specified
 * format. Adding a build dependency to a local design tool would be the more
 * expensive choice.
 *
 * Everything here is pure, so the archive structure is unit tested without a
 * browser.
 */

export interface PackageFile {
  name: string;
  content: string;
}

/* --------------------------------------------------------------- CRC-32 */

let crcTable: Uint32Array | null = null;

function table(): Uint32Array {
  if (crcTable) return crcTable;
  const next = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    next[i] = c >>> 0;
  }
  crcTable = next;
  return next;
}

export function crc32(bytes: Uint8Array): number {
  const lookup = table();
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = (lookup[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/* ------------------------------------------------------------------ ZIP */

function u16(value: number): number[] {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function u32(value: number): number[] {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

/**
 * A ZIP archive with no compression (method 0). Returns the raw bytes, which
 * the caller wraps in a Blob and hands to the browser as a download.
 */
export function buildZip(files: readonly PackageFile[]): Uint8Array {
  const encoder = new TextEncoder();
  const local: number[] = [];
  const central: number[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = Array.from(encoder.encode(file.name));
    const dataBytes = encoder.encode(file.content);
    const checksum = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header, then the stored data.
    const header = [
      ...u32(0x04034b50),
      ...u16(20), // version needed
      ...u16(0),
      ...u16(0), // stored
      ...u16(0),
      ...u16(0), // no meaningful mtime; the README carries the export date
      ...u32(checksum),
      ...u32(size),
      ...u32(size),
      ...u16(nameBytes.length),
      ...u16(0),
      ...nameBytes,
    ];
    local.push(...header, ...Array.from(dataBytes));

    central.push(
      ...u32(0x02014b50),
      ...u16(20),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(checksum),
      ...u32(size),
      ...u32(size),
      ...u16(nameBytes.length),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(offset),
      ...nameBytes,
    );

    offset += header.length + size;
  }

  const end = [
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(files.length),
    ...u16(files.length),
    ...u32(central.length),
    ...u32(offset),
    ...u16(0),
  ];

  return Uint8Array.from([...local, ...central, ...end]);
}

/* -------------------------------------------------------------- package */

export interface PackageInput {
  /** Raw SVG source, or null when the built-in wording is the approved look. */
  artworkSvg: string | null;
  settingsJson: string;
  artworkDimensions: string;
  exportedAt: string;
}

/**
 * The handover package: the approved artwork and the settings that place it.
 *
 * Deliberately excludes the video, the fonts, the repository and the
 * screenshots — this exists so a later production pass has exactly what it
 * needs and nothing it would have to ignore.
 */
export function productionPackage(input: PackageInput): PackageFile[] {
  const files: PackageFile[] = [];

  if (input.artworkSvg) {
    files.push({
      name: "save-the-date-approved/invitation-artwork.svg",
      content: input.artworkSvg,
    });
  }

  files.push({ name: "save-the-date-approved/settings.json", content: input.settingsJson });

  const readme = [
    "Save the Date — approved composition",
    "",
    `Exported: ${input.exportedAt}`,
    `Artwork:  ${input.artworkSvg ? input.artworkDimensions : "built-in wording (no SVG)"}`,
    "",
    "settings.json holds the placement, frost and functional-zone values chosen",
    "in the Save the Date Studio. Sizes and gaps are a percentage of the",
    "invitation's own width; frost height and position are a percentage of the",
    "phone screen.",
    "",
    "The video, fonts and site source are deliberately not included.",
    "",
  ].join("\n");

  files.push({ name: "save-the-date-approved/README.txt", content: readme });
  return files;
}

/* ------------------------------------------------------------ zip reading */

export interface ReadFile {
  name: string;
  bytes: Uint8Array;
}

function u16At(bytes: Uint8Array, at: number): number {
  return (bytes[at] ?? 0) | ((bytes[at + 1] ?? 0) << 8);
}

function u32At(bytes: Uint8Array, at: number): number {
  return (
    ((bytes[at] ?? 0) |
      ((bytes[at + 1] ?? 0) << 8) |
      ((bytes[at + 2] ?? 0) << 16) |
      ((bytes[at + 3] ?? 0) << 24)) >>>
    0
  );
}

/**
 * Reads a ZIP by walking its central directory, which is the only reliable
 * way to find entries — scanning for local headers trips over data that
 * happens to contain the signature.
 *
 * Handles stored entries directly and deflated ones through the platform's own
 * DecompressionStream, so importing a look works whether it came from this
 * studio or was re-zipped by a mail client on the way.
 */
export async function readZip(buffer: ArrayBuffer): Promise<ReadFile[]> {
  const bytes = new Uint8Array(buffer);

  // End-of-central-directory sits within the last 64KB, after any comment.
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i -= 1) {
    if (u32At(bytes, i) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end === -1) throw new Error("not-a-zip");

  const count = u16At(bytes, end + 10);
  let pointer = u32At(bytes, end + 16);
  const files: ReadFile[] = [];
  const decoder = new TextDecoder();

  for (let i = 0; i < count; i += 1) {
    if (u32At(bytes, pointer) !== 0x02014b50) throw new Error("corrupt-zip");

    const method = u16At(bytes, pointer + 10);
    const compressedSize = u32At(bytes, pointer + 20);
    const nameLength = u16At(bytes, pointer + 28);
    const extraLength = u16At(bytes, pointer + 30);
    const commentLength = u16At(bytes, pointer + 32);
    const localOffset = u32At(bytes, pointer + 42);
    const name = decoder.decode(bytes.subarray(pointer + 46, pointer + 46 + nameLength));

    // The local header repeats the name/extra lengths, which may differ.
    const localNameLength = u16At(bytes, localOffset + 26);
    const localExtraLength = u16At(bytes, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = bytes.subarray(dataStart, dataStart + compressedSize);

    if (method === 0) {
      files.push({ name, bytes: new Uint8Array(raw) });
    } else if (method === 8) {
      const stream = new Blob([raw as BlobPart])
        .stream()
        .pipeThrough(new DecompressionStream("deflate-raw"));
      const inflated = await new Response(stream).arrayBuffer();
      files.push({ name, bytes: new Uint8Array(inflated) });
    } else {
      throw new Error("unsupported-compression");
    }

    pointer += 46 + nameLength + extraLength + commentLength;
  }

  return files;
}

/* ------------------------------------------------------- complete look */

export const LOOK_SCHEMA_VERSION = 1;

export interface LookManifest {
  schemaVersion: number;
  exportedAt: string;
  settings: Record<string, number | string>;
}

/**
 * The shareable look: the artwork and the settings that place it, together.
 * Distinct from the production package, which is the handover to whoever
 * builds the final site.
 */
export function completeLookPackage(
  artworkSvg: string | null,
  manifest: LookManifest,
): PackageFile[] {
  const files: PackageFile[] = [];
  if (artworkSvg) files.push({ name: "invitation-artwork.svg", content: artworkSvg });
  files.push({ name: "settings.json", content: JSON.stringify(manifest, null, 2) });
  files.push({
    name: "README.txt",
    content: [
      "Emily & Lawrence — Save the Date Studio Look",
      "",
      "Contains:",
      "- Canva SVG artwork",
      "- Studio visual settings",
      "",
      "To use:",
      "1. Open the shared Save the Date Studio.",
      "2. Choose Import complete look.",
      "3. Select this ZIP.",
      "",
    ].join("\n"),
  });
  return files;
}

export type LookImport =
  | { ok: true; artworkSvg: string | null; settings: Record<string, number | string> }
  | { ok: false; reason: string };

/**
 * Validates an imported look. Every failure returns a sentence that can be
 * shown to someone who has never seen a ZIP's insides.
 */
export function parseLookFiles(files: readonly ReadFile[]): LookImport {
  const decoder = new TextDecoder();
  const find = (suffix: string): ReadFile | undefined =>
    files.find((file) => file.name.toLowerCase().endsWith(suffix));

  const settingsFile = find("settings.json");
  if (!settingsFile) {
    return { ok: false, reason: "That file does not contain a studio look — no settings found." };
  }

  let manifest: Partial<LookManifest>;
  try {
    manifest = JSON.parse(decoder.decode(settingsFile.bytes)) as Partial<LookManifest>;
  } catch {
    return { ok: false, reason: "The settings inside that file are damaged and cannot be read." };
  }

  if (typeof manifest.schemaVersion !== "number") {
    return { ok: false, reason: "That look is missing its version and cannot be opened safely." };
  }
  if (manifest.schemaVersion > LOOK_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: "That look was made in a newer version of the studio than this one.",
    };
  }
  if (typeof manifest.settings !== "object" || manifest.settings === null) {
    return { ok: false, reason: "That look does not contain any design settings." };
  }

  const artworkFile = find(".svg");
  return {
    ok: true,
    artworkSvg: artworkFile ? decoder.decode(artworkFile.bytes) : null,
    settings: manifest.settings,
  };
}
