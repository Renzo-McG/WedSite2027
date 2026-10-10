# Guest companion (round 3)

The Wedding website as a product: **Emily & Lawrence's Cebu wedding companion**, a small app
guests move into after the Save the Date at `/` (which will link out to it). Built for review on
branch `feat/travel-and-stay`; not linked from the invitation yet; `noindex`.

| Screen      | Route                                  | Signature interaction                                                                |
| ----------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| Home        | `/` (legacy GitHub Pages: `/welcome/`) | The arrival: Mactan's coastline draws, a pin lands, the Pavilion photo opens from it |
| Travel      | `/travel/`                             | The London → Cebu journey: three routes on one timeline, flown on a map              |
| Stay        | `/stay/`                               | Hotel ↔ map explorer: camera, drive, re-ranking pins, a sheet grown from the photo   |
| Your trip   | `/trip/`                               | The wedding window, then "Making a holiday of it?": 7 / 10 / 14 days reshape the map |
| The wedding | `/wedding/`                            | The Pavilion arrives from Home, the roof line draws, the light turns to golden hour  |

Governing briefs, in the vault: `Wed-Site/Review/Travel & Stay/Feedback — Round 3.md` (this
round), on top of `Build Briefs/Wedding Website — Intention Brief (Round 2).md`. Facts and
sources: [TRAVEL_AND_STAY_EVIDENCE.md](TRAVEL_AND_STAY_EVIDENCE.md). Photography, map data and the
**deployment gate**: [TRAVEL_AND_STAY_ASSETS.md](TRAVEL_AND_STAY_ASSETS.md).

## What round 3 changed

Round 2's architecture stays: five real pages, the desktop rail, the phone app bar, menu sheet
and five-icon tab bar, directional page transitions, the combined flight timeline, hotel ↔ map
state, sorting, native controls, no backend and no live APIs. Round 3 adds the art direction
and the choreography.

