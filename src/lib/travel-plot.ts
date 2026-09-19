/**
 * Projects real coordinates onto the Travel & Stay orientation plot.
 *
 * At this scale (a few kilometres of Mactan Island) an equirectangular
 * projection corrected for latitude is accurate to well under 1%, so relative
 * positions and the scale bar are true. The plot deliberately draws no
 * coastline: points, a scale and distance rings are the only geography, so
 * nothing on it is invented.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlotFrame {
  /** Plot width in kilometres (the SVG viewBox uses 100 units per km). */
  widthKm: number;
  heightKm: number;
  /** Top-left corner of the frame. */
  north: number;
  west: number;
  /** Latitude used for the longitude correction. */
  refLat: number;
}

export const UNITS_PER_KM = 100;
const KM_PER_DEG_LAT = 110.574;

function kmPerDegLng(lat: number): number {
  return 111.32 * Math.cos((lat * Math.PI) / 180);
}

/** Frames a set of points with a margin in kilometres on every side. */
export function frameFor(points: LatLng[], marginKm: number): PlotFrame {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const refLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const lngKm = kmPerDegLng(refLat);
  const north = Math.max(...lats) + marginKm / KM_PER_DEG_LAT;
  const south = Math.min(...lats) - marginKm / KM_PER_DEG_LAT;
  const west = Math.min(...lngs) - marginKm / lngKm;
  const east = Math.max(...lngs) + marginKm / lngKm;
  return {
    north,
    west,
    refLat,
    widthKm: (east - west) * lngKm,
    heightKm: (north - south) * KM_PER_DEG_LAT,
  };
}

/**
 * Frames a set of points, then widens the shorter side (evenly) until the
 * frame has the given width-to-height ratio. Used where a map must fill a
 * fixed shape and the camera crops it, like object-fit: cover.
 */
export function frameWithAspect(points: LatLng[], marginKm: number, aspect: number): PlotFrame {
  const frame = frameFor(points, marginKm);
  const lngKm = kmPerDegLng(frame.refLat);
  if (frame.widthKm / frame.heightKm < aspect) {
    const extra = aspect * frame.heightKm - frame.widthKm;
    return { ...frame, west: frame.west - extra / 2 / lngKm, widthKm: frame.widthKm + extra };
  }
  const extra = frame.widthKm / aspect - frame.heightKm;
  return {
    ...frame,
    north: frame.north + extra / 2 / KM_PER_DEG_LAT,
    heightKm: frame.heightKm + extra,
  };
}

/** Position in kilometres from the frame's top-left corner. */
export function toKm(frame: PlotFrame, point: LatLng): { x: number; y: number } {
  return {
    x: (point.lng - frame.west) * kmPerDegLng(frame.refLat),
    y: (frame.north - point.lat) * KM_PER_DEG_LAT,
  };
}

/** Position as percentages of the frame, for HTML labels laid over the SVG. */
export function toPercent(frame: PlotFrame, point: LatLng): { left: number; top: number } {
  const { x, y } = toKm(frame, point);
  return {
    left: round((x / frame.widthKm) * 100),
    top: round((y / frame.heightKm) * 100),
  };
}

/** Straight-line distance in kilometres (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
