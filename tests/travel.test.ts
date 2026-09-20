import { describe, expect, it } from "vitest";
import {
  arrival,
  essentials,
  flightGuidance,
  flightRoutes,
  holidayLengths,
  holidayPlaces,
  journeyMinutes,
  landmarks,
  stays,
  travelMeta,
  weddingWindow,
  type GuideImage,
} from "../src/data/travel";
import { airportImage, destinations, venueImages, weddingToCome } from "../src/data/site";
import { coastline } from "../src/data/mactan-geo";
import { philippines } from "../src/data/land-geo";
import { onLand } from "../src/lib/geo";
import { distanceKm, frameFor, frameWithAspect, toKm, toPercent } from "../src/lib/travel-plot";
import { cebuOffsetHours } from "../src/lib/guide-time";
import shellSource from "../src/layouts/AppShell.astro?raw";
import externalLinkSource from "../src/components/app/ExternalLink.astro?raw";
import hotelCardSource from "../src/components/stay/HotelCard.astro?raw";
import flightPlannerSource from "../src/components/travel/FlightPlanner.astro?raw";
import holidaySource from "../src/components/trip/HolidayExplorer.astro?raw";
import travelPageSource from "../src/pages/travel/index.astro?raw";
import stayPageSource from "../src/pages/stay/index.astro?raw";
import homePageSource from "../src/pages/welcome/index.astro?raw";
import weddingPageSource from "../src/pages/wedding/index.astro?raw";
import motionSource from "../src/scripts/app/motion.ts?raw";
import journeySource from "../src/scripts/app/journey.ts?raw";
import welcomeSource from "../src/scripts/app/welcome.ts?raw";
import staySource from "../src/scripts/app/stay.ts?raw";
import tripSource from "../src/scripts/app/trip.ts?raw";
import arriveSource from "../src/scripts/app/arrive.ts?raw";
import assetRegister from "../docs/TRAVEL_AND_STAY_ASSETS.md?raw";

// Files that exist, found by Vite at test time (no Node file APIs needed).
const guideFiles = new Set(
  Object.keys(import.meta.glob("../public/assets/guide/*.webp")).map((f) => f.split("/").pop()),
);
const pages = new Set(Object.keys(import.meta.glob("../src/pages/*/index.astro")));

const allLinks = [
  ...flightRoutes.map((route) => route.link.href),
  flightGuidance.compare.href,
  arrival.mapsLink.href,
  ...stays.map((stay) => stay.officialUrl),
  ...essentials.flatMap((item) => (item.link ? [item.link.href] : [])),
];

const allImages: GuideImage[] = [
  ...stays.map((s) => s.image),
  ...holidayPlaces.map((place) => place.image),
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
      expect(route.legs[0]?.to).toBe(route.hub);
      expect(route.hubCode).toMatch(/^[A-Z]{3}$/);
      expect(route.fareFrom).toBeGreaterThanOrEqual(flightGuidance.budget.low);
      expect(route.fareFrom).toBeLessThanOrEqual(flightGuidance.budget.high);
      expect(route.fareNote).toMatch(/recently seen/);
    }
  });

  it("draws each journey to the length the airline quotes, change included", () => {
    // Cathay quotes about 16½ h and Emirates about 19 h door to door;
    // Singapore Airlines quotes 17 to 19 h.
    const quoted = { "hong-kong": [990, 990], singapore: [17 * 60, 19 * 60], dubai: [1135, 1140] };
    for (const route of flightRoutes) {
      const [low = 0, high = 0] = quoted[route.id as keyof typeof quoted];
      const drawn = journeyMinutes(route);
      expect(route.connection.minutes).toBeGreaterThanOrEqual(40);
      expect(drawn).toBeGreaterThanOrEqual(low - 10);
      expect(drawn).toBeLessThanOrEqual(high + 10);
    }
    expect(flightGuidance.notes.map((n) => n.body).join(" ")).toMatch(/longer/);
  });

  it("labels prices as dated planning estimates", () => {
    expect(travelMeta.checked).toMatch(/^[A-Z][a-z]+ \d{4}$/);
    expect(flightPlannerSource).toContain("<Freshness");
    expect(stayPageSource).toContain("<Freshness");
    expect(flightGuidance.notes.map((n) => n.lead).join(" ")).toMatch(/not on sale yet/);
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
        expect(guideFiles.has(`${image.name}-${width}.webp`), `${image.name}-${width}`).toBe(true);
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
    const register = assetRegister;
    for (const image of allImages.filter((i) => i.status === "official-unconfirmed")) {
      expect(register).toContain(image.name);
    }
  });
});

