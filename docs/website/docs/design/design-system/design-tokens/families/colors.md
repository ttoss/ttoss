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
| Emphasis | `accent`    |    ✓     |    —    |      ✓       |     ✓      |        ✓        |
| Emphasis | `muted`     |    ✓     |    ✓    |      ✓       |     ✓      |        ✓        |
| Valence  | `positive`  |    —     |    ✓    |      —       |     ✓      |        ✓        |
| Valence  | `caution`   |    —     |    ✓    |      —       |     ✓      |        ✓        |
| Valence  | `negative`  |    ✓     |    ✓    |      —       |     ✓      |        ✓        |

**Why some cells are empty:**

- `action.positive / action.caution` — Outcome and risk live in `feedback.*`; an Action's own colour expresses only `negative` evaluation (FSL §5). Destructive consequence (FSL §6) is a frequent driver of that choice, but the two dimensions are distinct — `negative` may also encode adverse-but-non-destructive intent (cancel paid subscription).
- `navigation.*` valences — Navigation communicates location (`current`, `visited`), not health state.
- `feedback.secondary` — Feedback is direct: `primary`, `muted`, and `accent` cover its emphasis range. `feedback.accent` is the **informative** status ("in progress", "new", "info") — noteworthy but judgement-free, and the canonical fill for activity indicators (ProgressBar, Meter).
- `input.accent` — Inputs use `primary` for the brand-influenced active state; `accent` creates hierarchy ambiguity.

#### The Action emphasis ladder is one mechanism, not three

Within `action`, the three neutral rungs differ by **how much fill they carry**,
never by switching to a different device:

| Rung        | Resting appearance                                                                                |
| :---------- | :------------------------------------------------------------------------------------------------ |
| `primary`   | Solid fill at the ramp's extreme (near-black in light, near-white in dark)                        |
| `secondary` | A light fill — visibly present, clearly below primary                                             |
| `muted`     | The **surface's own colour**, border included: no visible edge at rest, the fill appears on hover |

`muted` is the system's idiom for "no fill", and it is deliberately an opaque
surface-coloured token rather than `transparent`: every semantic background
stays a verifiable value, which is what lets the contrast guarantees
(ADR-015) be computed at all. Giving `muted` a visible border instead made it
read as the _outlined secondary_ of other design systems and inverted the
ladder's perceived order — the mistake the 2026-07-25 review corrected.

A role whose resting `(background, border, text)` triple duplicates another
role in the same context is a defect in any theme, and is enforced as such
(`colors.test.ts` → "roles within a context are distinguishable").

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
> ✅ `informational.negative.text.default` — quiet error (foreground only).
> ✅ `informational.negative.background.default` — loud error (filled surface).

