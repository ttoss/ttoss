---
title: Theme Authoring
description: How to design, review, and author FSL themes with coherent geometry, semantic signals, accessibility, and mode-safe token relationships.
---

This document defines how to create and review themes in the ttoss design system.

It is not an API reference for `@ttoss/fsl-theme`. It is the design contract that should guide any theme before token values are implemented.

Use this document when you need to:

- create a new theme;
- review a built-in theme;
- adapt a brand into the FSL token model;
- decide whether a token value is coherent or not;
- explain why a theme feels dense, calm, technical, expressive, fragile, or robust;
- give an AI agent enough structure to author or review a theme without relying on visual taste alone.

A theme is not a collection of beautiful values.

A theme is the perceptual operating system of the interface: it governs how attention, action, meaning, risk, and time are distributed through token relationships.

---

## Relationship to other Design Token docs

This document sits above the individual token families.

It does not replace:

- **Token Model** — explains the `core` and `semantic` layers.
- **Modes** — explains how semantic references change across light, dark, and alternate modes.
- **Token families** — document the meaning of each token family.
- **Governance** — defines how token changes are proposed and approved.
- **Validation and Build** — defines how token rules are checked and emitted.

This document answers a different question:

> How should a theme be designed before values are chosen?

---

## Core thesis

A good theme is not one where each token looks good in isolation.

A good theme is one where all token families reinforce the same product posture.

Spacing, sizing, typography, radii, color, border, elevation, focus, opacity, overlay, motion, and z-index must work as one language.

Each token decision should answer at least one of these questions:

| Question                                         | Token families involved               |
| ------------------------------------------------ | ------------------------------------- |
| What belongs together?                           | spacing, border, surface, typography  |
| What is separate?                                | spacing, border, elevation, z-index   |
| What can be acted on?                            | sizing, color, focus, motion          |
| What matters most?                               | typography, color, spacing, elevation |
| What is safe, risky, successful, or unavailable? | color, opacity, focus, motion         |
| What layer am I in?                              | surface, elevation, overlay, z-index  |
| How much attention should this require?          | color, motion, typography, spacing    |

The theme is valid when these answers remain stable across components, screen sizes, density profiles, and color modes.

---

## Operating model

A theme should be understood as a layered system.

| Layer               | In theme authoring                                                                  |
| ------------------- | ----------------------------------------------------------------------------------- |
| Low-level values    | Raw values: colors, spacing, radii, durations, shadows.                             |
| Semantic contract   | The stable grammar through which components request meaning.                        |
| Design constitution | The rules that decide what meanings are legal and how conflicts are resolved.       |
| Theme resolution    | How values become mode-safe, state-safe, and component-consumable.                  |
| Validation          | Contrast, state legality, pair compatibility, density safety, and mode correctness. |
| Components          | Applications consuming semantic meaning.                                            |

The design constitution is the kernel of the perceptual operating system.

Without it, a theme can still render. It just cannot govern itself.

---

## Decision hierarchy

When theme decisions conflict, use this order:

```txt
user safety
> accessibility
> semantic clarity
> interaction ergonomics
> information hierarchy
> product posture
> brand expression
> aesthetic novelty
```

A theme may be expressive, distinctive, or brand-heavy only after it remains accessible, legible, ergonomic, and semantically clear.

Brand may bend the surface. It may not break the contract.

---

## Theme brief

Every theme must start with a brief.

Do not start by choosing colors, radii, or spacing values. Start by defining the experience the theme should produce.

```yaml
theme:
  name:
  purpose:
  primaryPosture:
  secondaryPosture:
  densityProfile:
  readingMode:
  pointerProfile:
  interactionRisk:
  surfaceModel:
  brandEnergy:
  accessibilityTarget:
  colorModeStrategy:
  platformBias:
```

### Allowed values

