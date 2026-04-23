---
title: Sizing
---

# Sizing

Sizing tokens define the **physical bounds** of UI: widths, heights, and min/max constraints used to build interfaces that are consistent, accessible, and **natively responsive**.

This system is built on two explicit layers:

1. **Core Tokens** — intent-free primitives and the **responsive engine**
2. **Semantic Tokens** — sizing contracts consumed by UI code

> **Rule:** Core tokens are never referenced in components.

---

## Core Tokens

Core sizing tokens are **intent-free primitives** and the **single source of truth** for responsiveness.

They exist to:

- centralize fluid logic (all `clamp()` formulas live here)
- keep semantic tokens as **aliases** (stable names, theme-tunable engine)
- make the system predictable (no ad-hoc coefficients in semantics)

**Core tokens are never consumed by components.** Components consume semantic tokens only.

### Output Guidance (Web)

The following is specific to CSS/web output and does not affect the semantic contract.

1. A query container rule for layout surfaces:

```css
.tt-container {
  container-type: inline-size;
}
```

2. A robust fallback strategy in build output:

- emit a viewport-safe fallback first
- override with container units when supported

```css
@supports (width: 1cqi) {
  /* container-based overrides */
}
```

3. The core token set below (ramps + primitives).

### Core groups

#### 1) Fluid ramps (required)

Ramps are the **engine**. They are bounded ranges expressed with `clamp(min, preferred, max)`.

- `core.size.ramp.ui.1..8` — small→medium objects such as icons and identity
- `core.size.ramp.layout.1..6` — medium→large structural bounds such as surfaces

> Rule: semantic fluid tokens (`icon.*`, `identity.*`, `surface.maxWidth`) should map to ramp steps, not define new formulas.

#### 2) Primitives (required)

- `core.size.relative.em = 1em`
- `core.size.relative.rem = 1rem`
- `core.size.behavior.auto = auto`
- `core.size.behavior.full = 100%`
- `core.size.behavior.fit = fit-content`
- `core.size.behavior.min = min-content`
- `core.size.behavior.max = max-content`
- `core.size.viewport.heightFull = 100dvh`

#### 3) Ergonomic hit primitives (required)

- `core.size.hit.fine.{min|default|prominent}` — fixed values for fine pointer (mouse, trackpad)
- `core.size.hit.coarse.{min|default|prominent}` — fixed values for coarse pointer (touch)

Hit targets are **never fluid**. The build output emits fine values as the baseline and coarse values inside `@media (any-pointer: coarse)` automatically.

### Example

```js
const coreSizing = {
  size: {
    ramp: {
      ui: {
        1: 'clamp(12px, calc(0.6cqi + 10px), 16px)',
        2: 'clamp(14px, calc(0.8cqi + 11px), 20px)',
        3: 'clamp(16px, calc(1.0cqi + 12px), 24px)',
        4: 'clamp(20px, calc(1.2cqi + 14px), 32px)',
        5: 'clamp(24px, calc(1.5cqi + 16px), 40px)',
        6: 'clamp(32px, calc(1.8cqi + 20px), 56px)',
        7: 'clamp(40px, calc(2.2cqi + 24px), 72px)',
        8: 'clamp(48px, calc(2.6cqi + 28px), 96px)',
      },

      layout: {
        1: 'clamp(320px, 40cqi, 480px)',
        2: 'clamp(384px, 50cqi, 640px)',
        3: 'clamp(480px, 60cqi, 800px)',
        4: 'clamp(560px, 70cqi, 960px)',
        5: 'clamp(640px, 80cqi, 1120px)',
        6: 'clamp(768px, 90cqi, 1280px)',
      },
    },

    relative: {
      em: '1em',
      rem: '1rem',
    },

    behavior: {
      auto: 'auto',
      full: '100%',
      fit: 'fit-content',
      min: 'min-content',
      max: 'max-content',
    },

    viewport: {
      heightFull: '100dvh',
    },

    hit: {
      fine: { min: '28px', default: '40px', prominent: '48px' },
      coarse: { min: '44px', default: '48px', prominent: '56px' },
    },
  },
};
```

**Expected consumption pattern:** semantic tokens reference core tokens by alias.
Example: `icon.md → core.size.ramp.ui.3`, `surface.maxWidth → core.size.ramp.layout.5`.

## Semantic Tokens

Sizing semantics are anchored in **geometry and ergonomics**, not UX categories.
This avoids ambiguity and prevents token-per-component drift.

### Token structure

```text
{family}.{stepOrProperty}
```

- `family`: what kind of physical sizing contract this is
- `stepOrProperty`: the specific step or property inside that family

#### Families

| `{family}` | Description                                                                                                |
| :--------- | :--------------------------------------------------------------------------------------------------------- |
| `hit`      | minimum **interactive target** sizing (ergonomic contract). Values adapt to input capability. Never fluid. |
| `icon`     | **visual glyph** sizing only. May be fluid via core ramp.                                                  |
| `identity` | **visual identity object** sizing (profile / brand / entity). May be fluid via core ramp.                  |
| `measure`  | **readability measure** (line-length contract, character-based).                                           |
| `surface`  | **structural bounds** for UI surfaces (constraints, not components).                                       |
| `viewport` | viewport primitives for full-height layouts.                                                               |

#### Canonical shapes

- `hit.{min|default|prominent}`
- `icon.{sm|md|lg}`
- `identity.{sm|md|lg|xl}`
- `measure.reading`
- `surface.maxWidth`
- `viewport.height.full`

### Semantic Tokens Summary Table

