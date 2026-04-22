import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  PartialVisualizationSpec,
} from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVis } from '@ttoss/geovis';
import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import * as React from 'react';

import linkedMapChartMinimal from '../../../../packages/geovis/src/fixtures/linked-map-chart.minimal.json';
import {
  applyBasemap,
  BASEMAP_ARG_TYPE,
  type BasemapArgs,
  DEFAULT_BASEMAP_ARGS,
} from './_map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/LinkedMapChart',
  tags: ['autodocs'],
  argTypes: BASEMAP_ARG_TYPE,
  args: DEFAULT_BASEMAP_ARGS,
} as Meta<BasemapArgs>;

// Story-level overrides on top of the data-only minimal fixture: only a
// custom layer paint so the hover highlight effect stands out. The camera
// view (center/zoom) is derived from the inline data by `applyDefaults`.
const LAYER_ID = 'regions-fill';
const linkedMapChartSpec: PartialVisualizationSpec = {
  ...(linkedMapChartMinimal as PartialVisualizationSpec),
  layers: [
    {
      id: LAYER_ID,
      dataId: 'regions',
      geometry: 'polygon',
      paint: {
        fillColor: '#22c55e',
        fillOpacity: 0.35,
        lineColor: '#15803d',
      },
    },
  ],
};

type Region = { regionId: string; label: string; value: number };

const REGIONS: Region[] = (
  linkedMapChartSpec.data[0] as { geojson: GeoJSONFeatureCollection }
).geojson.features.map((f) => {
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

export const LinkedMapChart: StoryFn<BasemapArgs> = ({ basemapStyleUrl }) => {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const handleHover = React.useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  const activeSpec = React.useMemo(() => {
    return applyBasemap(linkedMapChartSpec, basemapStyleUrl);
  }, [basemapStyleUrl]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>Linked Map Chart</strong>
        <p>
          Hovering a region on the map highlights it in the bar chart and
          vice-versa.
        </p>
      </div>
      <div
        style={{ display: 'flex', border: '1px solid #d4d4d8', height: 480 }}
      >
        <GeoVisProvider spec={activeSpec}>
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