| Field                 | Values                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| `primaryPosture`      | `calm`, `productive`, `technical`, `expressive`, `editorial`, `premium` |
| `secondaryPosture`    | optional; same values as `primaryPosture`                               |
| `densityProfile`      | `compact`, `balanced`, `comfortable`, `spacious`                        |
| `readingMode`         | `reading`, `operating`, `scanning`, `mixed`                             |
| `pointerProfile`      | `fine`, `coarse`, `hybrid`                                              |
| `interactionRisk`     | `low`, `medium`, `high`                                                 |
| `surfaceModel`        | `flat`, `lightly-layered`, `layered`, `immersive`                       |
| `brandEnergy`         | `quiet`, `balanced`, `expressive`                                       |
| `accessibilityTarget` | `AA`, `AA+`, `AAA-like`                                                 |
| `colorModeStrategy`   | `light-only`, `dark-supported`, `dark-first`, `adaptive`                |
| `platformBias`        | `web`, `mobile`, `desktop`, `cross-platform`                            |

### Recommended base theme brief

The default built-in theme should optimize for modern product UI, not for a strong brand statement.

```yaml
theme:
  name: base
  purpose: default built-in foundation for modern product UI
  primaryPosture: productive
  secondaryPosture: calm
  densityProfile: balanced
  readingMode: mixed
  pointerProfile: hybrid
  interactionRisk: medium
  surfaceModel: lightly-layered
  brandEnergy: quiet
  accessibilityTarget: AA+
  colorModeStrategy: dark-supported
  platformBias: web
```

The base theme should feel practical, calm, modern, trustworthy, and easy to extend.

It should not feel flashy, ornamental, cramped, fragile, or overly branded.

---

## Product posture

Product posture is the behavioral personality of the interface.

It is not a moodboard. It is a decision framework.

| Posture      | Interface behavior                                                   | Typical use                                          |
| ------------ | -------------------------------------------------------------------- | ---------------------------------------------------- |
| `calm`       | Reduces noise, protects attention, uses soft hierarchy.              | AI products, healthcare, productivity, focused work. |
| `productive` | Prioritizes speed, scanning, clear actions, and predictable rhythm.  | SaaS, admin, dashboards, internal tools.             |
| `technical`  | Prioritizes precision, structure, compactness, and low ornament.     | Devtools, infra, analytics, enterprise operations.   |
| `expressive` | Uses stronger color, shape, motion, and brand presence.              | Consumer products, marketing flows, onboarding.      |
| `editorial`  | Prioritizes reading rhythm, generous whitespace, and type hierarchy. | Docs, content, reports, knowledge products.          |
| `premium`    | Uses restraint, space, refined contrast, and slower rhythm.          | Executive tools, high-touch brand experiences.       |

A theme may combine two postures, but one must dominate.

Invalid:

```yaml
primaryPosture: modern
```

“Modern” is not operational. It does not tell the designer or implementation agent how to choose spacing, radii, motion, or color.

Valid:

```yaml
primaryPosture: productive
secondaryPosture: calm
```

This means the theme should support efficient work while avoiding unnecessary noise.

---

## Density

Density is the first geometric decision.

Density defines how much information and interaction fit into a given space. It affects visual rhythm, perceived speed, motor safety, and cognitive effort.

A theme must choose one density profile.

| Density       | Meaning                                      | Risk                                      |
| ------------- | -------------------------------------------- | ----------------------------------------- |
| `compact`     | High information density and tight rhythm.   | Can become cramped or error-prone.        |
| `balanced`    | Efficient but comfortable product UI.        | Can become generic without clear posture. |
| `comfortable` | More breathing room and slower rhythm.       | Can feel less efficient for power users.  |
| `spacious`    | Strong focus, low density, large whitespace. | Can waste space in operational products.  |

Density must not be applied as one global multiplier.

A compact theme should not simply shrink everything. A compact theme should reduce non-essential whitespace while preserving reading comfort and hit target safety.

### Density subdimensions

| Subdimension        | Affects                                               | Rule                                                     |
| ------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| Content density     | Tables, lists, cards, stat groups.                    | May compress significantly.                              |
| Interaction density | Buttons, menus, toolbars, controls.                   | May compress visually, but hit targets must remain safe. |
| Reading density     | Body text, descriptions, prose.                       | Should compress cautiously.                              |
| Decision density    | Number and proximity of choices.                      | Must preserve decision clarity.                          |
| Signal density      | Amount of color, iconography, badges, alerts, motion. | Must remain controlled.                                  |

A good B2B product theme is often:

```txt
content dense
+ interaction safe
+ reading comfortable
+ signal restrained
```

---

## Geometry

Geometry is semantic.

