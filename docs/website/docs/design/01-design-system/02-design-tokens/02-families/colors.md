---
title: Colors
---

# Colors

Colors define the **semantic color language** of ttoss.

They express:

- brand identity
- interface hierarchy
- interaction meaning
- readability and contrast
- state communication

This system is built on **two explicit layers**:

1. **Core Colors** — intent-free color primitives
2. **Semantic Colors** — stable color contracts consumed by UI code

Components must always consume **semantic colors**, never core colors directly.

> **Rule:** Core colors are never referenced in components.

---

## Scope: Colors vs Other Families

Colors define **meaning and visual contrast**.

They do **not** define:

- depth (`elevation`)
- layering order (`z-index`)
- line width or style (`borders`)
- whole-element transparency (`opacity`)
- chart or data palettes (data visualization)

Use:

- **Colors** for semantic meaning and foreground/background relationships
- **Elevation** for perceived depth
- **Borders** for line geometry
- **Opacity** for controlled transparency
- **Data visualization tokens** for charts and quantitative encodings

> Key principle: **color names express intent, not appearance.**

---

## Core Colors

Core colors are **intent-free primitives**.
They define which colors exist in a theme, but not where they are used.

Core colors exist to:

- define the brand palette
- define the neutral surface/contrast scale
- provide hue scales for semantic mapping
- provide sufficient palette depth for semantic remapping across modes

### Core token structure

```text
core.colors.{family}.{scale}
```

- `family`: a palette family such as `brand`, `neutral`, `red`, `green`, `blue`
- `scale`: an ordered step inside that family

### Core groups

#### 1. Brand scale

Brand defines the identity color family of the theme.

Examples:

- `core.colors.brand.100`
- `core.colors.brand.300`
- `core.colors.brand.500`
- `core.colors.brand.700`
- `core.colors.brand.900`

> `brand` is a palette family, not a semantic role.
> Do not encode usage in the core layer (`main`, `cta`, `danger`, `link`, etc.).

#### 2. Neutral scale

Neutral defines the base surface and contrast scale.

Examples:

- `core.colors.neutral.0`
- `core.colors.neutral.50`
- `core.colors.neutral.100`
- `core.colors.neutral.200`
- `core.colors.neutral.300`
- `core.colors.neutral.500`
- `core.colors.neutral.700`
- `core.colors.neutral.900`
- `core.colors.neutral.1000`

> `neutral` is the zero-saturation anchor scale (greyscale/slate). It is the primary source for surfaces, text contrast, dividers, and subdued UI. The name `neutral` is a palette-layer convention, not a semantic role — functionally equivalent to "gray" in other design systems. Use step `0` for the white-end and step `1000` for the black-end.

#### 3. Hue scales

Hue scales provide additional semantic mapping options.

Examples:

- `core.colors.red.100..900`
- `core.colors.green.100..900`
- `core.colors.yellow.100..900`
- `core.colors.blue.100..900`
- `core.colors.purple.100..900`

Hue families are fully open — a theme decides which families it includes. No fixed set is required beyond `brand` and `neutral`. Add a hue family only when it is needed to support a concrete semantic or brand requirement.

### Core rules (non-negotiable)

1. **Core is value-only**
   Core names define palette families and scale positions, never usage.

2. **No semantic naming in core**
   Avoid names like `danger`, `warning`, `primaryButton`, `link`, `surface`, or `focus`.

3. **No mode naming in core**
   Core values are immutable across modes. Modes remap semantic references, not core token names.

4. **No component naming in core**
   Avoid names like `cardBg`, `inputBorder`, or `buttonBlue`.

### Example (Core Color Definition)

```js
const coreColors = {
  colors: {
    brand: {
      100: '#E6F0FF',
      300: '#8CB8FF',
      500: '#1463FF',
      700: '#0B3EA8',
      900: '#082861',
    },

    neutral: {
      0: '#FFFFFF',
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      500: '#64748B',
      700: '#334155',
      900: '#0F172A',
      1000: '#020617',
    },

    red: {
      100: '#FEE2E2',
      300: '#FCA5A5',
      500: '#EF4444',
      700: '#B91C1C',
      900: '#7F1D1D',
    },

    green: {
      100: '#DCFCE7',
      300: '#86EFAC',
      500: '#22C55E',
      700: '#15803D',
      900: '#14532D',
    },
  },
};
```

**Expected consumption pattern:** semantic color tokens reference core colors by alias.

---

## Semantic Colors

Semantic colors define the **public color API** of the system.

They translate raw palettes into stable UI meaning.

Semantic colors answer:

- where in the experience the color is used
- what role the color plays
- which visual dimension it affects
- which state it represents

### Token structure

```text
{ux}.{role}.{dimension}.{state?}
```

- `ux`: functional UX area
- `role`: semantic emphasis or meaning
- `dimension`: what visual layer receives the color
- `state`: optional interaction or system state

### Examples

- `action.primary.background.default`
- `action.primary.text.default`
- `input.negative.border.focused`
- `navigation.primary.text.current`
- `content.muted.text.default`
- `feedback.positive.background.default`

