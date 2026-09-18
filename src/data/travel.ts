/**
 * Travel & Stay content — the single place to update guest travel facts.
 *
 * Every figure here is a planning estimate taken from the evidence register in
 * docs/TRAVEL_AND_STAY_EVIDENCE.md, which records the source, the date it was
 * checked and its limitations. Change a number here and update the register in
 * the same commit. Components never hold travel facts of their own.
 *
 * Pricing rules (from the brief): prices are indicative, labelled as such,
 * never multiplied by party size, and never presented with more certainty
 * than the evidence supports.
 */

export const travelMeta = {
  /** Shown beside every price so guests can see how fresh it is. */
  checked: "September 2026",
  checkedIso: "2026-09",
  wedding: {
    dayLabel: "Sunday 24 October 2027",
    venue: "Shangri-La Mactan",
    place: "Mactan Island, Cebu",
  },
} as const;

/* ------------------------------------------------------------------ flights */

export interface FlightLeg {
  from: string;
  to: string;
  /** Scheduled flying time of the fastest regular service, in minutes. */
  minutes: number;
}

export interface FlightRoute {
  id: string;
  /** How the route is introduced to guests. */
  title: string;
  hub: string;
  airline: string;
  /** London airports this carrier uses for the route. */
  londonAirports: string;
  legs: FlightLeg[];
  /** Door-to-door journey time as the airline or schedules report it. */
  journey: string;
  /** Short spoken form used in the at-a-glance line. */
  journeyShort: string;
  frequency: string;
  /** Lowest recent economy return seen for October 2026 dates, rounded. */
  fareFrom: number;
  fareNote: string;
  why: string;
  featured: boolean;
  link: { label: string; href: string; site: string };
}

export const flightRoutes: FlightRoute[] = [
  {
    id: "hong-kong",
    title: "Our suggested route",
    hub: "Hong Kong",
    airline: "Cathay Pacific",
    londonAirports: "Heathrow",
    legs: [
      { from: "London", to: "Hong Kong", minutes: 13 * 60 + 5 },
      { from: "Hong Kong", to: "Cebu", minutes: 2 * 60 + 45 },
    ],
    journey: "About 16½ hours",
    journeyShort: "16½ hours",
    frequency: "Daily from Hong Kong to Cebu",
    fareFrom: 910,
    fareNote: "Economy return, recently seen for October 2026 dates",
    why: "The quickest way to Cebu from London, with one change and a short final hop.",
    featured: true,
    link: {
      label: "See Cathay Pacific flights to Cebu",
      href: "https://flights.cathaypacific.com/destinations/en_GB/flights-from-london-to-cebu",
      site: "cathaypacific.com",
    },
  },
  {
    id: "singapore",
    title: "Another excellent option",
    hub: "Singapore",
    airline: "Singapore Airlines",
    londonAirports: "Heathrow or Gatwick",
    legs: [
      { from: "London", to: "Singapore", minutes: 13 * 60 + 45 },
      { from: "Singapore", to: "Cebu", minutes: 3 * 60 + 40 },
    ],
    journey: "About 17 to 19 hours",
    journeyShort: "17–19 hours",
    frequency: "Daily from Singapore to Cebu",
    fareFrom: 980,
    fareNote: "Economy return, recently seen for October 2026 dates",
    why: "A little longer, with a change at Changi, one of the easiest airports in the world to connect through.",
    featured: false,
    link: {
      label: "See Singapore Airlines flights to Cebu",
      href: "https://www.singaporeair.com/sg/en/plan-travel/destinations/flights-from-london-to-cebu/",
      site: "singaporeair.com",
    },
  },
  {
    id: "dubai",
    title: "Often the best value",
    hub: "Dubai",
    airline: "Emirates",
    londonAirports: "Heathrow",
    legs: [
      { from: "London", to: "Dubai", minutes: 7 * 60 },
      { from: "Dubai", to: "Cebu", minutes: 9 * 60 + 25 },
    ],
    journey: "About 19 hours",
    journeyShort: "19 hours",
    frequency: "Four flights a week from Dubai to Cebu",
    fareFrom: 860,
    fareNote: "Economy return, recently seen for late October 2026",
    why: "Frequently the lowest fare of the three. The Dubai to Cebu flight runs four days a week, so check the days suit you.",
    featured: false,
    link: {
      label: "See Emirates flights to Cebu",
      href: "https://www.emirates.com/uk/english/destinations/lhr/ceb/flights-from-london-heathrow-to-cebu/",
      site: "emirates.com",
    },
  },
];

