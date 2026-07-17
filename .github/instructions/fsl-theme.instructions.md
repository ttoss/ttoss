---
description: Instructions for working on the @ttoss/fsl-theme package — documentation discipline, ADR workflow, and review protocol
applyTo: '**/packages/fsl-theme/**/*'
---

# fsl-theme Package Instructions

The `@ttoss/fsl-theme` package is governed by trade-offs that have already
been decided. Before proposing architectural changes, follow the workflow
documented in the artifacts below.

## Where to look

Each artifact answers exactly **one** question. Read the artifact whose
question matches your task; do not duplicate content across them.

| Artifact                                                                                   | Answers                                                                                                                                                       |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **JSDoc in code**                                                                          | _How do I use this symbol right now?_                                                                                                                         |
| [`README.md`](../../packages/fsl-theme/README.md)                                          | _What is this package and how do I integrate it?_                                                                                                             |
| [`CONTRIBUTING.md`](../../packages/fsl-theme/CONTRIBUTING.md)                              | _How do I modify the package without breaking it?_ — including the ADRs that explain why each invariant exists                                                |
| [`CHANGELOG.md`](../../packages/fsl-theme/CHANGELOG.md)                                    | _What changed between releases and how do I migrate?_                                                                                                         |
| [`docs/.../design-system/index.md`](../../docs/website/docs/design/design-system/index.md) | _What are the foundational concepts (FSL, token model, families, components)?_ — see its **Document Map** to jump to the exact spec without reading siblings. |

The ADR workflow, review protocol, and placement rules live inside the
`Decisions (ADRs)` section of `CONTRIBUTING.md` — consult it before
proposing architectural changes.

For any question about FSL, token grammar, family contracts, modes, or
governance, **start at the Design System Document Map** and open only the
one file whose row matches the question. Do not bulk-read the docs folder.

## Writing — Basis Form

All documentation produced for this package (ADRs, JSDoc, README sections, ISSUES entries) **must** follow the [Writing — Basis Form](../copilot-instructions.md#writing--basis-form) rules: dense, irreducible, orthogonal statements — never verbose enumeration.

## JSDoc

- Required on every exported type, interface, function, and React component.
- Document the **contract**: parameters, return shape, invariants, examples.
- When a symbol implements an ADR-tracked decision, add a single line:
  `@adr ADR-NNN — <one-line reason>` linking to the heading in `CONTRIBUTING.md`.
- Do not explain history or rejected alternatives in JSDoc — that belongs
  in the ADR.

## Divergence in working code

When code diverges from a spec, convention, issue report, or "obvious best practice", treat the divergence as **evidence of an unstated invariant** — not a bug — until proven otherwise.

- **Detect**: any of these phrases in your own draft is a stop signal: "just a notation change", "output is identical", "zero risk", "one-line fix", "purely cosmetic". They correlate with skipped investigation, not safety.
- **Investigate**: before proposing any change, simulate it through the actual pipeline (build, resolver, runtime, emitted output) and locate the test that pins the current behaviour. If no test pins it, that is itself a finding worth surfacing.
- **Resolve proportionally**: if the only real gap is documental (missing JSDoc, unregistered exception, stale spec), the fix is documentation — not code. Promote to ADR only if the invariant generalises.

## ADR discipline

The 3-criteria gate, format, lifecycle, and review protocol live in CONTRIBUTING.md → [Decisions (ADRs)](../../packages/fsl-theme/CONTRIBUTING.md#decisions-adrs). Consult before adding to or modifying that section.

When in doubt: prefer JSDoc on the symbol over a new ADR. Promotion (JSDoc → ADR) is cheap; demotion (cleaning a bloated ADR list) is not.
