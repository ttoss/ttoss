---
id: layoutSemanticTokens
title: Semantic Layout
slug: /design/semantic-tokens/layout
---

Semantic layout tokens reuse the well known naming from **Tailwind CSS** so developers can work with a familiar scale. Each token points to a value generated from the [core layout tokens](../core-tokens/core-layout.md) based on the golden ratio.

## Spacing roles

Name Pattern: `layout.spacing.{role}.{size}`

The `{size}` values (`0`, `px`, `1`, `1.5`, `2`, etc.) mirror Tailwind's spacing scale. Each one references a step of the core spacing tokens.

Examples of roles:

| Role          | Usage example                                |
| :------------ | :------------------------------------------- |
| `inline`      | Horizontal separation between siblings       |
| `stack`       | Vertical spacing between items               |
| `inset`       | Padding inside a container                   |
| `content`     | Maximum width of readable text blocks        |

A token like `layout.spacing.stack.md` might map to `core.spacing.4`.

## Radii roles

Name Pattern: `layout.radius.{purpose}`

Radius purposes (for example `rounded`, `pill`, `circle`) refer to the Tailwind radius names and resolve to the matching core radius step.

## Z-Index roles

Name Pattern: `layout.zIndex.{layer}`

Layers such as `modal`, `overlay` or `dropdown` reflect the Tailwind `zIndex` keywords and resolve to the numeric values from the core scale.