export const flightGuidance = {
  /** A planning band, not a quote: see the evidence register for the basis. */
  budget: { low: 850, high: 1250 },
  budgetNote:
    "A sensible figure to plan around for an economy return in late October. Prices move with demand, so treat it as a guide rather than a promise.",
  notYetOnSale:
    "Flights for October 2027 are not on sale yet. Airlines usually open bookings around eleven months ahead, so expect them from late 2026. We will refresh these figures then.",
  noDirect: "There are no direct flights from the UK, so every route has one change.",
  compare: {
    label: "Compare every route on Google Flights",
    href: "https://www.google.com/travel/flights/flights-from-london-to-cebu.html",
    site: "google.com",
  },
};

/* ------------------------------------------------------------------ arrival */

export const arrival = {
  airport: "Mactan-Cebu International Airport",
  code: "CEB",
  terminal: "International flights arrive at Terminal 2.",
  toVenue: {
    km: 9,
    /** Shangri-La's own guidance; our measured light-traffic drive was 16 minutes. */
    minutes: "no more than 20 minutes",
  },
  options: [
    {
      name: "Grab",
      detail:
        "Southeast Asia's ride-hailing app, and the easiest option for most people. You see the price before you book. At Terminal 2, pick-up is at the North or South Wing drop-off.",
    },
    {
      name: "Metered taxi",
      detail: "Airport taxis queue outside arrivals and run on the meter.",
    },
    {
      name: "Hotel car",
      detail:
        "Ask your hotel about a car to meet you in arrivals. Shangri-La, for example, asks for flight details a day ahead and quotes from PHP 1,600 (about £19) for up to four people.",
    },
  ],
  mapsLink: {
    label: "Airport to Shangri-La in Google Maps",
    href: "https://www.google.com/maps/dir/?api=1&origin=Mactan-Cebu+International+Airport&destination=Shangri-La+Mactan,+Cebu&travelmode=driving",
    site: "google.com/maps",
  },
};

/* -------------------------------------------------------------------- stays */

export interface Place {
  lat: number;
  lng: number;
}

export interface Stay {
  id: string;
  name: string;
  /** Short name for the orientation plot. */
  shortName: string;
  kind: string;
  description: string;
  suits: string;
  isVenue: boolean;
  /** Measured driving distance and light-traffic time to Shangri-La. */
  toVenue: { km: number; minutes: number | null } | null;
  toVenueLabel: string;
  fromAirport: { km: number; minutes: number };
  /** Lowest nightly rate seen for a room for two in late October 2026, rounded. */
  priceFrom: number;
  location: Place;
  /** Where the plot label sits relative to the point. */
  label: "left" | "right" | "above" | "below";
  officialUrl: string;
  officialSite: string;
  /** Google Maps search text; also the directions origin. */
  mapsQuery: string;
  note?: string;
}

