# Spec Delta

## Purpose

Defines the look the Elevation Code Works site presents: its color schemes and contrast, typefaces and how they load, wordmark, logo symbol and site icons, and the imagery it may use.

## ADDED Requirements

### Requirement: Light and dark color schemes
The site SHALL present a light and a dark color scheme, and SHALL choose between them from the visitor's system preference, with no script and no manual toggle. Every color token SHALL have a value in both schemes.

#### Scenario: System set to dark
- **WHEN** a visitor whose system prefers a dark appearance opens any page
- **THEN** the page renders in the dark scheme, including native form controls and scrollbars

#### Scenario: System set to light or no preference
- **WHEN** a visitor whose system prefers a light appearance, or states no preference, opens any page
- **THEN** the page renders in the light scheme

#### Scenario: Token missing a dark value
- **WHEN** a color token has a light-scheme value and no dark-scheme value, or the reverse
- **THEN** the site check fails and names the token

### Requirement: Contrast holds in both schemes
In both color schemes, body text SHALL have a contrast ratio of at least 4.5:1 against its background. Large text, form control boundaries, focus indicators and meaningful graphics SHALL have at least 3:1.

#### Scenario: Token pair below its ratio
- **WHEN** a text, border, focus or graphic color token falls below its required ratio against a background token it is used on, in either scheme
- **THEN** the site check fails and names both tokens, the scheme, the measured ratio and the required ratio

#### Scenario: Dark-scheme audit
- **WHEN** the automated accessibility audit runs on every page with the dark scheme active
- **THEN** it reports no contrast violations

### Requirement: Typefaces are open-licensed and self-hosted
Web fonts SHALL be released under the SIL Open Font License or another license that permits free web embedding, and SHALL be served from the site's own origin. Each family's license text SHALL be kept in the repository next to its font files.

#### Scenario: No third-party font requests
- **WHEN** any page is loaded
- **THEN** every font file it requests comes from the site's own origin

#### Scenario: Font without its license
- **WHEN** a font family's files are present without a license file beside them
- **THEN** the site check fails and names the family

### Requirement: Fonts stay within budget
The site SHALL use at most two web font families and at most four font files. The font files a page requests SHALL total no more than 150 KB.

#### Scenario: A third family is added
- **WHEN** the tokens declare a third web font family, a fifth font file, or font files over 150 KB in total
- **THEN** the site check fails and states the count or size against its limit

### Requirement: Text renders before fonts arrive
Text SHALL render immediately in a fallback face whose metrics are adjusted to match the web font, so the swap to the web font causes no noticeable layout shift.

#### Scenario: Slow connection
- **WHEN** a page loads on a simulated slow 4G connection
- **THEN** text is visible before the web fonts finish loading, and Cumulative Layout Shift stays at 0.1 or less

### Requirement: Wordmark is live text
The header SHALL show the brand name "Elevation Code Works" as live text set in the brand typeface, linked to Home. The wordmark MUST NOT be an image of text.

#### Scenario: Read without styles
- **WHEN** a page is read by a screen reader or loaded without CSS
- **THEN** the header contains a link to Home whose text is "Elevation Code Works"

### Requirement: Logo symbol works at every size and in both schemes
The site SHALL have one logo symbol: a single-color vector drawing that inherits the color of its context and stays recognizable at 16 CSS pixels. Where it sits beside the wordmark it SHALL be hidden from assistive technology.

#### Scenario: Symbol in the dark scheme
- **WHEN** the symbol is shown with the dark scheme active
- **THEN** it takes the dark-scheme color of its context and meets 3:1 contrast against the background

#### Scenario: Symbol source is plain vector
- **WHEN** the symbol's source file contains a gradient, a filter, an embedded raster image, a text element or more than one fill color
- **THEN** the site check fails and names the file

#### Scenario: Symbol beside the wordmark
- **WHEN** a screen reader reaches the header
- **THEN** it announces the wordmark link once and does not announce the symbol separately

### Requirement: Site icons come from the symbol
Every page SHALL reference a 32-pixel favicon, a scalable icon that switches to dark-scheme colors under a dark system preference, and a 180-pixel touch icon. All three SHALL be drawn from the logo symbol with colors taken from the tokens.

#### Scenario: Legacy favicon request
- **WHEN** a browser requests `/favicon.ico`
- **THEN** the response is a 32-pixel image and not a 404

#### Scenario: Browser tab in dark mode
- **WHEN** the scalable icon is displayed by a browser whose system prefers dark
- **THEN** it uses the dark-scheme colors

### Requirement: Imagery is real
Images SHALL be screenshots of real work, photos of the founder supplied by the owner, generated social images, or hand-authored vector graphics such as the logo symbol. Stock photos, AI-generated images and illustrations of people MUST NOT be used.

#### Scenario: Unapproved image added
- **WHEN** an image file is added that is not a work screenshot, a founder photo, a generated social image or a hand-authored vector graphic
- **THEN** the site check fails and names the file, unless an exception entry records the image's source and reason

### Requirement: Restyling leaves content and structure unchanged
Applying the identity SHALL change presentation only. Page copy, heading outlines, link targets, the order of sections on Home, and structured data SHALL stay the same.

#### Scenario: Before and after the identity
- **WHEN** the visible text, heading outline, links and JSON-LD of every page are compared between the placeholder build and the identity build
- **THEN** they are identical
