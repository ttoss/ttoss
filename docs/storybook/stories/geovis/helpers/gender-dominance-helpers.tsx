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

export const renderTooltip = (
  info: { featureId: string | number },
  populationData: Record<string, Record<string, DistrictEntry>> | null,
  year: number
) => {
  const district = populationData?.[String(year)]?.[String(info.featureId)];
  if (!district) {
    return (
      <div
        style={{ fontWeight: 600 }}
      >{`District #${String(info.featureId)}`}</div>
    );
  }
  const totalMen = sumValues(district.men);
  const totalWomen = sumValues(district.women);
  const dominant = totalWomen > totalMen ? 'Women' : 'Men';
  const color = totalWomen > totalMen ? GENDER_COLOR_WOMEN : GENDER_COLOR_MEN;
  return (
    <>
      <div style={{ fontWeight: 600 }}>{district.districtName}</div>
      <div>{fmtPop(district.total)}</div>
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
        {dominant} dominant
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
    ] as MapData[],
  };
};
