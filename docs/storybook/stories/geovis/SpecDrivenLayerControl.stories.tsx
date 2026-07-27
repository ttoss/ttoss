import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  VisualizationSpec,
} from '@ttoss/geovis';
import * as React from 'react';

import { GeoVisFixtureStory } from './GeoVisFixtureStory';
import { computeBbox } from './helpers/map-story-helpers';

/**
 * Demonstrates the **spec-driven layer control**: declaring `spec.control`
 * makes `<GeoVisProvider>` auto-mount a floating toggle panel in the map
 * corner — there is no `<GeoVisLayerControl>` in the JSX. Hover the "Camadas"
 * button (bottom-left) to reveal one toggle per layer group.
 *
 * The `mode` buttons above the map rebuild the spec from scratch (as a real app
 * would when switching visualizations). Two things to notice:
 *
 * 1. **Persistence** — hide "Localização das cozinhas", then switch mode. The
 *    kitchens stay hidden even though the underlying layer id changes between
 *    modes (`kitchens-pts` → `kitchens-bubbles`), because the control remembers
 *    the choice by `item.id`.
 * 2. **Auto-disable** — the "Coroplético" mode has no kitchen layer at all, so
 *    the "Localização das cozinhas" button renders greyed and non-interactive,
 *    while "Linhas dos estados" keeps working.
 */
export default {
  title: 'GeoVis/SpecDrivenLayerControl',
  tags: ['autodocs'],
} as Meta;

type Mode = 'pontos' | 'circulos' | 'coropletico';

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

/** The single control, reused verbatim across every mode (the 1b pattern). */
const control: NonNullable<VisualizationSpec['control']> = {
  id: 'layers',
  label: 'Camadas',
  position: 'bottom-left',
  trigger: 'hover',
  items: [
    {
      id: 'kitchens',
      label: 'Localização das cozinhas',
      // Both mode-specific ids; only the one present in the active mode is
      // toggled. In 'coropletico' neither exists → the item auto-disables.
      layers: ['kitchens-pts', 'kitchens-bubbles'],
    },
    {
      id: 'states',
      label: 'Linhas dos estados',
      layers: ['states-line'],
    },
  ],
};

const statesLineLayer = {
  id: 'states-line',
  sourceId: 'states',
  geometry: 'line' as const,
  paint: { lineColor: '#1f2937', lineWidth: 1.2 },
};

const buildSpec = (mode: Mode): VisualizationSpec => {
  const layers: VisualizationSpec['layers'] = [];

  if (mode === 'coropletico') {
    layers.push({
      id: 'states-fill',
      sourceId: 'states',
      geometry: 'polygon',
      paint: { fillColor: '#93c5fd', fillOpacity: 0.6 },
    });
  }
  layers.push(statesLineLayer);
  if (mode === 'pontos') {
    layers.push({
      id: 'kitchens-pts',
      sourceId: 'kitchens',
      geometry: 'point',
      paint: {
        circleColor: '#e4572e',
        circleRadius: 6,
        circleStrokeColor: '#ffffff',
        circleStrokeWidth: 1.5,
      },
    });
  }
  if (mode === 'circulos') {
    layers.push({
      id: 'kitchens-bubbles',
      sourceId: 'kitchens',
      geometry: 'point',
      paint: {
        circleColor: '#e4572e',
        circleRadius: 16,
        circleOpacity: 0.5,
        circleStrokeColor: '#ffffff',
        circleStrokeWidth: 1,
      },
    });
  }

  return {
    title: 'Spec-driven layer control',
    description:
      'Hover "Camadas" (bottom-left) to toggle layer groups. Hide the kitchens, ' +
      'then switch mode — the choice persists. In "Coroplético" the kitchens ' +
      'item is disabled (no kitchen layer in that mode).',
    engine: 'maplibre',
    basemap: { visible: false },
    sources: [
      { id: 'states', type: 'geojson', data: states },
      { id: 'kitchens', type: 'geojson', data: kitchens },
    ],
    layers,
    control,
  };
};

const bbox = computeBbox(states as GeoJSON.FeatureCollection);

const MODES: { id: Mode; label: string }[] = [
  { id: 'pontos', label: 'Pontos' },
  { id: 'circulos', label: 'Círculos' },
  { id: 'coropletico', label: 'Coroplético' },
];

/**
 * Default story — switch modes with the buttons; toggle layers via the
 * bottom-left "Camadas" panel.
 */
export const SpecDrivenLayerControl: StoryFn = () => {
  const [mode, setMode] = React.useState<Mode>('pontos');
  const spec = React.useMemo(() => {
    return buildSpec(mode);
  }, [mode]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {MODES.map((m) => {
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                return setMode(m.id);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #d4d4d8',
                background: mode === m.id ? '#1d4ed8' : '#f4f4f5',
                color: mode === m.id ? '#ffffff' : '#111827',
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <GeoVisFixtureStory spec={spec} bbox={bbox} />
    </div>
  );
};
