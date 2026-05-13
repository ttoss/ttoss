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

- `core.sizing.ramp.ui.1..8` — small→medium objects such as icons and identity
- `core.sizing.ramp.layout.1..6` — medium→large structural bounds such as surfaces

> Rule: semantic fluid tokens (`icon.*`, `identity.*`, `surface.maxWidth`) should map to ramp steps, not define new formulas.

#### 2) Primitives (required)

- `core.sizing.relative.em = 1em`
- `core.sizing.relative.rem = 1rem`
- `core.sizing.behavior.auto = auto`
- `core.sizing.behavior.full = 100%`
- `core.sizing.behavior.fit = fit-content`
- `core.sizing.behavior.min = min-content`
- `core.sizing.behavior.max = max-content`
- `core.sizing.viewport.height.full = 100dvh`
- `core.sizing.viewport.width.full = 100dvw`

#### 3) Ergonomic hit primitives (required)

- `core.sizing.hit.fine.{min|base|prominent}` — ergonomic floors for fine pointer (mouse, trackpad); may be fluid via `clamp(floor, preferred, max)` where `floor` is a fixed px minimum
- `core.sizing.hit.coarse.{min|base|prominent}` — fixed px values for coarse pointer (touch); never fluid

**Coarse** hit targets are **always fixed px** — reliable ergonomic guarantees for touch. **Fine** hit targets may use `clamp(floor, preferred, max)` where `floor` is a fixed px ergonomic minimum, allowing the theme to express density preferences (e.g. via the rem scale) while guaranteeing accessibility. The build output emits fine values as the baseline and coarse values inside `@media (any-pointer: coarse)` automatically.

### Example

```js
const coreSizing = {
  sizing: {
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
      height: {
        full: '100dvh',
      },
      width: {
        full: '100dvw',
      },
    },

    hit: {
      // Fine: clamp(floor, preferred, max) — floor is fixed px; preferred scales with rem
      fine: {
        min: 'clamp(28px, 1.75rem, 40px)',
        base: 'clamp(36px, 2.5rem, 48px)',
        prominent: 'clamp(44px, 3rem, 56px)',
      },
      // Coarse: always fixed px — touch ergonomics require predictable, reliable targets
      coarse: { min: '44px', base: '48px', prominent: '56px' },
    },
  },
};
```

**Expected consumption pattern:** semantic tokens reference core tokens by alias.
Example: `icon.md → core.sizing.ramp.ui.3`, `surface.maxWidth → core.sizing.ramp.layout.5`.

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

| `{family}` | Description                                                                                                                                                                                        |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hit`      | minimum **interactive target** sizing (ergonomic contract). Values adapt to input capability. Fine values may be fluid with `clamp()` (floor must be fixed px). Coarse values are always fixed px. |
| `icon`     | **visual glyph** sizing only. May be fluid via core ramp.                                                                                                                                          |
| `identity` | **visual identity object** sizing (profile / brand / entity). May be fluid via core ramp.                                                                                                          |
| `measure`  | **readability measure** (line-length contract, character-based).                                                                                                                                   |
| `surface`  | **structural bounds** for UI surfaces (constraints, not components).                                                                                                                               |
| viewport   | viewport primitives for full-height and full-width layouts.                                                                                                                                        |

#### Canonical shapes

- `hit.{min|base|prominent}`
- `icon.{sm|md|lg}`
- `identity.{sm|md|lg|xl}`
- `measure.reading`
- `surface.maxWidth`
- `viewport.height.full`
- `viewport.width.full`

### Semantic Tokens Summary Table

| token                  | use when you are building…             | contract (must be true)                                                    | default value                      |
| :--------------------- | :------------------------------------- | :------------------------------------------------------------------------- | :--------------------------------- |
| `hit.min`              | small / secondary interactive targets  | minimum interactive area; **not visual size**; **must not shrink**         | theme-defined ergonomic minimum    |
| `hit.base`             | standard buttons / inputs / toggles    | same as above                                                              | theme-defined ergonomic default    |
| `hit.prominent`        | high-emphasis / low-density targets    | same as above                                                              | theme-defined ergonomic prominent  |
| `icon.sm`              | small glyphs / dense UI                | visual only; bounded range via core ramp                                   | `core.sizing.ramp.ui.2`            |
| `icon.md`              | standard icons                         | visual only; bounded range via core ramp                                   | `core.sizing.ramp.ui.3`            |
| `icon.lg`              | prominent icons                        | visual only; bounded range via core ramp                                   | `core.sizing.ramp.ui.4`            |
| `identity.sm`          | compact identity objects               | visual only; bounded range via core ramp                                   | `core.sizing.ramp.ui.5`            |
| `identity.md`          | standard identity objects              | visual only; bounded range via core ramp                                   | `core.sizing.ramp.ui.6`            |
| `identity.lg`          | prominent identity objects             | visual only; bounded range via core ramp                                   | `core.sizing.ramp.ui.7`            |
| `identity.xl`          | hero identity / brand objects          | visual only; bounded range via core ramp                                   | `core.sizing.ramp.ui.8`            |
| `measure.reading`      | long-form text containers              | single bounded readability contract                                        | `clamp(45ch, 60ch, 75ch)`          |
| `surface.maxWidth`     | cards, panels, dialogs, surface shells | bounded structural max width; container-first                              | `core.sizing.ramp.layout.5`        |
| `viewport.height.full` | full-height layouts                    | must use dynamic viewport units; use intentionally for full-height layouts | `core.sizing.viewport.height.full` |
| `viewport.width.full`  | full-width layouts                     | must use dynamic viewport units; use intentionally for full-width layouts  | `core.sizing.viewport.width.full`  |

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
  --tt-sizing-hit-base: clamp(
    36px,
    2.5rem,
    48px
  ); /* fine baseline — fluid, ergonomic floor guaranteed */
}

@media (any-pointer: coarse) {
  :root {
    --tt-sizing-hit-base: 48px; /* touch override — fixed px, always reliable */
  }
}
```

