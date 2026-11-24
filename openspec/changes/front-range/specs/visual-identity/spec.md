# Spec Delta

## ADDED Requirements

### Requirement: Textures are flat vector decoration
Textures SHALL be vector patterns drawn in solid palette token colors with hard edges, with no gradient, blur, grain or raster image, and SHALL follow the color scheme. They SHALL be hidden from assistive technology and SHALL NOT carry text or information. Every edge SHALL be a straight vector edge that stays smooth at any pixel density. A page SHALL show at most one Strata band and at most one Strata seam, and the two SHALL NOT sit directly one after the other.

#### Scenario: Footer band
- **WHEN** any page is loaded
- **THEN** a Strata band runs across the top of the footer at the full width of the window, and the footer has no other top rule

#### Scenario: Home divider
- **WHEN** Home is loaded
- **THEN** a Strata seam, the band's slabs as a line 8 CSS pixels tall, divides the work from the services

#### Scenario: Texture in the dark scheme
- **WHEN** a page with a texture is shown with the dark scheme active
- **THEN** every fill in the texture takes its palette token's dark-scheme value

#### Scenario: Read by a screen reader
- **WHEN** a screen reader reads a page with a texture
- **THEN** it announces nothing for the texture

#### Scenario: Restyle check
- **WHEN** the structure check compares a build with textures against the baseline
- **THEN** it reports no difference

### Requirement: Work listings show whole screenshots
A work listing SHALL show the full width of its screenshot. A screenshot taller than 16:10 SHALL be cropped from the top to that shape; a wider one SHALL keep its own shape. The screenshot SHALL open the case study, as the project's name does, without adding a second link to the page.

#### Scenario: Wide screenshot
- **WHEN** a listing's screenshot is wider than 16:10
- **THEN** the listing shows it uncropped, from its left edge to its right

#### Scenario: Pointing at the screenshot
- **WHEN** a visitor clicks or taps a listing's screenshot
- **THEN** the project's case study opens

#### Scenario: Keyboard and screen reader
- **WHEN** a visitor tabs through a listing or reads it with a screen reader
- **THEN** the listing has one link, the project's name
