import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  arrival,
  essentials,
  flightGuidance,
  flightRoutes,
  landmarks,
  stays,
  travelMeta,
  tripIdeas,
  tripShapes,
  type GuideImage,
} from "../src/data/travel";
import { airportImage, comingLater, destinations, venueImages } from "../src/data/site";
import { coastline } from "../src/data/mactan-geo";
import { distanceKm, frameFor, toKm, toPercent } from "../src/lib/travel-plot";
import { cebuOffsetHours } from "../src/lib/guide-time";
import shellSource from "../src/layouts/AppShell.astro?raw";
import externalLinkSource from "../src/components/app/ExternalLink.astro?raw";
import hotelCardSource from "../src/components/stay/HotelCard.astro?raw";
import routeExplorerSource from "../src/components/travel/RouteExplorer.astro?raw";
import travelPageSource from "../src/pages/travel/index.astro?raw";
import stayPageSource from "../src/pages/stay/index.astro?raw";
import tripPageSource from "../src/pages/trip/index.astro?raw";

const allLinks = [
  ...flightRoutes.map((route) => route.link.href),
  flightGuidance.compare.href,
  arrival.mapsLink.href,
  ...stays.map((stay) => stay.officialUrl),
  ...essentials.flatMap((item) => (item.link ? [item.link.href] : [])),
];

const allImages: GuideImage[] = [
  ...stays.map((s) => s.image),
  ...tripIdeas.map((i) => i.image),
  ...Object.values(venueImages),
  airportImage,
];

describe("Travel content", () => {
  it("links only to https destinations with no tracking or affiliate parameters", () => {
    for (const href of allLinks) {
      const url = new URL(href);
      expect(url.protocol).toBe("https:");
      for (const key of url.searchParams.keys()) {
        expect(key).not.toMatch(/^(utm_|aff|ref|partner|clickid|gclid)/i);
      }
    }
  });

  it("never needs a map API or key", () => {
    for (const source of [
      hotelCardSource,
      stayPageSource,
      travelPageSource,
      JSON.stringify(arrival),
    ]) {
      expect(source).not.toMatch(/key=|maps\/embed|maps\.googleapis|tile\./);
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

  it("labels prices as dated planning estimates", () => {
    expect(travelMeta.checked).toMatch(/^[A-Z][a-z]+ \d{4}$/);
    expect(routeExplorerSource).toContain("<Freshness");
    expect(stayPageSource).toContain("<Freshness");
    expect(flightGuidance.notYetOnSale).toMatch(/not on sale yet/);
  });

  it("includes Shangri-La without inventing a wedding rate", () => {
    const venues = stays.filter((stay) => stay.isVenue);
    expect(venues).toHaveLength(1);
    expect(venues[0]?.note).toMatch(/once confirmed/);
    expect(JSON.stringify(stays).toLowerCase()).not.toMatch(/booking code|promo|discount|% off/);
  });

  it("keeps a curated shortlist, nearest first", () => {
    expect(stays.length).toBeGreaterThanOrEqual(4);
    expect(stays.length).toBeLessThanOrEqual(6);
    const km = stays.map((stay) => stay.toVenue?.km ?? 0);
    expect([...km].sort((a, b) => a - b)).toEqual(km);
  });
});

describe("imagery", () => {
  it("ships every declared image width", () => {
    for (const image of allImages) {
      for (const width of image.widths) {
        expect(
          existsSync(`public/assets/guide/${image.name}-${width}.webp`),
          `${image.name}-${width}`,
        ).toBe(true);
      }
    }
  });

  it("credits every photograph and links the licence where one applies", () => {
    for (const image of allImages) {
      expect(image.alt.length).toBeGreaterThan(20);
      expect(image.credit.length).toBeGreaterThan(2);
      expect(image.source.length).toBeGreaterThan(10);
      if (image.status === "licensed") {
        expect(image.licence?.url).toMatch(/^https:\/\/creativecommons\.org\//);
      }
    }
  });

  it("records every unconfirmed hotel image in the asset register", () => {
    const register = readFileSync("docs/TRAVEL_AND_STAY_ASSETS.md", "utf8");
    for (const image of allImages.filter((i) => i.status === "official-unconfirmed")) {
      expect(register).toContain(image.name);
    }
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
    for (const id of shape.ideas) expect(tripIdeas.some((idea) => idea.id === id)).toBe(true);
  });

  it("never prices a trip", () => {
    expect(JSON.stringify(tripShapes)).not.toMatch(/£|\bGBP\b/);
  });
});

describe("maps", () => {
  const inside = (point: { lat: number; lng: number }, ring: [number, number][]) => {
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [yi, xi] = ring[i]!;
      const [yj, xj] = ring[j]!;
      if (
        yi > point.lat !== yj > point.lat &&
        point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi
      ) {
        hit = !hit;
      }
    }
    return hit;
  };

  it("puts every hotel and the airport on Mactan's real coastline", () => {
    const mactan = coastline.land[0]!;
    for (const point of [...stays.map((s) => s.location), landmarks.airport.location]) {
      expect(inside(point, mactan)).toBe(true);
    }
  });

  it("projects to scale", () => {
    const points = [...stays.map((stay) => stay.location), landmarks.airport.location];
    const frame = frameFor(points, 0.8);
    for (const point of points) {
      const { left, top } = toPercent(frame, point);
      expect(left).toBeGreaterThan(0);
      expect(left).toBeLessThan(100);
      expect(top).toBeGreaterThan(0);
      expect(top).toBeLessThan(100);
    }
    const venue = stays.find((stay) => stay.isVenue)!.location;
    const a = toKm(frame, landmarks.airport.location);
    const b = toKm(frame, venue);
    const real = distanceKm(landmarks.airport.location, venue);
    expect(Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - real) / real).toBeLessThan(0.01);
  });
});

describe("time", () => {
  it("knows Cebu is 7 hours ahead on the wedding weekend and 8 after the clocks change", () => {
    expect(cebuOffsetHours(new Date("2027-10-24T02:00:00Z"))).toBe(7);
    expect(cebuOffsetHours(new Date("2027-11-02T02:00:00Z"))).toBe(8);
  });
});

describe("product shell", () => {
  it("gives every destination a real page", () => {
    for (const d of destinations) {
      expect(existsSync(`src/pages/${d.path}index.astro`), d.path).toBe(true);
    }
  });

  it("keeps coming-later items as text, not links", () => {
    expect(comingLater.length).toBeGreaterThan(0);
    expect(shellSource).toContain("soon-badge");
    expect(shellSource).not.toMatch(/comingLater\.map\(\(item\) => \(\s*<li>\s*<a/);
  });

  it("opens the menu without JavaScript", () => {
    expect(shellSource).toContain('popovertarget="site-menu"');
    expect(shellSource).toContain('id="site-menu" popover');
  });

  it("drives selections with native controls", () => {
    expect(routeExplorerSource).toContain('type="radio"');
    expect(tripPageSource).toContain('type="radio"');
    expect(travelPageSource).toContain('role="tablist"');
    expect(travelPageSource).toContain('role="tabpanel"');
  });

  it("identifies every external link", () => {
    expect(externalLinkSource).toContain('target="_blank"');
    expect(externalLinkSource).toContain('rel="noopener noreferrer"');
    expect(externalLinkSource).toContain("in a new tab");
  });

  it("keeps the site out of search results", () => {
    expect(shellSource).toContain("noindex");
  });
});
