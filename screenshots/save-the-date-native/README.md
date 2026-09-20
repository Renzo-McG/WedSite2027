# Save the Date, native rebuild - review pack

Branch `feat/save-the-date-native`. Rollback tag `wedding-site-pre-std-native-rebuild`
(`main` at `2d59dfa`).

The concept, composition, timing and frost are unchanged. What changed is how the
invitation is made: the single imported artwork is gone, and the wording is now real
HTML, CSS and SVG that responds at every width.

Captured from the real Astro dev server in headless Chrome over CDP with a fresh
profile, at 2x on phones. The in-app browser pane runs as a hidden tab, where timers
clamp to 1s and video suspends, so none of this is judgeable there.

## The entrance, beat by beat

Phase timings measured live, against the approved export:

| Beat | Measured | Approved |
| --- | --- | --- |
| press acknowledged | 0 ms | 0 |
| cover starts to travel | 182 ms | 180 |
| venue clear, cover gone | 1582 ms | 1580 |
| frost begins | 3082 ms | 3080 |
| wording begins | 3982 ms | 3980 |
| countdown and controls begin | 4432 ms | 4430 |
| settled | 5332 ms | 5330 |

| Shot | What to look at |
| --- | --- |
| `mobile-01-closed-cover.png` | The closed cover and the E&L mark on the seam |
| `mobile-02-venue-moment.png` | The Ocean Pavilion entirely on its own, nothing over it |
| `mobile-03-frost-developed.png` | Frost present, wording not yet arrived |
| `mobile-04-wording-arriving.png` | Mid-stagger: five lines landed, the note still rising |
| `mobile-05-settled.png` | The finished invitation |
| `mobile-06-settled-after-real-entrance.png` | Same, reached by playing the entrance in real time |

## Responsive

No horizontal overflow at any width (`scrollWidth === clientWidth` at all of them).

| Shot | Width |
| --- | --- |
| `responsive-430.png` | 430 |
| `responsive-390.png` | 390 |
| `responsive-375.png` | 375 |
| `responsive-320.png` | 320 |
| `responsive-landscape-844x390.png` | Landscape phone: two columns, compact countdown |
| `responsive-tablet-768.png` | Tablet, on the card layout |

## Desktop

| Shot | What to look at |
| --- | --- |
| `desktop-01-closed-cover.png` | Closed cover on the staged card |
| `desktop-02-venue-moment.png` | The venue's own beat |
| `desktop-03-frost-developed.png` | Frost filling the card |
| `desktop-04-settled.png` | The finished card on the stage |
| `desktop-05-calendar-sheet.png` | Calendar sheet, unchanged behaviour |
| `desktop-06-resealing.png` | Reseal: wording leaving before the cover closes |
| `desktop-07-resealed.png` | Back to the closed cover |

## Reduced motion

`reduced-01-closed-cover.png`, `reduced-02-settled.png` - an authored short version:
the cover still clears and the venue still gets a beat, the wording resolves in place
rather than rising, nothing loops.

## What needs your eye

1. **The typeface.** This is the one real judgement call. The approved mock is a serif
   with a script for "the", "and" and the closing note. The brief said those fonts are
   not locked and the companion's system is the production reference, so the whole
   invitation is now Manrope - the wedding's one typeface - set light, tracked open and
   largely in capitals to read ceremonial rather than practical. The connectives step
   back a few weights at 0.92em, which is exactly what the companion already does to its
   ampersand. If you want the serif back it is one token (`--font-display`) plus a size
   recalibration, not a rebuild.
2. **The mark on the cover.** The approved setting is `coverMode: monogram`, but the only
   monogram pair in the repo is labelled an engineering placeholder and the real Canva
   pair lives in your browser. Rather than ship a placeholder, the cover draws the
   companion's own identity - the initials under the Ocean Pavilion roof line - with the
   approved motion (46s turn, 6.5s breath, press response). Swap in the real mark when
   it exists.
3. **Frost against a bright frame.** The approved 80% band is untouched. The venue film
   is bright in places, so the note line sits at its lowest contrast on the palest
   frames. Worth a look on a real phone in daylight before it goes out.
