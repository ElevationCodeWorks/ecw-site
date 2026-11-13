# Proposal

## Why

Change 1 (`astro-site-foundation`) shipped the site with a deliberately unbranded placeholder look: white, `system-ui`, one stock blue. The site now needs an identity that is clearly Elevation Code Works' own. The owner's hard constraint is that it must not read as AI-generated or as Claude's house style.

A look like that can't be specified up front. It has to be found in design rounds the owner can click through on a phone, with every round held to the same line. Some AI-look patterns only become possible once a real look exists: italic accent words, eyebrow labels, gradient glows, entrance animations, the current favorite "designer" fonts. The guardrails have to grow before the first comp is built.

## What Changes

- **Comp rounds on the real site.** Each direction is a branch of the actual site with its own tokens and component styles. A draft pull request gives each one a Netlify deploy preview, and a screenshot sheet compares them side by side at desktop and phone sizes, in light and dark.
  - **Round 1:** three distinct directions, each grounded in named source material that is not one of the portfolio sites.
  - **Round 2:** two variants of the chosen direction, plus logo symbol options.
  - **Round 3:** the final identity, applied to every page.
  - A comp reaches the owner only after it passes the site check and the written look checklist. Each round's verdict is recorded.
- **The identity itself:**
  - A palette with light and dark schemes. Dark follows the visitor's system setting, with no toggle, since a toggle would need JavaScript.
  - At most two typeface families, open-licensed (owner decision 2026-11-12: free fonts only) and self-hosted.
  - A text wordmark, a drawn logo symbol, and a favicon set.
  - Restyled layout components: header, footer, Home hero, calls to action, work previews, service list, service and case study templates, and the contact form.
- **Per-page social images:** generated at build time from each page's title and the design tokens. They replace the single default image.
- **Stronger guardrails** (the site check):
  - More banned typefaces by name, including the current AI-site favorites and the portfolio sites' own fonts.
  - A banned violet and purple category, plus the default AI dark navy.
  - Bans on styled accent words in headings, tracked uppercase eyebrow labels, gradient, glow and blur backgrounds, keyframe and scroll-reveal animation, and clichéd logo motifs.
  - Contrast checked in both color schemes.
  - The portfolio sites' colors added to the banned references.
- **Audits** run the accessibility checks in both color schemes.

**Out of scope:**
- **Launch:** cutover to `elevationcode.works`, analytics and Search Console.
- **New copy or pages:** copy stays as Change 1 wrote it.
- **New photography or commissioned illustration.** Stock photos and AI-generated images are never used.
- **Paid typefaces and a manual light/dark toggle.**
- **Trail-rating marks:** dropped by the owner on 2026-11-12. A fixed size per service could set the wrong expectations, since a project's scope depends on the client.

## Capabilities

### New Capabilities
- `visual-identity`: the look the site presents. Covers color schemes and contrast, typefaces and how they load, the wordmark and logo symbol, site icons, and which imagery is allowed.

### Modified Capabilities

These capabilities are defined by Change 1, which must be archived before this change so its specs exist in `openspec/specs/`.

- `brand-guardrails`:
  - The banned typeface list grows.
  - Banned colors gains a violet category and also covers dark-scheme tokens and icon files.
  - New rules cover heading accents, eyebrow labels, decorative backgrounds, animation and logo motifs.
  - A recorded look review is required before each comp is shown.
- `site-platform`:
  - The tokens layer also holds dark-scheme values and font faces.
  - Generated images and icons take their colors from the tokens.
  - The accessibility audit runs in both color schemes.
- `seo`: social previews use a per-page image instead of one shared image.

## Impact

- **Code:**
  - `src/styles/tokens.css`, `src/styles/base.css`, every component, and the style blocks in page templates.
  - The `BaseLayout` head: font preloads, the `color-scheme` meta tag, icon links and the per-page social image.
  - New site-check rules and config, and the audit script, which gains a dark-scheme pass.
  - New build-time endpoints for social images and icons. `scripts/make-og.mjs` and `public/og/default.png` are removed.
- **Dependencies:** `satori` for social image layout, rasterized with the `sharp` that Astro already installs. Capsize packages compute fallback font metrics. Font files and their OFL licenses are committed.
- **Netlify:**
  - One draft pull request against `main` per comp. Deploy previews aren't metered, and draft pull requests can't be merged.
  - Losing comp branches are deleted after each round.
  - No production deploys.
- **Public repository:** comps, screenshots and the rounds record are public. They name no employer.
- **Owner inputs:**
  - Approval of the round 1 source material before comps are built.
  - A verdict each round.
- **Performance:** web fonts add bytes, so a font budget keeps every page within the Change 1 Lighthouse and Core Web Vitals thresholds.
