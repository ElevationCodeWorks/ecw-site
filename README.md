# Elevation Code Works website

The marketing site for Elevation Code Works, a Denver software engineering business for small businesses. It is a fully static [Astro](https://astro.build) site hosted on Netlify. There is no server code: every page is prerendered HTML, and the contact form is handled by Netlify Forms.

Planning lives in [`openspec/`](openspec/). The current specs are in `openspec/specs/`, and the change in progress is `openspec/changes/visual-identity/`.

## Setup

Requirements: Node 26 (see `.nvmrc`; Node 24 also works) and npm.

```sh
nvm use        # or install Node 26 another way
npm install
```

## Scripts

| Command                   | What it does                                                                                                                                                                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`             | Starts the dev server at http://localhost:4321 with live reload.                                                                                                                                                                                                                                          |
| `npm run build`           | Type-checks with `astro check`, builds the static site into `dist/`, then runs the site check. Any violation fails it.                                                                                                                                                                                    |
| `npm run preview`         | Starts a background server for the built `dist/` and prints its URL (Astro 7 runs it in the background). Stop it with `npx astro preview stop`. Run `npm run build` first.                                                                                                                                |
| `npm run check:site`      | Runs the site check against the existing `dist/` without rebuilding.                                                                                                                                                                                                                                      |
| `npm run check:structure` | Builds, then compares every page's visible text, heading outline, links and JSON-LD with `openspec/changes/visual-identity/structure-baseline.json`. Exits 1 on any difference. A restyle must leave it empty.                                                                                            |
| `npm run release-check`   | Lists every question the owner still needs to answer (`pending` markers). Exits 1 while any remain. Run before launch.                                                                                                                                                                                    |
| `npm run audit`           | Builds in production mode, then runs Lighthouse (mobile), axe-core (WCAG 2.2 AA) and keyboard, reflow, reduced-motion and no-JavaScript checks on every page. axe and the keyboard and focus checks run in the light and the dark color scheme. Rebuilds in preview mode afterwards. Takes a few minutes. |
| `npm test`                | Runs the unit tests (`*.test.ts`) with Node's built-in test runner.                                                                                                                                                                                                                                       |
| `npm run fmt`             | Formats the project with Prettier.                                                                                                                                                                                                                                                                        |
| `npm run fmt:check`       | Checks formatting without changing files.                                                                                                                                                                                                                                                                 |

## Project layout

```
astro.config.mjs              Astro config: canonical origin, URL shape, sitemap, integrations
src/site.config.ts            Site-wide settings (canonical origin, brand, contact details)
src/styles/tokens.css         Every color and font value, in both color schemes (design tokens)
src/styles/base.css           Reset and element defaults, tokens only
src/layouts/BaseLayout.astro  Page shell: head metadata, skip link, header, footer
src/pages/                    One file per route, plus the icon and social image endpoints
src/pages/og/[...slug].png.ts Per-page social images, rendered at build time (src/lib/og.ts)
src/assets/brand/symbol.svg   The logo symbol; the header, favicon and touch icon draw from it
src/assets/fonts/             Self-hosted font files and their licenses (see Typefaces)
src/content/                  Page copy: services/, work/ (case studies), pages/
src/content.config.ts         Content schemas, enforced at build time
integrations/                 Build-time integrations (indexing headers, site check)
scripts/                      One-off tools (release check, audit, screenshots, fonts, portfolio sampling)
site-check.config.ts          Banned patterns and thresholds for the site check
site-check.exceptions.json    Waivers for specific site-check violations
```

## Search indexing

Whether a build may be indexed is decided at build time from Netlify's `CONTEXT` and `URL` variables (`src/lib/env.ts`). Only a production build whose main address is `https://elevationcode.works` is indexable. Every other build, including local builds, gets a disallow-all `robots.txt`, a `_headers` file that sends `X-Robots-Tag: noindex, nofollow`, and a robots meta tag on every page.

## Site check

The site check runs at the end of every `npm run build` and fails the build on any violation. It prints one line per violation:

```
dist/about/index.html:42  brand/banned-word  "elevate"  (Banned: elevate)
```

### Rules

| Rule                                                                                                    | What it enforces                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `brand/banned-word`                                                                                     | No marketing words like "elevate", "unlock", "seamless". The exact name "Elevation Code Works" and the domain `elevationcode.works` are allowed, and so are a client's words inside a `blockquote` (the attribution is still checked).                                                                                                                                                                                                                         |
| `brand/banned-phrase`                                                                                   | No "not just", "In today's fast-paced" or "Whether you're".                                                                                                                                                                                                                                                                                                                                                                                                    |
| `brand/generic-cta`                                                                                     | No button or link whose whole text is "Get Started" or "Learn More".                                                                                                                                                                                                                                                                                                                                                                                           |
| `brand/em-dash`                                                                                         | No em dashes in headings, buttons, links or the brand line.                                                                                                                                                                                                                                                                                                                                                                                                    |
| `brand/emoji`                                                                                           | No emoji in headings, navigation, buttons or list markers.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `brand/trailing-arrow`                                                                                  | Link text may not end with an arrow.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `brand/numbered-label`                                                                                  | No "01 / Services" labels outside an ordered list.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `brand/first-person-plural`                                                                             | Copy says "I", never "we", "our" or "us" (quotes excepted).                                                                                                                                                                                                                                                                                                                                                                                                    |
| `brand/employer-term`                                                                                   | No employer names or identifying terms anywhere in the build, including metadata and JSON-LD.                                                                                                                                                                                                                                                                                                                                                                  |
| `brand/heading-accent`                                                                                  | Headings may not set words apart. The only elements allowed inside `h1` to `h6` are `a`, `abbr`, `code`, `br` and `svg` with `aria-hidden="true"`, so no `em`, `span`, `mark` or `strong`.                                                                                                                                                                                                                                                                     |
| `brand/banned-font`                                                                                     | No banned typefaces in stylesheets, tokens or web-font links. A family that extends a banned name by whole words is banned too: "Inter Tight" and "Roboto Slab" fail, "Interstate" doesn't.                                                                                                                                                                                                                                                                    |
| `brand/portfolio-echo`                                                                                  | No typeface or color token from the showcased portfolio sites (`portfolioReferences`). A variant of a portfolio typeface ("Chivo Mono") fails too.                                                                                                                                                                                                                                                                                                             |
| `brand/monospace`                                                                                       | Monospace only on `code`, `kbd`, `samp` and `pre`.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `brand/eyebrow`                                                                                         | No `text-transform: uppercase`, no `all-small-caps` or `all-petite-caps`, and no letter spacing above 0.05em (px divided by 16). These mark eyebrow labels. A wordmark that needs one takes an exception entry.                                                                                                                                                                                                                                                |
| `brand/decorative-background`                                                                           | No gradients of any kind, no `filter: blur()`, no text shadows, and no box shadow with a blur over 24px or a non-neutral color (OKLCH chroma 0.02 or more). Token references are resolved in both schemes.                                                                                                                                                                                                                                                     |
| `brand/animation`                                                                                       | No `@keyframes`, no `animation` or `animation-name` other than `none`, no scroll-driven timelines, and no transition longer than 250ms. The reduced-motion reset in `base.css` passes.                                                                                                                                                                                                                                                                         |
| `brand/gradient-text`, `brand/backdrop-blur`, `brand/noise`, `brand/custom-cursor`, `brand/pill-radius` | No gradient text, frosted glass, grain/noise, custom cursors, or pill and circle radii.                                                                                                                                                                                                                                                                                                                                                                        |
| `brand/banned-color`, `brand/warm-off-white`, `brand/orange-accent`, `brand/violet`                     | Color tokens, in either scheme, may not match Anthropic's palette, Claude's cream and rust, AI indigo and violet, or the AI dark navies. Warm off-white backgrounds, orange accents and violet, purple or magenta (OKLCH hue 270° to 335°, chroma 0.08 or more) are banned as categories. Banned colors, orange and violet are also checked in the brand SVGs (`src/assets/brand/` and the built `dist/icon.svg`). A dark-scheme match says so in its message. |
| `identity/scheme-parity`                                                                                | Every color token has a value in the light scheme (`:root`) and in the dark scheme (`@media (prefers-color-scheme: dark) { :root { … } }`).                                                                                                                                                                                                                                                                                                                    |
| `identity/contrast`                                                                                     | Every pair in `contrastPairs` meets its WCAG ratio in both schemes. A failure names both tokens, the scheme, the measured ratio and the required one.                                                                                                                                                                                                                                                                                                          |
| `identity/image-source`                                                                                 | Raster images only under `src/assets/work/` (screenshots) or `src/assets/founder*` (founder photos); vectors only under `src/assets/brand/`; no images in `public/`. Anything else needs an exception entry with a `source`.                                                                                                                                                                                                                                   |
| `identity/font-budget`                                                                                  | At most 2 web font families and 4 font files declared with `url()` sources (fallback faces with only `local()` sources don't count), at most 150 KB of font files in total, and at most 2 font preloads per page.                                                                                                                                                                                                                                              |
| `identity/font-license`                                                                                 | Every family directory under `src/assets/fonts/` has a `LICENSE` (or `OFL.txt`) beside its font files.                                                                                                                                                                                                                                                                                                                                                         |
| `identity/font-host`                                                                                    | No font is loaded from another origin: no Google Fonts, Typekit or CDN links, and no third-party font URLs in built HTML or CSS.                                                                                                                                                                                                                                                                                                                               |
| `identity/symbol-plain`                                                                                 | The logo symbol and its options (`src/assets/brand/`) are plain single-color vectors: no gradients, filters, patterns, masks, images or text, and every fill and stroke is `currentColor`.                                                                                                                                                                                                                                                                     |
| `platform/raw-value`                                                                                    | No color or font literals outside `src/styles/tokens.css`.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `platform/client-script`                                                                                | No client JavaScript in built pages. Only JSON-LD scripts are allowed.                                                                                                                                                                                                                                                                                                                                                                                         |
| `seo/title`, `seo/description`                                                                          | Every sitemap page has one unique title (60 characters max, ending "Elevation Code Works" except Home) and one unique description (70 to 160 characters).                                                                                                                                                                                                                                                                                                      |
| `seo/headings`                                                                                          | Exactly one H1 per page, and heading levels never skip.                                                                                                                                                                                                                                                                                                                                                                                                        |
| `seo/canonical`                                                                                         | Every sitemap page has one canonical link to itself on `https://elevationcode.works`.                                                                                                                                                                                                                                                                                                                                                                          |
| `seo/internal-link`                                                                                     | Internal links end in `/` unless they point to a file.                                                                                                                                                                                                                                                                                                                                                                                                         |
| `seo/noindex-headers`                                                                                   | Non-production builds have a `_headers` file that sends `noindex`.                                                                                                                                                                                                                                                                                                                                                                                             |
| `seo/social`                                                                                            | Every sitemap page has the Open Graph and Twitter tags, with `og:site_name` set to the brand name and a large-image card.                                                                                                                                                                                                                                                                                                                                      |
| `seo/social-image`                                                                                      | Every sitemap page's `og:image` exists in `dist/`, belongs to that page alone, and is a PNG whose header says 1200x630.                                                                                                                                                                                                                                                                                                                                        |

### Changing what is banned

Banned words, phrases, typefaces, reference colors and thresholds live in `site-check.config.ts`. To ban a new pattern everywhere, add it there rather than writing exceptions. The keys the look rules use:

| Key                                            | What it holds                                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `bannedFonts`                                  | Banned typeface names, matched with their whole-word variants.                                                                        |
| `referenceColors`, `colorMatch`                | Banned colors and the CIEDE2000 distance under which a token counts as one. Neutrals (OKLCH chroma under `neutralChroma`) are exempt. |
| `warmOffWhite`, `orangeAccent`, `violetAccent` | OKLCH ranges for the banned color categories.                                                                                         |
| `portfolioReferences`, `portfolioSampledAt`    | The portfolio sites' typefaces and primary colors. Refresh them with `node scripts/sample-portfolio.mjs` and paste its output.        |
| `contrastPairs`                                | `{ fg, bg, min }` token pairs measured in both schemes. Add a pair whenever a component puts a token on a new background.             |
| `maxLetterSpacingEm`                           | The letter spacing above which text reads as an eyebrow label.                                                                        |
| `shadow`                                       | The largest allowed shadow blur (`maxBlurPx`) and the chroma at which a shadow color stops being neutral (`maxChroma`).               |
| `maxTransitionMs`                              | The longest allowed transition.                                                                                                       |
| `fontBudget`                                   | The web font limits: families, files, total KB and preloads per page.                                                                 |
| `fontHosts`                                    | Hosts that serve web fonts, which pages may never load from.                                                                          |

### Exceptions

To waive one specific violation, add an entry to `site-check.exceptions.json`. Each entry names the rule, the file and line from the violation report, and a written reason.

Example exception:

```json
[
  {
    "rule": "brand/pill-radius",
    "file": "src/components/FounderPhoto.astro",
    "line": 12,
    "reason": "The founder photo is intentionally circular."
  }
]
```

An entry with an empty reason fails the check, and so does an entry that no longer matches any violation, so stale waivers get cleaned up. An `identity/image-source` entry also needs a `source` saying where the image came from; without one it fails and waives nothing.

### Look review

The site check can't see everything that makes a site read as AI-generated or as Claude's house style. Before any comp, or the final identity, is shown to the owner, it is reviewed against this checklist, and the result is recorded item by item, pass or fail, with a note for every fail, in `openspec/changes/visual-identity/rounds.md`. A comp that fails an item is fixed and reviewed again, or the owner's acceptance of the fail is written into the record. The record names no employer.

A comp fails an item if it has:

1. A centered hero with a headline, a subhead and two buttons
2. A three-up feature grid with icons in tinted tiles
3. Large rounded cards with soft shadows as the main container
4. Bento grids
5. A logo cloud or "trusted by" strip
6. A row of big unsourced numbers
7. Every section at the same width and rhythm, with centered headings
8. A dark navy or near-black hero with a bright accent
9. Blob or flat-vector illustrations of people, stock photos or AI images
10. A sparkle icon for anything AI
11. Check marks in colored circles as list bullets
12. A short label set apart above a heading (an eyebrow, in any styling)
13. A direction that echoes a portfolio site
14. A direction that looks like a template a tool would produce

Every logo symbol option is also reviewed against the banned motifs, and each one is recorded as absent: mountain peaks, upward arrows or chevrons, code brackets, a terminal prompt or cursor, a sparkle or four-point star, gears, lightbulbs, rockets, circuit traces, a hexagon badge, the Colorado flag's "C", the state's outline, and any official sign, highway shield or agency mark.

## Typefaces

Fonts are free (SIL Open Font License), self-hosted and committed to the repository, at most two families. Every font name lives in `src/styles/tokens.css`. To add a typeface:

1. Pick an OFL family on [Fontsource](https://fontsource.org) that isn't banned (`bannedFonts`) or used by a portfolio site (`portfolioReferences`).
2. Install its pinned packages. The variable package exists only for variable families; skip it otherwise.

   ```sh
   npm install -D -E @fontsource/<slug>@<version> @fontsource-variable/<slug>@<version>
   ```

3. Copy the files in:

   ```sh
   node scripts/fonts.mjs <slug>
   ```

   This writes `src/assets/fonts/<slug>/`: the Latin WOFF2 the site serves (the variable file, or one static file per weight with `--weights 400,700` or `--static`), static 400 and 700 WOFF files for the social images, the `LICENSE` and a `SOURCE.txt`. It refuses a family that isn't OFL. Paste the `@font-face` rule it prints into `tokens.css`, outside `:root`.

4. Generate the metric-matched fallback face, so text shows at once in a local system font and barely moves when the web font arrives:

   ```sh
   node scripts/font-fallback.mjs <slug>
   ```

   Paste its `@font-face` rule into `tokens.css` too, and use the stack it prints in a font token, for example `--font-body: Overpass, "Overpass Fallback", Arial, sans-serif;`. Add `--fallback georgia` (or another system face) to pick the fallback yourself.

5. Preload the file used above the fold. In `src/lib/fonts.ts`, import it with `?url` and list it in `preloadFonts` (at most two files site-wide):

   ```ts
   import overpass from '../assets/fonts/overpass/overpass-latin-wght-normal.woff2?url'
   export const preloadFonts: string[] = [overpass]
   ```

6. Run `npm run build`. The site check enforces the family, file, size and preload limits, the license file and self-hosting.
7. Once the design settles on its fonts, uninstall the Fontsource packages. The committed files are what builds use.

Netlify serves everything under `/_astro/` (CSS, images and font files, all with content-hashed names) with a one-year immutable cache header (`netlify.toml`).

## Content

All copy lives in Markdown files under `src/content/`, separate from layout. The schemas in `src/content.config.ts` are enforced at build time, so a missing field or an over-long description fails the build with a message naming the file and field.

Write in the first person ("I"), never "we". The site check enforces this and the other copy rules above.

### Adding or editing a service

Services live in `src/content/services/<slug>.md`. The slug becomes the URL (`/services/<slug>/`). There must be exactly six services, and exactly one of them has `isEntryOffer: true`; the build fails otherwise.

```yaml
---
title: Integrations
order: 2 # position on the Services page
summary: One or two sentences for the Services page.
forWho: Who this is for.
included: [What is included, one item per entry]
notIncluded: [What is explicitly not offered]
relatedWork: [condies] # case study slugs, optional
isEntryOffer: false
seo:
  title: Integrations for small businesses # max 37 characters (the brand suffix is added)
  description: 70 to 160 characters, unique across the site.
---
Body copy in Markdown.
```

### Adding or editing a case study

Case studies live in `src/content/work/<slug>.md` (URL `/work/<slug>/`). Each needs at least one screenshot, stored in `src/assets/work/`. Every outcome must say where it comes from and when it was measured; an outcome without `source` or `measuredAt` fails the build.

```yaml
---
name: Condies
order: 2
description: One sentence on what the project is.
audience: Who it serves.
role: What I did.
client: Optional client name
liveUrl: https://condies.fyi/
screenshots:
  - image: ../../assets/work/condies-desktop.png
    alt: Describe what the screenshot shows.
    viewport: desktop # or mobile
screenshotsCapturedAt: 2026-11-11
outcomes:
  - claim: What happened, with a number.
    source: Where the number comes from.
    measuredAt: November 2026
seo:
  title: Condies snow forecast app
  description: 70 to 160 characters.
---
Body copy in Markdown.
```

### Pending owner input

When copy depends on something only the owner can answer, write safe copy that doesn't depend on it, and add the question as a `pending` marker. Markers are never rendered:

```yaml
pending:
  - question: Do you have usage numbers you're comfortable publishing?
```

Site-wide questions go in the `pending` list in `src/site.config.ts`. `npm run release-check` lists every marker and fails until none remain. Preview builds are unaffected.

### Employers are never named

No page, metadata or structured data may name the founder's employers or include details that identify them. Describe that experience as enterprise software engineering and earlier contract engineering on federal projects. The site check scans every built file for a private list of employer names and identifying terms.

This repository is public, so that list is never committed. The site check reads it from:

- the `SITE_CHECK_PRIVATE_TERMS` environment variable, a comma-separated list (set it in Netlify under Project configuration, Environment variables), or
- `site-check.private.json` in the project root for local builds. Git ignores this file: `{ "employerTerms": ["First term", "Second term"] }`

If neither is present, the build fails. Matches are reported as `[redacted]` with their file and line, so build logs never reveal the list.

## Contact form

The form on `/contact/` is plain HTML handled by Netlify Forms. Netlify detects it at deploy time ("form detection" must stay enabled), screens each submission with Akismet, and emails `tejen@elevationcode.works` for every submission it considers genuine. Replying to that email goes to the visitor.

Submissions Akismet flags as spam send **no email**. Check **Netlify → Forms → contact → Spam submissions** now and then, and mark real inquiries as verified. If real inquiries are flagged often, switch to the function-based handler described in the design (D11).
