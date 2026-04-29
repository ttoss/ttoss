import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  MapDataRow,
  PolicyViolation,
  VisualizationSpec,
} from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVis } from '@ttoss/geovis';
import * as React from 'react';

import fixture from '../../../../packages/geovis/src/fixtures/invalid-raw-count-choropleth.json';
import type { LockRef, MapRef } from './_map-story-helpers';
import {
  ColorSwatchLegend,
  FeatureStatePainter,
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
  return `${(v / 1_000_000).toFixed(1)}M inhabitants`;
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

// Hardcoded Rwanda population per province (joined to rwanda-provinces.geojson
// via feature.properties['name:en'] — the source has `name` in kinyarwanda,
// `name:en` in English). Public statistics, snapshot circa 2022.
const populationData: MapDataRow[] = [
  { geometryId: 'Kigali City', value: 1_132_686 },
  { geometryId: 'East Province', value: 2_595_703 },
  { geometryId: 'Western Province', value: 2_471_239 },
  { geometryId: 'Southern Province', value: 2_589_975 },
  { geometryId: 'Northern Province', value: 1_726_370 },
];

// Pre-computed density (population / sq-km) per province. Encoded as a separate
// dataset because feature-state stores a single `value` per source/feature; the
// runtime expression `pop / area` is replaced by a precomputed value here.
const densityData: MapDataRow[] = [
  { geometryId: 'Kigali City', value: 1551 },
  { geometryId: 'East Province', value: 274 },
  { geometryId: 'Western Province', value: 420 },
  { geometryId: 'Southern Province', value: 434 },
  { geometryId: 'Northern Province', value: 527 },
];

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

const StoryHeader = ({ onRecenter }: { onRecenter: () => void }) => {
  return (
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
        onClick={onRecenter}
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
  );
};

const MapPanel = ({
  borderColor,
  label,
  legendLabel,
  defaultColor,
  steps,
  formatValue,
  providerSpec,
  viewId,
  selfRef,
  peerRef,
  lockRef,
  showPolicyDetector,
  onViolations,
}: {
  borderColor: string;
  label: string;
  legendLabel: string;
  defaultColor: string;
  steps: { threshold: number; color: string }[];
  formatValue: (v: number) => string;
  providerSpec: VisualizationSpec;
  viewId: string;
  selfRef: MapRef;
  peerRef: MapRef;
  lockRef: LockRef;
  showPolicyDetector?: boolean;
  onViolations?: (v: PolicyViolation[]) => void;
}) => {
  const canvasStyle: React.CSSProperties = { width: '100%', height: '100%' };

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        border: `2px solid ${borderColor}`,
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <MapLabel>{label}</MapLabel>
      <MapOverlayLegend
        label={legendLabel}
        defaultColor={defaultColor}
        steps={steps}
        formatValue={formatValue}
      />
      <GeoVisProvider spec={providerSpec}>
        <GeoVisCanvas viewId={viewId} style={canvasStyle} />
        <MapSync selfRef={selfRef} peerRef={peerRef} lockRef={lockRef} />
        <FeatureStatePainter
          layerId="rwanda-choropleth"
          defaultColor={defaultColor}
          steps={steps}
        />
        {showPolicyDetector && onViolations ? (
          <PolicyDetector onViolations={onViolations} />
        ) : null}
      </GeoVisProvider>
    </div>
  );
};

const SwatchLegends = () => {
  return (
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
  );
};

const PolicySection = () => {
  return (
    <div>
      <strong>Policy</strong>
      <ul style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>
        <li>
          <code>cartography.warnOnRawCountChoropleth: true</code> — this fixture
          should raise a runtime warning when the policy is enabled.
        </li>
        <li>
          Invalid field: <code>{fixture.metadata.metricField as string}</code>.
          Correct expression:{' '}
          <code>{fixture.metadata.normalizedExpression as string}</code> (
          {fixture.metadata.normalizedLabel as string}).
        </li>
      </ul>
    </div>
  );
};

const ReferencesSection = () => {
  return (
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
  );
};

// Story

/**
 * Intentionally **invalid** fixture — contract artefact for the
 * `cartography.warnOnRawCountChoropleth` policy.
 *
 * Uses official MapLibre Rwanda provinces geometry and a split-compare to
 * expose the issue: Kigali City has the smallest absolute population (1.1M)
 * but the highest density (1,551 hab/km²). On the left map it appears almost
 * white; on the right it is the darkest. Both metrics are supplied via
 * hardcoded `mapData` joined to the source by `feature.properties['name:en']`.
 */
export const InvalidRawCountChoropleth: StoryFn = () => {
  const leftMapRef = React.useRef<MapRef['current']>(null);
  const rightMapRef = React.useRef<MapRef['current']>(null);
  const syncLock = React.useRef(false) as LockRef;
  const [violations, setViolations] = React.useState<PolicyViolation[]>([]);

  // Each side renders the same source through a distinct mapData entry.
  // Cloning the spec keeps the providers independent: feature-state is set
  // per map instance, so the left map carries `population` values and the
  // right map carries `density` values without interfering with each other.
  const leftSpec = React.useMemo<VisualizationSpec>(() => {
    return {
      ...spec,
      layers: spec.layers.map((layer) => {
        return layer.id === 'rwanda-choropleth'
          ? { ...layer, mapDataId: 'pop' }
          : layer;
      }),
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'rwanda-provinces',
          joinKey: 'name:en',
          data: populationData,
        },
      ],
    };
  }, []);

  const rightSpec = React.useMemo<VisualizationSpec>(() => {
    return {
      ...spec,
      layers: spec.layers.map((layer) => {
        return layer.id === 'rwanda-choropleth'
          ? { ...layer, mapDataId: 'density' }
          : layer;
      }),
      mapData: [
        {
          mapDataId: 'density',
          mapId: 'rwanda-provinces',
          joinKey: 'name:en',
          data: densityData,
        },
      ],
    };
  }, []);

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

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <StoryHeader onRecenter={recenter} />

      {/* Banner triggered via policyViolations from GeoVisContext — does not read metadata directly from JSON */}
      <PolicyWarningBanner violations={violations} />

      <div style={{ display: 'flex', gap: 4, height: 460 }}>
        <MapPanel
          borderColor="#f59e0b"
          label="Absolute population count (population) - invalid"
          legendLabel="absolute population"
          defaultColor="#eff6ff"
          steps={rawSteps}
          formatValue={fmtPop}
          providerSpec={leftSpec}
          viewId="left"
          selfRef={leftMapRef}
          peerRef={rightMapRef}
          lockRef={syncLock}
          showPolicyDetector
          onViolations={handleViolations}
        />

        <MapPanel
          borderColor="#16a34a"
          label="Density (population / sq-km) - correct"
          legendLabel="density (people/km²)"
          defaultColor="#f0fdf4"
          steps={densitySteps}
          formatValue={fmtDensity}
          providerSpec={rightSpec}
          viewId="right"
          selfRef={rightMapRef}
          peerRef={leftMapRef}
          lockRef={syncLock}
        />
      </div>

      {/* gap: 4 mirrors the map row layout — each swatch aligns with its corresponding panel */}
      <SwatchLegends />
      <PolicySection />
      <ReferencesSection />
    </div>
  );
};
