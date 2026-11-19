# Design

## Context

Motivation is in proposal.md. These facts shape the approach, checked on 2026-11-18.

**The live app**
- `elevationcode.works` is served by a DigitalOcean App Platform app, behind DigitalOcean's Cloudflare-based CDN. The domain's DNS is on DigitalOcean.
- The app deploys from `main` automatically. Merging PR #1 started a build that failed in `astro:build:done`, at the site check's `loadPrivateTerms`. The live site still returns the November 2024 build (`last-modified: Fri, 22 Nov 2024`).
- The app was set up for the old Remix site. Its component name, build command, output directory, domains and region aren't visible from the repository, and `doctl` isn't installed here.

**What App Platform offers a static site** (app spec reference)
- `error_document` (default `404.html`).
- Ingress rules with `redirect` (`uri`, `authority`, `scheme`, `redirect_code` such as 301), matched by path prefix or authority. A `${STARTER_DOMAIN}` placeholder matches the app's `ondigitalocean.app` address.
- No custom response headers. Static sites get `Cache-Control` for 24 hours at the CDN edge and 10 seconds in browsers, and the CDN cache is purged on each deploy.
- Build-time environment variables, including secrets that are stored encrypted.

**What the code assumes about Netlify**
- `src/lib/env.ts`: `isIndexable` requires `CONTEXT=production` and a `URL` on the production host. It drives the robots meta tag in `BaseLayout` and `robots.txt.ts`.
- `integrations/indexing-headers.ts` writes `dist/_headers`, and the `seo/noindex-headers` rule requires it on non-production builds.
- `netlify.toml` holds the build, the `/about.html` redirect and the `/_astro/*` cache header.
- `scripts/audit.mjs` builds with `CONTEXT`/`URL`, and `scripts/capture-comps.mjs` blocks Netlify's preview overlay.
- The README describes Netlify in its indexing, typefaces and private-terms sections.
- The Contact form uses Netlify Forms (`data-netlify`, `netlify-honeypot`, `form-name`). It stays as it is in this change (proposal, Known gap).

## Goals / Non-Goals

**Goals:**
- The DigitalOcean build passes, and the production build is indexable only when it is explicitly marked as production.
- The live app's configuration is reviewable in the repository and is changed by applying that file.
- The launch is one deliberate step by the owner (applying the app spec), with a known way back.

**Non-Goals:**
- Making the contact form deliver on DigitalOcean. That is the Web3Forms change.
- A server component, an edge function or our own CDN in front of the app.
- Changing DNS or the `elevationcodeworks.com` redirect.

## Decisions

### D1. One production flag: `SITE_ENV=production`
- `isIndexable` becomes `SITE_ENV === 'production'`. It drops the `CONTEXT` and `URL` inputs and the host comparison.
- The DigitalOcean app sets `SITE_ENV=production` as a build-time variable. Local builds, tests and the audit's second build leave it unset, so they get `noindex`.
- **Why not keep `CONTEXT` and `URL`:** they are Netlify's names, and setting them by hand on another host is misleading. The host comparison guarded against Netlify serving a production build on `*.netlify.app`. On DigitalOcean, the starter address is handled by a redirect instead (D3).
- **Alternative considered:** detect DigitalOcean from its own variables. App Platform doesn't expose a reliable build-time marker unless you bind one, and an explicit flag is clearer.

