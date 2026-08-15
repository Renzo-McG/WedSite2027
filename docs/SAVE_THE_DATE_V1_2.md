# Save the Date v1.2 — Experience Expansion

v1.2 preserves the approved v1.1 invitation and extends its interaction language. The
signature moment is now an abstract access sequence: precision geometry aligns, implied
locking lines retract, a seam releases, the selected destination concept scene begins
moving, both cover halves clear the reading plane, and the invitation resolves to
stillness. The Design Lab is unchanged.

## Workspace and scope

All development, media processing, validation and screenshot work ran from the SSD clone:

```text
/Users/lawrence.mcguire/Developer/WedSite2027
```

Do not run Node or Astro tooling from the Google Drive CloudStorage mirror. The root Save
the Date is the only visual scope of this pass. `/design-lab/` and
`/design-lab/preview/` remain independent and intact.

## Source footage and production derivatives

The user supplied `/Users/lawrence.mcguire/Downloads/WS.zip`. It contains four temporary
atmospheric concept clips. They are not Shangri-La Mactan footage, exact Cebu footage,
venue footage or documentary imagery of the wedding location. The archive was read
directly, extracted only to temporary SSD storage and was not moved into Google Drive or
committed.

| Source  | Dimensions | Duration | FPS | Codec      | Original size    |
| ------- | ---------- | -------- | --- | ---------- | ---------------- |
| `1.mp4` | 1920×1080  | 7.47s    | 30  | H.264 High | 25,695,134 bytes |
| `2.mp4` | 1920×1080  | 14.80s   | 30  | H.264 High | 30,425,745 bytes |
| `3.mp4` | 1920×1080  | 19.07s   | 30  | H.264 High | 18,117,758 bytes |
| `4.mp4` | 1920×1080  | 8.67s    | 30  | H.264 High | 14,756,932 bytes |

Production assets live at `public/assets/stage/video/`:

| Video                | Size             | Poster                       | Size          |
| -------------------- | ---------------- | ---------------------------- | ------------- |
| `philippines-01.mp4` | 12,790,380 bytes | `philippines-01-poster.webp` | 615,422 bytes |
| `philippines-02.mp4` | 10,379,216 bytes | `philippines-02-poster.webp` | 527,074 bytes |
| `philippines-03.mp4` | 3,376,451 bytes  | `philippines-03-poster.webp` | 274,762 bytes |
| `philippines-04.mp4` | 6,394,812 bytes  | `philippines-04-poster.webp` | 536,812 bytes |

All videos are 1600×900, silent, 30fps, H.264 Constrained Baseline level 4.0,
`yuv420p`, BT.709 progressive, encoded with x264 preset `slow` at CRF 28. Lanczos scaling
was used, metadata was stripped, and `faststart` places `moov` before `mdat`. Clips 1 and
4 use motion-compensated interpolation to create smooth 18-second versions rather than
repeating source frames. Clips 2 and 3 use their original encoded frames with gentle
playback rates of 0.82 and 0.95, producing effective review durations of 18.05 and 20.07
seconds. Posters are 1920×1080 WebP files encoded from each real first frame at quality 86.

## Video selection and art direction

One video is selected per browser-tab session and saved under
`wedding-stage-video:v1`. A valid existing choice is reused. A missing or corrupt choice
is safely replaced. Only the selected MP4 and poster are assigned to the single video
element; the other three are not requested.

Review overrides win without changing the normal stored choice:

```text
?video=1
?video=2
?video=3
?video=4
?video=none
```

Invalid values fall through to normal session selection. `none` deliberately uses the
static concept-image fallback.

| ID  | Desktop position | Mobile position | Wash | Brightness | Saturation | Rate | Effective duration |
| --- | ---------------- | --------------- | ---- | ---------- | ---------- | ---- | ------------------ |
| 1   | `50% 50%`        | `56% 50%`       | 0.48 | 0.88       | 0.84       | 1.00 | 18.00s             |
| 2   | `50% 48%`        | `58% 50%`       | 0.44 | 0.94       | 0.84       | 0.82 | 18.05s             |
| 3   | `50% 52%`        | `50% 52%`       | 0.48 | 0.92       | 0.82       | 0.95 | 20.07s             |
| 4   | `50% 50%`        | `62% 50%`       | 0.50 | 0.88       | 0.82       | 1.00 | 18.00s             |

The per-clip crop and grade keep the four clips in one restrained destination family
without presenting them as exact geography.

## Video lifecycle

The sealed state shows the selected first-frame poster and never autoplays. Explicit
visitor input starts the opening; playback is requested at `seam-release`, 760ms into the
normal sequence. Opening never waits for buffering. A rejected `play()` or media error
hides the video and keeps the static concept layer, with no broken icon, black void or
blocked interaction.

The clip plays once, without audio, controls or looping. On `ended`, the browser's actual
final rendered frame remains visible. During reseal that frame stays in place. Only after
the state machine reaches fully `sealed` does the controller pause and set
`currentTime = 0`; the reset is therefore invisible. Reopening uses the same session clip
from frame zero. Visibility and intersection changes pause/resume unfinished playback.

## Abstract vault aperture

“Vault aperture” is an internal interaction metaphor, not visible copy. The closed access
mark uses a Plus Jakarta Sans `E&L`, a fine inner ring, a segmented outer ring and four
alignment ticks. It deliberately avoids literal gears, locks, crests, wreaths or wedding
ornament.

