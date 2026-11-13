# Tasks

## 1. Prerequisites and branch

- [x] 1.1 Confirm with the owner that the Change 1 preview review is done. Then archive `astro-site-foundation` with `/opsx:archive`. Verify:
  - `openspec/specs/` holds `brand-guardrails`, `contact-form`, `seo`, `site-content` and `site-platform`
  - `openspec validate visual-identity --strict` passes with no "Archive would refuse this delta" notices
- [x] 1.2 Create `visual-identity` from `astro-site-foundation`. Add `comps/` to `.gitignore` and commit. Push, then open a draft PR against `main` titled "Visual identity (draft, do not merge)". Verify that Netlify builds a deploy preview for it and the build log shows the site check passing

## 2. Color schemes and color rules (design D5, D10)

- [x] 2.1 Make `integrations/site-check/css.ts` record each declaration's full at-rule ancestry, and give each color token a scheme (`light` or `dark`). Verify with fixture tests:
  - A token inside `@media (prefers-color-scheme: dark) { :root { … } }` is labeled dark, and one in plain `:root` is labeled light
  - All existing site-check tests still pass
- [x] 2.2 Restructure `src/styles/tokens.css` for two schemes:
  - Set `color-scheme: light dark`
  - Add the `--color-accent` and `--color-on-accent` roles
  - Add a dark block that redeclares every color token with a plain inverted neutral placeholder palette
  - Add `<meta name="color-scheme" content="light dark">` to `BaseLayout`

  Add the scheme-parity rule, with failing and passing fixture tests. Verify that `npm run build` passes, and that a Playwright screenshot of Home with `colorScheme: 'dark'` shows the dark background
- [x] 2.3 Add the contrast-pair rule. The `{ fg, bg, min }` pairs live in `site-check.config.ts` and are measured with `wcagContrast` in each scheme. Verify with fixture tests that a failing pair names both tokens, the scheme, the measured ratio and the required ratio, and that the placeholder passes in both schemes
- [x] 2.4 Extend the banned-color rules:
  - The violet category, OKLCH hue 270° to 335° and C ≥ 0.08, with thresholds in config
  - The AI dark-navy references: `#0F172A`, `#020617`, `#111827`, `#1E293B`
  - Scanning of `dist/icon.svg` and `src/assets/brand/symbol.svg`

  Verify with tests:
  - `#0b57d0` and blue-700 pass
  - Indigo-500, violet-500 and fuchsia-500 fail
  - A dark background token at slate-900 fails and names the dark scheme
  - A fixture icon SVG with a banned color fails and names the file
- [x] 2.5 Write `scripts/sample-portfolio.mjs`. It uses Playwright to record the primary colors (from computed styles and CSS custom properties) and the font families on the Home pages of whatcanido.earth, condies.fyi and uphillskico.com. Put the results, with the sample date, in `portfolioReferences` in `site-check.config.ts`. Add the portfolio-echo rule for fonts and colors. Verify:
  - Condies' list includes Chivo
  - Tests show that a font stack with Chivo, and a token matching a sampled color, each fail and name the site
- [x] 2.6 Add the dark-scheme pass to `scripts/audit.mjs` from D12: axe at both viewports, and the keyboard and visible-focus checks, each run with `colorScheme: 'dark'`. Verify that `npm run audit` passes in both schemes. Record the results in `openspec/changes/visual-identity/audit-results.md`

## 3. Style and markup rules (design D10)

