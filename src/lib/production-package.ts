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
