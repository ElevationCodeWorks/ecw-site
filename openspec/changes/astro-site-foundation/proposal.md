# Proposal

## Why

The site can't be found and can't be maintained safely.

- **The repo can't be indexed.** It is a Remix v2 single-page app (`ssr: false`), so it ships an empty HTML shell that search engines can't index.
- **Its framework is out of support.** Remix v2 has had no security updates since React Router v8 shipped (June 2026).
- **The live site is missing the basics.** `elevationcode.works` is the original static HTML, served from DigitalOcean App Platform. It has no meta description, `robots.txt`, sitemap or structured data.
- **The live About page has a wording problem.** It says "we" delivered for Capital One and federal agencies, which implies they were ECW's clients.

ECW's positioning is now settled: engineering for the software a Denver small business's customers touch. The site needs a foundation search engines can read, real pages that state the offer, and a structure that lets the visual identity iterate later without touching content or SEO.

## What Changes

- **BREAKING:** Replace the Remix v2 SPA with a fully static Astro 7 site hosted on Netlify. The site has no server code.
  - Remove `app/`, the Remix, Vite, PostCSS and Tailwind config, the Remix template logos, the constellation background, and the old `css/` folder.
- **Pages:** Home, Services plus one page per service, Work plus one case study per project, About, Contact, and a 404 page. Copy is first-person and drafted from known facts. Claims that need the owner's input are marked and listed.
- **Content collections:** services and case studies live in typed collections, separate from layout, so copy and design change independently.
- **Search basics:**
  - A unique title and description per page, plus canonical URLs and Open Graph/Twitter tags.
  - A sitemap and `robots.txt`.
  - Structured data: business, founder, website, services, breadcrumbs.
  - A redirect from the legacy `/about.html` to `/about`.
- **Contact form:** works without JavaScript, checks input, filters spam, and delivers each message to the owner's inbox. Netlify Forms handles it.
- **Brand guardrails check:** a build-time script that fails on banned copy terms and banned "AI-generated look" style patterns. It stays in place for the visual identity change that follows.
- **Placeholder look:** a deliberately neutral look in which every visual value lives in one tokens file. No brand palette or typeface is chosen here.
- **Preview only:** the site deploys to a preview that search engines are told not to index. Production keeps serving the current site until a later cutover.

**Out of scope:**
- **Visual identity:** palette, type and design rounds belong to a follow-up change.
- **Production launch:** pointing `elevationcode.works` from DigitalOcean to Netlify, analytics, and Search Console setup.
- **Further content:** per-tool integration pages, pricing, a blog, and an embedded booking tool.
- **Interim fix to the live About page:** a separate, immediate fix the owner can make on the old site.

## Capabilities

### New Capabilities
- `site-platform`: how the site is built, rendered and deployed. Covers static-first output, the client JavaScript budget, preview deployments kept out of search, the performance and accessibility baseline, and keeping all visual decisions in one replaceable layer.
- `seo`: how each page presents itself to search engines and link previews. Covers titles, descriptions, canonical URLs, social cards, sitemap, robots rules, structured data, legacy redirects, and the not-found response.
- `site-content`: what the site says and how it is organized.
  - Covers the page inventory, the service catalog and its scope boundary (engineering, not marketing, CRM or back office), and case studies.
  - Covers founder credentials and how employers and past clients may be referenced.
  - Covers first-person voice.
- `contact-form`: how a visitor sends the owner a message. Covers fields, validation, spam protection, delivery, and what the visitor sees on success or failure.
- `brand-guardrails`: automated checks that keep copy and styling clear of the patterns that make a site read as AI-generated. Covers banned terms, banned style patterns, and when the check runs.

### Modified Capabilities

None. The project has no existing specs.

## Impact

- **Code:** removes the Remix app, its config, and its dependencies: `@remix-run/*`, `react`, `react-dom`, `isbot`, `tailwindcss`, `postcss`, `autoprefixer`, and the Remix ESLint setup. Adds `astro`, `@astrojs/sitemap`, `@astrojs/check`, `prettier-plugin-astro`, a color-math library for the guardrails check, and the check itself.
- **Hosting:** adds a Netlify site connected to the GitHub repo. This change uses only branch deploys, which are free on Netlify's credit-based plans. Netlify Forms receives contact submissions. Production DNS and the DigitalOcean App Platform app that serves the live site are unchanged.
- **Branching:** DigitalOcean appears to deploy from the GitHub repo, so the work happens on a feature branch. Nothing merges to `main` until the cutover is planned.
- **Owner inputs needed before launch:**
  - One checkable result per case study, if available.
  - A quote from Important, Not Important, if available, and confirmation that the contract allows portfolio use.
  - GitHub and LinkedIn profile URLs for structured data.
