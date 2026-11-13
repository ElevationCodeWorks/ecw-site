# Tasks

## 1. Guardrail and schema (design D1, D3)

- [x] 1.1 Make the `brand/banned-word` rule skip copy whose ancestors include `blockquote`, and update its row in the README's rules table. Verify with fixture tests that:
  - "seamlessly" inside a `blockquote` passes
  - the same word in the quote's `figcaption`, and in a paragraph outside the quote, each fail
  - every existing banned-word test still passes
- [x] 1.2 Add the optional `quote` object (`text`, `name`, `organization`, optional `role`, all non-empty) to the `work` schema. Render it in `src/pages/work/[slug].astro` after the Markdown body and before Results, as a `figure` holding a `blockquote` and a `figcaption` that reads `name, role, organization` (role left out when absent). Verify that a temporary case study whose quote has no `name` fails the build and names the entry, then delete the fixture

## 2. What Can I Do? copy (proposal, site-content spec)

- [x] 2.1 In `src/content/work/what-can-i-do.md`:
  - Add Conor Britain's quote, word for word, with `organization: Important, Not Important` and no role
  - Rewrite the role line, the "What I did" section and the search description to say Important, Not Important brought Tejen in for frontend work on the app, and that he suggested and built backend and dev-ops improvements that made it faster and more secure. They no longer claim he built the first version or launched it

  In `src/content/pages/work.md`, rewrite the search description so it no longer says every project was "built and launched". Verify:
  - `npm run build` passes, so the copy rules, title lengths and description lengths all hold
  - `dist/work/what-can-i-do/index.html` contains the quote in a `blockquote` and the caption "Conor Britain, Important, Not Important"
  - `grep -iE "first version|initial version|launch" src/content/work/what-can-i-do.md` finds nothing

## 3. Integration with the visual identity change (design D4)

- [x] 3.1 Re-capture `openspec/changes/visual-identity/structure-baseline.json` with `node scripts/structure-snapshot.ts capture`. Verify that:
  - the baseline diff contains only the What Can I Do? copy, the quote and the Work description
  - `npm test`, `npm run check:structure` and `openspec validate client-quote --strict` pass
  - axe passes on the case study in both schemes
- [ ] 3.2 Commit on `visual-identity` and push. Verify that the deploy preview shows the quote on `/work/what-can-i-do/`

## Workflow follow-up

- Archive this change once it's verified. It can go before `visual-identity`, since they modify different `brand-guardrails` requirements.
- If the owner confirms Conor Britain's title, add it as `role` on the quote.
