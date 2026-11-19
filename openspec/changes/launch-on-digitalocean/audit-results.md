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

## Launch (tasks 4.1 and 4.2)

- **4.1, merge:** PR #14 merged to `main` at `a7eb13d` on 2026-11-19. The app's deployment history (`doctl apps list-deployments`) shows the merge started **no** build: the exported spec had no `deploy_on_push`, so the old app never deployed on push. The earlier failed build (02:30 UTC, deployment `46a52cb0`) was started manually, after PR #1. The old site stayed live throughout.
- **4.2, applying the spec:** the owner applied `.do/app.yaml` with the secret at 03:22 UTC. That deployment (`da672c66`) built `56b12fd`, the PR #1 merge, because applying a spec redeploys the last commit the app fetched, not the latest `main`. Its log shows `engines.node >=24` and the removed `indexing-headers` integration, so the old Netlify-only indexing code ran: the site went live at 03:23 with `noindex` on every page and a disallow-all `robots.txt`. `SITE_ENV` was in the build's variables; the old code just didn't read it.
- **Fix:** the owner ran Actions, Force rebuild and deploy at 03:37 UTC. Deployment `6005d007` built `a7eb13d` on Node 26.12.1 (`engines.node 26.x`), the site check passed, and it went live at 03:39 UTC. The site was marked `noindex` for about 16 minutes.
- `deploy_on_push: true` is now set, so later merges to `main` deploy on their own.

## Live checks (task 4.3)

Run on 2026-11-19 at about 03:45 UTC against `https://elevationcode.works`, deployment `6005d007` (`a7eb13d`).

| Check | Result |
| --- | --- |
| Every sitemap page (14) | 200, no robots meta tag, no `X-Robots-Tag` header |
| `/robots.txt` | `User-agent: *`, `Allow: /`, and `Sitemap: https://elevationcode.works/sitemap-index.xml` |
| `/servcies` | 404 with the not-found page (title "Page not found", `noindex`, links to Home, Services, Work and Contact) |
| `/about.html` | 301 to `https://elevationcode.works/about/` |
| Starter address `king-prawn-app-ckqj3.ondigitalocean.app` | 301 to `https://elevationcode.works/`; `/services/websites/` redirects to the same path, so **the path is kept** |
| `/favicon.ico`, `/icon.svg`, `/apple-touch-icon.png` | 200, `image/vnd.microsoft.icon`, `image/svg+xml`, `image/png` |
| `og:image` of `/services/websites/` | `https://elevationcode.works/og/services/websites.png`, 200, `image/png` |
| Browser cache | `cache-control: public,max-age=10,s-maxage=86400`, DigitalOcean's fixed static-site policy |

## Contact form on DigitalOcean (task 4.4)

A POST to `/contact/thanks/` with the form's fields, as a browser sends it, returns **HTTP 400** with an XML body from the platform: `<Error><Code>InvalidRequest</Code><Message>Couldn't route the request.</Message>…</Error>`. A visitor who submits the form sees that raw error instead of the thanks page, and nothing is delivered. The Contact page shows the email address as plain text beside the form. The Web3Forms change replaces the form's target.

## Live performance (task 4.5)

PageSpeed Insights' keyless API had used up its shared daily quota, so the same lab test ran with the project's Lighthouse 13.6.0 (mobile emulation, simulated slow 4G) against the live URLs on 2026-11-19.

| Page | Perf | A11y | Best practices | SEO | LCP (ms) | CLS | TBT (ms) |
|---|---|---|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 100 | 812 | 0 | 0 |
| `/services/websites/` | 100 | 100 | 100 | 100 | 782 | 0 | 12 |
| `/work/condies/` | 100 | 100 | 100 | 100 | 1240 | 0 | 0 |
| `/contact/` | 100 | 100 | 100 | 100 | 757 | 0 | 41 |

Every category is at least 95. Lighthouse's cache insight flags the 10-second browser cache, as design D8's trade-off expected, without lowering any score.
