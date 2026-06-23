# @ttoss/geovis

**@ttoss/geovis** provides schema-driven geovisualization components for React applications, with a MapLibre engine adapter and a JSON-spec-based runtime.

## Installing

```shell
pnpm add @ttoss/geovis
```

You will also need to install the following peer dependencies:

```shell
pnpm add maplibre-gl @ttoss/ui
```

## Getting Started

Wrap your application (or a section of it) with `GeoVisProvider`, passing a `VisualizationSpec`:

```tsx
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

const spec = {
  engine: 'maplibre',
  view: { center: [-46.6, -23.5], zoom: 10 },
  sources: [
    {
      id: 'points',
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    },
  ],
  layers: [
    {
      id: 'points-layer',
      sourceId: 'points',
      geometry: 'point',
    },
  ],
};

const MyMap = () => (
  <GeoVisProvider spec={spec}>
    <GeoVisCanvas viewId="main" style={{ width: '100%', height: '400px' }} />
  </GeoVisProvider>
);
```

## Spec reference

### `VisualizationSpec`

Top-level spec object passed to `GeoVisProvider`.

| Field         | Type                      | Required | Description                                                                                                                                                               |
| ------------- | ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine`      | `'maplibre'`              | ✓        | Engine adapter to use. Currently only `'maplibre'` is supported.                                                                                                          |
| `sources`     | `DataSource[]`            | ✓        | Data sources referenced by layers. Supported types: `'geojson'`, `'vector-tiles'`, `'raster-tiles'`, `'raster-dem'`, `'image'`, `'video'`.                                |
| `layers`      | `VisualizationLayer[]`    | ✓        | Ordered list of layers to render (bottom-to-top).                                                                                                                         |
| `title`       | `string`                  |          | Human-readable title.                                                                                                                                                     |
| `description` | `string`                  |          | Human-readable description.                                                                                                                                               |
| `mapType`     | `MapType`                 |          | Auto-configuration hint (`'choropleth'`). When set, layers and legends are auto-generated from `mapData` — see [mapType auto-configuration](#maptype-auto-configuration). |
| `view`        | `ViewState`               |          | Initial camera state: `center`, `zoom`, `pitch`, `bearing`, `projection`.                                                                                                 |
| `basemap`     | `BaseMapSpec`             |          | Basemap tile style. Pass `visible: false` to hide tiles and show only GeoJSON layers. When hidden, the canvas container receives a `#fcfcfc` background.                  |
| `legends`     | `LegendSpec[]`            |          | Shared legend registry. Layers reference entries via `activeLegendId`.                                                                                                    |
| `mapData`     | `MapData[]`               |          | Attribute datasets joined to GeoJSON sources for choropleth coloring and tooltips.                                                                                        |
| `metadata`    | `Record<string, unknown>` |          | Arbitrary consumer metadata; not read by the runtime.                                                                                                                     |

### `LegendSpec`

Each entry in `spec.legends` (or `layer.legends`) defines one choropleth legend.

