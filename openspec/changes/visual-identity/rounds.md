# Comp rounds

The record of every comp shown to the owner and the owner's verdict (design D2 and D4). A comp reaches the owner only after its preview builds (so the site check passes), `npm run check:structure` is empty, and its look review below is filled in.

This repository is public, so this record names no employer.

## Owner decisions

- **2026-11-12:** approved the three round 1 sources in design D3 (Trailhead, Catalog and Letterhead) without changes.
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
| 1.A Trailhead | Colorado highway guide signs and Forest Service trailhead signs | Not built yet |
| 1.B Catalog | Industrial parts catalogs and hardware-store shelf tags | Not built yet |
| 1.C Letterhead | The copy's first-person letter voice and small-business stationery | Not built yet |
