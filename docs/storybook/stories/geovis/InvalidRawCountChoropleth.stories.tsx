import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  PartialVisualizationSpec,
  ViewState,
  VisualizationLayer,
  VisualizationSpec,
  VisualizationView,
} from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisLegend, GeoVisProvider } from '@ttoss/geovis';

// Policy violation type defined locally — not part of @ttoss/geovis public API.
interface PolicyViolation {
  reason: string;
  message: string;
}
import * as React from 'react';

import choroplethMinimal from '../../../../packages/geovis/src/fixtures/invalid-raw-count-choropleth.minimal.json';
import {
  applyBasemap,
  BASEMAP_ARG_TYPE,
  type BasemapArgs,
  ColorSwatchLegend,
  DEFAULT_AUTO_COLORS,
  DEFAULT_BASEMAP_ARGS,
  GeoVisSplitLayout,
  type LockRef,
  MapLabel,
  type MapRef,
  MapSync,
} from './_map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/InvalidRawCountChoropleth',
  tags: ['autodocs'],
  argTypes: BASEMAP_ARG_TYPE,
  args: DEFAULT_BASEMAP_ARGS,
} as Meta<BasemapArgs>;

// Green sequential ramp for the density panel. Declared once and fed into
// `layer.colors` so the adapter, `<GeoVisLegend>`, and the summary
// `<ColorSwatchLegend>` all share the same palette.
const DENSITY_COLORS = ['#f0fdf4', '#86efac', '#4ade80', '#16a34a', '#14532d'];

// Story-level overrides on top of the data-only minimal fixture: a single
// choropleth layer plus an explicit Rwanda-centred view (the source is a
// remote URL, so `applyDefaults` cannot derive bounds at spec time — the
// adapter will still refine the framing once the source loads).
//
// The layer declares `expression` to specify which property/metric to color
// by. `applyDefaults` auto-generates `colorBy` and `legends` from the layer.
const rwandaPopulationLayer: VisualizationLayer = {
  id: 'rwanda-choropleth',
  dataId: 'rwanda-provinces',
  geometry: 'polygon',
  paint: {
    fillColor: DEFAULT_AUTO_COLORS[0],
    fillOpacity: 0.85,
    lineColor: '#94a3b8',
  },
  title: 'absolute population (auto quantile)',
  expression: ['get', 'population'],
};

// Density layer: same data, derived metric via `expression`. The adapter
// passes the expression verbatim into the MapLibre `step` paint and
// `<GeoVisLegend>` evaluates it JS-side to compute thresholds.
const rwandaDensityLayer: VisualizationLayer = {
  id: 'rwanda-choropleth',
  dataId: 'rwanda-provinces',
  geometry: 'polygon',
  paint: {
    fillColor: DENSITY_COLORS[0],
    fillOpacity: 0.85,
    lineColor: '#94a3b8',
  },
  title: 'density (hab/km²)',
  expression: ['/', ['get', 'population'], ['get', 'sq-km']],
  colors: DENSITY_COLORS,
};
const RWANDA_VIEW: ViewState = {
  center: [30.0222, -1.9596],
  zoom: 7,
  autoFit: true,
};
const populationSpec: PartialVisualizationSpec = {
  ...(choroplethMinimal as PartialVisualizationSpec),
  view: RWANDA_VIEW,
  layers: [rwandaPopulationLayer],
  metadata: {
    isPolicyInvalid: true,
    invalidReason: 'raw-count-choropleth',
    metricField: 'population',
    normalizedExpression: 'population / sq-km',
    normalizedLabel: 'inhabitants per km²',
  },
};
const densitySpec: PartialVisualizationSpec = {
  ...(choroplethMinimal as PartialVisualizationSpec),
  view: RWANDA_VIEW,
  layers: [rwandaDensityLayer],
};
// Backwards-compatibility alias used by other stories in this file.
const spec = populationSpec;

// External policy check — reads spec.metadata directly, no lib dependency.
const specViolations: PolicyViolation[] = spec.metadata?.isPolicyInvalid
  ? [
      {
        reason:
          typeof spec.metadata.invalidReason === 'string'
            ? spec.metadata.invalidReason
            : 'policy-invalid',
        message: `Field "${spec.metadata.metricField ?? 'unknown'}" violates cartography policy. Normalize by: ${spec.metadata.normalizedExpression ?? 'n/a'}.`,
      },
    ]
  : [];

