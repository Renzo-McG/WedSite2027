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
  /** Airport code shown on the journey timeline. */
  hubCode: string;
  hubLocation: Place;
  airline: string;
  /** London airports this carrier uses for the route. */
  londonAirports: string;
  legs: FlightLeg[];
  /**
   * Time on the ground changing planes on the quickest usual itineraries: the
   * airline's published journey time less the scheduled flying time. Longer
   * connections are common; the page says so.
   */
  connection: { minutes: number; label: string };
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
    hubCode: "HKG",
    hubLocation: { lat: 22.308, lng: 113.9185 },
    airline: "Cathay Pacific",
    londonAirports: "Heathrow",
    legs: [
      { from: "London", to: "Hong Kong", minutes: 12 * 60 + 50 },
      { from: "Hong Kong", to: "Cebu", minutes: 2 * 60 + 45 },
    ],
    connection: { minutes: 55, label: "About 1 hour" },
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
    hubCode: "SIN",
    hubLocation: { lat: 1.3644, lng: 103.9915 },
    airline: "Singapore Airlines",
    londonAirports: "Heathrow or Gatwick",
    legs: [
      { from: "London", to: "Singapore", minutes: 13 * 60 + 45 },
      { from: "Singapore", to: "Cebu", minutes: 3 * 60 + 40 },
    ],
    connection: { minutes: 90, label: "About 1½ hours" },
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
    hubCode: "DXB",
    hubLocation: { lat: 25.2532, lng: 55.3657 },
    airline: "Emirates",
    londonAirports: "Heathrow",
    legs: [
      { from: "London", to: "Dubai", minutes: 7 * 60 },
      { from: "Dubai", to: "Cebu", minutes: 9 * 60 + 25 },
    ],
    connection: { minutes: 150, label: "About 2½ hours" },
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

/** The two ends of every route, for the journey map. */
export const journeyEnds = {
  london: { name: "London", code: "LHR", location: { lat: 51.47, lng: -0.4543 } },
  cebu: { name: "Cebu", code: "CEB", location: { lat: 10.3075, lng: 123.9794 } },
} as const;

/** Total drawn journey: both flights and the connection, in minutes. */
export function journeyMinutes(route: FlightRoute): number {
  return route.legs.reduce((sum, leg) => sum + leg.minutes, 0) + route.connection.minutes;
}

export const flightGuidance = {
  /** A planning band, not a quote: see the evidence register for the basis. */
  budget: { low: 850, high: 1250 },
  budgetNote:
    "A sensible figure to plan around for an economy return in late October. Prices move with demand, so treat it as a guide rather than a promise.",
  /*
   * The three things worth knowing before booking. Kept as a lead-in and a
   * sentence each rather than one paragraph: they are separate facts, and
   * running them together made the block hard to scan.
   */
  notes: [
    {
      icon: "plane" as const,
      lead: "Every route has one change",
      body: "There are no direct flights from the UK.",
    },
    {
      icon: "clock" as const,
      lead: "Changes are shown at their quickest",
      body: "Many itineraries wait longer, so check the connection when you book.",
    },
    {
      icon: "calendar" as const,
      lead: "October 2027 is not on sale yet",
      body: "Airlines usually open bookings around eleven months ahead, so expect these flights from late 2026. We will refresh these figures then.",
    },
  ],
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
      /* Worth installing before leaving home, so it is ready on landing. */
      apps: [
        {
          store: "App Store",
          label: "iPhone",
          href: "https://apps.apple.com/gb/app/grab-food-delivery-taxi-ride/id647268330",
          site: "apps.apple.com",
        },
        {
          store: "Google Play",
          label: "Android",
          href: "https://play.google.com/store/apps/details?id=com.grabtaxi.passenger",
          site: "play.google.com",
        },
      ],
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
  /** A short factual tag shown on the card. */
  badge: string;
  image: GuideImage;
}