Spacing and sizing are not just measurements. They communicate relationship, grouping, rhythm, hierarchy, and affordance.

### Spacing meaning

Spacing answers:

| Question                                     | Meaning                      |
| -------------------------------------------- | ---------------------------- |
| Are these elements part of the same control? | Use the smallest inline gap. |
| Are these elements siblings in a group?      | Use a sibling gap.           |
| Did one group end and another begin?         | Use a group gap.             |
| Is this content inside a surface?            | Use surface inset.           |
| Is this a page boundary?                     | Use page gutter.             |
| Are these independent targets?               | Use interactive separation.  |

The core rule:

```txt
the stronger the semantic relationship,
the smaller the space
```

This follows the Gestalt principle of proximity: elements near each other are perceived as related, while elements farther apart are perceived as separate.

### Spacing order rule

A theme should preserve this order:

```txt
icon-label gap
< inline sibling gap
< control inset
< stack sibling gap
< group gap
< section gap
< page gutter
```

Invalid:

```txt
icon-label gap = 16px
field-to-field gap = 12px
```

This makes an icon feel less related to its label than one field feels to another field.

Valid:

```txt
icon-label gap = 6px
field-to-field gap = 16px
section gap = 32px
```

### Spacing families

| Family                               | Design meaning                                 |
| ------------------------------------ | ---------------------------------------------- |
| `spacing.inset.control`              | Internal comfort of actionable controls.       |
| `spacing.inset.surface`              | Cognitive breathing room inside containers.    |
| `spacing.gap.inline`                 | Horizontal belonging between related elements. |
| `spacing.gap.stack`                  | Vertical rhythm between sequential elements.   |
| `spacing.gutter.page`                | Relationship between viewport and content.     |
| `spacing.gutter.section`             | Relationship between large content regions.    |
| `spacing.separation.interactive.min` | Motor safety between independent targets.      |

### Spatial scale

A theme must define its base spatial unit.

Recommended:

```txt
baseUnit = 4px
```

Allowed for technical or highly dense themes:

```txt
baseUnit = 2px
```

A theme may use a hybrid scale:

```txt
micro: 2px increments
component: 4px increments
layout: 8px increments
```

But the hybrid model must be intentional and documented.

Use small increments for detail-level spacing and larger increments for layout rhythm.

---

## Sizing

Sizing is affordance.

Do not confuse visual size with interaction size.

| Size type    | Meaning                                |
| ------------ | -------------------------------------- |
| Visual size  | What the user sees.                    |
| Hit size     | What the user can successfully target. |
| Content size | What the content requires.             |
| Layout size  | What the composition reserves.         |

A theme must preserve this relationship:

```txt
icon size <= visual control size <= hit target size
```

Example:

```txt
icon = 16px
visual button = 32px
hit target = 40px or 44px
```

The visible object may be compact. The interactive affordance must remain safe.

### Sizing families

| Family                    | Design meaning                                           |
| ------------------------- | -------------------------------------------------------- |
| `sizing.hit`              | Probability of successful interaction.                   |
| `sizing.icon`             | Symbol legibility and visual weight.                     |
| `sizing.identity`         | Recognition of avatar, organization, product, or entity. |
| `sizing.measure.reading`  | Comfortable line length for prose.                       |
| `sizing.surface.maxWidth` | Maximum useful composition width.                        |
| `sizing.viewport`         | Relationship to device and viewport.                     |

### Hit target rule

A compact visual control may still need a larger invisible hit area.

This is especially important for:

- icon buttons;
- dense toolbars;
- table actions;
- mobile and coarse-pointer contexts;
- controls near destructive actions.

A theme fails if it makes small controls easier to see than to use.

---

## Typography

Typography defines voice, hierarchy, and rhythm.

It is not only text rendering.

| Role       | Meaning                                                |
| ---------- | ------------------------------------------------------ |
| `display`  | Rare, high-emphasis narrative text.                    |
| `headline` | Page or section-level orientation.                     |
| `title`    | Surface-level naming: card, dialog, panel, sheet.      |
| `body`     | Reading comfort and content rhythm.                    |
| `label`    | Operational precision: controls, fields, badges, tabs. |
| `code`     | Technical readability and alignment.                   |

The body text style is the center of the system. Spacing and vertical rhythm should be checked against body line-height.