| token                  | use when you are building…             | contract (must be true)                                                    | default value                     |
| :--------------------- | :------------------------------------- | :------------------------------------------------------------------------- | :-------------------------------- |
| `hit.min`              | small / secondary interactive targets  | minimum interactive area; **not visual size**; **must not shrink**         | theme-defined ergonomic minimum   |
| `hit.default`          | standard buttons / inputs / toggles    | same as above                                                              | theme-defined ergonomic default   |
| `hit.prominent`        | high-emphasis / low-density targets    | same as above                                                              | theme-defined ergonomic prominent |
| `icon.sm`              | small glyphs / dense UI                | visual only; bounded range via core ramp                                   | `core.size.ramp.ui.2`             |
| `icon.md`              | standard icons                         | visual only; bounded range via core ramp                                   | `core.size.ramp.ui.3`             |
| `icon.lg`              | prominent icons                        | visual only; bounded range via core ramp                                   | `core.size.ramp.ui.4`             |
| `identity.sm`          | compact identity objects               | visual only; bounded range via core ramp                                   | `core.size.ramp.ui.5`             |
| `identity.md`          | standard identity objects              | visual only; bounded range via core ramp                                   | `core.size.ramp.ui.6`             |
| `identity.lg`          | prominent identity objects             | visual only; bounded range via core ramp                                   | `core.size.ramp.ui.7`             |
| `identity.xl`          | hero identity / brand objects          | visual only; bounded range via core ramp                                   | `core.size.ramp.ui.8`             |
| `measure.reading`      | long-form text containers              | single bounded readability contract                                        | `clamp(45ch, 60ch, 75ch)`         |
| `surface.maxWidth`     | cards, panels, dialogs, surface shells | bounded structural max width; container-first                              | `core.size.ramp.layout.5`         |
| `viewport.height.full` | full-height layouts                    | must use dynamic viewport units; use intentionally for full-height layouts | `core.size.viewport.heightFull`   |

Accessibility note: WCAG 2.2 Target Size (Minimum) defines a lower baseline of `24×24` CSS px, with exceptions. ttoss recommends stronger ergonomic baselines, especially for coarse pointer environments, while allowing themes to tune values based on product needs.

### Hit target adaptation

`hit.*` defines an ergonomic contract, not a fixed pixel value.

Implementations should adapt hit targets based on input capability:

- **fine pointer** (`mouse`, `trackpad`) → more compact targets
- **coarse pointer** (`touch`) → larger targets

The build output handles this automatically. Fine values are emitted as the baseline; coarse values are injected based on input capability detection.

#### Output Guidance (Web)

In CSS output, fine values are the baseline and coarse values are injected inside `@media (any-pointer: coarse)`:

```css
:root {
  --tt-sizing-hit-default: 40px; /* fine baseline */
}

@media (any-pointer: coarse) {
  :root {
    --tt-sizing-hit-default: 48px; /* touch override */
  }
}
```

> The semantic token remains stable (`hit.default`).
> The runtime adapts the value.

## Rules of Engagement (non-negotiable)

1. **Hit vs visual:** never use `icon.*` or `identity.*` as hit targets; always enforce `hit.*` via `min-width` / `min-height`.
2. **Reading vs surface:** use `measure.reading` for long text; use `surface.maxWidth` for structural wrappers.
3. **No responsive logic in components:** responsiveness lives in Core (ramps + container units), not in component code.
4. **Dynamic height:** avoid `100vh`; use `viewport.height.full`.

## Theming

Themes may tune:

- the **core ramps** (`core.size.ramp.ui.*`, `core.size.ramp.layout.*`)
- `surface.maxWidth` mapping to a different layout ramp step
- `measure.reading` in rare cases, validated with real content
- `core.size.hit.{fine,coarse}.*` to adjust ergonomic targets per pointer capability

Semantic token names **never change across themes**.

---

## Validation

### Errors (validation must fail when)

- any `hit.*` token resolves to a fluid or intrinsic value, including:
  - `clamp(...)`
  - `cqi`
  - `%`
  - `auto`
  - `fit-content`
  - `min-content`
  - `max-content`

- hit targets do not preserve order inside a pointer profile:
  - `fine.min > fine.default`
  - `fine.default > fine.prominent`
  - `coarse.min > coarse.default`
  - `coarse.default > coarse.prominent`

- any coarse-pointer hit token is smaller than its fine-pointer counterpart:
  - `coarse.min < fine.min`
  - `coarse.default < fine.default`
  - `coarse.prominent < fine.prominent`

- `measure.reading` is not a bounded character-based measure

- generated output does not emit fine-pointer hit values as the baseline and coarse-pointer hit values inside `@media (any-pointer: coarse)`

- generated output does not emit a viewport-safe fallback before container-based overrides

- generated output does not gate container-based overrides behind `@supports (width: 1cqi)`

- generated output emits `viewport.height.full` as `vh` instead of dynamic viewport units

### Warning (validation should warn when)

- any `icon.*` token resolves outside `core.size.ramp.ui.*`

- any `identity.*` token resolves outside `core.size.ramp.ui.*`

- `surface.maxWidth` resolves outside `core.size.ramp.layout.*`

- `viewport.height.full` does not resolve to `core.size.viewport.heightFull`

- any resolved `hit.*` value is below `24px`

- adjacent `icon.*` tokens resolve to the same effective value

- adjacent `identity.*` tokens resolve to the same effective value

- all fine-pointer and coarse-pointer hit tokens resolve to the same values

- `measure.reading` and `surface.maxWidth` resolve to the same effective value

---

## Summary

- Core sizing defines primitives plus the responsive ramps
- Semantic sizing defines a small set of stable geometry contracts
- `hit.*` is ergonomic, not visual
- `icon.*` and `identity.*` are visual, not interactive
- `measure.reading` and `surface.maxWidth` solve different problems
- Responsiveness lives in the core engine, not in components
- The system stays small, predictable, and scalable
