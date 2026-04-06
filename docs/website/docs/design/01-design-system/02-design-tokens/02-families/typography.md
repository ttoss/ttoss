---
title: Typography
---

# Typography

Typography tokens define the **text system** of ttoss: font families, weights, size ramps, line-height, letter-spacing, and **semantic text styles**.

Typography must be:

- **Readable** — supports long-form content, microcopy, and scanning.
- **Hierarchical** — communicates importance and structure without visual noise.
- **Robust** — survives 200% zoom, user text-spacing overrides, and locale/script differences.
- **Natively responsive** — responsiveness lives in the token engine, not in component code.
- **Small and predictable** — avoids token-per-component drift.

> Key principle: **typography is not a component**. It is a **global contract** that components consume.

This system is built on **two explicit layers**:

1. **Core Tokens** — intent-free primitives
2. **Semantic Tokens** — stable text style contracts consumed by UI code

> **Rule:** Core typography is never referenced in components. Components must always consume semantic typography.

### Scope: Tokens vs Text Components vs HTML

Typography tokens define **styles**. They do not define document structure.

- **HTML semantics** (`h1…h6`, `p`, `label`, etc.) express meaning and accessibility.
- **Text components** (e.g., `Text`, `Heading`) are implementation APIs that choose:
  - the **HTML element** (`as="h2"`) for semantics
  - the **semantic token** (`style="text.title.md"`) for appearance
- **Design tokens** define the style contracts (`text.title.md`) and the primitives they reference.

> Tag choice (`h2`) and style choice (`text.title.md`) are intentionally decoupled.

---

## Core Tokens

Core tokens are intent-free primitives and the single source of truth for responsiveness.

They exist to:

- centralize fluid logic (all `clamp()` formulas live here)
- keep semantic tokens as **aliases** (stable names, theme-tunable engine)
- make the system predictable (no ad-hoc coefficients in semantics)

### Output Guidance (Web)

The following is specific to CSS/web output and does not affect the semantic contract.

1. A query container rule for layout surfaces (recommended):

```css
.tt-container {
  container-type: inline-size;
}
```

2. A robust fallback strategy in build output:

- emit a viewport-safe fallback first
- override with container units when supported

```css
:root {
  --tt-core-font-scale-text-3: clamp(16px, calc(0.8vi + 12px), 18px);
  --tt-core-font-scale-display-3: clamp(28px, calc(1.6vi + 20px), 40px);
}

@supports (width: 1cqi) {
  :root {
    --tt-core-font-scale-text-3: clamp(16px, calc(0.8cqi + 12px), 18px);
    --tt-core-font-scale-display-3: clamp(28px, calc(1.6cqi + 20px), 40px);
  }
}
```

3. The core token set below (ramps + primitives).

### Core Token Set

Core typography is composed of **two groups**:

1. **Font primitives** — fundamental typographic properties.
2. **Size ramps** — the responsive engine that controls typographic scale.

#### Font Primitives

| Category                          | Tokens                                                                                                                              | Notes                                                                                                            |
| :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **Font families**                 | `core.font.family.sans`, `core.font.family.serif` _(optional)_, `core.font.family.mono`                                             | Defines the font stacks used across the system.                                                                  |
| **Font weights**                  | `core.font.weight.regular` (400), `core.font.weight.medium` (500), `core.font.weight.semibold` (600), `core.font.weight.bold` (700) | If using variable fonts, weights may be tuned at the theme level. Components still consume semantic styles only. |
| **Leading (line-height)**         | `core.font.leading.tight`, `core.font.leading.snug`, `core.font.leading.normal`, `core.font.leading.relaxed`                        | Unitless multipliers for scalable line-height.                                                                   |
| **Tracking (letter-spacing)**     | `core.font.tracking.tight`, `core.font.tracking.normal`, `core.font.tracking.wide`                                                  | `tight` may be used for large headings. `wide` is intended for short labels; avoid for body text.                |
| **Optical sizing** _(optional)_   | `core.font.optical.auto`, `core.font.optical.none`                                                                                  | Enables optical adjustments for variable fonts when supported.                                                   |
| **Numeric features** _(optional)_ | `core.font.numeric.proportional`, `core.font.numeric.tabular`                                                                       | `tabular` is recommended for dashboards or frequently updating numeric values.                                   |

