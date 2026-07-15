# @ttoss/geovis-workspace

A React component that composes a slot-based workspace around a GeoVis map.
Six named slots (`map`, `legend`, `warnings`, `inspector`, `metadata`,
`controls`) each render a runtime-bound default panel, are configurable
through a `config` object, and can be hidden or replaced with a custom
component per slot; the map is rendered from a GeoVis `visualizationSpec`.

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
  controls: {
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

## Slots

The workspace is built from six named slots. `map` fills the main area;
`controls` renders in the left sidebar; `legend`, `warnings`, `inspector`, and
`metadata` stack in that order in the right sidebar. Placement is fixed —
only a slot's _content_ is configurable:

| Slot        | Region        | Default panel                                                                       |
| ----------- | ------------- | ----------------------------------------------------------------------------------- |
| `map`       | Main area     | The GeoVis canvas.                                                                  |
| `controls`  | Left sidebar  | Menu groups from `config.controls`.                                                 |
| `legend`    | Right sidebar | Description/sources from `config.legend` plus the spec's legends.                   |
| `warnings`  | Right sidebar | Issues from `useGeoVis().result` — see [Warnings and repair](#warnings-and-repair). |
| `inspector` | Right sidebar | The clicked feature from `useGeoVisClick()`, with a dismiss button.                 |
| `metadata`  | Right sidebar | None yet (PRD-003 Phase 5).                                                         |

A sidebar renders only when at least one of its slots has content — an
override component, or (for `controls`/`legend`) non-empty config or a
spec-resolved legend. Use `config.slots` to hide a slot or replace its default
panel with a custom component, which gets the same runtime access
(`useGeoVis()`, `useGeoVisClick()`, `useGeoVisHover()`) as the default it
replaces:

```tsx
const config: GeovisWorkspaceConfig = {
  slots: {
    legend: { hidden: true },
    controls: { component: MyCustomControls },
  },
};
```

## Warnings and repair

The `warnings` slot's default panel renders every issue on the current
`useGeoVis().result`: `resolved` results show their (non-blocking) `warnings`;
any other status shows its (blocking) `issues`. Each issue renders a
translated message keyed by its code (falling back to the raw message for a
code with no catalog entry yet), a monospace `subject` reference, and a
button per `repair` candidate. Pass `onRepair` to `GeovisWorkspace` to apply
one — omit it and repair buttons still render, disabled rather than hidden:

```tsx
<GeovisWorkspace
  config={config}
  visualizationSpec={visualizationSpec}
  onRepair={(repair) => {
    // repair is always a `set-value` — for an `allowed-values` issue with
    // several buttons, each one applies as a `set-value` for that one value.
    setVisualizationSpec((spec) => applyRepair(spec, repair));
  }}
/>
```

A failure with no prior successful resolve (cold start) renders a
repair-affordance empty state in the `map` slot instead of an uninitialized
canvas — the `warnings` panel stays empty in that case, since the empty state
already shows the same issues. Once any resolve succeeds, later failures keep
the last good map visible while the `warnings` panel lists the new issue, the
same "nothing renders on failure" contract `GeoVisProvider` already has.

## Inspector

The `inspector` slot's default panel shows the last clicked feature from
`useGeoVisClick()` — its `layerId`, `value`, and `featureId` — with a dismiss
button. That button (and pressing Escape, or clicking empty space on the map)
all clear the same selection via `useDismissGeoVisClick()`, so the panel and
the map's selection highlight always stay in sync. The panel renders nothing
when no feature is selected.

## API

### `GeovisWorkspace` props

| Prop                | Type                                  | Description                                                                                            |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `config`            | `GeovisWorkspaceConfig`               | Describes the slots. Required.                                                                         |
| `visualizationSpec` | `VisualizationSpec`                   | GeoVis spec rendered in the main map area. Required.                                                   |
| `variables`         | `Record<string, string \| undefined>` | Controlled selection per menu group. Omit for uncontrolled.                                            |
| `onVariableChange`  | `(variables) => void`                 | Called with the full next selection when an item is picked.                                            |
| `onRepair`          | `(repair: RepairOption) => void`      | Called with the chosen repair when a repair button is pressed. Omit to render repair buttons disabled. |

### `GeovisWorkspaceConfig`

| Property       | Type                                                                  | Description                                            |
| -------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| `slots`        | `Partial<Record<GeovisWorkspaceSlotName, GeovisWorkspaceSlotConfig>>` | Per-slot override/hide. Omit an entry for the default. |
| `controls`     | `GeovisWorkspaceControls`                                             | Content for the `controls` slot's default panel.       |
| `legend`       | `GeovisWorkspaceLegendConfig`                                         | Content for the `legend` slot's default panel.         |
| `leftSidebar`  | `GeovisWorkspaceSidebarState`                                         | Left sidebar open/closed state.                        |
| `rightSidebar` | `GeovisWorkspaceRightSidebarState`                                    | Right sidebar title and open/closed state.             |

### `GeovisWorkspaceSlotName`

`'map' | 'legend' | 'warnings' | 'inspector' | 'metadata' | 'controls'` — the
closed, versioned slot vocabulary. Adding a name is additive; renaming one is
breaking.

### `GeovisWorkspaceSlotConfig`

| Property    | Type                  | Description                                                        |
| ----------- | --------------------- | ------------------------------------------------------------------ |
| `component` | `React.ComponentType` | Replaces the slot's default panel. Gets the same runtime access.   |
| `hidden`    | `boolean`             | Hides the slot's region entirely instead of rendering its default. |

### `GeovisWorkspaceControls`

| Property | Type                    | Description                                |
| -------- | ----------------------- | ------------------------------------------ |
| `menus`  | `GeovisWorkspaceMenu[]` | Menu groups rendered by the default panel. |

### `GeovisWorkspaceMenu`

| Property       | Type                                 | Description                            |
| -------------- | ------------------------------------ | -------------------------------------- |
| `id`           | `string`                             | Unique group identifier.               |
| `title`        | `string`                             | Title shown above the group's items.   |
| `items`        | `{ value: string; label: string }[]` | Selectable items.                      |
| `defaultValue` | `string`                             | Item selected by default in the group. |

### `GeovisWorkspaceSidebarState` / `GeovisWorkspaceRightSidebarState`

| Property       | Type                 | Description                                              |
| -------------- | -------------------- | -------------------------------------------------------- |
| `initialState` | `'open' \| 'closed'` | Whether the sidebar starts open. Defaults to `'closed'`. |
| `title`        | `string`             | Right sidebar only: title shown at the top.              |

### `GeovisWorkspaceLegendConfig`

A declarative description and a list of (optionally linked) data sources for
the `legend` slot's default panel, plus the class swatches the map's own
`visualizationSpec.legends` already resolves — there is no hand-authored
swatch list to keep in sync with the map. Each block renders only when present.

| Property      | Type                                            | Description                          |
| ------------- | ----------------------------------------------- | ------------------------------------ |
| `description` | `string`                                        | Paragraph above the legend swatches. |
| `sources`     | `{ title?: string; items: { label; href? }[] }` | Data sources; `href` adds a link.    |

```tsx
const config: GeovisWorkspaceConfig = {
  rightSidebar: { title: 'POPULAÇÃO 65+ COMO % DA POPULAÇÃO TOTAL' },
  legend: {
    description: 'Proporção da população total com 65 anos ou mais.',
    sources: {
      title: 'Fonte dos dados:',
      items: [
        { label: 'SEADE (2025)', href: 'https://repositorio.seade.gov.br' },
        { label: 'Geometria: Distritos Municipais de São Paulo.' },
      ],
    },
  },
};
```