**Where the loudness ladder does and does not exist.** The two rungs above are a
ladder only where the valence's `text` is a standalone ink. In `input` and
`informational` it is, and a part may read it while sitting on any surface — the
validation message is that case. In `action` and `feedback` the valence ships as
a **filled** surface, so `text` is the label _on that fill_ (near-white) and there
is no quiet rung inside those contexts: a destructive button is filled, a status
toast is filled — and it cannot be added by reaching for emphasis, which the ❌
above forbids. The quiet destructive Action is instead expressed by the
[cross-cutting](#cross-cutting-tokens-siblings-of-semanticcolors)
`semantic.consequence.destructive.ink`: a part on the quiet rung paints the
stratum's own colour, so the ink it needs is a system-wide default no `{ux}`
owns — the same shape as the focus ring, and the same §6 mechanism. The
component layer scopes when it applies (`@ttoss/fsl-ui` CONTRACT §3.3).

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
- **Filter chip / removable tag (`TagGroup`)** → `selected` (set membership — the user picked this one of many). Not `pressed`: a tag is not a toggle button. Removal is a separate close affordance (a remove button inside the tag), not a state.
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

| `ux`            | Allowed states (full, no implicit base)                                                                                                     |
| :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `action`        | `default`, `hover`, `active`, `focused`, `disabled`, `droptarget`, `pressed`, `expanded`                                                    |
| `input`         | `default`, `hover`, `active`, `focused`, `disabled`, `droptarget`, `selected`, `checked`, `indeterminate`, `pressed`, `expanded`, `invalid` |
| `navigation`    | `default`, `hover`, `active`, `focused`, `disabled`, `droptarget`, `selected`, `current`, `visited`, `expanded`                             |
| `feedback`      | `default`, `focused`, `disabled` _(communicative, not interactive)_                                                                         |
| `informational` | `default`, `hover`, `active`, `focused`, `disabled`, `droptarget`, `selected`, `visited`, `expanded`                                        |

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

Four tokens carry **system-wide defaults** that no `{ux}` owns. They live as siblings of `semantic.colors.*` per [model.md §6](../model.md#6-no-parallel-vocabulary), not inside it:

- `semantic.focus.ring.color` — system focus indicator color
- `semantic.overlay.scrim` — modal backdrop
- `semantic.overlay.outline` — boundary of a surface that **occludes** content
- `semantic.consequence.destructive.ink` — foreground for a destructive part that paints no surface

They are **not** parallel vocabulary: `{ux}.{role}.border.focused` answers _"what does this `{ux}`'s own edge become while focused?"_; `semantic.focus.ring.color` answers _"what marks focus?"_. Likewise `{ux}.{valence}.text` answers _"what is this `{ux}`'s valence ink on its own surfaces?"_; the consequence ink answers _"what marks a destructive part that paints nothing?"_.

### Focus color — the ring indicates, the border tints

The two are **layers, not alternatives**, and every focusable component uses both.

**`semantic.focus.ring.color` is the indicator, on every entity alike.** It is drawn as an `outline` — never a `border`, which would shift layout — and floated off the control's edge, so the surface it must contrast against is the stratum behind the component rather than the component's own fill. That is what lets one system-wide colour serve everything: a filled `action.primary` pill is near-black in light and near-white in dark, and no single edge colour clears both it and the page, but a ring sitting outside it only ever meets the page.

**`{ux}.{role}.border.focused` re-tints the component's own edge underneath that ring.** It reinforces, and carries no indication duty of its own — which is why a filled surface may leave it below the border floor without the component becoming unfocusable.

One case inverts the emphasis: an `Input` carrying a validation valence keeps that valence in its border while focused (`input.{negative|caution}.border.focused`), because dropping it would make focusing an invalid field look like fixing it. The ring is unchanged — the valence rides the border, not the indicator.

> Contrast duty follows indication. The ring owes [Required pairing #3](#required-pairings) against every stratum it can land on; the tinted border owes the border pairing, and is exempt where it sits on its own role's fill.

### Example

A focusable profile card (no obvious `{ux}`):

- line geometry from `semantic.border.outline.surface` + `semantic.focus.ring.{width,style}` on `:focus-visible`
- ring colour from `semantic.focus.ring.color`; the card has no `{ux}` edge to tint

A text input in error:

- line geometry from `semantic.border.outline.control` + `semantic.focus.ring.{width,style}` on `:focus-visible`
- ring colour from `semantic.focus.ring.color`, as everywhere
- edge colour from `input.negative.border.focused` — the valence survives focus
  A raised card may combine:

- surface color from `informational.primary.background.default`
- outline color from `informational.muted.border.default`
- shadow from `elevation.surface.raised`

### Stacking informational surfaces

Multiple `informational` surfaces commonly overlap in the visual hierarchy — a Dialog (`Overlay`) over a page, a Card (`Structure`) over a panel, a row inside a List (`Collection`). They share the same UX context by design (see [FSL Entity Kind Mapping](#fsl-entity-kind-mapping)) and may resolve to the **same** `informational.*.background` value, especially in dark modes where the available `core.colors.neutral` range is compressed.

Differentiation between stacked `informational` surfaces is paid in this order — **never in colour**:

1. **`elevation`** is the primary separator. `Overlay → elevation.surface.overlay`, `Structure`/`Collection` → `elevation.surface.flat | raised`. Drop shadows are local to each level, so the rule survives arbitrary nesting (Card inside Dialog inside Drawer): each level paints its own shadow over whatever sits beneath it.
2. **`border.outline.surface`** is the secondary separator. A 1px outline at ≥ 3:1 contrast against the adjacent background guarantees a perceptual edge even when shadow is suppressed (high-contrast preferences, print). **Which colour that outline takes depends on whether the surface occludes.** An _embedded_ surface (a card, a panel in the flow) draws `{ux}.{role}.border.default` — a deliberate hairline, listed in the border pairing's soft inventory, because losing its edge loses decoration. A surface that **covers** content draws `semantic.overlay.outline`, the cross-cutting boundary, because losing _its_ edge loses the information about where the covered content resumes. One token cannot be both, and the duty above belongs to the second.
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
- any supported mode fails the same required pairings for the same semantic contract — an alternate mode remaps references by hand, so it is where a role's `background` subtree can move while its `border` subtree stays behind
- an alternate mode declares a semantic path the base does not — a mode remaps references ([model.md § Modes](../model.md#modes)), it never adds a leaf, because component bindings mirror the base shape and an alt-only leaf is unreachable: its value ships and nothing can read it

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
   - **Corresponding is where the part renders, not who owns the token.** A part
     that reads one role's ink and paints no surface of its own — the validation
     message is the declared case — pairs against the surface it lands on. Because
     the page and every contained surface share one background token and differ by
     `elevation.tonal.*` ([Stacking informational surfaces](#stacking-informational-surfaces)),
     "the surface it lands on" is every stratum, not one value.
   - **A `background` state with no ink of its own still renders one.** The
     component contract falls back to `text.default` (the selection mark resolves
     `indeterminate → checked → default`), so validation pairs the **effective**
     ink against every declared background state — never only the same-state
     declarations. A same-state-only check audits a pair nobody renders and skips
     the pair everyone does.

2. **Border / non-text pairing**
   - `*.border.*` against the adjacent background it sits on
   - minimum: `≥ 3:1`
   - `disabled` is exempt (WCAG 2.2 §1.4.3), as it is for the text pairing.
   - A border that resolves to its own background is a role with **no edge by
     construction** — a distinct outcome from a soft edge, and validated as its
     own set, so that a role gaining or losing its edge is a failure in either
     direction.

3. **Focus pairing**
   - the focused color against the adjacent background
   - and, when focus distinction depends on color, against the prior unfocused state
   - The focused colour is `semantic.focus.ring.color` — the indicator, not the tint ([the ring indicates, the border tints](#focus-color--the-ring-indicates-the-border-tints)). Because the ring is floated off the control, the adjacent background is every stratum it can land on, so this is a **cross-role** pairing and belongs with pairing #1's inventory rather than inside a `{ux}.{role}` subtree.

4. **Selected/current pairing**
   - the selected or current color against the adjacent background
   - and, when distinction depends on color, against the prior state

> Color tokens define the semantic contrast contract. Meaning that depends on more than color alone is validated at the pattern, component, and final output layers.
