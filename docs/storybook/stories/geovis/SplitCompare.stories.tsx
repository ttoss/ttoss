import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  PartialVisualizationSpec,
  VisualizationLayer,
  VisualizationView,
} from '@ttoss/geovis';
import { applyDefaults, GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';
import * as React from 'react';

import choroplethMinimal from '../../../../packages/geovis/src/fixtures/invalid-raw-count-choropleth.minimal.json';
import splitCompareMinimal from '../../../../packages/geovis/src/fixtures/split-compare.minimal.json';
import {
  applyBasemap,
  BASEMAP_ARG_TYPE,
  type BasemapArgs,
  ChoroplethPainter,
  ColorSwatchLegend,
  DEFAULT_BASEMAP_ARGS,
  GeoVisSplitLayout,
  type LockRef,
  MapLabel,
  MapOverlayLegend,
  type MapRef,
  MapSync,
} from './_map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/SplitCompare',
  tags: ['autodocs'],
  argTypes: BASEMAP_ARG_TYPE,
  args: DEFAULT_BASEMAP_ARGS,
} as Meta<BasemapArgs>;

// Story-level layer definitions overlaid on the data-only minimal fixture.
// View (center/zoom) is auto-derived by `applyDefaults` from the inline
// district polygons — no hardcoded camera position needed.
const districtsFill: VisualizationLayer = {
  id: 'districts-fill',
  dataId: 'sp-districts',
  geometry: 'polygon',
  paint: { fillColor: '#3b82f6', fillOpacity: 0.45, lineColor: '#1d4ed8' },
};
const districtsLine: VisualizationLayer = {
  id: 'districts-line',
  dataId: 'sp-districts',
  geometry: 'line',
  paint: { lineColor: '#dc2626', lineWidth: 3 },
};
const leftSpec: PartialVisualizationSpec = {
  ...(splitCompareMinimal as PartialVisualizationSpec),
  layers: [districtsFill],
};
const rightSpec: PartialVisualizationSpec = {
  ...(splitCompareMinimal as PartialVisualizationSpec),
  layers: [districtsLine],
};

// Auto-derived view used by the recenter button.
const SP_VIEW = applyDefaults(leftSpec).view;

// Choropleth spec used by Option A — adds layer + views[] to the
// data-only Rwanda fixture. The source is a remote URL, so an explicit
// view is provided here (the adapter still refines it via `autoFit` once
// the source loads).
const rwandaChoroplethLayer: VisualizationLayer = {
  id: 'rwanda-choropleth',
  dataId: 'rwanda-provinces',
  geometry: 'polygon',
  paint: {
    fillColor: '#dbeafe',
    fillOpacity: 0.85,
    lineColor: '#94a3b8',
  },
};
const choroplethSpec: PartialVisualizationSpec = {
  ...(choroplethMinimal as PartialVisualizationSpec),
  view: { center: [30.0222, -1.9596], zoom: 7, autoFit: true },
  layers: [rwandaChoroplethLayer],
  views: [
    {
      id: 'left',
      label: 'Absolute population count (population) — invalid',
      layers: ['rwanda-choropleth'],
    },
    {
      id: 'right',
      label: 'Population density (hab/km²) — correct',
      layers: ['rwanda-choropleth'],
    },
  ],
};

// Blue scale for absolute count (invalid).
// Rwanda: Kigali=1.1M (smallest, densest), East/South/West=2.5-2.6M (largest).
const rawSteps = [
  { threshold: 1_300_000, color: '#bfdbfe' },
  { threshold: 1_700_000, color: '#60a5fa' },
  { threshold: 2_000_000, color: '#3b82f6' },
  { threshold: 2_300_000, color: '#1d4ed8' },
];

// Green scale for normalised density (correct).
// Rwanda: East=274, West=420, South=434, North=527, Kigali=1551 hab/km².
const densitySteps = [
  { threshold: 350, color: '#86efac' },
  { threshold: 430, color: '#4ade80' },
  { threshold: 520, color: '#16a34a' },
  { threshold: 900, color: '#15803d' },
  { threshold: 1300, color: '#14532d' },
];