#### Size Ramps (Responsive Engine)

Ramps define the **responsive typographic scale**.  
Each ramp is expressed using `clamp(min, preferred, max)`.

| Ramp              | Tokens                         | Purpose                                            |
| :---------------- | :----------------------------- | :------------------------------------------------- |
| **Text scale**    | `core.font.scale.text.1..6`    | Body text, labels, and dense UI typography.        |
| **Display scale** | `core.font.scale.display.1..6` | Headings, titles, and high-hierarchy display text. |

> **Rule:** Semantic typography styles must map to ramp steps.  
> Semantic tokens never define new `clamp()` formulas.

### Example (Core Typography Definition)

```js
const coreTypography = {
  font: {
    family: {
      sans: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },

    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    leading: {
      tight: 1.15,
      snug: 1.25,
      normal: 1.5,
      relaxed: 1.7,
    },

    tracking: {
      tight: '-0.02em',
      normal: '0em',
      wide: '0.04em',
    },

    optical: {
      auto: 'auto',
      none: 'none',
    },

    numeric: {
      proportional: 'proportional-nums',
      tabular: 'tabular-nums',
    },

    /**
     * Responsive size scale (container-first). Theme must emit a viewport-safe fallback first,
     * then override these when supported via @supports (width: 1cqi).
     */
    scale: {
      text: {
        1: 'clamp(12px, calc(0.6cqi + 10px), 14px)',
        2: 'clamp(14px, calc(0.7cqi + 11px), 16px)',
        3: 'clamp(16px, calc(0.8cqi + 12px), 18px)',
        4: 'clamp(18px, calc(0.9cqi + 13px), 20px)',
        5: 'clamp(20px, calc(1.0cqi + 14px), 24px)',
        6: 'clamp(24px, calc(1.2cqi + 16px), 28px)',
      },

      display: {
        1: 'clamp(20px, calc(1.2cqi + 16px), 28px)',
        2: 'clamp(24px, calc(1.4cqi + 18px), 32px)',
        3: 'clamp(28px, calc(1.6cqi + 20px), 40px)',
        4: 'clamp(32px, calc(1.8cqi + 22px), 48px)',
        5: 'clamp(40px, calc(2.2cqi + 26px), 64px)',
        6: 'clamp(48px, calc(2.6cqi + 30px), 80px)',
      },
    },
  },
};
```

**Expected consumption pattern:** semantic styles reference core tokens by alias
(e.g., `text.body.md → core.font.scale.text.3`, `text.display.lg → core.font.scale.display.5`).

---

## Semantic Tokens

Semantic typography tokens are the only typography API for components.

### Token structure

```
text.{family}.{step}
```

- `family`: `display | headline | title | body | label | code`
- `step`: `lg | md | sm` (code uses `md | sm`)

#### Text Families

Each text family represents a distinct typographic role in the interface.

| `family`   | Meaning                                                                                                                         |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `display`  | Large, high-impact text used for hero sections or prominent page headers. Intended for strong visual hierarchy and limited use. |
| `headline` | Section or page headings that structure content and guide scanning through the interface.                                       |
| `title`    | Titles for surfaces such as cards, panels, dialogs, and structured UI sections.                                                 |
| `body`     | Default text for paragraphs, descriptions, and long-form reading. Optimized for readability.                                    |
| `label`    | Short UI text such as field labels, button text, badges, and metadata.                                                          |
| `code`     | Monospaced text for code snippets, logs, identifiers, or technical data.                                                        |

### Canonical semantic set

- `text.display.{lg|md|sm}`
- `text.headline.{lg|md|sm}`
- `text.title.{lg|md|sm}`
- `text.body.{lg|md|sm}`
- `text.label.{lg|md|sm}`
- `text.code.{md|sm}`

> Keep this set stable. Add new families only if they represent a genuinely new typographic function.

### Semantic Tokens Summary Table