- **Look.** Warm ivory and sand for the page; deep lagoon for the chrome and the journey;
  tropical shallows for light on dark; lush green islands; timber (the Pavilion's roof) and
  sunset for the wedding. Manrope throughout, now its full 200–800 range: light, huge display
  type for names and dates, heavy numerals for durations and prices, quiet UI text.
- **Fewer containers.** Cards are for things you choose (routes, hotels, places). Facts,
  options and notes sit on the page as type and rows.
- **Guest-facing only.** The roadmap, "Coming later", "Here now" and the rail clocks are gone.
  What the wedding screen will add is written for guests ("Still to come, here").
- **Your trip reframed.** The wedding needs only Saturday 23 to Monday 25 October; everything
  either side is the guest's holiday. 7, 10 and 14 days are inspiration, not an itinerary.

## Motion system

One grammar (`src/styles/app.css`, mirrored in `src/scripts/app/motion.ts`):
`ease-out` (0.23, 1, 0.32, 1) for entering and state, `ease-in-out` (0.77, 0, 0.175, 1) for
on-screen travel, `drawer` (0.32, 0.72, 0, 1) for sheets, pushes and thumbs, and one
overshoot (easeOutBack) kept for things that land on a map. Transform, opacity, clip-path and
SVG stroke drawing; registered custom properties (`--z`, `--tx`, `--ty`, `--own`) for the map
cameras and the itinerary band.

| Where             | What moves                                                                                                                                                                                                                                                                 | Job                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Every screen      | Native-style push in the direction of travel; the tab pill glides and the new tab draws its icon; a photograph that leads to the next screen flies there (Home → Wedding)                                                                                                  | Orientation, continuity        |
| Menu              | Sheet rises on the drawer curve, rows arrive in turn, the burger folds into a cross                                                                                                                                                                                        | Spatial, feedback              |
| Home              | First visit: coastline draws (real OSM Mactan), pin lands and ripples, map dives into the pin as the photo opens from it, names rise line by line, days count up. The menu pauses it; leaving the hero resolves it. Later visits: a short settle                           | Arrival, sense of place        |
| Home doors        | The Travel door flies its own London → Cebu arc when seen; photos lean in on hover                                                                                                                                                                                         | Invitation to explore          |
| Travel · Flights  | First visit establishes comparison, then flies Hong Kong → Singapore → Dubai. One clock drives map, phase status and timeline; durations resolve as the plane passes; at the hub the plane waits while the timeline keeps running; route facts change in the same explorer | Explanation, comparison        |
| Travel · Arriving | A plane lands along the real runway, then a car leads the drive line to Shangri-La and the distance lands on it                                                                                                                                                            | Explanation                    |
| Before you fly    | Each tick draws itself and fills the ring; the last one turns the ring into a plane                                                                                                                                                                                        | Confirmation, reward           |
| Stay              | Pin rises; camera frames hotel and venue; a car drives the line, then the drive time lands; sorting slides cards (FLIP), renumbers cards and pins, hops pins in order; the details sheet grows from the photo                                                              | Connection, cause and effect   |
| Stay (phones)     | The centred card in the rail drives the map; off-centre cards ease back (scroll-driven)                                                                                                                                                                                    | Control and result in one view |
| Your trip         | The window assembles (wedding lands, Saturday and Monday slide out, bracket draws); 7 / 10 / 14 moves the map camera, pops in new places, draws arcs from Mactan, grows the band, rearranges the cards; the active place fans its activities out                           | The trip genuinely expanding   |
| The wedding       | The roof line draws over the date; scrolling warms the light and sinks a sun across the Pavilion                                                                                                                                                                           | Feeling: reaching the reason   |

**Reduced motion** (`prefers-reduced-motion` or `?motion=reduced`) is its own state: every
change still happens, instantly. Lines are drawn, planes are parked at their destination, maps
cut to their frame, the arrival shows its resting state, and navigation is a direct swap.

### Animation lifecycle and control

The polish pass uses **play → optionally pause → resolve**, rather than treating every input as
an abort. Pointer movement, unrelated clicks, global-menu use and small scrolls do not spend an
introduction. The menu pauses Welcome and the first Travel guide, then resumes them. Direct route
selection, pointer/key interaction inside the Flight Journey Explorer, changing away from the
Flights panel, product navigation, or scrolling until the explorer is substantially behind the
viewport yields control. A yielded Welcome or Travel sequence resolves to a coherent final state.

Travel's once-per-session introduction is one piece of choreography: a 900 ms comparison state;
Hong Kong, Singapore and Dubai in source order; a 2.7 s map/timeline flight and 750 ms arrival hold
for each; then an instant resolve to the suggested route. Manual route changes use a slightly longer
3.2 s version of the same linked map/timeline motion. Reduced motion skips the introduction and
shows the suggested route complete.

## Without JavaScript

Every destination is a normal page and every link works. Route choice, trip length and sort are
native radio buttons; the chosen route's lit line and details, and the places and band for the
chosen trip length, show through CSS `:has()`. The Travel tabs fall back to all three sections
in order, hotel cards show their full details, the menu uses the native `popover` attribute,
and Home shows its resting state. Only the flights, landings, drives, camera moves, counts,
checklist memory and the phone rail sync need JavaScript.

## Files

- Shell: `src/layouts/AppShell.astro` (with the morph and arrival hand-off script),
  `src/scripts/app/shell.ts`, `src/styles/app.css`, `src/styles/view-transitions.css` (inlined)
- Screens: `src/pages/index.astro`, `src/pages/{welcome,travel,stay,trip,wedding}/index.astro`,
  the shared `src/components/app/WeddingWebsiteHome.astro`, and
  `src/styles/screen-{home,travel,stay,trip,wedding}.css`, `map.css` and `window.css`
- Components: `src/components/app/` (icons, monogram, pictures, coastline, Mactan map),
  `src/components/travel/` (FlightPlanner, FareScale, ArrivalPanel, PrepChecklist),
  `src/components/stay/` (HotelCard, StayMap), `src/components/trip/` (WeddingWindow,
  HolidayExplorer)
- Behaviour: `src/scripts/app/{motion,welcome,tabs,journey,arrive,checklist,stay,trip,window,wedding}.ts`
- Data: `src/data/travel.ts` (flights, hotels, the wedding window, holiday places and lengths),
  `src/data/site.ts` (destinations, venue images, what the wedding screen will add),
  `src/data/mactan-geo.ts` (OpenStreetMap), `src/data/land-geo.ts` (Natural Earth),
  `src/lib/geo.ts`, `src/lib/travel-plot.ts`
- Tests: `tests/travel.test.ts`

## Updating

- **Prices:** `fareFrom`, `budget`, `priceFrom` and `travelMeta.checked` in `src/data/travel.ts`,
  plus the evidence register.
- **Connections:** `connection` on each route; the drawn journey is both flights plus the
  connection, and a test keeps it within the airline's quoted time.
- **Suggested route:** move `featured: true`.
- **Wedding room rate confirmed:** change Shangri-La's `note`.
- **Holiday places:** `holidayPlaces` (with `from: 7 | 10 | 14`, a pin `label` side, and an image
  in the asset register); the map view for each length is `holidayLengths[].view`. Tests check
  every place sits inside its length's view and on land.
- **A new section (Schedule, RSVP, Questions):** add a page and add it to `destinations`, then
  take it out of `weddingToCome`. The tab bar holds five; beyond that, move one into the menu.
- **Hotel photographs:** see the deployment gate in the asset register.

## Known, deliberately deferred

### Returning to the Save the Date does not replay the cinematic

"See the Save the Date again" (the Wedding screen, and the same link in the rail and the menu
sheet) goes to `/` and lands on the **already-opened** invitation, not the opening film.

Why: `src/scripts/save-the-date.ts` writes `eandl.save-the-date.v1 = "opened"` to
**localStorage** the first time a guest opens the invitation, and every later load starts from
`setPhase(readOpened() ? "composed" : "sealed")`. So for anyone who has opened it once — which
is everyone arriving from the companion — `/` opens composed. Confirmed by walking it through:
open `/`, go to `/wedding/`, follow the link, and the page reports `phase="composed"`.

What a clean fix needs (not done here: this pass must not change the guest Save the Date):

1. An intentional signal on the link, e.g. `/?replay=1` or `#replay`, rather than anything
   timing-based.
2. `save-the-date.ts` to honour it at the point it chooses the initial phase: force `sealed`
   and run `OPEN_SEQUENCE` (and `REDUCED_OPEN_SEQUENCE` under reduced motion), leaving the
   stored `opened` flag alone so an ordinary visit is unaffected.
3. Strip the parameter from the URL afterwards, so a refresh does not replay it again.
4. Decide whether the replay should start sealed and open by itself, or start sealed and wait
   for the guest to open it. The second is closer to what the cover is for.

Do this during the Save the Date integration phase, alongside the calendar work below.

### The calendar invite wording is not final

`src/config/wedding.ts` holds the event definition used by the `.ics` file and the Google
Calendar link. It is deliberately untouched here: the Save the Date and the companion should
end up sharing one canonical event, so the wording is settled once, in that pass, rather than
twice.
