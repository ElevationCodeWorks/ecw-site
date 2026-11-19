# Spec Delta

## MODIFIED Requirements

### Requirement: Robots rules by environment
The site SHALL serve `/robots.txt`. A production build allows crawling and references the sitemap. Any other build disallows all crawling.

#### Scenario: Production robots
- **WHEN** `/robots.txt` is fetched from the production hostname
- **THEN** it allows all user agents and contains a `Sitemap:` line with the absolute sitemap URL

#### Scenario: Preview robots
- **WHEN** `/robots.txt` is fetched from any build made without the production setting, such as a local or test build
- **THEN** it disallows all paths for all user agents

## ADDED Requirements

### Requirement: One public hostname
The site SHALL be reachable for search engines and visitors only at the production hostname. Any other address the hosting platform serves the production build on SHALL redirect with HTTP 301 to the same path on the production hostname.

#### Scenario: Hosting platform's own address
- **WHEN** a page is requested from the hosting platform's default address for the app
- **THEN** the response is a 301 redirect to the same path on `https://elevationcode.works`
