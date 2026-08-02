# Save the Date v1.1 — Art Direction Record

v1 solved the structure. v1.1 is an art-direction pass: a destination stage, a frosted
invitation the stage reads through, a recomposed mobile page, a genuinely seamless closed
state, a back control, and seconds on the countdown. The Design Lab is untouched.

## Workspace — do not build on the Drive mount

The repository mirror under `/Users/lawrence.mcguire/Library/CloudStorage/` makes Node
tooling crawl: package tooling performs thousands of small reads and the FileProvider
mount serves them slowly. In v1, `astro check` hung at 0% CPU there and a production build
that takes ~5s locally took minutes or stalled.

**All Node work for v1.1 ran from the local SSD clone at
`/Users/lawrence.mcguire/Developer/WedSite2027`.** `pnpm install --frozen-lockfile`
completes in ~4s there. GitHub is the source of truth; the Drive copy is not a build
workspace and may be fast-forwarded afterwards if its tree is clean.

Vault context was copied once into `.project-context/` (untracked via `.git/info/exclude`)
so the briefs are read from local disk rather than through the mount.

## The stage image

**Temporary AI-generated concept imagery. It is not a photograph of Shangri-La Mactan and
must never be presented as one.**

|                 |                                                            |
| --------------- | ---------------------------------------------------------- |
| Production slot | `public/assets/stage/philippines-concept.webp`             |
| Source supplied | 2624 × 1632 PNG, 9.2MB                                     |
| Shipped         | 2624 × 1632 WebP, quality 74, **446KB**, metadata stripped |
| Configured at   | `wedding.stage.image` in `src/config/wedding.ts`           |

To replace it with an approved or licensed destination photograph, drop the new file at
that path. No code change is needed. Crop is controlled by two tokens rather than repeated
magic numbers:

```css
--stage-position-desktop: 50% 46%;
--stage-position-mobile: 63% 52%;
```

The stage is painted as a CSS `background-image`, not an `<img>`. That is deliberate: a
missing or failed asset then degrades silently to the gradient stage instead of leaving a
broken-image icon on the page. The image is still preloaded (`<link rel="preload"
as="image">`) so it is not discovered late.

## Desktop stage

The flat dark field is gone. The stage is now five layers: the destination image, a
directional wash that is heavy at the edges and open through the middle, a warm light pool
placed over the image's own sun, a soft vignette, and the invitation. Saturation sits at
0.96 and contrast at 0.98 — enough to calm the image without draining it to grey.

The card relates to the scene rather than sitting on it: a warm halo behind the object
(`.invitation::before`), a soft contact shadow, a 1px translucent border, an inner edge
highlight, and a surface highlight that falls from the **upper right** to match the
direction of the light in the photograph.

## Frosted invitation material

```css
--invitation-alpha-desktop: 0.76;
--invitation-alpha-mobile: 0.8;
--invitation-alpha-closed: 0.14;
--invitation-blur: 20px;
--invitation-tint: 244, 241, 232;
--invitation-radius: 1.25rem;
```

`isolation: isolate` was removed from `.invitation` — an isolated stacking context forms a
backdrop root, which would have stopped `backdrop-filter` from ever sampling the stage.

While the cover is closed the paper drops to `--invitation-alpha-closed`, so the
destination reads through the smoked material; it resolves to full opacity as the cover
parts. The invitation therefore materialises rather than merely being uncovered.

### Without `backdrop-filter`

An `@supports not` block raises the surface to 0.95/0.96 and the cover to 0.9. The result
is a more opaque warm surface that keeps its grain, edge and shadow instead of collapsing
into a flat transparent panel. Captured in `backdrop-filter-fallback.png`.

## Mobile recomposition

The v1 mobile page had one unbounded flexible row, which opened a ~337px void between the
venue and the countdown. v1.1 uses four rows with the third bounded at **both** ends:

```css
grid-template-rows: auto auto minmax(var(--breath-min), var(--breath-max)) auto;
align-content: center;
```

`--breath-min: clamp(2.25rem, 6.5svh, 4rem)`, `--breath-max: 7rem`. Because the breathing
row can no longer balloon, leftover space is shared evenly above and below the whole block
rather than collecting in one accidental gap. Names came down ~6% to
`clamp(4rem, 20vw, 5.6rem)`.

The breathing row carries no drawn ornament. The v1 frond was removed: the stage's own
planting now reads through the frosted material, which is the botanical treatment.

## Seamless closed state

The visible label is `Open`. The accessible name is
`Open Emily and Lawrence's Save the Date`.

The seam is **two elements with a geometric gap**, not one line masked by an overlay:

```css
.cover__seam--top {
  bottom: calc(50% + var(--seam-control-size) / 2 + var(--seam-control-gap));
}
.cover__seam--bottom {
  top: calc(50% + var(--seam-control-size) / 2 + var(--seam-label-clearance));
}
```