export const stays: Stay[] = [
  {
    id: "shangri-la",
    name: "Shangri-La Mactan, Cebu",
    shortName: "Shangri-La",
    kind: "Resort, and the wedding venue",
    description:
      "A long-established resort set in gardens on the water, with its own beach, a marine sanctuary for snorkelling, and Chi, The Spa.",
    suits:
      "Being where the celebration is. Families, and anyone who would rather not travel on the day.",
    isVenue: true,
    toVenue: null,
    toVenueLabel: "The wedding is here",
    fromAirport: { km: 9.1, minutes: 16 },
    priceFrom: 160,
    location: { lat: 10.308194, lng: 124.019728 },
    label: "below",
    officialUrl: "https://www.shangri-la.com/cebu/mactanresort/",
    officialSite: "shangri-la.com",
    mapsQuery: "Shangri-La Mactan, Cebu",
    note: "Wedding accommodation details and any preferred rate will be added once confirmed.",
  },
  {
    id: "movenpick",
    name: "Mövenpick Hotel Mactan Island Cebu",
    shortName: "Mövenpick",
    kind: "Resort hotel",
    description:
      "A relaxed five-star right next door to Shangri-La, with 245 rooms, a Mediterranean feel and a beachfront of its own.",
    suits: "Staying as close as possible at a gentler price.",
    isVenue: false,
    toVenue: { km: 0.6, minutes: null },
    toVenueLabel: "Next door",
    fromAirport: { km: 8.8, minutes: 14 },
    priceFrom: 85,
    location: { lat: 10.310525, lng: 124.023404 },
    label: "above",
    officialUrl:
      "https://movenpick.accor.com/en/asia/philippines/cebu/hotel-mactan-island-cebu.html",
    officialSite: "movenpick.accor.com",
    mapsQuery: "Mövenpick Hotel Mactan Island Cebu",
  },
  {
    id: "sheraton",
    name: "Sheraton Cebu Mactan Resort",
    shortName: "Sheraton",
    kind: "Beach resort",
    description:
      "One of the newest resorts on the island, with generously sized rooms, a beachfront pool, and clubs for children and teenagers.",
    suits: "Families, and anyone who likes things newer.",
    isVenue: false,
    toVenue: { km: 2.9, minutes: 9 },
    toVenueLabel: "9 minutes",
    fromAirport: { km: 10.8, minutes: 19 },
    priceFrom: 150,
    location: { lat: 10.320973, lng: 124.03605 },
    label: "left",
    officialUrl:
      "https://www.marriott.com/en-us/hotels/cebsi-sheraton-cebu-mactan-resort/overview/",
    officialSite: "marriott.com",
    mapsQuery: "Sheraton Cebu Mactan Resort",
  },
  {
    id: "dusit",
    name: "Dusit Thani Mactan Cebu",
    shortName: "Dusit Thani",
    kind: "Beach resort",
    description:
      "Out at the tip of the Punta Engaño peninsula, with a 100-metre infinity pool, a spa and a large play area for children.",
    suits: "A five-star resort stay that is often good value. Families.",
    isVenue: false,
    toVenue: { km: 4, minutes: 11 },
    toVenueLabel: "11 minutes",
    fromAirport: { km: 11.9, minutes: 21 },
    priceFrom: 80,
    location: { lat: 10.330393, lng: 124.039316 },
    label: "left",
    officialUrl: "https://www.dusit.com/dusitthani-mactancebu/",
    officialSite: "dusit.com",
    mapsQuery: "Dusit Thani Mactan Cebu",
  },
  {
    id: "crimson",
    name: "Crimson Resort & Spa Mactan",
    shortName: "Crimson",
    kind: "Resort and spa",
    description:
      "A six-hectare, Balinese-inspired resort with a three-tiered infinity pool, a private beach and villas with their own plunge pools.",
    suits: "Couples, and a longer resort stay with room to spread out.",
    isVenue: false,
    toVenue: { km: 4.3, minutes: 12 },
    toVenueLabel: "12 minutes",
    fromAirport: { km: 10.2, minutes: 19 },
    priceFrom: 105,
    location: { lat: 10.296647, lng: 124.014051 },
    label: "left",
    officialUrl: "https://www.crimsonhotel.com/mactan",
    officialSite: "crimsonhotel.com",
    mapsQuery: "Crimson Resort and Spa Mactan",
  },
  {
    id: "fairfield",
    name: "Fairfield by Marriott Cebu Mactan",
    shortName: "Fairfield",
    kind: "City hotel near the airport",
    description:
      "A practical, brand-new hotel (opened December 2025) five minutes from the airport. No beach, but comfortable, simple and easy on the budget.",
    suits: "Keeping costs down, or a first or last night close to your flight.",
    isVenue: false,
    toVenue: { km: 6.5, minutes: 11 },
    toVenueLabel: "11 minutes",
    fromAirport: { km: 2.6, minutes: 5 },
    priceFrom: 60,
    location: { lat: 10.326802, lng: 123.978648 },
    label: "right",
    officialUrl: "https://www.marriott.com/en-us/hotels/cebfi-fairfield-cebu-mactan/overview/",
    officialSite: "marriott.com",
    mapsQuery: "Fairfield by Marriott Cebu Mactan",
  },
];

