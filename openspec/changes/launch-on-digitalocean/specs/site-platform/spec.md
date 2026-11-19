# Spec Delta

## REMOVED Requirements

### Requirement: Preview deployments stay out of search
**Reason**: The site no longer has preview deployments, and DigitalOcean's static hosting can't send a custom `X-Robots-Tag` header. "Non-production builds stay out of search" replaces it, using the robots meta tag and `robots.txt`.
**Migration**: None for visitors. Non-production builds are marked `noindex` in their HTML instead of a response header; the `_headers` file and its site-check rule are removed.

## ADDED Requirements

### Requirement: Non-production builds stay out of search
Any build not explicitly made for production SHALL mark every page `noindex, nofollow` and serve a `robots.txt` that disallows all crawling. A production build SHALL carry neither, except on pages that are always `noindex`.

#### Scenario: Local or test build
- **WHEN** the site is built without the production setting
- **THEN** every page has a `noindex, nofollow` robots meta tag

#### Scenario: Production build
- **WHEN** the site is built with the production setting
- **THEN** no indexable page has a `noindex` robots meta tag or response header

### Requirement: Production deploys from main
The live site SHALL be built and deployed from the `main` branch by the hosting platform, with the build running the site check. A build that fails SHALL deploy nothing, so the previous version stays live.

#### Scenario: Merge to main
- **WHEN** a commit lands on `main` and its build passes
- **THEN** the hosting platform deploys it to the production hostname

#### Scenario: Failing site check
- **WHEN** a commit lands on `main` and the site check fails during its build
- **THEN** no deployment is published and the production hostname keeps serving the previous version

### Requirement: Hosting configuration lives in the repository
The hosting configuration SHALL be kept in the repository: build command, output directory, runtime version, build-time variable names, error document and redirects. Secret values SHALL NOT be committed.

#### Scenario: Configuration matches the live app
- **WHEN** the hosting platform's live configuration is compared with the committed configuration
- **THEN** they match, apart from secret values, which the committed file names but leaves empty
