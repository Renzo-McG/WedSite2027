# Guest companion (round 2)

The Wedding website as a product: a guest companion app for a destination wedding. It is a
separate thing from the Save the Date at `/`, which will link out to it. Built for review on
branch `feat/travel-and-stay`; not linked from the invitation yet; `noindex`.

| Screen      | Route       | Job                                                         |
| ----------- | ----------- | ----------------------------------------------------------- |
| Home        | `/welcome/` | What you need to know, countdown, clocks, what is coming    |
| Travel      | `/travel/`  | Flights (routes, fares), Arriving (airport), Before you fly |
| Stay        | `/stay/`    | Six hotels as cards, linked to a real map of Mactan         |
| Your trip   | `/trip/`    | 7 / 10 / 14-day trip shapes and ideas for the extra days    |
| The wedding | `/wedding/` | Date, venue, calendar, what is still to come                |

Governing brief: `Wedding Planning/Wed-Site/Build Briefs/Wedding Website — Intention Brief (Round 2).md`
in the vault. It records Lawrence's round 1 feedback and applies the Akari design principles to
UI, motion and interaction. Facts and sources: [TRAVEL_AND_STAY_EVIDENCE.md](TRAVEL_AND_STAY_EVIDENCE.md).
Photography, map data and the **deployment gate**: [TRAVEL_AND_STAY_ASSETS.md](TRAVEL_AND_STAY_ASSETS.md).

## In plain English

A calm, polished travel app for this one wedding. It keeps the wedding site's light,
green-leaning family, but not the invitation's frosted glass, script or serif. It uses one
product typeface (Manrope) and white cards on a soft mist background. Lagoon teal (the water
in the venue film) marks actions and journeys; timber (the Ocean Pavilion's roof) is kept for
the wedding itself.

It behaves like an app:

- On desktop, a persistent side rail carries the destinations, the "coming later" items, live
  London and Cebu clocks, and a way back to the Save the Date.
- On phones, a top bar takes over the screen's title as you scroll, a floating tab bar holds
  the five destinations, and a menu sheet holds the whole site structure.
- Moving between screens slides in the direction you are travelling through the tabs, and the
  active-tab highlight glides to its new tab (cross-document View Transitions, no framework).

## What moves, and why

Akari method: expansion first (this build), compression after review.

| Where          | Motion                                                                                                         | Job                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Everywhere     | Screen slides with direction; active pill morphs                                                               | Orientation: where you went, and from where |
| Phones         | App-bar title appears once the big title scrolls away                                                          | Orientation                                 |
| Home           | Venue photo settles; plan tiles rise in turn                                                                   | Entry                                       |
| Travel         | Tab thumb slides; panel fades in                                                                               | State change                                |
| Flights        | Route line draws to flying time with a plane at its tip; fare dot lifts                                        | Explanation and comparison                  |
| Arriving       | Airport-to-venue line draws on the real coastline, then its label                                              | Explanation                                 |
| Before you fly | Tick, and the progress ring fills                                                                              | Confirmation                                |
| Stay           | Card lifts; its pin grows; a line draws to the venue with the drive time; sort moves cards to their new places | Connection (card ↔ map)                     |
| Your trip      | Days re-flow into the new shape; idea cards rise                                                               | State change                                |
| Menu           | Sheet slides up from the bottom                                                                                | Spatial                                     |

One motion grammar: `cubic-bezier(0.23, 1, 0.32, 1)` (ease-out) for entering and state,
`cubic-bezier(0.77, 0, 0.175, 1)` for on-screen travel, `cubic-bezier(0.32, 0.72, 0, 1)` for the
sheet and the tab morph. Transform and opacity only (plus SVG line drawing). Nothing loops.

**Reduced motion** (`prefers-reduced-motion` or `?motion=reduced`): every state still changes,
instantly; lines appear drawn; navigation is a direct swap.

## Without JavaScript

Every destination is a normal page and every link works. Route choice, trip length and sort
are native radio buttons (selection shown with CSS `:has()`; older browsers show every option's
content). The Travel tabs fall back to all three sections in order. The menu uses the native
`popover` attribute and opens without script. Only the clocks, countdown, checklist memory,
phone rail sync and card ↔ pin highlighting need JavaScript.

## Files

- Shell: `src/layouts/AppShell.astro`, `src/scripts/app/shell.ts`, `src/styles/app.css`,
  `src/styles/view-transitions.css` (inlined into every page's head)
- Screens: `src/pages/{welcome,travel,stay,trip,wedding}/index.astro`, `src/styles/app-screens.css`
- Components: `src/components/app/` (icons, monogram, pictures, links, map),
  `src/components/travel/`, `src/components/stay/`
- Behaviour: `src/scripts/app/{tabs,checklist,stay}.ts`
- Data: `src/data/travel.ts` (facts, hotels, trips, images), `src/data/site.ts` (destinations,
  coming later, venue images), `src/data/mactan-geo.ts` (OpenStreetMap coastline)
- Tests: `tests/travel.test.ts`

## Updating

- **Prices:** `fareFrom`, `budget`, `priceFrom` and `travelMeta.checked` in `src/data/travel.ts`,
  plus the evidence register.
- **Suggested route:** move `featured: true`.
- **Wedding room rate confirmed:** change Shangri-La's `note`, move "Wedding room rate" to
  `done` in `readiness` (`src/data/site.ts`).
- **A new section (Schedule, RSVP, Questions):** add a page, add it to `destinations`, and
  remove it from `comingLater`. The tab bar holds five; beyond that, move one into the menu
  sheet.
- **Hotel photographs:** see the deployment gate in the asset register.
