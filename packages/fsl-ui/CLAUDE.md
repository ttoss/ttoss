# CLAUDE.md — `@ttoss/fsl-ui`

Loads on demand when a file in this package is read. It carries one rule that the
package's own history earned; everything else about modifying this package safely
lives in `CONTRIBUTING.md` (ADRs, contract invariants, the evidence rule) and
`INTERNAL/ROADMAP.md` (scope, sequencing, the authority table).

## Read the design documentation before deciding anything

This package consumes a token system that is **already documented and already
opinionated**. `docs/website/docs/design/design-system/design-tokens/` is not
reference material to reach for when stuck — it is the starting position for any
question about colour, geometry, responsiveness or token grammar.

The rule exists because it was broken. During forms item C, three questions were
escalated as owner decisions. Reading the design docs afterwards showed that
**two were already decided in writing**, with the tokens already shipped:

- "Can a component paint nothing?" — `families/colors.md` states that `muted` is
  the idiom for "no fill" and is _deliberately_ an opaque surface-coloured token
  rather than `transparent`, so every semantic background stays a verifiable value
  and the contrast guarantees remain computable.
- "How is an invalid input coloured?" — `families/colors.md` states that valence
  dominates emphasis whenever a token communicates **validity**, and names
  `input.negative.border.focused` by hand. The theme ships `input.negative` with
  all three dimensions and a border cascade.

A friction entry (F-032) was filed claiming the theme lacked an ink that exists at
`input.negative.text.default`. Nothing in the reasoning was wrong; the reading was
missing.

**So: answer from the docs, then measure, then decide — and escalate only what
survives all three.** When the docs and a measurement disagree, that is a finding
worth writing down, not a licence to substitute your own model. `model.md` §11
fixes the order when artefacts conflict: FSL Lexicon → `Types.ts` → family docs.

`INTERNAL/ROADMAP.md` → "Before deciding anything — read the authorities first"
maps each recurring question to the document that already answers it. Start there.

## Two traps that section exists to prevent

- **"The theme has no token for this."** Check the theme, not the components. A
  token that nothing reads looks identical to a token that does not exist.
- **"The contrast suite will catch it."** Only in one direction. Both pair
  extractors in `packages/fsl-theme/tests/unit/tests/theme/families/colors.test.ts`
  iterate over what exists and skip when the counterpart is absent — so _removing_
  a colour token silently drops its pairings and the suite stays green. Any change
  that deletes a colour owes an explicit replacement assertion.