describe("your trip", () => {
  it("shows the three days around the wedding: Saturday 23 to Monday 25 October 2027", () => {
    expect(weddingWindow.map((d) => d.iso)).toEqual(["2027-10-23", "2027-10-24", "2027-10-25"]);
    for (const day of weddingWindow) {
      const weekday = new Date(`${day.iso}T12:00:00Z`).toLocaleDateString("en-GB", {
        weekday: "long",
        timeZone: "UTC",
      });
      expect(day.weekday).toBe(weekday);
    }
    expect(weddingWindow.map((d) => d.role)).toEqual(["arrive", "wedding", "depart"]);
  });

  it("offers 7, 10 and 14 days as a holiday, not an itinerary", () => {
    expect(holidayLengths.map((l) => l.days)).toEqual([7, 10, 14]);
    for (const length of holidayLengths) {
      // A day's travel each way, the three-day window, and the guest's own days.
      expect(1 + weddingWindow.length + length.ownDays + 1).toBe(length.days);
      expect(length.example).toMatch(/^For example/);
    }
    expect(holidaySource).toContain("Ideas, not an itinerary");
  });

  it.each(holidayLengths)("$days days reach something new, and the map shows it", (length) => {
    const reach = holidayPlaces.filter((place) => place.from <= length.days);
    expect(holidayPlaces.some((place) => place.from === length.days)).toBe(true);
    for (const place of reach) {
      const { lat, lng } = place.location;
      expect(lng, place.id).toBeGreaterThan(length.view.west);
      expect(lng, place.id).toBeLessThan(length.view.east);
      expect(lat, place.id).toBeGreaterThan(length.view.south);
      expect(lat, place.id).toBeLessThan(length.view.north);
    }
  });

  it("puts every place reached over land on real land", () => {
    for (const place of holidayPlaces.filter((p) => p.getThere.mode !== "boat")) {
      expect(onLand(philippines, place.location.lat, place.location.lng), place.id).toBe(true);
    }
  });

  it("never prices a holiday", () => {
    expect(JSON.stringify([holidayPlaces, holidayLengths])).not.toMatch(/£|\bGBP\b|PHP/);
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

  it("keeps the true shape when a map is framed to a set aspect", () => {
    const points = [...stays.map((stay) => stay.location), landmarks.airport.location];
    const frame = frameWithAspect(points, 0.8, 0.92);
    expect(frame.widthKm / frame.heightKm).toBeCloseTo(0.92, 3);
    for (const point of points) {
      const { left, top } = toPercent(frame, point);
      expect(left).toBeGreaterThan(0);
      expect(left).toBeLessThan(100);
      expect(top).toBeGreaterThan(0);
      expect(top).toBeLessThan(100);
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
      expect(pages.has(`../src/pages/${d.path}index.astro`), d.path).toBe(true);
    }
  });

  it("keeps build-status UI out of what guests see", () => {
    for (const source of [shellSource, homePageSource, weddingPageSource]) {
      expect(source).not.toMatch(/Coming later|soon-badge|Here now|readiness/);
    }
    expect(shellSource).not.toMatch(/data-clock=/);
    expect(weddingToCome.length).toBeGreaterThan(3);
  });

  it("moves between screens in the direction of travel, and respects reduced motion", () => {
    // Vitest does not load stylesheets, so check the wiring rather than the CSS.
    expect(shellSource).toContain("view-transitions.css?raw");
    expect(shellSource).toMatch(
      /types\.add\(a === -1 \|\| a === b \? "same" : a < b \? "forward" : "back"\)/,
    );
    expect(motionSource).toContain("prefers-reduced-motion: reduce");
    for (const source of [journeySource, staySource, tripSource, arriveSource]) {
      expect(source).toContain("reduceMotion()");
    }
  });

  it("opens the menu without JavaScript", () => {
    expect(shellSource).toContain('popovertarget="site-menu"');
    expect(shellSource).toContain('id="site-menu" popover');
  });

  it("drives selections with native controls", () => {
    expect(flightPlannerSource).toContain('type="radio"');
    expect(holidaySource).toContain('type="radio"');
    expect(travelPageSource).toContain('role="tablist"');
    expect(travelPageSource).toContain('role="tabpanel"');
  });

  it("treats animation interruption as direct intent, not incidental input", () => {
    expect(welcomeSource).not.toMatch(/addEventListener\("(pointerdown|wheel|keydown|touchstart)"/);
    expect(welcomeSource).toContain("intersectionRatio < 0.18");
    expect(welcomeSource).toContain('addEventListener("toggle"');
    expect(journeySource).not.toMatch(/window\.addEventListener\("(wheel|touchmove|keydown)"/);
    expect(journeySource).toContain('stage.addEventListener("pointerdown"');
    expect(journeySource).toContain("rect.bottom < window.innerHeight * 0.35");
    expect(journeySource).toContain("intersectionRatio < 0.22");
    expect(journeySource).toContain('addEventListener("toggle"');
  });

  it("presents route controls before the map and guides every route in order", () => {
    expect(flightPlannerSource.indexOf('class="jpick"')).toBeLessThan(
      flightPlannerSource.indexOf('class="jmap"'),
    );
    expect(flightPlannerSource).toContain('class="jstage__facts"');
    expect(flightPlannerSource).toContain("First flight");
    expect(flightPlannerSource).toContain("Onward flight");
    expect(journeySource).toContain("for (const input of inputs)");
    expect(journeySource).toContain("preview(input.value, 2700)");
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
