/**
 * Projection and drawing helpers for the two Natural Earth maps (the
 * Philippines on Your trip, Europe to Asia on Travel). Both use the same
 * equirectangular projection as the Mactan map (src/lib/travel-plot.ts):
 * kilometres from the frame's north-west corner, with longitude corrected for
 * the frame's reference latitude. At these scales that keeps shapes honest
 * enough to read, and every point is placed from its real coordinates.
 */

export interface LandFrame {
  west: number;
  east: number;
  south: number;
  north: number;
  refLat: number;
  widthKm: number;
  heightKm: number;
}

export interface LandMap {
  frame: LandFrame;
  /** Flat [x, y, x, y, …] rings in kilometres. */
  rings: number[][];
}

export interface Point {
  x: number;
  y: number;
}

/** A rectangle in map kilometres, used as an SVG viewBox. */
export interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

const KM_PER_DEG_LAT = 110.574;
const kmPerDegLng = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);

export function project(frame: LandFrame, lat: number, lng: number): Point {
  return {
    x: (lng - frame.west) * kmPerDegLng(frame.refLat),
    y: (frame.north - lat) * KM_PER_DEG_LAT,
  };
}

/** The view that shows a lat/lng box. */
export function viewFor(
  frame: LandFrame,
  box: { west: number; east: number; south: number; north: number },
): View {
  const a = project(frame, box.north, box.west);
  const b = project(frame, box.south, box.east);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
}

/** One SVG path for every ring (relative commands keep it compact). */
export function landPath(map: LandMap): string {
  return map.rings
    .map((ring) => {
      let d = `M${ring[0]} ${ring[1]}`;
      for (let i = 2; i < ring.length; i += 2) {
        const dx = Math.round((ring[i]! - ring[i - 2]!) * 10) / 10;
        const dy = Math.round((ring[i + 1]! - ring[i - 1]!) * 10) / 10;
        d += `l${dx} ${dy}`;
      }
      return `${d}z`;
    })
    .join("");
}

/**
 * A gentle arc between two points: a quadratic curve whose control point sits
 * off the midpoint, perpendicular to the line, by `bend` of its length. A
 * positive bend lifts the arc to the left of the direction of travel.
 */
export function arc(a: Point, b: Point, bend = 0.18): { d: string; mid: Point } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const c = { x: (a.x + b.x) / 2 + dy * bend, y: (a.y + b.y) / 2 - dx * bend };
  const mid = { x: (a.x + 2 * c.x + b.x) / 4, y: (a.y + 2 * c.y + b.y) / 4 };
  const f = (v: number) => v.toFixed(1);
  return { d: `M${f(a.x)} ${f(a.y)}Q${f(c.x)} ${f(c.y)} ${f(b.x)} ${f(b.y)}`, mid };
}

/** Is a lat/lng point on land? (Even-odd test against the projected rings.) */
export function onLand(map: LandMap, lat: number, lng: number): boolean {
  const p = project(map.frame, lat, lng);
  let hit = false;
  for (const ring of map.rings) {
    for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
      const xi = ring[i]!;
      const yi = ring[i + 1]!;
      const xj = ring[j]!;
      const yj = ring[j + 1]!;
      if (yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) hit = !hit;
    }
  }
  return hit;
}