### Typographic rhythm

A theme must define:

```txt
body font size
body line height
label size
title scale
heading scale
reading measure
```

Then spacing must reinforce the vertical rhythm.

Valid:

```txt
body.md line-height = 24px
stack.sm = 8px
stack.md = 16px
section gap = 32px
```

Invalid:

```txt
body.md line-height = 23px
all vertical spacing = unrelated arbitrary values
```

A theme does not need to use a strict baseline grid everywhere, but it must produce predictable rhythm.

### Reading measure

Long prose must have a maximum measure.

Recommended:

```txt
measure.reading = 45ch–75ch
```

Ordinary prose should not stretch across the full viewport.

This protects comprehension, scanning, and reading comfort.

---

## Shape and radii

Radius expresses material, posture, and affordance.

It is not decoration.

| Radius behavior | Meaning                                        |
| --------------- | ---------------------------------------------- |
| Sharp           | Technical, precise, dense, serious.            |
| Mild            | Neutral, productive, professional.             |
| Soft            | Friendly, calm, SaaS-like, assistive.          |
| Round           | Pill, avatar, chip, badge, contained identity. |
| Expressive      | Brand-led, consumer, playful.                  |

A theme must define a shape grammar:

```txt
radii.control
radii.surface
radii.round
```

### Radius relationship rule

Default relationship:

```txt
control radius <= surface radius <= overlay radius
```

Exceptions are allowed only when intentional.

| Exception          | Allowed when                                                                  |
| ------------------ | ----------------------------------------------------------------------------- |
| Pill control       | The component is a chip, tag, capsule, segmented item, or avatar-like object. |
| Sharp surface      | The theme posture is technical or enterprise-strict.                          |
| Expressive overlay | The theme posture is consumer or brand-led.                                   |

Invalid:

```txt
compact data table
+ huge rounded cells
+ tiny spacing
```

This combines a dense operational structure with a playful material signal.

---

## Surface model

Modern interfaces are layered environments.

A theme must define how each layer is represented.

| Layer     | Function                                |
| --------- | --------------------------------------- |
| Page      | Ambient background.                     |
| Surface   | Contained content.                      |
| Raised    | Locally emphasized content.             |
| Overlay   | Temporary floating content.             |
| Blocking  | Modal interruption.                     |
| Transient | Toast, notification, ephemeral message. |

### Layer distinction rule

A layer change should be communicated by at least two compatible signals.

Examples:

| Layer            | Signals                                          |
| ---------------- | ------------------------------------------------ |
| Raised card      | Background shift + border or elevation.          |
| Popover          | Elevation + z-index + surface color.             |
| Dialog           | Scrim + elevation + z-index + focus containment. |
| Selected item    | Background or border + text/icon state.          |
| Disabled element | Semantic disabled color + interaction removal.   |

Invalid:

```txt
only z-index changes,
but the visual layer remains identical
```

Invalid:

```txt
only shadow changes in dark mode,
where shadow is barely visible
```

---

## Dark mode

Dark mode is not inversion.

A dark theme must define a distinct surface model.

| Concern            | Requirement                                               |
| ------------------ | --------------------------------------------------------- |
| Page background    | Deepest stable neutral.                                   |
| Surface background | Slightly lifted neutral.                                  |
| Raised surface     | Tonal or border differentiation.                          |
| Overlay            | Strong separation without excessive glow.                 |
| Text               | Contrast preserved by pair registry.                      |
| Border             | Visible enough to define structure without noise.         |
| Shadow             | May support depth, but must not be the only depth signal. |

A theme fails if dark mode is generated by simply swapping light and dark values.

A mode override must preserve semantic meaning. Only the resolved values should change.

---

## Color and signal

Color is not decoration.

Color communicates:

- UI kind;
- emphasis;
- valence;
- interaction state;
- foreground/background relationship;
- consequence.

FSL color grammar:

```txt
semantic.colors.{ux}.{role}.{dimension}.{state}
```

| Axis        | Meaning                                    |
| ----------- | ------------------------------------------ |
| `ux`        | What kind of UI object this is.            |
| `role`      | What emphasis or valence it carries.       |
| `dimension` | What part is being colored.                |
| `state`     | What interaction or system state it is in. |

### Pair rule

