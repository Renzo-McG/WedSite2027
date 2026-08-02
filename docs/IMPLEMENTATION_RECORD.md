# Wedding Design Lab v0.1 — Implementation Record

## Build decisions

- Began from the empty `WedSite2027` GitHub repository rather than copying the separate older local wedding prototype.
- Kept `/` as a restrained unlinked holding page.
- Used one nested, typed token model and a sanitising storage boundary.
- Isolated the wedding preview in a same-origin iframe with a strict message envelope.
- Chose CSS transitions, keyframes, and a small deterministic scheduler instead of an animation dependency.
- Preserved complete static meaning: the no-JavaScript preview is composed and the calendar file is a normal link.
- Used recognisable provider assets at their natural proportions and colours while keeping the enclosure surface neutral.
- Treated the design lab as a composed internal studio rather than a dashboard or grid of generic cards.

## Signature-motion acceptance notes

| Movement               | Trigger                           | Job              | Start                                      | Resolved                                       |      Default duration | Reduced-motion equivalent  | Mobile translation                      | Static fallback                |
| ---------------------- | --------------------------------- | ---------------- | ------------------------------------------ | ---------------------------------------------- | --------------------: | -------------------------- | --------------------------------------- | ------------------------------ |
| Opening control        | Click, tap, Enter, or Space       | Reveal / confirm | Closed, control legible                    | Control fully absent                           |           220 + 480ms | Immediate state resolution | Stable 116px touch control              | Omitted; composition shown     |
| Seam activation        | Completion of control exit        | Connect          | Dormant central seam                       | Completed seam                                 |           180 + 900ms | Complete seam shown        | Short local seam                        | Static invitation relationship |
| Panel opening          | Completion of seam                | Reveal           | Two closed flat panels                     | Panels translated beyond frame                 |                2400ms | Immediate open state       | Same flat transforms                    | Panels omitted                 |
| Content resolve        | Panel completion                  | Reveal / orient  | Composed content present but visually held | Names, date, details, and action fully visible | 900ms + 140ms stagger | Immediate complete content | Art-directed two-field layout           | Complete content               |
| Save The Date handover | Explicit CTA                      | Connect          | Composed page                              | Enclosure edge and sheet resolved              |                 720ms | Immediate open sheet       | Bottom enclosure with safe-area padding | Direct ICS link                |
| Provider state         | Hover, focus, selection           | Orient / confirm | Neutral row                                | Sharpened focus line                           |                 220ms | Border and focus only      | Stable 68px row                         | Normal provider links          |
| Ambient foliage        | Preview visible and normal motion | Atmosphere only  | Stable resting range                       | Repeating finite sway plus occasional gust     |     11–18s CSS cycles | Static framing             | Reduced density and local framing       | Static framing                 |

## Performance strategy

- No animation framework and no continuous JavaScript animation loop.
- Transform and opacity handle spatial change.
- Layer durations, phases, and transform origins deliberately differ.
- A deterministic seed makes comparison repeatable.
- `visibilitychange` and `IntersectionObserver` pause ambient work when it is not useful.
- Phase timers, observers, gust timers, object URLs, and interval handles are cleaned up.
- Preview and lab CSS remain route-isolated.

## Accessibility decisions

- Semantic headings, landmarks, labels, fieldsets, and native inputs.
- Opening, timeline, provider rows, lab navigation, and mobile mode switch are keyboard operable.
- Focus trap, Escape close, initial focus, focus restoration, inert background, outside-click close, and visible close control for the calendar sheet.
- No motion hides essential meaning; reduced and static modes are authored outcomes.
- Countdown text is excluded from continuous assistive-technology announcement.
- Colour contrast reports include written results.
- Touch controls target at least 44px where applicable.

## Unresolved decisions for Emily and Lawrence

1. Which Invitation Continuity direction becomes Current after direct comparison?
2. Should desktop names remain vertical, become staggered horizontal, or vary by composition?
3. Which licensed display and script fonts replace the temporary system?
4. How literal should final foliage artwork become while remaining tropical rather than themed?
5. Should the default countdown remain the editorial line or use structured units on narrow phones?
6. Does the calendar enclosure use the seam edge, paper edge, or botanical handover in the approved direction?
7. How much of the Design Lab should remain in the repository after the public opening page is productionised?

## Next precise implementation prompt

Review the Design Lab at desktop and 390px mobile. Compare Seam, Paper Edge, and Botanical Continuity using synchronised playback. Choose a Current direction, composition, countdown treatment, foliage density, and temporary type scale. Export the four design-system files. Then implement the approved Current tokens as the first public Opening Experience on `/`, preserving the existing lab routes, no-JavaScript meaning, reduced-motion behaviour, and calendar enclosure accessibility. Do not add RSVP, travel, hotel, gift, or guest-data features in that pass.
