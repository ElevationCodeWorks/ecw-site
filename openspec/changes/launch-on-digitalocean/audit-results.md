# Audit results

Each run uses `npm run audit`, the same method as the visual-identity change (`openspec/changes/archive/2026-11-18-visual-identity/audit-results.md`): Lighthouse (mobile) on every page, axe-core (WCAG 2.2 AA) at 1280×800 and 390×844 in both color schemes, and the keyboard, focus, 320px reflow, reduced-motion and no-JavaScript checks.

## Host-neutral indexing (task 2.4)

Run on 2026-11-18 on `launch-on-digitalocean`, after `SITE_ENV` replaced Netlify's `CONTEXT` and `URL` (tasks 2.1 to 2.3). The audit now builds with `SITE_ENV=production`, then rebuilds without it.

**Verdict: passed.** The results match the visual-identity change's final audit.

### Lighthouse (mobile)

Requirement: every category ≥ 95, LCP ≤ 2500 ms, CLS ≤ 0.1, TBT ≤ 200 ms.

| Page | Perf | A11y | Best practices | SEO | LCP (ms) | CLS | TBT (ms) |
|---|---|---|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 100 | 903 | 0 | 0 |
| `/404.html` | 100 | 100 | 100 | 63 (noindex, not asserted) | 751 | 0 | 0 |
| `/about/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/contact/` | 100 | 100 | 100 | 100 | 752 | 0 | 0 |
| `/contact/thanks/` | 100 | 100 | 100 | 63 (noindex, not asserted) | 751 | 0 | 0 |
| `/services/` | 100 | 100 | 100 | 100 | 752 | 0 | 0 |
| `/services/ai-features/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/services/care-and-rescue/` | 100 | 100 | 100 | 100 | 752 | 0 | 0 |
| `/services/custom-web-apps/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/services/integrations/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/services/tech-checkup/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/services/websites/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/work/` | 100 | 100 | 100 | 100 | 1501 | 0 | 0 |
| `/work/condies/` | 100 | 100 | 100 | 100 | 1501 | 0 | 0 |
| `/work/uphill-ski-co/` | 100 | 100 | 100 | 100 | 1577 | 0 | 0 |
| `/work/what-can-i-do/` | 100 | 100 | 100 | 100 | 901 | 0 | 0 |

SEO is 100 on every indexable page, so the `SITE_ENV=production` build carries no `noindex`. A page marked `noindex` scores 63, like the 404 and confirmation pages, which are `noindex` on purpose.

### Accessibility (axe-core, WCAG 2.2 AA)

No violations on any of the 16 pages, at either viewport, in either scheme (64 runs).

### Interaction checks

All 16 pages pass every check: keyboard and visible focus in the light and the dark scheme, 320px reflow, reduced motion, and no JavaScript.

After the run, `dist/` was rebuilt without `SITE_ENV`, and its pages carry `noindex, nofollow` again.
