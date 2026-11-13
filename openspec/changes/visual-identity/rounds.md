# Comp rounds

The record of every comp shown to the owner and the owner's verdict (design D2 and D4). A comp reaches the owner only after its preview builds (so the site check passes), `npm run check:structure` is empty, and its look review below is filled in.

This repository is public, so this record names no employer.

## Owner decisions

- **2026-11-12:** approved the three round 1 sources in design D3 (Trailhead, Catalog and Letterhead) without changes.
- **2026-11-13:** chose Catalog in round 1, with changes (see 1.B).
- **2026-11-12:** dropped the trail-rating marks (design D9). A fixed size per service could set the wrong expectations, since a project's scope depends on the client.

## Template

Copy this block for each comp.

```markdown
### <Round>.<letter> <Name>

- **Branch and PR:** `comp/r<round>-<slug>`, #<number> (draft)
- **Preview:** https://deploy-preview-<number>--elevationcodeworks.netlify.app
- **Source:** <the approved source material>
- **Typefaces:** <families, all OFL, with the Fontsource versions>
- **Primary color:** <token and value, light and dark>
- **Layout structure:** <what sets it apart from the other comps>
- **Distance from the AI defaults:** <SaaS, Claude editorial, dev brutalist, dark neon>
- **Symbol idea:** <one line>
- **Site check:** <preview build passed / failed>
- **Structure check:** <`npm run check:structure` empty, or the differences and why>
- **Exceptions:** <site-check exception entries added, with reasons, or none>

| # | Look checklist item (README "Look review") | Result | Note |
| --- | --- | --- | --- |
| 1 | Centered hero with headline, subhead and two buttons | | |
| 2 | Three-up feature grid with icons in tinted tiles | | |
| 3 | Large rounded cards with soft shadows as the main container | | |
| 4 | Bento grids | | |
| 5 | Logo cloud or "trusted by" strip | | |
| 6 | Row of big unsourced numbers | | |
| 7 | Every section the same width and rhythm, centered headings | | |
| 8 | Dark navy or near-black hero with a bright accent | | |
| 9 | Blob or flat-vector people, stock photos, AI images | | |
| 10 | Sparkle icon for anything AI | | |
| 11 | Check marks in colored circles as bullets | | |
| 12 | Eyebrow label above a heading, in any styling | | |
| 13 | Echoes a portfolio site | | |
| 14 | Looks like a template a tool would produce | | |

- **Owner verdict:** <date: chosen / rejected / changes requested, with notes>
```

## Round 1: three directions

Sources approved on 2026-11-12. Each comp must differ from the others in typeface family, primary color and layout structure (design D3).

| Comp | Source | Status |
| --- | --- | --- |
| 1.A Trailhead | Colorado highway guide signs and Forest Service trailhead signs | Not chosen |
| 1.B Catalog | Industrial parts catalogs and hardware-store shelf tags | **Chosen** |
| 1.C Letterhead | The copy's first-person letter voice and small-business stationery | Not chosen |

**How the three differ (design D3):**

| | Trailhead | Catalog | Letterhead |
| --- | --- | --- | --- |
| Typeface family | Overpass | Archivo Narrow and Archivo | Bitter |
| Primary color | Sign green | Black ink with a yellow fill | Blue-black ink with stamp red |
| Layout structure | Full-width green bands, panel labels, a three-up work row | Catalog listings, spec rows and spec tables | One reading column, letterhead header |

### 1.A Trailhead

- **Branch and PR:** `comp/r1-trailhead`, #3 (draft)
- **Preview:** https://deploy-preview-3--elevationcodeworks.netlify.app
- **Source:** Colorado highway guide signs and Forest Service trailhead signs. Color and type only.
- **Typefaces:** Overpass (`@fontsource/overpass` and `@fontsource-variable/overpass` 5.3.0), one 39 KB variable file, with a metric-matched Arial fallback.
- **Primary color:** `--color-accent` sign green, `#006b3c` light and `#0f7a48` dark, with white type on it (6.6:1).
- **Layout structure:** full-width sign-green bands for the header and footer; service names on small green panels in a two-column list; work as a three-up row of screenshots, each with a green rule above the role.
- **Distance from the AI defaults:** no Inter, no indigo, no cards or gradients (SaaS); pure white, a sans and no italics (Claude editorial); proportional type, no grid lines (dev brutalist); a muted green on a light page (dark neon).
- **Symbol idea:** a double trail blaze, two painted marks offset down and to the right, the way trail markers show a turn.
- **Site check:** passes; the preview built on Netlify.
- **Structure check:** empty.
- **Exceptions:** none.

