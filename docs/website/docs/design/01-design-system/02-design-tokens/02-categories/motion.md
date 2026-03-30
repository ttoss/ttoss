---
title: Motion
---

# Motion

Motion tokens define the **transition behavior system** of ttoss: durations, easing curves, and a small set of semantic motion contracts.

Motion exists to:

- provide **feedback**
- clarify **state changes**
- preserve **continuity** between interface states
- add **emphasis** only when it improves understanding

Motion is **optional at the theme level**.

A theme may choose a more expressive motion language or an intentionally static one.
In both cases, the **semantic token names remain the same**.

Motion must be:

- **Purposeful** — never decorative by default
- **Fast** — frequent transitions should feel responsive
- **Predictable** — small, stable token sets are easier to use correctly
- **Accessible** — non-essential motion must respect reduced-motion preferences
- **Themeable** — a theme may reduce motion substantially or disable it by default without changing semantic names

> Key principle: **motion defines behavior semantics, not a guarantee of animation.**

This system is built on **two explicit layers**:

1. **Core Tokens** — intent-free durations and easing curves
2. **Semantic Tokens** — stable motion contracts consumed by UI code

Components must always consume **semantic motion tokens**, never core motion tokens directly.

> **Rule:** Core motion tokens are never referenced in components.

---

## Scope

Motion defines **transition behavior**.

It does **not** define:

- component APIs
- state logic
- rendering technology
- whether a component must animate in every theme
- cinematic choreography or marketing-style animation systems

Use motion tokens to express:

- immediate feedback
- entering and exiting transitions
- intentional emphasis
- optional decorative behavior

If a theme should be static, that is resolved through **theme mappings**, not by removing semantic tokens.

---

## Core Tokens

Core motion tokens define the physical primitives of motion.

### Durations

| Token | Value | Meaning |
| :--- | :--- | :--- |
| `core.motion.duration.none` | `0ms` | no animation |
| `core.motion.duration.xs` | `50ms` | instant feedback |
| `core.motion.duration.sm` | `100ms` | quick micro-interactions |
| `core.motion.duration.md` | `200ms` | default UI transitions |
| `core.motion.duration.lg` | `300ms` | larger surface transitions |
| `core.motion.duration.xl` | `500ms` | rare, high-travel or decorative motion |

> Keep durations short.  
> Most UI motion, when enabled, should stay in the `100–300ms` range.

### Easings

