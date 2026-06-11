import brazilSpDistritosMunicipais from '../sources/br-sp-distritos-municipais.json';
import brazilSpSubprefeiturasData from '../sources/br-sp-subprefeituras.json';
import brazilStatesData from '../sources/br-states.json';
import type {
  DataSource,
  VisualizationLayer,
  VisualizationSpec,
} from './types';

export interface BoundaryGroup {
  sources: DataSource[];
  layers: VisualizationLayer[];
}

// ---------------------------------------------------------------------------
// URL defaults — public CDN for production use
// ---------------------------------------------------------------------------
const MUNICIPALITIES_URL =
  'https://cdn.jsdelivr.net/npm/@ttoss/geovis-data@latest/municipios-simplificado.geojson';
const STATES_URL =
  'https://cdn.jsdelivr.net/npm/@ttoss/geovis-data@latest/estados-simplificado.geojson';
const SUBPREFECTURES_URL =
  'https://cdn.jsdelivr.net/npm/@ttoss/geovis-data@latest/sp-subprefeituras.geojson';

// ---------------------------------------------------------------------------
// Base layer presets — avoid repeating paint config for local & url variants
// ---------------------------------------------------------------------------
const MUNICIPALITIES_LAYER = {
  id: 'brazil-municipalities-line',
  sourceId: 'brazil-municipalities',
  geometry: 'line' as const,
  paint: { lineColor: '#d1d5db' as const, lineWidth: 0.5 },
};

const STATES_LAYER = {
  id: 'brazil-states-line',
  sourceId: 'brazil-states',
  geometry: 'line' as const,
  paint: { lineColor: '#374151' as const, lineWidth: 1.5 },
};

const SUBPREFECTURES_LAYER = {
  id: 'brazil-sp-subprefectures-line',
  sourceId: 'brazil-sp-subprefectures',
  geometry: 'line' as const,
  paint: { lineColor: '#6b7280' as const, lineWidth: 1.0 },
};

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/**
 * Preset for Brazilian municipality outlines (96 distritos municipais de SP).
 *
 * `.local` — inline GeoJSON bundled with the package (WGS84).
 * `.url()` — fetches a simplified version from CDN.
 *
 * @example
 * ```ts
 * import { BRAZIL_MUNICIPALITY_OUTLINES, appendBoundaryGroup } from '@ttoss/geovis';
 *
 * const spec = appendBoundaryGroup(mySpec, BRAZIL_MUNICIPALITY_OUTLINES.local);
 * ```
 */
export const BRAZIL_MUNICIPALITY_OUTLINES: {
  local: BoundaryGroup;
  url: (url?: string) => BoundaryGroup;
} = {
  local: {
    sources: [
      {
        id: 'brazil-municipalities',
        type: 'geojson',
        data: brazilSpDistritosMunicipais,
      },
    ],
    layers: [MUNICIPALITIES_LAYER],
  },
  url: (url: string = MUNICIPALITIES_URL) => {
    return {
      sources: [
        {
          id: 'brazil-municipalities',
          type: 'geojson',
          data: url,
        },
      ],
      layers: [MUNICIPALITIES_LAYER],
    };
  },
};

/**
 * Preset for Brazilian state outlines (27 states).
 *
 * `.local` — inline GeoJSON bundled with the package (WGS84).
 * `.url()` — fetches a simplified version from CDN.
 */
export const BRAZIL_STATE_OUTLINES: {
  local: BoundaryGroup;
  url: (url?: string) => BoundaryGroup;
} = {
  local: {
    sources: [
      {
        id: 'brazil-states',
        type: 'geojson',
        data: brazilStatesData,
      },
    ],
    layers: [STATES_LAYER],
  },
  url: (url: string = STATES_URL) => {
    return {
      sources: [
        {
          id: 'brazil-states',
          type: 'geojson',
          data: url,
        },
      ],
      layers: [STATES_LAYER],
    };
  },
};

/**
 * Preset for São Paulo subprefecture outlines (32 subprefeituras).
 *
 * `.local` — inline GeoJSON bundled with the package (UTM projected).
 * `.url()` — fetches a simplified version from CDN.
 *
 * @remarks The local data uses UTM zone 23S coordinates. When rendered on a
 * WGS84 map it will appear misplaced unless the spec/view is configured for
 * a projected CRS or the data is re-projected upstream.
 */
export const BRAZIL_SP_SUBPREFECTURE_OUTLINES: {
  local: BoundaryGroup;
  url: (url?: string) => BoundaryGroup;
} = {
  local: {
    sources: [
      {
        id: 'brazil-sp-subprefectures',
        type: 'geojson',
        data: brazilSpSubprefeiturasData,
      },
    ],
    layers: [SUBPREFECTURES_LAYER],
  },
  url: (url: string = SUBPREFECTURES_URL) => {
    return {
      sources: [
        {
          id: 'brazil-sp-subprefectures',
          type: 'geojson',
          data: url,
        },
      ],
      layers: [SUBPREFECTURES_LAYER],
    };
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Merges a `BoundaryGroup` into an existing `VisualizationSpec`.
 *
 * Appends the group's sources and layers to the spec's arrays.
 * Returns a new spec object — the original is not mutated.
 *
 * @param spec - The base spec (without the boundary group).
 * @param group - The boundary group to append.
 * @returns A new spec with the group's sources and layers appended.
 */
export const appendBoundaryGroup = (
  spec: VisualizationSpec,
  group: BoundaryGroup
): VisualizationSpec => {
  return {
    ...spec,
    sources: [...spec.sources, ...group.sources],
    layers: [...spec.layers, ...group.layers],
  };
};

/**
 * Sets the `visible` flag on every layer in `spec` whose `id` matches any
 * layer ID in `group`.
 *
 * Layers not belonging to the group are left untouched.
 * Returns a new spec object — the original is not mutated.
 *
 * @param spec - The spec containing the layers to toggle.
 * @param group - The boundary group whose layers should be toggled.
 * @param visible - `true` to show, `false` to hide.
 * @returns A new spec with the updated visibility flags.
 */
export const toggleBoundaryGroup = (
  spec: VisualizationSpec,
  group: BoundaryGroup,
  visible: boolean
): VisualizationSpec => {
  const groupLayerIds = new Set(
    group.layers.map((l) => {
      return l.id;
    })
  );
  return {
    ...spec,
    layers: spec.layers.map((l) => {
      return groupLayerIds.has(l.id) ? { ...l, visible } : l;
    }),
  };
};
