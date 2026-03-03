---
title: Data Visualization Colours
---

# Data Visualization Colours

Data visualizations have unique colour requirements. Charts, graphs and infographics rely on colour to encode data categories, quantities and patterns. To avoid confusion with the rest of the UI, **data visualization colours live in their own namespace** under the `dataviz` context. These tokens are never used for navigation, inputs or actions.

## Palettes

We define three types of palettes for data viz:

### Categorical

For bar charts, pie charts, and any visualization where discrete categories need distinct colours. Our categorical palette contains a set of colours with equal emphasis. Each colour should be easily distinguishable from the others and accessible to colour‑blind users.

Example tokens:

- `dataviz.categorical.1`
- `dataviz.categorical.2`
- …
- `dataviz.categorical.8`

### Sequential

For heat maps, choropleth maps or any visualization showing a continuous range of values. The sequential palette varies from light to dark to represent low to high values. Use a single hue varying in lightness and saturation.

Example tokens:

- `dataviz.sequential.1` (lightest)
- `dataviz.sequential.5` (midpoint)
- `dataviz.sequential.9` (darkest)

### Diverging

For visualizing deviation from a midpoint (e.g. positive vs negative changes). A diverging palette combines two sequential palettes with a neutral midpoint. Diverging colours should balance saturation on both sides.

Example tokens:

- `dataviz.diverging.negative.3`
- `dataviz.diverging.mid`
- `dataviz.diverging.positive.3`

## Guidelines

- **Do not mix UI and data colours.** Semantic colour roles (primary, success, error) are not appropriate for data encoding. Reserve `dataviz.*` tokens for charts.
- **Limit palette size.** Too many categories become hard to distinguish. For categorical palettes, aim for 8 colours maximum; for sequential palettes, use steps meaningful to the data.
- **Ensure accessibility.** Check colour palettes with tools like [ColorBrewer](https://colorbrewer2.org/) to ensure differentiable hues for colour‑blind users and adequate contrast against backgrounds.
- **Use hierarchy thoughtfully.** Emphasize important data points with neutral backgrounds and reduce visual noise.

## Example usage

```tsx
import { getToken } from '@your-design-system/react';

const palette = Array.from({ length: 6 }, (_, i) =>
  getToken(`dataviz.categorical.${i + 1}`)
);

const data = [4, 7, 2, 9, 5, 3];

// Pass palette to a chart library...
```

Keep data visualization tokens isolated so that updates to UI colours do not affect analytics and vice versa.
