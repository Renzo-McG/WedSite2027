# Emily & Lawrence Wedding Site

The repository holds two things:

1. **The public Save the Date** at `/` — the production page guests see. See [docs/SAVE_THE_DATE_V1_2.md](docs/SAVE_THE_DATE_V1_2.md).
2. **The Design Lab** at `/design-lab/` — an internal creative-direction environment for shaping, comparing, documenting, and exporting a visual and motion system. It is not the wedding site and is intentionally absent from public navigation.

The Save the Date is now the reference for the production system. The Design Lab's own preview deliberately still shows the earlier exploration; realigning it to the production system is a later task.

## Save the Date

On mobile the invitation is the screen. On desktop the same invitation language becomes a portrait 5 : 7 object presented on a destination stage. An abstract access mark aligns and releases a central seam; both smoked panels then travel fully clear while one session-selected destination concept video begins moving beneath the warm frosted invitation.

The stage image at `public/assets/stage/philippines-concept.webp` is **temporary AI-generated concept imagery. It is not a photograph of Shangri-La Mactan and must not be presented as one.** To replace it with an approved or licensed photograph, drop the new file at that path — no code change is needed.

The four clips in `public/assets/stage/video/` are also temporary atmospheric concept footage, not venue footage or documentary imagery of Cebu. Only one clip is requested per tab session. Review overrides remain available at `?video=1` through `?video=4`; `?video=none` presents the static fallback.

> **Do not run Node tooling from the Google Drive mirror.** Package tooling performs thousands of small reads and the CloudStorage mount serves them slowly enough that `astro check` can hang. Work from a local SSD clone, e.g. `/Users/lawrence.mcguire/Developer/WedSite2027`, where `pnpm install` takes about four seconds. See [docs/SAVE_THE_DATE_V1_1.md](docs/SAVE_THE_DATE_V1_1.md).

All wedding content and calendar data live in `src/config/wedding.ts`. Production tokens live in `src/styles/save-the-date.tokens.css`, scoped to `.std` so nothing leaks between the page and the lab.

The page is fully readable without JavaScript: the markup ships open and an inline script moves it to the closed state before first paint.

## Technology

- Astro 7 with strict TypeScript
- static directory-style output
- CSS custom properties for live rendering
- small browser-native TypeScript modules; no animation framework
- localStorage for device-local design decisions
- an iframe for complete preview style isolation
- GitHub Actions and GitHub Pages

## Local development

Install dependencies:

```sh
pnpm install
```

Start the site:

```sh
pnpm dev
```

Astro respects the project base during development:

- Homepage: `http://localhost:4321/WedSite2027/`
- Design Lab: `http://localhost:4321/WedSite2027/design-lab/`
- Isolated preview: `http://localhost:4321/WedSite2027/design-lab/preview/`

Build and preview production output:

```sh
pnpm build
pnpm preview
```

Run the complete validation sequence:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

or `pnpm validate`.

## GitHub Pages

The Astro configuration uses:

- site origin: `https://renzo-mcg.github.io`
- base path: `/WedSite2027`
- static output
- directory-style routes with trailing slashes

To enable deployment, open **Settings → Pages** in the GitHub repository and select **GitHub Actions** as the source. `.github/workflows/deploy-pages.yml` uses the official Astro Pages action to install, build, and upload the static artifact, then the official Pages action to deploy it. It runs after pushes to `main` and can be started manually. `.github/workflows/ci.yml` validates pull requests and all branch pushes.

Intended deployed routes:

- `https://renzo-mcg.github.io/WedSite2027/`
- `https://renzo-mcg.github.io/WedSite2027/design-lab/`
- `https://renzo-mcg.github.io/WedSite2027/design-lab/preview/`

The Design Lab is a public static route when deployed. `noindex, nofollow` discourages search indexing, but obscurity is not access control. Do not store secrets, guest records, or private wedding data in it.

## Canonical token flow

`src/design-system/tokens.ts` is the canonical initial state. The typed `WeddingTokens` model flows into:

1. built-in and custom presets;
2. Current and Experiment lab state;
3. accessible lab controls;
4. CSS custom properties applied to the preview root;
5. Current-versus-Experiment comparison;
6. localStorage sanitisation and migration;
7. CSS, JSON, motion JSON, and Markdown exports.

