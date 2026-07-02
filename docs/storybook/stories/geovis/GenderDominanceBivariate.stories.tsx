import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { GeoJSONFeatureCollection } from '@ttoss/geovis';
import {
  formatCompactNumber,
  GeoVisCanvas,
  GeoVisHoverTooltip,
  GeoVisLegend,
  GeoVisProvider,
} from '@ttoss/geovis';
import * as React from 'react';

import type {
  ApiDistrictEntry,
  DistrictEntry,
  Year,
} from './helpers/gender-dominance-helpers';
import {
  buildCentroidGeoJson,
  buildSpec,
  normalizePopulationData,
  renderTooltip,
  sumValues,
} from './helpers/gender-dominance-helpers';
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

/* eslint-disable react/prop-types */
export const GenderDominanceBivariate: StoryFn<{
  year: Year;
  legendEnabled: boolean;
  minRadiusPx: number;
  maxRadiusPx: number;
  circleOpacity: number;
  strokeWidth: number;
  strokeOpacity: number;
}> = ({
  year,
  legendEnabled,
  minRadiusPx,
  maxRadiusPx,
  circleOpacity,
  strokeWidth,
  strokeOpacity,
}) => {
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
    // `scaleMaxValue` is intentionally omitted: the resolver derives a
    // nice-rounded ceiling (e.g. 487 321 → 500 000) from the size dataset, so
    // the reference-circle labels read as clean round numbers (125k / 250k /
    // 500k) instead of the raw-max decimals a manual Math.max would produce.
    return buildSpec({
      sizeData,
      colorData,
      year,
      districtGeoJson,
      centroidGeoJson,
      legendEnabled,
      minRadiusPx,
      maxRadiusPx,
      circleOpacity,
      strokeWidth,
      strokeOpacity,
    });
  }, [
    sizeData,
    colorData,
    year,
    districtGeoJson,
    centroidGeoJson,
    legendEnabled,
    minRadiusPx,
    maxRadiusPx,
    circleOpacity,
    strokeWidth,
    strokeOpacity,
  ]);

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
        <GeoVisLegend legendId="gender" formatValue={formatCompactNumber} />
        <GeoVisLegend
          legendId="population-legend"
          formatValue={formatCompactNumber}
        />
      </GeoVisProvider>
    </div>
  );
};
/* eslint-enable react/prop-types */

GenderDominanceBivariate.argTypes = {
  year: {
    control: { type: 'select' },
    options: AVAILABLE_YEARS,
    description: 'Census / projection year',
  },
  legendEnabled: {
    control: { type: 'boolean' },
    description:
      'Controls whether auto-generated legends are produced by the resolved mapType',
  },
};

GenderDominanceBivariate.args = {
  year: 2025,
  legendEnabled: true,
};
