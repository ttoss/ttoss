# @ttoss/geovis-workspace

A React component that composes a sidebar-driven workspace around a GeoVis map.
The sidebars are configured through a `config` object and the map is rendered
from a GeoVis `visualizationSpec`; each sidebar only renders when defined.

## Installation

```bash
pnpm add @ttoss/geovis-workspace
```

`@ttoss/geovis`, `@ttoss/ui`, `@ttoss/react-i18n` and `react` are peer
dependencies.

## Storybook

Interactive examples are available on [Storybook](https://storybook.ttoss.dev/).

## Usage

The parent owns the selection state and derives the next `visualizationSpec`
from it, so picking a menu item recolors the map. Seed the initial selection
with `getInitialSelection` (reads each menu's `defaultValue`).

```tsx
import { type VisualizationSpec } from '@ttoss/geovis';
import {
  type GeovisWorkspaceConfig,
  GeovisWorkspace,
  getInitialSelection,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

const config: GeovisWorkspaceConfig = {
  leftSidebar: {
    menus: [
      {
        id: 'variable',
        title: 'Variável',
        defaultValue: 'rate',
        items: [
          { value: 'rate', label: 'Taxa cumulativa' },
          { value: 'range', label: 'Faixa (% da pop 65+)' },
        ],
      },
    ],
  },
  rightSidebar: { title: 'Details' },
};

// Maps the current selection to a GeoVis spec — your domain logic.
const buildSpec = (
  selection: Record<string, string | undefined>
): VisualizationSpec => {
  // ...
};

export const Example = () => {
  const [selection, setSelection] = React.useState(() => {
    return getInitialSelection({ config });
  });

  const visualizationSpec = React.useMemo(() => {
    return buildSpec(selection);
  }, [selection]);

  return (
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpec}
      variables={selection}
      onVariableChange={setSelection}
    />
  );
};
```

`variables` and `onVariableChange` are optional: omit both to let the workspace
manage the selection internally (seeded from `defaultValue`). Provide them to
control it from the parent — required when the selection must drive the
`visualizationSpec`. Selection is per menu group: choosing an item only affects
its own group. Read the current selection anywhere inside the workspace with
`useGeovisWorkspace()`.

## API

### `GeovisWorkspace` props

| Prop                | Type                                  | Description                                                 |
| ------------------- | ------------------------------------- | ----------------------------------------------------------- |
| `config`            | `GeovisWorkspaceConfig`               | Describes the sidebars. Required.                           |
| `visualizationSpec` | `VisualizationSpec`                   | GeoVis spec rendered in the main map area. Required.        |
| `variables`         | `Record<string, string \| undefined>` | Controlled selection per menu group. Omit for uncontrolled. |
| `onVariableChange`  | `(variables) => void`                 | Called with the full next selection when an item is picked. |

### `GeovisWorkspaceConfig`

| Property       | Type                          | Description                            |
| -------------- | ----------------------------- | -------------------------------------- |
| `leftSidebar`  | `GeovisWorkspaceLeftSidebar`  | Left sidebar config. Omit to hide it.  |
| `rightSidebar` | `GeovisWorkspaceRightSidebar` | Right sidebar config. Omit to hide it. |

### `GeovisWorkspaceLeftSidebar`

| Property       | Type                    | Description                                              |
| -------------- | ----------------------- | -------------------------------------------------------- |
| `menus`        | `GeovisWorkspaceMenu[]` | Menu groups rendered in the sidebar.                     |
| `initialState` | `'open' \| 'closed'`    | Whether the sidebar starts open. Defaults to `'closed'`. |

### `GeovisWorkspaceMenu`

| Property       | Type                                 | Description                            |
| -------------- | ------------------------------------ | -------------------------------------- |
| `id`           | `string`                             | Unique group identifier.               |
| `title`        | `string`                             | Title shown above the group.           |
| `items`        | `{ value: string; label: string }[]` | Selectable items.                      |
| `defaultValue` | `string`                             | Item selected by default in the group. |

### `GeovisWorkspaceRightSidebar`

| Property          | Type                                    | Description                                              |
| ----------------- | --------------------------------------- | -------------------------------------------------------- |
| `title`           | `string`                                | Title shown at the top of the sidebar.                   |
| `legendWithColor` | `GeovisWorkspaceLegendWithColor`        | Color-legend panel. Omit to hide it.                     |
| `initialState`    | `'open' \| 'closed'`                    | Whether the sidebar starts open. Defaults to `'closed'`. |
| `onFeatureSelect` | `(info) => Promise<unknown> \| unknown` | Fetch details for a clicked map feature. See below.      |
| `renderDetails`   | `(state) => React.ReactNode`            | Render the fetched details inside the sidebar.           |

### Feature details on click

Set `rightSidebar.onFeatureSelect` to load details when the user clicks a
feature on the map. The workspace opens the right sidebar automatically, calls
`onFeatureSelect` with the clicked feature (`info` carries `featureId`,
`lngLat`, `value`, `layerId`), and tracks the loading/error/data state — exposed
to `renderDetails` as `{ feature, data, loading, error }`. Rapid clicks are
guarded: only the latest response is rendered. Clicking outside (or pressing
Escape) clears the details without closing the sidebar.

The clicked layer must be **click-trackable** — it declares `activeLegendId` or
`click` in the `visualizationSpec`.

```tsx
const config: GeovisWorkspaceConfig = {
  rightSidebar: {
    title: 'Region details',
    onFeatureSelect: (info) =>
      fetch(`/api/regions/${info.featureId}`).then((res) => res.json()),
    renderDetails: ({ data, loading, error }) => {
      if (loading) return <Text>Loading…</Text>;
      if (error) return <Text>Could not load details.</Text>;
      if (!data) return null;
      return <RegionDetails {...(data as RegionData)} />;
    },
  },
};
```

### `GeovisWorkspaceLegendWithColor`

A declarative color-legend panel: a description and a list of (optionally
linked) data sources, plus the class swatches the map's own
`visualizationSpec.legends` already resolves — there is no hand-authored
swatch list to keep in sync with the map. Each block renders only when present.

| Property      | Type                                            | Description                       |
| ------------- | ----------------------------------------------- | --------------------------------- |
| `description` | `string`                                        | Paragraph under the title.        |
| `sources`     | `{ title?: string; items: { label; href? }[] }` | Data sources; `href` adds a link. |

```tsx
const config: GeovisWorkspaceConfig = {
  rightSidebar: {
    title: 'POPULAÇÃO 65+ COMO % DA POPULAÇÃO TOTAL',
    legendWithColor: {
      description: 'Proporção da população total com 65 anos ou mais.',
      sources: {
        title: 'Fonte dos dados:',
        items: [
          { label: 'SEADE (2025)', href: 'https://repositorio.seade.gov.br' },
          { label: 'Geometria: Distritos Municipais de São Paulo.' },
        ],
      },
    },
  },
};
```