Initial values come from the wedding vault's `03 Design Tokens.md`. Components do not maintain duplicate live values. Stored data is treated as untrusted and rebuilt through `sanitiseTokens`; corrupt or incompatible local data falls back safely to Canonical v0.1.

## Preview protocol

Lab and preview communicate through a typed, versioned `postMessage` envelope:

```text
protocol: wedding-design-lab
version: 1
```

Implemented message categories are `LAB_READY`, `PREVIEW_READY`, `TOKENS_UPDATE`, `MOTION_COMMAND`, `VIEWPORT_MODE`, `PREVIEW_STATE`, and `ERROR_REPORT`. Both sides require the exact protocol and version. The preview additionally validates the same origin and the expected parent window; the lab validates the same origin and a known iframe window. No message accepts arbitrary HTML.

## Invitation Continuity

- **Seam Continuity** completes a central seam before the flat panels separate, then resolves a related rule and enclosure edge.
- **Paper Edge Continuity** relies on surface masks, shallow layer depth, and the edge of the printed enclosure.
- **Botanical Continuity** adds one controlled foreground-foliage response at the transition while typography and surfaces remain stable.

The opening runs through the named phases in `src/design-system/motion-presets.ts`. Explicit click, tap, or keyboard input begins the sequence. Pause, resume, stepping, named-phase jumps, speed changes, reduced-motion review, and a static-state review use the same phase model.

Ambient foliage uses independent CSS animations per depth layer and a seeded, finite gust scheduler. There is no high-frequency movement loop. CSS handles transforms; timers only schedule occasional gust classes. Animation pauses when the tab is hidden, the preview is offscreen, reduced motion is forced, or foliage is disabled.

## Calendar behaviour

The wedding is an all-day event on 24 October 2027. Google Calendar receives a populated URL. Apple Calendar and Microsoft Outlook receive the same standards-based ICS file with:

```text
DTSTART;VALUE=DATE:20271024
DTEND;VALUE=DATE:20271025
```

The ICS is generated from `src/config/wedding.ts` by `src/lib/calendar.ts` and emitted as a static file at build time by `src/pages/emily-lawrence-wedding.ics.ts`, so `/WedSite2027/emily-lawrence-wedding.ics` works without JavaScript and there is no hand-maintained copy to drift.

The countdown assumes midnight at the start of the wedding date in Cebu (`Asia/Manila`, UTC+08:00), equivalent to `2027-10-23T16:00:00Z`, because no ceremony time is confirmed. It shows days, hours, minutes and seconds, updated on a timer aligned to the whole second. The seconds add visual precision only — they do not change that assumption.

## Typefaces

The Save the Date self-hosts Plus Jakarta Sans for all interface and functional text. The names remain an explicit four-font audition: Sirivennela, MonteCarlo, Corinthia and Parisienne, selectable with `?type=sirivennela`, `?type=montecarlo`, `?type=corinthia` or `?type=parisienne`. Sirivennela is the provisional default, not an approval. All five production families are local `.woff2` files with SIL OFL 1.1 licences; there is no remote font dependency. The Design Lab keeps its own type system.

## Persistence and reset

The localStorage key is `wedding-design-lab:v1`. The UI provides:

- individual token resets;
- reset of the active side to Canonical v0.1;
- copy, accept, and discard actions for Experiment;
- local named-preset save, load, and delete;
- **Clear Local State** for a complete device-local reset.

Export Current before a destructive reset if the values need to be retained.

## Exports

The Export section copies or downloads:

- `design-tokens.css`
- `tokens.json`
- `motion-system.json`
- `design-system-summary.md`

Exports always reflect **Current**, even when Experiment is the active editing target.

## Reduced-motion and static review

Open **Accessibility** in the lab and choose Normal Motion, Reduced Motion, or Static / No-JS. Reduced motion removes ambient foliage and spatial travel while preserving the resolved composition and selected states. The direct preview also honours the operating-system `prefers-reduced-motion` setting. Without JavaScript, the invitation renders composed and the ICS fallback remains linked in normal HTML.

## Project boundaries

This repository currently excludes RSVP, guest data, travel and accommodation pages, gifts, authentication, server APIs, notification subscriptions, and a speculative final public homepage.

See [docs/IMPLEMENTATION_RECORD.md](docs/IMPLEMENTATION_RECORD.md) for the build record, signature-motion acceptance notes, and unresolved design decisions.
