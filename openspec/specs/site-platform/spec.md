# site-platform Specification

## Purpose

Defines how the Elevation Code Works site is rendered, delivered and deployed, so every page is readable without JavaScript, fast on mobile, accessible, and kept out of search results until it is launched.

## Requirements

### Requirement: Pages are delivered as complete HTML
Every page SHALL include its full primary content (heading, body copy, links and images) in the initial HTML response, with no client-side script needed to display it.

#### Scenario: Crawler without JavaScript
- **WHEN** any page in the sitemap is fetched by a client that does not execute JavaScript
- **THEN** the response contains the page's H1, its body copy and its navigation links

#### Scenario: Script blocked in a browser
- **WHEN** a visitor loads any page with JavaScript disabled
- **THEN** the page displays and works the same as with JavaScript enabled, including navigation and the contact form

### Requirement: No client-side JavaScript by default
Pages SHALL ship no client-side JavaScript. Any future exception MUST be limited to the page that needs it and recorded with its reason and size.

#### Scenario: Content page payload
- **WHEN** the Home, Services, a service, Work, a case study, About, Contact or not-found page is loaded
- **THEN** the HTML references no script files and contains no inline scripts other than structured-data blocks

### Requirement: Non-production builds stay out of search
Any build not explicitly made for production SHALL mark every page `noindex, nofollow` and serve a `robots.txt` that disallows all crawling. A production build SHALL carry neither, except on pages that are always `noindex`.

#### Scenario: Local or test build
- **WHEN** the site is built without the production setting
- **THEN** every page has a `noindex, nofollow` robots meta tag

#### Scenario: Production build
- **WHEN** the site is built with the production setting
- **THEN** no indexable page has a `noindex` robots meta tag or response header

### Requirement: Mobile performance baseline
Every page SHALL meet the "good" Core Web Vitals thresholds in a lab run that simulates a mid-range mobile device on a slow 4G connection.

#### Scenario: Lab audit of each page
- **WHEN** a mobile lab audit runs against each page of a preview deployment
- **THEN** Largest Contentful Paint is 2.5 s or less, Cumulative Layout Shift is 0.1 or less, Total Blocking Time is 200 ms or less, and the performance, accessibility, best-practices and SEO scores are each 95 or higher

### Requirement: Accessible to keyboard and assistive technology
Every page SHALL meet WCAG 2.2 level AA in both the light and the dark color scheme, including keyboard operation, visible focus, a skip link to the main content, labeled landmarks and sufficient contrast.

#### Scenario: Keyboard-only visit
- **WHEN** a visitor moves through any page using only the keyboard, in either color scheme
- **THEN** the first focusable element is a skip link to the main content, every interactive element can be reached and used, and the focused element is always visibly indicated

#### Scenario: Automated accessibility audit
- **WHEN** an automated WCAG 2.2 AA audit runs on each page in the light scheme and again in the dark scheme
- **THEN** it reports no violations in either scheme

#### Scenario: Images
- **WHEN** a page shows an image that carries meaning, such as a screenshot or the founder photo
- **THEN** the image has alt text that describes it, and purely decorative images have empty alt text

### Requirement: Layout adapts to small screens and user preferences
Pages SHALL reflow to a 320 CSS-pixel-wide viewport without horizontal scrolling, and SHALL respect the visitor's reduced-motion preference.

#### Scenario: Narrow viewport
- **WHEN** any page is viewed at 320 CSS pixels wide
- **THEN** no content requires horizontal scrolling except code blocks or tables in their own scroll container

#### Scenario: Reduced motion
- **WHEN** a visitor's system requests reduced motion
- **THEN** the page shows no non-essential animation or transition

### Requirement: Visual decisions live in one replaceable layer
All colors in both color schemes, typefaces and their font files, type sizes, spacing, radii, borders and shadows SHALL be defined as named design tokens in a single place. Components, pages, inline vector graphics, and generated images and icons MUST take their values from the tokens, not from raw values.

#### Scenario: Changing a token
- **WHEN** the value of a color or typeface token is changed
- **THEN** every page, social image and site icon reflects the change after rebuild, with no edits to content or page markup

#### Scenario: Changing a dark-scheme value
- **WHEN** the dark-scheme value of a color token is changed
- **THEN** every page reflects the change in the dark scheme after rebuild, and the light scheme is unchanged

#### Scenario: Raw value outside the tokens
- **WHEN** a stylesheet, component or inline vector graphic outside the token definitions contains a literal color value or font-family name, including in a `fill` or `stroke` attribute
- **THEN** the site check fails and names the file and line

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
