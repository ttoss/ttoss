import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  MapClickInfo,
  VisualizationSpec,
} from '@ttoss/geovis';
import * as React from 'react';

import { GeoVisFixtureStory } from './GeoVisFixtureStory';
import { computeBbox } from './helpers/map-story-helpers';

/**
 * Demonstrates the **spec-driven click reaction**: the layer declares
 * `click.onSelect` inline, so `<GeoVisProvider>` invokes it on every click.
 * There is **no** `useGeoVisClick()` consumer anywhere in the tree — the badge
 * above the map is updated purely by the spec callback. The layer also has
 * **no** `activeLegendId`: declaring `click` alone opts it into click tracking.
 */
export default {
  title: 'GeoVis/SpecDrivenClick',
  tags: ['autodocs'],
} as Meta;

const districts: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'centro',
      properties: { name: 'Centro' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-46.65, -23.56],
            [-46.61, -23.56],
            [-46.61, -23.52],
            [-46.65, -23.52],
            [-46.65, -23.56],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'zona-sul',
      properties: { name: 'Zona Sul' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-46.61, -23.56],
            [-46.57, -23.56],
            [-46.57, -23.52],
            [-46.61, -23.52],
            [-46.61, -23.56],
          ],
        ],
      },
    },
  ],
};

const districtNames: Record<string, string> = {
  centro: 'Centro',
  'zona-sul': 'Zona Sul',
};

/**
 * Builds the spec bound to a click callback. The whole click reaction lives in
 * `layer.click.onSelect`; the layer paints itself statically (no legend/mapData)
 * and gains a red outline on selection via `selectedPaint`.
 */
const buildSpec = (
  onSelect: (info: MapClickInfo | null) => void
): VisualizationSpec => {
  return {
    id: 'spec-driven-click',
    title: 'Spec-driven click',
    description:
      'Click a district: the badge is driven entirely by `layer.click.onSelect` ' +
      '— no useGeoVisClick() in the JSX, and the layer has no activeLegendId. ' +
      'Press Escape (or click outside) to clear.',
    engine: 'maplibre',
    basemap: { visible: false },
    sources: [
      {
        id: 'districts',
        type: 'geojson',
        data: districts,
      },
    ],
    layers: [
      {
        id: 'districts-fill',
        sourceId: 'districts',
        geometry: 'polygon',
        paint: {
          fillColor: '#bfdbfe',
          fillOpacity: 0.7,
          lineColor: '#1d4ed8',
          lineWidth: 1,
        },
        // Spec-driven visual feedback on click (companion outline layer).
        selectedPaint: { lineColor: '#dc2626', lineWidth: 3 },
        // The entire click reaction — no component, no hook in the tree.
        click: { onSelect },
      },
    ],
  };
};

const bbox = computeBbox(districts as GeoJSON.FeatureCollection);

/**
 * Default story — click a polygon; the badge reacts through the spec callback.
 */
export const SpecDrivenClick: StoryFn = () => {
  const [selected, setSelected] = React.useState<MapClickInfo | null>(null);
  const spec = React.useMemo(() => {
    return buildSpec(setSelected);
  }, [setSelected]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 6,
          border: '1px solid #d4d4d8',
          background: selected ? '#ecfdf5' : '#f4f4f5',
          fontSize: 14,
          minHeight: 24,
        }}
      >
        {selected ? (
          <span>
            <strong>onSelect fired</strong> —{' '}
            {districtNames[String(selected.featureId)] ??
              `Feature #${String(selected.featureId)}`}{' '}
            (<code>{String(selected.featureId)}</code>) @{' '}
            {selected.lngLat[0].toFixed(4)}, {selected.lngLat[1].toFixed(4)}
          </span>
        ) : (
          <span>
            Click a district — the badge is updated only by{' '}
            <code>layer.click.onSelect</code> (no <code>useGeoVisClick()</code>{' '}
            in the tree).
          </span>
        )}
      </div>
      <GeoVisFixtureStory spec={spec} bbox={bbox} />
    </div>
  );
};