Closed idle motion is finite in scale and luminance: a 4.8s breath from scale `1` to
`1.012` and brightness `1` to `1.08`. Alignment counter-rotates the outer ring `+88deg`
and inner ring `-34deg`. Abstract horizontal locking lines appear during alignment and
retract with `scaleX(0)` as access releases. The seam terminates geometrically above and
below the mark.

### Opening state machine

All offsets are absolute milliseconds from the explicit Open action.

| Time | Phase               | Meaning                                   |
| ---- | ------------------- | ----------------------------------------- |
| 0    | `engaging`          | Control compresses and brightens          |
| 170  | `aligning`          | Rings counter-rotate; lock lines resolve  |
| 520  | `unlocking`         | Implied locks retract                     |
| 760  | `seam-release`      | Light seam appears; selected video starts |
| 980  | `aperture-opening`  | Both cover halves begin full travel       |
| 1850 | `content-revealing` | Invitation type resolves                  |
| 2980 | `composed`          | Reading frame is still and interactive    |

Each half travels `102%` of its own width. At 390px, the measured 195px halves finish at
`translateX(-198.9px)` and `translateX(198.9px)`: the left edge finishes at -198.9px with
its right edge at -3.9px; the right edge starts at 393.9px. Both are completely outside
the 390px viewport before the cover is hidden.

### Reseal state machine

| Time | Phase              | Meaning                                        |
| ---- | ------------------ | ---------------------------------------------- |
| 0    | `reseal-softening` | Reading plane gently softens                   |
| 180  | `reseal-panels`    | Panels return under the reseal easing          |
| 1360 | `reseal-seam`      | Central seam resolves                          |
| 1510 | `reseal-locking`   | Abstract lock lines restore                    |
| 1720 | `sealed`           | Focus returns to Open; video resets underneath |

The reseal uses `cubic-bezier(0.4, 0, 0.25, 1)`. The opening aperture uses
`cubic-bezier(0.32, 0.02, 0.2, 1)` so the panels travel completely rather than fading out
partway through their motion.

## Typography audition

Plus Jakarta Sans is self-hosted and locked for all functional text, labels, details,
countdown, calendar and access mark. The names are the only display role. Four self-hosted
SIL OFL candidates remain live:

```text
?type=sirivennela
?type=montecarlo
?type=corinthia
?type=parisienne
```

Sirivennela is the provisional default only. Invalid values use that default. It is not
approved, and v1.2 does not choose a winner.

| Candidate   | Mobile size                   | Leading | Gap    | X / Y offset      | Ampersand X / Y |
| ----------- | ----------------------------- | ------- | ------ | ----------------- | --------------- |
| Sirivennela | `clamp(5.25rem,24vw,6.75rem)` | 0.76    | 0.12em | -0.015em / 0.08em | 0.8em / 0.2em   |
| MonteCarlo  | `clamp(4.9rem,22vw,6.4rem)`   | 0.82    | 0.08em | -0.04em / 0.03em  | 0.62em / 0.16em |
| Corinthia   | `clamp(5.8rem,27vw,7.4rem)`   | 0.70    | 0.13em | -0.035em / 0.12em | 0.92em / 0.28em |
| Parisienne  | `clamp(4.65rem,21vw,6.05rem)` | 0.86    | 0.08em | -0.01em / 0.02em  | 0.58em / 0.14em |

Desktop container-query sizes and short/landscape optical overrides live beside these
values in `save-the-date.tokens.css` and `save-the-date.css`.

## Calendar choreography

After composition, the CTA receives one restrained two-cycle cue: 760ms delay followed by
two 630ms scale/border/shadow pulses. It is suppressed for the rest of the session after
the calendar has been used.

Open travels from `calendar-opening` to `calendar-open` over 620ms. Close is a real reverse
transition: the sheet stays mounted and modal through `calendar-closing`, translates back
to its origin over 620ms, then restores `composed`, removes scroll lock/inert state and
returns focus to the trigger. Escape, close control, backdrop and focus trapping are
preserved.

## Reduced motion and no JavaScript

The operating-system `prefers-reduced-motion` preference removes idle/cue animation,
replaces spatial panel and sheet travel with short 120ms opacity resolution, uses a 170ms
opening and 120ms reseal, and does not start the atmospheric video. `?motion=reduced`
mirrors that path solely for deterministic QA screenshots.

The HTML ships in `composed`, so the invitation, date, venue, countdown fallback and
calendar link remain readable when JavaScript never runs. The inline boot script changes
to `sealed` before first paint only when JavaScript is available. The `noscript` stage uses
the static concept image.

## Responsive and contrast QA

The reading frame was checked at 320×568, 360×800, 390×844, 430×932, 768×1024,
1024×768, 1280×720, 1440×900, 1728×1117, 568×320, 667×375, 844×390 and 1366×640. Short
landscape screens use a two-column full-bleed invitation so names, CTA and note remain in
view with zero horizontal or vertical document overflow. The staged desktop invitation
remains 5:7.

Contrast was measured against sampled composited card pixels from all four real videos.
The primary ink minimum is 9.66:1; the secondary ink minimum is 4.75:1. The final
secondary tokens are `#464f49` for both soft and faint tiers.

## Remaining human decisions

- Choose Sirivennela, MonteCarlo, Corinthia or Parisienne after live comparison.
- Decide whether Plus Jakarta Sans remains final or is later compared with Manrope.
- Decide whether all four compressed concept videos remain.
- Decide when approved hotel or Cebu imagery replaces the concept footage.
- Decide how much of the expanded choreography survives the later compression pass.
- Confirm the ceremony time; the countdown and all-day calendar still assume midnight in
  Asia/Manila.