The atomic color unit is not a swatch.

The atomic color unit is a pair:

```txt
background + text
background + border
surface + focus
scrim + blocking surface
```

A theme must validate color as relationships, not isolated values.

Valid:

```txt
action.negative.background.default
+ action.negative.text.default
+ action.negative.border.default
```

Invalid:

```txt
red.500 is accessible
```

A swatch is not accessible by itself. A pair may be accessible or inaccessible.

### Signal exclusivity

One visual signal must not carry conflicting meanings.

Invalid:

| Color use                                      | Conflict                       |
| ---------------------------------------------- | ------------------------------ |
| Red for destructive action and ordinary accent | Consequence vs brand emphasis. |
| Yellow for warning and selected state          | Risk vs navigation state.      |
| Muted gray for disabled and secondary action   | Unavailable vs lower priority. |
| Accent for brand, focus, selected, and success | Brand vs system state.         |

Valid:

| Signal   | Meaning                                        |
| -------- | ---------------------------------------------- |
| Negative | Error, destructive consequence, failure.       |
| Caution  | Risk, warning, needs attention.                |
| Positive | Success, completion, safe state.               |
| Accent   | Brand pop or special emphasis, not validation. |
| Muted    | Lower emphasis, not disabled by itself.        |

---

## Accessibility floor

Accessibility is not a theme variant.

It is a floor.

Every theme must define and preserve:

| Requirement        | Rule                                                               |
| ------------------ | ------------------------------------------------------------------ |
| Text contrast      | Meets the declared contrast target.                                |
| Non-text contrast  | Icons, borders, controls, and focus indicators remain perceivable. |
| Target size        | Meets the declared pointer safety profile.                         |
| Focus visibility   | Always visible and mode-safe.                                      |
| Motion reduction   | Motion can be reduced without losing meaning.                      |
| Text scaling       | Layout tolerates larger text sizes.                                |
| Color independence | Meaning is not conveyed by color alone.                            |

Recommended default:

```txt
accessibilityTarget = AA+
```

`AA+` means the theme meets WCAG AA as a baseline and adds stricter internal expectations for focus visibility, dark mode, target safety, and mode-safe contrast.

Do not claim full WCAG conformance from theme tokens alone. Conformance depends on final implementation, content, and component behavior.

---

## Focus

Focus is navigation, not styling.

A theme must guarantee:

| Rule            | Requirement                                                       |
| --------------- | ----------------------------------------------------------------- |
| Always visible  | Every focusable element has a visible focus state.                |
| Not color-only  | Shape, outline, offset, or thickness must help communicate focus. |
| No layout shift | Focus must not move surrounding content.                          |
| Above hover     | Keyboard focus must remain legible when hover also exists.        |
| Mode-safe       | Focus must work in light, dark, and high-contrast contexts.       |

### State priority

When multiple states coexist, priority is:

```txt
disabled
> focus
> pressed / active
> selected / current
> hover
> default
```

Disabled removes interaction. Focus preserves navigation. Hover must never hide focus.

---

## Motion

Motion must express causality.

It should help users understand what changed, why it changed, and how it relates to their action.

| Motion family             | Design meaning                               |
| ------------------------- | -------------------------------------------- |
| `motion.feedback`         | Immediate response to user input.            |
| `motion.emphasis`         | Draws attention to meaningful change.        |
| `motion.decorative`       | Ambient polish; must be subtle and optional. |
| `motion.transition.enter` | New layer or object appears.                 |
| `motion.transition.exit`  | Object leaves or interaction closes.         |

### Motion restraint

A theme should follow:

```txt
feedback motion < transition motion < emphasis motion
```

In duration, not necessarily visual intensity.

Rules:

| Context           | Motion behavior                                    |
| ----------------- | -------------------------------------------------- |
| Button press      | Fast and local.                                    |
| Menu open         | Fast, spatially grounded.                          |
| Dialog enter      | Slightly slower, clear layer change.               |
| Validation error  | Noticeable but not theatrical.                     |
| Decorative effect | Lowest priority and disabled under reduced motion. |

Invalid:

```txt
decorative animation stronger than user feedback
```

Invalid:

```txt
modal transition so slow it blocks task flow
```

---

## Attention

Attention is a scarce resource.