/**
 * Every photograph on the guide, with where it came from. `status` gates
 * deployment: "official-unconfirmed" images come from the hotel's own site or
 * CDN and need the hotel's permission before the site goes live.
 */
export interface GuideImage {
  /** File stem in public/assets/guide/, written as `${name}-${width}.webp`. */
  name: string;
  widths: number[];
  /** Intrinsic aspect of the largest file, for layout reservation. */
  aspect: [number, number];
  alt: string;
  credit: string;
  source: string;
  status: "venue-film" | "licensed" | "official-unconfirmed";
  licence?: { name: string; url: string };
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
    badge: "Wedding venue",
    image: {
      name: "stay-shangri-la",
      widths: [700, 1200],
      aspect: [16, 9],
      alt: "Shangri-La Mactan from the air: the Ocean Pavilion, the jetty and the resort beyond",
      credit: "Shangri-La Mactan",
      source: "Shangri-La Mactan Event Spaces film",
      status: "venue-film",
    },
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
    badge: "Next door",
    image: {
      name: "stay-movenpick",
      widths: [700, 1200],
      aspect: [16, 9],
      alt: "Mövenpick's seafront pool at sunset",
      credit: "Mövenpick Hotel Mactan Island Cebu",
      source: "https://movenpick.accor.com/en/asia/philippines/cebu/hotel-mactan-island-cebu.html",
      status: "official-unconfirmed",
    },
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
    badge: "Beachfront",
    image: {
      name: "stay-sheraton",
      widths: [700, 1200],
      aspect: [3, 2],
      alt: "Sheraton Cebu Mactan Resort seen from the water, with its beach and palms",
      credit: "Marriott International",
      source:
        "https://activities.marriott.com/asia/philippines/cebu/hotels/sheraton_cebu_mactan_resort-CEBSI",
      status: "official-unconfirmed",
    },
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
    badge: "Lowest resort rate",
    image: {
      name: "stay-dusit",
      widths: [700, 1200],
      aspect: [32, 15],
      alt: "Dusit Thani Mactan Cebu at dusk, its curved building lit above the infinity pool",
      credit: "Dusit Thani Mactan Cebu",
      source: "https://www.dusit.com/dusitthani-mactancebu/",
      status: "official-unconfirmed",
    },
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
    badge: "Pool villas",
    image: {
      name: "stay-crimson",
      widths: [530],
      aspect: [1, 1],
      alt: "Crimson's infinity pool running out towards the sea between two pavilions",
      credit: "Crimson Resort & Spa Mactan",
      source: "https://www.crimsonhotel.com/mactan",
      status: "official-unconfirmed",
    },
  },
  {
    id: "fairfield",
    name: "Fairfield by Marriott Cebu Mactan",
    shortName: "Fairfield",
    kind: "City hotel near the airport",
    description:
      "One of Mactan's newest hotels, five minutes from the airport on the Mactan Channel. No beach, but comfortable, simple and easy on the budget.",
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
    badge: "5 min from the airport",
    image: {
      name: "stay-fairfield",
      widths: [700, 1200],
      aspect: [3, 2],
      alt: "The Fairfield by Marriott Cebu Mactan lobby, as published by Marriott",
      credit: "Marriott International",
      source:
        "https://activities.marriott.com/asia/philippines/cebu/hotels/fairfield_cebu_mactan-CEBFI",
      status: "official-unconfirmed",
    },
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

/* ------------------------------------------------------------ your trip */

/**
 * The wedding window: the only days we ask guests to keep. Everything either
 * side is their own holiday, and the Your trip screen treats it that way.
 */
export interface WindowDay {
  iso: string;
  weekday: string;
  day: number;
  role: "arrive" | "wedding" | "depart";
  title: string;
  detail: string;
}

export const weddingWindow: WindowDay[] = [
  {
    iso: "2027-10-23",
    weekday: "Saturday",
    day: 23,
    role: "arrive",
    title: "In Cebu by today",
    detail: "Settled in, and over the journey",
  },
  {
    iso: "2027-10-24",
    weekday: "Sunday",
    day: 24,
    role: "wedding",
    title: "The wedding",
    detail: "Shangri-La Mactan",
  },
  {
    iso: "2027-10-25",
    weekday: "Monday",
    day: 25,
    role: "depart",
    title: "Travel on from today",
    detail: "Or stay on and explore",
  },
];

export type Activity =
  | "snorkel"
  | "dive"
  | "wildlife"
  | "island"
  | "beach"
  | "waterfall"
  | "canyon"
  | "surf"
  | "lagoon"
  | "heritage"
  | "food";

/** How each activity is named on screen. */
export const activityLabels: Record<Activity, string> = {
  snorkel: "Snorkelling",
  dive: "Diving",
  wildlife: "Wildlife",
  island: "Island hopping",
  beach: "Beaches",
  waterfall: "Waterfalls",
  canyon: "Canyoneering",
  surf: "Surfing",
  lagoon: "Lagoons",
  heritage: "History",
  food: "Food",
};

export interface HolidayPlace {
  id: string;
  name: string;
  /** Island or province, for orientation. */
  region: string;
  /** Where the pin sits on the Philippines map. */
  location: Place;
  /** Which side of its pin the name sits, clear of its neighbours. */
  label: "above" | "below" | "left" | "right";
  /** How to get there from Mactan, as guests would plan it. */
  getThere: { mode: "boat" | "road" | "ferry" | "flight"; label: string };
  /** A sensible amount of time to give it. */
  stay: string;
  detail: string;
  activities: Activity[];
  /** The shortest trip length (in days) that comfortably makes room for it. */
  from: 7 | 10 | 14;
  image: GuideImage;
}

const ccBySa4 = { name: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" };

/**
 * Inspiration, not an itinerary: places a week, ten days or a fortnight make
 * room for. Journey times are typical figures from operators and schedules
 * (see the evidence register) and are rounded; nothing here is priced.
 */
export const holidayPlaces: HolidayPlace[] = [
  {
    id: "islands",
    name: "The reefs off Mactan",
    region: "Mactan",
    location: { lat: 10.1225, lng: 124.0322 },
    label: "below",
    getThere: { mode: "boat", label: "By banca from the resorts" },
    stay: "Half a day or a day",
    detail:
      "A traditional outrigger banca out to the marine sanctuaries at Hilutungan and Nalusuan, for some of the clearest snorkelling near Cebu.",
    activities: ["snorkel", "island", "beach"],
    from: 7,
    image: {
      name: "idea-nalusuan",
      widths: [700, 1200],
      aspect: [16, 9],
      alt: "Nalusuan island's resort on stilts across clear blue water",
      credit: "Martin Michlmayr",
      source: "https://commons.wikimedia.org/wiki/File:Nalusuan_dive_trip_June_2025_067.jpg",
      status: "licensed",
      licence: ccBySa4,
    },
  },
  {
    id: "cebu-city",
    name: "Cebu City",
    region: "Cebu",
    location: { lat: 10.2934, lng: 123.9021 },
    label: "left",
    getThere: { mode: "road", label: "30 to 60 minutes by road" },
    stay: "A morning or an afternoon",
    detail:
      "The oldest city in the Philippines: Magellan's Cross, the Basilica del Santo Niño and Fort San Pedro, then Cebu's famous lechon, slow-roasted pork.",
    activities: ["heritage", "food"],
    from: 7,
    image: {
      name: "idea-cebucity",
      widths: [700, 1200],
      aspect: [3, 2],
      alt: "The octagonal kiosk of Magellan's Cross in Cebu City, with its red-tiled roof",
      credit: "Elmer B. Domingo",
      source: "https://commons.wikimedia.org/wiki/File:Magellan%27s_Cross_Cebu_City.jpg",
      status: "licensed",
      licence: ccBySa4,
    },
  },
  {
    id: "moalboal",
    name: "Moalboal",
    region: "South-west Cebu",
    location: { lat: 9.9536, lng: 123.3992 },
    label: "above",
    getThere: { mode: "road", label: "2½ to 3 hours by road" },
    stay: "A night or two",
    detail:
      "Step off the beach into a shoal of millions of sardines, with sea turtles grazing on the reef a few metres out.",
    activities: ["snorkel", "dive", "wildlife"],
    from: 7,
    image: {
      name: "idea-moalboal",
      widths: [700, 1200],
      aspect: [16, 9],
      alt: "A shoal of sardines swirling over the seafloor at Moalboal",
      credit: "Iampjanz",
      source:
        "https://commons.wikimedia.org/wiki/File:Sardine_run_over_seafloor_in_Moalboal_04.jpg",
      status: "licensed",
      licence: ccBySa4,
    },
  },
  {
    id: "kawasan",
    name: "Kawasan Falls",
    region: "South-west Cebu",
    location: { lat: 9.8047, lng: 123.3736 },
    label: "below",
    getThere: { mode: "road", label: "30 to 45 minutes from Moalboal" },
    stay: "A day, often paired with Moalboal",
    detail:
      "Turquoise pools in the jungle at Badian. Go canyoneering for a morning of river jumps and swims that ends at the falls.",
    activities: ["waterfall", "canyon"],
    from: 7,
    image: {
      name: "idea-kawasan",
      widths: [700, 1200],
      aspect: [3, 2],
      alt: "Kawasan Falls pouring into a turquoise pool with a bamboo raft",
      credit: "Shemlongakit",
      source: "https://commons.wikimedia.org/wiki/File:Badian_Kawasan_Falls_Cebu.jpg",
      status: "licensed",
      licence: ccBySa4,
    },
  },
  {
    id: "bohol",
    name: "Bohol and Panglao",
    region: "Bohol",
    location: { lat: 9.67, lng: 123.88 },
    label: "below",
    getThere: { mode: "ferry", label: "About 2 hours by fast ferry" },
    stay: "Two or three nights",
    detail:
      "The Chocolate Hills, tiny tarsiers in the forest, a slow boat up the Loboc River, and the white-sand beaches of Panglao.",
    activities: ["wildlife", "beach", "heritage"],
    from: 10,
    image: {
      name: "idea-bohol",
      widths: [700, 1200],
      aspect: [3, 2],
      alt: "The Chocolate Hills of Bohol rising out of green forest",
      credit: "Wolfgang Hägele",
      source: "https://commons.wikimedia.org/wiki/File:Chocolate_Hills_Carmen_Bohol_2019.jpg",
      status: "licensed",
      licence: ccBySa4,
    },
  },
  {
    id: "siargao",
    name: "Siargao",
    region: "Siargao Island",
    location: { lat: 9.7845, lng: 126.1557 },
    label: "left",
    getThere: { mode: "flight", label: "About 1 hour by air" },
    stay: "Three or four nights",
    detail:
      "The Philippines' surf island: Cloud 9's famous break, palm-lined roads, and boat days out to Daku, Guyam and Naked Island.",
    activities: ["surf", "island", "beach"],
    from: 10,
    image: {
      name: "idea-siargao",
      widths: [700, 1200],
      aspect: [3, 2],
      alt: "Outrigger boats moored in clear turquoise water below palm trees on Siargao",
      credit: "ChaasPrime",
      source: "https://commons.wikimedia.org/wiki/File:Siargao_14.jpg",
      status: "licensed",
      licence: ccBySa4,
    },
  },
  {
    id: "el-nido",
    name: "El Nido",
    region: "Palawan",
    location: { lat: 11.2, lng: 119.42 },
    label: "below",
    getThere: { mode: "flight", label: "About 1 h 50 m by air" },
    stay: "Three or four nights",
    detail:
      "Limestone islands and hidden lagoons in Bacuit Bay, reached by a direct flight from Cebu, with no need to go back through Manila.",
    activities: ["lagoon", "island", "snorkel"],
    from: 14,
    image: {
      name: "idea-elnido",
      widths: [700, 1200],
      aspect: [3, 2],
      alt: "A turquoise lagoon between limestone cliffs in Bacuit Bay, El Nido",
      credit: "Vyacheslav Argenberg",
      source:
        "https://commons.wikimedia.org/wiki/File:Island_lagoon_in_Bacuit_Bay,_El_Nido,_Palawan,_Philippines.jpg",
      status: "licensed",
      licence: { name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
    },
  },
  {
    id: "coron",
    name: "Coron",
    region: "Palawan",
    location: { lat: 12.02, lng: 120.18 },
    label: "right",
    getThere: { mode: "flight", label: "About 1 h 20 m by air" },
    stay: "Three nights",
    detail:
      "Kayangan Lake between the cliffs of Coron Island, hot springs by the sea, and some of the world's best wreck diving.",
    activities: ["lagoon", "dive", "island"],
    from: 14,
    image: {
      name: "idea-coron",
      widths: [700, 1200],
      aspect: [3, 2],
      alt: "The view over Kayangan Lake's cove on Coron Island, with boats moored below limestone cliffs",
      credit: "Lyndon Aguila",
      source: "https://commons.wikimedia.org/wiki/File:Kayangan_Lake,_Coron_Island.jpg",
      status: "licensed",
      licence: ccBySa4,
    },
  },
];

export interface HolidayLength {
  days: 7 | 10 | 14;
  title: string;
  summary: string;
  /** Days free around the wedding window, after a day's travel each way. */
  ownDays: number;
  /** An example of how those days could be used; never a prescription. */
  example: string;
  /** The map's view for this length, as a lat/lng box. */
  view: { west: number; east: number; south: number; north: number };
}

export const holidayLengths: HolidayLength[] = [
  {
    days: 7,
    title: "Cebu, the wedding and one great extra",
    summary:
      "Time for a day on the water off Mactan and one big day out, like the sardines at Moalboal and the pools at Kawasan Falls.",
    ownDays: 2,
    example: "For example, island hopping and a night in Moalboal",
    view: { west: 123.22, east: 124.28, south: 9.68, north: 10.46 },
  },
  {
    days: 10,
    title: "Room for another island",
    summary:
      "Cross to Bohol for the Chocolate Hills and Panglao's beaches, or fly an hour to Siargao for surf and island hopping.",
    ownDays: 5,
    example: "For example, three nights on Siargao or Bohol",
    view: { west: 123.1, east: 126.45, south: 9.35, north: 10.55 },
  },
  {
    days: 14,
    title: "A proper Philippines holiday",
    summary:
      "Fly direct from Cebu to Palawan for El Nido's lagoons or Coron's lakes and wrecks, as well as the islands closer to home.",
    ownDays: 9,
    example: "For example, El Nido and Coron after the wedding",
    view: { west: 118.7, east: 126.6, south: 8.9, north: 12.6 },
  },
];

export const tripGuidance = {
  window: "That's all we ask. Everything either side is your holiday, so plan it however you like.",
  jetLag:
    "Cebu is 7 hours ahead of the UK on the wedding weekend, and the flight takes most of a day, so arriving a couple of days early makes the celebrations much more enjoyable.",
  gettingAround:
    "Cebu is a hub: fast ferries leave Cebu City for Bohol, and Mactan-Cebu airport has direct flights to Siargao, El Nido and Coron, so there is no need to go back through Manila.",
  defaultDays: 10 as const,
  /** Where the arcs on the Philippines map start: the wedding, on Mactan. */
  base: { lat: 10.308194, lng: 124.019728 },
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
