---
title: Breakpoints
---

# Breakpoints

Breakpoints define **viewport thresholds** for macro layout changes — page structure, grid columns, navigation modes, and major structural reflows. They are **adaptation infrastructure**, not visual design tokens.

Unlike color, typography, or spacing, breakpoints do not express durable UI meaning. They do **not** define a semantic layer in the foundation. Applications may adjust or replace them based on real layout needs, and any local aliases (e.g., `navCollapse`, `shellWide`) stay in the application layer.

> **Key principle:** Breakpoints define *when* layout changes, not *how* components behave.

### Responsive tool selection

| Need | Tool |
| :--- | :--- |
| Whole layout changes at viewport thresholds | **Breakpoints** |
| A single component needs to adapt | **Container queries** |
| A value should scale continuously | **Fluid tokens** |
| Many viewport thresholds for one component | Wrong tool — use container queries |

---

## Foundation Default Set

The foundation exports a default breakpoint baseline in **`rem`** to reduce setup friction and provide a shared starting point. It is a recommended default — easy to use, easy to replace, not semantically locked.

| Token | Value |
| :--- | :--- |
| `sm` | `30rem` |
| `md` | `48rem` |
| `lg` | `64rem` |
| `xl` | `80rem` |
| `2xl` | `96rem` |

Base layout applies below `sm` (mobile-first, no `xs` token needed).

```js
const breakpoints = {
  sm: '30rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
  '2xl': '96rem',
};
```

---

## Usage

### CSS

```css
@media (min-width: 48rem) {
  .layout {
    grid-template-columns: 240px 1fr;
  }
}
```

### UI logic

```js
columns: {
  base: 1,
  md: 2,
  xl: 3,
}
```

---

## Rules

1. **Content-first** — define breakpoints where the layout breaks, not by device categories. Avoid `mobile`, `tablet`, `desktop` naming.
2. **Mobile-first** — base styles apply below `sm`. Scale up using `min-width`.
3. **Viewport-only** — do not use breakpoints for component-level responsiveness.
4. **Keep it small** — most systems need 4–5 breakpoints maximum.
5. **Not themed** — breakpoints are layout infrastructure, not brand expression. Adjust per-product at application or layout-system level.
6. **Local aliases stay local** — application-specific names like `content` or `navCollapse` do not belong in the foundation.

---

## Application-level Adaptation

Breakpoints are one of the few token families where **local optimization is expected**. An application may change threshold values, remove unused breakpoints, add new ones if layout truly requires it, or define local aliases for readability.

Guidelines: choose breakpoints where layout becomes constrained, validate with real content, keep thresholds consistent within the application, and avoid expanding the scale casually.

### Foundation vs Application ownership

| Foundation owns | Application owns |
| :--- | :--- |
| Default baseline and naming (`sm`–`2xl`) | Local threshold tuning |
| `rem` recommendation | Local aliases for layout intent |
| Rules that keep the scale small and content-driven | Product-specific additions and responsive strategy |

---

## Validation

### Errors (must fail)

- Breakpoint order breaks: `sm >= md`, `md >= lg`, `lg >= xl`, or `xl >= 2xl`
- Any foundation breakpoint resolves to `0` or a negative value

### Warnings (should warn)

- Adjacent steps differ by less than `8rem`
- Foundation set contains more than `5` named steps
- Any foundation breakpoint does not resolve to a `rem` value
- Device-category naming detected (`mobile`, `tablet`, `desktop`)
