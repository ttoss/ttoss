---
title: Z‑Index
---

# Z‑Index

Z‑index tokens establish stacking order in your interface. They prevent overlay clashes by defining a clear hierarchy of layers. Using semantic names instead of arbitrary numbers makes the stacking context predictable and maintainable.

## Core z‑index tokens

Define numeric levels under `zIndex.<level>`. Suggested values:

| Token             | Value | Description                    |
| ----------------- | ----: | ------------------------------ |
| `zIndex.base`     |   `0` | Default layer for page content |
| `zIndex.dropdown` |  `10` | Dropdown menus, select lists   |
| `zIndex.sticky`   |  `20` | Sticky headers or footers      |
| `zIndex.overlay`  |  `30` | Popovers, tooltips             |
| `zIndex.modal`    |  `40` | Modal dialogs, side sheets     |
| `zIndex.toast`    |  `50` | Toast notifications            |
| `zIndex.tooltip`  |  `60` | Tooltips (highest)             |

These numbers are examples; adjust them to fit your application. Each level should be spaced enough to allow local layering within a group (e.g. a dropdown containing its own elements with z‑index 11–14).

## Semantic z‑index tokens

Semantic tokens map UI contexts to levels. For example:

- `zIndex.navigation` – Top navigation bar (maps to `zIndex.sticky`).
- `zIndex.dropdownMenu` – Dropdown menu contents (`zIndex.dropdown`).
- `zIndex.modalOverlay` – The overlay behind modals (`zIndex.modal - 1`).
- `zIndex.modal` – Modal container (`zIndex.modal`).
- `zIndex.toast` – Toast notifications (`zIndex.toast`).

Using semantic names prevents accidental collisions. Avoid setting z‑index arbitrarily in components; instead import the appropriate token.

## Guidelines

1. **Define a hierarchy before coding.** List your interactive layers (dropdowns, modals, toasts, tooltips) and assign levels accordingly.
2. **Avoid large numbers.** Do not arbitrarily assign `9999` to modals; stick to defined tokens.
3. **Local stacking contexts.** Within a component, use relative z‑index values (`+1`, `-1`) rather than global numbers to maintain flexibility.

Z‑index tokens make the layering of your application transparent. When new overlay types are introduced, update the table and semantic tokens accordingly.