- [x] 3.1 Extend the banned-typeface list to the one in the brand-guardrails spec, and switch to prefix matching. Verify with tests that "Inter Tight", "Roboto Slab" and "DM Sans" fail, and that "Overpass" and "Archivo" pass
- [x] 3.2 Add the heading-accent rule on `dist/` HTML. The only elements allowed inside h1 to h6 are `a`, `abbr`, `code`, `br` and `svg[aria-hidden="true"]`. Verify with tests that `<h1>Websites that <em>get found</em></h1>` and a heading containing a `span` fail, and a fully linked heading passes
- [x] 3.3 Add the eyebrow rule. It flags `text-transform: uppercase`, `font-variant-caps: all-small-caps` or `all-petite-caps`, and `letter-spacing` above 0.05em, with px values divided by 16. Verify with a failing and a passing fixture test for each property
- [x] 3.4 Add the decorative-background rule:
  - Any `*-gradient(`
  - `filter: blur(`
  - Any `text-shadow` other than `none`
  - Box shadows with a blur over 24px or a color with OKLCH C ≥ 0.02, with `var()` references resolved against the tokens

  Verify with tests that a radial-gradient blob and a `0 0 40px` violet glow fail, and that `0 1px 2px` in a neutral gray passes
- [x] 3.5 Add the animation rule:
  - `@keyframes`
  - `animation` or `animation-name` other than `none`
  - `animation-timeline`, `scroll-timeline` and `view-timeline`
  - Transition durations over 250ms

  Verify with tests that a fade-up keyframe and `animation-timeline: view()` fail, that a 150ms color transition passes, and that the reduced-motion reset in `base.css` passes
- [x] 3.6 Add the image-source rule. Rasters are allowed only under `src/assets/work/` and `src/assets/founder*`, vectors only under `src/assets/brand/`, and `public/` holds no images. A file is waived only by an exception entry that records its source. Verify with fixture tests that a stray PNG fails and names the file, and that an excepted one passes
- [x] 3.7 Update the site-check docs in `README.md`: every new rule, the new config keys, and a "Look review" section with the D4 checklist. Verify that `npm test` passes, including `readme.test.ts`, and that `npm run build` passes on the placeholder look with every rule from groups 2 and 3

## 4. Fonts (design D6)

- [x] 4.1 Write `scripts/fonts.mjs <family>`. It copies a pinned Fontsource package's Latin WOFF2 files, its static 400 and 700 WOFF files and its license into `src/assets/fonts/<family>/`. Also:
  - Write `scripts/font-fallback.mjs`, which uses `@capsizecss/core` and `@capsizecss/metrics`
  - Add `src/lib/fonts.ts`, for at most two `?url` preloads, and wire the preloads into `BaseLayout`
  - Add an immutable `Cache-Control` header for `/_astro/*` to `netlify.toml`

  Verify on a scratch branch with Overpass: the font is requested only from the site's own origin, the preload and the fallback face are present, Lighthouse CLS is 0, and text is visible before the font loads under simulated slow 4G. Then delete the scratch branch
