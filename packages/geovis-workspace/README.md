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
from it, so picking a variation recolors the map. The left sidebar is driven by
`config.leftSidebar.sections`; seed the initial selection with
`getInitialSelection` (reads each `variations` section's `defaultValue`).

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
    initialState: 'open',
    sections: [
      {
        id: 'variable',
        header: { title: 'Variável', icon: 'lucide:layers' },
        body: {
          kind: 'variations',
          menuId: 'variable',
          defaultValue: 'rate',
          groups: [
            {
              id: 'metrics',
              label: 'Métricas',
              variations: [
                { value: 'rate', label: 'Taxa cumulativa' },
                { value: 'range', label: 'Faixa (% da pop 65+)' },
              ],
            },
          ],
        },
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
manage the selection internally (seeded from each `variations` section's
`defaultValue`).

Return a promise from `onVariableChange` when serving a variation costs a
request, and every menu goes inert until it settles — the picked row keeps its
active look and spins, the rest dim — so a user cannot stack picks the app then
has to serve out of order. A rejection releases them exactly like a resolve, and
returning nothing keeps the menus live. Timeline ticks never lock anything, even
from a handler that always returns a promise: what blocks is decided by where
the change came from. Provide them to control it from the parent — required when the
selection must drive the `visualizationSpec`. Selection is keyed by each
control's `menuId`: choosing a variation only affects its own key. Read the
current selection anywhere inside the workspace with `useGeovisWorkspace()`.

## Left sidebar

The left sidebar renders as a card with an icon **tab bar** — one tab per
`leftSidebar.sections` entry — a header mirroring the active tab, and the active
tab's body. `header.title` names the section: it heads that band, labels the
section's tab for assistive tech, and shows on hover. Leave it out on every
section and the band goes away — the tab bar takes the top of the card, close
button included — so the tabs alone carry the navigation; leave it out on only
some and the band stays for all, empty on those. The tab keeps its icon either
way and falls back to the section `id` for its accessible name. Each section's `body` is one of two kinds:

- **`variations`** — a flat list of selectable rows (grouped only for ordering)
  that drive the shared selection (`selection[menuId]`), recoloring the map.
- **`filters`** — a stack of headed blocks, each wrapping one control:
  a **timeline** (numeric range with an optional histogram and play/pause; drives
  `selection[menuId]` when it declares one, otherwise visual-only), **chips**
  (visual-only toggle chips whose active count shows as a tab badge), or a
  **locator** (visual-only search box).

A kind describes a body, not a tab, so several sections may carry `filters` —
put the timeline in a tab of its own beside a tab holding the remaining
controls, and each gets its own header, its own `enabledWhen` gate, and (for the
timeline) a HUD scoped to it. Each tab renders only the blocks it declares.

Two controls stay singular across the whole sidebar, wherever they are declared:
the **timeline**, whose state is lifted above both surfaces that drive it (the
sidebar control and the HUD), and the **chips**, whose selection is lifted so a
tab can badge its count. Declare more than one of either and the first wins.

A `timeline` that declares a `menuId` publishes its `defaultValue ?? min` to the
shared selection on mount, so an uncontrolled parent learns the initial value
without moving the slider.

Below the 640px breakpoint a timeline also gets a **HUD**: a control bar anchored
to the bottom of the map, carrying the current value, a 3px rule marking where in
the range playback sits, and prev / play-pause / next at touch size. No
configuration turns it on — declaring a timeline is enough, and the rule is
derived from `min`/`max`/`step`, so it draws with or without `histogram` (only
the record count beside the value needs that data). It appears once play has been pressed and the
sidebar is closed, which is what `closeOnPlay` produces: play would otherwise
take the pause button away with the sidebar and leave the time-lapse running
unattended. It survives pausing (so play can resume from it), hides while the
sidebar is open, and can be dismissed until the next play. Above the breakpoint
it never renders, since the sidebar's own control never leaves the screen.

While the bar shows, the map's layer control is lifted clear of it by setting
`control.offset.y` — the same mechanism that pushes the control sideways past an
open sidebar, so the two compose. The compact legend panel rises with it for
free: GeoVis anchors that panel off the control's own gap.

## Slots

The workspace is built from six named slots. `map` fills the main area;
`controls` renders in the left sidebar; `legend`, `warnings`, `inspector`, and
`metadata` stack in that order in the right sidebar. Placement is fixed —
only a slot's _content_ is configurable:

| Slot        | Region        | Default panel                                                                       |
| ----------- | ------------- | ----------------------------------------------------------------------------------- |
| `map`       | Main area     | The GeoVis canvas.                                                                  |
| `controls`  | Left sidebar  | Sections from `config.leftSidebar.sections`.                                        |
| `legend`    | Right sidebar | Description/sources from `config.legend` plus the spec's legends.                   |
| `warnings`  | Right sidebar | Issues from `useGeoVis().result` — see [Warnings and repair](#warnings-and-repair). |
| `inspector` | Right sidebar | The clicked feature from `useGeoVisClick()`, with a dismiss button.                 |
| `metadata`  | Right sidebar | The spec's `mapType` and source count — see [Metadata](#metadata).                  |

A sidebar renders only when at least one of its slots has content — an
override component, or (for `controls`) at least one section, (for `legend`)
a `description`/`sources` or a spec-resolved legend, or (for `metadata`) a spec
with a `mapType` or at least one source. Use `config.slots` to hide a slot or
replace its default panel with a custom component, which gets the same runtime
access (`useGeoVis()`, `useGeoVisClick()`, `useGeoVisHover()`) as the default it
replaces:

```tsx
const config: GeovisWorkspaceConfig = {
  slots: {
    legend: { hidden: true },
    controls: { component: MyCustomControls },
  },
};
```

## Layer control and the left sidebar

If the map spec declares a [`control`](https://github.com/ttoss-labs/ttoss/tree/main/packages/geovis#layer-control) (GeoVis's floating layer-toggle panel), it is auto-mounted by
`GeoVisProvider` and anchored to a map corner — by default the bottom-left,
the same corner the left sidebar opens over. To keep an opening sidebar from
covering it, the workspace hands the map a larger `control.offset.x` while the
left sidebar is open, sliding the control clear along the bottom edge; it snaps
back when the sidebar closes. The shift is purely presentational (the workspace
never mutates your spec's other fields) and only applies to a left-anchored
control — a `bottom-right`/`top-right` control the sidebar never overlaps is
left untouched. No configuration is needed; it follows the sidebar's open state
automatically.

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

For a richer, data-bound detail view, configure the imperative detail API on
`rightSidebar` instead of overriding the slot. When `onFeatureSelect` (and/or
`renderDetails`) is set, an accepted click opens the right sidebar, runs
`onFeatureSelect` for the clicked feature, and hands its `loading`/`error`/
`data` state to `renderDetails`. `shouldOpen` gates which clicks are accepted —
return `false` to ignore a click, keeping the current detail and open state.
The workspace never fetches or caches: `onFeatureSelect` owns the request.

```tsx
<GeovisWorkspace
  config={{
    rightSidebar: {
      title: 'Details',
      shouldOpen: (info) => info.layerId === 'kitchens',
      onFeatureSelect: (info) =>
        fetch(`/api/kitchens/${info.featureId}`).then((r) => r.json()),
      renderDetails: ({ loading, error, data }) => {
        if (loading) return <Spinner />;
        if (error || !data) return null;
        return <KitchenDetail kitchen={data as Kitchen} />;
      },
    },
  }}
  visualizationSpec={visualizationSpec}
/>
```

## Metadata

The `metadata` slot's default panel needs no config: it reads the current
`visualizationSpec` via `useGeoVis()` and shows the `mapType`, when set, and a
pluralized source count. It renders nothing — and contributes no content
toward showing the right sidebar — when the spec has neither, so it never
appears as an always-on placeholder.

## API

### `GeovisWorkspace` props

| Prop                | Type                                  | Description                                                                                            |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `config`            | `GeovisWorkspaceConfig`               | Describes the slots. Required.                                                                         |
| `visualizationSpec` | `VisualizationSpec`                   | GeoVis spec rendered in the main map area. Required.                                                   |
| `variables`         | `Record<string, string \| undefined>` | Controlled selection keyed by each control's `menuId`. Omit for uncontrolled.                          |
| `onVariableChange`  | `(variables) => void`                 | Called with the full next selection when a variation is picked or the timeline advances.               |
| `onRepair`          | `(repair: RepairOption) => void`      | Called with the chosen repair when a repair button is pressed. Omit to render repair buttons disabled. |

### `GeovisWorkspaceConfig`

| Property       | Type                                                                  | Description                                                                                                        |
| -------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `appearance`   | `'card' \| 'bare'`                                                    | Container framing. `'card'` (default) draws a border/radius/background; `'bare'` fills edge-to-edge for embedding. |
| `slots`        | `Partial<Record<GeovisWorkspaceSlotName, GeovisWorkspaceSlotConfig>>` | Per-slot override/hide. Omit an entry for the default.                                                             |
| `legend`       | `GeovisWorkspaceLegendConfig`                                         | Content for the `legend` slot's default panel.                                                                     |
| `leftSidebar`  | `GeovisWorkspaceLeftSidebarState`                                     | Left sidebar sections and open/closed state.                                                                       |
| `rightSidebar` | `GeovisWorkspaceRightSidebarState`                                    | Right sidebar title, open/closed state, and detail API.                                                            |

### `GeovisWorkspaceSlotName`

`'map' | 'legend' | 'warnings' | 'inspector' | 'metadata' | 'controls'` — the
closed, versioned slot vocabulary. Adding a name is additive; renaming one is
breaking.

### `GeovisWorkspaceSlotConfig`

| Property    | Type                  | Description                                                        |
| ----------- | --------------------- | ------------------------------------------------------------------ |
| `component` | `React.ComponentType` | Replaces the slot's default panel. Gets the same runtime access.   |
| `hidden`    | `boolean`             | Hides the slot's region entirely instead of rendering its default. |

### `GeovisWorkspaceLeftSidebarState`

| Property       | Type                              | Description                                          |
| -------------- | --------------------------------- | ---------------------------------------------------- |
| `initialState` | `'open' \| 'closed'`              | Whether the sidebar starts open. Defaults to closed. |
| `sections`     | `GeovisWorkspaceSidebarSection[]` | The sidebar's tabs, left to right.                   |

### `GeovisWorkspaceSidebarSection`

| Property | Type                                             | Description                                     |
| -------- | ------------------------------------------------ | ----------------------------------------------- |
| `id`     | `string`                                         | Unique section id.                              |
| `header` | `{ title?; icon?; iconColor?; iconBackground? }` | The tab/header icon chip and title.             |
| `body`   | `variations` \| `filters`                        | The section's content, discriminated by `kind`. |

A **`variations`** body (`kind: 'variations'`) has a `menuId` (the selection
key it drives), an optional `title` and `icon` heading the list with the same
label a filter block draws, an optional `defaultValue`, an optional
`closeOnSelect`, and
`groups` — each group
`{ id, label, icon?, color?, variations: [{ value, label, icon?, description? }] }`;
the groups are flattened into one ordered list. A variation's `description` is
its hover tooltip, so give it what the label cannot hold — what the variation
measures, or the unit it is read in — and omit it otherwise: a row without one
renders no tooltip rather than one repeating the label. `closeOnSelect` closes the sidebar
as soon as a variation is picked, so the map it just recolored is visible
without a second tap; it lives on the body, not on `leftSidebar`, because a
`filters` section's timeline writes to the selection on every auto-advance tick
and must not close anything. A **`filters`** body
(`kind: 'filters'`) has `blocks` — each block
`{ id, title, icon?, collapsible?, defaultOpen?, control }`, where `control` is
a `timeline`
(`{ kind, menuId?, min, max, step?, defaultValue?, histogram?, unitLabel?, closeOnPlay? }`
— `closeOnPlay` clears the sidebar off the map when playback starts, and only
then: not on pause, the steppers, or each auto-advance tick; `histogram` counts
are grouped wherever they show — the bars' tooltips, the `unitLabel` readout and
the compact HUD — using the locale declared on `I18nProvider`, whether or not a
message bundle was loaded for it, while the keys stay ungrouped because they are
years),
`chips` (`{ kind, menuId?, options, multiple?, defaultSelected? }` — with a
`menuId` the active ids reach `selection[menuId]` joined by commas, `''` when
none are active, which is both what the one-string-per-key selection holds and
what a permalink needs; without one the selection stays visual-only),
`locator` (`{ kind, placeholder?, minChars?, options }`), or
`variations` (`{ kind, menuId, variations, defaultValue?, closeOnSelect? }`).

A block draws a fixed header over its control. Declaring `collapsible` turns
that header into a toggle — which is what `defaultOpen` answers to — and is
worth it for a block long enough to push its neighbours off screen; the tab bar
is what puts whole sets of controls away.

A `variations` **control** is the same menu a `variations` **body** renders —
the same rows, the same shared selection, seeded the same way by
`getInitialSelection` — but as a block rather than as a whole tab. That is the
difference worth choosing between: a body is one menu per tab, so two menus cost
the user a tab switch; as blocks, several menus stack in one tab, each under its
own heading. Reach for the body when a tab belongs to one long menu,
and for blocks when the menus are read together — an indicator and the age band
it applies to, say. Both remain available, and a menu behaves identically either
way, `enabledWhen` gates included.

### `GeovisWorkspaceRightSidebarState`

| Property          | Type                                                     | Description                                                                            |
| ----------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `initialState`    | `'open' \| 'closed'`                                     | Whether the sidebar starts open. Defaults to `'closed'`.                               |
| `title`           | `string`                                                 | Title shown at the top.                                                                |
| `shouldOpen`      | `(info: MapClickInfo) => boolean`                        | Gate deciding whether a click drives the inspector. Defaults to accepting every click. |
| `onFeatureSelect` | `(info: MapClickInfo) => Promise<unknown>`               | Fetches the clicked feature's detail; its promise drives `renderDetails`.              |
| `renderDetails`   | `(state: GeovisWorkspaceDetailState) => React.ReactNode` | Renders the `inspector` slot from the `loading`/`error`/`data` fetch state.            |

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
