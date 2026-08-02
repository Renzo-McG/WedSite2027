# Save the Date v1 — Implementation Record

The public root route `/` is now a production Save the Date. The Design Lab is untouched
and still authoritative for nothing except its own experiments; this page is the new
reference for the production system.

## Creative direction

The lab's preview composition was rejected as a visual baseline. This build restarts from
**modern destination luxury with a restrained ceremonial layer** rather than luxury
editorial wedding: clean geometry, one coherent foreground composition, large readable
type, off-white paper against matte sage, and material depth instead of decoration.

## Structural model

> On mobile the invitation is the screen. On desktop the same invitation language becomes
> a portrait object presented on a dark atmospheric stage.

The mobile composition was designed and approved first at 390 × 844. Desktop wraps that
same semantic structure — `header` / `main` / `footer` inside one `article` — in a stage.
There is no separate desktop poster layout and no shrunken desktop layout on mobile.

### The card is a scaled object

Below 48rem wide (or under 40rem tall) the invitation is full-bleed and its type uses
viewport-relative clamps. In the staged mode the card is a fixed 5 : 7 object, so its type
and spacing are expressed in container query units (`cqh`) against the card's own height.
The composition therefore holds identically at 1440 × 900 and at 1280 × 720 instead of
overflowing a card that cannot grow. At 1440 × 900 the card measures 540 × 756.

`overflow: clip` — not `hidden` — keeps the card from becoming a scroll container.
Focusing the calendar sheet inside an `overflow: hidden` card scrolled the whole
composition out of frame; `clip` plus `preventScroll` on every `focus()` removes that
class of bug.

## Vertical rhythm

Header to names, names to details, countdown to action, and action to note are all fixed
to the brief's ranges. Exactly one flexible pause exists — between the details and the
footer group — because `.invitation__main` anchors its content to the top of its row.
That pause is the only place slack can land, so no empty region is accidental, and the
printed frond sits inside it.

## Material system

- **Paper** — warm off-white with a radial highlight, a tonal fall to `--paper-deep`, and
  a static SVG grain tile at 0.4 opacity in multiply. No repeating pattern, no staining.
- **Cover** — the closed state is a dark smoked material split by a fine central seam.
  Each half paints the _same_ atmosphere at 200% width anchored to its own outer edge, so
  the gradients meet exactly on the seam and separate with the material rather than
  fading as a detached overlay.
- **Glass** — `backdrop-filter` is progressive enhancement only. With it unsupported the
  cover is still a solid, correctly toned dark surface.
- **Stage** — deep green-charcoal, two soft light pools, and two blurred botanical
  shadows drifting on independent 46s and 61s cycles.

## Opening state machine

`data-phase` on the invitation drives every transition:

```text
closed → control-active → control-exiting → seam-active → cover-opening
       → content-revealing → composed
```

Timings are 0 / 180 / 260 / 320 / 420 / 860ms cumulative — about 2.0s in total. The
control fully resolves before the cover separates. Reduced motion collapses this to a
120ms opacity resolution with no spatial travel and no ambient drift.

The markup ships in the `composed` state, so **without JavaScript the whole invitation is
readable**. An inline script placed immediately after the article moves it to `closed`
before first paint, which is why returning visitors never see a flash of the closed state
and first-time visitors never see a flash of the open one. Return visits are remembered
under the versioned key `eandl.save-the-date.v1`; a discreet replay control remains.

## Countdown

Rendered at build time from `src/lib/countdown.ts` so it is meaningful with no
JavaScript, then kept live on a 20s interval. Days, hours and minutes only, tabular
numerals, non-breaking unit groups, no seconds, no live region (so assistive technology is
not re-interrupted), and a resolved `24 October 2027` once the date passes.

**Timezone assumption:** no ceremony time is confirmed, so the target is
`2027-10-24T00:00:00+08:00` — midnight at the start of the wedding day in the Philippines.
The calendar entry stays an all-day event until a time is agreed.

## Calendar enclosure

