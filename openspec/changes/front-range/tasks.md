# Tasks

## 1. Tokens and rules (design D1)

- [x] 1.1 Set every color token in `src/styles/tokens.css` to its Front Range value in both schemes, add the six palette tokens, alias `--color-accent` to `--color-red-rocks`, and set `--rule-width` to 2px. Verified: each value matches the design system's `tokens.json`; `npm run build` passes the site check
- [x] 1.2 Draw link underlines in the accent (`src/styles/base.css`), keep the call to action's underline in its own ink and give it the token radius (`src/components/CallToAction.astro`), and set the accent on the navigation, 404 and thanks-page underlines (design D5). Verified in screenshots, light and dark

## 2. Textures (design D2, D3)

- [x] 2.1 Add `src/components/textures/StrataBand.astro` and lay it across the top of the footer in place of the footer's rule
- [x] 2.2 Add a divider on Home between the work and the services. First the Terrace band; replaced, after the owner's review, with a Strata seam (`size="seam"`), chosen from five prototypes compared in both schemes (design D3)
- [x] 2.3 Try Contour behind the hero drawing; left out (design D3)

## 2b. Work listings (design D6)

- [x] 2b.1 Show each listing's screenshot whole, lay the name's link over it, and rule the list as one table. Verified: the link's box matches the image to the pixel at 1440 and 390 wide on Home and Work, the description text is still selectable, and focus shows on the name

## 2c. Content polish (design D7, D8, D9)

- [x] 2c.1 Add Home's closing section: `closing` in the pages schema and `home.md`, rendered on the split in `src/pages/index.astro`
- [x] 2c.2 Replace straight apostrophes and quotation marks in page copy with typographic ones, in `src/content/` and the service and thanks page templates. Verified: no straight apostrophe is left under `src/content/`
- [x] 2c.3 Re-capture the What Can I Do? screenshots (`node scripts/capture-screenshots.mjs what-can-i-do`), update the alt text and the capture date. Verified: neither capture shows a featured cause

## 3. Site check (design D4)

- [x] 3.1 Add the four palette contrast pairs to `site-check.config.ts`
- [x] 3.2 Add a test that the sandstone reds pass the orange and reference rules and that two terracottas fail. Verified: `npm test` passes, 178 tests

## 4. Docs and verification

- [x] 4.1 Rewrite the README's Visual identity section for Front Range: both color tables and a Textures section
- [x] 4.2 Verify: `npm test`, `npm run build`, `npm run fmt:check` and `openspec validate front-range --strict` pass; `npm run audit` passes (Lighthouse 100 for performance, accessibility and best practices on all 16 pages; axe finds no violations on 64 page, viewport and scheme combinations)
- [x] 4.3 Run `npm run check:structure`. It reports the same differences on this branch as on `main`, all from the 2026-11-19 removal of the email address, which the archived baseline predates. This change adds none
- [ ] 4.4 Owner reviews the look locally (`npm run build`, `npm run preview`), in light and dark, and edits or approves the closing section's wording

## Workflow follow-up

- Commit, open a pull request and merge. Merging to `main` deploys to the live site.
- Design system synced on 2026-11-24 (its version 10): the Strata seam, whole clickable screenshots, the Closing component, the navigation underline color, typographic apostrophes in sample copy and the new What Can I Do? captures. Terrace and Contour stay in it, marked as not used on the site. Once the site is live, drop its "Not synced" note that says the site hasn't been repainted.
- Re-capture the structure baseline, or retire the check, so `npm run check:structure` is empty again.
- Archive this change.
