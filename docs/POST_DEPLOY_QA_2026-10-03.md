# Post-deploy QA - 3 October 2026

Scope: the Save the Date and Wedding Website quality pass based on production `main` at `b148b67`. Runtime implementation commit: `22ff8a1cdeeced0bd38342547daf3cbc6e07c022`. The existing design direction, content architecture, and SSD checkout's unrelated uncommitted work were preserved.

## A. Verified working

- **Save the Date:** A fresh visit and refresh begin sealed. Open starts the Ocean Pavilion film at its beginning; the cover parts, the venue is unobscured for about 3.5 seconds, material grows from the centre, then names, date and venue, countdown, and actions resolve in four beats. Closing and opening again resets the film. The completed film holds its final frame. Calendar offers Google, Apple, and Outlook, and the countdown has days, hours, minutes only. Evidence: live browser observation and `src/lib/experience-machine.ts:34-39`, `src/scripts/save-the-date.ts:130-161`, `src/scripts/save-the-date.ts:253-261`, `src/lib/countdown.ts:4-17`, `src/styles/save-the-date.css:884-924`.
- **Wedding identity and calendar:** Pavilion-derived timber/white mark appears in navigation. Desktop rail and mobile menu expose one Save to Calendar action; the provider dialog uses the shared event data, closes with Escape, and restores focus. Evidence: live desktop/mobile browser checks and `src/components/app/Monogram.astro:1-18`, `src/layouts/AppShell.astro:170-171`, `src/layouts/AppShell.astro:266-267`, `src/lib/calendar.ts:65-91`, `src/scripts/app/shell.ts:68-101`.
- **Travel:** The untouched three-route sequence progressed through Hong Kong, Singapore, and Dubai in local and live checks. Ordinary page movement did not change motion ownership. Selecting Singapore transferred ownership to the guest and remained selected after waiting. The Travel strip and Wedding hero both loaded their dedicated MP4s and followed forward and reverse scroll while remaining paused. Evidence: browser checks and `src/scripts/app/journey.ts:260-336`, `src/scripts/app/scroll-film.ts:6-77`.
- **Arriving:** Official Apple App Store and Google Play badge assets rendered and linked to Grab's respective listings. Evidence: live image load and link inspection; `src/components/travel/ArrivalPanel.astro:137-164`.
- **Stay:** Nearest to Lowest and back, including rapid switching, reordered the same six cards without duplicates, overflow, scroll jump, or active hotel/map-pin change in 390 px local and live checks. Evidence: live browser observations and `src/scripts/app/stay.ts:233-286`.
- **Responsive:** Local checks covered 320×568, 390×844, 430×932, 768×1024, 1024×768, 1440×900, 1920×1080 and 844×390 landscape across the affected pages. Live spot checks at those sizes found no horizontal overflow or broken visible images. At 320×568 the Save the Date actions both fit within the viewport; at 1920×1080 and 844×390 they remained separated and visible.

## B. Bugs found and fixed during QA

| Symptom                                                                                     | Cause and fix                                                                                                                                                   | Commit    |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| A faint paper line crossed the venue-only beat                                              | The closed material clip left a fractional centre gap. Set its inset to exactly 50% on both sides. `src/styles/save-the-date.css:884-888`                       | `22ff8a1` |
| Travel's new film strip crowded the route selector behind fixed chrome in short landscape   | The decorative strip used vertical room needed for comparison. Hide that strip only on short landscape, preserving the route UI. `src/styles/screen-travel.css` | `22ff8a1` |
| A quick explicit Travel route change could be cleared by an earlier route's delayed cleanup | Guard the delayed clear against the route currently selected. `src/scripts/app/journey.ts:82-88`                                                                | `22ff8a1` |
| Lint could not resolve Astro's TypeScript parser in a clean install                         | Declare the already-used parser as a direct development dependency. `package.json` and `pnpm-lock.yaml`                                                         | `22ff8a1` |

## C. Remaining known bugs

