---
title: Spacing
---

# Spacing

Consistent spacing is essential for rhythm and balance in UI layouts. Our spacing tokens define a scale of values that can be applied to margins, paddings, gaps and positioning. By using these tokens instead of arbitrary numbers, we achieve harmonious proportions and easier maintenance.

## Core spacing tokens

Core spacing tokens live under `spacing.<step>`. They are defined as multiples of a **base unit** (often 4px or 8px). For example, using a 4px base:

| Token       |  Value | Multiple |
| ----------- | -----: | -------: |
| `spacing.0` |  `0px` |       ×0 |
| `spacing.1` |  `4px` |       ×1 |
| `spacing.2` |  `8px` |       ×2 |
| `spacing.3` | `12px` |       ×3 |
| `spacing.4` | `16px` |       ×4 |
| `spacing.5` | `20px` |       ×5 |
| `spacing.6` | `24px` |       ×6 |
| `spacing.7` | `32px` |       ×8 |
| `spacing.8` | `40px` |      ×10 |

The progression may be linear or geometric depending on your design language. Some systems double values for larger steps (4px, 8px, 16px, 32px, etc.). Choose a scheme and stick to it.

To express half steps (e.g. 2px), use decimal keys (`spacing.0.5`) if your scale supports them.

## Semantic spacing tokens

Most spacing decisions can use core tokens directly. However, for complex layout patterns or tokens that require context, define semantic spacing tokens. For example:

- `layout.gutter` – The horizontal margin between grid columns.
- `layout.stack` – Vertical spacing between stacked items.
- `control.padding.md` – Standard padding inside a medium‑sized control.
- `section.padding` – Padding around a section container.

Mapping these semantic tokens to core values centralizes layout decisions and simplifies updates for new themes or responsive scales.

## Guidelines

1. **Use spacing tokens for all margins, paddings and gaps.** Avoid arbitrary pixel values.
2. **Multiply instead of adding.** Instead of `margin-left: 5px`, choose `spacing.1` or `spacing.2` to stay aligned with the grid.
3. **Prefer larger increments for macro layouts.** Use smaller steps (`spacing.1`, `spacing.2`) inside controls; use larger steps (`spacing.4`, `spacing.6`, `spacing.8`) for sections and grid gutters.
4. **Keep vertical rhythm consistent.** Align elements to a baseline grid by using line-height multiples and spacing tokens.

A disciplined spacing scale improves alignment and aesthetic quality. Review your layouts against the tokens to avoid exceptions.
