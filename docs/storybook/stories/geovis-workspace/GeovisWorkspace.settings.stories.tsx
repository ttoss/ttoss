import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  MapDataRow,
  VisualizationSpec,
} from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

import {
  hexbin,
  insideBrazil,
  quantileBreaks,
  syntheticPoints,
} from '../geovis/helpers/hexbin-helpers';
import type { Bbox } from '../geovis/helpers/map-story-helpers';
import { withPtBr } from './GeovisWorkspace.decorators';

/**
 * A **settings section**: `kind: 'settings'` gives the sidebar a third zone,
 * beside `variations` and `filters`, for controls that change *how* the active
 * variation is drawn rather than *which* data it shows.
 *
 * The distinction is the reason it is its own kind. A filter narrows the data;
 * a setting re-renders the same data differently. Sharing the `filters` body
 * would let a `toggle` land in a filter block, where it would publish a
 * selection nothing filters on.
 *
 * Two controls cover the zone:
 *
 * - `slider` — a continuous range, or a **ladder** when `stops` is given. The
 *   rungs need not be evenly spaced, so the track runs over their indices and
 *   the handle reads each rung's own label.
 * - `toggle` — one switch. Its block's title is rendered inside the switch row,
 *   so the block skips its header rather than saying the same words twice.
 *
 * Both publish to the shared selection under their `menuId`, exactly as the
 * timeline does, which is what wires them to the map below.
 *
 * ```ts
 * { id: 'settings', header: { icon: 'lucide:settings' }, body: { kind: 'settings', blocks: [...] } }
 * ```
 *
 * The map is the `GeoVis/Hexbin` story's: invented observations binned into an
 * equal-area hexagonal grid clipped to Brazilian land. It is the case the zone
 * was designed for — a hexbin has no meaning without a cell size, and a cell
 * size is not a filter.
 *
 * ## What to check
 *
 * 1. Drag **Malha de Hexágonos**. The grid is rebuilt at the new cell radius,
 *    and the class breaks with it: halving the cell roughly quarters every
 *    count, so breaks fixed at one radius would flatten the map at the next.
 *    The cell count beside the readout is the real one, recomputed per rung.
 * 2. Drag **Opacidade da malha** — the fill alone changes, the geometry does
 *    not, so it stays smooth where the resolution slider has to re-bin.
 * 3. Toggle **Ocultar hexágonos vazios**. Cells that caught nothing leave the
 *    source entirely, so Brazil's silhouette breaks up into the populated arc.
 *    Toggle it back and the grey cells return — "caught nothing" is information,
 *    which is why it is hidden by choice rather than by default.
 * 4. Switch to **Pontos**. The gear tab dims and stops responding: the mesh
 *    settings have nothing to say about a scatter plot.
 */

/** Brazil's mainland, rounded outward. Only walked — the grid is clipped to land. */
const BBOX: Bbox = [-74, -34, -34, 6];

/** Invented blob centres, loosely over the populated arc of the country. */
const CENTRES: [number, number][] = [
  [-46.6, -23.5],
  [-43.2, -22.9],
  [-38.5, -12.9],
  [-60.0, -3.1],
  [-49.3, -25.4],
];

const POINTS = syntheticPoints({
  centres: CENTRES,
  perCentre: 220,
  scatter: 900,
  spread: 2.2,
  bbox: BBOX,
  seed: 20260914,
}).filter(insideBrazil);

/** Sequential blues: light reads as few, dark as many, with no hue change. */
const CLASS_COLORS = ['#C6DBEF', '#6BAED6', '#2171B5', '#08306B'];

/** Cells that caught nothing. Grey, so "none" never reads as "few". */
const EMPTY_COLOR = '#ECECEC';

/**
 * The palette trimmed to the classes the breaks actually produced. Quantile
 * breaks collapse when counts tie, and at a fine cell radius most cells hold 0
 * or 1 — so the ramp has to shrink with them. Both ends are always kept.
 */
const colorsFor = (thresholds: number[]): string[] => {
  const classes = thresholds.length + 1;
  if (classes >= CLASS_COLORS.length) return CLASS_COLORS;
  if (classes === 1) return [CLASS_COLORS[CLASS_COLORS.length - 1]];

  return Array.from({ length: classes }, (_, index) => {
    return CLASS_COLORS[
      Math.round((index * (CLASS_COLORS.length - 1)) / (classes - 1))
    ];
  });
};

