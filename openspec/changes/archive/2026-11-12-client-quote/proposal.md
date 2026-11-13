# Proposal

## Why

The owner has the site's first client testimonial, from Conor Britain at Important, Not Important, who runs the What Can I Do? app. A named client's words are the strongest proof the site can offer, and they belong on the case study they describe.

The quote also describes the engagement differently from the case study. Conor says Tejen stepped in to implement frontend tasks on their app, then suggested and built backend and dev-ops features that made it faster and more secure. The case study says Tejen was contracted to build the first version and launch it. The owner decided (2026-11-12) that the case study should match the client's account, so a reader doesn't see two versions of the same work.

## What Changes

- **A client quote on the What Can I Do? case study,** shown verbatim and attributed "Conor Britain, Important, Not Important". His exact title isn't known, so none is shown until the owner confirms one.
- **Case studies can carry a quote.** The `work` collection gains an optional quote with its text, the person's name, their organization and, when known, their role. A quote must have a name and an organization, or the build fails.
- **The banned-word check skips attributed quotations.** "seamlessly" is banned in the site's own copy, but it's the client's word, and a quote is never edited. The first-person-voice rule already skips quotes the same way.
- **The What Can I Do? copy matches the client's account.** The role line, the "What I did" section and the page's search description say Tejen was brought in for frontend work on the app and suggested and built backend and dev-ops improvements that made it faster and more secure. They no longer claim he built the first version or launched it. The Work page's search description stops saying every project was "built and launched".

**Out of scope:**
- Quotes on Home or other pages. The owner can add them later.
- Conor's title. The attribution leaves it out until the owner confirms it.
- The other deferred What Can I Do? inputs: a sourced result and more detail on the work.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `site-content`: the "Case studies" requirement's description of the What Can I Do? engagement changes to match the client's account, and a new requirement covers client quotes: verbatim, marked up as a quotation, attributed to a named person and organization.
- `brand-guardrails`: the "Banned marketing words" requirement exempts quotations attributed to someone else.

## Impact

- **Content:** `src/content/work/what-can-i-do.md` (quote, role, "What I did", search description) and `src/content/pages/work.md` (search description).
- **Code:**
  - `src/content.config.ts`: the optional `quote` on the `work` collection
  - `src/pages/work/[slug].astro`: renders the quote as a figure with a blockquote and a caption
  - `integrations/site-check/rules/brand-copy.ts`: the banned-word rule skips text inside a blockquote
  - the README's rules table
- **Visual identity change:** this lands on the `visual-identity` branch before the round 1 comps, so each comp styles a real quote. The structure baseline (`openspec/changes/visual-identity/structure-baseline.json`) is re-captured afterwards.
- **Owner inputs:** none new. The quote, the attribution and the copy direction are decided.
