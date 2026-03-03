---
title: Typography
---

# Typography

Typography tokens ensure that text appears consistent across your product. They define font families, sizes, weights, line heights, letter spacing and semantic text styles. The system distinguishes between raw typographic values (core tokens) and named text styles (semantic tokens).

## Core typography tokens

Core typography tokens live under `font.*` and `typography.*` namespaces:

- **Font families:** `font.family.sans`, `font.family.serif`, `font.family.mono`. Each maps to a comma‑separated font stack.
- **Font weights:** `font.weight.light`, `font.weight.regular`, `font.weight.medium`, `font.weight.bold`, etc. Use numeric values (e.g. 300, 400, 500, 700) behind the scenes.
- **Font sizes:** `font.size.xs`, `font.size.sm`, `font.size.md`, `font.size.lg`, `font.size.xl`, `font.size.2xl`, etc. Map to rem or px values (e.g. `0.75rem`, `0.875rem`, `1rem`, `1.125rem`, `1.25rem`, `1.5rem`).
- **Line heights:** `font.lineHeight.xs`, `font.lineHeight.sm`, `font.lineHeight.md`, etc. Use unitless multipliers (e.g. `1`, `1.25`, `1.5`) for scalability.
- **Letter spacing:** `font.letterSpacing.tight`, `font.letterSpacing.normal`, `font.letterSpacing.wide`. Use em values (e.g. `-0.02em`, `0em`, `0.05em`).

Core typography values are defined per theme but do not convey usage.

## Semantic text styles

Semantic typography tokens package multiple core values into named styles. They follow this grammar:

```
text.<style>
```

For example:

- `text.display` – Large headings. Could map to `font.family.sans`, `font.size.3xl`, `font.weight.bold`, `font.lineHeight.tight`.
- `text.heading` – Section headings. Could map to `font.size.xl` or `2xl`, `font.weight.semibold`, `font.lineHeight.tight`.
- `text.title` – Card or modal titles.
- `text.body` – Paragraph text. Maps to `font.size.md`, `font.weight.regular`, `font.lineHeight.normal`.
- `text.caption` – Small annotations. Maps to `font.size.sm`, `font.weight.regular`, `font.lineHeight.normal`.
- `text.button` – Button labels. Maps to `font.size.sm`, `font.weight.medium`, `font.letterSpacing.wide`.

Creating a new text style requires mapping to core tokens. Use semantic text styles consistently instead of specifying individual font properties in component code. This ensures that typography remains cohesive and responds correctly to theme changes (e.g. larger fonts for accessibility modes).

## Usage guidelines

1. **Use semantic styles for application text.** Do not set `font-size` or `font-weight` directly; instead choose `text.body`, `text.heading`, etc.
2. **Limit the number of styles.** Too many variants reduce hierarchy. Typically, a product needs no more than six core styles.
3. **Adjust line height per language.** East Asian scripts may require different line heights; define locale-specific overrides at the theme level if necessary.
4. **Consider accessibility.** Provide adequate size and contrast. Use relative units (rem) rather than fixed px values to allow scaling.

Typography tokens are foundational for readability. They complement colour tokens to create clear hierarchies and accessible interfaces.
