import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';
import * as React from 'react';

import distritoGeoJson from '../../../../packages/geovis/src/fixtures/distrito-municipal-v2.json';
import type { ColorStep } from './_map-story-helpers';
import {
  ColorSwatchLegend,
  FeatureStatePainter,
  MapLabel,
  MapOverlayLegend,
} from './_map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/MunicipalDistrictMapData',
  tags: ['autodocs'],
} as Meta;

const DATA_URL =
  'https://api-forja.triangulos.tech/v1/files/518d1169-0cb5-4ef6-b499-2d98bf281030/download';

// Population ranges for São Paulo districts (estimated from census data).
// Most districts: 30k–250k. Outliers: Marsilac ~8k, Grajaú/Campo Limpo ~240k+.
const populationSteps: ColorStep[] = [
  { threshold: 50_000, color: '#bfdbfe' },
  { threshold: 100_000, color: '#60a5fa' },
  { threshold: 150_000, color: '#3b82f6' },
  { threshold: 200_000, color: '#1d4ed8' },
  { threshold: 250_000, color: '#1e3a8a' },
];

const DEFAULT_COLOR = '#f0f9ff';

const AVAILABLE_YEARS = [
  2000, 2005, 2010, 2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050,
] as const;

type Year = (typeof AVAILABLE_YEARS)[number];

const fmtPop = (v: number) => {
  return `${(v / 1_000).toFixed(0)}k inhabitants`;
};

/**
 * Choropleth of São Paulo municipal districts coloured by total population
 * for a selected census year (2000–2050, projected past 2025).
 *
 * Population data comes from an external dataset joined to the GeoJSON geometry
 * via `mapData` — the GeoJSON itself has no properties, only `feature.id`
 * (set to `cd_distrit`, an integer 1–96). `geometryId` in each `MapDataRow`
 * matches directly against `feature.id`, no `joinKey` needed.
 *
 * Source: SMUL/GEOINFO — Resident population evolution, São Paulo Municipality.
 */
// eslint-disable-next-line react/prop-types -- TypeScript generic on StoryFn already validates props
export const MunicipalDistrictMapData: StoryFn<{ year: Year }> = ({ year }) => {
  const [populationData, setPopulationData] = React.useState<Record<
    string,
    Record<string, number>
  > | null>(null);

  React.useEffect(() => {
    fetch(DATA_URL)
      .then((res) => {
        return res.json();
      })
      .then((json: Record<string, Record<string, number>>) => {
        return setPopulationData(json);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch population data', error);
      });
  }, []);

  const mapDataEntries = React.useMemo(() => {
    if (!populationData) return [];
    const yearData = populationData[String(year)];
    if (!yearData) return [];
    return Object.entries(yearData).map(([districtId, pop]) => {
      return { geometryId: parseInt(districtId, 10), value: pop };
    });
  }, [populationData, year]);

  const spec = React.useMemo<VisualizationSpec>(() => {
    return {
      id: 'municipal-district-mapdata',
      engine: 'maplibre',
      view: { center: [-46.63, -23.55], zoom: 9 },
      basemap: { styleUrl: 'https://tiles.openfreemap.org/styles/bright' },
      sources: [
        {
          id: 'distritos',
          type: 'geojson',
          data: distritoGeoJson as unknown as GeoJSON.FeatureCollection,
        },
      ],
      layers: [
        {
          id: 'distritos-fill',
          sourceId: 'distritos',
          geometry: 'polygon',
          mapDataId: 'population',
        },
        {
          id: 'distritos-outline',
          sourceId: 'distritos',
          geometry: 'line',
          paint: { lineColor: '#93c5fd', lineWidth: 0.5 },
        },
      ],
      mapData: [
        {
          mapDataId: 'population',
          mapId: 'distritos',
          data: mapDataEntries,
        },
      ],
    };
  }, [mapDataEntries]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          position: 'relative',
          height: 520,
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid #d4d4d8',
        }}
      >
        <MapLabel>São Paulo — population {year}</MapLabel>
        <GeoVisProvider spec={spec}>
          <GeoVisCanvas style={{ width: '100%', height: '100%' }} />
          <FeatureStatePainter
            layerId="distritos-fill"
            defaultColor={DEFAULT_COLOR}
            steps={populationSteps}
          />
          <MapOverlayLegend
            label="Total population"
            defaultColor={DEFAULT_COLOR}
            steps={populationSteps}
            formatValue={fmtPop}
          />
        </GeoVisProvider>
      </div>
      <ColorSwatchLegend
        title={`Population by district — ${year}`}
        defaultColor={DEFAULT_COLOR}
        steps={populationSteps}
        formatValue={fmtPop}
      />
    </div>
  );
};

MunicipalDistrictMapData.argTypes = {
  year: {
    control: { type: 'select' },
    options: AVAILABLE_YEARS,
    description: 'Census / projection year',
  },
};

MunicipalDistrictMapData.args = {
  year: 2020,
};