---

## Canonical Registry

The foundation color system keeps a **small canonical registry**.

### UX level

| `ux`         | Meaning                                             |
| :----------- | :-------------------------------------------------- |
| `action`     | Triggers actions or changes state                   |
| `input`      | Data entry, selection, and form controls            |
| `navigation` | Movement and orientation through the product        |
| `feedback`   | Reactive system or user-result messages             |
| `guidance`   | Preventive or instructional guidance                |
| `discovery`  | Search, filter, refine, and exploratory interaction |
| `content`    | Informational surfaces and readable content         |

> Keep this set stable.
> Domain-specific semantics such as `social`, `commerce`, or `gamification` do **not** belong to the foundation by default.
> Model those at the pattern/application layer unless they are promoted through governance.

### Role level

| `role`      | Meaning                             |
| :---------- | :---------------------------------- |
| `primary`   | highest emphasis in that UX context |
| `secondary` | supporting emphasis                 |
| `accent`    | highlight emphasis                  |
| `muted`     | subdued or low-emphasis treatment   |
| `positive`  | success / confirmation meaning      |
| `caution`   | warning / attention without failure |
| `negative`  | error / destructive meaning         |

> Roles express intent, not color family.
> `primary` does not mean “brand blue,” and `negative` does not mean “red.”

### Dimension level

| `dimension`  | Meaning                                                    |
| :----------- | :--------------------------------------------------------- |
| `background` | fills and surface backgrounds                              |
| `border`     | outlines, separators, rings, and other line-color pairings |
| `text`       | readable foreground, labels, and text-like icons           |

### State level

| `state`         | Meaning                         |
| :-------------- | :------------------------------ |
| `default`       | resting/base state              |
| `hover`         | pointer hover                   |
| `active`        | press/engaged moment            |
| `focused`       | keyboard/programmatic focus     |
| `disabled`      | unavailable/non-interactive     |
| `selected`      | selected item in a set          |
| `checked`       | on/off control state            |
| `pressed`       | pressed toggle state            |
| `expanded`      | disclosure open state           |
| `current`       | current location in navigation  |
| `visited`       | visited link state              |
| `indeterminate` | mixed/unknown boolean state     |
| `droptarget`    | valid drag-and-drop destination |

> Keep the state set stable.
> Add a new state only when the meaning cannot be expressed by an existing one.

---

## Legal Combinations

The semantic grammar is stable, but not every combination is valid. The tables below are the complete reference.

### UX, roles, and context-specific states

| `ux`         | Allowed roles                                                                | Context-specific states                           |
| :----------- | :--------------------------------------------------------------------------- | :------------------------------------------------ |
| `action`     | `primary`, `secondary`, `accent`, `muted`, `negative`                        | `pressed`                                         |
| `input`      | `primary`, `secondary`, `muted`, `positive`, `caution`, `negative`           | `checked`, `indeterminate`, `pressed`, `expanded` |
| `navigation` | `primary`, `secondary`, `accent`, `muted`                                    | `current`, `visited`, `expanded`                  |
| `feedback`   | `primary`, `muted`, `positive`, `caution`, `negative`                        | —                                                 |
| `guidance`   | `primary`, `secondary`, `accent`, `muted`, `caution`                         | —                                                 |
| `discovery`  | `primary`, `secondary`, `accent`, `muted`                                    | `expanded`, `droptarget`                          |
| `content`    | `primary`, `secondary`, `accent`, `muted`, `positive`, `caution`, `negative` | `visited`                                         |

> Context-specific states extend the base set available in every context: `default`, `hover`, `active`, `focused`, `disabled`, `selected`.

### Dimension expectations

Not every implementation needs all three dimensions. Components choose which they consume.

| Pattern        | Dimensions used                |
| :------------- | :----------------------------- |
| Text link      | `text`                         |
| Ghost button   | `text`, `border`               |
| Filled button  | `background`, `text`           |
| Surface / card | `background`, `border`, `text` |

---

## Relationship to Modes

Core palette values are **immutable across modes**. Modes remap which core tokens semantic color tokens reference.

When light/dark mode changes:

- core palette values do **not** change
- semantic token names do **not** change
- semantic token **references** may point to different positions in the palette
- components continue consuming the same semantic tokens

> Modes remap references, not values.

If a semantic color works in one mode but fails in another, remap the semantic reference to a different core token — do not mutate the core value or rename the semantic token.

---

## Relationship to Borders, Elevation, and Opacity

Color meaning stays in the color system.

This means:

- border width/style belong to `borders`
- shadows belong to `elevation`
- whole-element transparency belongs to `opacity`
- color tokens may pair with those families, but they do not replace them

### Example

A focus ring may combine:

- line geometry from `focus.ring`
- color from `input.primary.border.focused`

A raised card may combine:

- surface color from `content.primary.background.default`
- outline color from `content.muted.border.default`
- shadow from `elevation.surface.raised`

---

## Rules of Engagement (non-negotiable)

