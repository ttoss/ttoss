import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  MapData,
  VisualizationSpec,
} from '@ttoss/geovis';
import {
  GeoVisCanvas,
  GeoVisHoverTooltip,
  GeoVisLegend,
  GeoVisProvider,
} from '@ttoss/geovis';
import * as React from 'react';

import {
  computeBbox,
  FitBoundsToBbox,
  MapLabel,
} from './helpers/map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/GenderDominanceBivariate',
  tags: ['autodocs'],
} as Meta;

const DATA_URL =
  'https://api-forja.triangulos.tech/v1/files/8b7b245c-06e2-42de-9764-a2c180a75304/download';

const DISTRICTS_URL =
  'https://api-forja.triangulos.tech/v1/files/13984ef1-a4b4-4476-869d-9b9cfd9c6788/download';

const AVAILABLE_YEARS = [
  2000, 2005, 2010, 2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050,
] as const;

type Year = (typeof AVAILABLE_YEARS)[number];

interface ApiDistrictEntry {
  total: number;
  nome_distr: string;
  Homens: Record<string, number>;
  Mulheres: Record<string, number>;
}

interface DistrictEntry {
  total: number;
  districtName: string;
  men: Record<string, number>;
  women: Record<string, number>;
}

const normalizeEntry = (e: ApiDistrictEntry): DistrictEntry => {
  return {
    total: e.total,
    districtName: e.nome_distr,
    men: e.Homens,
    women: e.Mulheres,
  };
};

const normalizePopulationData = (
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

const GENDER_COLOR_MEN = '#3b82f6';
const GENDER_COLOR_WOMEN = '#ec4899';

const sumValues = (obj: Record<string, number>): number => {
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

const buildCentroidGeoJson = (
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

const fmtPop = (v: number) => {
  return `${(v / 1_000).toFixed(0)}k inhabitants`;
};

const renderTooltip = (
  info: { featureId: string | number },
  populationData: Record<string, Record<string, DistrictEntry>> | null,
  year: Year
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

const buildSpec = (
  sizeData: Array<{ geometryId: number; value: number }>,
  colorData: Array<{ geometryId: number; value: string }>,
  year: Year,
  districtGeoJson: GeoJSONFeatureCollection,
  centroidGeoJson: GeoJSONFeatureCollection
): VisualizationSpec => {
  return {
    id: 'gender-dominance-bivariate',
    engine: 'maplibre',
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
        paint: { circleStrokeColor: '#ffffff', circleStrokeWidth: 1.5 },
        sizeBy: {
          range: [8, 36],
          mode: 'continuous',
          thresholds: [50_000, 100_000, 150_000, 200_000, 250_000],
          transform: 'sqrt',
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
    ],
    mapData: [
      {
        mapDataId: 'population',
        mapId: 'district-centroids',
        stateKey: 'total',
        dimension: 'size',
        data: sizeData,
      },
      {
        mapDataId: 'gender',
        mapId: 'district-centroids',
        stateKey: 'gender',
        dimension: 'color',
        data: colorData,
      },
    ] as MapData[],
  };
};

/**
 * Bivariate map of São Paulo district centroids with **independent** size and
 * colour dimensions.
 *
 * - **Size** — total population (proportional symbols via `sizeBy`).
 * - **Colour** — pink (`#ec4899`) when women outnumber men, blue (`#3b82f6`)
 *   when men outnumber women (categorical colour via `dimension: 'color'`).
 *
 * Demonstrates `dimension` + `stateKey` with two separate `mapData`
 * entries using distinct `stateKey` values so each dimension resolves
 * independently from the same source.
 */
// eslint-disable-next-line react/prop-types
export const GenderDominanceBivariate: StoryFn<{ year: Year }> = ({ year }) => {
  const [populationData, setPopulationData] = React.useState<Record<
    string,
    Record<string, DistrictEntry>
  > | null>(null);

  const [districtGeoJson, setDistrictGeoJson] =
    React.useState<GeoJSONFeatureCollection | null>(null);

  React.useEffect(() => {
    fetch(DATA_URL)
      .then((res) => {
        return res.json();
      })
      .then((json: Record<string, Record<string, ApiDistrictEntry>>) => {
        return setPopulationData(normalizePopulationData(json));
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch population data', error);
      });
  }, []);

  React.useEffect(() => {
    fetch(DISTRICTS_URL)
      .then((res) => {
        return res.json();
      })
      .then((json: GeoJSONFeatureCollection) => {
        const withIds: GeoJSONFeatureCollection = {
          ...json,
          features: json.features.map((f) => {
            return {
              ...f,
              id: String(f.properties?.cd_distrit),
            };
          }),
        };
        setDistrictGeoJson(withIds);
      })
      .catch(() => {
        setDistrictGeoJson(null);
      });
  }, []);

  const centroidGeoJson = React.useMemo(() => {
    if (!districtGeoJson) return null;
    return buildCentroidGeoJson(districtGeoJson);
  }, [districtGeoJson]);

  const districtBbox = React.useMemo(() => {
    if (!districtGeoJson) return null;
    return computeBbox(districtGeoJson as GeoJSON.FeatureCollection);
  }, [districtGeoJson]);

  const sizeData = React.useMemo(() => {
    if (!populationData) return [];
    const yearData = populationData[String(year)];
    if (!yearData) return [];
    return Object.entries(yearData).map(([districtId, entry]) => {
      return { geometryId: parseInt(districtId, 10), value: entry.total };
    });
  }, [populationData, year]);

  const colorData = React.useMemo(() => {
    if (!populationData) return [];
    const yearData = populationData[String(year)];
    if (!yearData) return [];
    return Object.entries(yearData).map(([districtId, entry]) => {
      const totalMen = sumValues(entry.men);
      const totalWomen = sumValues(entry.women);
      return {
        geometryId: parseInt(districtId, 10),
        value: totalWomen > totalMen ? 'women' : 'men',
      };
    });
  }, [populationData, year]);

  const spec = React.useMemo(() => {
    if (!districtGeoJson || !centroidGeoJson) return null;
    return buildSpec(
      sizeData,
      colorData,
      year,
      districtGeoJson,
      centroidGeoJson
    );
  }, [sizeData, colorData, year, districtGeoJson, centroidGeoJson]);

  if (!districtGeoJson || !centroidGeoJson || !districtBbox || !spec) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GeoVisProvider spec={spec}>
        <div
          style={{
            position: 'relative',
            height: 520,
            borderRadius: 6,
            overflow: 'hidden',
            border: '1px solid #d4d4d8',
          }}
        >
          <MapLabel>
            São Paulo — size=population, colour=gender ({year})
          </MapLabel>
          <GeoVisCanvas
            viewId="primary"
            style={{ width: '100%', height: '100%' }}
          />
          <FitBoundsToBbox bbox={districtBbox} />
          <GeoVisHoverTooltip
            render={(info) => {
              return renderTooltip(info, populationData, year);
            }}
          />
        </div>
        <GeoVisLegend legendId="gender" />
      </GeoVisProvider>
    </div>
  );
};

GenderDominanceBivariate.argTypes = {
  year: {
    control: { type: 'select' },
    options: AVAILABLE_YEARS,
    description: 'Census / projection year',
  },
};

GenderDominanceBivariate.args = {
  year: 2020,
};
