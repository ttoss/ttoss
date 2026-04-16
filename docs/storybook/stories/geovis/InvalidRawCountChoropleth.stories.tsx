import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { PolicyViolation, VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVis } from '@ttoss/geovis';
import * as React from 'react';

import fixture from '../../../../packages/geovis/src/fixtures/invalid-raw-count-choropleth.json';
import type { LockRef, MapRef } from './_map-story-helpers';
import {
  ChoroplethPainter,
  ColorSwatchLegend,
  MapLabel,
  MapOverlayLegend,
  MapSync,
} from './_map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/InvalidRawCountChoropleth',
  tags: ['autodocs'],
} as Meta;

const spec = fixture as unknown as VisualizationSpec;

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

/**
 * Null component that reads policyViolations from GeoVisContext (via useGeoVis)
 * and lifts them to the parent story via callback.
 * Must be a child of a GeoVisProvider mounted with the same spec.
 * Replaces direct reading of metadata.isPolicyInvalid from the imported JSON.
 */
const PolicyDetector = ({
  onViolations,
}: {
  onViolations: (v: PolicyViolation[]) => void;
}) => {
  const { policyViolations } = useGeoVis();
  React.useEffect(() => {
    if (policyViolations.length > 0) onViolations(policyViolations);
  }, [policyViolations, onViolations]);
  return null;
};

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
export const InvalidRawCountChoropleth: StoryFn = () => {
  const leftMapRef = React.useRef<MapRef['current']>(null);
  const rightMapRef = React.useRef<MapRef['current']>(null);
  const syncLock = React.useRef(false) as LockRef;
  const [violations, setViolations] = React.useState<PolicyViolation[]>([]);

  // Stabilise the callback reference to avoid unnecessary re-renders.
  const handleViolations = React.useCallback((v: PolicyViolation[]) => {
    return setViolations(v);
  }, []);

  const recenter = React.useCallback(() => {
    const { center, zoom } = fixture.view;
    syncLock.current = true;
    for (const map of [leftMapRef.current, rightMapRef.current]) {
      map?.jumpTo({ center: center as [number, number], zoom, animate: false });
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
          <strong>{fixture.title}</strong>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
            {fixture.description}
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

      {/* Banner triggered via policyViolations from GeoVisContext — does not read metadata directly from JSON */}
      <PolicyWarningBanner violations={violations} />

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
          <GeoVisProvider spec={spec}>
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
            {/* PolicyDetector hissa violations para o estado da story pai */}
            <PolicyDetector onViolations={handleViolations} />
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
          <GeoVisProvider spec={spec}>
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
            Invalid field: <code>{fixture.metadata.metricField as string}</code>
            . Correct expression:{' '}
            <code>{fixture.metadata.normalizedExpression as string}</code> (
            {fixture.metadata.normalizedLabel as string}).
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
