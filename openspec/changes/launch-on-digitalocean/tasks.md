# Tasks

## 1. Inputs and branch

- [x] 1.1 Create the branch `launch-on-digitalocean` from `main`. Verify that `git log -1 main` is the PR #1 merge or later, and that `elevationcode.works` still returns the November 2024 site (`curl -sI` shows `last-modified: Fri, 22 Nov 2024`)
- [x] 1.2 Ask the owner to export the live app spec (DigitalOcean dashboard, the app's Settings, App Spec) and commit it unchanged as `.do/app.before.yaml`. Verify that the file names the static site component, its domains and region, and that it holds no plain-text secret values

## 2. Host-neutral indexing (design D1, D4)

- [x] 2.1 Change `isIndexable` in `src/lib/env.ts` to `SITE_ENV === 'production'`, and update `currentDeployEnv`, `BaseLayout` and `robots.txt.ts` to match. Rewrite `src/lib/env.test.ts`. Verify that tests show `SITE_ENV=production` is indexable, and that unset, empty and `preview` values are not
- [x] 2.2 Remove `integrations/indexing-headers.ts`, its entry in `astro.config.mjs`, and the `seo/noindex-headers` rule and its tests. Add the `seo/noindex-build` rule with passing and failing fixture tests: a non-production page without the robots meta tag fails, a non-production disallow-all `robots.txt` passes, and a production page with `noindex` fails. Replace the `seo/noindex-headers` row in the README's rule table with `seo/noindex-build`. Verify that `npm test` passes (including `readme.test.ts`), a local `npm run build` writes no `dist/_headers`, and every page in `dist/` has `noindex, nofollow`
- [x] 2.3 Verify the production build: `SITE_ENV=production npm run build` produces pages with no robots meta tag (except 404 and the thanks page), and a `robots.txt` that allows crawling and names the sitemap. Update the README's "Search indexing" section to describe `SITE_ENV`, and verify that `readme.test.ts` passes
- [x] 2.4 Update `scripts/audit.mjs` to build with `SITE_ENV=production` instead of `CONTEXT` and `URL`, and drop the Netlify wording in `scripts/lib/static-server.mjs`. Run `npm run audit`. Verify that every page still meets the Lighthouse thresholds, and that axe and the interaction checks pass in both schemes. Record the results in this change's `audit-results.md`

## 3. App spec and Netlify hosting files (design D2, D3, D6, D7)

- [x] 3.1 Pin `engines.node` to a version App Platform's Node buildpack supports and the build runs on. Verify with `npm run build` under that version locally
- [x] 3.2 Write `.do/app.yaml` from `.do/app.before.yaml`:
  - the build command and output directory
  - `error_document: 404.html`
  - `SITE_ENV=production`, and `SITE_CHECK_PRIVATE_TERMS` as an empty `SECRET`
  - the ingress rules for the starter address, `/about.html` and everything else
  - the exported `domains` block, with a `www` redirect if the export lists `www`

  Verify that the file parses as YAML, holds no secret value, and differs from the export only in those parts (`diff .do/app.before.yaml .do/app.yaml`)
- [x] 3.3 Delete `netlify.toml`. Remove the Netlify overlay filter and its comment from `scripts/capture-comps.mjs`, and the Netlify mentions from `integrations/site-check/private-terms.ts`. Rewrite the README's hosting, typefaces (cache) and private-terms notes for DigitalOcean, and add a "Reviewing a change" section (design D6) and a "Hosting" section on applying `.do/app.yaml`. Add one line to the README's "Contact form" section saying the form doesn't deliver on DigitalOcean until the Web3Forms change. Verify that `grep -rni "netlify\|_headers"` and a case-sensitive `grep -rn "CONTEXT"` over the repository (outside `node_modules`, `dist`, `.git` and archived changes) find nothing but the contact form's markup, its README section and this change's own planning files, and that `npm test` passes

## 4. Merge and launch (design D5)

- [x] 4.1 Run `npm test`, `npm run build`, `npm run check:site` and `openspec validate launch-on-digitalocean --strict` on the branch, then merge it to `main` with the owner's OK. Verify that DigitalOcean's build for the merge commit fails at the site check's private terms, and that `elevationcode.works` still returns the November 2024 site
- [x] 4.2 The owner applies `.do/app.yaml` in the App Spec editor and sets `SITE_CHECK_PRIVATE_TERMS` there. Verify that the deploy's build log shows the site check passing, and that the deploy goes live
- [x] 4.3 Live checks on `https://elevationcode.works`:
  - each sitemap page returns 200 with no `noindex`
  - `robots.txt` allows crawling and names the sitemap
  - `/servcies` returns 404 with the not-found page
  - `/about.html` returns 301 to `/about/`
  - the starter address returns 301 to `elevationcode.works` (record whether the path is kept)
  - `/favicon.ico`, `/icon.svg`, `/apple-touch-icon.png` and a page's `og:image` return images

  Record each result in `audit-results.md`
- [x] 4.4 Record what a contact form submission does on the live site: submit one test message and note the response status, where the visitor lands, and whether anything is delivered. Verify that the result is in `audit-results.md` as input for the Web3Forms change
- [x] 4.5 Run PageSpeed Insights (mobile) on Home, a service page, a case study and Contact on the live site. Verify that each category is at least 95, or record the gap and its cause, for example the short cache lifetime, in `audit-results.md`
- [x] 4.6 Run `npm run release-check` and `openspec validate launch-on-digitalocean --strict`. Verify that both pass

## Workflow follow-up

- Archive this change after the owner's review.
- The Web3Forms change makes the contact form deliver on DigitalOcean.
- Disconnect the repository from the Netlify project, or delete the project.
- Search Console and analytics stay a separate change.