| # | Look checklist item (README "Look review") | Result | Note |
| --- | --- | --- | --- |
| 1 | Centered hero with headline, subhead and two buttons | Pass | Left-aligned headline and lede with one button. |
| 2 | Three-up feature grid with icons in tinted tiles | Pass | The three-up row is real work screenshots, with no icons or tinted tiles. |
| 3 | Large rounded cards with soft shadows as the main container | Pass |  |
| 4 | Bento grids | Pass |  |
| 5 | Logo cloud or "trusted by" strip | Pass |  |
| 6 | Row of big unsourced numbers | Pass |  |
| 7 | Every section the same width and rhythm, centered headings | Pass | Sections share the container width, but their rhythm differs (a three-up row, then a two-column panel list), and headings are left-aligned. |
| 8 | Dark navy or near-black hero with a bright accent | Pass | No dark hero in the light scheme. In the dark scheme the whole page follows the visitor's setting: a near-black with a trace of green, never navy, and a muted sign green, not neon. |
| 9 | Blob or flat-vector people, stock photos, AI images | Pass |  |
| 10 | Sparkle icon for anything AI | Pass |  |
| 11 | Check marks in colored circles as bullets | Pass |  |
| 12 | Eyebrow label above a heading, in any styling | Pass |  |
| 13 | Echoes a portfolio site | Pass | Condies' forecast panel can turn green, but a light mint in a different typeface. The site check finds no portfolio font or color. |
| 14 | Looks like a template a tool would produce | Pass | The green header and footer bands are conventional on their own; the service names on green sign panels carry the identity. |

**Symbol motif review:** mountain peaks, upward arrows or chevrons, code brackets, a terminal prompt or cursor, a sparkle or four-point star, gears, lightbulbs, rockets, circuit traces, a hexagon badge, the Colorado flag's "C", the state's outline, and official signs, highway shields or agency marks are all absent. The marks step down and to the right, so they don't read as rising steps or an arrow.

- **Owner verdict:** 2026-11-13: not chosen. PR #3 and its branch are still open, waiting on the owner's OK to close and delete them.

### 1.B Catalog

- **Branch and PR:** `comp/r1-catalog`, #4 (draft)
- **Preview:** https://deploy-preview-4--elevationcodeworks.netlify.app
- **Source:** industrial parts catalogs and hardware-store shelf tags.
- **Typefaces:** Archivo Narrow for headings and Archivo for text (`@fontsource/archivo`, `@fontsource-variable/archivo`, `@fontsource/archivo-narrow` and `@fontsource-variable/archivo-narrow` 5.3.0), two variable files, 53 KB, with metric-matched Arial fallbacks.
- **Primary color:** black ink (`--color-accent` `#0a0a0a` light, `#f2f2f2` dark) with one high-visibility yellow, `--color-highlight` `#ffdd00`, used only as a fill behind black text (15.6:1).
- **Layout structure:** a white header over a heavy ink rule; work as catalog listings, the screenshot beside the details; services and service-page sections as ruled spec rows with the label on the left; case-study facts as a spec table.
- **Distance from the AI defaults:** no indigo or gradients (SaaS); no serif, cream or terracotta (Claude editorial); proportional type and ruled rows, not monospace on a grid (dev brutalist); a white page with one yellow fill (dark neon).
- **Symbol idea:** a shelf tag with a punched hole.
- **Site check:** passes; the preview built on Netlify.
- **Structure check:** empty.
- **Exceptions:** none. The yellow has no contrast pair in the config, because it never carries text by itself; black on it measures 15.6:1.