A theme must define how much attention each signal is allowed to demand.

```txt
ambient < peripheral < explicit < interruptive < blocking
```

Not every state deserves the foreground.

Not every warning deserves a banner.

Not every update deserves motion.

Not every error deserves red.

Not every assistant action deserves a toast.

Use attention level as part of the theme’s signal grammar.

| Attention level | Meaning                                         |
| --------------- | ----------------------------------------------- |
| `ambient`       | Present but not actively calling for attention. |
| `peripheral`    | Noticeable without interrupting the task.       |
| `explicit`      | Clearly visible and task-relevant.              |
| `interruptive`  | Temporarily redirects attention.                |
| `blocking`      | Stops progress until resolved.                  |

---

## Opacity

Opacity is auxiliary.

It must not replace semantic color.

Allowed:

| Token              | Use                                                             |
| ------------------ | --------------------------------------------------------------- |
| `opacity.scrim`    | Background dimming behind blocking surfaces.                    |
| `opacity.loading`  | Temporarily reduced confidence during async work.               |
| `opacity.disabled` | Media or decorative assets when semantic color is insufficient. |

Not allowed:

| Misuse                            | Reason                                             |
| --------------------------------- | -------------------------------------------------- |
| Disabled text via opacity only    | Contrast becomes unpredictable.                    |
| Disabled control via opacity only | State meaning is not explicit.                     |
| Muted hierarchy via opacity       | Reduces legibility instead of expressing priority. |
| Hover via opacity                 | Often weak and inaccessible.                       |

A disabled state should be semantic first, opacity second.

---

## Borders and elevation

Borders define structure.

Elevation defines functional distance.

### Border

| Border type      | Meaning                                    |
| ---------------- | ------------------------------------------ |
| Divider          | Separates content groups.                  |
| Surface outline  | Defines container edge.                    |
| Control outline  | Defines interactive boundary.              |
| Selected outline | Marks persistent selection or currentness. |

Border color must come from semantic color tokens.

Border geometry must not carry semantic meaning alone.

### Elevation

| Elevation | Meaning                               |
| --------- | ------------------------------------- |
| Flat      | Same plane as page or parent surface. |
| Raised    | Locally grouped or emphasized.        |
| Overlay   | Temporarily floats above page flow.   |
| Blocking  | Interrupts and captures interaction.  |

Elevation must align with surface color and z-index.

Invalid:

```txt
high shadow + base z-index
```

Invalid:

```txt
blocking z-index + flat visual treatment
```

---

## Theme derivation sequence

Create themes in this order:

| Order | Step                         | Output                                                 |
| ----: | ---------------------------- | ------------------------------------------------------ |
|     1 | Define posture               | Behavioral personality.                                |
|     2 | Define density               | Operational compactness.                               |
|     3 | Define accessibility target  | Non-negotiable floor.                                  |
|     4 | Define typography center     | Body, label, title, line-height.                       |
|     5 | Define spatial unit          | Micro, component, layout scale.                        |
|     6 | Define hit target model      | Fine/coarse/hybrid interaction safety.                 |
|     7 | Define spacing relationships | Inset, gap, gutter, separation.                        |
|     8 | Define shape grammar         | Control, surface, round.                               |
|     9 | Define surface model         | Page, surface, overlay, blocking.                      |
|    10 | Define color roles and pairs | Text/background/border registry.                       |
|    11 | Define focus system          | Ring, offset, color, priority.                         |
|    12 | Define attention levels      | Ambient, peripheral, explicit, interruptive, blocking. |
|    13 | Define elevation and z-index | Layer distance and interaction capture.                |
|    14 | Define motion                | Feedback, emphasis, transition, decorative.            |
|    15 | Validate invariants          | Contrast, pairs, hierarchy, density, mode safety.      |

Invalid process:

```txt
choose brand colors
then choose radius
then choose spacing values
then patch accessibility
```

Correct process:

```txt
define experience
then define relationships
then define values
then validate invariants
```

---

## Theme scorecard

Each theme should be reviewed across these axes.

Score each axis from `0` to `5`.

