---
title: Breakpoints
---

# Breakpoints

Breakpoints define the thresholds at which your layout adapts to different screen sizes. They are essential for responsive design. Rather than scattering magic numbers throughout your CSS or JavaScript, define and use breakpoint tokens.

## Core breakpoint tokens

Core breakpoints live under `breakpoints.<size>`. Choose names that reflect the layout rather than specific device types. For example:

| Token             |    Width | Description                |
| ----------------- | -------: | -------------------------- |
| `breakpoints.xs`  |  `320px` | Extra small (small phones) |
| `breakpoints.sm`  |  `480px` | Small phones               |
| `breakpoints.md`  |  `768px` | Tablets / small desktops   |
| `breakpoints.lg`  | `1024px` | Medium desktops            |
| `breakpoints.xl`  | `1280px` | Large desktops             |
| `breakpoints.2xl` | `1536px` | Extra large screens        |

These widths are examples. Choose breakpoints based on your content and design patterns, not on device categories.

## Using breakpoints

Define media queries and responsive values using the breakpoint tokens. For example, with the `sx` prop:

```jsx
<Box
  px={{ base: 'spacing.4', md: 'spacing.6', lg: 'spacing.8' }}
  maxW={['100%', '640px', '720px']}
>
  ...
</Box>
```

Here `base` applies below the `md` breakpoint. At `md` and above, the padding changes to `spacing.6`, and at `lg` it becomes `spacing.8`.

## Guidelines

1. **Use relative units.** Use rem or percentages in combination with breakpoints for flexible layouts.
2. **Design mobile‑first.** Start with the smallest layout and scale up; define overrides at larger breakpoints rather than starting large and scaling down.
3. **Limit the number of breakpoints.** Too many thresholds make maintenance difficult. Most designs work well with 3–5 breakpoints.
4. **Consider content.** Breakpoints should be based on when the content needs more space, not on specific devices.

Breakpoints tokens provide a predictable map for responsive design and allow for easy global adjustments.
