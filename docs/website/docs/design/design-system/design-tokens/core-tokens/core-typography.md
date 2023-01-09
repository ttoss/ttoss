---
id: typographyCoreTokens
title: Core Typography
slug: /design/core-tokens/typography
---

## Font Type

Name Pattern: `core.fonts.brand.{type}`

| Type           | Description                                                                                                                                                                        | Name Pattern                    |
| :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------ |
| `main`         | Main texts font with accessibility for extensive readings.                                                                                                                         | `core.fonts.brand.main`         |
| `contrast`     | Font that contrast the `main`, have a visual differentiation when used together. They are used in combination to create a cohesive or visual hierarchy, yet dynamic look and feel. | `core.fonts.brand.contrast`     |
| `monospace`    | Monospaced font to be used when needed.                                                                                                                                            | `core.fonts.brand.monospace`    |
| `webSafe`      | Pre-installed on most operating systems, it replaces other fonts if they are not available.                                                                                        | `core.fonts.brand.webSafe`      |
| `decorative`   | Font for visual decoration to add visual interest and personality. It is not suitable for elements that require a lot of reading.                                                  | `core.fonts.brand.decorative`   |
| `logo`         | Font used in the brand logo, if any.                                                                                                                                               | `core.fonts.brand.logo`         |
| `{customType}` | You could create new types as needed, the requirement is to keep it at a low abstraction level.                                                                                    | `core.fonts.brand.{customType}` |

## Font Style

Name Pattern: `core.fonts.{fontStyle}.{variation}`

| Font Style         | Variations                                                                                   | Name Pattern Examples                                                                                    |
| :----------------- | :------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| `fontWeight`       | `thin`, `extraLight`, `light`, `regular`, `medium`, `semiBold`, `bold`, `extraBold`, `black` | `core.fonts.fontWeight.regular: 400`<br />`core.fonts.fontWeight.black: 900`                             |
| `fontSize`         | `{n}xs`, `2xs`, `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `{n}xl`                               | `core.fonts.fontSize.base: 16px`<br />`core.fonts.fontSize.lg: 21px`<br />`core.fonts.fontSize.xl: 28px` |
| `letterSpacing`    | `tighter`, `tight`, `regular`, `wide`, `wider`, `widest`                                     | `core.fonts.letterSpacing.regular: 0em`<br />`core.fonts.letterSpacing.wide: 0.05em`                     |
| `lineHeight`       | `{n}xs`, `2xs`, `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `{n}xl`                               | `core.fonts.lineHeight.base: 1.5em`<br />`core.fonts.lineHeight.xl: 2em`                                 |
| `paragraphSpacing` | `{n}xs`, `2xs`, `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `{n}xl`                               | `core.fonts.paragraphSpacing.base: 16px`<br />`core.fonts.paragraphSpacing.lg: 2em`                      |
| `wordSpacing`      | `{n}xs`, `2xs`, `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `{n}xl`                               | `core.fonts.wordSpacing.base: 0em`<br / >`core.fonts.wordSpacing.lg: 1.25em`                             |
| `textDecoration`   | `overline`, `lineThrough`, `underline`, `overlineUnderline`                                  | `core.fonts.textDecoration.underline: underline`                                                         |
