import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  LayerControlEntry,
  VisualizationSpec,
} from '@ttoss/geovis';

import { GeoVisFixtureStory } from './GeoVisFixtureStory';
import { computeBbox } from './helpers/map-story-helpers';

/**
 * Demonstrates **layer-control categories**: an entry of `control.items` that
 * carries `items` instead of `layers` is a category. Its card does not toggle
 * anything — clicking it opens a panel with the category's own toggles.
 *
 * ## What to check
 *
 * 1. Hover **Camadas** (bottom-left). "Limites" is a loose toggle, as in any
 *    flat control; "Saúde", "Transporte" and "Lazer" are categories — each card
 *    carries a chevron, and a badge counting its items that are on.
 * 2. Click **Saúde**. Its panel replaces the strip, titled after it, with a
 *    back arrow and a close button. Toggle the pins: the map follows, and the
 *    trigger's badge counts every toggle that is on, across categories.
 * 3. Move the pointer off the control: the category panel stays (it was opened
 *    by a click). Press the back arrow to return to the strip, where "Saúde"
 *    now badges how many of its items are on.
 * 4. `Escape`, a click on the map or the close button collapse the control,
 *    and it reopens on the strip.
 * 5. "Lazer" references a layer this spec lacks, so its card is disabled —
 *    greyed and inert, like a toggle whose layers are all missing.
 *
 * A control without categories — see `SpecDrivenLayerControl` — is exactly
 * the flat list of toggles it has always been.
 */
export default {
  title: 'GeoVis/LayerControlCategories',
  tags: ['autodocs'],
} as Meta;

/** A handful of invented places around São Paulo, per kind. */
const place = (lng: number, lat: number, index: number) => {
  return {
    type: 'Feature' as const,
    id: index,
    properties: {},
    geometry: { type: 'Point' as const, coordinates: [lng, lat] },
  };
};

const points = (coordinates: [number, number][]): GeoJSONFeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: coordinates.map(([lng, lat], index) => {
      return place(lng, lat, index + 1);
    }),
  };
};

const LAYERS: {
  id: string;
  color: string;
  data: GeoJSONFeatureCollection;
}[] = [
  {
    id: 'ubs',
    color: '#2E9E5B',
    data: points([
      [-46.66, -23.55],
      [-46.61, -23.6],
      [-46.72, -23.5],
      [-46.58, -23.52],
    ]),
  },
  {
    id: 'hospitais',
    color: '#E4572E',
    data: points([
      [-46.64, -23.56],
      [-46.69, -23.6],
    ]),
  },
  {
    id: 'metro',
    color: '#7B3FA0',
    data: points([
      [-46.63, -23.55],
      [-46.65, -23.57],
      [-46.62, -23.53],
    ]),
  },
  {
    id: 'terminais',
    color: '#3D3D3D',
    data: points([
      [-46.7, -23.52],
      [-46.57, -23.58],
    ]),
  },
];

const BOUNDS: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 1,
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-46.75, -23.63],
            [-46.54, -23.63],
            [-46.54, -23.47],
            [-46.75, -23.47],
            [-46.75, -23.63],
          ],
        ],
      },
    },
  ],
};

/** A thumbnail of dots in one colour, inline so it needs no request. */
const dots = (color: string) => {
  const fill = encodeURIComponent(color);
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='rgb(234,238,227)'/><circle cx='20' cy='24' r='6' fill='${fill}'/><circle cx='42' cy='36' r='6' fill='${fill}'/><circle cx='28' cy='48' r='6' fill='${fill}'/></svg>`;
};

const colorOf = (id: string) => {
  return (
    LAYERS.find((layer) => {
      return layer.id === id;
    })?.color ?? '#000000'
  );
};

const ENTRIES: LayerControlEntry[] = [
  { id: 'limites', label: 'Limites', layers: ['limites-line'] },
  {
    id: 'saude',
    label: 'Saúde',
    thumbnail: dots(colorOf('ubs')),
    items: [
      {
        id: 'ubs',
        label: 'UBS',
        thumbnail: dots(colorOf('ubs')),
        layers: ['ubs-pts'],
        defaultActive: false,
      },
      {
        id: 'hospitais',
        label: 'Hospitais',
        thumbnail: dots(colorOf('hospitais')),
        layers: ['hospitais-pts'],
        defaultActive: false,
      },
    ],
  },
  {
    id: 'transporte',
    label: 'Transporte',
    thumbnail: dots(colorOf('metro')),
    items: [
      {
        id: 'metro',
        label: 'Estações de metrô',
        thumbnail: dots(colorOf('metro')),
        layers: ['metro-pts'],
      },
      {
        id: 'terminais',
        label: 'Terminais de ônibus',
        thumbnail: dots(colorOf('terminais')),
        layers: ['terminais-pts'],
        defaultActive: false,
      },
    ],
  },
  {
    // References a layer the spec does not declare: the card renders disabled.
    id: 'lazer',
    label: 'Lazer',
    items: [{ id: 'parques', label: 'Parques', layers: ['parques-fill'] }],
  },
];

const spec: VisualizationSpec = {
  title: 'Layer-control categories',
  description:
    'Hover "Camadas" (bottom-left): "Limites" toggles directly; the other ' +
    'cards are categories that open a panel of their own toggles.',
  engine: 'maplibre',
  basemap: { visible: false },
  sources: [
    { id: 'limites', type: 'geojson', data: BOUNDS },
    ...LAYERS.map((layer) => {
      return { id: layer.id, type: 'geojson' as const, data: layer.data };
    }),
  ],
  layers: [
    {
      id: 'limites-line',
      sourceId: 'limites',
      geometry: 'line',
      paint: { lineColor: '#1f2937', lineWidth: 1.5 },
    },
    ...LAYERS.map((layer) => {
      return {
        id: `${layer.id}-pts`,
        sourceId: layer.id,
        geometry: 'point' as const,
        paint: {
          circleColor: layer.color,
          circleRadius: 7,
          circleStrokeColor: '#ffffff',
          circleStrokeWidth: 1.5,
        },
      };
    }),
  ],
  control: {
    id: 'camadas',
    label: 'Camadas',
    position: 'bottom-left',
    trigger: 'hover',
    items: ENTRIES,
  },
};

const bbox = computeBbox(BOUNDS as GeoJSON.FeatureCollection);

/** A loose toggle beside three categories, one of them unavailable. */
export const LayerControlCategories: StoryFn = () => {
  return <GeoVisFixtureStory spec={spec} bbox={bbox} />;
};
