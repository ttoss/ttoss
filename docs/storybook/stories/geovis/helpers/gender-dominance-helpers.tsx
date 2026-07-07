/**
 * Story-specific helpers for the Gender Dominance Bivariate fixture.
 * Not public package artefacts — story utilities only.
 */
import type {
  ColorBy,
  GeoJSONFeatureCollection,
  MapData,
  VisualizationSpec,
} from '@ttoss/geovis';

export const GENDER_COLOR_MEN = '#3b82f6';
export const GENDER_COLOR_WOMEN = '#ec4899';

export interface ApiDistrictEntry {
  total: number;
  nome_distr: string;
  Homens: Record<string, number>;
  Mulheres: Record<string, number>;
}

export interface DistrictEntry {
  total: number;
  districtName: string;
  men: Record<string, number>;
  women: Record<string, number>;
}

export const normalizeEntry = (e: ApiDistrictEntry): DistrictEntry => {
  return {
    total: e.total,
    districtName: e.nome_distr,
    men: e.Homens,
    women: e.Mulheres,
  };
};

export const normalizePopulationData = (
  raw: Record<string, Record<string, ApiDistrictEntry>>
): Record<string, Record<string, DistrictEntry>> => {
  return Object.fromEntries(
    Object.entries(raw).map(([yr, districts]) => {
      return [
        yr,
        Object.fromEntries(
          Object.entries(districts).map(([id, e]) => {
            return [id, normalizeEntry(e)];
          })
        ),
      ];
    })
  );
};

export const sumValues = (obj: Record<string, number>): number => {
  return Object.values(obj).reduce((a, b) => {
    return a + b;
  }, 0);
};

const computeCentroid = (coords: number[][][]): [number, number] => {
  const ring = coords[0];
  const lng =
    ring.reduce((s, c) => {
      return s + c[0];
    }, 0) / ring.length;
  const lat =
    ring.reduce((s, c) => {
      return s + c[1];
    }, 0) / ring.length;
  return [lng, lat];
};

export const buildCentroidGeoJson = (
  geoJson: GeoJSONFeatureCollection
): GeoJSONFeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: geoJson.features.map((f) => {
      const [lng, lat] = computeCentroid(
        (f.geometry as GeoJSON.Polygon).coordinates as number[][][]
      );
      return {
        type: 'Feature' as const,
        id: f.id,
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
        properties: null,
      };
    }),
  };
};

export const fmtPop = (v: number): string => {
  return `${(v / 1_000).toFixed(0)}k inhabitants`;
};

// Delimiter joining the fields packed into the tooltip's feature-state
// `value` (see `buildTooltipData`). Not expected to appear in a district
// name.
const TOOLTIP_FIELD_SEP = '::';

/**
 * Precomputes one composite tooltip string per district (name, population,
 * dominant gender) so the hover tooltip can be bound to the `districts-fill`
 * layer via `mapData`/feature-state instead of a `render` closure over the
 * externally-fetched `populationData`. Mirrors `sizeData`/`colorData`.
 */
export const buildTooltipData = (
  populationData: Record<string, Record<string, DistrictEntry>> | null,
  year: number
): Array<{ geometryId: number; value: string }> => {
  const yearData = populationData?.[String(year)];
  if (!yearData) return [];
  return Object.entries(yearData).map(([districtId, entry]) => {
    const totalMen = sumValues(entry.men);
    const totalWomen = sumValues(entry.women);
    const dominant = totalWomen > totalMen ? 'women' : 'men';
    const value = [entry.districtName, entry.total, dominant].join(
      TOOLTIP_FIELD_SEP
    );
    return { geometryId: parseInt(districtId, 10), value };
  });
};

/**
 * Renders the hover tooltip body purely from `info.value` — the composite
 * string bound via `mapData`/feature-state by `buildTooltipData` — with no
 * dependency on external state.
 */
export const renderTooltip = (info: {
  featureId: string | number;
  value: number | string | null;
}) => {
  const parts =
    typeof info.value === 'string' ? info.value.split(TOOLTIP_FIELD_SEP) : [];
  const [districtName, totalStr, dominant] = parts;
  if (!districtName || !totalStr || !dominant) {
    return (
      <div
        style={{ fontWeight: 600 }}
      >{`District #${String(info.featureId)}`}</div>
    );
  }
  const color = dominant === 'women' ? GENDER_COLOR_WOMEN : GENDER_COLOR_MEN;
  return (
    <>
      <div style={{ fontWeight: 600 }}>{districtName}</div>
      <div>{fmtPop(Number(totalStr))}</div>
      <div>
        <span
          style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: color,
            marginRight: 4,
          }}
        />
        {dominant === 'women' ? 'Women' : 'Men'} dominant
      </div>
    </>
  );
};