1. **Semantic-only consumption**
   Components use semantic colors only.

2. **Core is value-only**
   Core colors define palettes and scales, never usage intent.

3. **Keep the canonical registry small**
   Do not expand `ux`, `role`, or `state` casually.

4. **Do not invent ad-hoc names**
   Avoid local names like `buttonBlue`, `dangerBg`, `cardBorderSoft`, or `heroTextLight`.

5. **Do not encode component names in foundation tokens**
   Avoid `button.primary.background.default` in the foundation layer.

6. **Do not encode mode in semantic names**
   Avoid `textOnDark`, `darkBorder`, `lightSurface`, etc.

7. **Do not use color to model depth**
   Use elevation for depth, not extra semantic color roles.

8. **Validate pairings, not isolated swatches**
   A color is only valid when the intended semantic pairing is valid.

---

## Decision Matrix (pick fast)

1. **Is this triggering something?**
   → `action.*`

2. **Is this for data entry or selection?**
   → `input.*`

3. **Is this moving the user through the product?**
   → `navigation.*`

4. **Is this reactive status or outcome?**
   → `feedback.*`

5. **Is this preventive help or instruction?**
   → `guidance.*`

6. **Is this search/filter/refine/explore?**
   → `discovery.*`

7. **Is this informational content or a content surface?**
   → `content.*`

8. **Are you inventing a new top-level UX domain?**
   → solve above the foundation first; promote only through governance

---

## Usage Examples

| Usage                            | Token example                          |
| :------------------------------- | :------------------------------------- |
| Filled primary button background | `action.primary.background.default`    |
| Filled primary button label      | `action.primary.text.default`          |
| Input border at rest             | `input.primary.border.default`         |
| Input border on focus            | `input.primary.border.focused`         |
| Current nav item text            | `navigation.primary.text.current`      |
| Muted body copy                  | `content.muted.text.default`           |
| Negative feedback surface        | `feedback.negative.background.default` |
| Positive feedback text           | `feedback.positive.text.default`       |

### Example (Semantic Color Definition)

```js
const semanticColors = {
  action: {
    primary: {
      background: {
        default: '{core.colors.brand.500}',
        hover: '{core.colors.brand.700}',
        active: '{core.colors.brand.900}',
        disabled: '{core.colors.neutral.200}',
      },
      text: {
        default: '{core.colors.neutral.0}',
        disabled: '{core.colors.neutral.500}',
      },
      border: {
        default: '{core.colors.brand.500}',
        focused: '{core.colors.brand.700}',
        disabled: '{core.colors.neutral.200}',
      },
    },
  },

  content: {
    muted: {
      text: {
        default: '{core.colors.neutral.500}',
      },
      border: {
        default: '{core.colors.neutral.200}',
      },
    },
  },

  feedback: {
    negative: {
      background: {
        default: '{core.colors.red.100}',
      },
      text: {
        default: '{core.colors.red.900}',
      },
      border: {
        default: '{core.colors.red.500}',
      },
    },
  },
};
```

---

## Theming

Themes may tune:

- core palette values (the immutable palette for that theme)
- which core tokens semantic tokens reference
- alternate semantic mappings for each supported mode

Semantic token names **never change across themes**.

A theme may become more muted, more vivid, more angular, more enterprise, or more playful by changing core values and semantic mappings — not by inventing a parallel semantic vocabulary.

---

## Validation

### Errors (validation must fail when)

- a semantic color token uses an invalid `ux → role` combination
- a semantic color token uses a state outside the allowed state restrictions for that contract
- any required semantic pairing fails the contrast targets defined below
- any supported mode fails the same required pairings for the same semantic contract

### Warning (validation should warn when)

- a separately defined state token resolves to the same color as the state it is meant to distinguish
- a separately defined `focused`, `selected`, or `current` token resolves to the same color as its default state
- two distinct semantic tokens in the same `ux` / `dimension` / `state` resolve to the same color

### Required pairings

Validation must check at least these pairings:

1. **Text pairing**
   - `*.text.*` against the corresponding `*.background.*`
   - normal text: `≥ 4.5:1`
   - large text: `≥ 3:1`

2. **Border / non-text pairing**
   - `*.border.*` against the adjacent background it sits on
   - minimum: `≥ 3:1`

3. **Focus pairing**
   - the focused color against the adjacent background
   - and, when focus distinction depends on color, against the prior unfocused state

4. **Selected/current pairing**
   - the selected or current color against the adjacent background
   - and, when distinction depends on color, against the prior state

### Note

- Validate pairings, not isolated swatches.
- Color tokens define the semantic contrast contract.
- Meaning that depends on more than color alone is validated at the pattern, component, and final output layers.

---

## Summary

- Core colors define **palette families and scales**
- Semantic colors define a **small, stable color contract**
- Components consume **semantic colors only**
- Modes remap **semantic references**, not core values or semantic names
- Validation checks **legal combinations and contrast pairings**
- The system stays small, consistent, and scalable by protecting semantic meaning
