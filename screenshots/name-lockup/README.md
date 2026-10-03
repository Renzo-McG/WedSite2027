## Name treatment review

Date: 2026-10-03. Production baseline: `2d59dfa4e1a25552ff3b21d76759a16ae571f531`.
GitHub Actions records that commit's successful Pages deployment; the live DOM and
styles match its invitation implementation. The separate native redesign and its
uncommitted changes are preserved in the original checkout.

Before: Sirivennela names with a small ampersand on its own middle row.
After: Manrope, Emily on line one, & Lawrence together on line two. Both names
use weight 450. Only the ampersand uses 650, in the existing sage-deep colour
(`#4e6157`). The live date uses Plus Jakarta Sans; it is preserved unchanged.

## Exact typography rules

Only the name markup, a page-level stylesheet import, and the new scoped
`src/styles/save-the-date.names.css` change. Existing stylesheets, scripts,
content, material, media and controls are untouched.

- Self-hosted Manrope, variable weights 200-800, normal style, swap display.
- Visible name rows: weight 450; line height 1.08; tracking -0.045em; no wrapping.
- Phone size: `clamp(2.75rem, 14.5vw, 3.875rem)`.
- Staged tablet/desktop: `8.2cqh` at minimum width 48rem and height 40rem.
- Existing short landscape layout: `clamp(2rem, 5.5vw, 3rem)`.
- Inter-line gap: 0.08 times the visible font size.
- Ampersand: 1em, weight 650, existing sage-deep colour, inline-block with
  0.08em trailing margin plus the normal word space.
- The lockup is vertically centred in the original name slot. Minimum block
  height retains the original two full-name rows, small ampersand row, and
  two gaps: `calc(var(--names-size) * (2 * var(--names-leading) + 0.19) + 2 * var(--names-gap))`.
- Old optical left/top offsets reset to zero for this lockup only.

## Browser verification

| Viewport | Name size | & Lawrence text width / available width | Result |
| --- | --- | --- | --- |
| 390 x 844 | 56.55px | 281.44 / 344.20px | Passed |
| 320 x 568 | 46.40px | 230.92 / 281px | Passed |
| 430 x 932 | 62px | 308.55 / 379.41px | Passed |
| 768 x 1024 | 64.124px | 319.10 / 461.05px | Passed |
| 1440 x 900 | Desktop rule implemented | Final after-capture pending | Browser approval blocked |

The four completed comparisons have no document overflow or name wrapping.
Computed font, size, weight, colour and line height of the label, date, venue,
countdown, CTA and note match live production. Their vertical position differs
by at most 0.008px (browser rounding). The existing two-line date at 320px is
preserved.

Final 1440 x 900 navigation was blocked by automatic browser review following
a usage-limit failure. A user-requested continuation was also rejected.
The desktop before capture exists; a final desktop after capture is still required.

## Validation

- Formatting: passed (repository-wide).
- ESLint: passed.
- Astro check: 0 errors, 0 warnings, one existing async-function suggestion.
- Vitest: all 194 tests across 14 files passed.
- Production build: passed, 11 pages generated.
- Diff whitespace check: passed.

The pnpm validate wrapper attempted to reinstall the shared dependencies and
stopped before running checks. The same existing formatter, lint, typecheck,
test and build commands were then run directly from the installed binaries.

## Captures and local review

- `after-mobile-390x844.png`
- `after-mobile-320x568.png`
- `after-mobile-430x932.png`
- `after-tablet-768x1024.png`
- `before-mobile-390x844.png`
- `before-mobile-320x568.png`
- `before-desktop-1440x900.png`

Static build review: http://127.0.0.1:4324/WedSite2027/

Development preview: http://127.0.0.1:4323/WedSite2027/

No merge, push or deployment was performed.