export type Year =
  | 2000
  | 2005
  | 2010
  | 2015
  | 2020
  | 2025
  | 2030
  | 2035
  | 2040
  | 2045
  | 2050;

export const buildSpec = ({
  sizeData,
  colorData,
  tooltipData,
  year,
  districtGeoJson,
  centroidGeoJson,
  scaleMaxValue,
  legendEnabled = true,
  minRadiusPx = 4,
  maxRadiusPx = 16,
  circleOpacity = 0.72,
  strokeWidth = 1,
  strokeOpacity = 0.9,
}: {
  sizeData: Array<{ geometryId: number; value: number }>;
  colorData: Array<{ geometryId: number; value: string }>;
  tooltipData: Array<{ geometryId: number; value: string }>;
  year: Year;
  districtGeoJson: GeoJSONFeatureCollection;
  centroidGeoJson: GeoJSONFeatureCollection;
  scaleMaxValue?: number;
  legendEnabled?: boolean;
  minRadiusPx?: number;
  maxRadiusPx?: number;
  circleOpacity?: number;
  strokeWidth?: number;
  strokeOpacity?: number;
}): VisualizationSpec => {
  return {
    id: 'gender-dominance-bivariate',
    mapType: 'proportionalCircles',
    engine: 'maplibre',
    scaleMaxValue,
    legendEnabled,
    sources: [
      {
        id: 'district-polygons',
        type: 'geojson',
        data: districtGeoJson,
      },
      { id: 'district-centroids', type: 'geojson', data: centroidGeoJson },
    ],
    layers: [
      {
        id: 'districts-fill',
        sourceId: 'district-polygons',
        geometry: 'polygon',
        paint: { fillColor: '#e2e8f0' },
        hoverPaint: { lineColor: '#333333', lineWidth: 2 },
        selectedPaint: { lineColor: '#1a1a1a', lineWidth: 3 },
        clickAnchor: { color: '#2171b5' },
        // Rendered purely from `info.value`, bound below via the
        // `district-tooltip` mapData entry — no closure over story state.
        hoverTooltip: { render: renderTooltip },
      },
      {
        id: 'districts-outline',
        sourceId: 'district-polygons',
        geometry: 'line',
        paint: { lineColor: '#94a3b8', lineWidth: 1 },
      },
      {
        id: 'district-centroids',
        sourceId: 'district-centroids',
        geometry: 'point',
        activeLegendId: 'gender',
        sizeBy: { range: [minRadiusPx, maxRadiusPx], transform: 'sqrt' },
        paint: {
          circleStrokeColor: '#ffffff',
          circleStrokeWidth: strokeWidth,
          circleOpacity,
          circleStrokeOpacity: strokeOpacity,
        },
      },
    ],
    legends: [
      {
        id: 'gender',
        title: `Gender dominance \u2014 ${year}`,
        colorBy: {
          type: 'categorical',
          property: 'gender',
          mapping: { men: GENDER_COLOR_MEN, women: GENDER_COLOR_WOMEN },
          defaultColor: '#9ca3af',
        },
      },
      // Matches the proportionalCircles auto-generated legend id
      // (`${mapData[0].mapDataId}-legend`, i.e. `population-legend`).
      // `mergeLegendsByIdOnly` grafts this onto the resolved legend, so only
      // the overridden field needs to be listed \u2014 no need to repeat `type`,
      // `thresholds`, or `colors`.
      {
        id: 'population-legend',
        colorBy: { defaultColor: '#9ca3af' } as unknown as ColorBy,
      },
    ],
    mapData: [
      {
        mapDataId: 'population',
        mapId: 'district-centroids',
        title: 'total population',
        stateKey: 'total',
        dimension: 'size',
        data: sizeData,
      },
      {
        mapDataId: 'gender',
        mapId: 'district-centroids',
        title: 'gender dominance',
        stateKey: 'gender',
        dimension: 'color',
        data: colorData,
      },
      // No custom `stateKey`, so it lands on the default `value` key that
      // `useMapHover` reads — this is what lets `districts-fill`'s
      // `hoverTooltip.render` (above) work from `info.value` alone.
      {
        mapDataId: 'district-tooltip',
        mapId: 'district-polygons',
        title: 'district tooltip data',
        data: tooltipData,
      },
    ] as MapData[],
  };
};
