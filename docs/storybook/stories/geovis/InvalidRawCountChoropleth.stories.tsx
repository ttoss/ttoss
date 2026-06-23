import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  MapDataRow,
  PolicyViolation,
  VisualizationSpec,
} from '@ttoss/geovis';
import {
  GeoVisCanvas,
  GeoVisLegend,
  GeoVisProvider,
  SEQUENTIAL_PALETTES,
  useGeoVis,
} from '@ttoss/geovis';
import * as React from 'react';

import fixture from '../../../../packages/geovis/src/fixtures/invalid-raw-count-choropleth.json';
import { MapOverlayLegend } from './helpers/choropleth-helpers';
import {
  PolicyWarningBanner,
  StoryHeader,
} from './helpers/invalid-raw-count-helpers';
import type { LockRef, MapRef } from './helpers/map-story-helpers';
import {
  FitBoundsToUrlSource,
  MapLabel,
  MapSync,
} from './helpers/map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/InvalidRawCountChoropleth',
  tags: ['autodocs'],
} as Meta;

const RWANDA_SOURCE_URL = fixture.sources[0].data as string;

const fmtPop = (v: number) => {
  return `${(v / 1_000_000).toFixed(1)}M inhabitants`;
};
const fmtDensity = (v: number) => {
  return `${v} hab/km²`;
};

const populationData: MapDataRow[] = [
  { geometryId: 'Kigali City', value: 1_132_686 },
  { geometryId: 'East Province', value: 2_595_703 },
  { geometryId: 'Western Province', value: 2_471_239 },
  { geometryId: 'Southern Province', value: 2_589_975 },
  { geometryId: 'Northern Province', value: 1_726_370 },
];

const densityData: MapDataRow[] = [
  { geometryId: 'Kigali City', value: 1551 },
  { geometryId: 'East Province', value: 274 },
  { geometryId: 'Western Province', value: 420 },
  { geometryId: 'Southern Province', value: 434 },
  { geometryId: 'Northern Province', value: 527 },
  { geometryId: 'North-West Province', value: 680 },
];

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

const buildChoroplethSpec = ({
  mapDataId,
  data,
  legendId,
  title,
  legendColorBy,
  legendReference,
}: {
  mapDataId: string;
  data: MapDataRow[];
  legendId: string;
  title: string;
  legendColorBy?: VisualizationSpec['legends'] extends (infer U)[]
    ? U extends { colorBy: infer C }
      ? C
      : never
    : never;
}): VisualizationSpec => {
  return {
    id: `invalid-raw-count-${mapDataId}`,
    engine: 'maplibre',
    mapType: 'choropleth',
    basemap: fixture.basemap,
    sources: [
      {
        id: 'rwanda-provinces',
        type: 'geojson',
        data: RWANDA_SOURCE_URL,
      },
    ],
    layers: [],
    legends: [
      {
        id: legendId,
        title,
        ...(legendColorBy ? { colorBy: legendColorBy } : {}),
        ...(legendReference ? { reference: legendReference } : {}),
      },
    ],
    mapData: [
      {
        mapDataId,
        mapId: 'rwanda-provinces',
        joinKey: 'name:en',
        data,
      },
    ],
  };
};

const leftSpec = buildChoroplethSpec({
  mapDataId: 'pop',
  data: populationData,
  legendId: 'pop-legend',
  title: 'Population (raw count) — invalid',
});

const rightSpec = buildChoroplethSpec({
  mapDataId: 'density',
  data: densityData,
  legendId: 'density-legend',
  title: 'Density (hab/km²) — correct',
  legendColorBy: {
    type: 'quantitative',
    colors: [...SEQUENTIAL_PALETTES.green],
  },
  legendReference:
    '{link:MapLibre — Visualize population density (normalized)|https://maplibre.org/maplibre-gl-js/docs/examples/visualize-population-density/}',
});

/** Extracts color steps from the resolved spec's legend for the gradient overlay. */
const useOverlaySteps = (
  legendId: string
): { defaultColor: string; steps: { threshold: number; color: string }[] } => {
  const { spec } = useGeoVis();
  const legend = spec.legends?.find((l) => {
    return l.id === legendId;
  });
  const colorBy = legend?.colorBy;
  if (
    colorBy?.type === 'quantitative' &&
    colorBy.thresholds &&
    colorBy.colors
  ) {
    return {
      defaultColor: colorBy.defaultColor ?? '#f0f0f0',
      steps: colorBy.thresholds.map((t, i) => {
        return {
          threshold: t,
          color: colorBy.colors![i + 1] ?? colorBy.colors![i] ?? '#999',
        };
      }),
    };
  }
  return { defaultColor: '#f0f0f0', steps: [] };
};

