---
title: Colors
---

# Colors

Colors define the **semantic color language** of ttoss — brand identity, hierarchy, interaction meaning, contrast, state.

The system has **two layers**: **Core Colors** (intent-free palette primitives) and **Semantic Colors** (stable contracts consumed by UI code). Components consume semantic colors only — never core directly.

---

## UX contexts in 60 seconds

Every semantic color token starts with a **UX context** — a plain description of _what kind of UI_ the color is for. There are five, and they cover the whole surface area of a UI:

| UX context      | Use it for                                                                                             | Typical components                                                                   |
| :-------------- | :----------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| `action`        | anything the user **triggers**                                                                         | buttons, toggles, menu items, action icons                                           |
| `input`         | anything the user **enters or selects data into**                                                      | text fields, selects, checkboxes, radios                                             |
| `navigation`    | anything that **moves the user** between views or sections                                             | links, tabs, breadcrumbs, pagination                                                 |
| `feedback`      | surfaces that **report the outcome** of an action or system event                                      | toasts, alerts, banners, inline validation                                           |
| `informational` | **presentational surfaces** — hold, group, layer, frame, or display content; never drive a transaction | body text, page backgrounds, cards, panels, dialogs, dividers, list rows, accordions |

Picking a context is usually trivial: _"is the user about to act, type, move, hear back, or just **see/contain** something?"_

> **Interactivity is not a tiebreaker.** A focusable Card, clickable panel, or expandable accordion is still `informational` — its _purpose_ is presentational. Focusability and disclosure are orthogonal capabilities (covered by `focus.ring.color` and the `expanded` state).

