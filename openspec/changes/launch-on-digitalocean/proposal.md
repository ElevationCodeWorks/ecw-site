# Proposal

## Why

The new site is merged to `main` (PR #1, 2026-11-18), but it can't go live yet. The live site at `elevationcode.works` runs on DigitalOcean App Platform, which deploys from `main`, and the new build fails there at the site check because the private employer terms aren't set. That failure is what keeps the November 2024 site live. Even if the build passed, every page would tell search engines not to index it, because the site was built for Netlify and decides indexing from Netlify's build variables.

The owner decided on 2026-11-18 to stay on DigitalOcean rather than move to Netlify. Netlify's free plan has a hard usage cap that can switch the site off, while DigitalOcean bills for extra bandwidth instead. This change makes the app build and deploy correctly on DigitalOcean, and launches it there.

## What Changes

- **Hosting on DigitalOcean.** The app's configuration is committed as an app spec (`.do/app.yaml`):
  - the build: `npm run build`, output `dist`, a supported Node version
  - the build-time variables: the private employer terms, and a production flag
  - `404.html` as the error document
  - a 301 redirect for `/about.html`
  - a 301 redirect from the app's `ondigitalocean.app` starter address to `elevationcode.works`

  `main` deploys to the live site, and a build that fails the site check deploys nothing.
- **Host-neutral indexing.** A production build is identified by `SITE_ENV=production` instead of Netlify's `CONTEXT` and `URL`. Every other build carries a `noindex` meta tag on every page and a disallow-all `robots.txt`.
- **Netlify hosting files removed.** `netlify.toml`, the `_headers` integration and its site-check rule, and the Netlify notes in the scripts and README go. There are no per-pull-request previews anymore: changes are reviewed locally (build, preview, audit) before they merge (owner decision 2026-11-18).
- **Launch.** When the owner applies the app spec, the next deploy publishes the new site on `elevationcode.works`. It is then checked live: pages, robots, redirects, 404, icons and social images.

**Known gap:** the contact form keeps its Netlify Forms markup, so on DigitalOcean it won't deliver messages. The owner accepts this until a separate change moves the form to Web3Forms (owner decision 2026-11-18). The Contact page still shows the owner's email address as plain text beside the form.

**Out of scope:**
- **The contact form:** the Web3Forms change.
- **Search Console and analytics:** a later change (owner decision 2026-11-18).
- **Disconnecting the Netlify project:** a follow-up. It only builds pull-request previews and doesn't affect the live site.
- **Long cache lifetimes for built assets:** App Platform doesn't let a static site set its own `Cache-Control`. Serving the files from a server component just to add the header isn't worth the cost.
- **DNS:** `elevationcode.works` already points at the DigitalOcean app, and `elevationcodeworks.com` already redirects to it.
- **New copy or pages.**

## Capabilities

### New Capabilities

None. Hosting is part of `site-platform`, whose purpose already covers how the site is delivered and deployed.

### Modified Capabilities

- `site-platform`:
  - "Preview deployments stay out of search" becomes "non-production builds stay out of search", using a meta tag and `robots.txt` instead of a response header.
  - New requirements cover production hosting: the site deploys from `main`, a failed check deploys nothing, and the hosting configuration lives in the repository.
- `seo`:
  - `robots.txt` rules depend on the build, not the hostname.
  - A new requirement: the hosting provider's own address redirects to the production hostname.

## Impact

- **Code:**
  - `src/lib/env.ts` and its tests, `BaseLayout`, and `robots.txt.ts`
  - `integrations/indexing-headers.ts` (removed) and the `seo/noindex-headers` rule
  - `scripts/audit.mjs`, `scripts/lib/static-server.mjs` and `scripts/capture-comps.mjs`
  - `netlify.toml` (removed), `README.md`, a new `.do/app.yaml`, and `package.json` engines
- **Dependencies:** none added.
- **Systems:** the existing DigitalOcean app is updated through its App Spec editor.
- **Owner inputs:**
  - an export of the live app spec
  - applying the new app spec, including the private terms, in the DigitalOcean dashboard (this is the launch moment)
- **Risk:**
  - The launch is the first deploy of the new site to production. The old site stays live until that deploy succeeds.
  - Rolling back means redeploying an earlier deployment from DigitalOcean's deployment history, or applying the exported old spec.
