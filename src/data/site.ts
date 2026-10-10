/**
 * The Wedding website as a product: its destinations, what the wedding screen
 * will add, and the shared imagery. Travel facts live in ./travel.ts.
 */
import type { GuideImage } from "./travel";
import { routes } from "../config/routes";

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
  | "info"
  | "boat"
  | "fish"
  | "turtle"
  | "palm"
  | "waterfall"
  | "canyon"
  | "wave"
  | "lagoon"
  | "cross"
  | "bowl"
  | "shirt"
  | "heart"
  | "ring";

export interface Destination {
  id: "home" | "travel" | "stay" | "trip" | "wedding";
  label: string;
  /** Longer title used in the app bar and page title. */
  title: string;
  path: string;
  icon: IconName;
  /** One line for the menu sheet. */
  blurb: string;
}

/** Order matters: it sets the direction of the page transition. */
export const destinations: Destination[] = [
  {
    id: "home",
    label: "Home",
    title: "Emily & Lawrence",
    path: routes.home,
    icon: "home",
    blurb: "Cebu, Sunday 24 October 2027",
  },
  {
    id: "travel",
    label: "Travel",
    title: "Travel",
    path: "travel/",
    icon: "plane",
    blurb: "London to Cebu, landing, and before you fly",
  },
  {
    id: "stay",
    label: "Stay",
    title: "Where to stay",
    path: "stay/",
    icon: "bed",
    blurb: "Six places near the wedding, on a map",
  },
  {
    id: "trip",
    label: "Your trip",
    title: "Your trip",
    path: "trip/",
    icon: "calendar",
    blurb: "The wedding weekend, and making a holiday of it",
  },
  {
    id: "wedding",
    label: "Wedding",
    title: "The wedding",
    path: "wedding/",
    icon: "pavilion",
    blurb: "The day, the venue and your calendar",
  },
];

/**
 * What the wedding screen will carry as plans are confirmed. Written for
 * guests (what they will be able to find), not as a build plan.
 */
export const weddingToCome: { icon: IconName; label: string; detail: string }[] = [
  { icon: "clock", label: "Ceremony and reception", detail: "Timings for the day" },
  { icon: "shirt", label: "What to wear", detail: "Dress guidance for the day" },
  { icon: "car", label: "Getting there on the day", detail: "Transport to the Pavilion" },
  { icon: "heart", label: "Time together", detail: "Plans for the days around the wedding" },
  { icon: "ring", label: "RSVP", detail: "With the formal invitation" },
  { icon: "info", label: "Questions", detail: "Answers as they come up" },
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
