---
title: Quick Reference
sidebar_position: 2
---

# Quick Reference

Intent → token cheatsheet. Pick tokens fast here; read the family docs for the full contract.

> **Rule of thumb:** components consume **semantic** tokens only. If the token you need is not listed, check the family doc; if it still does not exist, open a [governance](./governance.md) request.

Grammar reminder:

- colors: `semantic.colors.{ux}.{role}.{dimension}.{state?}`
  - `ux`: `action` \| `input` \| `navigation` \| `feedback` \| `informational`
  - `role`: `primary` \| `secondary` \| `accent` \| `muted` \| `positive` \| `caution` \| `negative`
  - `dimension`: `background` \| `border` \| `text`
  - `state` (optional): `hover` \| `active` \| `focused` \| `disabled` \| `selected` \| `checked` \| `current` \| etc.
- everything else: `semantic.{family}.{group}.{step?}`

---

## Colors — by intent

| I want…                                    | Token                                                               |
| :----------------------------------------- | :------------------------------------------------------------------ |
| Primary button (filled, strongest CTA)     | `semantic.colors.action.primary.{background,border,text}`           |
| Secondary button (neutral chrome)          | `semantic.colors.action.secondary.{background,border,text}`         |
| Accent button (brand color, high emphasis) | `semantic.colors.action.accent.{background,border,text}`            |
| Destructive button                         | `semantic.colors.action.negative.{background,border,text}`          |
| Ghost / low-emphasis button                | `semantic.colors.action.muted.{background,border,text}`             |
| Text input (default)                       | `semantic.colors.input.primary.{background,border,text}`            |
| Text input (error)                         | `semantic.colors.input.negative.{background,border,text}`           |
| Text input (success / validated)           | `semantic.colors.input.positive.{background,border,text}`           |
| Text input (warning)                       | `semantic.colors.input.caution.{background,border,text}`            |
| Nav link (default / current / visited)     | `semantic.colors.navigation.primary.text.{default,current,visited}` |
| Toast / alert — info                       | `semantic.colors.feedback.primary.{background,border,text}`         |
| Toast / alert — success                    | `semantic.colors.feedback.positive.{background,border,text}`        |
| Toast / alert — warning                    | `semantic.colors.feedback.caution.{background,border,text}`         |
| Toast / alert — error                      | `semantic.colors.feedback.negative.{background,border,text}`        |
| Page / content body text                   | `semantic.colors.informational.primary.text`                        |
| Muted / helper text                        | `semantic.colors.informational.muted.text`                          |
| Page background                            | `semantic.colors.informational.primary.background`                  |
| Divider line                               | `semantic.colors.informational.muted.border`                        |
| Focus ring color                           | `semantic.focus.ring.color`                                         |

Full grammar + role decision table: [Colors](./02-families/colors.md).

---

## Spacing — by intent

| I want…                                 | Token                                          |
| :-------------------------------------- | :--------------------------------------------- |
| Padding inside a button/input           | `semantic.spacing.inset.control.{sm,md,lg}`    |
| Padding inside a card/surface           | `semantic.spacing.inset.surface.{sm,md,lg}`    |
| Gap between stacked items (form fields) | `semantic.spacing.gap.stack.{xs,sm,md,lg,xl}`  |
| Gap between inline items (icon + label) | `semantic.spacing.gap.inline.{xs,sm,md,lg,xl}` |
| Page horizontal gutter (responsive)     | `semantic.spacing.gutter.page`                 |
| Section vertical gutter (responsive)    | `semantic.spacing.gutter.section`              |
| Minimum distance between hit targets    | `semantic.spacing.separation.interactive.min`  |

See [Spacing](./02-families/spacing.md).

---

## Sizing — by intent

| I want…                               | Token                                    |
| :------------------------------------ | :--------------------------------------- |
| Hit target (minimum a11y size)        | `semantic.sizing.hit.min`                |
| Hit target (default interactive size) | `semantic.sizing.hit.base`               |
| Hit target (prominent / primary)      | `semantic.sizing.hit.prominent`          |
| Inline icon with text                 | `semantic.sizing.icon.{sm,md,lg}`        |
| Avatar / identity chip                | `semantic.sizing.identity.{sm,md,lg,xl}` |
| Paragraph max reading width           | `semantic.sizing.measure.reading`        |
| Surface (card/dialog) max width       | `semantic.sizing.surface.maxWidth`       |

See [Sizing](./02-families/sizing.md).

---

## Typography — by intent

Token prefix: `semantic.text`.