// MapLibre expression: population / sq-km — evaluated at runtime.
const densityExpr = ['/', ['get', 'population'], ['get', 'sq-km']] as const;

const fmtPop = (v: number) => {
  return `${(v / 1_000_000).toFixed(1)}M hab.`;
};
const fmtDensity = (v: number) => {
  return `${v} hab/km²`;
};

// Main story

/**
 * Two independent `GeoVisProvider` instances sharing the same data source.
 * The left panel displays territorial coverage (fill).
 * The right panel displays zone perimeters (line).
 * Movement is synchronised via `getNativeInstance()` — no additional package API needed.
 */
export const SplitCompare: StoryFn<BasemapArgs> = ({ basemapStyleUrl }) => {
  const activeLeftSpec = React.useMemo(() => {
    return applyBasemap(leftSpec, basemapStyleUrl);
  }, [basemapStyleUrl]);
  const activeRightSpec = React.useMemo(() => {
    return applyBasemap(rightSpec, basemapStyleUrl);
  }, [basemapStyleUrl]);
  const leftMapRef = React.useRef<MapRef['current']>(null);
  const rightMapRef = React.useRef<MapRef['current']>(null);
  const syncLock = React.useRef(false) as LockRef;

  const recenter = () => {
    const { center, zoom } = SP_VIEW;
    syncLock.current = true;
    for (const map of [leftMapRef.current, rightMapRef.current]) {
      map?.jumpTo({ center, zoom, animate: false });
    }
    syncLock.current = false;
  };

  const canvasStyle: React.CSSProperties = { width: '100%', height: '100%' };
  const panelStyle: React.CSSProperties = {
    position: 'relative',
    flex: 1,
    border: '1px solid #d4d4d8',
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <strong>Split Compare — Territorial Coverage vs Perimeter</strong>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
            Two maps derived from the same data source (Sao Paulo districts).
          </p>
        </div>
        <button
          onClick={recenter}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid #d4d4d8',
            background: 'white',
            cursor: 'pointer',
            fontSize: 13,
            color: '#374151',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          ⊙ Recenter
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, height: 480 }}>
        <div style={panelStyle}>
          <MapLabel>Territorial coverage (fill)</MapLabel>
          <GeoVisProvider spec={activeLeftSpec}>
            <GeoVisCanvas viewId="left" style={canvasStyle} />
            <MapSync
              selfRef={leftMapRef}
              peerRef={rightMapRef}
              lockRef={syncLock}
            />
          </GeoVisProvider>
        </div>

        <div style={panelStyle}>
          <MapLabel>Zone perimeters (line)</MapLabel>
          <GeoVisProvider spec={activeRightSpec}>
            <GeoVisCanvas viewId="right" style={canvasStyle} />
            <MapSync
              selfRef={rightMapRef}
              peerRef={leftMapRef}
              lockRef={syncLock}
            />
          </GeoVisProvider>
        </div>
      </div>

      <div>
        <strong>Official references</strong>
        <ul>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/sync-movement-of-multiple-maps/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre — Sync movement of multiple maps
            </a>
          </li>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/change-a-layers-color-with-buttons/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre &mdash; Change a layer&apos;s color with buttons
              (setPaintProperty)
            </a>
          </li>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/add-a-geojson-polygon/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre — Add a GeoJSON polygon
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Exploration of native library APIs

