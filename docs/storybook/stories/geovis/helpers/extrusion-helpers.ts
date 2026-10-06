import type { GeoJSONFeatureCollection, MapDataRow } from '@ttoss/geovis';

/**
 * Fictitious "districts" for the 3D extrusion stories: a hexagon grid over São
 * Paulo, built in code so the stories need no network. Each cell's `id` is what
 * `mapData` joins on.
 */

/** Centre of the grid, roughly São Paulo's. */
export const CENTER: [number, number] = [-46.63, -23.65];

const HEX_RADIUS = 0.018; // degrees of latitude, ~2 km
// A degree of longitude is shorter than one of latitude at this latitude;
// stretching x by its inverse keeps the hexagons regular on the map.
const LNG_SCALE = 1 / Math.cos((CENTER[1] * Math.PI) / 180);
// The city's rough footprint, an ellipse in degrees of latitude.
const SEMI_AXES: [number, number] = [0.21, 0.3];

type Cell = { id: number; center: [number, number]; distance: number };

const buildCells = (): Cell[] => {
  const cells: Cell[] = [];
  const columnStep = 1.5 * HEX_RADIUS;
  const rowStep = Math.sqrt(3) * HEX_RADIUS;
  let id = 1;
  for (let column = -14; column <= 14; column += 1) {
    for (let row = -14; row <= 14; row += 1) {
      const x = column * columnStep;
      const y = row * rowStep + (column % 2 === 0 ? 0 : rowStep / 2);
      const distance = Math.hypot(x / SEMI_AXES[0], y / SEMI_AXES[1]);
      if (distance > 1) continue;
      cells.push({
        id,
        center: [CENTER[0] + x * LNG_SCALE, CENTER[1] + y],
        distance,
      });
      id += 1;
    }
  }
  return cells;
};

const CELLS = buildCells();

const hexagonRing = ([lng, lat]: [number, number]): [number, number][] => {
  const ring = Array.from({ length: 6 }, (_, corner): [number, number] => {
    const angle = (Math.PI / 3) * corner;
    return [
      lng + HEX_RADIUS * Math.cos(angle) * LNG_SCALE,
      lat + HEX_RADIUS * Math.sin(angle),
    ];
  });
  return [...ring, ring[0]];
};

/** The grid, one polygon feature per cell. */
export const DISTRICTS: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: CELLS.map((cell) => {
    return {
      type: 'Feature',
      id: cell.id,
      geometry: { type: 'Polygon', coordinates: [hexagonRing(cell.center)] },
      properties: {},
    };
  }),
};

/** One random-looking point per cell, for a variation that is not polygons. */
export const FACILITIES: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: CELLS.filter((cell) => {
    return cell.id % 3 === 0;
  }).map((cell) => {
    return {
      type: 'Feature',
      id: cell.id,
      geometry: { type: 'Point', coordinates: cell.center },
      properties: {},
    };
  }),
};

/**
 * Fictitious rates in [0, 0.35] per cell: high where `centrality` says, fading
 * outwards, with deterministic noise so the map looks the same on every load.
 * Every 19th cell has no value, to show that features without data lie flat.
 *
 * @param params.seed - Varies the noise, so two series differ.
 * @param params.centrality - How much the centre outweighs the edge, `0`–`1`.
 * @returns One `mapData` row per cell.
 */
export const fictitiousRates = ({
  seed = 0,
  centrality = 1,
}: {
  seed?: number;
  centrality?: number;
} = {}): MapDataRow[] => {
  return CELLS.map(({ id, distance }) => {
    if (id % 19 === 0) return { geometryId: id, value: null };
    const noise = Math.sin((id + seed * 101) * 12.9898) * 43758.5453;
    const jitter = noise - Math.floor(noise);
    const value = Math.min(
      0.35,
      0.02 +
        0.26 * centrality * (1 - distance) +
        (0.1 + 0.15 * (1 - centrality)) * jitter
    );
    return { geometryId: id, value };
  });
};

/** The breaks a "% of total" choropleth uses: six thresholds, seven classes. */
export const THRESHOLDS = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3];

/** ColorBrewer Blues-7, lightest first. */
export const COLORS = [
  '#c6dbef',
  '#9ecae1',
  '#6baed6',
  '#4292c6',
  '#2171b5',
  '#08519c',
  '#08306b',
];