export const stayGuidance = {
  priceNote:
    "Lowest nightly rate we saw for a room for two in late October 2026. Suites, villas and busy dates cost more. Book directly or through any site you trust to see the real price for your dates and party.",
  driveNote:
    "Drive times measured on Google Maps in light traffic. Allow longer at busy times of day.",
};

/** Fixed reference points for the orientation plot. */
export const landmarks = {
  airport: {
    name: "Mactan-Cebu International Airport",
    shortName: "Airport",
    location: { lat: 10.313617, lng: 123.983356 },
  },
  /** Off the plot to the west; shown as a direction marker only. */
  cebuCity: {
    name: "Cebu City",
    location: { lat: 10.310203, lng: 123.893677 },
  },
} as const;

/* -------------------------------------------------------------- trip length */

export type SegmentKind = "travel" | "rest" | "explore" | "wedding-around" | "wedding";

export interface TripSegment {
  days: number;
  label: string;
  kind: SegmentKind;
  detail?: string;
}

export interface TripShape {
  days: 7 | 10 | 14;
  name: string;
  summary: string;
  nightsInCebu: string;
  segments: TripSegment[];
  ideas: { title: string; detail: string }[];
}

/**
 * Door-to-door trip shapes. The wedding weekend is fixed; everything else is
 * inspiration. Only the day before, the day and the day after carry weekdays,
 * because only those are known. Exact arrival and departure recommendations
 * will follow once plans around the weekend are confirmed.
 */
export const tripShapes: TripShape[] = [
  {
    days: 7,
    name: "The wedding week",
    summary:
      "Enough for the whole wedding weekend and a couple of unhurried days by the sea on Mactan.",
    nightsInCebu: "About 5 nights in Cebu",
    segments: [
      { days: 1, label: "Fly out", kind: "travel" },
      { days: 1, label: "Arrive and rest", kind: "rest" },
      { days: 1, label: "Beach and pool", kind: "rest" },
      { days: 1, label: "Day before", kind: "wedding-around", detail: "Saturday" },
      { days: 1, label: "Wedding", kind: "wedding", detail: "Sunday 24 October" },
      { days: 1, label: "Day after", kind: "wedding-around", detail: "Monday" },
      { days: 1, label: "Fly home", kind: "travel" },
    ],
    ideas: [
      {
        title: "Island hopping from Mactan",
        detail:
          "A half or full day by traditional banca boat to the marine sanctuaries at Hilutungan and Nalusuan for snorkelling. Boats leave from the resorts and jetties on Mactan.",
      },
    ],
  },
  {
    days: 10,
    name: "The wedding and an island",
    summary:
      "A good balance: time to get over the journey, the full wedding weekend, then a few days to explore beyond Mactan.",
    nightsInCebu: "About 8 nights in the Philippines",
    segments: [
      { days: 1, label: "Fly out", kind: "travel" },
      { days: 1, label: "Arrive and rest", kind: "rest" },
      { days: 1, label: "Island hopping", kind: "explore" },
      { days: 1, label: "Day before", kind: "wedding-around", detail: "Saturday" },
      { days: 1, label: "Wedding", kind: "wedding", detail: "Sunday 24 October" },
      { days: 1, label: "Day after", kind: "wedding-around", detail: "Monday" },
      { days: 3, label: "Bohol or Moalboal", kind: "explore" },
      { days: 1, label: "Fly home", kind: "travel" },
    ],
    ideas: [
      {
        title: "Bohol",
        detail:
          "Two hours by fast ferry from Cebu City to Tagbilaran. Rolling Chocolate Hills, tiny tarsiers and the beaches of Panglao.",
      },
      {
        title: "Moalboal",
        detail:
          "Two and a half to three hours' drive to Cebu's south-west coast, where you can snorkel with huge shoals of sardines and sea turtles just off the beach.",
      },
    ],
  },
  {
    days: 14,
    name: "A Philippines holiday",
    summary:
      "Build a proper adventure around the wedding: the celebrations first, then somewhere unforgettable.",
    nightsInCebu: "About 12 nights in the Philippines",
    segments: [
      { days: 1, label: "Fly out", kind: "travel" },
      { days: 1, label: "Arrive and rest", kind: "rest" },
      { days: 1, label: "Island hopping", kind: "explore" },
      { days: 1, label: "Day before", kind: "wedding-around", detail: "Saturday" },
      { days: 1, label: "Wedding", kind: "wedding", detail: "Sunday 24 October" },
      { days: 1, label: "Day after", kind: "wedding-around", detail: "Monday" },
      { days: 6, label: "Palawan or Bohol", kind: "explore" },
      { days: 1, label: "Back to Cebu", kind: "rest" },
      { days: 1, label: "Fly home", kind: "travel" },
    ],
    ideas: [
      {
        title: "El Nido, Palawan",
        detail:
          "Limestone islands and lagoons, reached by a direct flight from Cebu of about 1 hour 50 minutes, with no need to go back through Manila.",
      },
      {
        title: "Bohol and Moalboal",
        detail:
          "Or stay in the Visayas: a few days on Bohol, then Cebu's south-west coast for the sardine run and Kawasan Falls.",
      },
    ],
  },
];

