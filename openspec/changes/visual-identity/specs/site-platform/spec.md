# Spec Delta

## MODIFIED Requirements

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
