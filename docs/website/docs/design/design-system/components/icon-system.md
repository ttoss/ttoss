---
title: Icon
---

# Icon

:::info Status: public component in `@ttoss/fsl-ui`
`Icon` is a **public export** of `@ttoss/fsl-ui` (ADR-010): Iconify is the official glyph provider (default set: Lucide), consumed via intents (`icon.{family}.{intent}`) registered offline — no runtime API fetch. The standalone `@ttoss/fsl-icon` package remains **deferred**; the semantic layer (`intents.ts` + `glyphs.ts`) stays free of React and token imports so it can be lifted out whole. The registry below is the **shipped** vocabulary and grows on component demand (see Change Rules). See `@ttoss/fsl-ui` CONTRIBUTING ADR-005 and ADR-010.
:::

**Entity: Structure**

Icon is a **semantic visual component** that renders a glyph to reinforce meaning in the interface.

An Icon does not carry interactive behavior. It receives design tokens (color, sizing) from the context where it participates. It is defined by **what it means**, not by what it looks like.

---

## Position in the System

Icon is a component — not a design token.

A design token is a serializable value that resolves to CSS (a color, a size, a spacing unit). An Icon renders visual UI and consumes design tokens. That makes it a component.

```text
design tokens (color, sizing, motion) → Icon component → rendered SVG
```

Icon occupies the same architectural position as Button, Checkbox, or any other ttoss component. The difference is that Icon has a unique **semantic contract** — a fixed vocabulary of intents — because it is consumed pervasively across the system by other components and patterns.

---

## Component Identity

| Dimension            | Value                                     |
| :------------------- | :---------------------------------------- |
| **Entity**           | Structure                                 |
| **Behavioral class** | static                                    |
| **Renders**          | SVG glyph (`<svg>` with `currentColor`)   |
| **Interactive**      | No — Icon is never interactive on its own |

Icon is `Structure` because it organizes visual meaning within other components. It does not trigger actions, accept input, or manage navigation. When an icon appears inside a Button, the Button owns the interaction — the Icon provides visual reinforcement.

---

## Semantic Contract

The Icon component exposes a fixed vocabulary of **intents**. Each intent has a stable meaning that does not change across themes, providers, or implementations.

The intent determines **what the icon means**. The theme determines **which glyph renders**. The context determines **size and color**.

### Intent Structure

```text
icon.{family}.{intent}
```

- `family`: semantic group (action, navigation, disclosure, ...)
- `intent`: specific stable meaning (search, back, expand, ...)

### Families

| Family       | Meaning                                                          |
| :----------- | :--------------------------------------------------------------- |
| `action`     | Direct user actions                                              |
| `navigation` | Movement and wayfinding                                          |
| `disclosure` | Expand/collapse                                                  |
| `selection`  | Checkbox/radio-like control states                               |
| `status`     | Foundation status indicators                                     |
| `visibility` | Show/hide — named by the contract, no shipped intents yet        |
| `object`     | Minimal cross-product object references — no shipped intents yet |

---

## Canonical Intent Registry

This registry is the stable public API of the Icon component — the **shipped** vocabulary, mirrored from `ICON_INTENTS` in `packages/fsl-ui/src/components/Icon/intents.ts` (on divergence, the code wins). Themes must provide a glyph for each. The registry **grows on demand**: an intent is admitted when a shipped component needs it, never speculatively — and it shrinks never (see Change Rules).

### action

| Intent           | Meaning                                                               |
| :--------------- | :-------------------------------------------------------------------- |
| `close`          | Dismiss a UI surface without implying deletion                        |
| `search`         | Initiate search or represent search as primary action                 |
| `increment`      | Step a value up                                                       |
| `decrement`      | Step a value down                                                     |
| `sortAscending`  | Sort a collection column in ascending order                           |
| `sortDescending` | Sort a collection column in descending order                          |
| `more`           | Additional actions behind a trigger — the overflow affordance         |
| `help`           | Explanatory content behind a trigger — the contextual-help affordance |

### navigation

| Intent | Meaning                                                                             |
| :----- | :---------------------------------------------------------------------------------- |
| `menu` | Reveal a navigation region that has no room to stand on its own (temporary sidebar) |

### disclosure

| Intent     | Meaning                            |
| :--------- | :--------------------------------- |
| `expand`   | Reveal hidden or collapsed content |
| `collapse` | Hide previously revealed content   |

### selection

| Intent          | Meaning                   |
| :-------------- | :------------------------ |
| `checked`       | Affirmative checked state |
| `indeterminate` | Mixed or partial state    |

### status

| Intent    | Meaning                                                                                                                           |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| `success` | Positive outcome or confirmed completion                                                                                          |
| `alert`   | Needs attention — the invalid-field mark and any caution indicator                                                                |
| `info`    | Noteworthy, judgement-free status ("in progress", "new") — a system report, distinct from the `action.help` affordance (an offer) |

---

## Token Consumption

Icon is a component that **consumes** design tokens. It does not produce them.

### Color

Icon renders with `currentColor`. It inherits color from its parent context via CSS. No color prop, no color token on the Icon itself.

When an Icon renders inside a host component's part (e.g. a menu item's supporting visual), its color comes from the color token the host part resolves (e.g. `informational.muted.text.default`). When it renders inside a `Feedback` component, it inherits the feedback color. **The context owns the color, not the Icon.**

### Sizing

Icon consumes the sizing tokens from the `icon` family:

| Token            | Typical use                |
| :--------------- | :------------------------- |
| `sizing.icon.sm` | Dense UI, small glyphs     |
| `sizing.icon.md` | Standard icons             |
| `sizing.icon.lg` | Prominent or display icons |

These map to `core.sizing.ramp.ui` steps and are fluid (responsive via `clamp()`).