/** Inner panel that reads resolved spec from context for the overlay legend. */
const MapOverlayPanel = ({
  borderColor,
  label,
  overlayLabel,
  overlayLegendId,
  overlayFormatValue,
  viewId,
  selfRef,
  peerRef,
  lockRef,
  showPolicyDetector,
  onViolations,
}: {
  borderColor: string;
  label: string;
  overlayLabel: string;
  overlayLegendId: string;
  overlayFormatValue: (v: number) => string;
  viewId: string;
  selfRef: MapRef;
  peerRef: MapRef;
  lockRef: LockRef;
  showPolicyDetector?: boolean;
  onViolations?: (v: PolicyViolation[]) => void;
}) => {
  const overlaySteps = useOverlaySteps(overlayLegendId);
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
      {overlaySteps.steps.length > 0 ? (
        <MapOverlayLegend
          label={overlayLabel}
          defaultColor={overlaySteps.defaultColor}
          steps={overlaySteps.steps}
          formatValue={overlayFormatValue}
        />
      ) : null}
      <GeoVisCanvas viewId={viewId} style={canvasStyle} />
      <FitBoundsToUrlSource url={RWANDA_SOURCE_URL} />
      <MapSync selfRef={selfRef} peerRef={peerRef} lockRef={lockRef} />
      {showPolicyDetector && onViolations ? (
        <PolicyDetector onViolations={onViolations} />
      ) : null}
    </div>
  );
};

const MapPanel = ({
  borderColor,
  label,
  overlayLabel,
  overlayLegendId,
  overlayFormatValue,
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
  overlayLabel: string;
  overlayLegendId: string;
  overlayFormatValue: (v: number) => string;
  providerSpec: VisualizationSpec;
  viewId: string;
  selfRef: MapRef;
  peerRef: MapRef;
  lockRef: LockRef;
  showPolicyDetector?: boolean;
  onViolations?: (v: PolicyViolation[]) => void;
}) => {
  return (
    <GeoVisProvider spec={providerSpec}>
      <MapOverlayPanel
        borderColor={borderColor}
        label={label}
        overlayLabel={overlayLabel}
        overlayLegendId={overlayLegendId}
        overlayFormatValue={overlayFormatValue}
        viewId={viewId}
        selfRef={selfRef}
        peerRef={peerRef}
        lockRef={lockRef}
        showPolicyDetector={showPolicyDetector}
        onViolations={onViolations}
      />
    </GeoVisProvider>
  );
};

export const InvalidRawCountChoropleth: StoryFn = () => {
  const leftMapRef = React.useRef<MapRef['current']>(null);
  const rightMapRef = React.useRef<MapRef['current']>(null);
  const syncLock = React.useRef(false) as LockRef;
  const [violations, setViolations] = React.useState<PolicyViolation[]>([]);

  const handleViolations = React.useCallback((v: PolicyViolation[]) => {
    return setViolations(v);
  }, []);

  const recenter = React.useCallback(() => {
    const rwandaBbox: [[number, number], [number, number]] = [
      [28.85, -2.84],
      [30.9, -1.05],
    ];
    syncLock.current = true;
    for (const map of [leftMapRef.current, rightMapRef.current]) {
      map?.fitBounds(rwandaBbox, { animate: false });
    }
    syncLock.current = false;
  }, []);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <StoryHeader
        title={fixture.title}
        description={fixture.description}
        onRecenter={recenter}
      />
      <PolicyWarningBanner violations={violations} />

      <div style={{ display: 'flex', gap: 4, height: 460 }}>
        <MapPanel
          borderColor="#f59e0b"
          label="Absolute population count (population) - invalid"
          overlayLabel="absolute population"
          overlayLegendId="pop-legend"
          overlayFormatValue={fmtPop}
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
          overlayLabel="density (people/km²)"
          overlayLegendId="density-legend"
          overlayFormatValue={fmtDensity}
          providerSpec={rightSpec}
          viewId="right"
          selfRef={rightMapRef}
          peerRef={leftMapRef}
          lockRef={syncLock}
        />
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ flex: 1 }}>
          <GeoVisProvider spec={leftSpec}>
            <GeoVisLegend legendId="pop-legend" formatValue={fmtPop} />
          </GeoVisProvider>
        </div>
        <div style={{ flex: 1 }}>
          <GeoVisProvider spec={rightSpec}>
            <GeoVisLegend legendId="density-legend" formatValue={fmtDensity} />
          </GeoVisProvider>
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
    </div>
  );
};
