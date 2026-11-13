# Design

## Context

Motivation is in proposal.md. The facts that shape the approach:

- **Case study data** lives in `src/content/work/<slug>.md`, validated by the `work` schema in `src/content.config.ts`. The schema has no quote field. `src/pages/work/[slug].astro` renders the facts list, the screenshots, the Markdown body, then a Results section when there are outcomes, then the call to action.
- **The site check walks visible copy** through `copyTextNodes` in `integrations/site-check/html.ts`, which gives every text node its ancestor tags. The first-person-plural rule already skips text whose ancestors include `blockquote` or `q`. The banned-word rule skips nothing.
- **The `visual-identity` change is in flight** on the `visual-identity` branch. Its structure baseline must match the build that comps start from, and no comp has been built yet. Its planning docs promise that copy stays as Change 1 wrote it.

## Goals / Non-Goals

**Goals:**
- The quote renders as real quotation markup that the comps can style, with the attribution outside the quotation.
- A quote can't be published without a person's name and an organization.
- The banned-word exemption covers the client's words and nothing else.

**Non-Goals:**
- No quote component shared across pages. Only the case study template renders quotes.
- No change to the other copy rules. Banned phrases, em dashes and the rest still apply inside quotes. If a future quote trips one of them, that's a new decision.

## Decisions

### D1. An optional `quote` object on the `work` collection
```
quote?: { text: string; name: string; organization: string; role?: string }
```
- `text`, `name` and `organization` are required, non-empty strings, so a missing attribution fails the build and Astro's error names the entry.
- The text keeps the client's exact words. Paragraph breaks aren't needed for this quote, so `text` is one string.
- The attribution reads `name, role, organization`, skipping the role when it's absent: "Conor Britain, Important, Not Important".

**Alternative considered:** a quote in the Markdown body. The site check couldn't require an attribution, and the template couldn't place it consistently.

### D2. Markup: a figure with a blockquote and a caption
```html
<figure class="quote">
  <blockquote><p>…</p></blockquote>
  <figcaption>Conor Britain, Important, Not Important</figcaption>
</figure>
```
- It sits right after the Markdown body (the project and "What I did") and before Results, so it reads as the client's word on that work.
- No heading. A heading such as "What the client says" would be new copy, and the figure is clear without one.
- No quotation-mark glyphs or decorative quote icons in the markup. How the quote looks is the comps' job, held to the look review.

### D3. The banned-word rule skips text inside a blockquote
- The rule drops copy units whose ancestors include `blockquote`, the same test the first-person-plural rule uses.
- The `figcaption` is outside the `blockquote`, so the attribution is still checked, and so is everything else on the page.
- Inline `q` elements are not exempt. Unlike a blockquote in a captioned figure, an inline quote has no attribution the template enforces.

**Alternative considered:** an exception entry for the one line. Exception entries match a file and line in `dist/`, and every comp moves the line, so the entry would go stale on each restyle.

### D4. Landing it before the round 1 comps
- The change is implemented on the `visual-identity` branch, before any comp branch is cut, so every comp styles the real quote.
- The visual-identity structure baseline is re-captured once this lands. The new text, the changed role line and the new quote are then part of what every comp must leave unchanged.
- Its planning docs aren't edited. This change records the copy changes, and the baseline captures them.

**Archive order:** both this change and `visual-identity` modify `brand-guardrails`, but different requirements, so they can be archived in either order. Archiving this one first keeps the main specs current while the comps run.

## Risks / Trade-offs

- [A future quote carries a phrase the copy rules ban, such as "not just"] → The build fails. The owner then decides whether to extend the exemption.
- [The exemption lets marketing words onto a page inside any blockquote] → Quotes come only from the `quote` field, which requires a named person and organization. A blockquote added to Markdown by hand would also be exempt, so review covers that.
- [The client's title stays unknown] → The attribution is accurate without it. Adding a confirmed title is a one-line content change.
