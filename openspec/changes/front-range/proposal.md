# Proposal

## Why

The owner's design system (the "Elevation Code Works" design system artifact) moved from Plate to **Front Range** on 2026-11-24: the same catalog bones, repainted in pine ink on snow white, ruled in Red Rocks red, with a six-hue palette and flat vector textures. Its README records that the live site "has not been repainted" and still ships the ink-and-yellow palette with 1px ink rules and no textures. This change applies Front Range to the site so the two agree.

## What Changes

- **Colors.** Every color token takes its Front Range value in both schemes: pine ink text, a pine-black dark ground, granite secondary text, cooler hairlines and a raspberry error color. Six palette tokens are added: `--color-red-rocks`, `--color-flatiron`, `--color-sandstone`, `--color-ponderosa`, `--color-turquoise` and `--color-snow`. `--color-accent` becomes the Red Rocks red.
- **Rules.** `--rule-width` goes from 1px to 2px, so the header rule, the rule over each table and the rule beside a quote are Red Rocks red at 2px.
- **Links.** Link text stays ink; the underline is drawn in the accent red. The call to action keeps its underline in its own ink.
- **Textures.** A Strata band lies across the top of the footer on every page and replaces the footer's rule. A Strata seam, the same slabs as an 8px line, divides Home's work from its services. Both are inline SVG in token colors, hidden from assistive technology.
- **Work listings.** A listing shows its screenshot whole instead of cutting its sides to fit 16:10, the screenshot opens the case study as the name does, and the list is ruled as one table: one Red Rocks rule, then hairlines.
- **Home's closing section.** After the services, Home ends with a heading, a short paragraph on what happens next and the call to action, laid out on the page's split like the hero. The copy was drafted with the owner's go-ahead (2026-11-24) from facts already on the site.
- **Typographic apostrophes.** Front matter copy used straight apostrophes while Markdown bodies were converted to curly ones, so the two sat side by side on a page. All page copy now uses typographic apostrophes and quotation marks.
- **What Can I Do? screenshots.** Re-captured 1024 wide at twice the pixel density, clipped above the featured causes as before, so the listing's plate is fuller and the case study's image is sharper.
- **Site check.** Contrast pairs are added for the palette hues that draw graphics on the page. The orange category and its thresholds don't change: the sandstone reds pass them as measured, and a test now pins that.
- **Docs.** The README's Visual identity section describes Front Range.

**Out of scope:**
- The Terrace and Contour textures. Both were tried and left out (design D3).
- Typefaces, the symbol, the hero drawing and the layout. None of them change. Copy changes only as listed above.
- Re-capturing the structure baseline. `npm run check:structure` already differed from it on `main`; it now also shows these content changes.
- The social image template. It reads its colors from the tokens, so it repaints with them.
- Updating the design system artifact's "Not synced" note, which waits until this is live.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `visual-identity`: a new requirement covers the textures: flat vector patterns in palette token colors, decoration only.
- `site-content`: a new requirement covers Home's closing section.
- `brand-guardrails`: the "Banned colors" requirement gains two scenarios that say where the brand's sandstone reds stand against the orange, rust and terracotta ban.

## Impact

- **Styles:** `src/styles/tokens.css`, `src/styles/base.css`, `src/components/CallToAction.astro`, `src/components/SiteFooter.astro`, `src/components/WorkPreview.astro`, `src/pages/index.astro`, and comments in the header, hero and page styles.
- **New component:** `src/components/textures/StrataBand.astro`, in two sizes.
- **Check:** `site-check.config.ts` (contrast pairs), `integrations/site-check/rules/brand-color.test.ts`.
- **Generated at build:** the favicon, touch icon, scalable icon and every social image take the new ink.
- **Content:** every file under `src/content/` (apostrophes), `src/content/pages/home.md` (closing), `src/content/work/what-can-i-do.md` (alt text, capture date), `src/content.config.ts`, `scripts/capture-screenshots.mjs`, both What Can I Do? screenshots.
- **Owner inputs:** the closing section's wording is a draft for the owner to edit.