The ring is centred on the container's exact midpoint and the label is taken out of flow,
so both gaps derive from that same midpoint. Nothing overlaps, nothing is masked, and no
anti-aliased fragment can survive at any device pixel ratio because the line simply is not
drawn there.

Measured at 1440 × 900: the top segment ends **14.4px above** the ring and the bottom
segment starts **17.2px below** the label. Verified visually at 2× DPR in
`desktop-closed-seam-detail.png` and `mobile-closed-seam-detail.png`.

## Back control

`Replay opening` is gone. A quiet chevron sits at the upper left **of the stage**, outside
the card, so it never joins the wedding copy. Label: `Return to closed invitation`. It is
a state control, not browser navigation.

It runs a reverse sequence — `content-resolving → cover-closing → seam-restoring → closed`,
about 980ms — then returns focus to the `Open` control. Opening again replays the full
sequence. The return-visitor preference is intentionally not erased, so a later visit still
opens composed.

## Countdown with seconds

```text
desktop  446 days · 04 hours · 12 minutes · 09 seconds
mobile   446 days · 04h · 12m · 09s
```

Hours, minutes and seconds are two-digit and tabular so the line holds a stable width. The
compact form switches at `max-width: 26rem`.

The timer is **aligned to the next whole second** (`1000 - (Date.now() % 1000)`) rather
than a free-running `setInterval`, so it never drifts or skips a number. It is cleared on
`visibilitychange` and `pagehide`, and rescheduled when the page becomes visible again.

There is no `aria-live`. The element carries an `aria-label` that changes only once a day
(`446 days until 24 October 2027`), so assistive technology is never interrupted by the
seconds.

**The timezone assumption is unchanged.** Seconds add visual precision only; the target is
still midnight on 24 October 2027 in Manila because no ceremony time is confirmed, and the
calendar entry remains an all-day event.

## CTA and calendar enclosure

The CTA is no longer a pill: 12px radius, a frosted `rgba(43, 65, 52, 0.9)` surface, a
translucent border and an inner highlight, so it belongs to the invitation material.

The enclosure lost its drag handle — it was never draggable, so it implied an interaction
that did not exist. It now uses a restrained 14px top radius, warm frosted paper at 0.94,
the same grain as the invitation at 0.22, hairline row separators and a soft top edge.
Provider marks, links and focus behaviour are unchanged.

## Accessibility

Contrast was measured against the **real composited pixels** over the stage image, not
against tokens in isolation, by hiding the text and sampling the background at each text
centre:

| Text            | Mobile | Desktop |
| --------------- | ------ | ------- |
| Names           | 13.7:1 | 13.1:1  |
| Date            | 12.8:1 | 12.3:1  |
| `SAVE THE DATE` | 5.8:1  | 5.6:1   |
| Venue           | 5.8:1  | 5.5:1   |
| Countdown       | 5.2:1  | 5.2:1   |
| Formal note     | 4.8:1  | 4.7:1   |

This caught a real failure: the formal note was **2.4:1** at the v1 token values. The
secondary inks were darkened to `#4d5751` / `#4e5852`, and the tiers are now separated by
size, case and tracking rather than by going pale.

Everything else from v1 holds: one `h1`, keyboard-operable controls, focus restoration,
44px targets, dialog semantics, Escape and outside-click, reduced motion, and full content
without JavaScript.

## Verified

`prettier --check`, `eslint`, `astro check` (0 errors, 35 files), `vitest` (15 passed) and
`astro build` all pass from the SSD clone. Production output contains no `/Users/`,
`/@vite/`, `localhost:` or unbased `/design-lab` references; every absolute reference
carries `/WedSite2027/`. Total `dist` is 672KB.

Viewports swept at 320×568, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×720,
1440×900, 1728×1117, 844×390 landscape and 1440×700 short laptop. The staged card holds
0.714 (5:7) at every staged size; no horizontal overflow anywhere; the CTA is in view
without scrolling everywhere except mobile landscape, where normal scrolling is expected.

States: closed, opening, open, calendar, closing via back, closed again, open again, return
visitor, reduced motion, no JavaScript, `backdrop-filter` unavailable, image unavailable.

Screenshots are in `screenshots/save-the-date-v1-1/`, captured from the local production
build and optimised from 12.2MB to 3.4MB before commit.

## Still open for Emily and Lawrence

1. **Replace the concept image** with an approved or licensed destination photograph.
2. Confirm the ceremony time so the countdown and calendar stop assuming midnight.
3. Confirm Instrument Serif and Manrope as the permanent pairing (vault decision D-006 is
   still marked provisional).
4. Decide whether Outlook keeps the `.ics` download or moves to the web deeplink once it
   can be verified on a real account.
5. Decide when `noindex, nofollow` should be lifted.
6. Decide how much of the Design Lab remains now that the production page leads.