> **Advanced.** The five contexts are a formal projection of the nine FSL Entity Kinds — see [FSL Entity Kind Mapping](#fsl-entity-kind-mapping) below. Most component authors never need to read the FSL layer.

---

## Scope

Colors carry **meaning and visual contrast** — nothing else. Depth lives in `elevation`, line geometry in `borders`, whole-element transparency in `opacity`, charts in data visualization tokens. Color may pair with those families; it does not replace them.

> **Color names express intent, not appearance.**

---

## Core Colors

Core colors are **intent-free primitives** — they define which colors exist in a theme (brand, neutral, hue scales) at sufficient depth for semantic remapping across modes, but not where they are used.

### Core token structure

```text
core.colors.{family}.{scale}
```

- `family`: a palette family such as `brand`, `neutral`, `red`, `green`, `blue`
- `scale`: an ordered step inside that family

### Core groups

A theme MUST define `brand` and `neutral`; hue families are open. Add a hue family only when needed to support a concrete semantic mapping.

| Family                                                                            | Role in the palette                                                                                                                        | Required steps                    |
| :-------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------- |
| `brand`                                                                           | Identity hue. Depth allows light/dark remapping without new values.                                                                        | open subset across `100..900`     |
| `neutral`                                                                         | Zero-saturation anchor for surfaces, text contrast, dividers, subdued UI. Step `0` = white-end, `1000` = black-end, `500` = canonical mid. | step `500` mandatory; others open |
| Hue scales (`red`, `orange`, `green`, `yellow`, `teal`, `purple`, `pink`, \u2026) | Optional palette families used as semantic mapping sources.                                                                                | open                              |

> `brand` and `neutral` are palette-layer conventions, not semantic roles \u2014 do not encode usage (`main`, `cta`, `danger`, `link`, `surface`, `focus`) in core names. `neutral` is functionally equivalent to "gray" in other systems.\n\n> **Why `CoreColorRef` is open.** It is typed as `'{core.colors.${string}}'` \u2014 a template literal, not a closed union derived from the concrete theme. Type safety for color usage lives at the _semantic_ layer (legal `ux \u00d7 role \u00d7 dimension \u00d7 state` and contrast pairings), not the palette-ref level. A closed union would break extensibility for derived themes and create a circular dependency between `Types.ts` and `baseTheme.ts`.

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
      400: '#94A3B8',
      500: '#64748B',
      700: '#334155',
      900: '#0F172A',
      1000: '#020617',
    },

    red: {
      100: '#FEE2E2',
      300: '#FCA5A5',
      500: '#EF4444',
      600: '#DC2626', // filled negative surfaces: neutral.0 text at AA Normal
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

Semantic colors are the **public color API** — stable contracts that translate raw palettes into UI meaning along four axes: where in the experience (`ux`), what role (`role`), which visual layer (`dimension`), which state (`state`).

### Token structure

```text
{ux}.{role}.{dimension}.{state?}
```

See [Usage Examples](#usage-examples) below for concrete tokens.

---

## FSL Entity Kind Mapping

The `ux` axis is a projection-scoped subset of FSL Entity Kinds (FSL Structural Language §17.1). This normative table maps each FSL Entity Kind → token UX context; the planned resolver (see [component-model.md](/docs/design/design-system/components/component-model) — not yet implemented) will consume it to translate a component's Entity into its token context:

| FSL Entity Kind | Token `ux`      | Notes                                                                                                                                                                |
| :-------------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Action`        | `action`        | 1:1                                                                                                                                                                  |
| `Input`         | `input`         | 1:1                                                                                                                                                                  |
| `Selection`     | `input`         | checkbox, radio, picker — no separate `selection` UX context                                                                                                         |
| `Navigation`    | `navigation`    | 1:1                                                                                                                                                                  |
| `Feedback`      | `feedback`      | 1:1                                                                                                                                                                  |
| `Collection`    | `informational` | menu, list, table                                                                                                                                                    |
| `Overlay`       | `informational` | dialog, popover                                                                                                                                                      |
| `Disclosure`    | `navigation`    | accordion, collapsible panel, `<details>` — in-place reveal answers "what's here?" (structural orientation, ADR-001); uses `expanded` state for open/closed contract |
| `Structure`     | `informational` | panel, shell, frame                                                                                                                                                  |

Interaction patterns that do not correspond to an Entity Kind (tooltips, helper banners, search/filter widgets) are expressed through existing kinds — typically `Overlay` for guidance and `Input` for discovery.

---

## Role Coverage

`role` is a **discriminated union** of two decision classes (see [FSL Lexicon §5](../../fsl/fsl-lexicon.md)) — a token carries one or the other, never both:

- **Emphasis**: `primary`, `secondary`, `accent`, `muted`
- **Valence**: `positive`, `caution`, `negative`

A valence implies its own emphasis. Intensity within a valence is expressed by `dimension` (e.g. `negative.background` is louder than `negative.text`), not by combining emphasis with valence. Each UX context enables only the subset that has stable meaning in it:

| Class    | Role        | `action` | `input` | `navigation` | `feedback` | `informational` |
| :------- | :---------- | :------: | :-----: | :----------: | :--------: | :-------------: |
| Emphasis | `primary`   |    ✓     |    ✓    |      ✓       |     ✓      |        ✓        |
| Emphasis | `secondary` |    ✓     |    ✓    |      ✓       |     —      |        ✓        |
| Emphasis | `accent`    |    ✓     |    —    |      ✓       |     —      |        ✓        |
| Emphasis | `muted`     |    ✓     |    ✓    |      ✓       |     ✓      |        ✓        |
| Valence  | `positive`  |    —     |    ✓    |      —       |     ✓      |        ✓        |
| Valence  | `caution`   |    —     |    ✓    |      —       |     ✓      |        ✓        |
| Valence  | `negative`  |    ✓     |    ✓    |      —       |     ✓      |        ✓        |

**Why some cells are empty:**

- `action.positive / action.caution` — Outcome and risk live in `feedback.*`; an Action's own colour expresses only `negative` evaluation (FSL §5). Destructive consequence (FSL §6) is a frequent driver of that choice, but the two dimensions are distinct — `negative` may also encode adverse-but-non-destructive intent (cancel paid subscription).
- `navigation.*` valences — Navigation communicates location (`current`, `visited`), not health state.
- `feedback.secondary / accent` — Feedback is direct: `primary` and `muted` cover its emphasis range.
- `input.accent` — Inputs use `primary` for the brand-influenced active state; `accent` creates hierarchy ambiguity.

### Picking a role

Valence dominates emphasis: if the token communicates **outcome or validity** (success / warning / error / destructive), pick the valence first — emphasis is implicit. Otherwise pick the emphasis that matches **hierarchy weight in the current view**.

**Emphasis (no outcome to communicate):**

| You want to communicate…                                            | Role        |
| :------------------------------------------------------------------ | :---------- |
| the single most important element on this view                      | `primary`   |
| an alternative coexisting with the primary one                      | `secondary` |
| a highlight that draws attention without being the main path        | `accent`    |
| presence with low priority (helper text, divider, optional control) | `muted`     |

> Only one `primary` per view per `{ux}`. If two candidates compete for `primary`, one of them is `secondary`.

**Valence (outcome / validity to communicate):**

| The token reports…                                                            | Role                     |
| :---------------------------------------------------------------------------- | :----------------------- |
| success, completion, validity confirmed                                       | `positive`               |
| risk that needs attention but the user is not blocked                         | `caution`                |
| failure, invalid state, or adverse intent (including destructive consequence) | `negative`               |
| no outcome — just hierarchy                                                   | use **emphasis** instead |

> Intensity _within_ a valence is expressed by `dimension`, not by combining with emphasis.
>
> ❌ `feedback.negative.primary.background.default` — combining valence + emphasis is forbidden.
> ✅ `feedback.negative.text.default` — quiet error (foreground only).
> ✅ `feedback.negative.background.default` — loud error (filled surface).

---

## Dimension and State Registry

The foundation keeps a **small canonical registry**. `ux` is defined in [UX contexts](#ux-contexts-in-60-seconds); `role` in [Role Coverage](#role-coverage). Domain-specific semantics (`social`, `commerce`, `gamification`) do not belong to the foundation \u2014 model them at the pattern/application layer unless promoted through governance.

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

#### Picking a state (disambiguation)

Several states sound interchangeable but answer different questions. Pick by **what the state asserts about the element**, not by the verb in the component name.

| The state asserts…                                                                          | State           |
| :------------------------------------------------------------------------------------------ | :-------------- |
| pointer is currently over the element                                                       | `hover`         |
| pointer/key is currently down on the element (transient, lasts only while held)             | `active`        |
| element has keyboard or programmatic focus                                                  | `focused`       |
| element is non-interactive                                                                  | `disabled`      |
| element is **one of many** in a set and the user picked it (tab, list row, segment)         | `selected`      |
| element is a **two-state control** that is currently on (checkbox, radio, switch)           | `checked`       |
| element is a **toggle button** that is currently engaged (persistent, not transient)        | `pressed`       |
| disclosure / accordion / details is currently open                                          | `expanded`      |
| element is the user's **current location** in a navigation set (active route, current step) | `current`       |
| link points to a URL the user has visited                                                   | `visited`       |
| boolean control is in a mixed/unknown state (parent checkbox over partial children)         | `indeterminate` |
| element is a **valid drop destination** during an active drag                               | `droptarget`    |

**Common confusions resolved:**

- **Tab in a tablist** → `selected` (one of many) and, when it represents the live route, also `current`. Not `active`, not `pressed`.
- **Toggle button ("Bold" in a toolbar)** → `pressed` (persistent). `active` is the brief moment of clicking.
- **Checkbox / Switch / Radio** → `checked`. Not `selected`, not `pressed`.
- **Open accordion section** → `expanded`. Not `active`, not `selected`.
- **Currently viewed nav item** → `current`. Not `selected`, not `active`.
- **Button mid-click** → `active`. Releases back to `default` / `hover`.

---

## Legal Combinations

Not every `{ux} × role × state` is valid. Allowed **roles** per context are in [Role Coverage](#role-coverage); allowed **states** per context are below. Both are enforced by `Types.ts` — a token outside its row will not type-check.

### Legal states per context

Most contexts share an **interactive base**: `default`, `hover`, `active`, `focused`, `disabled`, `droptarget`. `feedback` is the exception — feedback is communicative, not interactive (FSL §3), so only `default`, `focused` (focusable wrapper / close button), and `disabled` apply.

| `ux`            | Allowed states (full, no implicit base)                                                                                          |
| :-------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `action`        | `default`, `hover`, `active`, `focused`, `disabled`, `droptarget`, `pressed`, `expanded`                                         |
| `input`         | `default`, `hover`, `active`, `focused`, `disabled`, `droptarget`, `selected`, `checked`, `indeterminate`, `pressed`, `expanded`, `invalid` |
| `navigation`    | `default`, `hover`, `active`, `focused`, `disabled`, `droptarget`, `selected`, `current`, `visited`, `expanded`                  |
| `feedback`      | `default`, `focused`, `disabled` _(communicative, not interactive)_                                                              |
| `informational` | `default`, `hover`, `active`, `focused`, `disabled`, `droptarget`, `selected`, `visited`, `expanded`                             |

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

Core palette values are **immutable across modes**; modes remap which core tokens the semantic layer references. Token names and component code never change. If a semantic color works in one mode but fails in another, remap the semantic reference to a different core token — do not mutate the core value or rename the semantic token.

> Modes remap references, not values.

---

## Cross-cutting tokens (siblings of `semantic.colors.*`)

Two tokens carry **system-wide defaults** that no `{ux}` owns. They live as siblings of `semantic.colors.*` per [model.md §6](../model.md#6-no-parallel-vocabulary), not inside it:

- `semantic.focus.ring.color` — system focus indicator color
- `semantic.overlay.scrim` — modal backdrop

They are **not** parallel vocabulary: per-context tokens (`{ux}.{role}.border.focused`) answer _"how does this `{ux}` look when focused?"_; cross-cutting tokens answer _"what is the system default when no `{ux}` applies?"_.

### Focus color — which token to pick

| The component is…                                                                                                | Use                                                                       |
| :--------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| an `Action` / `Input` / `Navigation` / `Feedback` (clear FSL Entity Kind)                                        | `{ux}.{role}.border.focused` from `semantic.colors.*`                     |
| an `Informational` surface made interactive (focusable Card, profile chip, custom widget with no obvious `{ux}`) | `semantic.focus.ring.color`                                               |
| an `Input` with validation valence (`negative`, `caution`) where focus must inherit the valence colour           | `input.{negative\|caution}.border.focused` (overrides the system default) |

The two paths are not duplicates — they answer different questions and are picked by _which question the component is asking_.

### Example

A focusable profile card (no obvious `{ux}`):

- line geometry from `semantic.border.outline.surface` + `semantic.focus.ring.{width,style}` on `:focus-visible`
- focus colour from `semantic.focus.ring.color` (system default)

A text input in error:

- line geometry from `semantic.border.outline.control` + `semantic.focus.ring.{width,style}` on `:focus-visible`
- focus colour from `input.negative.border.focused` (per-context override; the negative valence outranks the system default)

A raised card may combine:

- surface color from `informational.primary.background.default`
- outline color from `informational.muted.border.default`
- shadow from `elevation.surface.raised`

### Stacking informational surfaces

Multiple `informational` surfaces commonly overlap in the visual hierarchy — a Dialog (`Overlay`) over a page, a Card (`Structure`) over a panel, a row inside a List (`Collection`). They share the same UX context by design (see [FSL Entity Kind Mapping](#fsl-entity-kind-mapping)) and may resolve to the **same** `informational.*.background` value, especially in dark modes where the available `core.colors.neutral` range is compressed.

Differentiation between stacked `informational` surfaces is paid in this order — **never in colour**:

1. **`elevation`** is the primary separator. `Overlay → elevation.surface.overlay`, `Structure`/`Collection` → `elevation.surface.flat | raised`. Drop shadows are local to each level, so the rule survives arbitrary nesting (Card inside Dialog inside Drawer): each level paints its own shadow over whatever sits beneath it.
2. **`border.outline.surface`** is the secondary separator. A 1px outline at ≥ 3:1 contrast against the adjacent background guarantees a perceptual edge even when shadow is suppressed (high-contrast preferences, print).
3. **Tonal step displacement** is the optional reinforcement, delivered through `elevation.tonal.*` — **not** a second background token. By default the page and every contained `informational` surface resolve from the _same_ token (`informational.primary.background.default`); there is no separate `page` colour role, and none should be added. When a theme wants a raised surface to read as a literal step lighter/darker than the page (the classic "grey page, white cards", or dark-mode lifted surfaces), it maps `elevation.tonal.{raised,overlay,blocking}` to a surface-colour overlay on top of the shared background. The page (flat stratum) has no tonal overlay, so the net effective colours differ by one step while the base colour vocabulary stays single-sourced. This keeps [Rules of Engagement #4](#rules-of-engagement-non-negotiable) intact: the colour token is not carrying depth — `elevation` is.

> **Why not two background tokens.** Page-vs-card is a stratum distinction, and strata are an `elevation` axis, not a `role` axis (`role` is emphasis/valence, §Role Coverage). Splitting the page background into its own colour role would encode depth in colour — the exact move Rule #4 forbids. The single `informational.primary.background.default` + `elevation` (shadow) + `elevation.tonal` (surface lift) + `border.outline.surface` fully expresses the stack.

This is the operational form of [Rules of Engagement #4](#rules-of-engagement-non-negotiable): colour expresses intent, not depth. If two stacked surfaces still feel indistinguishable after applying (1) + (2) + (3), the answer is to strengthen elevation/border/tonal or remap a step — never to introduce a new colour bucket.

---

## Rules of Engagement (non-negotiable)

1. **Semantic-only consumption.** Components consume semantic colors only; core never directly.
2. **Intent, not appearance.** Names express role and meaning — forbid `buttonBlue`, `dangerBg`, `darkBorder`, `cardBorderSoft`, `textOnDark`. No component or mode names in foundation tokens.
3. **Keep the registry small.** Do not expand `ux`, `role`, or `state` casually; promote new entries only through governance.
4. **Color does not model depth.** Use `elevation` for depth, `borders` for line geometry; do not invent extra color roles to encode them.
5. **Validate pairings, not swatches.** A color is only valid when its intended `text ↔ background` or `border ↔ adjacent surface` pairing is valid.

---

## Usage Examples

| Usage                            | Token example                          |
| :------------------------------- | :------------------------------------- |
| Filled primary button background | `action.primary.background.default`    |
| Filled primary button label      | `action.primary.text.default`          |
| Input border at rest             | `input.primary.border.default`         |
| Input border on focus            | `input.primary.border.focused`         |
| Current nav item text            | `navigation.primary.text.current`      |
| Muted body copy                  | `informational.muted.text.default`     |
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

  informational: {
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

Themes tune **core palette values**, **which core tokens semantic tokens reference**, and **alternate semantic mappings per mode**. Semantic token names never change across themes. A theme becomes more muted, vivid, angular, enterprise, or playful by changing core values and semantic mappings — not by inventing parallel semantic vocabulary.

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
   - Only `*.muted.*` contexts (intentionally subdued) are held to the large-text
     floor. All other contexts — including `action.*` button labels, which render
     at `text.label` sizes and do **not** qualify as WCAG large text — must meet
     `≥ 4.5:1`.

2. **Border / non-text pairing**
   - `*.border.*` against the adjacent background it sits on
   - minimum: `≥ 3:1`

3. **Focus pairing**
   - the focused color against the adjacent background
   - and, when focus distinction depends on color, against the prior unfocused state

4. **Selected/current pairing**
   - the selected or current color against the adjacent background
   - and, when distinction depends on color, against the prior state

> Color tokens define the semantic contrast contract. Meaning that depends on more than color alone is validated at the pattern, component, and final output layers.
