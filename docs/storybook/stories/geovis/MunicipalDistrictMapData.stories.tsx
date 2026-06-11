import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  BoundaryGroup,
  GeoJSONFeatureCollection,
  VisualizationSpec,
} from '@ttoss/geovis';
import {
  BRAZIL_MUNICIPALITY_OUTLINES,
  BRAZIL_SP_SUBPREFECTURE_OUTLINES,
  BRAZIL_STATE_OUTLINES,
  customizeBoundaryGroup,
  GeoVisCanvas,
  GeoVisHoverTooltip,
  GeoVisLegend,
  GeoVisProvider,
  useBoundaryToggle,
} from '@ttoss/geovis';
import * as React from 'react';

import districtGeoJson from '../../../../packages/geovis/src/sources/br-sp-distritos-municipais.json';
import type { ColorStep } from './_choropleth-helpers';
import { MapOverlayLegend } from './_choropleth-helpers';
import { computeBbox, FitBoundsToBbox, MapLabel } from './_map-story-helpers';

const DISTRICT_BBOX = computeBbox(
  districtGeoJson as unknown as GeoJSON.FeatureCollection
);

export default {
  title: 'GeoVis/Fixtures/MunicipalDistrictMapData',
  tags: ['autodocs'],
} as Meta;

const DATA_URL =
  'https://api-forja.triangulos.tech/v1/files/8b7b245c-06e2-42de-9764-a2c180a75304/download';

// Population ranges for São Paulo districts (estimated from census data).
// Most districts: 30k–250k. Outliers: Marsilac ~8k, Grajaú/Campo Limpo ~240k+.
const populationSteps: ColorStep[] = [
  { threshold: 50_000, color: '#bfdbfe' },
  { threshold: 100_000, color: '#60a5fa' },
  { threshold: 150_000, color: '#3b82f6' },
  { threshold: 200_000, color: '#1d4ed8' },
  { threshold: 250_000, color: '#1e3a8a' },
];

const populationBreaks = populationSteps.map((step) => {
  return step.threshold;
});

const DEFAULT_COLOR = '#f0f9ff';

const AVAILABLE_YEARS = [
  2000, 2005, 2010, 2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050,
] as const;

type Year = (typeof AVAILABLE_YEARS)[number];

const fmtPop = (v: number) => {
  return `${(v / 1_000).toFixed(0)}k inhabitants`;
};

/** Raw shape returned by the external API (Portuguese field names). */
interface ApiDistrictEntry {
  total: number;
  nome_distr: string;
  Homens: Record<string, number>;
  Mulheres: Record<string, number>;
}

/** Normalised internal shape with English identifiers. */
interface DistrictEntry {
  total: number;
  districtName: string;
  men: Record<string, number>;
  women: Record<string, number>;
}

interface MunicipalDistrictMapDataProps {
  year: Year;
  showStateOutlines: boolean;
  showSubprefeituraOutlines: boolean;
  showMunicipalityOutlines: boolean;
  municipalityLineColor: string;
  municipalityLineWidth: number;
  stateLineColor: string;
  stateLineWidth: number;
  subprefeituraLineColor: string;
  subprefeituraLineWidth: number;
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

/**
 * Helper component to fetch and render population data with boundary toggles.
 */
/* eslint-disable max-lines-per-function, react/prop-types */
const MunicipalDistrictMapDataRender = (
  props: MunicipalDistrictMapDataProps
) => {
  const {
    year,
    showStateOutlines,
    showSubprefeituraOutlines,
    showMunicipalityOutlines,
    municipalityLineColor,
    municipalityLineWidth,
    stateLineColor,
    stateLineWidth,
    subprefeituraLineColor,
    subprefeituraLineWidth,
  } = props;
  const [populationData, setPopulationData] = React.useState<Record<
    string,
    Record<string, DistrictEntry>
  > | null>(null);

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

  const mapDataEntries = React.useMemo(() => {
    if (!populationData) return [];
    const yearData = populationData[String(year)];
    if (!yearData) return [];
    return Object.entries(yearData).map(([districtId, entry]) => {
      return { geometryId: parseInt(districtId, 10), value: entry.total };
    });
  }, [populationData, year]);

  const baseSpec = React.useMemo<VisualizationSpec>(() => {
    return {
      id: 'municipal-district-mapdata',
      engine: 'maplibre',
      basemap: { styleUrl: 'https://tiles.openfreemap.org/styles/bright' },
      sources: [
        {
          id: 'districts',
          type: 'geojson',
          data: districtGeoJson as unknown as GeoJSONFeatureCollection,
        },
      ],
      layers: [
        {
          id: 'districts-fill',
          sourceId: 'districts',
          geometry: 'polygon',
          mapDataId: 'population',
          activeLegendId: 'population',
          hoverPaint: { lineColor: '#333333', lineWidth: 2 },
          selectedPaint: { lineColor: '#1a1a1a', lineWidth: 3 },
          clickAnchor: { color: '#2171b5' },
        },
        {
          id: 'districts-outline',
          sourceId: 'districts',
          geometry: 'line',
          paint: { lineColor: '#93c5fd', lineWidth: 0.5 },
        },
      ],
      legends: [
        {
          id: 'population',
          label: `Population by district \u2014 ${year}`,
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: populationBreaks,
            colors: [
              DEFAULT_COLOR,
              ...populationSteps.map((step) => {
                return step.color;
              }),
            ],
            defaultColor: DEFAULT_COLOR,
          },
        },
      ],
      mapData: [
        {
          mapDataId: 'population',
          mapId: 'districts',
          data: mapDataEntries,
        },
      ],
    };
  }, [mapDataEntries, year]);

