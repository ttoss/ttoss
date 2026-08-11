import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  VisualizationSpec,
} from '@ttoss/geovis';
import * as React from 'react';

import { GeoVisFixtureStory } from './GeoVisFixtureStory';
import { computeBbox } from './helpers/map-story-helpers';

/**
 * Visual regression for issue #1129 — **paint order is reconciled to
 * `spec.layers` on every update**, independent of insertion history.
 *
 * The `points` overlay **persists** across both specs (same layer id). Click
 * **"Adicionar fundo (declarado ABAIXO dos pontos)"** to rebuild the spec with
 * a large opaque `states-fill` inserted *before* `points` in `spec.layers`.
 *
 * - **Before the fix:** `map.addLayer` appended the fill to the top of the
 *   stack, so it painted **over** the persisting points — the points vanished.
 * - **After the fix:** the reconciliation pass re-slots every managed layer to
 *   its `spec.layers` position, so `points` (last in the array) stays on top
 *   and remains visible over the new fill.
 *
 * Toggle back and forth rapidly — the points must stay on top every time.
 */
export default {
  title: 'GeoVis/LayerZOrderReconciliation',
  tags: ['autodocs'],
} as Meta;

const states: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'sp',
      properties: { name: 'São Paulo' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-47.2, -24.0],
            [-45.0, -24.0],
            [-45.0, -22.6],
            [-47.2, -22.6],
            [-47.2, -24.0],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'rj',
      properties: { name: 'Rio de Janeiro' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-44.8, -23.4],
            [-43.0, -23.4],
            [-43.0, -22.0],
            [-44.8, -22.0],
            [-44.8, -23.4],
          ],
        ],
      },
    },
  ],
};

const kitchens: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { lng: -46.63, lat: -23.55, name: 'Cozinha Centro' },
    { lng: -46.4, lat: -23.5, name: 'Cozinha Leste' },
    { lng: -43.9, lat: -22.7, name: 'Cozinha RJ' },
  ].map((k, index) => {
    return {
      type: 'Feature',
      id: `k-${index}`,
      properties: { name: k.name },
      geometry: { type: 'Point', coordinates: [k.lng, k.lat] },
    };
  }),
};

/** State outline, present in both specs. */
const statesLineLayer = {
  id: 'states-line',
  sourceId: 'states',
  geometry: 'line' as const,
  paint: { lineColor: '#1f2937', lineWidth: 1.2 },
};

/** The persisting overlay — same id across both specs, always declared last. */
const pointsLayer = {
  id: 'points',
  sourceId: 'kitchens',
  geometry: 'point' as const,
  paint: {
    circleColor: '#e4572e',
    circleRadius: 9,
    circleStrokeColor: '#ffffff',
    circleStrokeWidth: 2,
  },
};

/**
 * A large, nearly opaque fill declared **first** in `spec.layers` (bottom).
 * If paint order followed insertion history, adding this after `points` would
 * bury the points; with the fix it correctly paints beneath them.
 */
const statesFillLayer = {
  id: 'states-fill',
  sourceId: 'states',
  geometry: 'polygon' as const,
  paint: { fillColor: '#2563eb', fillOpacity: 0.95 },
};

const buildSpec = (withBackground: boolean): VisualizationSpec => {
  const layers: VisualizationSpec['layers'] = [];
  if (withBackground) layers.push(statesFillLayer);
  layers.push(statesLineLayer, pointsLayer);

  return {
    title: 'Layer z-order reconciliation (#1129)',
    description: withBackground
      ? 'Fundo "states-fill" declarado ABAIXO dos pontos — os pontos devem permanecer visíveis no topo.'
      : 'Sem fundo. Os pontos persistem ao alternar; adicione o fundo e eles devem continuar no topo.',
    engine: 'maplibre',
    basemap: { visible: false },
    sources: [
      { id: 'states', type: 'geojson', data: states },
      { id: 'kitchens', type: 'geojson', data: kitchens },
    ],
    layers,
  };
};

const bbox = computeBbox(states as GeoJSON.FeatureCollection);

/**
 * Default story — toggle the background on/off; the persisting points overlay
 * must stay on top in both states.
 */
export const LayerZOrderReconciliation: StoryFn = () => {
  const [withBackground, setWithBackground] = React.useState(false);
  const spec = React.useMemo(() => {
    return buildSpec(withBackground);
  }, [withBackground]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <button
        type="button"
        onClick={() => {
          return setWithBackground((prev) => {
            return !prev;
          });
        }}
        style={{
          justifySelf: 'start',
          padding: '6px 12px',
          borderRadius: 6,
          border: '1px solid #d4d4d8',
          background: withBackground ? '#1d4ed8' : '#f4f4f5',
          color: withBackground ? '#ffffff' : '#111827',
          cursor: 'pointer',
        }}
      >
        {withBackground
          ? 'Remover fundo'
          : 'Adicionar fundo (declarado ABAIXO dos pontos)'}
      </button>
      <GeoVisFixtureStory spec={spec} bbox={bbox} />
    </div>
  );
};