| I want…                            | Token                               |
| :--------------------------------- | :---------------------------------- |
| Hero / marketing title             | `semantic.text.display.{lg,md,sm}`  |
| Page title / top-level headline    | `semantic.text.headline.{lg,md,sm}` |
| Section / card title               | `semantic.text.title.{lg,md,sm}`    |
| Paragraph / body copy              | `semantic.text.body.{lg,md,sm}`     |
| UI label, button label, form label | `semantic.text.label.{lg,md,sm}`    |
| Inline / block code                | `semantic.text.code.{md,sm}`        |

See [Typography](./02-families/typography.md).

---

## Borders, radii, elevation — by intent

| I want…                                 | Token                                           |
| :-------------------------------------- | :---------------------------------------------- |
| 1px divider (width + style)             | `semantic.border.divider.{width,style}`         |
| Control outline (button, input)         | `semantic.border.outline.control.{width,style}` |
| Surface outline (card)                  | `semantic.border.outline.surface.{width,style}` |
| Selected-state line                     | `semantic.border.selected.{width,style}`        |
| Focus ring (width + style + color)      | `semantic.focus.ring.{width,style,color}`       |
| Control corner radius (buttons, inputs) | `semantic.radii.control`                        |
| Surface corner radius (cards, dialogs)  | `semantic.radii.surface`                        |
| Pill / fully round                      | `semantic.radii.round`                          |
| Resting surface (no shadow)             | `semantic.elevation.surface.flat`               |
| Card shadow                             | `semantic.elevation.surface.raised`             |
| Dropdown / popover shadow               | `semantic.elevation.surface.overlay`            |
| Modal / drawer shadow                   | `semantic.elevation.surface.blocking`           |

See [Borders](./02-families/borders.md), [Radii](./02-families/radii.md), [Elevation](./02-families/elevation.md).

---

## Motion, opacity, z-index — by intent

| I want…                                    | Token                                                |
| :----------------------------------------- | :--------------------------------------------------- |
| Immediate UI feedback (hover, press)       | `semantic.motion.feedback.{duration,easing}`         |
| Element entering the screen                | `semantic.motion.transition.enter.{duration,easing}` |
| Element leaving the screen                 | `semantic.motion.transition.exit.{duration,easing}`  |
| Attention / emphasis animation             | `semantic.motion.emphasis.{duration,easing}`         |
| Decorative / ambient animation             | `semantic.motion.decorative.{duration,easing}`       |
| Scrim over content                         | `semantic.opacity.scrim`                             |
| Loading / in-progress dim                  | `semantic.opacity.loading`                           |
| Disabled dim                               | `semantic.opacity.disabled`                          |
| Document flow layer                        | `semantic.zIndex.layer.base`                         |
| Sticky header / toolbar                    | `semantic.zIndex.layer.sticky`                       |
| Dropdown / popover / tooltip               | `semantic.zIndex.layer.overlay`                      |
| Modal / drawer (blocks interaction)        | `semantic.zIndex.layer.blocking`                     |
| Toast / snackbar (transient, non-blocking) | `semantic.zIndex.layer.transient`                    |

See [Motion](./02-families/motion.md), [Opacity](./02-families/opacity.md), [Z-Index](./02-families/z-index.md).

---

## Data visualization — by intent

| I want…                            | Token                                                               |
| :--------------------------------- | :------------------------------------------------------------------ |
| Nth categorical series color       | `semantic.dataviz.color.series.{1..8}`                              |
| Sequential (ordered) scale step    | `semantic.dataviz.color.scale.sequential.{1..7}`                    |
| Diverging scale step               | `semantic.dataviz.color.scale.diverging.{neg3..pos3}`               |
| Reference line (target/baseline)   | `semantic.dataviz.color.reference.{baseline,target}`                |
| Highlighted / selected series      | `semantic.dataviz.color.state.{highlight,selected}`                 |
| De-emphasized (context) series     | `semantic.dataviz.color.state.muted`                                |
| Missing / not-applicable data      | `semantic.dataviz.color.status.{missing,suppressed,not-applicable}` |
| Non-color differentiator — shape   | `semantic.dataviz.encoding.shape.{1..8}`                            |
| Non-color differentiator — pattern | `semantic.dataviz.encoding.pattern.{1..6}`                          |
| Line style (solid/dashed/dotted)   | `semantic.dataviz.encoding.stroke.{solid,dashed,dotted}`            |

See [Data Visualization](./03-data-visualization/index.md).

---

## If you can't find what you need

- **Token missing** → read the family doc; if still absent, open a governance request.
- **Want a raw value** → you need a new **semantic** token, not a core reference. Core is never consumed by components.
- **Repeating the same combo in many places** → extract a **component** or **pattern**, not a new token.
- **Building a chart** → start in [Data Visualization](./03-data-visualization/index.md), not in foundation colors.
