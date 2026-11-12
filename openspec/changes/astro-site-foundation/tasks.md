# Tasks

## 1. Branch and preserve existing work

- [x] 1.1 Delete the uncommitted Remix work (the owner approved deletion on 2026-11-11):
  - Remove the untracked Remix files: `app/`, `public/`, `css/contact.css`, `.eslintrc.cjs`, `postcss.config.js`, `tailwind.config.ts`, `tsconfig.json`, `vite.config.ts` and `README.md`, plus the ignored `build/` and `node_modules/`.
  - Unstage and delete `css/styles.css`. Restore `.gitignore`, `package.json`, `package-lock.json`, `index.html` and `about.html` to `HEAD`.
  - Delete the local `remix` branch, which has no commits of its own.
  - Keep `openspec/`, `.claude/` and `.idea/`.

  Verify that `git status` lists only `openspec/`, `.claude/` and `.idea/` as untracked, `git diff HEAD` is empty, and `openspec validate astro-site-foundation --strict` still passes
- [x] 1.2 Create `astro-site-foundation` from `main`. Bring `openspec/` and `.claude/` onto it, add `.idea/` to `.gitignore`, and commit. Verify that `git status` is clean and `openspec validate astro-site-foundation --strict` passes on the branch

## 2. Astro scaffold

- [x] 2.1 Set up the project files:
  - Replace `package.json` dependencies and scripts per design D12: `astro`, `@astrojs/sitemap`, `@astrojs/check`, `typescript`, `prettier`, `prettier-plugin-astro`, `culori`, `schema-dts`, `@lhci/cli`, `pa11y-ci`.
  - Add `.nvmrc` (26).
  - Point `tsconfig.json` at `astro/tsconfigs/strict`.
  - Delete the old static `index.html` and `about.html`. The Astro pages replace them.

  Verify that `npm install` succeeds, a stub `src/pages/index.astro` builds to `dist/index.html`, and `git grep -il remix -- . ':!openspec'` returns nothing
- [x] 2.2 Configure `astro.config.mjs`:
  - `site` from `PRODUCTION_ORIGIN`
  - `trailingSlash: 'always'`
  - `build.format: 'directory'`
  - `@astrojs/sitemap` with a filter that excludes the 404 and `/contact/thanks/`

  Verify that a build of two stub pages emits `dist/about/index.html` and a sitemap that lists only the stubs
- [x] 2.3 Add a Prettier config with `prettier-plugin-astro`, keeping the existing style (no semicolons, single quotes, no trailing commas). Verify that `npx prettier --check .` passes
- [x] 2.4 Rewrite `README.md` to cover setup, the Node version, and each npm script. Verify that every command in it runs as written

## 3. Layout, tokens and indexing controls

- [x] 3.1 Create `src/styles/tokens.css` and `src/styles/base.css` with the placeholder look from D6:
  - A white background and near-black text
  - A single blue for links and focus
  - The `system-ui` font stack
  - A 2px radius and no shadows
  - A reduced-motion rule

  Verify that changing the link-color token and rebuilding changes link color on every stub page with no other edits
- [x] 3.2 Build `BaseLayout`:
  - Head props for the title, description, canonical, Open Graph/Twitter tags, robots meta and a JSON-LD slot
  - A skip link as the first focusable element
  - A header nav with `aria-current` on the current page
  - A `main` landmark
  - A footer with the business name, "Denver, Colorado", the brand line and a Contact link

  Verify on the stub pages that the skip link is the first tab stop and `aria-current="page"` is set
- [x] 3.3 Implement `src/lib/env.ts`, the indexable rule from D3, with `node --test` unit tests for four cases:
  - Production context on the production host: indexable
  - Production context on `*.netlify.app`: not indexable
  - Branch deploy: not indexable
  - No Netlify variables: not indexable

  Verify that the tests pass
