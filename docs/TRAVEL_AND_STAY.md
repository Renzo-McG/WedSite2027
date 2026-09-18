# Travel & Stay (`/travel/`)

A guest guide to getting to Cebu, where to stay and how long to come for. It is a standalone
route for review and is not linked from the invitation yet. `noindex`, like the rest of the site.

- Content and figures: `src/data/travel.ts`
- Evidence, sources and dates: [TRAVEL_AND_STAY_EVIDENCE.md](TRAVEL_AND_STAY_EVIDENCE.md)
- Page: `src/pages/travel/index.astro`, components in `src/components/travel/`
- Styles: `src/styles/travel.css` (tokens scoped to `.tas`)
- Enhancement script: `src/scripts/travel.ts` (plot ↔ list highlighting only)
- Plot maths: `src/lib/travel-plot.ts`
- Tests: `tests/travel.test.ts`

## In plain English

The page opens on the same view the invitation's venue film ends on: the Ocean Pavilion, its
jetty and the sea. A warm frosted panel carries the title and the four facts a guest needs
first (where to fly, how long it takes, when and where the wedding is, when to be there).
Below that the page becomes a calm, readable guide.

Its one distinctive device is the **honest diagram**:

- **Flights are drawn to their flying time.** Each route is a line, and each flight is a
  length proportional to its scheduled hours. All three routes share one scale, so you can
  see at a glance that the Hong Kong route is shortest and where the long leg is.
- **Hotels are plotted from their real coordinates.** It is a to-scale orientation view of
  Mactan with the airport, the venue, 2 km and 4 km rings, a 1 km scale bar and a pointer
  to Cebu City. There is no drawn coastline, so nothing on it is invented. Google Maps is one
  tap away for real maps and directions.

Everything else is deliberately quiet: typography, space, a few hairlines.

## Information architecture

1. **Opening.** Venue picture, _Travel & Stay_, lead line, four at-a-glance facts, and
   in-page contents.
2. **Getting to Cebu.** A budget band, the suggested route (featured), two alternatives,
   fare freshness, the "not on sale yet" note, and a Google Flights comparison link.
3. **Arriving in Cebu.** Airport and terminal, "9 km, no more than 20 minutes", then Grab,
   taxi or hotel car.
4. **Where to stay.** The orientation plot and six hotels, nearest first, with Shangri-La
   as one equal entry.
5. **How long to stay.** The couple's "day before and day after" line, jet lag, and a
   7 / 10 / 14-day selector.
6. **Good to know.** Passport, visa, eTravel, time, money, weather, plugs.
7. **Still to come.** The staged items, on the stage's deep green, with the couple's names
   and a link back to the invitation.

## Interactions, and why

| Interaction                    | Why it earns its place                                                             | How it degrades                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 7 / 10 / 14-day selector       | Guests imagine different trips; one control swaps the shape without a wall of text | CSS-only native radios work without JS; browsers without `:has()` show all three shapes |
| Plot ↔ hotel list highlighting | Connects "which one is this?" in both directions (hover or focus)                  | Plot labels are ordinary in-page links; the list is complete on its own                 |
| Plot label → hotel             | Jumps to that hotel and moves focus there                                          | Plain anchor jump                                                                       |

Motion is limited to responses to what a person does (the trip shape fading in, highlight
transitions). There is no scroll choreography. `prefers-reduced-motion` and the site's
`?motion=reduced` flag remove all of it.

## Design plan and self-review (frontend-design, lead skill)

**Palette:** the invitation's paper `#f2efe7`, ink `#171c18`, sage-deep `#4e6157`,
champagne `#bca47d` (wedding-day marks only) and pavilion green `#16221c` (hero base and
closing band). There is **one new colour, lagoon `#2c6b68`**, taken from the water in the
venue film. It marks journeys and geography, and nothing else (5.3:1 on paper).

**Type:** Instrument Serif (already licensed OFL in the repo) for titles, hotel names and key
figures. Plus Jakarta Sans for everything practical. Sirivennela only for the couple's
names, as on the invitation.

**Review against the brief:**

- A journey rail running the full length of the page was considered and cut. "How long to
  stay" is not a place, and a rail would have been decoration.
- Tracked all-caps eyebrow labels (used on the invitation) were not repeated above every
  heading. Small sentence-case labels appear only where they are data keys (`dt`).
- Hotels are an editorial list, not a card grid. Routes are rows on one shared scale rather
  than side-by-side cards, so the drawn lengths stay comparable.
- The cream-and-serif base is the brief's own warm off-white and sage family, so it stayed.
  The distinctiveness comes from the diagrams and the venue opening, not from a new palette.

## Pricing language

- Flights: "From around £910", with "Economy return, recently seen for October 2026 dates",
  a page-level planning band of £850 to £1,250, "Planning estimates, checked September
  2026", and an explicit note that October 2027 is not on sale yet.
- Hotels: "Rooms from around £160 a night, for two", with a note that this is the lowest rate
  seen for late October 2026, that suites and busy dates cost more, and that the booking
  site shows real prices for your dates and party.
- Nothing is multiplied by nights or party size. There is no calculator.

## Updating the page

- **Refresh prices:** edit `fareFrom`, `budget`, `priceFrom` and `travelMeta.checked` in
  `src/data/travel.ts`, then update the evidence register's rows and date.
- **Change the suggested route:** move `featured: true` to another route and retitle both.
- **Wedding room rate confirmed:** replace the Shangri-La `note`, and add a booking link to
  that stay if one is given. Remove the item from `stillToCome`.
- **Add or remove a hotel:** add a `Stay` with real coordinates (Google Maps), a measured
  drive time, a price sample and a `label` side for the plot. Keep 4 to 6 (a test enforces
  it) and keep the list ordered nearest first (also tested).
- **Surrounding events confirmed:** update `tripGuidance.anchor` and the trip shapes'
  segments.

## Local review

```sh
./.dev.sh   # astro dev on 127.0.0.1:4322
```

Then open <http://127.0.0.1:4322/WedSite2027/travel/>.
