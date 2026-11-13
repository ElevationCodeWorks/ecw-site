# Design

## Context

Motivation is in proposal.md. These facts shape the approach, all checked on 2026-11-12.

**Where Change 1 left things**
- `astro-site-foundation` is 38 of 38 tasks done but not archived, so `openspec/specs/` is empty. This change modifies `brand-guardrails`, `site-platform` and `seo`, and archive refuses MODIFIED deltas against specs that don't exist yet. Change 1 must be archived first.
- PR #1 (`astro-site-foundation` → `main`) is open and must never be merged before launch. Netlify builds a deploy preview for it at `deploy-preview-1--elevationcodeworks.netlify.app`. Branch deploys never triggered.
- DigitalOcean App Platform probably deploys `main` to production.

**The placeholder look**
- `src/styles/tokens.css` is the only file with color literals and font-family names. Its tokens are `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-border-strong`, `--color-link`, `--color-link-hover` and `--color-focus`, plus type, space and shape tokens. There's no dark scheme.
- Components (`SiteHeader`, `SiteFooter`, `CallToAction`, `ServiceList`, `WorkPreview`) and page templates style themselves in scoped `<style>` blocks that use the tokens only.
- `BaseLayout` sets `<link rel="icon" href="data:,">` and points every page at one `public/og/default.png`, which `scripts/make-og.mjs` renders once with local Chrome.

**The site check** (`integrations/site-check/`)
- Runs in `astro:build:done` and through `npm run check:site`.
- Parses CSS with postcss. Each declaration records its selectors and its direct parent at-rule only, so a token inside `@media (prefers-color-scheme: dark) { :root { … } }` can't yet be told apart from a light one.
- Color rules use `culori`, which also provides `wcagContrast`.
- The platform rule already rejects literal colors in `fill`, `stroke` and `style` attributes in markup.

**The audit** (`scripts/audit.mjs`) runs Lighthouse CI, then axe-core and interaction checks in Playwright contexts. None of those contexts set `colorScheme`.

**Measured hues (OKLCH)**

| Color | Hue |
|---|---|
| Placeholder link blue `#0b57d0` | 260.6° |
| Tailwind blue-700 | 264.4° |
| Indigo-500/600 | 277° |
| Violet-500 | 292.7° |
| Fuchsia-500 | 322.1° |

The default AI dark navies (slate-900/950, gray-900) sit at L 0.13 to 0.21, C about 0.04, hue about 265°.

**Fonts:** every candidate family in D4 is published on Fontsource under OFL-1.1, with static and variable packages at 5.3.0.

## Goals / Non-Goals

**Goals:**
- Every comp is a real build of the real site, so what the owner approves is what ships.
- The new guardrails land, and pass on the placeholder look, before the first comp is built. Every comp is then held to the full rule set by its own build.
- Social images and icons are generated during the build from the tokens and content, so they can't go stale.
- One structural baseline proves that the restyle changed no copy, headings, links or structured data.

**Non-Goals:**
- No client JavaScript, so there's no theme toggle and no motion library.
- No change to content collections.
- No CMS-style theme system with multiple themes shipped at once. The site ships exactly one identity.

## Decisions

### D1. Sequence: guardrails and plumbing first, then three rounds
1. **Phase A, on the placeholder look:** archive Change 1, then build on a new `visual-identity` branch:
   - the new site-check rules (D10)
   - dark-scheme token structure (D5)
   - font loading (D6)
   - social image and icon endpoints (D7, D8)
   - the structure baseline (D11)
   - the dark-scheme audit (D12)

   The placeholder look must pass everything. Its "dark scheme" is a plain inverted neutral palette, and a temporary symbol is a plain square.
2. **Round 1:** three directions (D3), each a comp branch with a preview.
3. **Round 2:** two variants of the chosen direction, plus three symbol options.
4. **Round 3:** the final identity on every page, with social images, icons and a full audit.

**Why phase A first:** if rules land after the comps, comps get built against a weaker check. Plumbing built once on the trunk also keeps comp branches down to style changes.

**If no direction wins a round,** run that round again with new source material. The rounds record keeps what was rejected and why.