`src/config/wedding.ts` is the single source of truth. `src/lib/calendar.ts` builds the
ICS, and `src/pages/emily-lawrence-wedding.ics.ts` emits it as a static file at build
time, so the download works without JavaScript and the Design Lab's existing link to the
same path keeps working. The previous hand-maintained `public/*.ics` is gone.

The file uses CRLF line endings, a stable UID, PRODID, DTSTAMP, RFC 5545 text escaping,
and an exclusive all-day boundary (`20271024` / `20271025`).

| Provider          | Behaviour                        | Why                                                                                                      |
| ----------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Google Calendar   | Populated web event in a new tab | Verifiable and populated from config                                                                     |
| Apple Calendar    | `.ics` download                  | Native handling                                                                                          |
| Microsoft Outlook | `.ics` download                  | The web deeplink could not be confirmed end to end without an account, so the verifiable path was chosen |

Provider marks are the existing local assets at their own colours and proportions. The
surrounding rows stay neutral; nothing is recoloured into the wedding palette.

The sheet rises from the card's lower edge on desktop and is a full-width bottom sheet on
mobile, both clipped by the card so it reads as an insert from the same object. It has
dialog semantics, a focus trap, initial focus, focus restoration, Escape and outside-click
closing, a visible close control, and scroll locking. Without JavaScript a `:target`
fallback opens the same sheet; the enhanced path disables it via `data-enhanced`.

## Accessibility

One meaningful `h1` (the names). Keyboard-operable opening control and sheet. Visible
focus. 44px minimum targets. Decorative layers are `aria-hidden`. Ink on paper is 12.6:1;
`--ink-soft` is 5.1:1; the action is 5.3:1. Reduced motion keeps every state change and
all information, removing only travel and ambient drift.

## Performance

No framework, no animation library, no remote font or icon dependency, no hotlinked
images. Two self-hosted latin-subset woff2 files totalling 39KB, preloaded. Transform and
opacity only. Ambient drift pauses on `visibilitychange` and when the invitation leaves
the viewport.

## Fonts

Instrument Serif (display) and Manrope (interface), both SIL OFL 1.1, self-hosted as
latin-subset woff2 with their licences in `src/assets/fonts/`. They replace the temporary
Cormorant Garamond / Allura pairing for this page. Vault decision **D-006** should be
updated to reflect this.

## Design Lab preservation — deliberate

`/design-lab/` and `/design-lab/preview/` are unchanged and keep their own stylesheets and
tokens. Production tokens live in `src/styles/save-the-date.tokens.css`, scoped to `.std`,
and the production stylesheet is imported only by `src/pages/index.astro`, so neither
system leaks into the other.

It is expected and accepted that the lab's preview now looks _behind_ the public page.
Updating the lab to consume the approved production system is a separate, later task.

## Screenshots

Captured from the deployed site, not from mockups, in `screenshots/save-the-date-v1/`:
`mobile-closed-390x844`, `mobile-open-390x844`, `mobile-calendar-390x844`,
`mobile-open-320x568`, `desktop-closed-1440x900`, `desktop-open-1440x900`,
`desktop-calendar-1440x900`, `tablet-open-768x1024`, `reduced-motion-open`.

Also verified at 768 × 1024, 1024 × 768, 1280 × 720 and 1440 × 900 during the build, plus
no-JavaScript state, return visit, direct refresh, and the Pages base path.

## Still open for Emily and Lawrence

1. Confirm the ceremony time so the countdown and calendar entry stop assuming midnight.
2. Confirm Instrument Serif and Manrope as the permanent pairing, or choose alternatives.
3. Decide whether an approved destination photograph should replace the CSS/SVG stage
   atmosphere — `.std__stage` is the hook.
4. Decide whether Outlook should keep the `.ics` download or move to the web deeplink once
   it can be verified on a real account.
5. Decide when `noindex, nofollow` should be lifted.
6. Decide how much of the Design Lab remains now that the production page is the source of
   truth.
