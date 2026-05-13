---
title: Modes
sidebar_position: 4
---

# Modes

A mode defines how a single theme adapts to a different environment while preserving the same semantic contract.

A mode is not a separate theme. It is a **controlled remapping of semantic references** within the same theme.

> Key principle: **core tokens are immutable. Modes remap which core tokens semantic tokens reference.**

---

## Relationship to the Token Model

The [Token Model](./model.md) defines two architectural layers:

- **core tokens** — an immutable palette of raw values
- **semantic tokens** — stable design meaning, expressed as references to core tokens

Modes operate at the **semantic mapping layer**.

When the mode changes:

- core token values do **not** change
- semantic token names do **not** change
- semantic token **references** may point to different core tokens
- components continue consuming the same semantic tokens

```text
light: action.primary.background.default → {core.colors.brand.500}
dark:  action.primary.background.default → {core.colors.brand.300}
```

Core tokens like `core.colors.brand.500` and `core.colors.brand.300` retain their identity and value in both modes. What changes is which point in the palette the semantic token references.

> If a semantic contract fails in a mode, remap the semantic reference to a different core token — do not mutate the core value or rename the semantic token.

---

## What Changes Between Modes

Modes remap semantic references to preserve contrast, legibility, and depth in a different environment.

| Semantic family                           | Typical mode behavior           | Guidance                                                                                                      |
| :---------------------------------------- | :------------------------------ | :------------------------------------------------------------------------------------------------------------ |
| Color semantics (surfaces, text, borders) | **Most remappings happen here** | Remap to different positions in neutral, brand, and hue scales to preserve contrast                           |
| Elevation semantics                       | **May need remapping**          | Shadow recipes that work on light surfaces often fail on dark ones — remap to appropriate core levels         |
| Motion semantics                          | **Rarely remapped**             | Some modes may justify reduced or adjusted motion — e.g., high-contrast modes that favor static presentations |
| Opacity semantics                         | **Rarely remapped**             | Scrim/veil opacity may need adjustment when surface contrast changes between modes                            |
| Other semantic families                   | **Usually unchanged**           | Remap only when the mode materially affects usability or perception                                           |

Core tokens — palette scales, font primitives, spacing, sizing, radii, motion — remain unchanged. Modes should stay **minimal** and remap only what truly needs to change.

> If a mode requires values that do not exist in the current core palette (e.g., a shadow recipe that only works on dark surfaces), the correct path is to **enrich the theme's core tokens** with the missing recipes — not to mutate existing core values per mode. This preserves core immutability while giving semantic tokens enough palette depth to remap freely.

---

## Design Rules

### 1. Core tokens are the immutable palette

Core tokens define raw values: `core.colors.neutral.900` is always the darkest neutral, `core.colors.red.100` is always the lightest red. Modes never mutate these values.

This means `core.colors.neutral.white` is always white. If dark mode needs a dark background, the semantic surface token remaps to `core.colors.neutral.900` — it does not redefine `white` as a dark color.

### 2. Optimize semantic pairings, not isolated swatches

Modes succeed when semantic combinations still work together: text against background, borders against adjacent surfaces, focus indicators against surrounding context, raised surfaces against their environment.

Evaluate mode correctness by checking pairings, not individual swatches.

### 3. Remap neutrals first

Most mode adaptation comes from remapping semantic tokens to different positions in the neutral scale. Neutrals carry most surface and contrast work, so they are the primary lever.

### 4. Keep brand and hue remappings stable when possible

Semantic tokens that reference brand and hue scales should remap as little as practical between modes. But when a brand or hue reference breaks legibility or contrast in a mode, remap the semantic token to a different scale position.

### 5. No parallel vocabulary

Modes must never introduce mode-specific semantic names such as `textOnDark`, `darkBorder`, `lightSurface`, or `brandDark`.

Semantic token names remain identical across modes. Only the referenced core token changes.

### 6. Validate every mode independently

A semantic contract that works in one mode may fail in another. Each supported mode must be validated for text/background contrast, non-text contrast, focus visibility, selected/current state visibility, and surface separation.

---

## Accessibility Expectations

Modes must preserve accessibility, not just visual preference.

At minimum, validate these pairings in every supported mode:

- **normal text vs background** → `4.5:1`
- **large text vs background** → `3:1`
- **non-text UI indicators vs adjacent colors** → `3:1`

Focus indicators must remain clearly visible in each mode, not only technically present.

> Mode correctness is not "does dark mode look darker?" It is "does the semantic contract remain readable, perceivable, and usable?"

---

## Base Mode Direction

Each theme has a **base mode** — the primary environment it was designed for.

- A **light-first** theme defines its complete semantic mappings for light and provides alternate mappings only where needed for dark.
- A **dark-first** theme does the reverse.

A theme may also be intentionally **single-mode** when the product targets only one visual environment.

---

## Output Guidance

Modes should be implemented as **semantic remapping overrides**, not as duplicated token sets or mutated core values.

Typical output model:

1. emit the base theme (all core values + base semantic mappings)
2. for the alternate mode, emit only the semantic references that differ
3. core tokens are emitted once and shared across modes

This keeps the system smaller, more predictable, easier to validate, and less likely to drift.

> **Implementation:** See [Theme Provider](/docs/design/theme-provider) for how mode remapping is configured in ttoss themes.

---

## Summary

- A mode is a controlled variation of the same theme
- Core tokens are immutable — modes never change their values
- Modes remap semantic token references to different core tokens
- Semantic token names and meaning stay the same across modes
- Neutrals are usually the primary remapping lever
- Modes should stay minimal and diff-based
- Every mode must preserve accessibility and semantic pairings