- [x] 4.2 Add the font rules:
  - Budget: at most 2 families (fallback faces with only `local()` sources don't count), at most 4 files, at most 150 KB in total
  - A license file in every font directory
  - No font URL pointing to another origin

  Verify with a failing and a passing fixture test for each
- [x] 4.3 Document in `README.md` how to add a typeface: `fonts.mjs`, the fallback script, the preload and the license. Verify by following the steps as written and checking that they reproduce the 4.1 scratch setup

## 5. Symbol, icons and social images (design D7, D8, D13)

- [x] 5.1 Add the placeholder symbol (a plain square) at `src/assets/brand/symbol.svg` with `fill="currentColor"`. Add `Symbol.astro`, which inlines it with `aria-hidden="true"` and `focusable="false"`. Put it before the wordmark text inside the header's Home link. Add the plain-vector rule for the symbol, with fixture tests for gradients, filters, `image`, `text` and a second fill color. Verify:
  - The header link's accessible name in Playwright's accessibility snapshot is exactly "Elevation Code Works"
  - axe passes in both schemes
- [x] 5.2 Add `src/lib/tokens.ts`, a reader that returns each token's light and dark value from `tokens.css` using the site check's parser. Verify with unit tests against a fixture tokens file
- [x] 5.3 Add the prerendered `favicon.ico`, `icon.svg` and `apple-touch-icon.png` endpoints from D8, link them in `BaseLayout`, and remove the `data:,` icon. Verify with tests that:
  - The ICO header declares one 32×32 image
  - The touch icon is 180×180
  - `icon.svg` contains the light text token value and a `prefers-color-scheme: dark` block with the dark value
- [x] 5.4 Add `satori` and write `src/lib/og.ts` and the `src/pages/og/[...slug].png.ts` endpoint from D7. Make `BaseLayout` derive each page's image path and alt text. Delete `scripts/make-og.mjs` and `public/og/default.png`, and update the README scripts list. Verify that `dist/og/` holds one PNG per indexable page plus `default.png`, each 1200×630, and that the not-found and confirmation pages point to `default.png`
- [x] 5.5 Add the social-image site-check rule: every indexable page's `og:image` exists in `dist/`, is unique, and has a PNG header that says 1200×630. Verify with fixture tests for a missing file, a duplicate and a wrong size

## 6. Trail-rating marks (design D9, dropped 2026-11-12)

- [x] 6.1 Add the rating content: the `rating` field on services, the legend on the Services page, a proposed rating for each service, and `pending` markers for the owner. Built in phase A, then removed by 6.3
- [x] 6.2 Build the marks: `RatingMark.astro`, the `--color-rating-*` tokens and their contrast pairs, `showRatings` on `ServiceList`, the legend on the Services index and the mark on each service page. Built in phase A, then removed by 6.3
- [x] 6.3 Remove the trail-rating marks (owner decision 2026-11-12). Delete `RatingMark.astro`, the `rating` field, the legend fields and copy, each service's rating, the two pending rating questions, `showRatings`, the `--color-rating-*` tokens and their contrast pairs. Re-capture the structure baseline from the result. Verify:
  - `grep -ri rating src site-check.config.ts` finds nothing
  - `npm run release-check` no longer lists the rating questions
  - `dist/services/index.html` has no rating marks or legend
  - `npm test`, `npm run build` and `npm run check:structure` pass, and axe passes in both schemes

## 7. Structure baseline, comp tooling and phase A check (design D2, D11)

- [x] 7.1 Write `scripts/structure-snapshot.ts` and `npm run check:structure`. Capture `openspec/changes/visual-identity/structure-baseline.json` from the current build. Verify:
  - Tests show that a changed heading, a changed link or changed JSON-LD each produce a diff
  - `npm run check:structure` exits 0 on the unchanged build
- [x] 7.2 Write `scripts/capture-comps.mjs` from D2. It takes a round number and preview URLs, and writes 24 screenshots per comp plus `comps/round-<n>/index.html`. It also adds a symbol strip at 16, 32, 64 and 256 px, in both schemes, when `src/assets/brand/options/` exists. Verify on the `visual-identity` preview that all 24 images exist at the right sizes and the sheet opens
- [x] 7.3 Phase A integration check. Push `visual-identity` and verify on its deploy preview:
  - The build passes on Netlify, so satori and sharp work on Linux
  - `curl -sI` shows `/favicon.ico` returns an image with status 200, `/og/home.png` is a PNG, and pages still send `X-Robots-Tag: noindex, nofollow`
  - `npm test`, `npm run build`, `npm run check:structure` and `openspec validate visual-identity --strict` all pass locally

## 8. Round 1: three directions (design D3, D4)

- [x] 8.1 Create `openspec/changes/visual-identity/rounds.md` with a per-comp template: source, preview URL, check status, checklist results and verdict. Record the owner's approval of the three D3 sources, given on 2026-11-12. Verify that the sources are recorded as approved
- [x] 8.2 Build comp A on `comp/r1-<slug>`:
  - Light and dark tokens
  - At most two OFL families added with `fonts.mjs`
  - Component styles
  - One symbol idea
  - Any wordmark exception entry, with its reason

  Open its draft PR. Verify that the preview builds, `npm run check:structure` is empty, and the look review is recorded in `rounds.md`
- [x] 8.3 Build comp B the same way. Verify as in 8.2, and also that its typeface family, primary color and layout structure all differ from comp A's
- [x] 8.4 Build comp C the same way. Verify as in 8.2, and also that it differs from A and B in typeface family, primary color and layout structure
- [ ] 8.5 Run `capture-comps.mjs` for round 1, and send the owner the three preview links and the sheet. Ask whether to publish the sheet as a private Artifact. Record the verdict and notes in `rounds.md`. Then close the losing PRs and delete their branches. If no direction wins, repeat 8.1 to 8.5 with new sources. Verify that `gh pr list` shows only the winning comp PR and the `visual-identity` draft PR, besides PR #1

## 9. Round 2: refine the chosen direction

- [x] 9.1 Build two variants of the winner on `comp/r2-<slug>-a` and `-b`. Record in `rounds.md` what each one varies. Add three symbol options under `src/assets/brand/options/`, each passing the plain-vector rule. Open the draft PRs. Verify as in 8.2, and that the motif review records every banned motif as absent for each symbol option
- [ ] 9.2 Capture the round 2 sheet, including the symbol strip, and send it with the preview links. Record the owner's choice of variant and symbol, then close the losing PRs and delete their branches. Verify that the verdict is recorded and only the chosen branch remains open

- [x] 9.3 Allow hero-only animation (design D14): the animation rule exempts `src/components/hero/` when every animation sits inside `@media (prefers-reduced-motion: no-preference)`, with the config key and README row updated. Verify with fixture tests that a guarded hero animation passes, an unguarded hero animation fails and names the file and line, and an animation outside the hero still fails
- [ ] 9.4 Build hero options for Plate, each on its own branch from `comp/r2-catalog-a` with a draft PR, CSS only, inspired by the Art District on Santa Fe. Record each in `rounds.md` with its look review. Verify for each that the preview builds, `npm run check:structure` is empty, axe passes in both schemes, and with reduced motion no animation runs in the hero
- [ ] 9.5 Send the owner the hero option previews. Record the chosen hero and symbol in `rounds.md`, then close the other round 2 PRs and delete their branches. Verify that the verdict is recorded

## 10. Round 3: final identity

- [ ] 10.1 Apply the chosen variant and symbol to every page and state, in both schemes:
  - The 404 and confirmation pages
  - Contact form focus and invalid states
  - Service and case study templates

  Delete `src/assets/brand/options/`. Verify that the site check passes, `npm run check:structure` is empty, and a look review of every page template is recorded
- [ ] 10.2 Style the social image template and the icons for the identity. Verify by viewing the Home, a service and a case study image, plus the icons at 16, 32 and 180 px, and recording the owner's sign-off in `rounds.md`
- [ ] 10.3 Add a "Visual identity" section to `README.md`: the token roles in both schemes, the typefaces and their licenses, how the symbol is used, and how to add a token. Verify that every file path and command it names exists and runs
- [ ] 10.4 Send the owner the final preview, and record the final sign-off in `rounds.md`. Verify that the record shows the sign-off with its date

## 11. Integration checks

- [ ] 11.1 Run `npm run audit` on the final branch. Verify that every page meets each Lighthouse category ≥ 0.95, LCP ≤ 2500 ms, CLS ≤ 0.1 and TBT ≤ 200 ms, and that axe and the interaction checks report zero failures in both schemes. Record the results in `audit-results.md`
- [ ] 11.2 Merge the final comp branch into `visual-identity`, then `visual-identity` into `astro-site-foundation`, and push. Close the remaining comp and `visual-identity` draft PRs, and delete their branches. Verify:
  - PR #1's deploy preview shows the identity in both schemes
  - `curl` checks show the icons, a per-page `og:image` and `X-Robots-Tag: noindex, nofollow`
  - `gh pr list` shows only PR #1
  - Nothing was merged to `main`
- [ ] 11.3 Run `npm run release-check` and `openspec validate visual-identity --strict`. Verify that validation passes and that the release check fails only on owner inputs that are still pending. Share that list with the owner

## Workflow follow-up

- Archive this change after the owner's review.
- Launch stays a separate change: cutover to `elevationcode.works`, analytics and Search Console.
