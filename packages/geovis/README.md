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

Use `useGeoVis` to access `applyPatch` for efficient paint updates without re-rendering the full spec:

```tsx
import { useGeoVis } from '@ttoss/geovis';

const Controls = () => {
  const { applyPatch } = useGeoVis();

  const handleOpacityChange = (opacity: number) => {
    applyPatch({
      target: 'layer',
      op: 'replace',
      // Use spec-level camelCase paint keys
      path: 'layer.points-layer.paint.circleOpacity',
      value: opacity,
    });
  };

  return (
    <input
      type="range"
      min={0}
      max={1}
      step={0.1}
      onChange={(e) => handleOpacityChange(Number(e.target.value))}
    />
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
