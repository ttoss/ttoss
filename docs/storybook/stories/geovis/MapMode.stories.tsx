import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  VisualizationSpec,
} from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

/**
 * Demonstrates the **map mode**: `spec.mapModeControl: true` makes
 * `<GeoVisProvider>` auto-mount a "Modo do mapa" button in the top-right
 * corner. The spec only switches the button on — which mode, and what each
 * side shows, is the reader's choice.
 *
 * ## What to check
 *
 * 1. Click the **Modo do mapa** button (top-right, right under the zoom and
 *    compass buttons). The menu offers "Mapa único" and "Dividir em dois".
 * 2. Choose **Dividir em dois**. The map splits into two maps side by side,
 *    the button turns green with a "2" badge, and the **Camadas** button
 *    (bottom-left) disappears: each side is now chosen from the **A** and
 *    **B** pickers at the top.
 *    Side **A** carries on with the layer that was on ("Cobertura"), side
 *    **B** starts with none.
 * 3. Open picker **B** and pick a layer: only the right side changes. Pick
 *    "Nenhuma camada" to empty it again. The district outlines are not a
 *    `control` item, so both sides keep them.
 * 4. Drag or zoom either side: the other follows, so the two always show the
 *    same place.
 * 5. Back to **Mapa único**: the single map returns where you left the split,
 *    with the layer control back in its corner.
 * 6. Narrow the canvas below ~300px: the two pickers stack over the divider.
 * 7. `Escape` or a click outside closes the menu and the pickers.
 */
export default {
  title: 'GeoVis/MapMode',
  tags: ['autodocs'],
} as Meta;

/** A 4×3 grid of invented "districts" over São Paulo. */
const districts: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: Array.from({ length: 12 }, (_, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const west = -46.83 + column * 0.12;
    const north = -23.42 - row * 0.11;
    return {
      type: 'Feature' as const,
      id: index + 1,
      properties: { name: `Distrito ${index + 1}` },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [west, north],
            [west + 0.12, north],
            [west + 0.12, north - 0.11],
            [west, north - 0.11],
            [west, north],
          ],
        ],
      },
    };
  }),
};

/** Half of the districts, so the two fills read apart side by side. */
const subset = (ids: number[]): GeoJSONFeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: districts.features.filter((feature) => {
      return ids.includes(Number(feature.id));
    }),
  };
};

const points = (coordinates: [number, number][]): GeoJSONFeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: coordinates.map(([lng, lat], index) => {
      return {
        type: 'Feature' as const,
        id: index + 1,
        properties: {},
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
      };
    }),
  };
};

const swatch = (color: string) => {
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><rect width='16' height='16' rx='3' fill='${encodeURIComponent(color)}'/></svg>`;
};

const spec: VisualizationSpec = {
  title: 'Map mode',
  description:
    'Use the "Modo do mapa" button (under the zoom buttons) to split the map ' +
    'in two and ' +
    'compare layers side by side.',
  engine: 'maplibre',
  view: { center: [-46.6, -23.58], zoom: 9.4 },
  sources: [
    { id: 'districts', type: 'geojson', data: districts },
    {
      id: 'coverage',
      type: 'geojson',
      data: subset([1, 2, 5, 6, 7, 10]),
    },
    {
      id: 'vulnerability',
      type: 'geojson',
      data: subset([3, 4, 8, 9, 11, 12]),
    },
    {
      id: 'kitchens',
      type: 'geojson',
      data: points([
        [-46.66, -23.55],
        [-46.61, -23.6],
        [-46.72, -23.5],
        [-46.48, -23.53],
        [-46.55, -23.66],
      ]),
    },
    {
      id: 'hospitals',
      type: 'geojson',
      data: points([
        [-46.64, -23.57],
        [-46.69, -23.62],
        [-46.52, -23.48],
      ]),
    },
  ],
  layers: [
    {
      id: 'coverage-fill',
      sourceId: 'coverage',
      geometry: 'polygon',
      paint: { fillColor: '#2E9E5B', fillOpacity: 0.55 },
    },
    {
      id: 'vulnerability-fill',
      sourceId: 'vulnerability',
      geometry: 'polygon',
      visible: false,
      paint: { fillColor: '#E4572E', fillOpacity: 0.55 },
    },
    // Not a control item: drawn on both sides of a split.
    {
      id: 'districts-line',
      sourceId: 'districts',
      geometry: 'line',
      paint: { lineColor: '#1f2937', lineWidth: 1 },
    },
    {
      id: 'kitchens-pts',
      sourceId: 'kitchens',
      geometry: 'point',
      visible: false,
      paint: {
        circleColor: '#7C3AED',
        circleRadius: 7,
        circleStrokeColor: '#ffffff',
        circleStrokeWidth: 1.5,
      },
    },
    {
      id: 'hospitals-pts',
      sourceId: 'hospitals',
      geometry: 'point',
      visible: false,
      paint: {
        circleColor: '#2563EB',
        circleRadius: 7,
        circleStrokeColor: '#ffffff',
        circleStrokeWidth: 1.5,
      },
    },
  ],
  control: {
    id: 'layers',
    label: 'Camadas',
    position: 'bottom-left',
    trigger: 'click',
    items: [
      {
        id: 'coverage',
        label: 'Cobertura',
        thumbnail: swatch('#2E9E5B'),
        layers: ['coverage-fill'],
      },
      {
        id: 'vulnerability',
        label: 'Vulnerabilidade',
        thumbnail: swatch('#E4572E'),
        layers: ['vulnerability-fill'],
        defaultActive: false,
      },
      {
        id: 'kitchens',
        label: 'Cozinhas',
        thumbnail: swatch('#7C3AED'),
        layers: ['kitchens-pts'],
        defaultActive: false,
      },
      {
        id: 'hospitals',
        label: 'Hospitais',
        thumbnail: swatch('#2563EB'),
        layers: ['hospitals-pts'],
        defaultActive: false,
      },
    ],
  },
  mapModeControl: true,
};

export const MapMode: StoryFn = () => {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>{spec.title}</strong>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          {spec.description}
        </p>
      </div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 600,
          border: '1px solid #d4d4d8',
        }}
      >
        <GeoVisProvider spec={spec}>
          <GeoVisCanvas viewId="primary" />
        </GeoVisProvider>
      </div>
    </div>
  );
};
