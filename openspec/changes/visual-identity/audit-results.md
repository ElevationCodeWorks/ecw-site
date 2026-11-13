# Audit results

Each run is recorded here with `npm run audit` (design D12). The method is the same as Change 1's audit (`openspec/changes/archive/2026-11-12-astro-site-foundation/audit-results.md`), plus a dark-scheme pass:

- **axe-core** 4.14.0, WCAG 2.0/2.1/2.2 A and AA tags, at 1280×800 and 390×844, once with `colorScheme: 'light'` and once with `colorScheme: 'dark'`.
- **Keyboard and visible focus** (Tab through every focusable element, skip link first, Enter on it focuses `main`, every focused element has a visible outline), once per color scheme.
- **Lighthouse** (`@lhci/cli` 0.16.0, mobile emulation) stays light-only. The scheme doesn't change load performance, and Lighthouse CI can't emulate `prefers-color-scheme`.
- 320px reflow, reduced motion and no-JavaScript checks run once. They don't depend on the scheme.

## Phase A, placeholder look (task 2.6)

Run on 2026-11-12 on the `visual-identity` branch, after the dark-scheme tokens (task 2.2). The dark scheme is the plain inverted neutral placeholder.

**Verdict: passed.**

### Lighthouse (mobile)

Requirement: every category ≥ 95, LCP ≤ 2500 ms, CLS ≤ 0.1, TBT ≤ 200 ms.

| Page | Perf | A11y | Best practices | SEO | LCP (ms) | CLS | TBT (ms) |
|---|---|---|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/404.html` | 100 | 100 | 100 | 63 (noindex, not asserted) | 751 | 0 | 0 |
| `/about/` | 100 | 100 | 100 | 100 | 1051 | 0 | 0 |
| `/contact/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/contact/thanks/` | 100 | 100 | 100 | 63 (noindex, not asserted) | 751 | 0 | 0 |
| `/services/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/services/ai-features/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/services/care-and-rescue/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/services/custom-web-apps/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/services/integrations/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/services/tech-checkup/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/services/websites/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/work/` | 100 | 100 | 100 | 100 | 1051 | 0 | 0 |
| `/work/condies/` | 100 | 100 | 100 | 100 | 976 | 0 | 0 |
| `/work/uphill-ski-co/` | 100 | 100 | 100 | 100 | 1051 | 0 | 0 |
| `/work/what-can-i-do/` | 100 | 100 | 100 | 100 | 901 | 0 | 0 |

### Accessibility (axe-core, WCAG 2.2 AA)

No violations on any of the 16 pages, at either viewport, in either scheme (64 runs).

### Interaction checks

Every page passes every check: keyboard and visible focus in the light scheme and in the dark scheme, 320px reflow, reduced motion, and no JavaScript.

| Page | Keyboard, light | Keyboard, dark | 320px reflow | Reduced motion | No JavaScript |
|---|---|---|---|---|---|
| `/` | Pass | Pass | Pass | Pass | Pass |
| `/about/` | Pass | Pass | Pass | Pass | Pass |
| `/contact/` | Pass | Pass | Pass | Pass | Pass |
| `/contact/thanks/` | Pass | Pass | Pass | Pass | Pass |
| `/services/` | Pass | Pass | Pass | Pass | Pass |
| `/services/ai-features/` | Pass | Pass | Pass | Pass | Pass |
| `/services/care-and-rescue/` | Pass | Pass | Pass | Pass | Pass |
| `/services/custom-web-apps/` | Pass | Pass | Pass | Pass | Pass |
| `/services/integrations/` | Pass | Pass | Pass | Pass | Pass |
| `/services/tech-checkup/` | Pass | Pass | Pass | Pass | Pass |
| `/services/websites/` | Pass | Pass | Pass | Pass | Pass |
| `/work/` | Pass | Pass | Pass | Pass | Pass |
| `/work/condies/` | Pass | Pass | Pass | Pass | Pass |
| `/work/uphill-ski-co/` | Pass | Pass | Pass | Pass | Pass |
| `/work/what-can-i-do/` | Pass | Pass | Pass | Pass | Pass |
| `/404.html` | Pass | Pass | Pass | Pass | Pass |

## Font loading check, Overpass on a scratch branch (task 4.1)

Run on 2026-11-12 on a throwaway local branch, `scratch/fonts-overpass`, which was then deleted. Overpass was added by following the README's "Typefaces" steps exactly (task 4.3): `@fontsource/overpass` and `@fontsource-variable/overpass` 5.3.0, `scripts/fonts.mjs overpass`, `scripts/font-fallback.mjs overpass` (Arial fallback), and one preload in `src/lib/fonts.ts`. Following the steps found one bug, which was fixed on `visual-identity` (`@capsizecss/unpack` 4 moved `fromFile` to its `/fs` entry point).

**Verdict: passed.**

- **Build:** the site check passed with the font rules active: one family, one served file (the 39 KB variable Latin WOFF2), the license beside it.
- **Same file for preload and @font-face:** both resolve to `/_astro/overpass-latin-wght-normal.qAR8M_co.woff2`, so only one font file is built. The `Overpass Fallback` face (`local(Arial)` with size-adjust and ascent, descent and line-gap overrides) is in the built CSS.
- **Own origin only:** in Chrome, all 4 font requests across Home, Services, a case study and Contact went to the site's own origin.
- **Text before the font:** with the font response held back, the Home H1 was laid out (112 px tall at 390 px wide) in `Overpass Fallback` while `Overpass` was still loading. When the font arrived, none of the first six text elements moved, and the measured layout shift was 0.
- **Lighthouse** 13.6 (mobile, simulated slow 4G: 150 ms round trip, 1.6 Mbps): CLS 0 on all 16 pages, the font-display insight passes, performance 100 everywhere, and LCP between 751 and 1351 ms.
- **The rest of the audit passed too:** axe found no violations in either scheme (64 runs), and every interaction check passed.