| Field           | Type                | Required | Description                                                                                                                                         |
| --------------- | ------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | `string`            | ✓        | Unique legend identifier. Referenced by `activeLegendId` and `GeoVisLegend`.                                                                        |
| `colorBy`       | `ColorBy`           | ✓        | Color-by configuration (`categorical` or `quantitative`).                                                                                           |
| `title`         | `string`            |          | Short heading rendered above the swatches.                                                                                                          |
| `subtitle`      | `string`            |          | Secondary description rendered below the title.                                                                                                     |
| `labelFormat`   | `LabelFormatSpec`   |          | Controls how quantitative bin labels are generated. Defaults to `'range'` style when omitted. See [LabelFormatSpec](#labelformatspec) table below.  |
| `normalization` | `NormalizationSpec` |          | Statistical normalisation metadata for the mapped values. Used to append semantic suffixes when `labelFormat.extended` is `true`.                   |
| `position`      | `LegendPosition`    |          | Corner overlay position: `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`. When set, `GeoVisLegend` applies absolute CSS positioning. |
| `noDataLabel`   | `string`            |          | Label for the "no data" swatch at the bottom of the legend. When omitted, no "no data" entry is shown.                                              |
| `reference`     | `string`            |          | Bibliographic attribution below the swatches. Supports `{link:visible text\|https://example.com}` inline link syntax.                               |

### `LabelFormatSpec`

Controls how quantitative legend bin labels are generated. Set on `LegendSpec.labelFormat`.

| `type`         | Extra fields                                              | Description                                                                                                                                |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `'range'`      | `separator?`, `unit?`, `extended?`                        | Raw break values joined by a separator. Example: `50k – 100k`.                                                                             |
| `'count'`      | `abbreviate?`, `extended?`                                | Compact integer counts with optional SI abbreviation. Example: `< 50k`.                                                                    |
| `'percentage'` | `decimals?`, `denominator?`, `extended?`                  | Percentage values for data already in the [0, 1] range. Example: `0% – 10%`.                                                               |
| `'stdDev'`     | `unit?: 'σ' \| 'sd'`, `extended?`                         | Standard deviation labels for diverging schemes. Example: `< −2σ`, `+1σ – +2σ`.                                                            |
| `'labels'`     | `labels: string[]`, `extended?`                           | **Explicit label list.** One string per bin, in ascending order. JSON-serialisable. Bins beyond the array length fall back to range style. |
| `'custom'`     | `formatter: (lower, upper, index) => string`, `extended?` | Runtime formatter function. Not JSON-serialisable; TypeScript-only.                                                                        |

All variants support `extended?: boolean`. When `true`, a semantic suffix from the legend's `normalization` field is appended to every label (e.g. `< 50k inhabitants`).

The `'labels'` type is the recommended choice when label text is known ahead of time — for example, qualitative classification categories (`'Low'`, `'Medium'`, `'High'`) or custom range descriptions. It is the only variant besides `'range'` and `'count'` that is fully JSON-serialisable.

### `VisualizationLayer`

Each entry in `spec.layers` describes one rendered layer.

| Field            | Type                                                                                   | Required | Description                                                                                                                                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`             | `string`                                                                               | ✓        | Unique layer identifier.                                                                                                                                                                                                                                                 |
| `sourceId`       | `string`                                                                               | ✓        | References a `DataSource.id` from `spec.sources`.                                                                                                                                                                                                                        |
| `geometry`       | `GeoVisGeometryType`                                                                   | ✓        | Render type: `'point'`, `'line'`, `'polygon'`, `'raster'`, `'symbol'`, `'heatmap'`.                                                                                                                                                                                      |
| `sourceLayer`    | `string`                                                                               |          | Vector tile source layer name. Required when `source.type` is `'vector-tiles'`.                                                                                                                                                                                          |
| `title`          | `string`                                                                               |          | Human-readable layer name.                                                                                                                                                                                                                                               |
| `visible`        | `boolean`                                                                              |          | Whether the layer is rendered. Defaults to `true`.                                                                                                                                                                                                                       |
| `minzoom`        | `number`                                                                               |          | Minimum zoom level (0–24) at which the layer is visible.                                                                                                                                                                                                                 |
| `maxzoom`        | `number`                                                                               |          | Maximum zoom level (0–24) at which the layer is visible.                                                                                                                                                                                                                 |
| `paint`          | `LayerPaint`                                                                           |          | Per-geometry paint properties. See examples below.                                                                                                                                                                                                                       |
| `legends`        | `LegendSpec[]`                                                                         |          | Alternative legend definitions exposed as runtime toggles.                                                                                                                                                                                                               |
| `activeLegendId` | `string`                                                                               |          | Active entry from `legends[]`. Enables choropleth coloring and the hover tooltip.                                                                                                                                                                                        |
| `mapDataId`      | `string`                                                                               |          | References a `MapData.mapDataId` for per-feature value joining (choropleth / tooltip). When a `MapData` declares `dimension`, the adapter auto-discovers color/size.                                                                                                     |
| `hoverPaint`     | `{ lineColor?: string; lineWidth?: number }`                                           |          | Outline rendered on the hovered feature via a companion MapLibre line layer driven by `feature-state.hover`.                                                                                                                                                             |
| `selectedPaint`  | `{ lineColor?: string; lineWidth?: number }`                                           |          | Outline rendered on the selected feature via `feature-state.selected`.                                                                                                                                                                                                   |
| `clickAnchor`    | `{ iconImage?: string; iconSize?: number; color?: string; offset?: [number, number] }` |          | Spec-driven click marker. Use `iconImage` to render a sprite icon; use `color` for the built-in SVG pin. For a custom HTML element, use `<GeoVisMarker>` instead.                                                                                                        |
| `sizeBy`         | `SizeBy`                                                                               |          | Proportional symbol configuration. Maps a numeric `mapData` property to `circle-radius`. See [Proportional Symbols](#proportional-symbols-sizeby).                                                                                                                       |
| `hoverTooltip`   | `HoverTooltipConfig`                                                                   |          | Spec-driven hover tooltip. When present, `<GeoVisProvider>` renders a `<GeoVisHoverTooltip>` automatically for features on this layer — no component needed in the tree. Mirrors `GeoVisHoverTooltipProps`. See [Spec-driven hover tooltip](#spec-driven-hover-tooltip). |

### Paint properties

The `paint` field accepts different shapes depending on `geometry`. The three most common:

**Polygon (`geometry: 'polygon'`) — `FillPaint`**

```typescript
paint: {
  fillColor: '#3b82f6',   // fill-color
  lineColor: '#1d4ed8',   // outline color (fill-outline-color)
}
```

**Line (`geometry: 'line'`) — `LinePaint`**

```typescript
paint: {
  lineColor: '#ef4444',   // line-color
  lineWidth: 2,           // line-width (pixels)
}
```

**Point (`geometry: 'point'`) — `CirclePaint`**

```typescript
paint: {
  circleColor: '#10b981',       // circle-color
  circleRadius: 6,              // circle-radius (pixels)
  circleStrokeColor: '#065f46', // circle-stroke-color
  circleStrokeWidth: 1,         // circle-stroke-width (pixels)
}
```

## Data-driven maps

`mapData` decouples attribute values from geometry: the GeoJSON source holds
shapes while `mapData` holds per-feature values. The adapter joins them at
runtime via `setFeatureState`, enabling choropleth coloring and hover tooltips
without modifying source features.

### `stateKey` and `dimension` — multiple dimensions on the same source

By default, `mapData` writes values as `{ value: X }` in the feature state.
When you need multiple independent dimensions (e.g. one for color, another for
size) on the same source, use `stateKey` to give each dataset its own key, and
`dimension` to declare which visual dimension it drives:

```json
{
  "mapData": [
    {
      "mapDataId": "population",
      "mapId": "cities",
      "stateKey": "pop",
      "dimension": "size",
      "data": [{ "geometryId": 1, "value": 100000 }]
    },
    {
      "mapDataId": "density",
      "mapId": "cities",
      "stateKey": "density",
      "dimension": "color",
      "data": [{ "geometryId": 1, "value": 50 }]
    }
  ]
}
```

Feature state becomes `{ pop: 100000, density: 50 }`, and each dimension reads
its own key via `['feature-state', 'pop']` and `['feature-state', 'density']`.
The adapter auto-discovers which dataset provides color vs. size based on
`dimension`.

### How `stateKey` resolution works

The adapter resolves `stateKey` per dimension via a fallback chain:

1. **Dimension match** — find a `mapData` entry where `dimension` matches the requested dimension (color/size) **and** `mapId` matches the layer's source.
2. **Legacy `mapDataId`** — fall back to the entry referenced by the layer's `mapDataId` field.
3. **Any entry for source** — fall back to any `mapData` entry whose `mapId` matches the layer's source.
4. **Default** — return `'value'`.

When a matching entry exists but omits `stateKey`, the adapter uses the
documented default `'value'` (so `{ value: X }` is written to feature state).
When no entry matches at all, the chain falls through to the next step.

> **Important:** when two datasets on the same source both omit `stateKey`,
> they share `feature-state.value` and overwrite each other. Use distinct
> `stateKey` values for each dimension to keep them independent.

### `stateKey` examples — default vs explicit

**Omitted `stateKey`** — adapter writes `{ value: X }` to feature state:

```json
{
  "mapData": [
    {
      "mapDataId": "population",
      "mapId": "cities",
      "dimension": "size",
      "data": [{ "geometryId": 1, "value": 100000 }]
    }
  ]
}
```

`resolveDimensionStateKey('size', 'cities', ...)` finds the entry via
`dimension: 'size'`, reads `stateKey: undefined`, and uses the default `'value'`.
Feature state becomes `{ value: 100000 }`. The size expression reads
`['feature-state', 'value']`.

**Explicit `stateKey`** — adapter writes `{ pop: X }`:

```json
{
  "mapData": [
    {
      "mapDataId": "population",
      "mapId": "cities",
      "stateKey": "pop",
      "dimension": "size",
      "data": [{ "geometryId": 1, "value": 100000 }]
    }
  ]
}
```

Feature state becomes `{ pop: 100000 }`. The size expression reads
`['feature-state', 'pop']`.

**Two datasets, no `stateKey` — collision:**

```json
{
  "mapData": [
    {
      "mapDataId": "population",
      "mapId": "cities",
      "dimension": "size",
      "data": [{ "geometryId": 1, "value": 100000 }]
    },
    {
      "mapDataId": "density",
      "mapId": "cities",
      "dimension": "color",
      "data": [{ "geometryId": 1, "value": 50 }]
    }
  ]
}
```

Both default to `stateKey: 'value'`. Feature state becomes `{ value: 50 }`
(the color dataset overwrites the size dataset). Both color and size
expressions read the same key — the size dimension is lost. Fix: declare
distinct `stateKey` values on each entry.

### Choropleth example

Declare `mapData` in the spec, reference it on the layer with `mapDataId`, and
connect a legend via `activeLegendId`.

```tsx
import {
  GeoVisCanvas,
  GeoVisHoverTooltip,
  GeoVisLegend,
  GeoVisProvider,
} from '@ttoss/geovis';
import districtsGeoJSON from './districts.geojson';

const spec = {
  engine: 'maplibre',
  view: { center: [-46.6, -23.5], zoom: 10 },
  sources: [{ id: 'districts', type: 'geojson', data: districtsGeoJSON }],
  mapData: [
    {
      mapDataId: 'population',
      mapId: 'districts', // references sources[].id
      // joinKey: 'cd_district' — set when features lack a numeric .id
      data: [
        { geometryId: 1, value: 87_000 },
        { geometryId: 2, value: 143_000 },
        { geometryId: 3, value: 210_000 },
      ],
    },
  ],
  legends: [
    {
      id: 'population-legend',
      label: 'Population',
      colorBy: {
        type: 'quantitative',
        property: 'value',
        scale: 'threshold',
        thresholds: [100_000, 200_000],
        colors: ['#bfdbfe', '#3b82f6', '#1d4ed8'],
        defaultColor: '#e2e8f0', // features with no joined value
      },
    },
  ],
  layers: [
    {
      id: 'districts-layer',
      sourceId: 'districts',
      geometry: 'polygon',
      mapDataId: 'population', // drives setFeatureState
      activeLegendId: 'population-legend', // enables coloring + hover
    },
  ],
};

const PopulationMap = () => (
  <GeoVisProvider spec={spec}>
    <div style={{ width: '100%', height: '500px' }}>
      <GeoVisCanvas viewId="main" style={{ width: '100%', height: '100%' }} />
    </div>
    {/* GeoVisHoverTooltip can be placed anywhere in the tree — */}
    {/* it uses position:fixed and viewport coordinates internally. */}
    <GeoVisHoverTooltip />
    <GeoVisLegend legendId="population-legend" />
  </GeoVisProvider>
);
```

### Joining by property instead of feature id

When GeoJSON features do not have a numeric or string `.id`, use `joinKey` to
match by a feature property instead:

```tsx
mapData: [
  {
    mapDataId: 'population',
    mapId: 'districts',
    joinKey: 'cd_district', // matches feature.properties.cd_district
    data: [
      { geometryId: 'CAMPO_LIMPO', value: 143_000 },
      { geometryId: 'BUTANTA',     value: 87_000 },
    ],
  },
],
```

### Accessing data in React

`useMapData` exposes the joined dataset in React without touching MapLibre:

```tsx
import { useMapData } from '@ttoss/geovis';

const DataTable = () => {
  const result = useMapData('population');
  if (!result) return null;
  const { rows } = result;
  return (
    <ul>
      {rows.map((row) => (
        <li key={row.geometryId}>
          {row.geometryId}: {row.value}
        </li>
      ))}
    </ul>
  );
};
```

Must be called inside `GeoVisProvider`.

### Updating data at runtime

Use `applyPatch` with `target: 'mapData'` to replace the full dataset or upsert
a single row without re-mounting the spec:

```tsx
const { applyPatch } = useGeoVis();

// Replace the full dataset — value must be a complete MapData object
applyPatch({
  target: 'mapData',
  op: 'replace',
  path: 'mapData.population',
  value: { mapDataId: 'population', mapId: 'states-source', data: newRows }, // MapData
});

// Upsert a single row — path: 'mapData.<mapDataId>.data.<geometryId>'
applyPatch({
  target: 'mapData',
  op: 'replace',
  path: 'mapData.population.data.1',
  value: 210_000,
});
```

## mapType auto-configuration

Setting `mapType: 'choropleth'` on the spec enables zero-config choropleth maps.
The runtime auto-generates polygon + outline layers, a legend with Jenks natural
breaks (for numeric data) or categorical mapping (for text data), and picks
default colors from built-in palettes.

```tsx
const spec = {
  id: 'auto-map',
  engine: 'maplibre',
  mapType: 'choropleth',
  sources: [{ id: 'regions', type: 'geojson', data: regionsGeoJSON }],
  mapData: [
    {
      mapDataId: 'population',
      mapId: 'regions',
      data: [
        { geometryId: 'A', value: 120_000 },
        { geometryId: 'B', value: 340_000 },
      ],
    },
  ],
};
```

No `layers` or `legends` configuration required — they are derived from the data.
User-provided `layers` and `legends` are preserved and never overridden. Legend
formatting (`labelFormat`, `subtitle`, `reference`) and custom colors
(`colorBy.colors`) continue to work as usual.

### Architecture note

`resolveSpecFromMapType` is called in two places: `GeoVisProvider` (for React
context consumers) and `createRuntime.update()` (for the adapter). This means
the resolution runs twice per spec update. Since `resolveSpecFromMapType` is
idempotent, this is functionally correct. The duplication exists because
`createRuntime` is a public API exported from the package and must remain
self-sufficient — it cannot assume the caller already resolved the spec.

## Boundary Groups

Boundary groups let you overlay administrative boundaries (states, municipalities,
sub-prefectures) on top of a base spec. Each group bundles its own GeoJSON source
and line layer so you can toggle visibility without removing or re-adding sources.

### Creating a group

Use `createBoundaryGroup` to build a group from a URL or inline GeoJSON:

```ts
import { createBoundaryGroup } from '@ttoss/geovis';

// URL — MapLibre fetches the GeoJSON internally
const statesGroup = createBoundaryGroup({
  id: 'brazil-states',
  data: 'https://example.com/estados.geojson',
});

// Inline GeoJSON with custom paint
const districtsGroup = createBoundaryGroup({
  id: 'sp-districts',
  data: { type: 'FeatureCollection', features: [...] },
  paint: { lineColor: '#ef4444', lineWidth: 2 },
});
```

The factory creates a single GeoJSON source and a companion line layer with
sensible defaults (`lineColor: '#6b7280'`, `lineWidth: 1`).

### Appending and toggling (imperative)

Three pure helpers manipulate groups on a spec without React:

| Function                 | Purpose                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| `appendBoundaryGroup`    | Appends group sources and layers to a spec (returns new object). |
| `toggleBoundaryGroup`    | Sets `visible` on every layer matching the group's layer IDs.    |
| `customizeBoundaryGroup` | Returns a new group with overridden `lineColor`/`lineWidth`.     |

```ts
import { appendBoundaryGroup, toggleBoundaryGroup } from '@ttoss/geovis';

let spec = appendBoundaryGroup(baseSpec, statesGroup);
spec = toggleBoundaryGroup(spec, statesGroup, false); // hide
```

### Toggle hook (React)

`useBoundaryToggle` manages visibility state for a set of groups inside React.
All groups start visible. Toggling flips `layer.visible` — sources are never
removed or re-added, so there is no map flicker.

```tsx
import {
  createBoundaryGroup,
  GeoVisCanvas,
  GeoVisProvider,
  useBoundaryToggle,
} from '@ttoss/geovis';

const statesGroup = createBoundaryGroup({
  id: 'brazil-states',
  data: 'https://example.com/estados.geojson',
});

const MyMap = ({ spec }) => {
  const {
    spec: liveSpec,
    toggle,
    isVisible,
  } = useBoundaryToggle(spec, [statesGroup]);

  return (
    <GeoVisProvider spec={liveSpec}>
      <GeoVisCanvas viewId="main" style={{ width: '100%', height: '400px' }} />
      <button onClick={() => toggle(statesGroup)}>
        {isVisible(statesGroup) ? 'Hide states' : 'Show states'}
      </button>
    </GeoVisProvider>
  );
};
```

> **Important:** pass a stable array reference for `groups` (module constant or
> `useMemo`). Changing the array reference re-appends all groups to the spec.

### Avoiding unnecessary re-renders and refetches

When boundary groups are used with dynamic paint overrides (e.g. colour picked
from a Storybook control), `customizeBoundaryGroup` returns a **new object** on
every paint change. If the new object reference is passed directly to
`useBoundaryToggle`, the hook recomputes `specWithAll` and `spec`, which
triggers `runtime.update()` and a full source/layer reconciliation cycle — even
though the GeoJSON data URLs have not changed.

**The `groups` array must be memoised.** Wrap it with `useMemo` and list only
the dependencies that actually change the group identity (the paint values):

```tsx
const districtsGroup = React.useMemo(
  () => customizeBoundaryGroup(baseDistrictsGroup, { lineColor, lineWidth }),
  [lineColor, lineWidth]
);

const stateGroup = React.useMemo(
  () =>
    customizeBoundaryGroup(baseStateGroup, {
      lineColor: stateLineColor,
      lineWidth: stateLineWidth,
    }),
  [stateLineColor, stateLineWidth]
);

const boundaryGroups = React.useMemo(
  () => [districtsGroup, stateGroup],
  [districtsGroup, stateGroup]
);
```

**Toggle effects should depend on `isVisible`, not on group objects.**
`isVisible` is a stable callback whose identity only changes when the hidden
set changes — group object references are irrelevant:

```tsx
const { spec, toggle, isVisible } = useBoundaryToggle(
  specInput,
  boundaryGroups
);

// Store latest group references in refs so effects always read the current paint
const districtsGroupRef = React.useRef(districtsGroup);
React.useEffect(() => {
  districtsGroupRef.current = districtsGroup;
}, [districtsGroup]);

React.useEffect(() => {
  if (showDistricts !== isVisible(districtsGroupRef.current))
    toggle(districtsGroupRef.current);
  // isVisible is the only dep that signals a visibility change;
  // group object changes (paint) are read via the ref.
}, [showDistricts, toggle, isVisible]);
```

> **Note:** `useBoundaryToggle` tracks visibility by the group's source ID
> (`getBoundaryGroupId`), not by object reference. Groups can be recreated
> (e.g. when paint overrides change) while preserving their visibility state.

## Spec Validation

Use `validateSpec` to validate a visualization spec against the JSON schema before passing it to `GeoVisProvider`:

```tsx
import { validateSpec } from '@ttoss/geovis';

const result = validateSpec(rawSpec);

if (!result.valid) {
  console.error('Invalid spec:', result.errors);
} else {
  // result.spec is fully typed as VisualizationSpec
}
```

## Applying Patches

Use `useGeoVis` to access `applyPatch` for efficient updates without re-rendering the full spec.

**Supported `target` values:**

| Target      | Description                                |
| ----------- | ------------------------------------------ |
| `'layer'`   | Add, remove, or update a layer             |
| `'source'`  | Add, remove, or update a source            |
| `'mapData'` | Update feature-state data bound to the map |

> **Note:** `view` and `style` changes must be applied via `update(spec)` (full spec replacement), not via `applyPatch`.

A `SpecPatch` has the shape:

```ts
type SpecPatch =
  | {
      target: 'layer' | 'source' | 'mapData';
      op: 'replace';
      path: string; // dot-separated: "layer.<layerId>.paint.<camelCaseKey>"
      //                "mapData.<mapDataId>"
      //                "mapData.<mapDataId>.data.<geometryId>"
      value?: unknown; // required for 'replace'
      rationale?: string;
    }
  | {
      target: 'layer' | 'source' | 'mapData';
      op: 'add' | 'remove';
      path?: string; // unused for layer/source add and remove ops
      value?: unknown;
      rationale?: string;
    };
```

Paint property keys follow **spec-level camelCase** (e.g. `circleOpacity`, `fillColor`, `lineWidth`).

### `replace` — update an existing paint property

The most common operation. Updates a single paint property on a live layer without re-mounting the map.

```tsx
const { applyPatch } = useGeoVis();

// Change the opacity of a circle layer via a range slider
applyPatch({
  target: 'layer',
  op: 'replace',
  path: 'layer.points-layer.paint.circleOpacity',
  value: 0.5,
});

// Change the fill color of a polygon layer
applyPatch({
  target: 'layer',
  op: 'replace',
  path: 'layer.regions-layer.paint.fillColor',
  value: '#ff0000',
});
```

**Effect:** the adapter calls `setPaintProperty` on the live map without re-mounting — `runtime.spec` is updated and `effectiveSpec` in context is refreshed, triggering a lightweight re-render in consumers but no map re-mount.

### `add` — add a new layer or source to the spec

Use `add` to append a new `VisualizationLayer` or `DataSource` at runtime.

```tsx
applyPatch({
  target: 'layer',
  op: 'add',
  value: { id: 'new-layer', sourceId: 'points', geometry: 'point' },
});

applyPatch({
  target: 'source',
  op: 'add',
  value: {
    id: 'new-source',
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  },
});
```

**Effect:** the layer or source is appended to `runtime.spec` and forwarded to the adapter. No React re-render triggered.

### `remove` — remove a layer or source from the spec

Pass the target `id` as `value` to remove an existing layer or source.

```tsx
applyPatch({
  target: 'layer',
  op: 'remove',
  value: 'routes-layer', // id of the layer to remove
});

applyPatch({
  target: 'source',
  op: 'remove',
  value: 'routes-source', // id of the source to remove
});
```

**Effect:** the entry is removed from `runtime.spec` and the adapter is notified.

### Full interactive example

```tsx
import { useGeoVis } from '@ttoss/geovis';

const LayerControls = () => {
  const { applyPatch } = useGeoVis();

  return (
    <>
      <label>
        Opacity
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          defaultValue={1}
          onChange={(e) =>
            applyPatch({
              target: 'layer',
              op: 'replace',
              path: 'layer.points-layer.paint.circleOpacity',
              value: Number(e.target.value),
            })
          }
        />
      </label>
      <button
        onClick={() =>
          applyPatch({
            target: 'layer',
            op: 'replace',
            path: 'layer.points-layer.paint.circleStrokeColor',
            value: '#ffffff',
          })
        }
      >
        Add stroke
      </button>
      <button
        onClick={() =>
          applyPatch({
            target: 'layer',
            op: 'replace',
            path: 'layer.points-layer.paint.circleStrokeColor',
            value: undefined, // undefined is treated as a no-op — use op:'remove' to remove a paint property
          })
        }
      >
        Remove stroke
      </button>
    </>
  );
};
```

## Proportional Symbols (sizeBy)

`sizeBy` maps a numeric `mapData` property to `circle-radius` via MapLibre expressions, enabling bivariate visualization (color + size). Configure it on point layers to represent data magnitude through symbol size.

### Basic usage

```tsx
const spec = {
  id: 'cities-map',
  engine: 'maplibre',
  sources: [{ id: 'cities', type: 'geojson', data: citiesGeoJSON }],
  mapData: [
    {
      mapDataId: 'population',
      mapId: 'cities',
      data: [
        { geometryId: 1, value: 87_000 },
        { geometryId: 2, value: 143_000 },
        { geometryId: 3, value: 210_000 },
      ],
    },
  ],
  legends: [
    {
      id: 'pop-legend',
      colorBy: {
        type: 'quantitative',
        property: 'value',
        scale: 'threshold',
        thresholds: [100_000, 200_000],
        colors: ['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d'],
      },
    },
  ],
  layers: [
    {
      id: 'cities-points',
      sourceId: 'cities',
      geometry: 'point',
      mapDataId: 'population',
      activeLegendId: 'pop-legend',
      sizeBy: {
        range: [3, 20], // [minRadius, maxRadius] in pixels
      },
    },
  ],
};
```

### `SizeBy` configuration

| Field        | Type                        | Required | Description                                                                 |
| ------------ | --------------------------- | -------- | --------------------------------------------------------------------------- |
| `range`      | `[number, number]`          | ✓        | Output radius range `[minRadius, maxRadius]` in pixels. Both must be > 0.   |
| `mode`       | `'continuous' \| 'stepped'` |          | Interpolation mode. Default: `'continuous'`.                                |
| `thresholds` | `number[]`                  |          | Explicit break points for stepped mode. When omitted, inherits from legend. |
| `transform`  | `'linear' \| 'sqrt'`        |          | Radius transform. `'sqrt'` makes circle **area** proportional to the value. |

### Modes

**Continuous** (`mode: 'continuous'` or omitted): Each value produces a different radius via linear interpolation between the data bounds and the pixel range.

**Stepped** (`mode: 'stepped'`): Values are grouped into bins; each bin receives a fixed radius. Thresholds can be explicit or inherited from the active legend's `colorBy.thresholds`.

### Range × Transform reference

The table below shows how different `range` values behave under `linear` and `sqrt` transforms, assuming a data range of `0–100 000`.

| `range`   | Transform | `radius@0` | `radius@50k` | `radius@100k` | Behavior                                              |
| --------- | --------- | ---------- | ------------ | ------------- | ----------------------------------------------------- |
| `[4, 20]` | linear    | 4          | 12           | 20            | Balanced; mid-value gets 60 % of max radius           |
| `[4, 20]` | sqrt      | 4          | 15.3         | 20            | Mid-value gets 75 % of max radius; **area ∝ value**   |
| `[2, 12]` | linear    | 2          | 7            | 12            | Subtle; good when size is secondary to color          |
| `[2, 12]` | sqrt      | 2          | 9.1          | 12            | Compact; sqrt prevents small values from disappearing |
| `[8, 32]` | linear    | 8          | 20           | 32            | Bold; large circles dominate the map                  |
| `[8, 32]` | sqrt      | 8          | 25.0         | 32            | Large spread; small values still visible at floor     |
| `[1, 40]` | linear    | 1          | 20.5         | 40            | Extreme spread; small dots vs huge circles            |
| `[1, 40]` | sqrt      | 1          | 28.6         | 40            | Max contrast; area-proportional across full range     |

> **Key differences:**
>
> - **Linear** — `radius = lerp(value, dataMin, dataMax) → [min, max]`. Circle **area** grows faster than the value at the high end (area ∝ radius²), so large values appear disproportionately bigger.
> - **Sqrt** — `radius = lerp(sqrt(value), sqrt(dataMin), sqrt(dataMax)) → [min, max]`. Both the input value and the data bounds are transformed to sqrt space, so output radii always stay within `[minRadius, maxRadius]` while circle **area** is proportional to the value.
> - At `value = dataMin`, both linear and sqrt produce `minRadius` (the minimum circle remains visible).
> - `sqrt` is only available in `mode: 'continuous'` — it is **not allowed** in stepped mode.

### How `sqrt` guarantees output stays in `[minRadius, maxRadius]`

The `sqrt` transform applies to **both** the input value and the interpolation
stops (data bounds), keeping the entire expression in sqrt space:

```
interpolate(linear, sqrt(value), sqrt(dataMin) → minRadius, sqrt(dataMax) → maxRadius)
```

Because `sqrt` is monotonically increasing and `sqrt(dataMin) ≤ sqrt(value) ≤ sqrt(dataMax)` when `dataMin ≤ value ≤ dataMax`, the interpolated output is always
in `[minRadius, maxRadius]`. The data bounds passed to `interpolate` are
`Math.sqrt(dataMin)` and `Math.sqrt(dataMax)`, not the raw values — this is what
prevents radii from collapsing to `minRadius` when the raw data range is large
(e.g. `sqrt(50_000) ≈ 223` would fall far below a raw stop at `50_000`).

## Bivariate Maps

Set `dimension` on each `MapData` entry to declare which visual dimension it drives. The adapter auto-discovers which dataset provides color vs. size — no layer-level references needed.

### Example

```json
{
  "mapData": [
    {
      "mapDataId": "population",
      "mapId": "cities",
      "stateKey": "pop",
      "dimension": "size",
      "data": [{ "geometryId": 1, "value": 100000 }]
    },
    {
      "mapDataId": "density",
      "mapId": "cities",
      "stateKey": "density",
      "dimension": "color",
      "data": [{ "geometryId": 1, "value": 50 }]
    }
  ],
  "layers": [
    {
      "id": "cities",
      "geometry": "point",
      "sourceId": "cities",
      "activeLegendId": "pop-legend",
      "sizeBy": { "range": [3, 20] }
    }
  ]
}
```

The color expression reads `['feature-state', 'density']` while the size expression reads `['feature-state', 'pop']`, giving each dimension independent data. Two datasets on the same source must use different `dimension` values.

## API

### `GeoVisProvider`

Provides a GeoVis runtime context for child components. Resolves the appropriate engine adapter based on `spec.engine`, initializes the runtime, and keeps it in sync with spec updates.

| Prop       | Type                | Description                                                                 |
| ---------- | ------------------- | --------------------------------------------------------------------------- |
| `spec`     | `VisualizationSpec` | The visualization spec (memoize with `useMemo` to avoid redundant updates). |
| `children` | `React.ReactNode`   | Child components, typically `GeoVisCanvas`.                                 |

> **Error handling:** if the engine adapter throws during initialization, `GeoVisProvider` re-throws the error. Wrap it with an `<ErrorBoundary>` to catch adapter errors and display a fallback UI instead of a blank screen.
>
> ```tsx
> <ErrorBoundary fallback={<p>Map failed to load.</p>}>
>   <GeoVisProvider spec={spec}>
>     <GeoVisCanvas viewId="main" style={{ width: '100%', height: '400px' }} />
>   </GeoVisProvider>
> </ErrorBoundary>
> ```

### `GeoVisCanvas`

Renders the map inside a `div` container mounted by the active engine. Must be used inside `GeoVisProvider`.

| Prop        | Type                  | Description                                        |
| ----------- | --------------------- | -------------------------------------------------- |
| `viewId`    | `string`              | Unique identifier for this canvas view.            |
| `style`     | `React.CSSProperties` | Optional inline styles for the container element.  |
| `className` | `string`              | Optional CSS class name for the container element. |

### `useGeoVis`

Returns the current `GeoVisContextValue`. Must be called inside `GeoVisProvider`.

| Return value       | Type                                | Description                                                                                                    |
| ------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `spec`             | `VisualizationSpec`                 | Current effective spec (updated after each `applyPatch`).                                                      |
| `applyPatch`       | `(patch: SpecPatch) => void`        | Dispatch a patch without re-mounting the map.                                                                  |
| `setView`          | `(options: SetViewOptions) => void` | Imperatively move the camera (center, zoom, pitch, bearing).                                                   |
| `policyViolations` | `PolicyViolation[]`                 | Active policy violations derived from the current spec. Each entry has `reason: string` and `message: string`. |
| `runtime`          | `GeoVisRuntime \| null`             | Low-level runtime instance. Avoid direct access in app code.                                                   |

`SetViewOptions` fields: `center?: LngLat`, `zoom?: number`, `pitch?: number`, `bearing?: number`, `animate?: boolean` (defaults `true` — smooth flyTo).

```tsx
const { setView } = useGeoVis();

// Fly to a new center/zoom
setView({ center: [-46.6, -23.5], zoom: 12 });

// Instant jump (no animation)
setView({ center: [-43.1, -22.9], zoom: 10, animate: false });
```

> Before the map has mounted, `setView` has no effect on the rendered map but still updates `spec.view` in the runtime. The camera will not move until a view is mounted.

### `useGeoVisHover`

Returns the live `MapHoverInfo | null` snapshot for the feature currently hovered on a polygon layer with `activeLegendId`. Lives in a dedicated context so high-frequency hover updates do not re-render `useGeoVis()` consumers. Must be called inside `GeoVisProvider`.

### `useGeoVisClick`

Returns the last clicked feature on the active map as `MapClickInfo | null` (`null` when no feature is selected). Unlike hover state, click state persists until dismissed — it clears to `null` when the user presses `Escape` or clicks outside a tracked layer/feature.

**Tracking:** `useGeoVisClick` only populates when the user clicks a feature on a layer configured with `activeLegendId` **and** the feature has an id (numeric or string). Clicks on untracked layers or features without ids are treated as outside-clicks and clear the selection.

Lives in a dedicated context (`GeoVisClickContext`) so click-state changes do not re-render `useGeoVis()` consumers. Must be called inside `GeoVisProvider`.

#### `MapClickInfo` fields

| Field       | Type                       | Description                                                                    |
| ----------- | -------------------------- | ------------------------------------------------------------------------------ |
| `layerId`   | `string`                   | Layer id that received the click.                                              |
| `sourceId`  | `string`                   | Source id backing the layer.                                                   |
| `featureId` | `string \| number`         | Clicked feature's id (typically `geometryId` from `mapData`).                  |
| `value`     | `number \| string \| null` | `feature-state.value` at click time; same semantics as `MapHoverInfo.value`.   |
| `lngLat`    | `[number, number]`         | Geographic coordinates `[lng, lat]` of the click. Useful for anchoring popups. |
| `point`     | `{ x: number; y: number }` | Canvas-relative pixel coordinates of the click.                                |

#### Example — center map on clicked feature

```tsx
import { useGeoVis, useGeoVisClick } from '@ttoss/geovis';
import { useEffect } from 'react';

const CenterOnClick = () => {
  const { setView } = useGeoVis();
  const click = useGeoVisClick();

  useEffect(() => {
    if (click) {
      setView({ center: click.lngLat, zoom: 14 });
    }
  }, [click, setView]);

  return null;
};

// Place <CenterOnClick /> anywhere inside <GeoVisProvider>
```

### `useMapData`

Returns indexed map data for a `mapDataId` as `{ mapDataId, mapId, joinKey, values, rows }`.
Must be called inside `GeoVisProvider`.

### `GeoVisLegend`

Renders a static, non-interactive legend resolved from the active spec. Resolution looks up `legendId` in `spec.legends` first, then in each `layer.legends`. Categorical legends emit one swatch per `mapping` entry (or a single fallback swatch when `mapping` is empty, mirroring the adapter's `['literal', fallbackColor]` paint output). Quantitative legends emit one swatch per `breaks[]` bin and use the same fallback chain as the adapter (`defaultColor ?? palette[0] ?? DEFAULT_MISSING_COLOR`). Must be rendered inside `GeoVisProvider`.

| Prop          | Type                        | Description                                                           |
| ------------- | --------------------------- | --------------------------------------------------------------------- |
| `legendId`    | `string`                    | Id of the legend entry to render.                                     |
| `breaks`      | `number[]`                  | Externally computed thresholds for quantitative legends. Optional.    |
| `formatValue` | `(value: number) => string` | Formatter for quantitative break labels. Defaults to `String(value)`. |
| `className`   | `string`                    | Optional CSS class for the legend container.                          |

### `GeoVisHoverTooltip`

Renders a floating tooltip over the map whenever the user hovers a polygon feature on a layer that has an `activeLegendId`. Uses `position: fixed` and viewport-relative coordinates internally, so it can be placed anywhere in the React tree — no shared container with `<GeoVisCanvas>` required. Internally subscribes to `GeoVisHoverContext` via `useGeoVisHover()`, so high-frequency hover updates do not re-render `useGeoVis()` consumers.

| Prop              | Type                                      | Description                                                                                      |
| ----------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `render`          | `(info: MapHoverInfo) => React.ReactNode` | Custom tooltip renderer. When omitted, a default two-line layout is used.                        |
| `formatValue`     | `(value: number \| string) => string`     | Formatter applied to `info.value` when no `render` prop is provided.                             |
| `className`       | `string`                                  | Optional CSS class for the tooltip container.                                                    |
| `style`           | `React.CSSProperties`                     | Optional inline style overrides merged on top of the default tooltip style.                      |
| `offset`          | `{ x: number; y: number }`                | Pixel offset from the cursor. Defaults to `{ x: 12, y: 12 }`.                                    |
| `emptyValueLabel` | `string`                                  | Label shown when `info.value` is `null` (no `mapData` for the feature). Defaults to `'No data'`. |

#### Spec-driven hover tooltip

Instead of placing `<GeoVisHoverTooltip>` in the tree, declare the tooltip
inline on the layer via `hoverTooltip`. `<GeoVisProvider>` then renders the
tooltip automatically for features hovered on that layer — picking the config
of whichever layer is under the cursor, so different layers can have different
tooltips. An empty object opts in to the default layout (`Feature #<id>` +
value). The config (`HoverTooltipConfig`) mirrors the component props above
(minus `children`).

