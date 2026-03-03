---
title: Motion
---

# Motion

Motion tokens define the durations and easing functions for transitions and animations. Thoughtful motion conveys hierarchy, provides feedback and delights users without overwhelming them. Standardizing motion ensures a cohesive experience.

## Core motion tokens

Define core motion tokens under `motion.duration.<size>` and `motion.easing.<type>`.

### Durations

| Token                |   Value | Use case                                                 |
| -------------------- | ------: | -------------------------------------------------------- |
| `motion.duration.xs` |  `50ms` | Instant feedback (e.g. ripple, fade in tooltips)         |
| `motion.duration.sm` | `100ms` | Small state changes (e.g. button hover, checkbox toggle) |
| `motion.duration.md` | `200ms` | Standard transitions (e.g. modals, dropdowns)            |
| `motion.duration.lg` | `300ms` | Larger movements (e.g. side panels, carousels)           |
| `motion.duration.xl` | `500ms` | Emphatic animations (e.g. page transitions)              |

### Easings

| Token                      | Function                           | Description                          |
| -------------------------- | ---------------------------------- | ------------------------------------ |
| `motion.easing.standard`   | `cubic-bezier(0.4, 0.0, 0.2, 1)`   | Default easing for most interactions |
| `motion.easing.decelerate` | `cubic-bezier(0.0, 0.0, 0.2, 1)`   | Slows down towards the end           |
| `motion.easing.accelerate` | `cubic-bezier(0.4, 0.0, 1, 1)`     | Speeds up at the start               |
| `motion.easing.linear`     | `cubic-bezier(0.0, 0.0, 1.0, 1.0)` | Constant speed; use sparingly        |

These values are examples. Choose durations and curves that align with your brand’s personality.

## Semantic motion tokens

Semantic motion tokens map context and purpose to core durations and easings. For example:

- `motion.feedback.fast` → `duration.xs` + `easing.standard`  
  For quick micro‑interactions like button feedback.
- `motion.navigation.standard` → `duration.md` + `easing.standard`  
  For navigation transitions such as opening a drawer.
- `motion.decorative.slow` → `duration.lg` + `easing.decelerate`  
  For decorative or background animations that draw attention gently.

Instead of specifying durations inline, define semantic tokens for each category of motion in your product. This simplifies adjustments—if you need all navigation transitions to be faster, change the mapping in one place.

## Guidelines

1. **Keep motion purposeful.** Use motion to reinforce user intent, not as decoration. Too much motion can distract.
2. **Use shorter durations for feedback.** Hover and click interactions should feel instantaneous (≤150ms).
3. **Apply easing consistently.** Default to `standard` easing; use `decelerate` for entering elements, `accelerate` for exiting.
4. **Respect user preferences.** Honour `prefers-reduced-motion` by disabling or reducing animations for users who request it.

Motion tokens help you choreograph interactions that feel polished and accessible.