### D2. Comps are branches of the real site with draft-PR previews
**Branches and pull requests**
- Each comp is a branch named `comp/r<round>-<slug>`, cut from `visual-identity`.
- Each gets a **draft** PR against `main`, titled `[Comp R1] Trailhead (draft, do not merge)`. Netlify builds deploy previews for PRs against the production branch, and PR #1 proves that path works. Draft PRs can't be merged.
- After a round, losing PRs are closed and their branches deleted. The winner's branch is the base for the next round.
- At the end of round 3, the winning branch merges into `visual-identity`, and `visual-identity` then merges into `astro-site-foundation`, so PR #1's preview shows the final identity. Nothing merges to `main`.

**What a comp may change**
- `tokens.css` and `base.css`
- Component and template `<style>` blocks
- Component markup for layout, such as wrappers, classes and element order within a component
- The symbol SVG
- The font files the comp uses

It may not change content collections, `src/lib/`, SEO or structured data. D11 checks this.

**Screenshot sheet**
- `scripts/capture-comps.mjs` takes the round number and each comp's preview URL.
- It captures Home, Services, one service page, one case study, About and Contact, at 1440×900 and 390×844, in light and dark.
- It writes `comps/round-<n>/index.html`, a side-by-side sheet. `comps/` is git-ignored.
- The owner opens the sheet locally. If the owner asks, it can be published as a private Artifact with compressed images, since the size limit is 16 MB.

**The gate before a comp reaches the owner:** the preview builds (so the site check passes), the structure diff is empty, the look review is recorded (D4), and the round's entry in `rounds.md` is written.

**Alternatives considered:**
- *A style switcher on one build:* needs client JavaScript.
- *A separate Netlify site per comp:* setup and teardown for every comp.
- *Static mockups:* the owner chose real previews.

### D3. Round 1 directions
The owner approved all three sources on 2026-11-12. Each direction must differ from the others in typeface family, primary color and layout structure, and each names its distance from the four AI defaults:
- SaaS: Inter, centered hero, indigo gradient, cards.
- Claude editorial: cream, display serif, terracotta, italic accent, mono eyebrows.
- Dev brutalist: monospace everywhere, grid lines.
- Dark neon.

**A. Trailhead**
- **Source:** Colorado highway guide signs and Forest Service trailhead signs.
- **Look:** sign green as the primary color, with white type on green panels in the header, footer and calls to action. Square corners and plain, legible hierarchy.
- **Type:** Overpass, which descends from Highway Gothic.
- **Risk:** imitating official signage. Borrow the color and the type, never shields, arrow panels or sign layouts.

**B. Catalog**
- **Source:** industrial parts catalogs and hardware-store shelf tags.
- **Look:** dense and factual. Black on white with one high-visibility yellow, used as a fill and never as text on white. Condensed headings, and each service's "who it's for / included / not included" set as spec rows.
- **Type:** Archivo, using its condensed widths, or Libre Franklin.
- **Risk:** reads as cold. The founder photo and the letter voice carry the warmth.

**C. Letterhead**
- **Source:** the copy's first-person letter voice and small-business stationery.
- **Look:** a single reading column, generous body size, and blue-black ink on pure white with one stamp color. The founder photo and a signature sit on Home and About.
- **Type:** a sturdy slab, Bitter or Zilla Slab. Never a light display serif.
- **Risk:** this is the direction closest to Claude's editorial look. The look review checks it hardest: no cream, no italic accents, no display serif, no eyebrows.

**None of the directions** may use the portfolio sites' fonts or primary colors. D10 enforces this.

**Logo symbol:** each round 1 comp shows one symbol idea that comes from its direction. Round 2 explores three options for the chosen direction.

### D4. Look checklist and rounds record
The checklist lives in `README.md` under "Look review" and is part of the brand-guardrails spec's look review.

**Items the site check can't verify:**
1. Centered hero with a headline, a subhead and two buttons
2. A three-up feature grid with icons in tinted tiles
3. Large rounded cards with soft shadows as the main container
4. Bento grids
5. A logo cloud or "trusted by" strip
6. A row of big unsourced numbers
7. Every section the same width and rhythm, with centered headings
8. A dark navy or near-black hero with a bright accent
9. Blob or flat-vector illustrations of people, stock photos, AI images
10. A sparkle icon for anything AI
11. Check marks in colored circles as list bullets
12. A short label set apart above a heading (the eyebrow, in any styling)
13. The direction echoes a portfolio site
14. The direction looks like a template a tool would produce