```tsx
import type { HoverTooltipConfig } from '@ttoss/geovis';

const spec = {
  // ...sources, mapData, legends as in the choropleth example
  layers: [
    {
      id: 'districts-layer',
      sourceId: 'districts',
      geometry: 'polygon',
      mapDataId: 'population',
      activeLegendId: 'population-legend',
      hoverTooltip: {
        formatValue: (v) => new Intl.NumberFormat('pt-BR').format(Number(v)),
        render: (info) => <strong>Feature #{String(info.featureId)}</strong>,
      },
    },
  ],
};

// No <GeoVisHoverTooltip> needed — the provider renders it from the spec.
const Map = () => (
  <GeoVisProvider spec={spec}>
    <GeoVisCanvas viewId="main" />
  </GeoVisProvider>
);
```

> Because `render` holds a function, a spec carrying `hoverTooltip` is no longer
> JSON-serializable. This is intended for specs built in the frontend; if your
> specs come from a serialized source, keep using the `<GeoVisHoverTooltip>`
> component instead.

> **Do not use both at once for the same layer.** If you declare
> `layer.hoverTooltip` _and_ also mount `<GeoVisHoverTooltip>` manually, two
> tooltips render on top of each other. Pick one approach per layer: the
> spec-driven `hoverTooltip` (provider renders it) or the manual component.