> The semantic token remains stable (`hit.base`).
> The runtime adapts the value.

## Rules of Engagement (non-negotiable)

1. **Hit vs visual:** never use `icon.*` or `identity.*` as hit targets; always enforce `hit.*` via `min-width` / `min-height`.
2. **Reading vs surface:** use `measure.reading` for long text; use `surface.maxWidth` for structural wrappers.
3. **No responsive logic in components:** responsiveness lives in Core (ramps + container units), not in component code.
4. **Dynamic dimensions:** avoid `100vh` and `100vw`; use `viewport.height.full` and `viewport.width.full`.

## Theming

Themes may tune:

- the **core ramps** (`core.sizing.ramp.ui.*`, `core.sizing.ramp.layout.*`)
- `surface.maxWidth` mapping to a different layout ramp step
- `measure.reading` in rare cases, validated with real content
- `core.sizing.hit.fine.*` to tune ergonomic floors for mouse; may use `clamp(floor, preferred, max)` where `floor` is fixed px
- `core.sizing.hit.coarse.*` to adjust ergonomic targets for touch; always fixed px

Semantic token names **never change across themes**.

---

## Validation

### Errors (validation must fail when)

- any `hit.coarse.*` token resolves to a fluid or intrinsic value, including `clamp(...)`, `cqi`, `%`, `auto`, or content-sizing keywords

- any `hit.fine.*` token uses `clamp()` without a fixed px floor (the minimum bound must be a literal `Npx` value, not a variable or formula)

- hit targets do not preserve order inside a pointer profile:
  - `fine.min > fine.base` (compare floors)
  - `fine.base > fine.prominent` (compare floors)
  - `coarse.min > coarse.base`
  - `coarse.base > coarse.prominent`

- any coarse-pointer hit token is smaller than the fine-pointer floor counterpart:
  - `coarse.min < fine.min` (compare coarse fixed to fine clamp floor)
  - `coarse.base < fine.base` (compare coarse fixed to fine clamp floor)
  - `coarse.prominent < fine.prominent` (compare coarse fixed to fine clamp floor)

- `measure.reading` is not a bounded character-based measure

- generated output does not emit fine-pointer hit values as the baseline and coarse-pointer hit values inside `@media (any-pointer: coarse)`

- generated output does not emit a viewport-safe fallback before container-based overrides

- generated output does not gate container-based overrides behind `@supports (width: 1cqi)`

- generated output emits `viewport.height.full` as `vh` instead of dynamic viewport units
- generated output emits `viewport.width.full` as `vw` instead of dynamic viewport units

### Warning (validation should warn when)

- any `icon.*` token resolves outside `core.sizing.ramp.ui.*`

- any `identity.*` token resolves outside `core.sizing.ramp.ui.*`

- `surface.maxWidth` resolves outside `core.sizing.ramp.layout.*`

- `viewport.height.full` does not resolve to `core.sizing.viewport.height.full`
- `viewport.width.full` does not resolve to `core.sizing.viewport.width.full`

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
