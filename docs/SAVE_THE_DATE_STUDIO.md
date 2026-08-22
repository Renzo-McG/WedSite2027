# Save the Date Studio (`/type-preview/`)

A local design studio for composing the Save the Date: a Canva SVG placed over the real
Ocean Pavilion film and frosted invitation, with native countdown and calendar around it.

Built in two passes. The first replaced the rejected Canva iframe experiment (see
[CANVA_EMBED_POC.md](CANVA_EMBED_POC.md)) with a native typography studio. The second —
this one — added the Canva SVG artwork workflow and the adjustable mobile frosted band.

Its purpose is that Emily and Lawrence can compose the invitation themselves, in a
browser, without editing source or asking for a code change per adjustment. The output of
a session is an artwork file and a settings file, not a commit.

Deployed, unlinked and `noindex, nofollow`. The guest invitation at `/` is untouched.

## Where it lives

- **Live: https://renzo-mcg.github.io/WedSite2027/studio/**
- Preview surface on its own: `/studio/frame/`
- `/type-preview/` is a redirect stub kept so older local bookmarks still work.

Locally:

```sh
cd "/Users/lawrence.mcguire/Developer/WedSite2027" && ./.dev.sh
```

then `http://localhost:4322/WedSite2027/studio/`.

## Public by URL, not private

The route is unlinked and noindexed. That is not access control — anyone with the link can
open it. There is no login, no database and no backend, which is exactly why it can live on
GitHub Pages. Do not put anything sensitive in it.

Any control can be overridden on the frame by query string, which is how the review
screenshots were captured and how a particular look can be shared as a link:

```
/type-preview/frame/?invitationStrength=0.18&textVeil=0.34&blur=10
```

## How it is put together

| File                                 | Role                                                      |
| ------------------------------------ | --------------------------------------------------------- |
| `src/lib/type-preview-settings.ts`   | The control manifest — single source of truth             |
| `src/pages/type-preview/index.astro` | Studio shell; renders the panel from the manifest         |
| `src/pages/type-preview/frame.astro` | The invitation, inside the preview iframe                 |
| `src/scripts/type-preview-studio.ts` | Panel: persistence, presets, export, viewport, overlay    |
| `src/scripts/type-preview-frame.ts`  | Frame: applies tuning, film scrubbing, luminance sampling |
| `src/styles/type-preview-frame.css`  | Editorial typography and material wiring                  |
| `src/styles/type-preview-studio.css` | Studio chrome                                             |

Three decisions worth knowing about:

**One manifest.** Every control is one entry in `CONTROLS`, carrying its plain-English
label, its help text, its range and its CSS custom property. The panel renders from it,
the frame applies from it, the export is keyed by it, and `tokens.json` is generated from
it — so they cannot drift apart. Adding a control is one entry.

**An iframe, not a scaled div.** Production switches layout on a viewport media query at
48rem. Sizing a real browsing context is the only way the 390px phone preset and the
1440px desktop preset each render the layout production would actually serve. A useful
coincidence falls out of this: production's desktop card at a 1440×900 page is exactly
540×756, the Canva desktop reference size.

**Production's own material.** `save-the-date.css` is loaded unchanged and the studio
re-points its existing custom properties (`--invitation-alpha`, `--invitation-blur`,
`--video-overlay-strength`) at tuning values. What is being judged is the real
invitation over the real Ocean Pavilion film, not a lookalike. The one deliberate
difference: production paints the readability veil only on mobile portrait, and the
studio enables it at every size so "text background strength" means the same thing on a
phone and on the desktop card.

## Collaboration without a server

Everything is static, so sharing works three ways, in increasing completeness:

**Bundled starting design.** `public/studio/starting-artwork.svg` ships with the site. A
browser with no saved work opens on it, which means a share link lands on the same picture
for both people. To change the starting design, replace that one file.