### `GeoVisMarker`

Renders a DOM-based click marker anchored to the last clicked feature. It is the
React-component alternative to the spec-driven `layer.clickAnchor` field.

**When to use `<GeoVisMarker>` vs `layer.clickAnchor`:**

| Approach                          | Best for                                                                                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layer.clickAnchor` (spec-driven) | Sprite icon rendered entirely by MapLibre as a companion symbol layer. Zero React overhead; serialisable in JSON specs.                                   |
| `<GeoVisMarker>`                  | Custom HTML/React content anchored via a `maplibregl.Marker`. Use when you need arbitrary DOM elements (e.g. a styled callout, rich tooltip, or SVG pin). |

Must be rendered inside `GeoVisProvider`.

| Prop        | Type               | Description                                                                                                             |
| ----------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `children`  | `React.ReactNode`  | React content rendered inside the marker container. When provided, `color` and `element` are ignored.                   |
| `className` | `string`           | CSS class applied to a wrapper div inside the marker container (portal content). Only used when `children` is provided. |
| `color`     | `string`           | Accent colour for the built-in SVG pin. Used when neither `children` nor `element` is given.                            |
| `element`   | `HTMLElement`      | Pre-existing DOM element passed directly to `maplibregl.Marker`. Ignored when `children` is provided.                   |
| `offset`    | `[number, number]` | Pixel offset `[x, y]` applied to the DOM marker.                                                                        |

```tsx
import { GeoVisCanvas, GeoVisMarker, GeoVisProvider } from '@ttoss/geovis';