- [x] 3.4 Add the prerendered `robots.txt` endpoint, the `astro:build:done` hook that writes `dist/_headers`, and the noindex meta tag in `BaseLayout`, all driven by `env.ts`. Verify:
  - A local build emits a disallow-all `robots.txt`, a `_headers` file with `X-Robots-Tag: noindex, nofollow` for `/*`, and the meta tag.
  - A build run with `CONTEXT=production URL=https://elevationcode.works` emits an allow-all `robots.txt` with a `Sitemap:` line and no `_headers` noindex.

## 4. Site check (built before the content, so the content is written against it)

- [x] 4.1 Create the `integrations/site-check/` skeleton:
  - A rule runner and a reporter that prints file:line, the rule and the matched text.
  - It runs in `astro:build:done` and through `npm run check:site`.
  - Exceptions are read from `site-check.exceptions.json`.

  Add `node --test` fixture tests for four cases: a violation fails, clean input passes, an exception with no reason fails, and a stale exception fails. Verify that the tests pass and `astro build` fails when a fixture violation is present
- [x] 4.2 Implement the brand copy and markup rules on `dist/` HTML:
  - Banned words, with the exact brand name allowed
  - The "not just" / "isn't just", "In today's fast-paced" and "Whether you're" patterns
  - Buttons or links whose whole text is "Get Started" or "Learn More"
  - Em dashes in headings, buttons, links and the brand line
  - Emoji in headings, nav, buttons and list markers
  - Link text that ends in an arrow
  - "01 /" style labels outside an `<ol>`
  - First-person plural (`we`, `our`, `us`), exempting `<blockquote>`/`<q>` and treating `U.S.` as one token
  - Forbidden employer terms (`Capital One`, `Booz Allen`, `ATM` as a whole word, `kiosk`) anywhere in `dist/`, including metadata and JSON-LD

  Verify with one passing and one failing fixture test per rule
- [x] 4.3 Implement the brand style rules on `src/styles/**` and `.astro` `<style>` blocks:
  - The banned font families
  - Monospace allowed only on `code`, `kbd`, `samp` and `pre`
  - Gradient-clipped text
  - `backdrop-filter`
  - Noise: `feTurbulence` or a noise image
  - `cursor: url(...)`
  - Pill radius on links or buttons

  Verify with one passing and one failing fixture test per rule
- [x] 4.4 Implement the color rules with `culori`:
  - The reference list: `#D97757`, `#C6613F`, `#FAF9F5`, `#F0EEE6`, `#E8E6DC`, `#E3DACC`, `#F4F1EA`, `#F7F1E4`, `#D9622B`, `#6366F1`, `#4F46E5`, `#8B5CF6`
  - Rejection when the CIEDE2000 difference is under 8
  - The warm off-white and orange-accent category rules, with thresholds in `site-check.config.ts`

  Verify with tests that every reference color and a near match are flagged, while pure white, near-black and the placeholder blue pass
- [x] 4.5 Implement the platform rules: no color literal or font-family outside `tokens.css`, and no `<script>` in `dist/` except `application/ld+json`. Verify with fixture tests, and that the placeholder look from 3.1 passes
- [x] 4.6 Implement the SEO rules:
  - Titles and descriptions are unique and within their length limits
  - Exactly one H1 per page, with no skipped heading levels
  - Every page has a canonical link on the production origin
  - Internal links use the trailing slash
  - A non-indexable build has a `_headers` file containing `noindex`

  Verify with fixture tests for each
- [x] 4.7 Document the site check in `README.md`: the rules, the config, the exception format, and how to run it. Verify that the documented example exception entry passes, and that removing its reason fails, as the docs say

## 5. Content model and settings

- [x] 5.1 Create `src/site.config.ts` per D5:
  - `PRODUCTION_ORIGIN` is `https://elevationcode.works`
  - Founder: Tejen Shrestha, Founder & CEO
  - `publicEmail: 'tejen@elevationcode.works'` and `replyTime: 'within 48 hours'`
  - A `pending` marker for the `sameAs` URLs

  Verify that `astro check` passes