### D2. The app spec is committed and applied by the owner
- **First step:** the owner exports the live app spec from the dashboard (the app's Settings, App Spec) and commits it unchanged as `.do/app.before.yaml`. It records the old site's settings for rollback (D5) and supplies the real component name, domains and region.
- `.do/app.yaml` is the new spec, edited from that export:
  - the static site component: `build_command: npm run build`, `output_dir: dist`, the Node version from `package.json` engines, and `error_document: 404.html`
  - build-time variables: `SITE_ENV=production`, and `SITE_CHECK_PRIVATE_TERMS` as a `SECRET` whose value is left empty in the file
  - ingress rules, in order:
    1. the starter address (`authority: exact ${STARTER_DOMAIN}`) redirects with 301 to `elevationcode.works`, keeping the path
    2. `/about.html` redirects with 301 to `/about/`
    3. everything else goes to the static site
  - the export's `domains` block, unchanged
- **Applying it:** the owner pastes the file into the App Spec editor and fills in the secret's value there. Saving starts a deploy. `doctl apps update --spec` is the scripted alternative, if the owner installs `doctl`.
- **Alternatives considered:**
  - *Editing settings by hand in the dashboard:* nothing reviewable and nothing to roll back to.
  - *Terraform:* far too much for one app.

### D3. Redirects and 404 move to the app spec
- The `seo` 301 for `/about.html` and the real 404 move from `netlify.toml` into the spec (D2).
- The starter-address redirect is new and satisfies the `seo` "One public hostname" requirement. Without it, the production build would also be indexable at `*.ondigitalocean.app`.
- If App Platform doesn't keep the path when redirecting by authority, the rule redirects to the home page instead. The task's live check records which happened.

### D4. Site-check changes
- **`seo/noindex-headers`** and `integrations/indexing-headers.ts` are removed.
- A new **`seo/noindex-build`** rule checks that a build that isn't indexable has a `noindex, nofollow` robots meta tag on every page and a disallow-all `robots.txt`. A production build fails the same rule if an indexable page has one.
- The rule gets passing and failing fixture tests, following the existing pattern.

### D5. Launch sequence and rollback
1. Build everything on a branch `launch-on-digitalocean` and verify it locally (D6).
2. Merge it to `main`. DigitalOcean builds and fails again, because the secret isn't set yet, so the old site stays live.
3. The owner applies `.do/app.yaml` with the secret's value. That deploy is the launch.
4. Run the live checks in the tasks.

**Rollback:**
- First, DigitalOcean's "Rollback" to the last good deployment, if it's still offered.
- Otherwise, apply `.do/app.before.yaml` and redeploy from a branch that holds the old site's source, the pre-merge `main` at `2efdace`.

### D6. Review without previews
There are no per-PR previews. Before merging, a change is checked with `npm test`, `npm run build`, `npm run preview` and `npm run audit`, plus screenshots where the look changes. The README replaces its preview notes with a short "Reviewing a change" section. `scripts/capture-comps.mjs` stays (it takes any URLs, including the local preview) but loses the Netlify overlay filter.

### D7. Netlify hosting files are removed
- `netlify.toml` is deleted, along with the Netlify comments in the scripts and the README's hosting, indexing, typefaces and private-terms notes.
- **Not removed in this change:**
  - The contact form's Netlify Forms markup and the README's contact-form section. They belong to the Web3Forms change, so the section only gains a note that the form doesn't work on DigitalOcean yet.
  - The Netlify project itself. Disconnecting it is a follow-up.

## Risks / Trade-offs

- **[The live app's spec differs from what we expect: component type, a buildpack pinned to old Node, extra components]** → D2 starts from the owner's export, not a guess. The new spec is a diff against it.
- **[Node version on App Platform]** → `engines.node` says `>=24`, which the buildpack may resolve to a version it doesn't offer. Pin to a version App Platform lists and the build supports, and confirm with a local build on that version.
- **[Netlify-only behaviors missed]** → A repository-wide search for `netlify`, `CONTEXT` and `_headers` is a task. Its check is zero hits, apart from the contact form's markup, its README section and archived changes.
- **[The contact form loses messages after launch]** → Accepted by the owner until the Web3Forms change. The Contact page shows the email address as plain text beside the form. The launch checks record what a submission returns on DigitalOcean, as input for that change.
- **[Short browser cache: 10 seconds]** → Repeat visits revalidate assets, but the CDN still serves them. Lighthouse runs against the local server can't see this, so the live site is checked with PageSpeed Insights after launch. If performance drops below 95 on mobile, a later change revisits it.
- **[The starter-address redirect loses the path]** → D3 records the fallback.
- **[Launch breaks the live site]** → The old site stays up until the new deploy succeeds. D5 gives two ways back.

## Migration Plan

D5 is the plan. In short: merge with the build still failing, apply the app spec to launch, run the live checks, and keep `.do/app.before.yaml` and `2efdace` for rollback.

## Open Questions

None left. Whether the live app also serves `www.elevationcode.works` was answered by the exported spec (task 1.2, 2026-11-18): its only domain is `elevationcode.works`, so no `www` rule is needed.
