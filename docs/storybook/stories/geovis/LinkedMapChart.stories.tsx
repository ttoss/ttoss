import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVis } from '@ttoss/geovis';
import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import * as React from 'react';

import linkedMapChartSpec from '../../../../packages/geovis/src/fixtures/linked-map-chart.json';

export default {
  title: 'GeoVis/Fixtures/LinkedMapChart',
  tags: ['autodocs'],
} as Meta;

type Region = { regionId: string; label: string; value: number };

const REGIONS: Region[] = (
  linkedMapChartSpec.sources[0].data as GeoJSON.FeatureCollection
).features.map((f) => {
  return f.properties as Region;
});

const MAX_VALUE = Math.max(
  ...REGIONS.map((r) => {
    return r.value;
  })
);

const BarChart = ({
  hoveredId,
  onHover,
}: {
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 16,
        background: 'white',
        borderLeft: '1px solid #d4d4d8',
        minWidth: 200,
      }}
    >
      <strong style={{ fontSize: 13 }}>Regions</strong>
      {REGIONS.map((r) => {
        return (
          <div
            key={r.regionId}
            onMouseEnter={() => {
              return onHover(r.regionId);
            }}
            onMouseLeave={() => {
              return onHover(null);
            }}
            style={{
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 4,
              background: hoveredId === r.regionId ? '#dcfce7' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            <div style={{ fontSize: 12, marginBottom: 3 }}>
              {r.label} — <strong>{r.value}</strong>
            </div>
            <div
              style={{
                height: 10,
                borderRadius: 3,
                background: hoveredId === r.regionId ? '#16a34a' : '#22c55e',
                width: `${(r.value / MAX_VALUE) * 100}%`,
                transition: 'background 0.15s',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

const LAYER_ID = 'regions-fill';

const LinkedChart = ({
  hoveredId,
  onHover,
}: {
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) => {
  const { runtime } = useGeoVis();
  const prevHoveredIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!runtime) return;
    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    const onMouseMove = (e: MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [LAYER_ID],
      });
      const regionId =
        (features[0]?.properties?.regionId as string | undefined) ?? null;
      if (regionId !== prevHoveredIdRef.current) {
        prevHoveredIdRef.current = regionId;
        onHover(regionId);
      }
    };

    const onMouseLeave = () => {
      prevHoveredIdRef.current = null;
      onHover(null);
    };

    map.on('mousemove', onMouseMove);
    map.on('mouseleave', onMouseLeave);

    return () => {
      map.off('mousemove', onMouseMove);
      map.off('mouseleave', onMouseLeave);
    };
  }, [runtime, onHover]);

  // Highlight hovered region via applyPatch
  React.useEffect(() => {
    if (!runtime || hoveredId === null) return;
    runtime.applyPatch({
      target: 'layer',
      op: 'replace',
      path: `layer.${LAYER_ID}.paint.fillOpacity`,
      value: hoveredId ? 0.7 : 0.35,
    });
  }, [runtime, hoveredId]);

  return null;
};

export const LinkedMapChart: StoryFn = () => {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const handleHover = React.useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>{linkedMapChartSpec.title}</strong>
        <p>{linkedMapChartSpec.description}</p>
      </div>
      <div
        style={{ display: 'flex', border: '1px solid #d4d4d8', height: 480 }}
      >
        <GeoVisProvider
          spec={linkedMapChartSpec as unknown as VisualizationSpec}
        >
          <GeoVisCanvas viewId="primary" style={{ flex: 1, height: '100%' }} />
          <LinkedChart hoveredId={hoveredId} onHover={handleHover} />
        </GeoVisProvider>
        <BarChart hoveredId={hoveredId} onHover={handleHover} />
      </div>
      <div>
        <strong>Official references</strong>
        <ul>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/get-features-under-the-mouse-pointer/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre — Get features under the mouse pointer
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};