| token              | use when you are building…    | contract (must be true)            | default mapping                                                                     |
| :----------------- | :---------------------------- | :--------------------------------- | :---------------------------------------------------------------------------------- |
| `text.display.lg`  | hero display / landing hero   | strongest hierarchy; avoid overuse | `core.font.scale.display.5`, `core.font.weight.bold`, `core.font.leading.tight`     |
| `text.display.md`  | large display headings        | high hierarchy                     | `core.font.scale.display.4`, `core.font.weight.bold`, `core.font.leading.tight`     |
| `text.display.sm`  | smaller display headings      | high hierarchy                     | `core.font.scale.display.3`, `core.font.weight.semibold`, `core.font.leading.tight` |
| `text.headline.lg` | page/section headline         | clear hierarchy                    | `core.font.scale.display.3`, `core.font.weight.semibold`, `core.font.leading.snug`  |
| `text.headline.md` | section headline              | clear hierarchy                    | `core.font.scale.display.2`, `core.font.weight.semibold`, `core.font.leading.snug`  |
| `text.headline.sm` | small headline                | compact hierarchy                  | `core.font.scale.display.1`, `core.font.weight.semibold`, `core.font.leading.snug`  |
| `text.title.lg`    | surface titles (cards/modals) | title-like, not shouting           | `core.font.scale.text.6`, `core.font.weight.semibold`, `core.font.leading.snug`     |
| `text.title.md`    | default surface title         | title-like                         | `core.font.scale.text.5`, `core.font.weight.semibold`, `core.font.leading.snug`     |
| `text.title.sm`    | compact titles                | title-like                         | `core.font.scale.text.4`, `core.font.weight.medium`, `core.font.leading.snug`       |
| `text.body.lg`     | long-form body (comfortable)  | readable; avoid tight leading      | `core.font.scale.text.4`, `core.font.weight.regular`, `core.font.leading.normal`    |
| `text.body.md`     | default body                  | readable default                   | `core.font.scale.text.3`, `core.font.weight.regular`, `core.font.leading.normal`    |
| `text.body.sm`     | dense body / secondary text   | still readable                     | `core.font.scale.text.2`, `core.font.weight.regular`, `core.font.leading.normal`    |
| `text.label.lg`    | strong labels                 | short text; supports tracking      | `core.font.scale.text.3`, `core.font.weight.medium`, `core.font.leading.snug`       |
| `text.label.md`    | default labels                | short text                         | `core.font.scale.text.2`, `core.font.weight.medium`, `core.font.leading.snug`       |
| `text.label.sm`    | small labels / captions       | short text                         | `core.font.scale.text.1`, `core.font.weight.medium`, `core.font.leading.snug`       |
| `text.code.md`     | code/monospace blocks         | mono; stable glyph width helpful   | `core.font.scale.text.2`, `core.font.family.mono`, `core.font.leading.normal`       |
| `text.code.sm`     | inline code / dense logs      | mono; compact                      | `core.font.scale.text.1`, `core.font.family.mono`, `core.font.leading.normal`       |

---

#### Example