export const tripGuidance = {
  anchor:
    "We recommend planning to be in Cebu for at least the day before and the day after the wedding, as we expect to arrange some additional time together around the main day.",
  jetLag:
    "Cebu is 7 hours ahead of the UK on the wedding weekend, so arriving a couple of days early makes the celebrations much more enjoyable.",
  defaultDays: 10 as const,
};

/* ------------------------------------------------------------ good to know */

export const essentials: {
  term: string;
  detail: string;
  link?: { label: string; href: string; site: string };
}[] = [
  {
    term: "Passport",
    detail: "Valid for at least six months after the day you arrive.",
  },
  {
    term: "Visa",
    detail:
      "British citizens can visit for up to 30 days without a visa. Keep proof of your return flight to hand, as airlines and immigration may ask for it.",
    link: {
      label: "GOV.UK entry requirements for the Philippines",
      href: "https://www.gov.uk/foreign-travel-advice/philippines/entry-requirements",
      site: "gov.uk",
    },
  },
  {
    term: "eTravel",
    detail:
      "Register on the Philippines' free eTravel system within the 72 hours before you land, and keep the QR code on your phone. It is free, so ignore any site that charges.",
    link: {
      label: "Official eTravel registration",
      href: "https://etravel.gov.ph/",
      site: "etravel.gov.ph",
    },
  },
  {
    term: "Time",
    detail:
      "7 hours ahead of the UK on the wedding weekend, and 8 hours once UK clocks go back on 31 October.",
  },
  {
    term: "Money",
    detail: "Philippine pesos (PHP). In September 2026 £1 was worth about PHP 84.",
  },
  {
    term: "Weather",
    detail:
      "Warm and humid, around 25 to 30°C. Late October is the tail of the rainy season, so a passing shower is likely. Travel insurance is sensible for any long-haul trip.",
  },
  {
    term: "Plugs",
    detail: "UK plugs need an adapter.",
  },
];

/* -------------------------------------------------------------- still to come */

export const stillToCome: string[] = [
  "The wedding room rate at Shangri-La and how to book it",
  "Plans for the days around the wedding",
  "Suggested arrival and departure days",
  "Refreshed flight prices once October 2027 flights go on sale",
  "Transfers for the wedding weekend",
];
