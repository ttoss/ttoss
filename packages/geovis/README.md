# @ttoss/geovis

**@ttoss/geovis** provides schema-driven geovisualization components for React applications, with a MapLibre engine adapter and a JSON-spec-based runtime.

## Installing

```shell
pnpm add @ttoss/geovis
```

You will also need to install MapLibre GL JS as a peer dependency:

```shell
pnpm add maplibre-gl
```

## Getting Started

Wrap your application (or a section of it) with `GeoVisProvider`, passing a `VisualizationSpec`:

```tsx
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

const spec = {
  id: 'my-map',
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

Use `useGeoVis` to access `applyPatch` for efficient paint updates without re-rendering the full spec. A `SpecPatch` has the shape:

```ts
interface SpecPatch {
  target: 'layer' | 'source' | 'view' | 'style';
  op: 'replace' | 'add' | 'remove';
  path: string; // dot-separated: "layer.<layerId>.paint.<camelCaseKey>"
  value?: unknown; // required for 'replace' and 'add'
  rationale?: string;
}
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

**Effect:** the adapter calls `setPaintProperty` on the live map instance and `runtime.spec` is updated in sync — no React re-render triggered.

### `add` — set a paint property that was not previously defined

Use `add` when the property does not yet exist in the layer's `paint` object.

```tsx
applyPatch({
  target: 'layer',
  op: 'add',
  path: 'layer.routes-layer.paint.lineOpacity',
  value: 0.8,
});
```

**Effect:** behaves like `replace` at the adapter level (MapLibre's `setPaintProperty` handles both); `runtime.spec` is updated with the new property.

> **Note:** `add` and `remove` for targets other than `layer.paint` (e.g. adding a new source or layer) are not yet implemented in the MapLibre adapter and are treated as a no-op.

### `remove` — clear a paint property (reset to default)

Pass `value: undefined` (or omit `value`) together with `op: 'remove'` to reset a property to the engine default.

```tsx
applyPatch({
  target: 'layer',
  op: 'remove',
  path: 'layer.routes-layer.paint.lineDasharray',
});
```

**Effect:** the property is removed from `runtime.spec`; the adapter resets the paint property to its MapLibre default.

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
            op: 'add',
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
            op: 'remove',
            path: 'layer.points-layer.paint.circleStrokeColor',
          })
        }
      >
        Remove stroke
      </button>
    </>
  );
};
```

## API

### `GeoVisProvider`

Provides a GeoVis runtime context for child components. Resolves the appropriate engine adapter based on `spec.engine`, initializes the runtime, and keeps it in sync with spec updates.

| Prop       | Type                | Description                                                                 |
| ---------- | ------------------- | --------------------------------------------------------------------------- |
| `spec`     | `VisualizationSpec` | The visualization spec (memoize with `useMemo` to avoid redundant updates). |
| `children` | `React.ReactNode`   | Child components, typically `GeoVisCanvas`.                                 |

### `GeoVisCanvas`

Renders the map inside a `div` container mounted by the active engine. Must be used inside `GeoVisProvider`.

| Prop        | Type                  | Description                                        |
| ----------- | --------------------- | -------------------------------------------------- |
| `viewId`    | `string`              | Unique identifier for this canvas view.            |
| `style`     | `React.CSSProperties` | Optional inline styles for the container element.  |
| `className` | `string`              | Optional CSS class name for the container element. |

### `useGeoVis`

Returns the current `GeoVisContextValue`: `{ runtime, spec, applyPatch }`. Must be called inside `GeoVisProvider`.

### `validateSpec`

Validates a plain object against the `@ttoss/geovis` JSON schema.

Returns `{ valid: true, spec: VisualizationSpec }` or `{ valid: false, errors: string[] }`.

_For more on product development principles that guide our approach, see [Product Development Principles](https://ttoss.dev/docs/product/product-development/principles)._