No confirmed High or Medium severity defects remain from this pass. A physical iPhone Safari / Android Chrome performance and touch run has **not** been performed; that is an unverified coverage gap, not a claimed bug.

## D. Performance and optimisation opportunities

1. **Measure scrub decode on real phones before wider guest release.** The two short, 960×540, 12 fps, half-second-keyframe derivatives are 680,890 and 693,154 bytes. They load near the hero, never autoplay, and fall back to a still if unsupported, data-saving, or repeatedly slow to seek (`src/scripts/app/scroll-film.ts:6-77`). Desktop/in-app simulated-mobile seeking was stable, but this does not measure mobile Safari decoder latency or battery impact.
2. **Keep preload conditional.** Only the hero near the viewport gets a video source; static images remain the permanent fallback. Do not eagerly preload both clips. Recheck network transfer and cache behaviour with guest-device telemetry before increasing resolution or duration.
3. **Watch map animation layout reads.** Travel's plane positioning reads map dimensions during frames (`src/scripts/app/journey.ts:108-114`). No visible regression appeared, but a real-device performance trace would tell whether caching those dimensions until resize is worthwhile. Avoid speculative rewrites.

## E. Design and interaction suggestions

- **Before wider guest release:** Have one person watch the entire Save the Date opening on a typical phone and confirm the venue hold and text dwell feel natural, including the moving-film text contrast.
- **Optional polish:** If guests miss the Travel comparison, consider a small explanatory label; do not add competing motion.
- **Defer:** Broader visual redesign or extra branding. The approved production composition remains the baseline.

## F. Accessibility

- Keyboard: Travel route selection with Space, dialog activation, Escape, and focus restoration were exercised locally; live calendar Escape restored focus to the mobile menu opener. The Save the Date calendar close restored focus to Save to Calendar.
- Reduced motion: Save the Date ambient cues stop and a static venue beat remains; Wedding and Travel scrub films retain still images with no video source. Stay reorders without animated translation.
- Dialog and touch targets: One modal provider chooser, labelled providers, close button, mobile safe-area styling, and at least 44 px store-badge tap targets were checked. No contrast failure was observed against the sampled moving film, but an automated moving-video contrast guarantee is not claimed.

## G. Production verification

- Runtime commit: [`22ff8a1`](https://github.com/Renzo-McG/WedSite2027/commit/22ff8a1cdeeced0bd38342547daf3cbc6e07c022). The branch was pushed and fast-forwarded to `main` after branch CI passed; this repository's previous release workflow used direct `main` promotion, so no PR was opened.
- Branch validation: [successful run 37149459013](https://github.com/Renzo-McG/WedSite2027/actions/runs/37149459013). Main validation: [successful run 37149584188](https://github.com/Renzo-McG/WedSite2027/actions/runs/37149584188). Pages deployment: [successful run 37149584209](https://github.com/Renzo-McG/WedSite2027/actions/runs/37149584209).
- Local validation: Prettier passed; ESLint passed; Astro check returned 0 errors and 0 warnings (one existing informational hint in `src/lib/artwork-store.ts:59`); Vitest passed 195/195 tests in 14 files; production build completed 11 pages.
- Live URLs checked: [Save the Date](https://renzo-mcg.github.io/WedSite2027/), [Welcome](https://renzo-mcg.github.io/WedSite2027/welcome/), [Travel](https://renzo-mcg.github.io/WedSite2027/travel/), [Stay](https://renzo-mcg.github.io/WedSite2027/stay/), [Your trip](https://renzo-mcg.github.io/WedSite2027/trip/), and [Wedding](https://renzo-mcg.github.io/WedSite2027/wedding/). Direct requests returned HTTP 200 for both films, both store badges, and the calendar ICS file, all under the `/WedSite2027/` Pages base path.
- Browser: Codex in-app Chromium browser with simulated mobile/desktop viewport sizes listed in A. Console/error inspection found no errors on the tested flows. These tests are not a substitute for physical-device Safari/Chrome coverage.
- Final status: production behaviour is stable in the tested browser and viewports; no known High or Medium defect from this pass.
