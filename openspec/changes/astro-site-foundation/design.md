# Design

## Context

Motivation is in proposal.md. These are the facts that shape the approach, all checked on 2026-11-11.

**Repo state**
- The Remix 2.15 SPA exists only as uncommitted work in the `main` working tree.
- `origin/main` still holds the old static `index.html` and `about.html`.
- A local `remix` branch points at the same commit as `main`.
- `main`'s `package.json` has no `build` script.

**Current hosting**
- The live site runs on DigitalOcean App Platform. Its CDN is Cloudflare, which is why responses carry `server: cloudflare`.
- `elevationcode.works` uses DigitalOcean DNS, with MX records pointing to Google Workspace.
- `elevationcodeworks.com` uses Google Cloud DNS nameservers and redirects to `elevationcode.works`.
- App Platform probably auto-deploys from GitHub `main`. This is not verified.

**Netlify (owner's choice)**
- Free plan: 300 credits a month with a hard cap. A production deploy costs 15 credits.
- Deploy previews, branch deploys and failed deploys are not metered.
- Form submissions are free and unlimited.
- Netlify adds `X-Robots-Tag: noindex` to deploy previews and older branch deploys. It does *not* add it to the latest branch deploy or to the `*.netlify.app` production URL.

**Netlify Forms**
- The form must exist in the built HTML.
- Netlify recognizes it by the `data-netlify="true"` attribute and handles honeypot spam traps through `netlify-honeypot`.
- Akismet filters every submission, and only verified submissions send notifications.
- A form field named `email` becomes the notification's Reply-To.
- A hidden `subject` input sets the email subject.
- An `action` path sets the page visitors land on after submitting.

**Astro 7 (June 2026)**
- Builds with Vite 8.
- Its new Rust compiler rejects malformed markup instead of fixing it.
- The default Markdown processor is now Sätteri.

**Local tooling:** Node 26, npm, and Prettier set to no semicolons, single quotes and no trailing commas.

## Goals / Non-Goals

**Goals:**
- A fully static build with no adapter and no server code. Every route is prerendered HTML.
- One "site check" that runs inside `astro build` and enforces brand guardrails, SEO uniqueness and the raw-value rule. A failing check means a failing build.
- Copy lives in content collections, and visual values live in one tokens file. Changing one never requires touching the other.
- Deployed only to Netlify branch deploys. Production is not touched.

**Non-Goals:**
- No interactive islands and no UI framework (React, Solid). Nothing in this change needs client JavaScript.
- No CMS, internationalization or blog.
- No CI pipeline. Audits run locally, and a GitHub Actions workflow can come later.
- No per-page Open Graph images. One default image is used until the visual identity change.

## Decisions

### D1. Astro 7, fully static, no adapter
Use `output: 'static'`, and run `astro check` before every build.

**Why:** the content needs no server rendering, and the contact form is handled by Netlify. Without an adapter there are no functions, no compute credits and no runtime to patch.

**Alternatives considered:**
- *Astro with `@astrojs/netlify`:* only useful once functions are needed, so add it later if they are.
- *React Router v8 with prerendering:* ships React hydration to every page.
- *SvelteKit 3:* a new language for no benefit here.

### D2. Netlify branch deploys only; production branch stays inert
**Setup**
- Connect the Netlify site to `ElevationCodeWorks/ecw-site`.
- Production branch: `main`. Branch deploys: `astro-site-foundation` only.
- `netlify.toml` on the feature branch sets the build command `npm run build`, the publish directory `dist`, and `NODE_VERSION`.

**Why production stays inert:** `main` has no build script, so any production build fails. Failed deploys are not metered, so nothing is published and no credits are spent.

**Preview URL:** `astro-site-foundation--<site>.netlify.app`.

**Alternative considered:** draft deploys from the Netlify CLI. They are unmetered too, but each one gets a new URL and nothing is tied to git.

**Node version:** match local Node 26, which has been LTS since October 2026. If Netlify's build image lacks it, fall back to Node 24.

### D3. Indexing is decided at build time
`src/lib/env.ts` computes one value:

`indexable = CONTEXT === 'production' && host(URL) === host(PRODUCTION_ORIGIN)`

`CONTEXT` and `URL` come from Netlify's environment. Three outputs follow from it:
1. A prerendered `robots.txt` endpoint. When indexable it allows all crawlers and adds the `Sitemap:` line. Otherwise it disallows everything.
2. A small integration hook (`astro:build:done`) writes `dist/_headers` with `X-Robots-Tag: noindex, nofollow` for `/*` when the build is not indexable.
3. The base layout adds `<meta name="robots" content="noindex, nofollow">` when the build is not indexable.

Any build without the Netlify variables, such as a local build, counts as not indexable.

**Why at build time:** Netlify can't scope headers by deploy context, and its automatic `noindex` misses the latest branch deploy. Before cutover, even the production context runs on `*.netlify.app`, so it stays not indexable automatically.

**Alternative considered:** an edge function that adds the header per request. It needs runtime code and costs credits.

### D4. URL shape
- `trailingSlash: 'always'` with `build.format: 'directory'`, so canonical URLs end in `/`.
- Netlify may also serve `/about` without a redirect. The canonical link covers that case, as the seo spec allows.
- `/about.html` → `/about/` is a forced 301 in `netlify.toml`. No file exists at that path in directory format, so nothing shadows the rule.
- The `site` setting comes from `PRODUCTION_ORIGIN` in `src/site.config.ts`, which is `https://elevationcode.works`. That's the domain the site already uses, and `elevationcodeworks.com` keeps redirecting to it.

### D5. Content model
All three collections are defined in `src/content.config.ts` with the glob loader and Zod schemas. The schemas enforce spec rules at build time.

**`services`** (Markdown, one file per service, slug from the file name)
- Fields: `title`, `order`, `summary`, `forWho`, `included[]`, `notIncluded[]`, `relatedWork` (references to `work`), `isEntryOffer`, `seo { title, description }`, `pending[]`.
- The schema checks the length limits on `seo` fields.
- A build check enforces exactly six entries, with one entry offer.

**`work`** (Markdown)
- Fields: `name`, `description`, `audience`, `role`, `client?`, `liveUrl`, `screenshots[{ image, alt }]` (at least one), `outcomes[{ claim, source, measuredAt }]`, `order`, `seo`, `pending[]`.
- `outcomes` requires both `source` and `measuredAt`, so an unsourced metric fails the build. That is how the "outcome claims carry a source" rule is enforced.

**`pages`** (Markdown with frontmatter sections)
- Holds copy for `home`, `about`, `contact` and `contact-thanks`, so layout files contain no prose.

**`src/site.config.ts`** (typed settings)
- `brandName`, `brandLine`, `productionOrigin`, `location`.
- `founder { name, title, sameAs[] }`.
- `publicEmail: 'tejen@elevationcode.works'`, `replyTime: 'within 48 hours'`.
- `pending[]`.

**Pending markers** are `pending: [{ question }]` entries. They are never rendered, and the copy always has a safe fallback. `npm run release-check` lists every marker and exits non-zero while any remain.

**Employers:** neither Capital One nor Booz Allen Hamilton is ever named.
- Current work is described as enterprise software engineering and AI enablement, with no identifying details such as fleet sizes, payment volumes or product names. Examples: "14 years building and modernizing enterprise and federal government software" and "trained hundreds of enterprise engineers on AI-assisted development".
- Federal work is described as earlier contract engineering on projects for the FDA, the VA and the Census Bureau, so the agencies never read as ECW clients.
- The site check (D7) enforces this.

**Alternative considered:** a headless CMS such as Sanity or Decap. That is overkill for one author who edits in git.

### D6. Styling: plain CSS with custom properties; Tailwind removed
- `src/styles/tokens.css` is the only file allowed to contain color literals or font-family names. It defines color, type, spacing, radius, border and shadow tokens.
- `src/styles/base.css` holds the reset and element defaults, using tokens only.
- Components use scoped `<style>` blocks that reference tokens.

**Placeholder look:**
- A pure white background and near-black text.
- One standard blue for links and focus, which passes the color guardrails.
- The `system-ui` font stack.
- A 2px radius, no shadows, and plain spacing.

The placeholder is meant to look unbranded.

**Why plain CSS:** the visual identity change swaps token values and a few layout components, so iteration happens in one place. Tailwind's utility classes spread visual decisions across markup, and its defaults sit close to the stock AI look.

**Alternative considered:** Tailwind v4 with `@theme` tokens. It's workable, but harder to check for guardrails because the check would have to parse class names.

### D7. One site check, built as an Astro integration
`integrations/site-check/` runs in `astro:build:done`, so any violation fails `astro build`. The same rules run on their own with `npm run check:site`. Rule modules:

**`brand`** (the brand-guardrails spec)
- *Copy and markup rules* run against the built HTML in `dist/`. That is where headings, buttons, link text and list markers appear as rendered. Code blocks and JSON-LD are ignored.
- *Style rules* run against `src/styles/**/*.css` and the `<style>` blocks in `src/**/*.astro`.
- *Color rules* parse the tokens with `culori`:
  - Banned reference colors: rejected when the CIEDE2000 difference is under 8. True neutrals (OKLCH C under 0.004: white, black, grays) are exempt from this comparison. The banned creams differ from pure white only by their warm tint (white is 2.35 from `#FAF9F5`), and the warm off-white category catches that tint instead. Refined during implementation.
  - Warm off-white backgrounds: OKLCH L > 0.93, C between 0.004 and 0.06, hue 50° to 110°.
  - Orange accents: hue 35° to 75°, C ≥ 0.09, L between 0.45 and 0.80.
  - All thresholds live in `site-check.config.ts`.
- *First-person voice:* visible text matching `we`, `our` or `us` as whole words is flagged, except inside `<blockquote>` and `<q>`.
- *Forbidden employer terms:* every file in `dist/` is scanned, including metadata and JSON-LD, for `Capital One`, `Booz Allen` and identifying terms (initially `ATM` as a case-sensitive whole word, and `kiosk`). The list lives in `site-check.config.ts`.

**`seo`**
- Every title and description is unique and within its length limits.
- Each page has exactly one H1 and no skipped heading levels.
- Internal links use the trailing-slash form.
- Every page has a canonical link.
- In non-indexable builds, `dist/_headers` exists and contains `noindex`.

**`platform`**
- No raw color or font-family values outside `tokens.css`.
- No `<script>` tags in `dist/` other than `application/ld+json`.

**Exceptions** live in `site-check.exceptions.json` as `{ rule, file, line, reason }`. An entry with no reason, or that matches nothing, fails the check.

**Why one check:** one place to look and one config. The visual identity change extends the same rule set.

**Alternatives considered:** an ESLint/Stylelint plugin mix, which can't see rendered HTML, and a separate script run after the build, which is easy to forget.

### D8. Images
- `astro:assets` `<Picture>` outputs AVIF and WebP with explicit width and height, so nothing shifts as images load.
- Images below the first screen are lazy-loaded. The first case-study screenshot on Home gets `fetchpriority="high"`.
- Screenshots are captured once by `scripts/capture-screenshots.mjs`, using the Playwright Chromium already installed locally. Sizes are 1440×900 and 390×844, saved to `src/assets/work/`. Each screenshot's capture date goes in that case study's frontmatter.
- The founder photo is copied from the owner's file to `src/assets/founder.jpg`. Build output strips its metadata; the source has no GPS data and the repo is private.

### D9. Social image
- One default `public/og/default.png` at 1200×630.
- `scripts/make-og.mjs` renders it once from a local HTML template using headless Chrome.
- The visual identity change replaces it and may add per-page images.

### D10. Structured data
- Typed builders in `src/lib/schema.ts` produce the JSON-LD, typed with `schema-dts` at compile time.
- Stable `@id`s: `${origin}/#business` (ProfessionalService), `${origin}/#founder` (Person), and `${origin}/#website` (WebSite).
- Each `Service` uses `provider: { '@id': '#business' }`, and every page except Home gets a `BreadcrumbList`.
- The address is limited to `addressLocality: Denver` and `addressRegion: CO`, with no street address.

### D11. Contact form via Netlify Forms
The markup is static HTML in `src/pages/contact/index.astro`:

```html
<form name="contact" method="POST" action="/contact/thanks/"
      data-netlify="true" netlify-honeypot="bot-field">
  <input type="hidden" name="subject" data-remove-prefix
         value="Website inquiry: Elevation Code Works">
  <p hidden><label>Leave this empty <input name="bot-field"></label></p>
  <!-- name (required), email (type=email, required, name="email"),
       business, service (select: six services + "Not sure yet"),
       message (textarea, required, minlength=10, maxlength=5000) -->
</form>
```

- The browser enforces the input rules natively, with no JavaScript, and keeps what the visitor typed.
- The honeypot sits inside a `hidden` wrapper, so it never reaches keyboard or screen-reader users.
- `/contact/thanks/` is static, `noindex`, and filtered out of the sitemap.
- **Netlify UI settings:** turn on form detection, and add an email notification for the `contact` form sent to `tejen@elevationcode.works`. The owner must confirm that address.
- The Contact page shows `tejen@elevationcode.works` as plain text. Google Workspace's spam filtering handles any scraping that causes.

**Alternative considered:** a Netlify Function with an email API such as Resend. It would allow custom server-side validation, rate limits and a dynamic subject. Revisit it if spam gets through or the native validation UX falls short.

### D12. Tooling
- Remove ESLint, since its config is Remix-specific. `astro check` with strict TypeScript covers type safety.
- Keep Prettier with its existing style, and add `prettier-plugin-astro`.
- Scripts:
  - `dev`
  - `build`: `astro check && astro build`, with the site check inside the build
  - `preview`
  - `check:site`
  - `release-check`
  - `audit`
  - `fmt`

### D13. Audits
`npm run audit` (`scripts/audit.mjs`) runs these steps:
1. It builds the site in **production mode** (`CONTEXT=production`, `URL` set to the production origin). That is the artifact that ships. Preview builds carry `noindex` by design, and Lighthouse would score their SEO category down.
2. It serves `dist/` with a small Netlify-like static server: directory index, a 404 page with status 404, and gzip.
3. It runs **Lighthouse CI** (`@lhci/cli`) on every page with the default mobile emulation and the assertions from the site-platform spec: each category ≥ 0.95, LCP ≤ 2500 ms, CLS ≤ 0.1, TBT ≤ 200 ms. The SEO category is asserted only on the sitemap pages, because the 404 and contact confirmation pages are `noindex` on purpose.
4. It runs **axe-core** directly in the local Chrome with the WCAG 2.0, 2.1 and 2.2 A/AA tags, at desktop and phone sizes. Changed during implementation: `pa11y-ci`'s axe runner stops at WCAG 2.1 AA, so it could not verify the 2.2 requirement.
5. It runs interaction checks on every page: keyboard order and the skip link, visible focus, 320px reflow, reduced motion, and rendering with JavaScript disabled.
6. It rebuilds `dist/` in preview mode, so no indexable build is left behind.

### D14. Git workflow
1. Delete the uncommitted Remix work and the local `remix` branch, which has no commits of its own. The owner approved the deletion on 2026-11-11. Keep `openspec/` and `.claude/`.
2. Create `astro-site-foundation` from `main`.
3. Push the branch so Netlify can make branch deploys.
4. Never merge to `main` in this change.

## Risks / Trade-offs

**Hosting and deploys**
- [DigitalOcean auto-deploys `main` to production] → Never merge to `main` here. The launch change starts by checking the App Platform settings.
- [Netlify Free hard cap pauses the site] → This change uses only unmetered branch deploys. At launch, either budget production deploys (about 10 a month leaves room for roughly 7 GB of bandwidth) or move to Personal at $9 a month.

**Search**
- [The latest branch deploy gets indexed] → D3 sets build-time `noindex` three ways, and the site check fails a non-indexable build without `_headers`.
- [`*.netlify.app` serves an indexable copy after launch] → Canonical links point to the production origin. The launch change confirms that Netlify redirects its subdomain to the custom domain.
- [Netlify serves both `/about` and `/about/`] → Canonical links plus internal links that always use the trailing slash.

**Contact form**
- [No server-side validation or rate limiting with Netlify Forms] → The honeypot and Akismet catch most spam, and spam never notifies. If spam gets through, switch to the function-based handler from D11.
- [Notification emails from `formresponses@netlify.com` land in spam] → After the first test submission, add a Gmail filter that never sends them to spam. Submissions are also kept in the Netlify form inbox.

**Content and checks**
- [Site-check false positives, e.g. "us" in "U.S."] → Word-boundary matching that treats `U.S.` as one token, plus the exceptions file with written reasons.
- [An employer gets named or becomes identifiable] → The copy uses enterprise and contract-engineering wording, and the site check scans every built file for the forbidden terms.
- [Screenshots of client work] → Use only public pages of What Can I Do?, and the owner confirms the contract allows portfolio use (a pending marker).
- [Astro 7's stricter compiler rejects markup] → This is welcome. Fix markup at the source.

## Migration Plan

**This change:** set up Netlify (D2), build on the feature branch, and review on the branch-deploy URL.

**Rollback:** delete the Netlify site or the branch. Production is never touched.

**Launch, a later change** (listed here only for continuity):
1. Turn off DigitalOcean auto-deploy.
2. Point `elevationcode.works` to Netlify and keep its Google Workspace MX records. Keep `elevationcodeworks.com` redirecting to it.
3. Merge to `main` and run the first metered production deploy.
4. Verify headers, redirects and the `netlify.app` redirect.
5. Submit the sitemap in Search Console.
6. Decommission the App Platform app.

## Open Questions

None of these change the specs, the approach or the tasks. Each is tracked as a pending marker or a config value.
- GitHub and LinkedIn URLs for the founder's `sameAs` links.
- Outcome metrics with sources, a quote from Important, Not Important, and confirmation that the contract allows portfolio use.