<GeoVisProvider spec={spec}>
  <GeoVisCanvas />
  {/* Marker anchors to the clicked feature automatically */}
  <GeoVisMarker>
    <div className="my-pin">📍</div>
  </GeoVisMarker>
</GeoVisProvider>;
```

### `createBoundaryGroup`

Creates a `BoundaryGroup` containing a single GeoJSON source and a companion line layer.

| Param     | Type                                         | Required | Description                                                           |
| --------- | -------------------------------------------- | -------- | --------------------------------------------------------------------- |
| `id`      | `string`                                     | ✓        | Source ID — referenced by the layer's `sourceId`.                     |
| `data`    | `string \| GeoJSONObject`                    | ✓        | Inline GeoJSON object or a URL string that MapLibre will fetch.       |
| `layerId` | `string`                                     |          | Layer ID. Defaults to `${id}-line`.                                   |
| `paint`   | `{ lineColor?: string; lineWidth?: number }` |          | Line paint overrides. Defaults: `lineColor '#6b7280'`, `lineWidth 1`. |

Returns a `BoundaryGroup` ready for `appendBoundaryGroup`, `toggleBoundaryGroup`, or `useBoundaryToggle`.

### `appendBoundaryGroup`

Merges a `BoundaryGroup` into a `VisualizationSpec`. Appends the group's sources and layers to the spec's arrays. Returns a **new** spec object — the original is not mutated.

| Param   | Type                | Description                        |
| ------- | ------------------- | ---------------------------------- |
| `spec`  | `VisualizationSpec` | The base spec (without the group). |
| `group` | `BoundaryGroup`     | The boundary group to append.      |

### `toggleBoundaryGroup`

Sets the `visible` flag on every layer in `spec` whose `id` matches any layer ID in `group`. When `visible` is `true`, the property is omitted (default-visible). When `false`, it is explicitly set. Returns a new spec.

| Param     | Type                | Description                                        |
| --------- | ------------------- | -------------------------------------------------- |
| `spec`    | `VisualizationSpec` | The spec containing the layers to toggle.          |
| `group`   | `BoundaryGroup`     | The boundary group whose layers should be toggled. |
| `visible` | `boolean`           | `true` to show, `false` to hide.                   |

### `customizeBoundaryGroup`

Returns a new `BoundaryGroup` with overridden paint properties on every line layer. Non-line layers are returned unchanged.

| Param       | Type                                         | Description                        |
| ----------- | -------------------------------------------- | ---------------------------------- |
| `group`     | `BoundaryGroup`                              | The boundary group to customize.   |
| `overrides` | `{ lineColor?: string; lineWidth?: number }` | Partial paint properties to apply. |

### `useBoundaryToggle`

React hook that manages visibility state for a set of `BoundaryGroup`s over a base spec. All groups start **visible**. The hook appends groups once and then drives `layer.visible` via `toggleBoundaryGroup` — sources are never removed or re-added, so there is no map flicker.

Must be called inside `GeoVisProvider` (or with a spec that will be passed to one).

| Param      | Type                           | Description                                                                                  |
| ---------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| `baseSpec` | `VisualizationSpec`            | Spec without any boundary groups.                                                            |
| `groups`   | `ReadonlyArray<BoundaryGroup>` | Ordered list of groups to manage. Must be a stable reference (module constant or `useMemo`). |

Returns `BoundaryToggleResult`:

| Field       | Type                                | Description                                                |
| ----------- | ----------------------------------- | ---------------------------------------------------------- |
| `spec`      | `VisualizationSpec`                 | Spec with all groups appended and visibility synchronized. |
| `toggle`    | `(group: BoundaryGroup) => void`    | Toggles the visibility of the specified group.             |
| `isVisible` | `(group: BoundaryGroup) => boolean` | Returns `true` when the group is visible.                  |

### `validateSpec`

Validates a plain object against the `@ttoss/geovis` JSON schema.

Returns `{ valid: true, spec: VisualizationSpec }` or `{ valid: false, errors: string[] }`.

## Legend Type Surface

`VisualizationLayer` exposes optional `legends` and `activeLegendId` fields,
and `VisualizationSpec` exposes optional `legends` for shared legend
registries. `colorBy` lives on `LegendSpec` (not on the layer), and the
color and legend types are part of the public `spec/types` contract, so
consumers can type legend-aware specs without reaching into internal files.

_For more on product development principles that guide our approach, see [Product Development Principles](https://ttoss.dev/docs/product/product-development/principles)._
