# Spec Delta

## MODIFIED Requirements

### Requirement: Social link previews
Every indexable page SHALL provide Open Graph and Twitter card metadata: title, description, absolute URL, type, a 1200x630 image with alt text, and a large-image card type. Each indexable page SHALL have its own image that shows the page's title, and its alt text SHALL describe that image.

#### Scenario: Link shared in a chat app
- **WHEN** a page's metadata is read by a link-preview service
- **THEN** it finds `og:title`, `og:description`, `og:url`, `og:type`, `og:image`, `og:image:alt`, `og:site_name` set to "Elevation Code Works", and `twitter:card` set to `summary_large_image`

#### Scenario: Each page has its own image
- **WHEN** the metadata of any two indexable pages is compared
- **THEN** their `og:image` URLs differ, and each URL returns a 1200x630 PNG showing that page's title

#### Scenario: Image follows the content
- **WHEN** a page's title changes and the site is rebuilt
- **THEN** that page's social image shows the new title, with no separate step to regenerate it

#### Scenario: Missing image
- **WHEN** an indexable page's `og:image` points to a file that the build did not produce, or one that is not 1200x630
- **THEN** the site check fails and names the page