- [x] 5.2 Define the `services`, `work` and `pages` collections in `src/content.config.ts`, with the Zod rules from D5: `seo` length limits, `outcomes` requiring `source` and `measuredAt`, and at least one screenshot. Add a build check for exactly six services with one entry offer. Verify with temporary fixtures that a 161-character description, an outcome without a source, and a seventh service each fail the build
- [x] 5.3 Add a `release-check` script that lists every `pending` marker from content and config with file and question, and exits 1 while any remain. Add `node --test` tests for both exit paths. Document content authoring in `README.md`: adding a service or case study, pending markers, and the forbidden employer terms. Verify that the tests pass

## 6. Services, work, About, Home and 404

- [x] 6.1 Write the six service entries, following the site-content spec's catalog and scope boundary:
  - Websites that get found: says SEO campaigns and ads are not offered
  - Integrations: names Stripe, Square, Shopify and booking tools
  - Custom web apps: customer-facing only
  - AI features
  - Care and rescue
  - Tech checkup, as the entry offer

  Verify that the build and site check pass, and that `grep -riE 'quickbooks|xero|hubspot|salesforce|mailchimp|klaviyo' dist` returns nothing
- [x] 6.2 Build the `/services/` index and the service detail template:
  - Who it's for, what's included and what's not
  - Related work
  - A CTA to `/contact/`
  - `Service` and `BreadcrumbList` JSON-LD

  Verify that all six `/services/<slug>/index.html` files exist and that one page's JSON-LD validates at validator.schema.org with no errors
- [x] 6.3 Write `scripts/capture-screenshots.mjs` using the local Playwright Chromium. It captures whatcanido.earth, condies.fyi and uphillskico.com at 1440×900 and 390×844 into `src/assets/work/`, dismissing cookie banners. Verify that all six images exist at the stated sizes
- [x] 6.4 Write the three `work` entries:
  - What Can I Do?: "contracted by Important, Not Important to build the initial version and launch it to production", with no later features claimed
  - Every entry: descriptive alt text, and no outcomes yet
  - `pending` markers for outcome metrics, the quote from Important, Not Important, and confirmation that the contract allows portfolio use

  Verify that the build passes and `npm run release-check` lists those markers
- [x] 6.5 Build the `/work/` index and the case study template:
  - Name, one-sentence description, audience and role
  - The live link
  - Screenshots via `<Picture>` with width and height set
  - Outcomes, when present
  - A `BreadcrumbList`

  Verify that the three case-study pages build with all fields visible and the check passes
- [x] 6.6 Build the About page from the `pages` collection:
  - Copy the founder photo into `src/assets/founder.jpg` and give it alt text
  - Founder & CEO, Denver
  - Background summary: current work described only in enterprise terms, and the federal work framed as earlier contract engineering on FDA, VA and Census Bureau projects, with no employer named
  - The plain sentence on AI and accountability
  - A CTA to Contact

  Verify that the site check passes and that `dist/` contains no "Capital One", "Booz Allen", "ATM" or "kiosk"
- [x] 6.7 Build Home from the `pages` collection:
  - A plain-words H1 saying I build custom software and websites for Denver small businesses
  - A founder sentence in enterprise wording, with no employer named, and a CTA to `/contact/`
  - The three case-study previews, with screenshots, before the service list
  - `fetchpriority="high"` on the first screenshot
  - `ProfessionalService`, `Person` and `WebSite` JSON-LD with the `@id`s from D10

  Verify that the previews come before the services in `dist/index.html` and that the JSON-LD validates with no errors
- [x] 6.8 Build the 404 page with links to Home, Services, Work and Contact, and a `noindex` meta tag. Verify that it builds to `dist/404.html` and is absent from the sitemap
- [x] 6.9 Add `scripts/make-og.mjs` and generate `public/og/default.png` at 1200×630 from a plain HTML template with headless Chrome. Wire the Open Graph/Twitter tags, with alt text, into `BaseLayout`. Verify the image dimensions and that every built page has all of the tags required by the seo spec

