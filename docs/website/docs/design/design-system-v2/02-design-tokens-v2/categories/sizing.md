---
title: Sizing
---

# Sizing

Sizing tokens define the **physical bounds** of UI: widths, heights, and min/max constraints used to build interfaces that are consistent, accessible, and **natively responsive**.

This system is built on two explicit layers:

1. **Core Sizing** — intent-free primitives and the **responsive engine**
2. **Semantic Sizing** — sizing contracts consumed by UI code

Components must always consume **semantic sizing**, never core sizing directly.

> **Rule:** Core sizing is never referenced in components.

---

## Core Tokens

Core sizing tokens are **intent-free primitives** and the **single source of truth** for responsiveness.

They exist to:

- centralize the fluid logic (all `clamp()` formulas live here)
- keep semantic tokens as **aliases** (stable names, theme-tunable engine)
- make the system predictable (no ad-hoc coefficients in semantics)

**Core tokens are never consumed by components.** Components consume semantic tokens only.

### What you must deploy (minimum output)

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

- `size.ramp.ui.1..8` — small→medium objects (icons, identity)
- `size.ramp.layout.1..6` — medium→large bounds (surfaces)

> Rule: semantic fluid tokens (`icon.*`, `identity.*`, `surface.maxWidth`) should map to ramp steps, not define new formulas.

#### 2) Primitives (required)

- `size.relative.em = 1em`
- `size.relative.rem = 1rem`
- `size.behavior.auto = auto`
- `size.behavior.full = 100%`
- `size.behavior.fit = fit-content`
- `size.behavior.min = min-content`
- `size.behavior.max = max-content`
- `size.viewport.heightFull = 100dvh`
- `size.viewport.widthFull = 100vw`

### Example (Core Sizing Definition)

```js
const coreSizing = {
  size: {
    ramp: {
      ui: {
        1: 'clamp(12px, 0.6cqi + 10px, 16px)',
        2: 'clamp(14px, 0.8cqi + 11px, 20px)',
        3: 'clamp(16px, 1.0cqi + 12px, 24px)',
        4: 'clamp(20px, 1.2cqi + 14px, 32px)',
        5: 'clamp(24px, 1.5cqi + 16px, 40px)',
        6: 'clamp(32px, 1.8cqi + 20px, 56px)',
        7: 'clamp(40px, 2.2cqi + 24px, 72px)',
        8: 'clamp(48px, 2.6cqi + 28px, 96px)',
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

    relative: { em: '1em', rem: '1rem' },

    behavior: {
      auto: 'auto',
      full: '100%',
      fit: 'fit-content',
      min: 'min-content',
      max: 'max-content',
    },

    viewport: { heightFull: '100dvh', widthFull: '100vw' },
  },
};
```

**Expected consumption pattern:** semantic tokens reference core tokens by alias.
Example: `icon.md → size.ramp.ui.3`, `surface.maxWidth → size.ramp.layout.5`.

---

## Semantic Tokens

Sizing semantics are anchored in **geometry and ergonomics**, not UX categories. This avoids ambiguity and prevents token-per-component drift.
The semantic set is intentionally **small and physical**. Semantic tokens are the only sizing API for components.

### Token Structure

Sizing semantics use **physical families** plus a **step or property**.

```
{family}.{stepOrProperty}
```

**family**: what kind of physical sizing contract this is (hit, icon, identity, measure, surface, viewport)
**stepOrProperty**: the specific step or property inside that family (e.g., `min/default/prominent`, `sm/md/lg`, `reading`, `maxWidth`, `height.full`)

#### Families

| `{family}` | Description                                                                           |
| :--------- | :------------------------------------------------------------------------------------ |
| `hit`      | minimum **interactive target** sizing (accessibility contract). Never fluid.          |
| `icon`     | **visual glyph** sizing only. May be fluid via core ramp.                             |
| `identity` | **visual identity object** sizing (profile/brand/entity). May be fluid via core ramp. |
| `measure`  | **readability measure** (line-length contract, character-based).                      |
| `surface`  | **structural bounds** for UI surfaces (constraints, not components).                  |
| `viewport` | viewport primitives for full-height layouts (modern mobile-safe).                     |

#### Canonical shapes

- `hit.{min|default|prominent}`
- `icon.{sm|md|lg}`
- `identity.{sm|md|lg|xl}`
- `measure.reading`
- `surface.maxWidth`
- `viewport.height.full`

### Semantic Tokens Summary Table

| token                  | use when you are building…            | contract (must be true)                                            | default value                         |
| :--------------------- | :------------------------------------ | :----------------------------------------------------------------- | :------------------------------------ |
| `hit.min`              | small / secondary interactive targets | minimum interactive area; **not visual size**; **must not shrink** | `44px`                                |
| `hit.default`          | standard buttons/inputs/toggles       | same as above                                                      | `48px`                                |
| `hit.prominent`        | high-emphasis / low-density targets   | same as above                                                      | `56px`                                |
| `icon.sm`              | small glyphs / dense UI               | visual only; bounded range (via core ramp)                         | `size.ramp.ui.2`                      |
| `icon.md`              | standard icons                        | visual only; bounded range (via core ramp)                         | `size.ramp.ui.3`                      |
| `icon.lg`              | prominent icons                       | visual only; bounded range (via core ramp)                         | `size.ramp.ui.4`                      |
| `identity.sm`          | compact identity objects              | visual only; bounded range (via core ramp)                         | `size.ramp.ui.5`                      |
| `identity.md`          | standard identity objects             | visual only; bounded range (via core ramp)                         | `size.ramp.ui.6`                      |
| `identity.lg`          | prominent identity objects            | visual only; bounded range (via core ramp)                         | `size.ramp.ui.7`                      |
| `identity.xl`          | hero identity / brand objects         | visual only; bounded range (via core ramp)                         | `size.ramp.ui.8`                      |
| `measure.reading`      | long-form text containers             | single bounded readability contract                                | `clamp(45ch, 60ch, 75ch)`             |
| `surface.maxWidth`     | cards/panels/dialog shells/surfaces   | bounded structural max width; container-first                      | `size.ramp.layout.5`                  |
| `viewport.height.full` | full-height layouts                   | must use dynamic viewport units                                    | `size.viewport.heightFull` (`100dvh`) |

Accessibility note: WCAG 2.2 Target Size (Minimum) provides a lower baseline (24×24 CSS px, with exceptions), while ttoss uses stronger hit baselines (44/48) for product-grade ergonomics.

---

## Rules of engagement (non-negotiable)

1. **Hit vs visual:** never use `icon.*` or `identity.*` as hit targets; always enforce `hit.*` via `min-width/min-height`.
2. **Reading vs surface:** use `measure.reading` for long text; use `surface.maxWidth` for structural wrappers.
3. **No responsive logic in components:** responsiveness lives in Core (ramps + container units), not in component code.
4. **Dynamic height:** avoid `100vh`; use `viewport.height.full`.

## Theming

Themes may tune:

- the **core ramps** (`size.ramp.ui.*`, `size.ramp.layout.*`)
- `surface.maxWidth` mapping to a different layout ramp step (if needed)
- `measure.reading` (rare; validate with real content)

Semantic token names **never change across themes**.