| Axis               | 0                                 | 5                                                  |
| ------------------ | --------------------------------- | -------------------------------------------------- |
| Posture clarity    | No declared experience.           | Clear operational posture.                         |
| Density coherence  | Arbitrary compression.            | Density applied by subdimension.                   |
| Spatial harmony    | Values feel unrelated.            | Relationships are predictable.                     |
| Typographic rhythm | Type and spacing conflict.        | Type governs rhythm.                               |
| Ergonomic safety   | Visual and hit size are confused. | Hit model is explicit.                             |
| Shape consistency  | Radius used decoratively.         | Radius expresses material.                         |
| Surface hierarchy  | Layers are ambiguous.             | Layers are visually and functionally clear.        |
| Color semantics    | Palette-led.                      | Pair-led and role-safe.                            |
| Attention control  | Signals compete indiscriminately. | Signal intensity is proportional to task and risk. |
| Mode safety        | Dark mode is inversion.           | Each mode preserves meaning and contrast.          |
| Accessibility      | Patched late.                     | Built into invariants.                             |
| Agent-readiness    | Requires taste judgment.          | Rules are explicit and executable.                 |

A built-in theme should not be accepted unless every axis scores at least `4`.

---

## Validation rules

These rules should eventually be enforced by documentation review, tests, lint rules, or package validation.

| Rule ID             | Rule                                                          |
| ------------------- | ------------------------------------------------------------- |
| `FSL-DESIGN-001`    | Theme declares posture.                                       |
| `FSL-DESIGN-002`    | Theme declares density profile.                               |
| `FSL-DESIGN-003`    | Theme declares accessibility target.                          |
| `FSL-GEO-001`       | Spacing relationship order is preserved.                      |
| `FSL-GEO-002`       | Hit target is not smaller than the declared safety floor.     |
| `FSL-GEO-003`       | Icon size is not treated as hit size.                         |
| `FSL-TYPE-001`      | Type roles are functional, not tied to HTML tags.             |
| `FSL-TYPE-002`      | Reading measure is bounded.                                   |
| `FSL-SHAPE-001`     | Radius matches posture and density.                           |
| `FSL-SURFACE-001`   | Layer change uses at least two compatible signals.            |
| `FSL-SURFACE-002`   | Dark mode is not simple inversion.                            |
| `FSL-COLOR-001`     | Colors are validated as pairs, not swatches.                  |
| `FSL-COLOR-002`     | Signal colors do not carry conflicting meanings.              |
| `FSL-COLOR-003`     | Text/background pairs meet declared contrast targets.         |
| `FSL-FOCUS-001`     | Focus is visible, mode-safe, and not hidden by hover.         |
| `FSL-ATTENTION-001` | Signal intensity is proportional to task importance and risk. |
| `FSL-MOTION-001`    | Motion expresses causality.                                   |
| `FSL-MOTION-002`    | Reduced motion does not remove meaning.                       |
| `FSL-OPACITY-001`   | Opacity is not the primary disabled or text state.            |
| `FSL-LAYER-001`     | Elevation and z-index are semantically consistent.            |

---

## AI authoring rules

When an AI assistant creates or reviews a theme, it must not start by generating token values.

It must follow this sequence:

```txt
1. Declare or infer the theme brief.
2. Define posture and density.
3. Derive typography center.
4. Derive spacing relationships.
5. Derive sizing and hit targets.
6. Derive shape grammar.
7. Derive surface model.
8. Derive color pair registry.
9. Derive attention levels.
10. Derive focus, elevation, opacity, and motion.
11. Validate invariants.
12. Only then emit or modify tokens.
```

If required information is missing, the assistant may proceed only by declaring explicit defaults.

| Missing input        | Default                                              |
| -------------------- | ---------------------------------------------------- |
| Posture              | `productive` + `calm`                                |
| Density              | `balanced`                                           |
| Accessibility target | `AA+`                                                |
| Color mode strategy  | `dark-supported` only if dark pairs can be validated |
| Pointer profile      | `hybrid`                                             |
| Surface model        | `lightly-layered`                                    |
| Brand energy         | `quiet`                                              |

The assistant must not use vague visual goals such as “make it modern”, “make it nicer”, or “make it premium” without translating them into posture, density, geometry, signal, attention, and accessibility decisions.

---

## Anti-patterns

Avoid these patterns when creating or reviewing themes.

