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
 * corner — there is no `<GeoVisLayerControl>` in the JSX. Click the "Camadas"
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
 * 3. **"Ver mais"** — `control.maxVisibleItems: 3` keeps the panel to the first
 *    three items plus a "Ver mais" card counting the rest. Clicking it opens a
 *    larger panel with every item, which stays open until closed (✕, `Escape`
 *    or a click on the map). Turn on a layer in it
 *    and close it: the "Ver mais" card badges how many hidden items are on.
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

// Inline SVG previews (data URIs) so each item shows a distinct, spec-provided
// thumbnail without a network fetch: dots for the kitchen points, an outline
// for the state lines.
const KITCHENS_THUMB =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='rgb(234,238,227)'/><circle cx='20' cy='24' r='6' fill='rgb(217,72,60)'/><circle cx='42' cy='36' r='6' fill='rgb(217,72,60)'/><circle cx='28' cy='48' r='6' fill='rgb(217,72,60)'/></svg>";
const STATES_THUMB =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='rgb(234,238,227)'/><path d='M8 12 L40 8 L56 28 L44 52 L14 48 Z' fill='none' stroke='rgb(31,41,55)' stroke-width='3'/></svg>";

/**
 * Extra point layers present in every mode — enough items to overflow
 * `maxVisibleItems` and exercise the "Ver mais" panel. Each gets its own
 * colour, used both for its dots and for its thumbnail.
 */
const EXTRA_OVERLAYS = [
  { id: 'hospitals', label: 'Hospitais', color: 'rgb(220,38,38)' },
  { id: 'schools', label: 'Escolas', color: 'rgb(37,99,235)' },
  { id: 'parks', label: 'Parques', color: 'rgb(22,163,74)' },
  { id: 'metro', label: 'Estações de metrô', color: 'rgb(147,51,234)' },
  { id: 'libraries', label: 'Bibliotecas', color: 'rgb(202,138,4)' },
  { id: 'markets', label: 'Feiras livres', color: 'rgb(234,88,12)' },
  { id: 'sports', label: 'Centros esportivos', color: 'rgb(8,145,178)' },
  { id: 'museums', label: 'Museus', color: 'rgb(190,24,93)' },
];

// A few scattered points per overlay, spread across both states and offset by
// the overlay's index so the layers do not sit exactly on top of each other.
const extraPoints = (index: number): GeoJSONFeatureCollection => {
  const base: [number, number][] = [
    [-46.9, -23.3],
    [-45.6, -23.1],
    [-44.4, -22.5],
    [-43.4, -22.9],
  ];
  return {
    type: 'FeatureCollection',
    features: base.map(([lng, lat], pointIndex) => {
      return {
        type: 'Feature',
        id: `${index}-${pointIndex}`,
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [lng + index * 0.12, lat - index * 0.08],
        },
      };
    }),
  };
};

const dotsThumb = (color: string) => {
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='rgb(234,238,227)'/><circle cx='18' cy='20' r='6' fill='${color}'/><circle cx='44' cy='28' r='6' fill='${color}'/><circle cx='26' cy='46' r='6' fill='${color}'/></svg>`;
};

const extraSources: VisualizationSpec['sources'] = EXTRA_OVERLAYS.map(
  (overlay, index) => {
    return {
      id: overlay.id,
      type: 'geojson' as const,
      data: extraPoints(index),
    };
  }
);

const extraLayers: VisualizationSpec['layers'] = EXTRA_OVERLAYS.map(
  (overlay) => {
    return {
      id: `${overlay.id}-pts`,
      sourceId: overlay.id,
      geometry: 'point' as const,
      paint: {
        circleColor: overlay.color,
        circleRadius: 5,
        circleStrokeColor: '#ffffff',
        circleStrokeWidth: 1,
      },
    };
  }
);

/** The single control, reused verbatim across every mode (the 1b pattern). */
const control: NonNullable<VisualizationSpec['control']> = {
  id: 'layers',
  label: 'Camadas',
  position: 'bottom-left',
  trigger: 'click',
  // Ten items: the panel shows the first three plus a "Ver mais" card (+7).
  maxVisibleItems: 3,
  items: [
    {
      id: 'kitchens',
      label: 'Localização das cozinhas',
      thumbnail: KITCHENS_THUMB,
      // Both mode-specific ids; only the one present in the active mode is
      // toggled. In 'coropletico' neither exists → the item auto-disables.
      layers: ['kitchens-pts', 'kitchens-bubbles'],
    },
    {
      id: 'states',
      label: 'Linhas dos estados',
      thumbnail: STATES_THUMB,
      layers: ['states-line'],
    },
    ...EXTRA_OVERLAYS.map((overlay) => {
      return {
        id: overlay.id,
        label: overlay.label,
        thumbnail: dotsThumb(overlay.color),
        layers: [`${overlay.id}-pts`],
        // Start off so the map stays readable; turn them on from the panel.
        defaultActive: false,
      };
    }),
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
  layers.push(...extraLayers);
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
      'Click "Camadas" (bottom-left) to toggle layer groups. Hide the kitchens, ' +
      'then switch mode — the choice persists. In "Coroplético" the kitchens ' +
      'item is disabled (no kitchen layer in that mode). Click "Ver mais" to ' +
      'see every layer.',
    engine: 'maplibre',
    basemap: { visible: false },
    sources: [
      { id: 'states', type: 'geojson', data: states },
      { id: 'kitchens', type: 'geojson', data: kitchens },
      ...extraSources,
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
