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
import type { Ramp } from './GeovisWorkspace.ramps';
import {
  BASE_COLORS,
  DEFAULT_RAMP,
  rampFor,
  RAMPS,
} from './GeovisWorkspace.ramps';

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
 * Three controls cover the zone:
 *
 * - `slider` — a continuous range, or a **ladder** when `stops` is given. The
 *   rungs need not be evenly spaced, so the track runs over their indices and
 *   the handle reads each rung's own label.
 * - `colorRamp` — the ramps listed one per row, each showing the colors it
 *   stands for. Unordered alternatives, which is why it is a list and not a
 *   slider over a palette index: there is no "more" direction to drag towards.
 *   With `create`, the list ends in an affordance that opens an editor for
 *   building one more; the control reports the finished ramp and the app is
 *   what keeps it, because a selection carries one string per key and a ramp
 *   is a name and its classes.
 * - `toggle` — one switch. Its block's title is rendered inside the switch row,
 *   so the block skips its header rather than saying the same words twice.
 *
 * All three publish to the shared selection under their `menuId`, exactly as
 * the timeline does, which is what wires them to the map below.
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
 * 2. Pick a ramp under **Cor da Malha**. The map repaints without re-binning:
 *    the breaks are untouched, only the colors they are read through change.
 *    The no-data grey stays out of every ramp — "caught nothing" is not a class.
 * 3. Build one under **Nova escala de cor**: pick a base color, watch the strip
 *    preview the sweep it would add, name it and add it. The ramp lands at the
 *    end of the list, already chosen, and the map repaints from it — same path
 *    as the ramps the story ships, because by then it is one of them. The `×`
 *    on its row drops it again; the shipped ramps have no `×`, since they are
 *    not the reader's to throw away.
 * 4. Drag **Opacidade da malha** — the fill alone changes, the geometry does
 *    not, so it stays smooth where the resolution slider has to re-bin.
 * 5. Toggle **Ocultar hexágonos vazios**. Cells that caught nothing leave the
 *    source entirely, so Brazil's silhouette breaks up into the populated arc.
 *    Toggle it back and the grey cells return — "caught nothing" is information,
 *    which is why it is hidden by choice rather than by default.
 * 5. Switch to **Pontos**. The gear tab dims and stops responding: the mesh
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

/** Cells that caught nothing. Grey, so "none" never reads as "few". */
const EMPTY_COLOR = '#ECECEC';

/**
 * The legend's distance from the map edges, overriding GeoVis's own 24px.
 *
 * It is the left sidebar card's inset — the workspace insets that card by the
 * theme's `3` space (`0.75rem`) — so the two cards sit the same distance off
 * their edges and their bottoms line up, rather than the legend floating a
 * further 12px in on a map the sidebar is read against.
 */
const LEGEND_OFFSET = 12;

/**
 * The chosen ramp trimmed to the classes the breaks actually produced. Quantile
 * breaks collapse when counts tie, and at a fine cell radius most cells hold 0
 * or 1 — so the ramp has to shrink with them. Both ends are always kept.
 */
const colorsFor = ({
  thresholds,
  colors,
}: {
  thresholds: number[];
  colors: string[];
}): string[] => {
  const classes = thresholds.length + 1;
  if (classes >= colors.length) return colors;
  if (classes === 1) return [colors[colors.length - 1]];

  return Array.from({ length: classes }, (_, index) => {
    return colors[Math.round((index * (colors.length - 1)) / (classes - 1))];
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
  rampId,
  ramps,
  opacity,
  hideEmpty,
}: {
  variation: string;
  radiusKm: number;
  rampId: string;
  ramps: Ramp[];
  opacity: number;
  hideEmpty: boolean;
}): VisualizationSpec => {
  const cells = hexbin({ points: POINTS, bbox: BBOX, radiusKm });
  const ramp = rampFor({ id: rampId, ramps });

  // Recomputed per radius, not written down: halving the cell size roughly
  // quarters every count, so breaks fixed at one radius would paint the whole
  // map a single colour at the next.
  const thresholds = quantileBreaks({
    counts: cells.map((cell) => {
      return cell.count;
    }),
    classes: ramp.colors.length,
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
    // The story shows the settings zone, not the basemap's credits, and the
    // expand button sat in the same corner as the legend. A real app dropping
    // this control still owes the basemap its attribution somewhere else.
    attributionControlEnabled: false,
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
        offset: LEGEND_OFFSET,
        noDataLabel: 'Sem observações',
        colorBy: {
          type: 'quantitative',
          property: 'value',
          scale: 'threshold',
          thresholds,
          colors: colorsFor({ thresholds, colors: ramp.colors }),
          defaultColor: EMPTY_COLOR,
        },
      },
    ],
  };
};

const buildConfig = ({
  ramps,
  onCreate,
  onRemove,
}: {
  ramps: Ramp[];
  onCreate: (params: { option: Ramp }) => void;
  onRemove: (params: { id: string }) => void;
}): GeovisWorkspaceConfig => {
  return {
    appearance: 'bare',
    /*
     * No right sidebar in this story: it has nothing to say about the settings
     * zone, and the `metadata` panel alone was enough to open it. All four of its
     * slots are hidden rather than only that one, so a later edit — a legend
     * `description`, or a click reaching the inspector — cannot bring the panel
     * back over the map the settings are meant to be read against.
     */
    slots: {
      legend: { hidden: true },
      warnings: { hidden: true },
      inspector: { hidden: true },
      metadata: { hidden: true },
    },
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
                id: 'cor',
                title: 'Cor da Malha',
                icon: 'lucide:droplet',
                control: {
                  kind: 'colorRamp',
                  menuId: 'hexRamp',
                  defaultValue: DEFAULT_RAMP,
                  options: ramps,
                  create: { baseColors: BASE_COLORS, onCreate },
                  onRemove,
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
};

const SettingsDemo = () => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>({
    variacao: MESH_VARIATION,
  });

  /*
   * The ramps the reader builds live here, beside the ones the story ships:
   * the control reports a finished ramp and the app is what keeps it, which is
   * why the list is state rather than the constant it was.
   */
  const [ramps, setRamps] = React.useState<Ramp[]>(RAMPS);

  const variation = selection.variacao ?? MESH_VARIATION;
  const radiusKm = Number(selection.hexResolution) || DEFAULT_RADIUS_KM;
  const rampId = selection.hexRamp ?? DEFAULT_RAMP;
  const opacity = Number(selection.hexOpacity) || DEFAULT_OPACITY;
  const hideEmpty = selection.hideEmpty === 'true';

  const spec = React.useMemo(() => {
    return buildSpec({
      variation,
      radiusKm,
      rampId,
      ramps,
      opacity,
      hideEmpty,
    });
  }, [variation, radiusKm, rampId, ramps, opacity, hideEmpty]);

  const config = React.useMemo(() => {
    return buildConfig({
      ramps,
      onCreate: ({ option }) => {
        setRamps((current) => {
          return [...current, option];
        });
      },
      onRemove: ({ id }) => {
        setRamps((current) => {
          return current.filter((ramp) => {
            return ramp.id !== id;
          });
        });
      },
    });
  }, [ramps]);

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

/** Steps 1–5: the ladder, the ramps, the opacity, the switch, and the gate. */
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