  const municipalityGroup = React.useMemo<BoundaryGroup>(() => {
    return customizeBoundaryGroup(BRAZIL_MUNICIPALITY_OUTLINES.local, {
      lineColor: municipalityLineColor,
      lineWidth: municipalityLineWidth,
    });
  }, [municipalityLineColor, municipalityLineWidth]);

  const stateGroup = React.useMemo<BoundaryGroup>(() => {
    return customizeBoundaryGroup(BRAZIL_STATE_OUTLINES.local, {
      lineColor: stateLineColor,
      lineWidth: stateLineWidth,
    });
  }, [stateLineColor, stateLineWidth]);

  const subprefeituraGroup = React.useMemo<BoundaryGroup>(() => {
    return customizeBoundaryGroup(BRAZIL_SP_SUBPREFECTURE_OUTLINES.local, {
      lineColor: subprefeituraLineColor,
      lineWidth: subprefeituraLineWidth,
    });
  }, [subprefeituraLineColor, subprefeituraLineWidth]);

  const boundaryGroups = React.useMemo(() => {
    return [municipalityGroup, stateGroup, subprefeituraGroup];
  }, [municipalityGroup, stateGroup, subprefeituraGroup]);

  const { spec, toggle, isVisible } = useBoundaryToggle(
    baseSpec,
    boundaryGroups
  );

  React.useEffect(() => {
    if (showMunicipalityOutlines !== isVisible(municipalityGroup)) {
      toggle(municipalityGroup);
    }
  }, [showMunicipalityOutlines, toggle, isVisible, municipalityGroup]);

  React.useEffect(() => {
    if (showStateOutlines !== isVisible(stateGroup)) {
      toggle(stateGroup);
    }
  }, [showStateOutlines, toggle, isVisible, stateGroup]);

  React.useEffect(() => {
    if (showSubprefeituraOutlines !== isVisible(subprefeituraGroup)) {
      toggle(subprefeituraGroup);
    }
  }, [showSubprefeituraOutlines, toggle, isVisible, subprefeituraGroup]);

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
          <MapLabel>São Paulo — population {year}</MapLabel>
          <GeoVisCanvas
            viewId="primary"
            style={{ width: '100%', height: '100%' }}
          />
          <FitBoundsToBbox bbox={DISTRICT_BBOX} />
          <GeoVisHoverTooltip
            render={(info) => {
              const district =
                populationData?.[String(year)]?.[String(info.featureId)];
              return (
                <>
                  <div style={{ fontWeight: 600 }}>
                    {district?.districtName ??
                      `District #${String(info.featureId)}`}
                  </div>
                  <div>
                    {typeof info.value === 'number'
                      ? fmtPop(info.value)
                      : 'No data'}
                  </div>
                </>
              );
            }}
          />
          <MapOverlayLegend
            label="Total population"
            defaultColor={DEFAULT_COLOR}
            steps={populationSteps}
            formatValue={fmtPop}
          />
        </div>
        <GeoVisLegend
          legendId="population"
          breaks={populationBreaks}
          formatValue={fmtPop}
        />
      </GeoVisProvider>
    </div>
    /* eslint-enable max-lines-per-function, react/prop-types */
  );
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
export const MunicipalDistrictMapData: StoryFn<
  MunicipalDistrictMapDataProps
> = (props: MunicipalDistrictMapDataProps) => {
  return <MunicipalDistrictMapDataRender {...props} />;
};

MunicipalDistrictMapData.argTypes = {
  year: {
    control: { type: 'select' },
    options: AVAILABLE_YEARS,
    description: 'Census / projection year',
  },
  showStateOutlines: {
    control: 'boolean',
    description: 'Toggle Brazilian state outlines',
  },
  showSubprefeituraOutlines: {
    control: 'boolean',
    description: 'Toggle São Paulo subprefecture outlines',
  },
  showMunicipalityOutlines: {
    control: 'boolean',
    description: 'Toggle São Paulo municipality outlines',
  },
  municipalityLineColor: {
    control: 'color',
    description: 'Municipality outline color',
  },
  municipalityLineWidth: {
    control: { type: 'range', min: 0, max: 5, step: 0.5 },
    description: 'Municipality outline width (px)',
  },
  stateLineColor: {
    control: 'color',
    description: 'State outline color',
  },
  stateLineWidth: {
    control: { type: 'range', min: 0, max: 5, step: 0.5 },
    description: 'State outline width (px)',
  },
  subprefeituraLineColor: {
    control: 'color',
    description: 'Subprefecture outline color',
  },
  subprefeituraLineWidth: {
    control: { type: 'range', min: 0, max: 5, step: 0.5 },
    description: 'Subprefecture outline width (px)',
  },
};

MunicipalDistrictMapData.args = {
  year: 2020,
  showStateOutlines: true,
  showSubprefeituraOutlines: true,
  showMunicipalityOutlines: true,
  municipalityLineColor: '#d1d5db',
  municipalityLineWidth: 0.5,
  stateLineColor: '#374151',
  stateLineWidth: 1.5,
  subprefeituraLineColor: '#6b7280',
  subprefeituraLineWidth: 1.0,
};