**Logo symbol options** are also reviewed against each banned motif in the brand-guardrails spec.

**Recording:** results go in `openspec/changes/visual-identity/rounds.md`. Each comp gets its source, preview URL, check status, checklist results with notes, and the owner's verdict. The repo is public, so the record names no employer.

### D5. Dark scheme in the tokens
- `tokens.css` declares every color token in `:root`, sets `color-scheme: light dark`, and redeclares every color token inside `@media (prefers-color-scheme: dark) { :root { … } }`.
- `BaseLayout` adds `<meta name="color-scheme" content="light dark">`, so the first paint is already in the right scheme.
- **Token roles grow:** `--color-accent` and `--color-on-accent`. Components keep using role names, never scheme names.
- **The site check learns schemes:** `css.ts` records the full at-rule ancestry of each declaration, so color rules evaluate each scheme separately.

**New rules**
- *Scheme parity:* every color token has a value in both schemes.
- *Contrast pairs:* `site-check.config.ts` lists `{ fg, bg, min }` pairs. Text on backgrounds and surfaces needs 4.5. Large headings, `--color-border-strong`, focus and other graphics need 3. Each pair is measured with `wcagContrast` in both schemes.

**Alternative considered:** `light-dark()` in each token value. It's more compact, but it hides the dark palette inside light declarations, and the check would have to parse function arguments.

### D6. Fonts: committed OFL files, @font-face in the tokens
**Copying the files**
- `scripts/fonts.mjs <family>` copies files from a pinned Fontsource package into `src/assets/fonts/<family>/`:
  - the Latin-subset WOFF2 files the site uses (variable where available)
  - static Latin WOFF files at 400 and 700 for social images, since satori reads neither WOFF2 nor variable fonts
  - the package's OFL license
- The Fontsource package is a devDependency only while a comp is choosing fonts. The committed files are what builds use.

**Loading**
- `tokens.css` holds the `@font-face` rules, with `font-display: swap`. They reference the files by relative URL, so Vite gives them hashed names, and `netlify.toml` serves `/_astro/*` as immutable.
- `src/lib/fonts.ts` imports at most two critical files with `?url`, and `BaseLayout` preloads them.

**Metric-matched fallbacks**
- `scripts/font-fallback.mjs` uses `@capsizecss/core` and `@capsizecss/metrics` (`@capsizecss/unpack` is already installed) to generate an `@font-face` fallback for each family.
- The fallback sets `size-adjust` and the ascent, descent and line-gap overrides over a local system face, such as Arial or Georgia.
- Its output is pasted into `tokens.css`, so the font names stay in the one tokens file.