| Token | Value | Use |
| :--- | :--- | :--- |
| `core.motion.easing.standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | default in-place transitions |
| `core.motion.easing.enter` | `cubic-bezier(0, 0, 0.2, 1)` | elements entering into rest |
| `core.motion.easing.exit` | `cubic-bezier(0.4, 0, 1, 1)` | elements leaving away from rest |
| `core.motion.easing.linear` | `linear` | continuous or time-based motion only |

### Example

```js
const coreMotion = {
  motion: {
    duration: {
      none: '0ms',
      xs: '50ms',
      sm: '100ms',
      md: '200ms',
      lg: '300ms',
      xl: '500ms',
    },

    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      enter: 'cubic-bezier(0, 0, 0.2, 1)',
      exit: 'cubic-bezier(0.4, 0, 1, 1)',
      linear: 'linear',
    },
  },
};
```

---

## Semantic Tokens

Semantic motion tokens define the **few recurring motion roles** the system needs.

They are intentionally small and recipe-based.

### Token structure

```text
motion.{role}
motion.transition.{phase}
```

### Canonical semantic set

* `motion.feedback`
* `motion.transition.enter`
* `motion.transition.exit`
* `motion.emphasis`
* `motion.decorative`

### Semantic Tokens Summary Table

| token | use when you are building… | contract (must be true) | default mapping |
| :--- | :--- | :--- | :--- |
| `motion.feedback` | hover, press, toggle, small confirmation | immediate response; may be animated or instantaneous depending on theme | `core.motion.duration.sm` + `core.motion.easing.standard` |
| `motion.transition.enter` | surface entering, content revealing, overlay appearing | entering behavior; may animate or resolve instantly in static themes | `core.motion.duration.md` + `core.motion.easing.enter` |
| `motion.transition.exit` | surface leaving, content dismissing, overlay closing   | exiting behavior; may animate or resolve instantly in static themes | `core.motion.duration.sm` + `core.motion.easing.exit` |
| `motion.emphasis` | drawing attention to a relevant change | stronger than ordinary feedback when motion is enabled; may reduce to minimal or none  | `core.motion.duration.lg` + `core.motion.easing.standard` |
| `motion.decorative` | ambient or non-essential motion | always optional; never required for understanding; should be disabled in static themes | `core.motion.duration.xl` + `core.motion.easing.linear` |

### Example

```js
const semanticMotion = {
  motion: {
    feedback: {
      duration: '{core.motion.duration.sm}',
      easing: '{core.motion.easing.standard}',
    },

    transition: {
      enter: {
        duration: '{core.motion.duration.md}',
        easing: '{core.motion.easing.enter}',
      },

      exit: {
        duration: '{core.motion.duration.sm}',
        easing: '{core.motion.easing.exit}',
      },
    },

    emphasis: {
      duration: '{core.motion.duration.lg}',
      easing: '{core.motion.easing.standard}',
    },

    decorative: {
      duration: '{core.motion.duration.xl}',
      easing: '{core.motion.easing.linear}',
    },
  },
};
```

---

## Static Motion Profile

A theme may intentionally choose a **static motion profile**.

This is valid.

In a static theme:

* semantic motion token names remain unchanged
* semantic tokens still exist and remain the public API
* durations may resolve to `core.motion.duration.none`
* `motion.transition.enter` and `motion.transition.exit` may collapse to the same effective contract
* `motion.emphasis` may collapse to minimal or no motion
* `motion.decorative` should be disabled by default

This allows products to keep a stable semantic contract while adopting a more restrained motion posture.

### Example

```js
const staticMotionTheme = {
  motion: {
    feedback: {
      duration: '{core.motion.duration.none}',
      easing: '{core.motion.easing.standard}',
    },

    transition: {
      enter: {
        duration: '{core.motion.duration.none}',
        easing: '{core.motion.easing.enter}',
      },

      exit: {
        duration: '{core.motion.duration.none}',
        easing: '{core.motion.easing.exit}',
      },
    },

    emphasis: {
      duration: '{core.motion.duration.none}',
      easing: '{core.motion.easing.standard}',
    },

    decorative: {
      duration: '{core.motion.duration.none}',
      easing: '{core.motion.easing.linear}',
    },
  },
};
```

> A static theme disables motion through **mapping**, not by deleting semantic contracts.

---

## Reduced Motion

Reduced motion is part of the motion contract.

When a user requests reduced motion:

* **remove** decorative motion
* **reduce or replace** emphasis motion
* prefer **fade** over scale, pan, bounce, or depth-like movement
* keep essential feedback and transitions only when they remain helpful and minimal

### Practical rule

* `motion.feedback` → may remain, but should stay minimal
* `motion.transition.enter` / `exit` → may remain, but should simplify
* `motion.emphasis` → reduce, replace, or disable
* `motion.decorative` → disable by default

### Output Guidance (Web)

The following CSS example is specific to web output:

```css
@media (prefers-reduced-motion: reduce) {
  .decorativeMotion {
    animation: none;
  }

  .enterTransition,
  .exitTransition,
  .emphasisMotion {
    transition-duration: 0ms;
  }
}
```

> Reduced motion is not only “shorter animation”.
> It may require using a different kind of transition or no transition at all.

---

## Rules of Engagement (non-negotiable)

1. **Semantic-only consumption**
   Components use semantic motion tokens only.

2. **Motion is optional at the theme level**
   A theme may be expressive or static. Both are valid if semantic names remain stable.

3. **Keep motion short when motion is enabled**
   Frequent UI motion should feel immediate, not cinematic.

4. **Enter and exit are semantic phases**
   They describe behavior roles, not a guarantee that a theme must animate them differently.

5. **Decorative motion is always optional**
   It must never be required for understanding or task completion.

6. **Respect reduced motion**
   Remove, reduce, or replace non-essential motion when requested.

7. **Do not create component-specific motion tokens by default**
   Avoid `motion.modal`, `motion.drawer`, `motion.tooltip`, etc.

---

## Decision Matrix

1. **Is this a small immediate reaction to user input?**
   → `motion.feedback`

2. **Is something entering the interface?**
   → `motion.transition.enter`

3. **Is something leaving the interface?**
   → `motion.transition.exit`

4. **Are you intentionally drawing attention to a relevant change?**
   → `motion.emphasis`

5. **Is this ambient or non-essential motion?**
   → `motion.decorative`

6. **Should this theme be intentionally static?**
   → keep the same semantic tokens and remap them to `core.motion.duration.none`

---

## Usage Examples

| Usage                               | Token                     |
| :---------------------------------- | :------------------------ |
| Button hover / press                | `motion.feedback`         |
| Dialog or popover opening           | `motion.transition.enter` |
| Dialog or popover closing           | `motion.transition.exit`  |
| Brief highlight to direct attention | `motion.emphasis`         |
| Background shimmer / ambient loop   | `motion.decorative`       |

> Build output may expose semantic motion tokens as CSS variables or framework-specific bindings. The semantic names remain the API.

---

## Theming

Themes may tune:

* core durations
* core easing curves
* semantic mappings
* overall motion posture, including an intentionally static profile

Semantic token names **never change across themes**.

A theme may become more expressive, more restrained, or effectively static by changing core values and semantic mappings — not by inventing a parallel semantic vocabulary.

---

## Validation

### Errors (validation must fail when)

* core duration order breaks:

  * `none > xs`
  * `xs > sm`
  * `sm > md`
  * `md > lg`
  * `lg > xl`

* generated output changes semantic token names or invents new motion semantics

* generated output does not emit reduced-motion overrides for motion tokens when the theme contains non-zero motion contracts

* generated output leaves `motion.decorative` enabled under reduced motion when the theme contains non-zero motion contracts

### Warning (validation should warn when)

* adjacent core duration steps resolve to the same effective value

* `motion.transition.enter` and `motion.transition.exit` resolve to the same effective easing contract in a non-static theme

* `motion.feedback` and `motion.transition.enter` resolve to the same effective motion contract in a non-static theme

* `motion.emphasis` resolves to the same effective motion contract as `motion.transition.enter` in a non-static theme

* reduced-motion output leaves `motion.transition.enter` and `motion.transition.exit` unchanged in a non-static theme

### Note

A theme with effectively no motion is valid.

Validation must not treat zero-motion semantic mappings as an error by themselves.
What matters is that:

* semantic token names remain stable
* the mappings are intentional
* reduced-motion output does not reintroduce non-essential motion
* the build preserves the contract

---

## Summary

* Core motion tokens define durations and easing curves
* Semantic motion tokens define a small set of reusable behavior contracts
* Motion is optional at the theme level
* Static themes remain valid when semantic names stay stable
* Reduced motion is part of the contract, not an afterthought
* Decorative motion is always optional
* The system stays small, predictable, and safe to evolve