const fmtPop = (v: number) => {
  return `${(v / 1_000_000).toFixed(1)}M hab.`;
};
const fmtDensity = (v: number) => {
  return `${Math.round(v)} hab/km²`;
};

// Reference steps for the bottom ColorSwatchLegend summary.
// Rwanda data (official MapLibre dataset):
//   Population: Kigali=1.1M (smallest), East/South/West≈2.5-2.6M (largest).
//   Density:    East=274, West=420, South=434, North=527, Kigali=1551 hab/km².
// Thresholds match the quantile breaks `applyDefaults` auto-computes from
// these five provinces — keeping them here makes the summary legend static
// and independent of network / load timing.
// rawSteps references DEFAULT_AUTO_COLORS (Blues 5) — the same palette
// applyDefaults uses when a layer has no explicit `colors`. Thresholds
// are Rwanda-specific quantile approximations for documentation only.
const rawSteps = [
  { threshold: 1_300_000, color: DEFAULT_AUTO_COLORS[1] },
  { threshold: 1_700_000, color: DEFAULT_AUTO_COLORS[2] },
  { threshold: 2_300_000, color: DEFAULT_AUTO_COLORS[3] },
  { threshold: 2_500_000, color: DEFAULT_AUTO_COLORS[4] },
];
const densitySteps = [
  { threshold: 350, color: DENSITY_COLORS[1] },
  { threshold: 430, color: DENSITY_COLORS[2] },
  { threshold: 530, color: DENSITY_COLORS[3] },
  { threshold: 1300, color: DENSITY_COLORS[4] },
];

// Density thresholds are auto-computed at runtime (quantile breaks).
// The green palette is defined by `DENSITY_COLORS` and fed into
// `colorBy.colors` — the `<GeoVisLegend>` on each panel shows the
// actual runtime thresholds using those colours.