| # | Look checklist item (README "Look review") | Result | Note |
| --- | --- | --- | --- |
| 1 | Centered hero with headline, subhead and two buttons | Pass |  |
| 2 | Three-up feature grid with icons in tinted tiles | Pass | Work is a list of rows, not a grid of tiles. |
| 3 | Large rounded cards with soft shadows as the main container | Pass |  |
| 4 | Bento grids | Pass |  |
| 5 | Logo cloud or "trusted by" strip | Pass |  |
| 6 | Row of big unsourced numbers | Pass |  |
| 7 | Every section the same width and rhythm, centered headings | Pass | Rows, spec tables and listings vary the rhythm; headings are left-aligned. |
| 8 | Dark navy or near-black hero with a bright accent | Pass | The light scheme is white. In the dark scheme the visitor's setting turns the page near-black and the yellow stays a small fill on the current nav item and the buttons. The owner may want to judge this one. |
| 9 | Blob or flat-vector people, stock photos, AI images | Pass |  |
| 10 | Sparkle icon for anything AI | Pass |  |
| 11 | Check marks in colored circles as bullets | Pass |  |
| 12 | Eyebrow label above a heading, in any styling | Pass |  |
| 13 | Echoes a portfolio site | Pass, closest call | The site check passes, but the yellow sits only 9.9 from Uphill Ski CO's gold and 8.2 from Condies' yellow (the limit is 8). The owner should judge whether it echoes Uphill's gold. |
| 14 | Looks like a template a tool would produce | Pass | Black, white and yellow is a known industrial look, but it is set in proportional type with ruled rows rather than the monospace-on-a-grid of dev brutalism. |

**Symbol motif review:** every banned motif is absent. A tag can read as a generic price-tag icon, which the owner may weigh.

- **Owner verdict:** 2026-11-13: **chosen**, with changes for round 2:
  - The yellow fill on hovered links doesn't look good.
  - The thick horizontal rules don't look good.
  - Overall it's too plain. It needs an artistic element, as if a graphic designer with a strong artistic background made it, and a nicer hero section.

### 1.C Letterhead

- **Branch and PR:** `comp/r1-letterhead`, #5 (draft)
- **Preview:** https://deploy-preview-5--elevationcodeworks.netlify.app
- **Source:** the copy's first-person letter voice and small-business stationery.
- **Typefaces:** Bitter (`@fontsource/bitter` and `@fontsource-variable/bitter` 5.3.0), a sturdy slab, one 34 KB variable file, with a metric-matched Georgia fallback.
- **Primary color:** blue-black ink `#1b3a6b` on pure white (11.3:1), with one stamp red, `--color-accent` `#a51c30` light and `#e06473` dark.
- **Layout structure:** the whole site narrows to one 42 rem reading column; the header is a letterhead (name and stamp, navigation beneath, a thin stamp-red rule); work and services are single-column entries; the call to action and the send button are stamped outlines.
- **Distance from the AI defaults:** no indigo, cards or gradients (SaaS); see item 14 for Claude editorial; no monospace (dev brutalist); a white page (dark neon).
- **Symbol idea:** a postage stamp with notched perforations.
- **Site check:** passes; the preview built on Netlify.
- **Structure check:** empty.
- **Exceptions:** none.

| # | Look checklist item (README "Look review") | Result | Note |
| --- | --- | --- | --- |
| 1 | Centered hero with headline, subhead and two buttons | Pass | The headline sits left-aligned in the reading column, with one button. |
| 2 | Three-up feature grid with icons in tinted tiles | Pass |  |
| 3 | Large rounded cards with soft shadows as the main container | Pass |  |
| 4 | Bento grids | Pass |  |
| 5 | Logo cloud or "trusted by" strip | Pass |  |
| 6 | Row of big unsourced numbers | Pass |  |
| 7 | Every section the same width and rhythm, centered headings | Pass | Every section shares one width on purpose, as a letter does. Headings are left-aligned, and the rhythm varies between the work entries and the ruled service list. |
| 8 | Dark navy or near-black hero with a bright accent | Pass |  |
| 9 | Blob or flat-vector people, stock photos, AI images | Pass |  |
| 10 | Sparkle icon for anything AI | Pass |  |
| 11 | Check marks in colored circles as bullets | Pass |  |
| 12 | Eyebrow label above a heading, in any styling | Pass | No labels above headings, and no small caps. |
| 13 | Echoes a portfolio site | Pass |  |
| 14 | Looks like a template a tool would produce | Pass, checked hardest | This is the direction closest to Claude's editorial look, so each of its tells was checked: pure white, not cream; a sturdy slab, not a light display serif; a stamp crimson at hue 20°, not terracotta or clay; no italic accents; no monospace labels. |

**Symbol motif review:** every banned motif is absent. The stamp is a notched square frame, not a badge or a hexagon.

**Left out:** the plan's founder photo and signature on Home and About. Home has no founder photo, and adding one (or a signature) would add content, which a comp may not do. About keeps its photo.

- **Owner verdict:** 2026-11-13: not chosen. PR #5 and its branch are still open, waiting on the owner's OK to close and delete them.
