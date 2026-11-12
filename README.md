# Elevation Code Works website

The marketing site for Elevation Code Works, a Denver software engineering business for small businesses. It is a fully static [Astro](https://astro.build) site hosted on Netlify. There is no server code: every page is prerendered HTML, and the contact form is handled by Netlify Forms.

Planning lives in [`openspec/`](openspec/). The current change is `openspec/changes/astro-site-foundation/`.

## Setup

Requirements: Node 26 (see `.nvmrc`; Node 24 also works) and npm.

```sh
nvm use        # or install Node 26 another way
npm install
```

## Scripts

| Command                 | What it does                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`           | Starts the dev server at http://localhost:4321 with live reload.                                                       |
| `npm run build`         | Type-checks with `astro check`, builds the static site into `dist/`, then runs the site check. Any violation fails it. |
| `npm run preview`       | Serves the built `dist/` at http://localhost:4321. Run `npm run build` first.                                          |
| `npm run check:site`    | Runs the site check against the existing `dist/` without rebuilding.                                                   |
| `npm run release-check` | Lists every question the owner still needs to answer (`pending` markers). Exits 1 while any remain. Run before launch. |
| `npm test`              | Runs the unit tests (`*.test.ts`) with Node's built-in test runner.                                                    |
| `npm run fmt`           | Formats the project with Prettier.                                                                                     |
| `npm run fmt:check`     | Checks formatting without changing files.                                                                              |

## Project layout

```
astro.config.mjs              Astro config: canonical origin, URL shape, sitemap, integrations
src/site.config.ts            Site-wide settings (canonical origin, brand, contact details)
src/styles/tokens.css         Every color and font value (design tokens)
src/styles/base.css           Reset and element defaults, tokens only
src/layouts/BaseLayout.astro  Page shell: head metadata, skip link, header, footer
src/pages/                    One file per route
src/content/                  Page copy: services/, work/ (case studies), pages/
src/content.config.ts         Content schemas, enforced at build time
integrations/                 Build-time integrations (indexing headers, site check)
scripts/                      One-off tools (release check, screenshots, social image)
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

| Rule                                                                                                    | What it enforces                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `brand/banned-word`                                                                                     | No marketing words like "elevate", "unlock", "seamless". The exact name "Elevation Code Works" is allowed.                                                |
| `brand/banned-phrase`                                                                                   | No "not just", "In today's fast-paced" or "Whether you're".                                                                                               |
| `brand/generic-cta`                                                                                     | No button or link whose whole text is "Get Started" or "Learn More".                                                                                      |
| `brand/em-dash`                                                                                         | No em dashes in headings, buttons, links or the brand line.                                                                                               |
| `brand/emoji`                                                                                           | No emoji in headings, navigation, buttons or list markers.                                                                                                |
| `brand/trailing-arrow`                                                                                  | Link text may not end with an arrow.                                                                                                                      |
| `brand/numbered-label`                                                                                  | No "01 / Services" labels outside an ordered list.                                                                                                        |
| `brand/first-person-plural`                                                                             | Copy says "I", never "we", "our" or "us" (quotes excepted).                                                                                               |
| `brand/employer-term`                                                                                   | No employer names or identifying terms anywhere in the build, including metadata and JSON-LD.                                                             |
| `brand/banned-font`                                                                                     | No banned typefaces in stylesheets, tokens or web-font links.                                                                                             |
| `brand/monospace`                                                                                       | Monospace only on `code`, `kbd`, `samp` and `pre`.                                                                                                        |
| `brand/gradient-text`, `brand/backdrop-blur`, `brand/noise`, `brand/custom-cursor`, `brand/pill-radius` | No gradient text, frosted glass, grain/noise, custom cursors, or pill and circle radii.                                                                   |
| `brand/banned-color`, `brand/warm-off-white`, `brand/orange-accent`                                     | Color tokens may not match Anthropic's palette, Claude's cream and rust, AI indigo, warm off-white backgrounds or orange accents.                         |
| `platform/raw-value`                                                                                    | No color or font literals outside `src/styles/tokens.css`.                                                                                                |
| `platform/client-script`                                                                                | No client JavaScript in built pages. Only JSON-LD scripts are allowed.                                                                                    |
| `seo/title`, `seo/description`                                                                          | Every sitemap page has one unique title (60 characters max, ending "Elevation Code Works" except Home) and one unique description (70 to 160 characters). |
| `seo/headings`                                                                                          | Exactly one H1 per page, and heading levels never skip.                                                                                                   |
| `seo/canonical`                                                                                         | Every sitemap page has one canonical link to itself on `https://elevationcode.works`.                                                                     |
| `seo/internal-link`                                                                                     | Internal links end in `/` unless they point to a file.                                                                                                    |
| `seo/noindex-headers`                                                                                   | Non-production builds have a `_headers` file that sends `noindex`.                                                                                        |
| `seo/social`                                                                                            | Every sitemap page has the Open Graph and Twitter tags, with `og:site_name` set to the brand name and a large-image card.                                 |

### Changing what is banned

Banned words, phrases, typefaces, reference colors and thresholds live in `site-check.config.ts`. To ban a new pattern everywhere, add it there rather than writing exceptions.

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

An entry with an empty reason fails the check, and so does an entry that no longer matches any violation, so stale waivers get cleaned up.

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

No page, metadata or structured data may name the founder's employers or include details that identify them. Describe that experience as enterprise software engineering and earlier contract engineering on federal projects. The site check scans every built file for the terms listed under `employerTerms` in `site-check.config.ts`.