## 7. Contact form

- [ ] 7.1 Build `/contact/` with the Netlify Forms markup from D11:
  - Visible labels, and required fields marked in text
  - Service options generated from the `services` collection, plus "Not sure yet"
  - Native constraints: `required`, `type="email"`, `minlength="10"`, `maxlength="5000"`
  - The honeypot inside a `hidden` wrapper
  - The hidden `subject` input
  - `tejen@elevationcode.works` shown as plain text
  - The one-sentence data-use statement

  Verify that the built HTML contains `data-netlify="true"`, `netlify-honeypot="bot-field"` and `name="email"`. Then verify in a browser with JavaScript disabled that an invalid email blocks submission and keeps the other entries
- [ ] 7.2 Build `/contact/thanks/` with the reply time from config ("within 48 hours"), a link to Home, and `noindex`. Verify that it is excluded from the sitemap
- [ ] 7.3 Add `netlify.toml` with:
  - The build command `npm run build`
  - The publish directory `dist`
  - `NODE_VERSION = "26"`
  - A forced 301 from `/about.html` to `/about/`

  Verify that `npx netlify-cli build --dry` (or a TOML parse) accepts the file

## 8. Netlify setup and live checks (with the owner)

- [ ] 8.1 With the owner, create the Netlify site from `ElevationCodeWorks/ecw-site`:
  - Production branch: `main`
  - Build command `npm run build` set in the UI, so `main` builds fail rather than publish
  - Branch deploys: `astro-site-foundation` only
  - Form detection on
  - An email notification for the `contact` form to `tejen@elevationcode.works`, confirmed by the owner

  Push the branch. Verify that the branch deploy URL loads, the `main` production build failed without publishing, and the credit usage shows 0 production deploys
- [ ] 8.2 On the branch deploy, verify with `curl -sI` and `curl -s`:
  - `X-Robots-Tag: noindex, nofollow` on pages
  - `robots.txt` disallows everything
  - The canonical links point to the production origin
  - `/about.html` returns a 301 to `/about/`
  - `/servcies/` returns 404 with the not-found page
  - The sitemap lists exactly the indexable pages
- [ ] 8.3 Submit three test forms on the branch deploy:
  - A valid submission: verify that the notification arrives, its subject names the website inquiry, and Reply-To is the test address
  - One with the honeypot filled through a raw `curl` POST: verify that no notification arrives
  - One with JavaScript disabled: verify that it lands on `/contact/thanks/`

  Then, with the owner, add a Gmail filter so Netlify form notifications never go to spam

## 9. Integration checks

- [ ] 9.1 Add the `npm run audit` script from D13: Lighthouse CI with the mobile preset and assertions, plus `pa11y-ci` with axe WCAG 2.2 AA over every sitemap URL. Run it against the preview build. Verify that every page meets each category ≥ 0.95, LCP ≤ 2500 ms, CLS ≤ 0.1 and TBT ≤ 200 ms, with zero accessibility violations. Record the results in `openspec/changes/astro-site-foundation/audit-results.md`
- [ ] 9.2 Do a manual pass on every page:
  - Keyboard-only navigation, with visible focus and a working skip link
  - 320px-wide reflow with no horizontal scroll
  - The reduced-motion setting
  - Every page with JavaScript disabled

  Verify by recording pass or fail per page in `audit-results.md`
- [ ] 9.3 Run `npm run release-check` and `openspec validate astro-site-foundation --strict`. Verify that validation passes and the release check fails only with the expected pending owner inputs. Share that list with the owner

## Workflow follow-up

- The owner reviews the branch-deploy preview. Then start the visual identity change (design rounds checked against the site check).
- Archive this change after review.
- Launch is a separate change: turn off DigitalOcean auto-deploy, point `elevationcode.works` to Netlify while keeping its Google Workspace MX records, keep `elevationcodeworks.com` redirecting to it, run the first production deploy, submit to Search Console, and decommission the App Platform app.
