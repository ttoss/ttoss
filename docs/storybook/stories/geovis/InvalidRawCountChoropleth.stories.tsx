import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  PartialVisualizationSpec,
  ViewState,
  VisualizationLayer,
  VisualizationView,
} from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

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
  title: 'GeoVis/Fixtures/InvalidRawCountChoropleth',
  tags: ['autodocs'],
  argTypes: BASEMAP_ARG_TYPE,
  args: DEFAULT_BASEMAP_ARGS,
} as Meta<BasemapArgs>;

// Story-level overrides on top of the data-only minimal fixture: a single
// choropleth layer plus an explicit Rwanda-centred view (the source is a
// remote URL, so `applyDefaults` cannot derive bounds at spec time — the
// adapter will still refine the framing once the source loads).
const rwandaChoroplethLayer: VisualizationLayer = {
  id: 'rwanda-choropleth',
  dataId: 'rwanda-provinces',
  geometry: 'polygon',
  paint: { fillColor: '#dbeafe', fillOpacity: 0.85, lineColor: '#94a3b8' },
};
const RWANDA_VIEW: ViewState = {
  center: [30.0222, -1.9596],
  zoom: 7,
  autoFit: true,
};
const spec: PartialVisualizationSpec = {
  ...(choroplethMinimal as PartialVisualizationSpec),
  view: RWANDA_VIEW,
  layers: [rwandaChoroplethLayer],
  metadata: {
    isPolicyInvalid: true,
    invalidReason: 'raw-count-choropleth',
    metricField: 'population',
    normalizedExpression: 'population / sq-km',
    normalizedLabel: 'inhabitants per km²',
  },
};

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
  return `${v} hab/km²`;
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

// MapLibre expression to calculate density at runtime: population / sq-km.
const densityExpr = ['/', ['get', 'population'], ['get', 'sq-km']] as const;

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
          Cartographic guardrail: absolute count in choropleth
        </strong>
        Rwanda provinces encoded by <strong>absolute population count</strong>{' '}
        (left) vs <strong>density</strong> (hab/km², right). Kigali has only
        1.1M inhabitants — the smallest count — yet is the densest province
        (1,551 hab/km²). On the left map Kigali appears almost white; on the
        right it is the darkest.
        <br />
        <strong>Correct:</strong> divide by area before encoding in colour.
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
  const activeSpec = React.useMemo(() => {
    return applyBasemap(spec, basemapStyleUrl);
  }, [basemapStyleUrl]);
  const leftMapRef = React.useRef<MapRef['current']>(null);
  const rightMapRef = React.useRef<MapRef['current']>(null);
  const syncLock = React.useRef(false) as LockRef;

  const recenter = React.useCallback(() => {
    const { center, zoom } = RWANDA_VIEW;
    syncLock.current = true;
    for (const map of [leftMapRef.current, rightMapRef.current]) {
      map?.jumpTo({ center, zoom, animate: false });
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
            Encoding absolute population counts in colour misleads readers
            because larger areas naturally accumulate more people. Compare
            absolute count (left) with density (right).
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
          <MapLabel>Absolute population count (population) - invalid</MapLabel>
          <MapOverlayLegend
            label="absolute population"
            defaultColor="#eff6ff"
            steps={rawSteps}
            formatValue={fmtPop}
          />
          <GeoVisProvider spec={activeSpec}>
            <GeoVisCanvas viewId="left" style={canvasStyle} />
            <MapSync
              selfRef={leftMapRef}
              peerRef={rightMapRef}
              lockRef={syncLock}
            />
            <ChoroplethPainter
              layerId="rwanda-choropleth"
              field="population"
              defaultColor="#eff6ff"
              steps={rawSteps}
            />
            {/* PolicyDetector lifts violations to parent story state */}
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
          <MapOverlayLegend
            label="density (hab/km²)"
            defaultColor="#f0fdf4"
            steps={densitySteps}
            formatValue={fmtDensity}
          />
          <GeoVisProvider spec={activeSpec}>
            <GeoVisCanvas viewId="right" style={canvasStyle} />
            <MapSync
              selfRef={rightMapRef}
              peerRef={leftMapRef}
              lockRef={syncLock}
            />
            <ChoroplethPainter
              layerId="rwanda-choropleth"
              field={densityExpr}
              defaultColor="#f0fdf4"
              steps={densitySteps}
            />
          </GeoVisProvider>
        </div>
      </div>

      {/* gap: 4 mirrors the map row layout — each swatch aligns with its corresponding panel */}
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
      id: 'rwanda-choropleth',
      dataId: 'rwanda-provinces',
      geometry: 'polygon',
      visible: true,
      paint: {
        fillColor: '#dbeafe',
        fillOpacity: 0.85,
        lineColor: '#94a3b8',
        lineWidth: 0.5,
      },
    },
  ],
  views: [
    {
      id: 'left',
      label: 'Absolute population count (population) \u2014 invalid',
      layers: ['rwanda-choropleth'],
    },
    {
      id: 'right',
      label: 'Population density (hab/km\u00b2) \u2014 correct',
      layers: ['rwanda-choropleth'],
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
          label="density (hab/km\u00b2)"
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
