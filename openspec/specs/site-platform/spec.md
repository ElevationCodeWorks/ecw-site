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

### Requirement: Preview deployments stay out of search
Any deployment not served from the production hostname SHALL tell search engines not to index it.

#### Scenario: Preview response header
- **WHEN** any URL is requested from a preview or non-production hostname
- **THEN** the response includes the header `X-Robots-Tag: noindex, nofollow`

#### Scenario: Production response header
- **WHEN** any indexable page is requested from the production hostname
- **THEN** the response does not include a `noindex` directive

### Requirement: Mobile performance baseline
Every page SHALL meet the "good" Core Web Vitals thresholds in a lab run that simulates a mid-range mobile device on a slow 4G connection.

#### Scenario: Lab audit of each page
- **WHEN** a mobile lab audit runs against each page of a preview deployment
- **THEN** Largest Contentful Paint is 2.5 s or less, Cumulative Layout Shift is 0.1 or less, Total Blocking Time is 200 ms or less, and the performance, accessibility, best-practices and SEO scores are each 95 or higher

### Requirement: Accessible to keyboard and assistive technology
Every page SHALL meet WCAG 2.2 level AA, including keyboard operation, visible focus, a skip link to the main content, labeled landmarks and sufficient contrast.

#### Scenario: Keyboard-only visit
- **WHEN** a visitor moves through any page using only the keyboard
- **THEN** the first focusable element is a skip link to the main content, every interactive element can be reached and used, and the focused element is always visibly indicated

#### Scenario: Automated accessibility audit
- **WHEN** an automated WCAG 2.2 AA audit runs on each page
- **THEN** it reports no violations

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
All colors, typefaces, type sizes, spacing, radii, borders and shadows SHALL be defined as named design tokens in a single place. Components and pages MUST reference tokens and not raw values.

#### Scenario: Changing a token
- **WHEN** the value of a color or typeface token is changed
- **THEN** every page reflects the change after rebuild, with no edits to content or page markup

#### Scenario: Raw value outside the tokens
- **WHEN** a stylesheet or component outside the token definitions contains a literal color value or font-family name
- **THEN** the site check fails and names the file and line
