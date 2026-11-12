# Spec Delta

## Purpose

Defines how each page of the Elevation Code Works site presents itself to search engines, AI answer engines and link previews, so the business is found for its services in Denver and is not confused with similarly named companies.

## ADDED Requirements

### Requirement: Unique title and description per page
Every indexable page SHALL have a title of 60 characters or fewer and a meta description of 70 to 160 characters. No two pages share a title or a description.

#### Scenario: Title and description present
- **WHEN** any indexable page is fetched
- **THEN** its HTML head contains one `<title>` and one meta description within the length limits

#### Scenario: Duplicate detected
- **WHEN** two pages are given the same title or the same description
- **THEN** the site check fails and names both pages

### Requirement: Brand name is consistent
The business SHALL be referred to as "Elevation Code Works" in every page title suffix, in the site name of social previews, and in structured data. Abbreviations and variants MUST NOT be used in those places.

#### Scenario: Title suffix
- **WHEN** any page other than Home is fetched
- **THEN** its title ends with "Elevation Code Works"

### Requirement: One H1 per page
Every page SHALL have exactly one H1 that names the page's subject in plain words, and heading levels SHALL NOT skip a level.

#### Scenario: Heading outline
- **WHEN** the heading outline of any page is extracted
- **THEN** it contains exactly one H1, and no heading is more than one level deeper than the heading before it

### Requirement: Canonical URL on the production origin
Every indexable page SHALL declare one canonical URL that is absolute, uses the configured production origin, and follows a single trailing-slash convention, even when served from a preview hostname.

#### Scenario: Canonical on preview
- **WHEN** a page is fetched from a preview hostname
- **THEN** its canonical link points to the same path on the production origin

#### Scenario: Trailing-slash variant
- **WHEN** a page is requested with the opposite trailing-slash form
- **THEN** the response is either a 301 redirect to the canonical form, or the same page whose canonical link points to the canonical form

#### Scenario: Internal links use the canonical form
- **WHEN** the built site's internal links are checked
- **THEN** every internal link uses the canonical trailing-slash form

### Requirement: Social link previews
Every indexable page SHALL provide Open Graph and Twitter card metadata: title, description, absolute URL, type, a 1200x630 image with alt text, and a large-image card type.

#### Scenario: Link shared in a chat app
- **WHEN** a page's metadata is read by a link-preview service
- **THEN** it finds `og:title`, `og:description`, `og:url`, `og:type`, `og:image`, `og:image:alt`, `og:site_name` set to "Elevation Code Works", and `twitter:card` set to `summary_large_image`

### Requirement: Sitemap lists every indexable page
The site SHALL publish an XML sitemap, referenced from `robots.txt`, that lists every indexable page by its canonical URL and nothing else.

#### Scenario: Sitemap contents
- **WHEN** the sitemap is fetched
- **THEN** it lists Home, Services, each service page, Work, each case study, About and Contact by canonical URL, and does not list the not-found page, the contact confirmation page or any redirect source

### Requirement: Robots rules by environment
The site SHALL serve `/robots.txt`. On the production hostname it allows crawling and references the sitemap. On any other hostname it disallows all crawling.

#### Scenario: Production robots
- **WHEN** `/robots.txt` is fetched from the production hostname
- **THEN** it allows all user agents and contains a `Sitemap:` line with the absolute sitemap URL

#### Scenario: Preview robots
- **WHEN** `/robots.txt` is fetched from a preview hostname
- **THEN** it disallows all paths for all user agents

### Requirement: Business and founder structured data
The Home page SHALL include schema.org JSON-LD describing the business as a `ProfessionalService` serving Denver, Colorado, with its founder as a `Person`, plus a `WebSite` entity.

#### Scenario: Home page entities
- **WHEN** the Home page's JSON-LD is parsed
- **THEN** it contains a `ProfessionalService` named "Elevation Code Works" with `url`, `areaServed` naming Denver, an `address` with locality Denver and region CO and no street address, and a `founder` `Person` named "Tejen Shrestha" with job title "Founder & CEO" and `sameAs` profile links

#### Scenario: Validation
- **WHEN** any page's JSON-LD is run through a schema.org validator
- **THEN** it reports no errors

### Requirement: Service and breadcrumb structured data
Each service page SHALL include a `Service` entity whose provider references the business, and every page other than Home SHALL include a `BreadcrumbList` matching its place in the navigation.

#### Scenario: Service page entities
- **WHEN** a service page's JSON-LD is parsed
- **THEN** it contains a `Service` with name, description, `areaServed` and a `provider` that references the business entity, and a `BreadcrumbList` of Home > Services > that service

### Requirement: Legacy URLs redirect permanently
URLs from the previous site SHALL redirect with HTTP 301 to their replacements.

#### Scenario: Old About page
- **WHEN** `/about.html` is requested
- **THEN** the response is a 301 redirect to the canonical About URL

### Requirement: Unknown paths return a real 404
A request for a path that does not exist SHALL return HTTP status 404 with a page that links to Home, Services, Work and Contact. That page is marked `noindex`.

#### Scenario: Mistyped URL
- **WHEN** a visitor requests `/servcies`
- **THEN** the response status is 404, the body links to Home, Services, Work and Contact, and the head contains a `noindex` robots meta tag
