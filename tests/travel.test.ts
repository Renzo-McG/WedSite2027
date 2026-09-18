import { describe, expect, it } from "vitest";
import {
  arrival,
  essentials,
  flightGuidance,
  flightRoutes,
  landmarks,
  stays,
  travelMeta,
  tripShapes,
} from "../src/data/travel";
import { distanceKm, frameFor, toKm, toPercent } from "../src/lib/travel-plot";
import externalLinkSource from "../src/components/travel/ExternalLink.astro?raw";
import tripLengthSource from "../src/components/travel/TripLength.astro?raw";
import stayListSource from "../src/components/travel/StayList.astro?raw";
import pageSource from "../src/pages/travel/index.astro?raw";

const allLinks = [
  ...flightRoutes.map((route) => route.link.href),
  flightGuidance.compare.href,
  arrival.mapsLink.href,
  ...stays.map((stay) => stay.officialUrl),
  ...essentials.flatMap((item) => (item.link ? [item.link.href] : [])),
];

describe("Travel & Stay content", () => {
  it("links only to https destinations with no tracking or affiliate parameters", () => {
    for (const href of allLinks) {
      const url = new URL(href);
      expect(url.protocol).toBe("https:");
      for (const key of url.searchParams.keys()) {
        expect(key).not.toMatch(/^(utm_|aff|ref|partner|clickid|gclid)/i);
      }
    }
  });

  it("never needs a Google Maps API key", () => {
    const sources = [pageSource, stayListSource, JSON.stringify(arrival)];
    for (const source of sources) {
      expect(source).not.toMatch(/key=|maps\/embed|maps\.googleapis/);
    }
  });

  it("has one suggested flight route and fares inside the planning band", () => {
    expect(flightRoutes.filter((route) => route.featured)).toHaveLength(1);
    for (const route of flightRoutes) {
      expect(route.legs).toHaveLength(2);
      expect(route.legs.at(-1)?.to).toBe("Cebu");
      expect(route.fareFrom).toBeGreaterThanOrEqual(flightGuidance.budget.low);
      expect(route.fareFrom).toBeLessThanOrEqual(flightGuidance.budget.high);
      expect(route.fareNote).toMatch(/recently seen/);
    }
  });

  it("labels every price as a dated planning estimate", () => {
    expect(travelMeta.checked).toMatch(/^[A-Z][a-z]+ \d{4}$/);
    expect(pageSource.match(/Planning estimates, checked/g)?.length).toBeGreaterThanOrEqual(2);
    expect(flightGuidance.notYetOnSale).toMatch(/not on sale yet/);
  });

  it("includes Shangri-La without inventing a wedding rate", () => {
    const venues = stays.filter((stay) => stay.isVenue);
    expect(venues).toHaveLength(1);
    expect(venues[0]?.note).toMatch(/once confirmed/);
    const text = JSON.stringify(stays).toLowerCase();
    expect(text).not.toMatch(/booking code|promo|discount|% off/);
  });

  it("keeps a curated shortlist with real positions on Mactan", () => {
    expect(stays.length).toBeGreaterThanOrEqual(4);
    expect(stays.length).toBeLessThanOrEqual(6);
    for (const stay of stays) {
      expect(stay.location.lat).toBeGreaterThan(10.25);
      expect(stay.location.lat).toBeLessThan(10.36);
      expect(stay.location.lng).toBeGreaterThan(123.95);
      expect(stay.location.lng).toBeLessThan(124.06);
      expect(stay.priceFrom).toBeGreaterThan(0);
    }
  });

  it("lists stays from nearest to furthest", () => {
    const km = stays.map((stay) => stay.toVenue?.km ?? 0);
    expect([...km].sort((a, b) => a - b)).toEqual(km);
  });
});

describe("trip shapes", () => {
  it("offers 7, 10 and 14 days", () => {
    expect(tripShapes.map((shape) => shape.days)).toEqual([7, 10, 14]);
  });

  it.each(tripShapes)("$days days add up and surround the wedding", (shape) => {
    const total = shape.segments.reduce((sum, segment) => sum + segment.days, 0);
    expect(total).toBe(shape.days);
    const index = shape.segments.findIndex((segment) => segment.kind === "wedding");
    expect(index).toBeGreaterThan(0);
    expect(shape.segments[index - 1]?.label).toBe("Day before");
    expect(shape.segments[index + 1]?.label).toBe("Day after");
    expect(shape.segments[0]?.kind).toBe("travel");
    expect(shape.segments.at(-1)?.kind).toBe("travel");
  });

  it("never prices a trip", () => {
    expect(JSON.stringify(tripShapes)).not.toMatch(/£|\bGBP\b/);
  });
});

describe("orientation plot", () => {
  const points = [...stays.map((stay) => stay.location), landmarks.airport.location];
  const frame = frameFor(points, 0.9);

  it("keeps every place inside the frame", () => {
    for (const point of points) {
      const { left, top } = toPercent(frame, point);
      expect(left).toBeGreaterThan(0);
      expect(left).toBeLessThan(100);
      expect(top).toBeGreaterThan(0);
      expect(top).toBeLessThan(100);
    }
  });

  it("projects to scale", () => {
    const venue = stays.find((stay) => stay.isVenue)!.location;
    const a = toKm(frame, landmarks.airport.location);
    const b = toKm(frame, venue);
    const projected = Math.hypot(a.x - b.x, a.y - b.y);
    const real = distanceKm(landmarks.airport.location, venue);
    expect(real).toBeGreaterThan(3.5);
    expect(real).toBeLessThan(4.5);
    expect(Math.abs(projected - real) / real).toBeLessThan(0.01);
  });
});

describe("no-JavaScript and accessibility contract", () => {
  it("drives trip length with a native radio group", () => {
    expect(tripLengthSource).toContain("<fieldset");
    expect(tripLengthSource).toContain("<legend");
    expect(tripLengthSource).toContain('type="radio"');
  });

  it("identifies every external link", () => {
    expect(externalLinkSource).toContain('target="_blank"');
    expect(externalLinkSource).toContain('rel="noopener noreferrer"');
    expect(externalLinkSource).toContain("in a new tab");
  });

  it("is a standalone route with one page title", () => {
    expect(pageSource.match(/<h1/g)).toHaveLength(1);
    expect(pageSource).toContain("noindex");
  });
});
