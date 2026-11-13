# Spec Delta

## MODIFIED Requirements

### Requirement: Banned typefaces
Styles SHALL NOT reference these font families: Inter, Geist, Geist Mono, Space Grotesk, Instrument Serif, Fraunces, Playfair Display, Newsreader, JetBrains Mono, IBM Plex Mono, Roboto, Poppins, Open Sans, Lato, DM Sans, DM Serif Display, Plus Jakarta Sans, Manrope, Outfit, Sora, Bricolage Grotesque, Syne, Satoshi, General Sans, Cabinet Grotesk, Clash Display, Cormorant Garamond, Space Mono, Montserrat. A family whose name starts with a banned name is also banned.

#### Scenario: Banned family in a stack
- **WHEN** a stylesheet or token defines a font stack that includes "Inter"
- **THEN** the check fails and names the token or rule

#### Scenario: Variant of a banned family
- **WHEN** a font stack includes "Inter Tight" or "Roboto Slab"
- **THEN** the check fails and names the banned family it extends

### Requirement: Banned colors
Color tokens in either color scheme, and the colors in icon and symbol files, SHALL NOT be visually indistinguishable from the banned reference colors: Anthropic's brand palette, Claude's default cream and rust, the default AI indigo and violet, and the default AI dark navy. Warm off-white backgrounds, orange, rust or terracotta accents, and violet or purple accents are banned as categories.

#### Scenario: Near match to a reference color
- **WHEN** a color token's perceptual difference from any banned reference color is below the configured threshold
- **THEN** the check fails and names the token and the reference color it matches

#### Scenario: Warm off-white background
- **WHEN** a background token is a very light color with a warm, low-saturation hue
- **THEN** the check fails on that token

#### Scenario: Dark scheme on the default AI navy
- **WHEN** a dark-scheme background token is a near match to the default AI dark navy
- **THEN** the check fails and names the token and the scheme

#### Scenario: Violet accent
- **WHEN** any color token is a saturated violet, purple or magenta
- **THEN** the check fails on that token

#### Scenario: Standard blue is not violet
- **WHEN** a link token is a standard saturated blue such as the placeholder link blue
- **THEN** the violet category does not flag it

#### Scenario: Banned color in an icon file
- **WHEN** a generated icon or the logo symbol's source contains a banned color
- **THEN** the check fails and names the file

## ADDED Requirements

### Requirement: Portfolio sites are not echoed
Styles SHALL NOT use the typefaces of the showcased portfolio sites (whatcanido.earth, condies.fyi and uphillskico.com), and color tokens SHALL NOT match their primary brand colors. Those typefaces and colors SHALL be recorded in the check's reference lists.

#### Scenario: Portfolio typeface
- **WHEN** a font stack includes a typeface recorded for one of the portfolio sites, such as Chivo
- **THEN** the check fails and names the portfolio site

#### Scenario: Portfolio color
- **WHEN** a color token is a near match to a primary color recorded for one of the portfolio sites
- **THEN** the check fails and names the token and the portfolio site

### Requirement: No styled accent words in headings
Headings SHALL NOT set part of their text apart with italics, another typeface, another color, a highlight or an underline. Links, abbreviations, code, and decorative graphics hidden from assistive technology are allowed inside headings.

#### Scenario: Italic accent word
- **WHEN** a built page has a heading such as `<h1>Websites that <em>get found</em></h1>`
- **THEN** the check fails and names the page and the heading

#### Scenario: Styled span in a heading
- **WHEN** a heading contains a `span`, `mark`, `strong`, `b` or `i` element
- **THEN** the check fails and names the page and the heading

#### Scenario: Linked heading
- **WHEN** a heading's whole text is a link
- **THEN** the check does not flag it

### Requirement: No eyebrow labels
Styles SHALL NOT transform text to uppercase or all small caps, and SHALL NOT add letter spacing above 0.05em. These are the marks of eyebrow labels and tracked kickers. A specific use, such as a wordmark, needs an exception entry with a reason.

#### Scenario: Tracked uppercase label
- **WHEN** a style sets `text-transform: uppercase` or `letter-spacing: 0.1em`
- **THEN** the check fails and names the file, line and selector

#### Scenario: Small caps label
- **WHEN** a style sets `font-variant-caps: all-small-caps`
- **THEN** the check fails

### Requirement: No decorative backgrounds or glows
Styles SHALL NOT use gradients, blur filters, text shadows, shadows in a non-neutral color, or shadows with a blur radius above 24 pixels.

#### Scenario: Gradient blob
- **WHEN** a style sets a `radial-gradient`, `linear-gradient` or `conic-gradient` on any property
- **THEN** the check fails

#### Scenario: Colored glow
- **WHEN** a style sets a box shadow such as `0 0 40px` in a blue or violet color
- **THEN** the check fails

#### Scenario: Small neutral shadow
- **WHEN** a style sets a box shadow with a blur radius of 24 pixels or less in a neutral gray or black
- **THEN** the check does not flag it

### Requirement: No keyframe or scroll-driven animation
Styles SHALL NOT define keyframe animations or scroll-driven animations, except in the Home hero's own components, where an animation SHALL apply only when the visitor has no reduced-motion preference. Transitions SHALL last no longer than 250 milliseconds.

#### Scenario: Fade-up entrance
- **WHEN** a stylesheet outside the hero components defines `@keyframes` or sets `animation-timeline`
- **THEN** the check fails

#### Scenario: Hero animation for visitors who allow motion
- **WHEN** a hero component sets an animation inside `@media (prefers-reduced-motion: no-preference)`
- **THEN** the check does not flag it

#### Scenario: Hero animation without the reduced-motion guard
- **WHEN** a hero component sets an animation or a scroll-driven timeline outside that media query
- **THEN** the check fails and names the file and line

#### Scenario: Visitor prefers reduced motion
- **WHEN** a visitor whose system prefers reduced motion opens Home
- **THEN** no animation runs in the hero

#### Scenario: Short hover transition
- **WHEN** a style sets a 150-millisecond color transition
- **THEN** the check does not flag it

### Requirement: Logo symbol avoids clichéd motifs
The logo symbol SHALL NOT depict mountain peaks, upward arrows or chevrons, code brackets, a terminal prompt or cursor, a sparkle or four-point star, gears, lightbulbs, rockets, circuit traces, a hexagon badge, the Colorado flag's "C" or the state's outline. It SHALL NOT reproduce any official sign, highway shield or agency mark.

#### Scenario: Symbol option reviewed
- **WHEN** a logo symbol option is prepared for the owner
- **THEN** its look review records each banned motif as absent, or the option is withdrawn

### Requirement: Look review before the owner sees a comp
Before any comp, or the final identity, is shown to the owner, it SHALL be reviewed against the written look checklist. The result SHALL be recorded item by item, as pass or fail, with a note for every fail.

#### Scenario: Comp shared with the owner
- **WHEN** a comp's preview link is sent to the owner
- **THEN** a review record for that comp already lists every checklist item with its result

#### Scenario: Checklist item fails
- **WHEN** a comp fails a checklist item
- **THEN** the comp is fixed and reviewed again before it is shared, or the owner's acceptance of that fail is written into the record
