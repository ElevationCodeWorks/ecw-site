# Audit results

Run on 2026-11-11 with `npm run audit` (design D13), against commit-ready code on the `astro-site-foundation` branch.

**Verdict: passed.** Every page meets the site-platform performance and accessibility requirements.

## How it was run

- **Build:** production mode (`CONTEXT=production`, `URL=https://elevationcode.works`). That is the artifact that will ship. Preview builds are `noindex` by design, and Lighthouse scores that down in its SEO category.
- **Server:** `dist/` served locally by `scripts/lib/static-server.mjs`, which mimics Netlify: directory index, a 404 page with status 404, and gzip.
- **Lighthouse:** `@lhci/cli` 0.16.0 with default mobile emulation (mid-range phone, simulated slow 4G), one run per page. Thresholds are in `lighthouserc.cjs`.
- **Accessibility:** axe-core 4.14.0, run in Chrome with the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22a` and `wcag22aa` tags, at 1280×800 and 390×844.
- **Interaction checks (task 9.2):** automated in Chrome for every page.
  - Keyboard: Tab through every focusable element, check that the first stop is the skip link and that Enter on it moves focus to `main`.
  - Visible focus: every focused element has a visible outline.
  - 320px reflow: no horizontal scrolling at 320 CSS pixels.
  - Reduced motion: no running animations with `prefers-reduced-motion: reduce`.
  - No JavaScript: the page renders its H1, primary navigation and main content with JavaScript disabled.
- **Restore:** afterwards the script rebuilds `dist/` in preview mode, so `_headers` sends `noindex` again.

## Lighthouse (mobile)

Requirement: every category ≥ 95, LCP ≤ 2500 ms, CLS ≤ 0.1, TBT ≤ 200 ms.

| Page | Perf | A11y | Best practices | SEO | LCP (ms) | CLS | TBT (ms) |
|---|---|---|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 100 | 601 | 0 | 6 |
| `/404.html` | 100 | 100 | 100 | 63 (noindex, not asserted) | 601 | 0 | 0 |
| `/about/` | 100 | 100 | 100 | 100 | 901 | 0 | 0 |
| `/contact/` | 100 | 100 | 100 | 100 | 601 | 0 | 13 |
| `/contact/thanks/` | 100 | 100 | 100 | 63 (noindex, not asserted) | 601 | 0 | 0 |
| `/services/` | 100 | 100 | 100 | 100 | 601 | 0 | 0 |
| `/services/ai-features/` | 100 | 100 | 100 | 100 | 602 | 0 | 0 |
| `/services/care-and-rescue/` | 100 | 100 | 100 | 100 | 602 | 0 | 37 |
| `/services/custom-web-apps/` | 100 | 100 | 100 | 100 | 601 | 0 | 0 |
| `/services/integrations/` | 100 | 100 | 100 | 100 | 601 | 0 | 1 |
| `/services/tech-checkup/` | 100 | 100 | 100 | 100 | 601 | 0 | 0 |
| `/services/websites/` | 100 | 100 | 100 | 100 | 601 | 0 | 0 |
| `/work/` | 100 | 100 | 100 | 100 | 901 | 0 | 0 |
| `/work/condies/` | 100 | 100 | 100 | 100 | 751 | 0 | 0 |
| `/work/uphill-ski-co/` | 100 | 100 | 100 | 100 | 901 | 0 | 8 |
| `/work/what-can-i-do/` | 100 | 100 | 100 | 100 | 901 | 0 | 13 |

The 404 and contact confirmation pages carry `noindex` on purpose. Lighthouse's SEO category penalizes that, so SEO is asserted only on the 14 sitemap pages, which all score 100.

## Accessibility (axe-core, WCAG 2.2 AA)

No violations on any of the 16 pages, at either viewport (32 runs).

## Interaction checks

| Page | Keyboard and skip link | Visible focus | 320px reflow | Reduced motion | No JavaScript |
|---|---|---|---|---|---|
| `/` | Pass (18/18) | Pass | Pass | Pass | Pass |
| `/about/` | Pass (8/8) | Pass | Pass | Pass | Pass |
| `/contact/` | Pass (14/14) | Pass | Pass | Pass | Pass |
| `/services/` | Pass (14/14) | Pass | Pass | Pass | Pass |
| `/services/ai-features/` | Pass (8/8) | Pass | Pass | Pass | Pass |
| `/services/care-and-rescue/` | Pass (8/8) | Pass | Pass | Pass | Pass |
| `/services/custom-web-apps/` | Pass (10/10) | Pass | Pass | Pass | Pass |
| `/services/integrations/` | Pass (8/8) | Pass | Pass | Pass | Pass |
| `/services/tech-checkup/` | Pass (8/8) | Pass | Pass | Pass | Pass |
| `/services/websites/` | Pass (9/9) | Pass | Pass | Pass | Pass |
| `/work/` | Pass (11/11) | Pass | Pass | Pass | Pass |
| `/work/condies/` | Pass (9/9) | Pass | Pass | Pass | Pass |
| `/work/uphill-ski-co/` | Pass (9/9) | Pass | Pass | Pass | Pass |
| `/work/what-can-i-do/` | Pass (9/9) | Pass | Pass | Pass | Pass |
| `/contact/thanks/` | Pass (8/8) | Pass | Pass | Pass | Pass |
| `/404.html` | Pass (11/11) | Pass | Pass | Pass | Pass |

## Problems the audit found and fixed

- **About page at 320px.** The founder photo's `max-width: 20rem` overrode `max-width: 100%`, so the photo overflowed at 320px. Changed to `min(20rem, 100%)`.
- **Case-study cards on Home and Work.** Cards stretched to the tallest sibling, and the grid spread the extra height into the image row, so titles were misaligned by 11px. Fixed with `align-content: start`.
- **Audit script bugs, fixed before the results above.** Lighthouse was launched with a blocking call, which stalled the in-process server. The keyboard check also counted two identical links as one element.

## Still to verify on Netlify (task 8.2)

These depend on the host, so they can only be checked on the branch deploy:
- The `X-Robots-Tag` header.
- The 301 for `/about.html`.
- The real 404 status.
- Netlify Forms delivery.

## Netlify checks (task 8.2)

Run on 2026-11-11 against the deploy preview for pull request 1 (`https://deploy-preview-1--elevationcodeworks.netlify.app`). Netlify builds deploy previews for pull requests, so this stands in for a branch deploy: both are unmetered, and both are non-production builds.