**New site-check rules**
- *Budget:* at most 2 web families (fallback faces with only `local()` sources don't count), at most 4 files, and at most 150 KB in total.
- *License:* every directory under `src/assets/fonts/` has a license file.
- *Third-party hosts:* no font URL in the build points to another origin.

**Alternatives considered:**
- *Astro's Fonts API:* automates fallbacks, but moves family names into `astro.config.mjs`, outside the one tokens file and outside the site check's view.
- *The Google Fonts CDN:* a third-party request, which the spec bans.

### D7. Per-page social images at build time
**The endpoint:** `src/pages/og/[...slug].png.ts` is a prerendered endpoint. Its `getStaticPaths` enumerates the same indexable pages the sitemap lists, plus a `default` image for the not-found and confirmation pages.

**Paths:** `/og/home.png`, `/og/services.png`, `/og/services/<slug>.png`, `/og/work/<slug>.png`, `/og/about.png` and `/og/contact.png`. `BaseLayout` derives the image path from `Astro.url.pathname`, so pages pass nothing. The alt text is "<page title>, Elevation Code Works".

**Rendering**
- `src/lib/og.ts` lays out the wordmark, the symbol, the page title and the domain with `satori`, using plain element objects with no React.
- It takes colors from the light-scheme tokens through a shared token reader, `src/lib/tokens.ts`, which uses the site check's postcss parser.
- It renders the SVG to PNG with `sharp`. Astro already uses `sharp`, and Netlify ran it in Change 1's builds.
- The template gets its final styling in round 3.

**Removed:** `scripts/make-og.mjs` and `public/og/default.png`.

**New site-check rule:** every indexable page's `og:image` exists in `dist/`, is unique, and is a PNG whose header says 1200×630.

**Alternatives considered:**
- *Keep the Chrome script and commit PNGs:* a manual step, the images go stale, and Netlify has no Chrome.
- *`astro-og-canvas`:* less layout control.
- *An edge function:* runtime code and credits.

### D8. Symbol and site icons from one source
**One source:** `src/assets/brand/symbol.svg` holds paths only, with `fill="currentColor"`. `Symbol.astro` inlines it with a `?raw` import, adding `aria-hidden="true"` and `focusable="false"`.

**Three prerendered endpoints build the icons from it:**
- `src/pages/favicon.ico.ts`: a 32-pixel PNG from `sharp`, wrapped in a single-image ICO container, which takes about 20 lines of header bytes.
- `src/pages/icon.svg.ts`: the symbol with an embedded `<style>` that uses the light text color and switches under `@media (prefers-color-scheme: dark)`. Colors come from the tokens.
- `src/pages/apple-touch-icon.png.ts`: 180 pixels, the symbol on the background token, with padding.

`BaseLayout` links all three and drops `href="data:,"`.

**New site-check rules**
- *Symbol plain vector:* the symbol has no `linearGradient`, `radialGradient`, `filter`, `pattern`, `image` or `text` elements, and no fill other than `currentColor`.
- *Banned colors* also scan `dist/icon.svg`.

### D9. Trail-rating marks (dropped)
The plan put green circle, blue square and black diamond marks on the Services section, rating each service by the size of the commitment. The owner dropped them on 2026-11-12: a fixed size per service could set the wrong expectations, since a project's scope depends on the client. They were built in phase A (tasks 6.1 and 6.2) and then removed (task 6.3). Nothing of them remains in the content, tokens or components.

### D10. New guardrail rules and how each is checked
| Rule | Input | Method |
|---|---|---|
| Banned typefaces (extended) | CSS | Prefix match on each family name in the stack, using the list in the spec |
| Portfolio echo | CSS, color tokens | `portfolioReferences: [{ site, fonts, colors }]` in config. Fonts by name, colors by CIEDE2000 under 8 |
| Violet category | Color tokens, icon SVG | OKLCH hue 270° to 335° and C ≥ 0.08, both thresholds in config. Tests show `#0b57d0` and blue-700 pass, and indigo, violet and fuchsia fail |
| AI dark navy | Dark-scheme tokens | New references: slate-900 `#0F172A`, slate-950 `#020617`, gray-900 `#111827` and slate-800 `#1E293B`. They are not neutral (C about 0.04), so the existing CIEDE2000 comparison applies |
| Heading accents | `dist/` HTML | The only elements allowed inside h1 to h6 are `a`, `abbr`, `code`, `br` and `svg[aria-hidden="true"]` |
| Eyebrow labels | CSS | `text-transform: uppercase`, `font-variant-caps: all-small-caps` or `all-petite-caps`, or `letter-spacing` above 0.05em (px values divided by 16) |
| Decorative backgrounds | CSS (with token values resolved) | Any `*-gradient(`, `filter: blur(`, any `text-shadow` other than `none`, and box shadows with a blur over 24px or a color with OKLCH C ≥ 0.02 |
| Animation | CSS | `@keyframes`, `animation-name` or `animation` other than `none`, `animation-timeline`, `scroll-timeline`, `view-timeline`, and transition durations over 250ms. The reduced-motion reset in `base.css` passes, since it sets only durations |
| Image sources | `src/assets/`, `public/` | Rasters only under `src/assets/work/` or `src/assets/founder*`. Vectors only under `src/assets/brand/`. `public/` holds no images |
| Scheme parity, contrast | Tokens | D5 |
| Font budget, license, hosts | Tokens, font directories | D6 |
| Symbol plain vector | Symbol source | D8 |
| Social image presence | `dist/` | D7 |

**Portfolio references:** the colors and fonts in `portfolioReferences` are sampled once with Playwright, from computed styles and CSS custom properties on each site's Home. The sample date is recorded in the config. The memory notes record Chivo for Condies and a cobalt for Uphill. The sampling supplies the exact values.

Every rule gets passing and failing fixture tests, following the Change 1 pattern.

### D11. Structure baseline
- `scripts/structure-snapshot.ts` reads `dist/` and writes, for each page, its visible text in DOM order, its heading outline, its links (text and href) and its JSON-LD.
- The baseline is captured at the end of phase A. It goes to `openspec/changes/visual-identity/structure-baseline.json`, so every comp's expected diff is **empty**.
- `npm run check:structure` builds, snapshots and diffs against the baseline, and exits non-zero on any difference.
- Text is compared in DOM order, with whitespace normalized. Wrappers and classes don't count as changes, but a comp that reorders elements inside a component (which D2 allows) shows up as a text or heading reordering. The comp's review then records whether the new order changes what the page says.

**Why a separate script:** the baseline only means something during this change. A permanent build rule would block every later content edit.

### D12. Audit in both schemes
- `scripts/audit.mjs` runs axe at both viewports and the keyboard and visible-focus checks twice: once with `colorScheme: 'light'` and once with `colorScheme: 'dark'`.
- Lighthouse stays light-only. The scheme doesn't change load performance, and Lighthouse CI can't emulate `prefers-color-scheme` without a custom runner.
- Results go to `openspec/changes/visual-identity/audit-results.md`.

### D13. Wordmark
- The header's brand link stays live text in the heading face.
- Any custom tracking or uppercase in the wordmark needs a site-check exception entry with its reason. That is the only expected exception from the eyebrow rule.
- The symbol sits before the text inside the same link.

## Risks / Trade-offs

**The look**
- [Comps drift toward AI defaults, because the same model produces them] → Named sources approved by the owner, rules that make the common tells fail the build, the written checklist before every share, and the owner's veto each round.
- [The three directions converge] → D3 requires different families, primary colors and layout structures, and the checklist records it.
- [Letterhead slides into Claude's editorial look] → Slab, not display serif; pure white; no italics. It's the first direction the look review is applied to.
- [Trailhead reads as government signage] → Color and type only. No shields, arrows or sign layouts, which the symbol motif rule also bans.

**Performance**
- [Web fonts slow pages] → The 150 KB budget, at most two preloads, metric-matched fallbacks, and Lighthouse thresholds unchanged from Change 1.

**Generated images and icons**
- [Satori's CSS subset limits the social image design] → Flexbox-only layout, static WOFF files, and a deliberately simple template.
- [The SVG favicon's dark variant isn't honored in Safari] → Safari falls back to the ICO and touch icon. Acceptable.

**Guardrails**
- [The uppercase and letter-spacing ban is too strict] → An exception entry with a reason, one file and line at a time. The wordmark is the expected case.

**Process**
- [A draft comp PR gets merged into `main`, which DigitalOcean may deploy] → Drafts can't be merged, the titles say "do not merge", and PRs are closed after each round.
- [The Netlify free plan builds one at a time, so three previews queue] → Builds take minutes, so this is acceptable.
- [Comps are public in a public repo] → Fine. The rounds record and comp copy name no employer, and the private-terms scan runs in every preview build.

## Migration Plan

1. Archive Change 1, so its specs land in `openspec/specs/`.
2. Branch `visual-identity` from `astro-site-foundation` and do phase A there. Open a draft PR against `main`, so Netlify confirms satori and sharp build on Linux before any comp exists.
3. Run rounds 1 to 3 on comp branches (D2).
4. Merge the winner into `visual-identity`, then into `astro-site-foundation`. PR #1 then carries both changes to launch.

**Rollback:** comps are disposable branches. Until step 4, `astro-site-foundation` is untouched, so dropping `visual-identity` restores the placeholder look. Production is never touched.

## Open Questions

- The exact sampled portfolio colors and fonts. They're filled in by a phase A task and don't change the rules.
- Whether the owner wants the screenshot sheet published as a private Artifact or kept local. It's decided at the first round and changes nothing else.