### Motion

Icon does not define motion. If an Icon needs animated behavior (e.g. a spinner rotation, a disclosure chevron rotation), the host component applies motion tokens via CSS. The Icon itself is a static glyph.

---

## Composition

Icon participates in composition through the standard [Component Model](/docs/design/design-system/components/component-model): the host component owns the part the Icon renders in (exposed in the DOM via `data-scope`/`data-part`), and that part resolves the tokens the Icon inherits.

| Host component part               | Typical use                   |
| :-------------------------------- | :---------------------------- |
| Input field `leadingAdornment`    | Search icon before an input   |
| Input field `trailingAdornment`   | Clear icon after an input     |
| Collection item supporting visual | Icon beside a menu item label |
| Feedback surface status           | Status icon in a banner       |

When Icon renders outside any host part, it resolves tokens from its Entity default (`Structure`):

- color: `informational.primary.text.default`
- sizing: `sizing.icon.md`

Host parts refine these defaults. For example, a collection item's supporting visual resolves to `informational.muted.text.default` + `sizing.icon.md`.

---

## Theme Mapping

Each theme provides a **glyph mapping** — a complete record that assigns a renderable glyph to every canonical intent.

The theme does not modify the semantic contract. It only decides **which visual asset** expresses each intent.

### What a theme provides

A flat mapping from intent to glyph. The glyph is a renderable unit: an inline SVG function component, an Iconify ID resolved at build time, a registered icon reference, or any other provider-specific representation.

```text
theme glyph mapping:
  action.close      → (x glyph)
  action.search     → (magnifying glass glyph)
  disclosure.expand → (chevron-down glyph)
  selection.checked → (check glyph)
  ...every intent must be mapped
```

### Theme completeness rule

A theme glyph mapping must cover **every canonical intent**. Missing intents are a contract violation. This is enforced by the type system at compile time and by validation tests at build time.

### Provider agnosticism

The contract does not prescribe how glyphs are stored or rendered. A theme may use:

- Inline SVG function components (zero runtime deps, SSR-native)
- Iconify icon data extracted at build time
- Direct imports from icon libraries (Lucide, Phosphor, Material Symbols, etc.)
- Custom hand-drawn SVGs
- Sprite references

The theme decides. The contract enforces completeness and meaning, not format.

---

## Design Rules

### 1. Intent first

Icon intents express **meaning**, not glyph appearance.

Valid: `icon.action.search`, `icon.navigation.menu`, `icon.status.alert`

Invalid: `icon.chevron-left`, `icon.close-filled`, `icon.magnifying-glass`

### 2. No provider coupling

Intents must not encode icon library names, SVG filenames, provider IDs, or style variants (`filled`, `outlined`, `duotone`). Those belong to the theme glyph mapping.

### 3. No slot semantics

Intents must not encode placement (`leading`, `trailing`, `only`, `toolbar`). Placement belongs to the Component Model composition roles.

### 4. No parallel state language

Icon must not duplicate state meaning owned by colors, borders, motion, or component API state. `icon.status.alert` is valid. `icon.alert.hovered.primary.outlined` is not.

### 5. Oppositions must be explicit

These pairs must never collapse to the same resolved glyph:

- `expand` ≠ `collapse`
- `checked` ≠ `indeterminate`
- `increment` ≠ `decrement`
- `sortAscending` ≠ `sortDescending`
- `success` ≠ `alert`

An offer is not a report: `action.help` and `status.info` may share a glyph (the default mapping's ⓘ), because the opposition rule governs pairs that must never be confused with each other — that is the theme's choice, not the intents'.

### 6. Semantic naming, not metaphor

Name by intent, not by pictogram. `close` is semantic. `x-mark` is not.

### 7. Keep `object.*` narrow

`object.*` exists for broad foundation semantics only. Domain-specific objects belong in patterns or application-level extensions.

---

## Extensibility

Applications may extend the canonical registry with domain-specific intents.

### Extension rules

1. Check if an existing intent already expresses the need before creating a new one
2. New intents must follow the same `{family}.{intent}` grammar
3. Extensions must not shadow or redefine canonical intents
4. Extensions may add new families when no existing family fits
5. Extended mappings must still satisfy the completeness rule for all canonical intents

```text
// Application extension example:
canonical intents         + app intents
icon.action.close           icon.product.cart
icon.action.search          icon.product.wishlist
icon.status.success         icon.product.inventory
...                         ...
```

---

## Validation

### Errors (must fail)

- Any canonical intent missing from a theme glyph mapping
- Any opposition pair resolving to the same glyph:
  - `disclosure.expand` = `disclosure.collapse`
  - `selection.checked` = `selection.indeterminate`
  - `action.increment` = `action.decrement`
  - `action.sortAscending` = `action.sortDescending`
  - `status.success` = `status.alert`

### Warnings (should warn)

- Two different intents resolving to the same glyph without explicit justification
- `object.*` growing beyond a small foundation vocabulary
- An extension introducing intents that duplicate existing canonical meaning

---

## Change Rules

- Add an intent only when no existing intent can express the need
- Change a glyph mapping freely (themes evolve independently)
- Change intent meaning only by creating a new intent and deprecating the old one
- Remove an intent only through explicit deprecation and versioned breaking change
- The canonical registry grows slowly and shrinks never

---

## Summary

Icon is a **Structure component** with a fixed semantic contract.

- It renders a glyph determined by the theme
- It receives color from context via `currentColor`
- It receives size from `sizing.icon.*` tokens
- It participates in composition through the standard Component Model
- It is never interactive on its own
- Themes must map every canonical intent to a glyph
- The intent vocabulary is stable, provider-agnostic, and small by design
- Applications may extend intents but must not shadow canonical ones
