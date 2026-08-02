# Emily & Lawrence Wedding Design Lab

The Design Lab is an interactive creative-direction environment for shaping, comparing, documenting, and exporting the visual and motion system behind Emily and Lawrence's wedding website. It is not the finished wedding site and it is intentionally absent from the public homepage navigation.

The current vertical slice centres on the Opening Experience and **Invitation Continuity**: the shared behaviour connecting the opening control, invitation seam or paper edge, composed page, Save The Date action, and calendar enclosure.

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

The countdown assumes midnight at the start of the wedding date in Cebu (`Asia/Manila`, UTC+08:00), equivalent to `2027-10-23T16:00:00Z`. Days, hours, and minutes are shown by default. Seconds can be enabled in the lab.

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
