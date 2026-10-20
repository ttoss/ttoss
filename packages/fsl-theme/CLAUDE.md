# CLAUDE.md — `@ttoss/fsl-theme`

Loads on demand when a file in this package is read. It carries one rule that the
package's own history earned; everything else about modifying this package safely
lives in `CONTRIBUTING.md` (ADR workflow, divergence protocol, family specs).

## What a comment may assert

A comment has no oracle: nothing fails when it goes stale. This package's comments
are dense with resolved values — pixel heights, contrast ratios, coverage
percentages — so the failure mode is specific and it has already happened four
times in one session. Three rules, in the order you will need them:

- **A fact some check already reports belongs in the check, not copied beside it.**
  Coverage percentages are printed by `pnpm run test` on every run; contrast ratios
  are computed by `tests/unit/tests/theme/families/colors.test.ts`. Name the command
  or the test instead of pasting its output — a pasted number cannot fail, while the
  printed one cannot drift. `git log -p` keeps the historical snapshot.
- **A fact nothing reports belongs in the comment, with the conditions that produced
  it.** A measured design relationship — "40px against a field's 34px at 1920×1080,
  40px against 32.5px at 900px" — has no automated reporter, so the comment is its
  only home. State the viewport, theme, or container width that produced it, because
  this theme's scales are container-fluid and a bare figure is wrong at every other
  width.
- **Never enumerate membership.** Not "the command silhouette (`Button`,
  `ToggleButton`)", not "membership changed twice". Name the axis, or the grep that
  answers it. A list is stale the moment membership moves — and this package cannot
  even see its consumers, so it can never be told. A count buys nothing the reason
  does not already say.

Worked examples of each failure, with the evidence that caught them: `git log
--grep=Guardian`.

## Architectural changes

Before proposing architectural changes, consult `CONTRIBUTING.md` for the ADR workflow and review protocol. When code diverges from a spec or "obvious best practice", treat it as **evidence of an unstated invariant** — not a bug — until proven otherwise. Investigate before changing.

Documentation artifacts are orthogonal: JSDoc answers "how do I use this right now?"; `README.md` answers "how do I integrate it?"; `CONTRIBUTING.md` answers "how do I modify it safely?"; `CHANGELOG.md` answers "what changed?".

Test-writing decisions follow `.github/instructions/fsl-tests.instructions.md`.