| Anti-pattern             | Why it fails                                         |
| ------------------------ | ---------------------------------------------------- |
| Palette-first theme      | Starts with brand expression before UI function.     |
| Density multiplier       | Shrinks everything and breaks ergonomics.            |
| Radius fashion           | Applies trendy softness without posture logic.       |
| Shadow-only hierarchy    | Fails especially in dark mode.                       |
| Color-only state         | Creates accessibility and semantic ambiguity.        |
| Token value worship      | Treats values as correct outside relationships.      |
| Grid absolutism          | Uses grid as substitute for spacing semantics.       |
| Component-name tokens    | Couples theme to implementation instead of meaning.  |
| Inverted dark mode       | Produces broken hierarchy and contrast.              |
| Motion delight           | Animates personality instead of causality.           |
| Disabled opacity         | Reduces contrast without guaranteeing state clarity. |
| Focus as decoration      | Treats keyboard navigation as visual polish.         |
| Attention inflation      | Makes every signal compete for the foreground.       |
| HTML typography coupling | Makes visual hierarchy depend on document tags.      |

---

## Built-in theme acceptance checklist

Before a theme becomes built-in, verify:

- [ ] The theme has a completed theme brief.
- [ ] Posture and density are explicit.
- [ ] Typography defines a clear center of gravity.
- [ ] Spacing preserves relationship order.
- [ ] Hit targets are safe for the declared pointer profile.
- [ ] Radii match posture, density, and surface model.
- [ ] Color is validated through semantic pairs.
- [ ] Signal colors do not carry conflicting meanings.
- [ ] Attention levels are proportional to task importance and risk.
- [ ] Focus is visible in all supported modes.
- [ ] Dark mode has its own surface model.
- [ ] Elevation, surface, overlay, and z-index agree.
- [ ] Motion communicates causality and supports reduced motion.
- [ ] Opacity is not used as the primary semantic state.
- [ ] The theme passes the review scorecard.
- [ ] The theme can be explained without relying on subjective taste.

---

## Final doctrine

The ten laws of FSL theme authoring:

1. Values are not design. Relationships are design.
2. A theme must declare posture before tokens.
3. Density is operational, not aesthetic.
4. Spacing communicates relationship.
5. Sizing communicates affordance.
6. Typography governs rhythm.
7. Radius expresses material.
8. Color communicates meaning only through valid pairs.
9. Attention is scarce; focus, contrast, target size, and reduced motion are constitutional floors.
10. A theme is finished only when its rules are executable by humans, agents, and validators.

A theme is valid when:

```txt
its core values form a coherent perceptual scale;
its semantic tokens express stable design intent;
its families reinforce one another;
its modes preserve meaning and accessibility;
its density matches product posture;
its geometry communicates relationship;
its signals remain exclusive and legible;
its attention levels are proportional to task and risk;
and its rules can be validated without relying on taste.
```

A theme is excellent when it disappears as decoration and remains as orientation.

---

## References

- [FSL Theme Authoring](/docs/design/design-system/02-design-tokens/theme-authoring)
- [The Missing Layer in Design Systems: Semantic Contract](/blog/2026/03/09/the-missing-layer-in-design-systems-semantic-contract)
- [Tazuna UX](/blog/2026/03/09/tazuna-ux)
- [Design Tokens Community Group — Format Module](https://www.designtokens.org/TR/2025.10/format/)
- [Nielsen Norman Group — Proximity Principle in Visual Design](https://www.nngroup.com/articles/gestalt-proximity/)
- [Nielsen Norman Group — 5 Principles of Visual Design in UX](https://www.nngroup.com/articles/principles-visual-design/)
- [Material Design 3 — Spacing](https://m3.material.io/foundations/layout/grids-spacing/spacing)
- [Material Design 3 — Density](https://m3.material.io/foundations/layout/grids-spacing/density)
- [Material Design 3 — Color roles](https://m3.material.io/styles/color/roles)
- [Carbon Design System — Spacing](https://carbondesignsystem.com/elements/spacing/overview/)
- [IBM Design Language — 2x Grid](https://www.ibm.com/design/language/2x-grid/)
- [Fluent 2 — Layout](https://fluent2.microsoft.design/layout)
- [Fluent 2 — Typography](https://fluent2.microsoft.design/typography)
- [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [OpenAI — Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)
- [Anthropic — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