```js
const semanticTypography = {
  text: {
    display: {
      lg: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.display.5}',
        fontWeight: '{core.font.weight.bold}',
        lineHeight: '{core.font.leading.tight}',
        letterSpacing: '{core.font.tracking.tight}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
      md: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.display.4}',
        fontWeight: '{core.font.weight.bold}',
        lineHeight: '{core.font.leading.tight}',
        letterSpacing: '{core.font.tracking.tight}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
      sm: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.display.3}',
        fontWeight: '{core.font.weight.semibold}',
        lineHeight: '{core.font.leading.tight}',
        letterSpacing: '{core.font.tracking.tight}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
    },

    headline: {
      lg: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.display.3}',
        fontWeight: '{core.font.weight.semibold}',
        lineHeight: '{core.font.leading.snug}',
        letterSpacing: '{core.font.tracking.normal}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
      md: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.display.2}',
        fontWeight: '{core.font.weight.semibold}',
        lineHeight: '{core.font.leading.snug}',
        letterSpacing: '{core.font.tracking.normal}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
      sm: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.display.1}',
        fontWeight: '{core.font.weight.semibold}',
        lineHeight: '{core.font.leading.snug}',
        letterSpacing: '{core.font.tracking.normal}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
    },

    title: {
      lg: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.text.6}',
        fontWeight: '{core.font.weight.semibold}',
        lineHeight: '{core.font.leading.snug}',
        letterSpacing: '{core.font.tracking.normal}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
      md: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.text.5}',
        fontWeight: '{core.font.weight.semibold}',
        lineHeight: '{core.font.leading.snug}',
        letterSpacing: '{core.font.tracking.normal}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
      sm: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.text.4}',
        fontWeight: '{core.font.weight.medium}',
        lineHeight: '{core.font.leading.snug}',
        letterSpacing: '{core.font.tracking.normal}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
    },

    body: {
      lg: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.text.4}',
        fontWeight: '{core.font.weight.regular}',
        lineHeight: '{core.font.leading.normal}',
        letterSpacing: '{core.font.tracking.normal}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
      md: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.text.3}',
        fontWeight: '{core.font.weight.regular}',
        lineHeight: '{core.font.leading.normal}',
        letterSpacing: '{core.font.tracking.normal}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
      sm: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.text.2}',
        fontWeight: '{core.font.weight.regular}',
        lineHeight: '{core.font.leading.normal}',
        letterSpacing: '{core.font.tracking.normal}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
    },

    label: {
      lg: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.text.3}',
        fontWeight: '{core.font.weight.medium}',
        lineHeight: '{core.font.leading.snug}',
        letterSpacing: '{core.font.tracking.normal}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
      md: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.text.2}',
        fontWeight: '{core.font.weight.medium}',
        lineHeight: '{core.font.leading.snug}',
        letterSpacing: '{core.font.tracking.normal}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
      sm: {
        fontFamily: '{core.font.family.sans}',
        fontSize: '{core.font.scale.text.1}',
        fontWeight: '{core.font.weight.medium}',
        lineHeight: '{core.font.leading.snug}',
        letterSpacing: '{core.font.tracking.wide}',
        fontOpticalSizing: '{core.font.optical.auto}',
      },
    },

    code: {
      md: {
        fontFamily: '{core.font.family.mono}',
        fontSize: '{core.font.scale.text.2}',
        fontWeight: '{core.font.weight.regular}',
        lineHeight: '{core.font.leading.normal}',
        letterSpacing: '{core.font.tracking.normal}',
        fontVariantNumeric: '{core.font.numeric.tabular}',
      },
      sm: {
        fontFamily: '{core.font.family.mono}',
        fontSize: '{core.font.scale.text.1}',
        fontWeight: '{core.font.weight.regular}',
        lineHeight: '{core.font.leading.normal}',
        letterSpacing: '{core.font.tracking.normal}',
        fontVariantNumeric: '{core.font.numeric.tabular}',
      },
    },
  },
};
```

---

## Rules of Engagement (non-negotiable)

1. **Semantic-only consumption:** components use only `text.*` styles.
2. **No responsive logic in components:** responsiveness lives in core ramps only.
3. **Tag ≠ style:** HTML element choice is semantic; style choice is visual contract (`text.*`).
4. **No `font-variation-settings` by default:** use standard properties (weight/width/optical sizing) unless you truly need a custom axis.
5. **Numeric stability in dashboards:** use tabular numbers where values update frequently (`text.code.*` or a dedicated numeric style if needed).
6. **Robustness under user settings:** UI must survive 200% text resize and user text spacing adjustments without losing content or functionality.

---

## Theming

Themes may tune:

- font size scale (`core.font.scale.*`) — the responsive engine
- font stacks (`core.font.family.*`)
- weights (`core.font.weight.*`)
- leading/tracking defaults (`core.font.leading.*`, `core.font.tracking.*`)
- optional features (`core.font.optical.*`, `core.font.numeric.*`)

Semantic token names **never change across themes**.

---

## Validation

### Errors (validation must fail when)

- leading order breaks:
  - `tight >= snug`
  - `snug >= normal`
  - `normal >= relaxed`

- weight order breaks:
  - `regular > medium`
  - `medium > semibold`
  - `semibold > bold`

- any emitted `fontOpticalSizing` value is not `auto` or `none`

- generated output does not emit a viewport-safe fallback before container-based overrides

- generated output does not gate container-based overrides behind `@supports (width: 1cqi)`

### Warning (validation should warn when)

- adjacent steps in the same semantic family resolve to the same effective text contract

---

## Summary

- Core defines primitives + responsive ramps (the engine)
- Semantic defines a small canonical set: display/headline/title/body/label (+ code)
- Components consume only semantic `text.*`
- Responsiveness is native (ramp-based), not component logic
- System is robust under accessibility stress (resize + text spacing)
