# Spec Delta

## MODIFIED Requirements

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

#### Scenario: Sandstone red is not orange
- **WHEN** a palette token is the Red Rocks red or the Flatiron red, in either scheme
- **THEN** the orange category and the reference comparison do not flag it

#### Scenario: A red drifts toward terracotta
- **WHEN** a red token is changed to a color inside the orange category, or within the configured threshold of a reference rust or clay
- **THEN** the check fails on that token
