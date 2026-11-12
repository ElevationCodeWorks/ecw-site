# Spec Delta

## Purpose

Automated checks that keep the Elevation Code Works site's copy and styling clear of the patterns that make a site read as AI-generated or as Claude's house style. The banned patterns are named explicitly, so each round of design iteration is held to the same line.

## ADDED Requirements

### Requirement: Check runs on every build
The guardrails check SHALL run as part of every site build and every local check command. Any violation fails the build, and each violation is reported with its file, line, the rule broken and the offending text.

#### Scenario: Violation blocks the build
- **WHEN** a build runs and any content or style file breaks a guardrail rule
- **THEN** the build fails and prints one line per violation with file, line, rule name and the matched text

#### Scenario: Clean build
- **WHEN** a build runs and no file breaks a rule
- **THEN** the check passes silently and the build continues

### Requirement: Banned marketing words
Page copy SHALL NOT use these words in any form: elevate, unlock, seamless, supercharge, effortless, game-changer, cutting-edge, empower, leverage (as a verb), synergy. The exact brand name "Elevation Code Works" is allowed.

#### Scenario: Pun on the brand name
- **WHEN** a page contains "elevate your business"
- **THEN** the check fails on the word "elevate"

#### Scenario: Brand name allowed
- **WHEN** a page contains "Elevation Code Works"
- **THEN** the check does not flag it

### Requirement: Banned copy patterns
Page copy SHALL NOT contain:
- "not just" or "isn't just" contrast constructions
- "In today's fast-paced" or "Whether you're"
- Buttons or links whose entire text is "Get Started" or "Learn More"
- Em dashes in headings, buttons, link text or the brand line

#### Scenario: Contrast cliche
- **WHEN** a page contains "It's not just a website, it's a growth engine"
- **THEN** the check fails on "not just"

#### Scenario: Em dash in a heading
- **WHEN** a heading contains an em dash
- **THEN** the check fails and names the heading

### Requirement: No decorative glyph labels
Headings, navigation, buttons and list markers SHALL NOT use emoji. Link text SHALL NOT end with an arrow character. Section labels SHALL NOT use "01 / 02 / 03" style numbering unless the content is an actual ordered sequence marked up as an ordered list.

#### Scenario: Emoji bullets
- **WHEN** a list uses emoji such as a check mark emoji as its markers
- **THEN** the check fails

#### Scenario: Numbered section eyebrow
- **WHEN** a section label reads "01 / Services" outside an ordered list
- **THEN** the check fails

### Requirement: Banned typefaces
Styles SHALL NOT reference these font families: Inter, Geist, Geist Mono, Space Grotesk, Instrument Serif, Fraunces, Playfair Display, Newsreader, JetBrains Mono, IBM Plex Mono, Roboto, Poppins, Open Sans, Lato.

#### Scenario: Banned family in a stack
- **WHEN** a stylesheet or token defines a font stack that includes "Inter"
- **THEN** the check fails and names the token or rule

### Requirement: Monospace only for code
Monospace typefaces SHALL be used only for code, keyboard input and sample output elements, never for labels, eyebrows, navigation or headings.

#### Scenario: Monospace eyebrow label
- **WHEN** a style applies a monospace font to an element that is not code, keyboard input or sample output
- **THEN** the check fails

### Requirement: Banned colors
Color tokens SHALL NOT be visually indistinguishable from the banned reference colors. These include Anthropic's brand palette, Claude's default cream and rust, and the default AI indigo and violet. Warm off-white backgrounds and orange, rust or terracotta accent hues are banned as categories.

#### Scenario: Near match to a reference color
- **WHEN** a color token's perceptual difference from any banned reference color is below the configured threshold
- **THEN** the check fails and names the token and the reference color it matches

#### Scenario: Warm off-white background
- **WHEN** a background token is a very light color with a warm, low-saturation hue
- **THEN** the check fails on that token

### Requirement: Banned visual effects
Styles SHALL NOT use:
- Gradient-filled text
- Backdrop blur
- Grain or noise overlays
- Custom cursors
- Pill-shaped buttons or links, i.e. a radius of half the height or more

#### Scenario: Gradient text
- **WHEN** a style clips a background gradient to text
- **THEN** the check fails

#### Scenario: Frosted-glass navigation
- **WHEN** a style applies a backdrop blur to any element
- **THEN** the check fails

#### Scenario: Noise texture
- **WHEN** an SVG or style uses a turbulence or noise filter, or a noise image as a background
- **THEN** the check fails

### Requirement: Exceptions are explicit and justified
A waiver SHALL apply to one specific file and line, and SHALL be recorded as an exception list entry that names the rule and gives a written reason. Entries without a reason, or that no longer match anything, fail the check.

#### Scenario: Exception without reason
- **WHEN** the exception list contains an entry with an empty reason
- **THEN** the check fails and names the entry

#### Scenario: Stale exception
- **WHEN** an exception entry no longer matches any violation
- **THEN** the check fails and asks for the entry to be removed