/**
 * **Option A — `views[]` in VisualizationSpec (spec-first)**
 *
 * The fixture `invalid-raw-count-choropleth.json` declares:
 * ```json
 * "views": [
 *   { "id": "left",  "label": "...", "layers": ["rwanda-choropleth"] },
 *   { "id": "right", "label": "...", "layers": ["rwanda-choropleth"] }
 * ]
 * ```
 *
 * `GeoVisSplitLayout` reads `spec.views[]`, derives a spec filtered per view,
 * creates one `GeoVisProvider` + `GeoVisCanvas` per panel and manages synchronisation
 * internally. The consumer needs no `MapRef`, `LockRef`, or `MapSync`.
 *
 * The `render` prop is the escape hatch for logic not yet declarable in the spec:
 * `ChoroplethPainter` applies data-driven paint via `getNativeInstance()` because
 * `FillPaint.fillColor` does not support MapLibre expressions in schema v1.
 *
 * Data: Rwanda provinces (official MapLibre dataset — fields `population` and `sq-km`).
 * Demonstrates the classic anti-pattern: Kigali City has 1.1M inhabitants (smallest province)
 * but 1,551 hab/km² (densest). On the left map it appears almost white; on the right it is the darkest.
 */
export const OptionA_ViewsInSpec: StoryFn<BasemapArgs> = ({
  basemapStyleUrl,
}) => {
  const activeSpec = React.useMemo(() => {
    return applyBasemap(choroplethSpec, basemapStyleUrl);
  }, [basemapStyleUrl]);
  const renderView = (view: VisualizationView) => {
    if (view.id === 'left') {
      return (
        <>
          <MapOverlayLegend
            label="absolute population"
            defaultColor="#eff6ff"
            steps={rawSteps}
            formatValue={fmtPop}
          />
          <ChoroplethPainter
            layerId="rwanda-choropleth"
            field="population"
            defaultColor="#eff6ff"
            steps={rawSteps}
          />
        </>
      );
    }
    return (
      <>
        <MapOverlayLegend
          label="density (hab/km²)"
          defaultColor="#f0fdf4"
          steps={densitySteps}
          formatValue={fmtDensity}
        />
        <ChoroplethPainter
          layerId="rwanda-choropleth"
          field={densityExpr}
          defaultColor="#f0fdf4"
          steps={densitySteps}
        />
      </>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>Option A — spec.views[] with GeoVisSplitLayout</strong>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          The fixture declares <code>views[]</code>. The layout reads the spec
          and creates panels with automatic sync — no <code>MapRef</code> or{' '}
          <code>MapSync</code> in the consumer.
        </p>
      </div>

      <GeoVisSplitLayout
        spec={activeSpec}
        leftBorder="2px solid #f59e0b"
        rightBorder="2px solid #16a34a"
        render={renderView}
      />

      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ flex: 1 }}>
          <ColorSwatchLegend
            title="Blue — absolute count (invalid)"
            defaultColor="#eff6ff"
            steps={rawSteps}
            formatValue={fmtPop}
          />
        </div>
        <div style={{ flex: 1 }}>
          <ColorSwatchLegend
            title="Green — density hab/km² (correct)"
            defaultColor="#f0fdf4"
            steps={densitySteps}
            formatValue={fmtDensity}
          />
        </div>
      </div>

      <details style={{ marginTop: 4 }}>
        <summary
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          How to use: consumer code
        </summary>
        <pre
          style={{
            marginTop: 8,
            fontFamily: 'monospace',
            fontSize: 12,
            whiteSpace: 'pre',
            overflowX: 'auto',
            background: '#f3f4f6',
            padding: 12,
            borderRadius: 6,
            color: '#1f2937',
          }}
        >
          {`// 1. The fixture (or AI-generated spec) declares views[]:
//
// {
//   "id": "invalid-raw-count-choropleth",
//   "sources": [{ "id": "rwanda-provinces", ... }],
//   "layers": [{ "id": "rwanda-choropleth", ... }],
//   "views": [
//     { "id": "left",  "label": "Absolute population count — invalid", "layers": ["rwanda-choropleth"] },
//     { "id": "right", "label": "Population density (hab/km²) — correct",  "layers": ["rwanda-choropleth"] }
//   ]
// }

import { GeoVisSplitLayout } from './_map-story-helpers';
import type { VisualizationView } from '@ttoss/geovis';

// 2. The consumer provides per-view logic via the render prop:
const renderView = (view: VisualizationView) => {
  if (view.id === 'left') {
    return (
      <ChoroplethPainter
        layerId="rwanda-choropleth"
        field="population"
        defaultColor="#eff6ff"
        steps={rawSteps}
      />
    );
  }
  return (
    <ChoroplethPainter
      layerId="rwanda-choropleth"
      field={['/', ['get', 'population'], ['get', 'sq-km']]}
      defaultColor="#f0fdf4"
      steps={densitySteps}
    />
  );
};

// 3. Layout and sync are automatic — no MapRef, LockRef or MapSync:
<GeoVisSplitLayout
  spec={spec}
  leftBorder="2px solid #f59e0b"
  rightBorder="2px solid #16a34a"
  render={renderView}
/>`}
        </pre>
      </details>

      <div>
        <strong>Official references</strong>
        <ul style={{ fontSize: 13 }}>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/visualize-population-density/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre — Visualize population density
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

OptionA_ViewsInSpec.parameters = {
  docs: {
    description: {
      story:
        'Spec-first: `views[]` declares multiple perspectives of the same data in the fixture JSON. `GeoVisSplitLayout` reads the spec from the prop, filters layers per view, creates one `GeoVisProvider` per panel and synchronises automatically — no `MapRef`, `LockRef` or `MapSync` in the consumer. The `render` prop is the _escape hatch_ for logic not yet declarable in the spec (e.g. MapLibre expressions in paint via `ChoroplethPainter`).',
    },
  },
};

/**
 * **Option B — `useSplitCompare()` hook**
 *
 * The hook receives a base spec and per-panel overrides (e.g. filtered layers),
 * returns derived specs and a pair of sync components for the consumer to mount.
 *
 * ```tsx
 * const { leftProps, rightProps, syncRef } = useSplitCompare(baseSpec, {
 *   left:  { layers: ['districts-fill'] },
 *   right: { layers: ['districts-line'] },
 * });
 *
 * <div style={{ display: 'flex' }}>
 *   <GeoVisProvider spec={leftProps.spec}>
 *     <GeoVisCanvas viewId="left" style={{ flex: 1 }} />
 *     <syncRef.Left />
 *   </GeoVisProvider>
 *   <GeoVisProvider spec={rightProps.spec}>
 *     <GeoVisCanvas viewId="right" style={{ flex: 1 }} />
 *     <syncRef.Right />
 *   </GeoVisProvider>
 * </div>
 * ```
 *
 * ---
 *
 * ## Trade-offs: Option A (views[] in spec) vs Option B (useSplitCompare hook)
 *
 * | Dimension                 | Option A — spec-first             | Option B — hook                    |
 * |---------------------------|-----------------------------------|------------------------------------|
 * | Schema coupling           | Adds `views[]` to schema v1       | No schema change                   |
 * | Declarativeness           | Data structure (JSON)             | TypeScript code                    |
 * | Serializability           | Spec is persistable/transmittable | Override is ephemeral (code)       |
 * | AI generability           | LLM generates `views[]` as JSON   | Requires code generation           |
 * | Layout control            | Delegated to layout component     | Consumer controls 100%             |
 * | Sync                      | Automatic — cannot be forgotten   | Explicit via `syncRef` — fragile   |
 * | Per-panel escape hatch    | `render` prop with view arg       | Direct child per panel             |
 * | Testability               | Requires render-level test        | Hook can be tested in isolation    |
 * | Schema evolution          | Breaking if views[] schema changes | Change isolated to hook API       |
 * | Number of panels          | Fixed (2 in current layout)       | N panels (flexible)                |
 * | Consumer boilerplate      | Minimal (one `render` prop)       | Verbose (2 providers + syncRef)    |
 *
 * ### When to prefer A
 * - The split-compare is part of the data definition (e.g. an invalid-policy fixture
 *   that MUST always be shown with the correct version alongside)
 * - Specs are AI-generated or persisted in a database — the views structure
 *   must be readable by any consumer without knowing the hook
 * - Automatic sync is a compliance requirement (e.g. audits, reviews)
 *
 * ### When to prefer B
 * - The layout is variable: the consumer may want 3 panels, column direction,
 *   asymmetric sizes, or integration with an external UI system
 * - The hook is composed with other logic (e.g. conditional filters per panel)
 * - Time-to-first-implementation is short: no ADR cost for schema changes
 */
export const OptionB_UseSplitCompareHook: StoryFn<BasemapArgs> = () => {
  return (
    <div
      style={{
        padding: 24,
        background: '#f9fafb',
        borderRadius: 8,
        fontSize: 13,
        color: '#374151',
      }}
    >
      <strong style={{ fontSize: 15 }}>
        Option B — <code>useSplitCompare()</code> hook
      </strong>
      <pre
        style={{
          marginTop: 12,
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          background: '#f3f4f6',
          padding: 12,
          borderRadius: 6,
        }}
      >
        {`const { leftProps, rightProps, syncRef } = useSplitCompare(baseSpec, {
  left:  { layers: ['districts-fill'] },
  right: { layers: ['districts-line'] },
});

<GeoVisProvider spec={leftProps.spec}>
  <GeoVisCanvas viewId="left" style={{ flex: 1 }} />
  <syncRef.Left />
</GeoVisProvider>
<GeoVisProvider spec={rightProps.spec}>
  <GeoVisCanvas viewId="right" style={{ flex: 1 }} />
  <syncRef.Right />
</GeoVisProvider>`}
      </pre>
      <p style={{ marginTop: 16, lineHeight: 1.6 }}>
        The consumer mounts the providers and controls the layout directly.
        Synchronisation is explicitly declared via <code>syncRef.Left</code> /{' '}
        <code>syncRef.Right</code> — if omitted, the maps do not synchronise. No
        changes to the <code>VisualizationSpec</code> schema are required.
      </p>
      <p style={{ marginTop: 8, lineHeight: 1.6 }}>
        See the full trade-offs table in this story’s documentation.
      </p>
    </div>
  );
};

OptionB_UseSplitCompareHook.parameters = {
  docs: {
    description: {
      story: `
Hook \`useSplitCompare\` that derives filtered specs per panel and exposes
sync components as \`syncRef.Left\` / \`syncRef.Right\`.
Composable and schema-free — the consumer retains full layout control.

**Trade-offs vs Option A (\`views[]\` in spec)**

| Dimension | A — spec-first | B — hook |
|---|---|---|
| Schema coupling | Adds \`views[]\` to schema v1 | No schema change |
| Declarativeness | JSON — data structure | TypeScript — code |
| Serializability | Spec is persistable/transmittable as JSON | Override is ephemeral (code) |
| AI generability | LLM generates \`views[]\` without knowing the package | Requires code generation with the hook API |
| Layout control | Delegated to layout component | Consumer controls 100% (direction, sizes, N panels) |
| Synchronisation | Automatic — cannot be forgotten | Explicit via \`syncRef\` — fragile if omitted |
| Per-panel escape hatch | \`render(view)\` prop | Direct child per panel |
| Testability | Requires render-level test | Hook can be tested in isolation |
| API evolution | Breaking if \`views[]\` schema changes | Change isolated to hook signature |
| Number of panels | Fixed (2 in default layout) | N panels (flexible) |
| Consumer boilerplate | Minimal (spec + \`render\` prop) | Verbose (2 providers + 2 syncRef + refs) |

**When to prefer A:** the multi-panel perspective is part of the data definition — e.g. an invalid-policy
fixture that _must_ always be shown with the correct version alongside; AI-generated or database-persisted
specs; automatic sync is a compliance requirement.

**When to prefer B:** the layout is variable (N panels, column, asymmetric sizes, integration with
an external design system); the hook is composed with conditional per-panel logic; the team wants
to defer the schema decision and iterate before a formal ADR.
      `.trim(),
    },
  },
};
