/**
 * The Wedding website as a product: its destinations, what is coming later,
 * and the shared imagery. Travel facts live in ./travel.ts.
 */
import type { GuideImage } from "./travel";

export type IconName =
  | "home"
  | "plane"
  | "bed"
  | "calendar"
  | "pavilion"
  | "menu"
  | "close"
  | "arrow-out"
  | "arrow-right"
  | "car"
  | "taxi"
  | "phone"
  | "clock"
  | "passport"
  | "stamp"
  | "qr"
  | "money"
  | "sun"
  | "plug"
  | "check"
  | "pin"
  | "map"
  | "sort"
  | "list"
  | "chevron-left"
  | "chevron-right"
  | "sparkle"
  | "info";

export interface Destination {
  id: "home" | "travel" | "stay" | "trip" | "wedding";
  label: string;
  /** Longer title used in the app bar and page title. */
  title: string;
  path: string;
  icon: IconName;
}

/** Order matters: it sets the direction of the page transition. */
export const destinations: Destination[] = [
  { id: "home", label: "Home", title: "Emily & Lawrence", path: "welcome/", icon: "home" },
  { id: "travel", label: "Travel", title: "Travel", path: "travel/", icon: "plane" },
  { id: "stay", label: "Stay", title: "Where to stay", path: "stay/", icon: "bed" },
  { id: "trip", label: "Your trip", title: "Your trip", path: "trip/", icon: "calendar" },
  { id: "wedding", label: "Wedding", title: "The wedding", path: "wedding/", icon: "pavilion" },
];

/** Shown in navigation as not-yet-available. They are not links. */
export const comingLater = [
  { label: "Schedule", detail: "The weekend's plans, once confirmed" },
  { label: "RSVP", detail: "With the formal invitation" },
  { label: "Questions", detail: "Answers to common questions" },
];

export const venueImages: Record<"aerial" | "pavilion" | "interior", GuideImage> = {
  aerial: {
    name: "venue-aerial",
    widths: [1080, 1920],
    aspect: [16, 9],
    alt: "The Ocean Pavilion at Shangri-La Mactan from above, with the breakwater and turquoise sea",
    credit: "Shangri-La Mactan",
    source: "Shangri-La Mactan Event Spaces film",
    status: "venue-film",
  },
  pavilion: {
    name: "pavilion-exterior",
    widths: [900, 1600],
    aspect: [16, 9],
    alt: "The timber A-frame of the Ocean Pavilion against a clear blue sky",
    credit: "Shangri-La Mactan",
    source: "Shangri-La Mactan Event Spaces film",
    status: "venue-film",
  },
  interior: {
    name: "pavilion-interior",
    widths: [700, 1200],
    aspect: [16, 9],
    alt: "Inside the Ocean Pavilion: tall timber and glass A-frames looking out to sea",
    credit: "Shangri-La Mactan",
    source: "Shangri-La Mactan Event Spaces film",
    status: "venue-film",
  },
};

export const airportImage: GuideImage = {
  name: "arrive-airport",
  widths: [700, 1200],
  aspect: [4, 3],
  alt: "Mactan-Cebu International Airport Terminal 2 at night, with its timber-clad canopy",
  credit: "Ralff Nestor Nacor",
  source:
    "https://commons.wikimedia.org/wiki/File:Outside_Mactan-Cebu_International_Airport_Terminal_2.jpg",
  status: "licensed",
  licence: { name: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" },
};

/** What the guide already covers, and what arrives later. Drives the Home timeline. */
export const readiness: { label: string; state: "done" | "now" | "soon"; detail: string }[] = [
  { label: "Save the Date", state: "done", detail: "Live, with a calendar entry" },
  { label: "Travel and stay guide", state: "now", detail: "Flights, hotels and trip ideas" },
  { label: "Wedding room rate", state: "soon", detail: "Shangri-La, once confirmed" },
  { label: "Formal invitation", state: "soon", detail: "With RSVP" },
  { label: "Weekend schedule", state: "soon", detail: "The days around the wedding" },
];
