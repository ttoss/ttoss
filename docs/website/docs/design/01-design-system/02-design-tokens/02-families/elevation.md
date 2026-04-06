---
title: Elevation
---

# Elevation

Elevation tokens define the **depth system** of ttoss.

Elevation is the perceived depth of a surface in the interface.  
It is expressed through **surface level** and **shadow recipe** working together.

Elevation is used to:

- clarify spatial hierarchy
- separate surfaces from their surroundings
- communicate temporary lift or overlay behavior
- support focus through depth, not just through borders

It must be:

- **Structural** — depth should reflect interface hierarchy
- **Predictable** — surfaces at the same level should feel consistent
- **Controlled** — not every container needs elevation
- **Theme-aware** — depth must still read correctly in dark themes

> Key principle: **Elevation is depth, not shadow alone.**

This system is built on **two explicit layers**:

1. **Core Tokens** — shadow recipes
2. **Semantic Tokens** — stable surface depth contracts consumed by UI code

Components must always consume **semantic elevation tokens**, never core elevation recipes directly.

> **Rule:** Core elevation tokens are never referenced in components.

---

## Scope

Elevation defines **depth**.

It does **not** define:

- layering order (`z-index`)
- border emphasis
- visual meaning through color
- interaction states by itself

Use:

- **Elevation** for depth
- **Z-Index** for stacking order
- **Borders** for structural separation
- **Colors** for surface meaning

---

## Core Tokens

Core elevation tokens are shadow recipes.

They are intent-free and exist only to provide the physical shadow definitions used by semantic elevation tokens.

### Core ramps

Core elevation has two optional ramps. The levels below are the default reference implementation.

**`level` ramp** — standard-opacity recipes, used by default in light themes:

| Token                    | Default meaning                                            |
| :----------------------- | :--------------------------------------------------------- |
| `core.elevation.level.0` | no elevation                                               |
| `core.elevation.level.1` | subtle depth (not mapped to a semantic stratum by default) |
| `core.elevation.level.2` | default raised surface                                     |
| `core.elevation.level.3` | strong overlay depth                                       |
| `core.elevation.level.4` | highest application-controlled depth                       |

**`emphatic` ramp** (optional) — high-opacity recipes for surfaces needing stronger depth contrast (e.g., on dark or heavily-colored backgrounds). Mode-agnostic: expresses shadow weight, not a mode label. Themes include this ramp when a dark alternate requires higher-opacity recipes.

| Token                       | Default meaning                                       |
| :-------------------------- | :---------------------------------------------------- |
| `core.elevation.emphatic.0` | no elevation                                          |
| `core.elevation.emphatic.1` | subtle depth — higher opacity                         |
| `core.elevation.emphatic.2` | raised surface — higher opacity                       |
| `core.elevation.emphatic.3` | overlay depth — higher opacity                        |
| `core.elevation.emphatic.4` | highest application-controlled depth — higher opacity |

> Keep the number of levels small — elevation should remain easy to reason about.
> Every `{core.elevation.level.X}` or `{core.elevation.emphatic.X}` ref declared in semantic tokens must resolve to a defined key in the theme.

### Example

```js
const coreElevation = {
  elevation: {
    level: {
      0: 'none',
      1: '0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 1px rgba(0, 0, 0, 0.04)',
      2: '0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
      3: '0 8px 16px rgba(0, 0, 0, 0.10), 0 4px 8px rgba(0, 0, 0, 0.08)',
      4: '0 16px 32px rgba(0, 0, 0, 0.14), 0 8px 16px rgba(0, 0, 0, 0.10)',
    },
    // Optional — include when the theme supports a dark alternate
    emphatic: {
      0: 'none',
      1: '0 1px 2px rgba(0, 0, 0, 0.20), 0 1px 1px rgba(0, 0, 0, 0.14)',
      2: '0 4px 8px rgba(0, 0, 0, 0.24), 0 2px 4px rgba(0, 0, 0, 0.18)',
      3: '0 8px 16px rgba(0, 0, 0, 0.28), 0 4px 8px rgba(0, 0, 0, 0.22)',
      4: '0 16px 32px rgba(0, 0, 0, 0.34), 0 8px 16px rgba(0, 0, 0, 0.28)',
    },
  },
};
```

**Expected consumption pattern:** semantic elevation tokens reference core elevation recipes by alias.

---

## Semantic Tokens

Semantic elevation tokens define the **surface strata** of the interface.

They are intentionally anchored in **surface role**, not in component names.

### Token structure

```text
elevation.surface.{stratum}
```

### Canonical semantic set

`elevation.surface.*` defines shadow-based depth contracts:

- `elevation.surface.flat`
- `elevation.surface.raised`
- `elevation.surface.overlay`
- `elevation.surface.blocking`

`elevation.tonal.*` is an optional sibling for surface color overlays that pair with shadows to preserve depth in dark or heavily-colored themes. Omit when not needed.