const pointsSource: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: POINTS.map((coordinates, index) => {
    return {
      type: 'Feature',
      id: `pt-${index}`,
      properties: {},
      geometry: { type: 'Point', coordinates },
    };
  }),
};

const VARIATIONS = [
  { value: 'hexagonos', label: 'Hexágonos', icon: 'lucide:hexagon' },
  { value: 'pontos', label: 'Pontos', icon: 'lucide:map-pin' },
];

/** Only this variation draws a mesh, so only it enables the settings zone. */
const MESH_VARIATION = 'hexagonos';

/**
 * The resolution ladder, in cell circumradius.
 *
 * Floored at 40 km deliberately: below it the clip's per-corner containment
 * test costs more than a drag step can absorb, and the slider stops feeling
 * attached to the map. The rungs are not evenly spaced — the interesting range
 * is at the coarse end, where each step changes the reading.
 */
const MESH_STOPS = [
  { value: 320, label: '320 km' },
  { value: 240, label: '240 km' },
  { value: 160, label: '160 km' },
  { value: 120, label: '120 km' },
  { value: 80, label: '80 km' },
  { value: 40, label: '40 km' },
];

const DEFAULT_RADIUS_KM = 120;
const DEFAULT_OPACITY = 85;

/** Cell counts are real, so the ladder's hints are computed rather than written. */
const CELL_COUNTS = new Map(
  MESH_STOPS.map((stop) => {
    const cells = hexbin({ points: POINTS, bbox: BBOX, radiusKm: stop.value });
    return [stop.value, cells.length];
  })
);

const stopsWithCounts = MESH_STOPS.map((stop) => {
  return { ...stop, hint: `${CELL_COUNTS.get(stop.value)} células` };
});

const buildSpec = ({
  variation,
  radiusKm,
  opacity,
  hideEmpty,
}: {
  variation: string;
  radiusKm: number;
  opacity: number;
  hideEmpty: boolean;
}): VisualizationSpec => {
  const cells = hexbin({ points: POINTS, bbox: BBOX, radiusKm });

  // Recomputed per radius, not written down: halving the cell size roughly
  // quarters every count, so breaks fixed at one radius would paint the whole
  // map a single colour at the next.
  const thresholds = quantileBreaks({
    counts: cells.map((cell) => {
      return cell.count;
    }),
    classes: CLASS_COLORS.length,
  });

  // `hideEmpty` drops the cells from the SOURCE, not from the join: a cell left
  // in the source with no row still draws, in the legend's no-data grey. What
  // the setting asks for is that they not be drawn at all.
  const drawn = hideEmpty
    ? cells.filter((cell) => {
        return cell.count > 0;
      })
    : cells;

  const grid: GeoJSONFeatureCollection = {
    type: 'FeatureCollection',
    features: drawn.map((cell) => {
      return {
        type: 'Feature',
        // The join key lives in `properties`, not in the feature's top-level
        // `id`: MapLibre runs a string id through `parseInt` and `'hex-3-5'`
        // comes out `NaN`. `joinKey` below sets `promoteId`, which resolves it
        // from the property instead.
        properties: { count: cell.count, hexId: cell.id },
        geometry: { type: 'Polygon', coordinates: [cell.ring] },
      };
    }),
  };

  // Empty cells are left OUT of the join even when drawn. A row of `value: 0`
  // would fall below the first threshold and paint them in the lightest class —
  // "caught nothing" reading as "caught a few".
  const rows: MapDataRow[] = drawn
    .filter((cell) => {
      return cell.count > 0;
    })
    .map((cell) => {
      return { geometryId: cell.id, value: cell.count };
    });

  const showMesh = variation === MESH_VARIATION;

  return {
    engine: 'maplibre',
    view: { center: [-54, -14], zoom: 3.1 },
    sources: [
      { id: 'hexgrid', type: 'geojson', data: grid },
      { id: 'observations', type: 'geojson', data: pointsSource },
    ],
    layers: [
      {
        id: 'hexgrid-fill',
        sourceId: 'hexgrid',
        geometry: 'polygon',
        mapDataId: 'counts',
        activeLegendId: 'counts',
        visible: showMesh,
        paint: {
          fillOpacity: opacity / 100,
          lineColor: '#FFFFFF',
          lineWidth: 0.4,
        },
      },
      // Declared after the grid so the observations sit on top, and hidden
      // rather than dropped so switching variation does not reorder the style.
      {
        id: 'observations-pts',
        sourceId: 'observations',
        geometry: 'point',
        visible: !showMesh,
        paint: {
          circleColor: '#E4572E',
          circleRadius: 1.6,
          circleStrokeColor: '#FFFFFF',
          circleStrokeWidth: 0.3,
        },
      },
    ],
    mapData: [
      { mapDataId: 'counts', mapId: 'hexgrid', joinKey: 'hexId', data: rows },
    ],
    legends: [
      {
        id: 'counts',
        title: 'Observações por célula',
        subtitle: `Classes por quantis sobre células de ${radiusKm} km.`,
        position: 'bottom-right',
        noDataLabel: 'Sem observações',
        colorBy: {
          type: 'quantitative',
          property: 'value',
          scale: 'threshold',
          thresholds,
          colors: colorsFor(thresholds),
          defaultColor: EMPTY_COLOR,
        },
      },
    ],
  };
};