const PolicyWarningBanner = ({
  violations,
}: {
  violations: PolicyViolation[];
}) => {
  if (violations.length === 0) return null;
  return (
    <div
      role="alert"
      style={{
        background: '#fffbeb',
        border: '1px solid #f59e0b',
        borderLeft: '4px solid #d97706',
        borderRadius: 6,
        padding: '12px 16px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
      <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>
        <strong style={{ display: 'block', marginBottom: 4 }}>
          Cartographic guardrail: raw count in choropleth
        </strong>
        The left map encodes <strong>absolute population count</strong> via
        auto-computed quantile breaks — Kigali (1.1M) appears mid-range because
        it falls in the 2nd quantile. The right map encodes{' '}
        <strong>population density</strong> (hab/km²), revealing Kigali as the
        darkest province despite the smallest total count.
        <br />
        <strong>Key lesson:</strong> a visually plausible choropleth can still
        mislead. Always normalise by area when encoding population in colour.
        {violations.map((v) => {
          return (
            <span
              key={v.reason}
              style={{
                display: 'block',
                marginTop: 4,
                fontFamily: 'monospace',
                fontSize: 11,
              }}
            >
              [{v.reason}]
            </span>
          );
        })}
      </div>
    </div>
  );
};

// Story

/**
 * Intentionally **invalid** fixture — contract artefact for the
 * `cartography.warnOnRawCountChoropleth` policy.
 *
 * Uses official MapLibre data (Rwanda provinces) and a split-compare to
 * expose the issue: Kigali City has the smallest absolute population (1.1M)
 * but the highest density (1,551 hab/km²). On the left map it appears almost
 * white; on the right it is the darkest. Density is calculated at runtime via
 * the MapLibre expression `['/', ['get', 'population'], ['get', 'sq-km']]`.
 */
export const InvalidRawCountChoropleth: StoryFn<BasemapArgs> = ({
  basemapStyleUrl,
}) => {
  const activePopulationSpec = React.useMemo(() => {
    return applyBasemap(populationSpec, basemapStyleUrl);
  }, [basemapStyleUrl]);
  const activeDensitySpec = React.useMemo(() => {
    return applyBasemap(densitySpec, basemapStyleUrl);
  }, [basemapStyleUrl]);
  const leftMapRef = React.useRef<MapRef['current']>(null);
  const rightMapRef = React.useRef<MapRef['current']>(null);
  const syncLock = React.useRef(false) as LockRef;

  const recenter = React.useCallback(() => {
    const { center, zoom } = RWANDA_VIEW;
    syncLock.current = true;
    for (const map of [leftMapRef.current, rightMapRef.current]) {
      map?.jumpTo({ center, zoom });
    }
    syncLock.current = false;
  }, []);

  const canvasStyle: React.CSSProperties = { width: '100%', height: '100%' };

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
          <strong>Invalid Raw Count Choropleth (Rwanda Provinces)</strong>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
            Absolute population count encoded with auto-computed quantile breaks
            (left) vs population density hab/km² with explicit steps (right).
            Both look plausible — only density is cartographically correct.
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
          Recenter
        </button>
      </div>

      {/* Banner reads spec.metadata directly — no lib dependency */}
      <PolicyWarningBanner violations={specViolations} />

      <div style={{ display: 'flex', gap: 4, height: 460 }}>
        <div
          style={{
            position: 'relative',
            flex: 1,
            border: '2px solid #f59e0b',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <MapLabel>
            Absolute population count (auto quantile) — invalid
          </MapLabel>
          <GeoVisProvider spec={activePopulationSpec}>
            <GeoVisCanvas viewId="left" style={canvasStyle} />
            <MapSync
              selfRef={leftMapRef}
              peerRef={rightMapRef}
              lockRef={syncLock}
            />
            {/* colorBy auto-generated from layer.expression by applyDefaults */}
            <div
              style={{
                position: 'absolute',
                top: 40,
                left: 8,
                zIndex: 1,
              }}
            >
              <GeoVisLegend
                legendId="rwanda-choropleth-legend"
                formatValue={fmtPop}
              />
            </div>
          </GeoVisProvider>
        </div>

        <div
          style={{
            position: 'relative',
            flex: 1,
            border: '2px solid #16a34a',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <MapLabel>Density (population / sq-km) - correct</MapLabel>
          <GeoVisProvider spec={activeDensitySpec}>
            <GeoVisCanvas viewId="right" style={canvasStyle} />
            <MapSync
              selfRef={rightMapRef}
              peerRef={leftMapRef}
              lockRef={syncLock}
            />
            {/* colorBy.expression auto-applies the density paint via the adapter */}
            <div
              style={{
                position: 'absolute',
                top: 40,
                left: 8,
                zIndex: 1,
              }}
            >
              <GeoVisLegend
                legendId="rwanda-choropleth-legend"
                formatValue={fmtDensity}
              />
            </div>
          </GeoVisProvider>
        </div>
      </div>

      {/* gap: 4 mirrors the map row layout — each swatch aligns with its corresponding panel */}
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ flex: 1 }}>
          <ColorSwatchLegend
            title="Blue — absolute count (auto quantile, invalid)"
            defaultColor={DEFAULT_AUTO_COLORS[0]}
            steps={rawSteps}
            formatValue={fmtPop}
          />
        </div>
        <div style={{ flex: 1 }}>
          <ColorSwatchLegend
            title="Green — density hab/km² (auto quantile, correct)"
            defaultColor={DENSITY_COLORS[0]}
            steps={densitySteps}
            formatValue={fmtDensity}
          />
        </div>
      </div>

      <div>
        <strong>Policy</strong>
        <ul style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>
          <li>
            <code>cartography.warnOnRawCountChoropleth: true</code> — this
            fixture should raise a runtime warning when the policy is enabled.
          </li>
          <li>
            Invalid field: <code>population</code>. Correct expression:{' '}
            <code>population / sq-km</code> (population density in hab/km²).
          </li>
        </ul>
      </div>

      <div>
        <strong>Official references</strong>
        <ul style={{ fontSize: 13 }}>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/visualize-population-density/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre — Visualize population density (normalized)
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

const RWANDA_PROVINCES_INLINE: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'kigali',
      properties: { name: 'Kigali City', population: 1_132_686, 'sq-km': 730 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [29.85, -1.8],
            [30.15, -1.8],
            [30.15, -2.05],
            [29.85, -2.05],
            [29.85, -1.8],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'east',
      properties: {
        name: 'Eastern Province',
        population: 2_553_154,
        'sq-km': 21341,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [30.15, -0.95],
            [31.0, -0.95],
            [31.0, -2.5],
            [30.15, -2.5],
            [30.15, -0.95],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'south',
      properties: {
        name: 'Southern Province',
        population: 2_551_026,
        'sq-km': 14837,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [29.3, -2.05],
            [30.15, -2.05],
            [30.15, -3.0],
            [29.3, -3.0],
            [29.3, -2.05],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'north',
      properties: {
        name: 'Northern Province',
        population: 2_330_213,
        'sq-km': 8507,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [29.3, -0.95],
            [30.15, -0.95],
            [30.15, -1.8],
            [29.3, -1.8],
            [29.3, -0.95],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'west',
      properties: {
        name: 'Western Province',
        population: 2_534_854,
        'sq-km': 19428,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [28.8, -0.95],
            [29.3, -0.95],
            [29.3, -3.0],
            [28.8, -3.0],
            [28.8, -0.95],
          ],
        ],
      },
    },
  ],
};

/**
 * Self-contained spec — all data is inline, no fixture JSON import.
 *
 * Key fields to replicate this pattern:
 * - `data[0].kind: 'geojson-inline'` — embed the GeoJSON directly
 * - `views[]` — enables `GeoVisSplitLayout` (no `MapRef`/`MapSync` needed)
 * - `metadata.isPolicyInvalid: true` — marks this as a policy contract artefact
 */
const minimalChoroplethSpec: VisualizationSpec = {
  id: 'minimal-choropleth-split-compare',
  engine: 'maplibre',
  view: { center: [30.0, -1.95], zoom: 7 },
  data: [
    {
      id: 'rwanda-provinces',
      kind: 'geojson-inline',
      geojson: RWANDA_PROVINCES_INLINE,
    },
  ],
  layers: [
    {
      id: 'rwanda-population',
      dataId: 'rwanda-provinces',
      geometry: 'polygon',
      visible: true,
      paint: {
        fillColor: '#eff6ff',
        fillOpacity: 0.85,
        lineColor: '#94a3b8',
        lineWidth: 0.5,
      },
      title: 'absolute population',
      expression: ['get', 'population'],
    },
    {
      id: 'rwanda-density',
      dataId: 'rwanda-provinces',
      geometry: 'polygon',
      visible: true,
      paint: {
        fillColor: DENSITY_COLORS[0],
        fillOpacity: 0.85,
        lineColor: '#94a3b8',
        lineWidth: 0.5,
      },
      title: 'density (hab/km²)',
      expression: ['/', ['get', 'population'], ['get', 'sq-km']],
      colors: DENSITY_COLORS,
    },
  ],
  views: [
    {
      id: 'left',
      label: 'Absolute population count (population) \u2014 invalid',
      layers: ['rwanda-population'],
    },
    {
      id: 'right',
      label: 'Population density (hab/km\u00b2) \u2014 correct',
      layers: ['rwanda-density'],
    },
  ],
  metadata: {
    isPolicyInvalid: true,
    metricField: 'population',
    normalizedExpression: 'population / sq-km',
    normalizedLabel: 'inhabitants per km\u00b2',
  },
};

/**
 * Same split-compare choropleth as `InvalidRawCountChoropleth` but with the
 * entire spec — including GeoJSON data — defined inline in TypeScript.
 * No fixture JSON file is imported.
 *
 * Uses rectangular bounding boxes for the five Rwanda provinces. The shapes
 * are simplified but all `population` and `sq-km` values are accurate, so
 * the `cartography.warnOnRawCountChoropleth` policy violation is genuine.
 *
 * **Copy-paste recipe**: `RWANDA_PROVINCES_INLINE` + `minimalChoroplethSpec`
 * are the only artefacts needed to replicate this visualisation.
 */
export const MinimalChoroplethSplitCompare: StoryFn<BasemapArgs> = ({
  basemapStyleUrl,
}) => {
  const activeSpec = React.useMemo(() => {
    return applyBasemap(minimalChoroplethSpec, basemapStyleUrl);
  }, [basemapStyleUrl]);

  const renderView = (view: VisualizationView) => {
    if (view.id === 'left') {
      return (
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 8,
            zIndex: 1,
          }}
        >
          <GeoVisLegend
            legendId="rwanda-population-legend"
            formatValue={fmtPop}
          />
        </div>
      );
    }
    return (
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 8,
          zIndex: 1,
        }}
      >
        <GeoVisLegend
          legendId="rwanda-density-legend"
          formatValue={fmtDensity}
        />
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>Minimal choropleth split-compare — spec defined in code</strong>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          Inline GeoJSON with rectangular province boundaries. Same
          population/density data as the fixture story — no JSON file import.
        </p>
      </div>
      <GeoVisSplitLayout
        spec={activeSpec}
        height={460}
        leftBorder="2px solid #f59e0b"
        rightBorder="2px solid #16a34a"
        render={renderView}
      />
    </div>
  );
};