> Keep the `surface.*` set stable. Do not create component-specific elevation tokens.

### Semantic Tokens Summary Table

| token                        | use when you are building…                  | contract (must be true)                        | default mapping          |
| :--------------------------- | :------------------------------------------ | :--------------------------------------------- | :----------------------- |
| `elevation.surface.flat`     | surfaces flush with the page                | no perceived lift                              | `core.elevation.level.0` |
| `elevation.surface.raised`   | cards, panels, raised surfaces              | surface sits above the page but below overlays | `core.elevation.level.2` |
| `elevation.surface.overlay`  | dropdowns, popovers, floating surfaces      | surface floats above raised content            | `core.elevation.level.3` |
| `elevation.surface.blocking` | dialogs, blocking sheets, blocking surfaces | highest surface depth in the normal app flow   | `core.elevation.level.4` |

In a dark-mode alternate, `surface.*` tokens remap to `core.elevation.emphatic.*` recipes for proper contrast.

### Example

```js
const semanticElevation = {
  elevation: {
    surface: {
      flat: '{core.elevation.level.0}',
      raised: '{core.elevation.level.2}',
      overlay: '{core.elevation.level.3}',
      blocking: '{core.elevation.level.4}',
    },
    // Optional — include when the product uses tonal elevation overlays.
    // Each token resolves to a color overlay (e.g., color-mix, rgba surface).
    // tonal: {
    //   raised: '{core.colors.brand.50at8}',
    //   overlay: '{core.colors.brand.50at12}',
    //   blocking: '{core.colors.brand.50at16}',
    // },
  },
};
```

---

## Surface + Shadow

Elevation is not shadow alone.

A surface may also need a corresponding surface color treatment to preserve depth correctly, especially in dark themes.

This means:

- the **elevation token** defines the shadow recipe
- the **color system** defines the surface color at that depth
- components may need both to express depth correctly

> Shadows express lift.
> Surface color helps preserve that lift across themes.

---

## Rules of Engagement

1. **Semantic-only consumption**
   Components use semantic elevation tokens only.

2. **Use elevation intentionally**
   Do not add elevation when spacing or borders already solve the hierarchy.

3. **Elevation expresses depth, not stacking order**
   Use z-index for layering order.

4. **Do not create component-specific elevation tokens by default**
   Avoid `elevation.card`, `elevation.tooltip`, `elevation.toast`, etc.

5. **Keep states above the foundation layer**
   Hover, pressed, and dragged behavior should usually be resolved in component or pattern logic, not by expanding the foundation prematurely.

6. **Validate in dark themes**
   Shadows alone may not communicate depth well enough.

---

## Decision Matrix

1. **Should this surface feel flush with the page?**
   → `elevation.surface.flat`

2. **Should this surface feel gently lifted from the page?**
   → `elevation.surface.raised`

3. **Should this surface float above normal content?**
   → `elevation.surface.overlay`

4. **Should this surface dominate the normal application flow?**
   → `elevation.surface.blocking`

5. **Are you trying to show order, not depth?**
   → Use z-index instead

---

## Usage Examples

| Usage                         | Token                        |
| :---------------------------- | :--------------------------- |
| Page section or shell surface | `elevation.surface.flat`     |
| Card or panel                 | `elevation.surface.raised`   |
| Dropdown or popover           | `elevation.surface.overlay`  |
| Dialog or blocking sheet      | `elevation.surface.blocking` |

> Build output may expose semantic elevation tokens as CSS variables or framework-specific bindings. The semantic names remain the API.

---

## Theming

Themes may tune:

- core shadow recipes
- semantic mappings if the product intentionally changes depth character
- paired surface colors in the color system

Semantic token names **never change across themes**.

---

## Validation

### Errors (validation must fail when)

- `elevation.surface.flat` resolves to a visible shadow recipe instead of no elevation

- any of these tokens resolves to `none`, `0`, or an equivalent non-visible shadow recipe:
  - `elevation.surface.raised`
  - `elevation.surface.overlay`
  - `elevation.surface.blocking`

- semantic depth order breaks:
  - `flat > raised`
  - `raised > overlay`
  - `overlay > blocking`

### Warning (validation should warn when)

- adjacent semantic strata resolve to the same effective elevation contract:
  - `flat = raised`
  - `raised = overlay`
  - `overlay = blocking`

- adjacent `level` ramp entries resolve to the same effective shadow recipe

- adjacent `emphatic` ramp entries resolve to the same effective shadow recipe (when `emphatic` is defined)

---

## Summary

- Core elevation tokens define shadow recipes
- Semantic elevation tokens define surface depth strata
- Elevation is depth, not shadow alone
- Surface color and shadow may need to work together
- States like hover and drag usually stay above the foundation layer
- The system remains small, clear, and durable
