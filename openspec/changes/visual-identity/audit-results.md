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
