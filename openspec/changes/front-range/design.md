# Design

## Context

Motivation is in proposal.md. The facts that shape the approach:

- **The design system was ported from this site** (its `tokens.json` records `main@f84d59e`), so its component CSS matches the site's scoped styles rule for rule. The differences are the token values, the link underline color, the button's underline color, the footer band and the texture styles.
- **The site picks its scheme from the system preference.** The design system switches on `data-theme`. Token values are the same; only the selector differs.
- **Brand SVG files must be plain single-color vectors** (`identity/symbol-plain` rejects `pattern` elements and any fill but `currentColor` under `src/assets/brand/`), and components may not hold raw color values (`platform/raw-value`).

## Goals / Non-Goals

**Goals:**
- Every token value matches the design system exactly, in both schemes.
- The site check keeps every existing ban at its existing threshold.
- Copy, headings, links and structured data are untouched (`npm run check:structure`).

**Non-Goals:**
- Renaming the site's classes to the design system's `ecw-` names. The site's styles are scoped per component and already equivalent.
- New automated rules for the palette's usage notes ("never body text"). They stay review items.

## Decisions

### D1. `--color-accent` is an alias of `--color-red-rocks`
It is declared once, in `:root`, as `var(--color-red-rocks)`, as in the design system's tokens. The palette token carries both scheme values; the alias follows it. The contrast rule and the build-time token reader both resolve `var()` per scheme, so `--color-accent` on `--color-bg` is still measured in light and dark.

### D2. Strata is one Astro component with inline SVG, in two sizes
`StrataBand.astro` draws the design system's slabs with fills set by scoped classes that reference the palette tokens. Inline is what lets the fills follow the color scheme, and it keeps the pattern out of `src/assets/brand/`, where a `pattern` element would fail the symbol rule. It is `aria-hidden` and has no text, so the structure baseline doesn't move.

- **The band** (40px, 192px period) is the design system's markup unchanged. It is the footer's first child, at the full width of the window. The footer drops its own top rule: the band is the rule.
- **The seam** (8px, 384px period) is the same order of slabs with the long runs doubled and the slivers kept thin. It sits on Home between the work and the services, in the page container, with the same `--space-section` break above it as every other Home section. Every edge is a true diagonal, so it is smooth at any pixel density.

### D3. Terrace and Contour are left out
- **Terrace** was Home's divider at first, as the design system suggests. The owner found it pixelated and unprofessional (2026-11-24): its steps sit on a 4px grid, so at real size the band reads as pixel art. Five replacements were compared in the page, in both schemes: a seam of the footer's slabs, flat blocks on the column line, one long flight of benches at two weights, and Terrace redrawn with large benches. The seam was the only one that kept the band's color, read as deliberate, and tied the divider to the footer instead of adding a second, unrelated pattern.
- **Contour** is offered as a ground behind the hero drawing. Tried there, the lines ran behind the drawing's six small text labels and across its fine leader lines, and the plate read as cluttered next to the plain one; the system's own HeroStorefront preview doesn't use it either. No other place on the site fits its rules (never behind body copy, a table or a form).

Both stay in the design system until the owner decides what to do with them there.

### D4. The orange ban is unchanged; contrast pairs are added
The design system's guardrails record that every Front Range token passes the check's orange range and sits clear of the banned and portfolio reference colors. The build confirms it. A unit test now pins the four sandstone reds as passing and two terracottas as failing, so a later nudge to a red is caught. `contrastPairs` gains `--color-red-rocks`, `--color-flatiron`, `--color-ponderosa` and `--color-turquoise` on `--color-bg` at 3:1, the pairs the guardrails name.

### D5. Navigation and index links set their underline color
The design system says the current navigation link is underlined in the accent, but its stylesheet, like the site's, turns that underline on with the `text-decoration` shorthand, which resets the color to the text's. The site sets `text-decoration-color: var(--color-accent)` after the shorthand in the header navigation, the 404 page's index of links and the thanks page's link, so every link's rule is red as the system's prose intends. The call to action does the opposite on purpose: its underline stays in its own ink on the gold.

### D6. A work listing shows its whole screenshot
The listing used to crop every screenshot to 16:10 with `object-fit: cover`. That only crops from the top when a screenshot is taller than 16:10; none is. The What Can I Do? capture is 2.77:1, so the crop cut 42% off its sides, through the site's logo and its Join button, and Condies lost the first letter of its name. A plate now takes `max(16:10, the screenshot's own ratio)`: a wider screenshot keeps its shape, and a taller one would still be cropped from the top. Plates no longer share one height; each is whole.

The name's link gets an `::after` box laid exactly over the plate, so the picture is a way into the case study without a second link in the markup (the structure baseline and the tab order don't change) and the text beside it stays selectable. The list is ruled as the system's tables are: the first listing opens with the Red Rocks rule and a hairline divides each one after.

### D7. Home closes on the split, with copy from facts already on the site
The closing section is the hero in reverse: the heading in the narrow column, and the paragraph and the call to action in the wide one. It replaces the lone button under the services table. The page copy lives in `home.md` as `closing.heading` and `closing.text`; without it, Home falls back to the button alone.

The draft says three things the site already says elsewhere: a short message is enough (Contact), every message is read by the founder and answered within 48 hours (Contact, the thanks page), and custom software isn't always the answer (Tech checkup). It adds an `h2` to Home's outline.

### D8. Apostrophes are fixed in the source
Astro converts straight quotes in Markdown bodies and leaves front matter alone. The front matter and the three hard-coded headings on the service page now carry typographic characters themselves, so what is written is what renders. The copy rules already match both forms. No transform was added to the content schema: it would also rewrite metadata and structured data, where the plain source is easier to reason about.

### D9. What Can I Do? is captured narrower and denser
The 1440 by 520 capture was a thin strip (2.77:1). At 1024 wide, the narrowest width with the page's desktop layout, and clipped at 496 just above the "Starter Actions" heading, it is 2.06:1 and takes in the tops of the page's illustrations. It is captured at twice the pixel density (2048 pixels wide) because the case study shows it large. The capture script takes a slug so one site can be refreshed without re-capturing Condies, whose colors follow the weather.

## Risks / Trade-offs

- **Red link underlines in the dark scheme** are 4.5:1 on the ground, above the 3:1 a graphic needs; the words stay white.
- **The gold is 8.2 from Condies' yellow** on the check's scale, against a limit of 8. It is unchanged from Plate, but it is the closest token to any reference; re-sampling the portfolio could tip it.