| Check | Result |
|---|---|
| `X-Robots-Tag` on pages | `noindex, nofollow` (from our `_headers`), plus Netlify's own `noindex` for previews |
| `robots.txt` | `Disallow: /` for all user agents |
| Canonical links | Point to `https://elevationcode.works/...` |
| `/about.html` | 301 to `/about/` |
| `/servcies/` | 404 with the not-found page, `noindex`, links to Home, Services, Work and Contact |
| Sitemap | Lists exactly the 14 indexable pages |
| Production at `elevationcodeworks.netlify.app` | 404: nothing published, so no production credits spent |

**Open item:** the deployed contact form still carries `data-netlify="true"`. Netlify removes that attribute when it detects a form, so form detection was not on for this deploy. It must be enabled and the preview redeployed before task 8.3.

## Netlify setup and contact form (tasks 8.1 and 8.3)

Run on 2026-11-12 against the deploy preview.

**Setup (task 8.1):**
- The Netlify project `elevationcodeworks` is connected to `ElevationCodeWorks/ecw-site`.
- Nothing has been published to production: `elevationcodeworks.netlify.app` returns 404.
- Previews build for pull requests (PR #1). Branch deploys did not trigger, so the deploy preview stands in for them.
- Form detection is on. Netlify strips `data-netlify` from the deployed form, which it does only for a detected form.
- The email notification goes to `tejen@elevationcode.works`, and the owner confirmed the address.
- `SITE_CHECK_PRIVATE_TERMS` is set in Netlify. Builds fail without it, and the preview built successfully.

**Form checks (task 8.3):**

| Check | Result |
|---|---|
| Submission with JavaScript disabled | Lands on `/contact/thanks/` with the 48-hour reply message |
| Hidden spam field filled (raw POST) | Discarded: the owner saw no notification and no entry, not even under Spam |
| Netlify recognizes the form | A POST to `contact` returns 200; an unknown form name returns 404 |
| Notification email | Arrived in the owner's inbox for a realistic submission |

**Finding:** the first test submissions were flagged as spam by Netlify's filter (Akismet) and sent no notification. They came from headless Chrome, whose user agent says "HeadlessChrome", and the message text read as a test. A submission with a normal browser user agent and realistic text went through. Spam-flagged messages never notify, so the owner should check **Forms → contact → Spam submissions** now and then (see README). The function-based fallback in design D11 remains available if real inquiries get flagged.

The subject line ("Website inquiry: Elevation Code Works") and the Reply-To (the submitter's `email` field) come from the form markup and Netlify's documented behavior. The owner confirmed the notification arrived, but did not separately report those two fields.
