# Emily & Lawrence Wedding Site

The repository holds three things:

1. **The public Save the Date** at `/` (also served at `/save-the-date/`, its address after the custom-domain cutover) — the production page guests see. See [docs/SAVE_THE_DATE_V1_2.md](docs/SAVE_THE_DATE_V1_2.md).
2. **The guest companion** at `/welcome/`, `/travel/`, `/stay/`, `/trip/` and `/wedding/` — the Wedding website as a small app (in review, not yet linked from the Save the Date). See [docs/TRAVEL_AND_STAY.md](docs/TRAVEL_AND_STAY.md).
3. **The Design Lab** at `/design-lab/` — an internal creative-direction environment for shaping, comparing, documenting, and exporting a visual and motion system. It is not the wedding site and is intentionally absent from public navigation.

The Save the Date is now the reference for the production system. The Design Lab's own preview deliberately still shows the earlier exploration; realigning it to the production system is a later task.

## Save the Date

On mobile the invitation is the screen. On desktop the same invitation language becomes a portrait 5 : 7 object presented on a destination stage. An abstract access mark aligns and releases a central seam; both smoked panels then travel fully clear while the Ocean Pavilion venue film begins moving beneath the warm frosted invitation.

The stage carries **authentic venue footage**: `public/assets/stage/video/venue-ocean-pavilion.mp4` is the Ocean Pavilion at Shangri-La Mactan, cut from the resort's own Event Spaces film. This is real imagery of the wedding location, not concept or AI-generated material, and it replaced the earlier temporary Philippines concept set, which has been removed from the repository.

`venue-ocean-pavilion-poster.webp` is the film's own first frame, graded identically, so it doubles as the poster, the no-JavaScript still and the fallback if the video cannot play — the picture never changes underneath the guest. The film plays once on opening and rests on its final frame; it never loops. `?video=none` presents the static fallback.

> The source film carries the resort's own burned-in `Ocean Pavilion` caption, visible bottom-left for roughly the first 4.6 seconds. It is inherent to the source shot and was kept rather than masked, since removing it would smear the moving aerial. See [docs/OCEAN_PAVILION_VIDEO.md](docs/OCEAN_PAVILION_VIDEO.md).

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
- GitHub Actions and GitHub Pages today; Cloudflare Pages being prepared (see [Deployment](#deployment))

## Local development

Install dependencies:

```sh
pnpm install
```

Start the site:

```sh
pnpm dev
```

The site builds and serves at the root by default:

- Homepage: `http://localhost:4321/`
- Design Lab: `http://localhost:4321/design-lab/`
- Isolated preview: `http://localhost:4321/design-lab/preview/`

To reproduce the GitHub Pages layout locally, set the base path: `BASE_PATH=/WedSite2027 pnpm dev` (or `pnpm build`), then use `http://localhost:4321/WedSite2027/`.

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

## Deployment

The same commit builds for two hosts. Only the hosting base path differs; the public URL does not.

|                  | Base path       | Where it comes from                                              | Status                   |
| ---------------- | --------------- | ---------------------------------------------------------------- | ------------------------ |
| GitHub Pages     | `/WedSite2027/` | `BASE_PATH=/WedSite2027` in `.github/workflows/deploy-pages.yml` | **Current production**   |
| Cloudflare Pages | `/`             | the default when `BASE_PATH` is unset                            | Prepared, not yet set up |

- **Hosting base path.** `astro.config.mjs` reads the `BASE_PATH` build variable through `normalizeBasePath()` in `src/config/site.ts` (default `/`, always a leading and trailing slash). Components use `import.meta.env.BASE_URL`, and links between the two experiences go through `routeHref()` in `src/config/routes.ts`, so nothing hardcodes a host prefix. A test fails if the GitHub Pages path appears anywhere else in `src/`.
- **Public canonical URL.** `siteUrl` in `src/config/site.ts` is the single guest-facing address: canonical and `og:url` links, the calendar description, the Google Calendar details and the ICS `URL` all derive from it. It is deliberately not an environment variable, so every build (including Cloudflare preview builds) points guests at the same place. It remains `https://renzo-mcg.github.io/WedSite2027/` until the controlled cutover, when it becomes `https://emilyandlawrence.com/`.
- **Not found.** `src/pages/404.astro` emits `dist/404.html`. Cloudflare Pages serves it with a 404 status for unknown paths (without it, Pages would treat the site as a single-page app and answer every unknown URL with the Save the Date). GitHub Pages serves it for unknown paths under `/WedSite2027/`.
- **Headers.** `public/_headers` is read by Cloudflare Pages only: long-lived immutable caching for the hashed `/_astro/` files and an explicit `text/calendar; charset=utf-8` for the ICS. GitHub Pages ignores it.

**GitHub Pages (current).** In **Settings → Pages** the source is **GitHub Actions**. `deploy-pages.yml` uses the official Astro Pages action to install, build (with `BASE_PATH=/WedSite2027`) and upload the static artifact, then the official Pages action deploys it. It runs after pushes to `main` and can be started manually. `.github/workflows/ci.yml` validates pull requests and all branch pushes with a root build.

**Cloudflare Pages (prepared, not live).** Expected settings when the project is created: framework preset Astro, build command `pnpm build`, output directory `dist`, no `BASE_PATH`, Node 24 (declared in `.node-version`) and pnpm 11.9.0 (declared in `package.json` `packageManager`). No secrets or other variables are needed.

**Routes at the cutover.** `src/config/routes.ts` holds where the Save the Date and the Wedding website home live. Today the Save the Date is `/` (and `/save-the-date/`) and the Wedding website starts at `/welcome/`. At the cutover the Wedding website home becomes `/`, the Save the Date lives only at `/save-the-date/`, and `/welcome/` redirects to `/`.

The Design Lab is a public static route when deployed. `noindex, nofollow` discourages search indexing, but obscurity is not access control. Do not store secrets, guest records, or private wedding data in it.

**Final acceptance gate after the custom domain is attached:** update `siteUrl` in `src/config/site.ts`; check canonical and OG URLs, calendar descriptions and ICS `URL`, absolute/share links, redirects (including the old GitHub Pages address, which guests' calendars may already hold), and sitemap/robots if present. Then test the new live domain from a fresh visit on mobile and desktop. The GitHub Pages URL remains canonical until that gate is complete.

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

The ICS is generated from `src/config/wedding.ts` and `src/config/site.ts` by `src/lib/calendar.ts` and emitted as a static UTF-8 file at build time by `src/pages/emily-lawrence-wedding.ics.ts`, so `emily-lawrence-wedding.ics` at the deployment base works without JavaScript and there is no hand-maintained copy to drift. Long lines are folded by UTF-8 octets for calendar import compatibility.

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