const config: GeovisWorkspaceConfig = {
  appearance: 'bare',
  leftSidebar: {
    initialState: 'open',
    sections: [
      {
        id: 'variacoes',
        header: { title: 'Variações', icon: 'lucide:layers' },
        body: {
          kind: 'variations',
          menuId: 'variacao',
          defaultValue: MESH_VARIATION,
          groups: [{ id: 'base', label: 'Base', variations: VARIATIONS }],
        },
      },
      {
        id: 'configuracoes',
        header: { title: 'Configurações', icon: 'lucide:settings' },
        // The mesh controls only mean something where there is a mesh.
        enabledWhen: { menuId: 'variacao', values: [MESH_VARIATION] },
        body: {
          kind: 'settings',
          blocks: [
            {
              id: 'resolucao',
              title: 'Malha de Hexágonos',
              icon: 'lucide:hexagon',
              control: {
                kind: 'slider',
                menuId: 'hexResolution',
                stops: stopsWithCounts,
                defaultValue: DEFAULT_RADIUS_KM,
                endLabels: ['Panorâmico', 'Detalhado'],
                stepButtons: true,
              },
            },
            {
              id: 'opacidade',
              title: 'Opacidade da malha',
              icon: 'lucide:droplets',
              control: {
                kind: 'slider',
                menuId: 'hexOpacity',
                min: 30,
                max: 100,
                step: 5,
                defaultValue: DEFAULT_OPACITY,
                unit: '%',
                endLabels: ['Transparente', 'Opaca'],
                stepButtons: true,
              },
            },
            {
              id: 'ocultar-vazios',
              title: 'Ocultar hexágonos vazios',
              control: {
                kind: 'toggle',
                menuId: 'hideEmpty',
                icon: 'lucide:eye-off',
                defaultValue: false,
              },
            },
          ],
        },
      },
    ],
  },
};

const SettingsDemo = () => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>({
    variacao: MESH_VARIATION,
  });

  const variation = selection.variacao ?? MESH_VARIATION;
  const radiusKm = Number(selection.hexResolution) || DEFAULT_RADIUS_KM;
  const opacity = Number(selection.hexOpacity) || DEFAULT_OPACITY;
  const hideEmpty = selection.hideEmpty === 'true';

  const spec = React.useMemo(() => {
    return buildSpec({ variation, radiusKm, opacity, hideEmpty });
  }, [variation, radiusKm, opacity, hideEmpty]);

  return (
    <div style={{ height: 640 }}>
      <GeovisWorkspace
        config={config}
        visualizationSpec={spec}
        variables={selection}
        onVariableChange={setSelection}
      />
    </div>
  );
};

const meta = {
  title: 'Geovis Workspace/Settings',
  component: SettingsDemo,
  tags: ['autodocs'],
  decorators: [withPtBr],
  parameters: {
    viewport: {
      options: {
        compact: {
          name: 'Mobile (below the breakpoint)',
          styles: { height: '844px', width: '390px' },
          type: 'mobile',
        },
        roomy: {
          name: 'Desktop (above the breakpoint)',
          styles: { height: '800px', width: '1280px' },
          type: 'desktop',
        },
      },
    },
  },
} satisfies Meta<typeof SettingsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Steps 1–4: the ladder re-binning, the opacity, the switch, and the gate. */
export const Desktop: Story = {
  globals: { viewport: { value: 'roomy', isRotated: false } },
};

/**
 * The same zone at 390×844. The blocks stack in one column either way; what to
 * watch is the ladder readout and its cell count staying on one line.
 */
export const Mobile: Story = {
  globals: { viewport: { value: 'compact', isRotated: false } },
};
