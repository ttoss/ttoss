---
title: Elevation
---

# Elevation

Elevation conveys depth by casting shadows. It helps users understand the spatial hierarchy of surfaces, such as cards floating above a background or a modal overlaying the page. Our system defines a finite scale of **core elevation levels** and a set of **semantic elevation tokens** that map contexts to levels.

## Core elevation levels

Core elevation tokens are defined under `elevation.core.level.{n}`, where `n` ranges from 0 to 5. Each level encapsulates a **shadow recipe**—a collection of shadow layers (offsets, blurs, spreads, colours and opacities). Higher levels produce deeper shadows and may also adjust background brightness.

| Level | Purpose                      | Example shadow                                              |
| ----: | ---------------------------- | ----------------------------------------------------------- |
|     0 | Base surfaces (no elevation) | `none`                                                      |
|     1 | Dividers, inputs             | `0 1px 2px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.03)`    |
|     2 | Cards, tooltips              | `0 3px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)`    |
|     3 | Dropdowns, overlays          | `0 6px 12px rgba(0,0,0,0.07), 0 3px 6px rgba(0,0,0,0.05)`   |
|     4 | Dialogs, modals              | `0 12px 24px rgba(0,0,0,0.08), 0 6px 12px rgba(0,0,0,0.06)` |
|     5 | Topmost overlays (toasts)    | `0 24px 48px rgba(0,0,0,0.1), 0 12px 24px rgba(0,0,0,0.08)` |

These recipes are examples; your brand team defines the actual values. Level 0 has no shadow.

## Semantic elevation tokens

Semantic elevation tokens map UI contexts to core levels. They follow this grammar:

```
elevation.<context>.<state?>
```

- **flat**: surfaces flush with the page (`elevation.flat`, maps to level 0).
- **resting**: surfaces like cards and panels at rest (`elevation.resting`, maps to level 2).
- **raised**: interactive surfaces lifted on hover (`elevation.raised`, maps to level 3).
- **overlay**: surfaces that overlay the page such as popovers and dropdowns (`elevation.overlay`, maps to level 3 or 4).
- **modal**: dialogs and sheets (`elevation.modal`, maps to level 4).
- **top**: highest surfaces like toasts and tooltips (`elevation.top`, maps to level 5).
- **dragged**: surfaces being dragged (`elevation.dragged`, maps to level 5 with increased y‑offset).

Each semantic token returns a complete shadow recipe. Components do not combine multiple elevation levels; they choose one semantic level based on context and state.

## Interaction with colour

Elevation may also influence background colour to simulate light on different planes. For example, a card might use `surface.elevated.background.default` for its background and `elevation.resting` for its shadow. Keep shadow colours subtle and aligned with the palette to avoid muddy effects.

## Usage guidelines

1. **Choose the appropriate semantic level.** Cards should use `elevation.resting`, dropdowns `elevation.overlay`, modals `elevation.modal`, toasts `elevation.top`.
2. **State changes lift surfaces.** Buttons may increase elevation on hover (`elevation.raised`) to provide feedback. Use semantic tokens for states rather than adding shadows ad‑hoc.
3. **Do not create component‑specific elevation tokens.** Use the semantic layer; if a new context emerges, propose it via governance.
4. **Test in dark mode.** Shadows may appear more prominent on dark backgrounds. Adjust core recipes per theme to maintain depth perception.

Elevation helps create a coherent spatial model. Resist the temptation to stack multiple shadows or use inconsistent values.