**Share links.** `Copy share link` encodes the settings into
`/studio/?look=<base64url>`. Only values that differ from the baseline travel, so a
typical link is ~200 characters. The payload is versioned; a link from a newer studio is
refused rather than half-applied, and anything unreadable falls back to the default design
with a plain-English message.

A link carries **settings only, never artwork** — an SVG is far too large for a query
string. When the current artwork is a local upload, the studio says so next to the button
rather than handing over a link that looks complete and is not.

**Complete looks.** `Export complete look` produces `save-the-date-look.zip` with the
artwork, versioned settings and a short README. `Import complete look` reads it back,
re-runs the SVG safety checks, asks before replacing the current working look, and never
touches the named looks saved on that device.

The ZIP reader walks the central directory and handles both stored and deflated entries
(via `DecompressionStream`), so a look survives being re-zipped by a mail client on the
way.

### Three exports, one schema

| Action                      | For                                                               |
| --------------------------- | ----------------------------------------------------------------- |
| Copy share link             | Sending settings quickly, when both sides use the starting design |
| Export complete look        | Sending the editable design — artwork and settings together       |
| Download production package | Handing the approved design to whoever builds the final site      |

All three read the same settings object, so they cannot describe different designs.

## Status line

A small chip says what is being edited: _Starting design_, _Your Canva artwork_,
_Imported look_, or _Built-in wording_, with `· shared settings` appended when the page was
opened from a share link. Artwork provenance is stored alongside the file, so an imported
look is still described as one after a refresh.

## Mobile

Below 60rem the preview takes the screen and the controls become a bottom drawer behind a
full-width **Edit design** button, with **Done** and a tap-anywhere scrim to close. The
drawer is scrollable, safe-area aware, and keeps every control — nothing is simplified
away for phones. The studio also opens on a phone preset when the window itself is narrow,
so a partner on their phone sees the phone composition rather than a shrunken desktop card.
The long font caveat is hidden in the drawer so the design controls sit under the thumb.

Engineering utilities live under **Advanced preview tools** rather than in the main flow.

## Artwork mode

The studio has two artwork sources. **Canva SVG** is the primary one; **built-in
wording** keeps the native typography implementation as a fallback, a comparison and the
accessible source of the same information.

The uploaded file is rendered as a plain `<img>` from an object URL — never injected as
markup — with `pointer-events: none` and `aria-hidden="true"`. It is decorative
presentation only. Even in SVG mode the native wording stays in the page, visually
hidden, so a screen reader still finds the real names, date and venue, and the countdown
and calendar remain fully native.

`inspectSvg` parses the export as text and reports, in plain English, the handful of
Canva mistakes that actually cause trouble: a background left switched on, live text that
depends on a font, embedded bitmaps, external references, or the wrong artboard shape.
Only genuinely unsafe content — scripts, inline event handlers, `foreignObject` — blocks
the file; everything else warns and loads.

Artwork lives in IndexedDB rather than localStorage, because an export can run to
hundreds of kilobytes. Two slots are kept, current and previous, which is enough for the
"was that edit better?" comparison without becoming a version-control system. Replacing
artwork writes only those slots: every placement, frost and functional value is stored
separately and is untouched by an upload. There is a test for exactly that.

## The mobile frosted band

The headline new control. Production paints frost across the whole mobile screen; the
studio replaces that with one explicit `.tp-frost` element whose height is adjustable.

It is positioned by its centre, so **reducing the height alone opens clear video above
and below by the same amount** — `frostBand()` in `type-preview-settings.ts` is the
geometry, and it is unit tested for exactly that symmetry. The blur lives on the band
itself, so outside it the venue is genuinely unfrosted rather than merely lighter, and a
vertical mask feathers both edges by a share of the band's own height.

Measured from `screenshots/save-the-date-studio/frost-height-comparison.png` at 100 / 72
/ 50 percent: colour saturation a fifth of the way down the screen goes 7.6 → 16.8 →
26.4, and four fifths down it goes 6.1 → 7.9 → 9.8. Both ends open together.

