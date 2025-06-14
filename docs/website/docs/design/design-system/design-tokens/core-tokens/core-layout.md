---
id: layoutCoreTokens
title: Core Layout
slug: /design/core-tokens/layout
---

Core layout tokens define the basic rules for space and size. We follow the **golden ratio** (≈1.618) so that each step grows harmoniously from the previous one. These rules are abstract enough to adapt to any theme.

## Spacing

Name Pattern: `core.spacing.{step}`

Spacing begins at `0` and uses the golden ratio to increment each step. Starting from `0.25rem` at step `1`, every following step multiplies the previous value by `1.618`.

| Step | Rem |
| :--: | :--: |
| `0`  | `0rem` |
| `1`  | `0.25rem` |
| `2`  | `0.40rem` |
| `3`  | `0.65rem` |
| `4`  | `1.06rem` |
| `5`  | `1.71rem` |
| `6`  | `2.77rem` |
| `7`  | `4.49rem` |
| `8`  | `7.26rem` |
| `...`| `...` |

## Sizes

Name Pattern: `core.sizes.{step}`

Size steps share the same golden ratio progression as spacing. A base component width might start at `1rem` and each step expands by multiplying the previous step by `1.618`. Container sizes for the major breakpoints (`sm`, `md`, `lg`, `xl`) are also derived from these steps.

## Radii

Name Pattern: `core.radii.{step}`

Radius steps also use the golden ratio progression to increase their curvature. Common labels such as `none`, `sm`, `md`, `lg` and `full` map to these numeric steps.

## Breakpoints

Name Pattern: `core.breakpoints.{size}`

The base breakpoints follow common responsive widths used on the web and can be customized per brand:

- `sm` – `640px`
- `md` – `768px`
- `lg` – `1024px`
- `xl` – `1280px`
- `2xl` – `1536px`

## Z-Index

Name Pattern: `core.zIndex.{layer}`

Our z-index scale is minimal: `auto`, `0`, `10`, `20`, `30`, `40`, `50`. Higher layers can be added if necessary.