Height, position, edge softness, blur strength, material opacity and the text veil are
six independent controls; none of them is derived from another.

On desktop the band fills the 5:7 card with no feather, so the control cannot quietly
alter the desktop composition, and the panel says so when a desktop size is previewed.

## Responsive strategy

Two layout regimes, not a whitelist of device sizes: the 5:7 card above the existing
48rem breakpoint, and the full-bleed banded phone layout below it. Everything within a
regime is fluid — artwork scales as a share of the invitation, the frosted band as a
share of the screen — so intermediate widths are interpolations rather than special
cases. The viewport preset buttons simply set the custom width/height sliders.

"Check all screen sizes" steps the preview through 18 shapes from 280px to 1920px,
including landscape phones and short laptops, and reports horizontal overflow and artwork
clipping. It is a structural check rather than a screenshot diff, so it stays fast and
does not go stale on a colour change.

## Type scale

Sizes and gaps are in `cqw` — a percentage of the invitation's own width. Measuring both
Canva mocks confirmed the brief's claim: expressed as a share of width, the two agree to
within about 2%. One width-tied system therefore holds from a 320px phone to the 540px
desktop card, and the only genuine desktop/phone difference is how far down the block
sits (`desktopY` vs `mobileY`).

The reconstruction lands within 1px of both mocks on every line.

## Fonts

The Seasons and Above the Beyond Script are commercial and are not installed. Nothing was
scraped from Canva. The studio substitutes Instrument Serif (already in the repo with its
OFL notice, but never declared until now) and Parisienne, and says so in the panel.

Measured consequence: at matched cap-height, Instrument Serif runs about **77%** of the
width of The Seasons, and Parisienne about **112%** of Above the Beyond Script. The
baseline anchors **line length** rather than cap-height, because the line lengths are what
give the composition its character — so the substitute letters sit slightly larger and
heavier than the mock's. Expect to re-tune once the real fonts are licensed.

## Readability guide

The transparency controls are free to explore; nothing is clamped and no value is changed
silently. A warning appears when the wording is likely to be hard to read.

It is measured, not assumed: the frame samples the actual video frame on screen and takes
the **10th-percentile** luminance rather than the average. Near-black wording fails over
the film's shadows, not over its bright water — and an average over this particular film
reads as comfortably bright at every moment, which would have made the warning useless.

Against the real film this puts the floor at roughly `invitationStrength: 0.15`, so
there is meaningfully more transparency available than the current production value of
`0.76` uses.

## Handing settings back

**Copy final settings** / **Download settings** produce
`save-the-date-type-settings.json`. `coerceSettings` accepts it back — unknown keys
dropped, numbers clamped, anything missing filled from the baseline — so an exported file
round-trips and a partial or hand-edited one is still safe to apply.

**Download production package** produces `save-the-date-approved.zip` containing the
approved SVG, `settings.json` and a short README — deliberately not the video, the fonts,
the repo or the screenshots. The zip is built by hand in `production-package.ts` rather
than via a dependency: it is three small text files in a stored archive, and the format
is unit tested.

`docs/save-the-date-type-tokens.json` is the current baseline, generated from the
manifest.

`public/type-preview/placeholder-artwork.svg` is a stand-in used for the studio's own
screenshots and for trying the workflow before real artwork exists. It is not the
couple's design. The frame also accepts `?artwork=<url>`, which is how those screenshots
are captured reproducibly.

## For Emily and Lawrence

**To edit the design**

1. Open the Studio.
2. Upload your latest transparent Canva SVG if you have a newer one.
3. Use the controls to adjust the artwork, video and frost.
4. Save a version if you like it.

**To share settings** — _Copy share link_. Quick, but it does not include your artwork.

**To send the exact artwork and design** — _Export complete look_, then send the file.

**To open someone else's version** — _Import complete look_.

**When the design is final** — _Download production package_.

Your work is saved in your own browser. It does not sync between devices on its own —
share or export it if you want the other person to see it.
