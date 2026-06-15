import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  BoundaryGroup,
  GeoJSONFeatureCollection,
  VisualizationSpec,
} from '@ttoss/geovis';
import {
  createBoundaryGroup,
  customizeBoundaryGroup,
  GeoVisCanvas,
  GeoVisHoverTooltip,
  GeoVisLegend,
  GeoVisProvider,
  useBoundaryToggle,
} from '@ttoss/geovis';
import * as React from 'react';

import type { ColorStep } from './helpers/choropleth-helpers';
import { MapOverlayLegend } from './helpers/choropleth-helpers';
import { getMunicipalDistrictSpec } from './helpers/getMunicipalDistrictSpec.helpers';
import {
  computeBbox,
  FitBoundsToBbox,
  MapLabel,
} from './helpers/map-story-helpers';

const DISTRICTS_URL =
  'https://api-forja.triangulos.tech/v1/files/13984ef1-a4b4-4476-869d-9b9cfd9c6788/download';
const STATES_URL =
  'https://api-forja.triangulos.tech/v1/multifiles/5e09f03c-bfe9-4cfb-b2dc-63676f95c19c/3bc26e1e-f2cb-4dd2-be21-ea4bd76ec40b/download';
const SUBPREFECTURES_URL =
  'https://api-forja.triangulos.tech/v1/files/265eb8bb-7a49-4164-86c3-24c207c1d228/download';

const baseDistrictsGroup = createBoundaryGroup({
  id: 'districts-outline-src',
  data: DISTRICTS_URL,
  layerId: 'districts-outline-toggle',
});
const baseStateGroup = createBoundaryGroup({
  id: 'brazil-states',
  data: STATES_URL,
});
const baseSubprefeituraGroup = createBoundaryGroup({
  id: 'brazil-sp-subprefectures',
  data: SUBPREFECTURES_URL,
});

export default {
  title: 'GeoVis/Fixtures/MunicipalDistrictMapData',
  tags: ['autodocs'],
} as Meta;

const DATA_URL =
  'https://api-forja.triangulos.tech/v1/files/8b7b245c-06e2-42de-9764-a2c180a75304/download';

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

interface MunicipalDistrictMapDataProps {
  year: Year;
  showBasemap: boolean;
  showStateOutlines: boolean;
  showSubprefeituraOutlines: boolean;
  showDistrictOutlines: boolean;
  districtLineColor: string;
  districtLineWidth: number;
  stateLineColor: string;
  stateLineWidth: number;
  subprefeituraLineColor: string;
  subprefeituraLineWidth: number;
}

// export type { MunicipalDistrictMapDataProps };

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

/* eslint-disable max-lines-per-function */
const MunicipalDistrictMapDataRender = (
  props: MunicipalDistrictMapDataProps
) => {
  const {
    year,
    showBasemap,
    showStateOutlines,
    showSubprefeituraOutlines,
    showDistrictOutlines,
    districtLineColor,
    districtLineWidth,
    stateLineColor,
    stateLineWidth,
    subprefeituraLineColor,
    subprefeituraLineWidth,
  } = props;
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
      .catch(() => {
        setPopulationData({});
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

  const districtBbox = React.useMemo(() => {
    if (!districtGeoJson) return undefined;
    return computeBbox(districtGeoJson as GeoJSON.FeatureCollection);
  }, [districtGeoJson]);

  const nameToFeatureId = React.useMemo(() => {
    if (!districtGeoJson) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const f of districtGeoJson.features) {
      const name = f.properties?.['nm_distrit'];
      if (name && f.id != null) map.set(String(name), String(f.id));
    }
    return map;
  }, [districtGeoJson]);

  const mapDataEntries = React.useMemo(() => {
    if (!populationData) return [];
    const yearData = populationData[String(year)];
    if (!yearData) return [];
    return Object.entries(yearData)
      .map(([_districtId, entry]) => {
        const featureId = nameToFeatureId.get(entry.districtName);
        if (!featureId) return null;
        return { geometryId: featureId, value: entry.total };
      })
      .filter((e): e is NonNullable<typeof e> => {
        return e != null;
      });
  }, [populationData, year, nameToFeatureId]);

  const baseSpec = React.useMemo<VisualizationSpec>(() => {
    return getMunicipalDistrictSpec({
      year,
      districtData: districtGeoJson,
      showBasemap,
      mapDataEntries,
      populationBreaks,
      populationSteps,
      DEFAULT_COLOR,
    });
  }, [districtGeoJson, mapDataEntries, year, showBasemap]);

  const districtsGroup = React.useMemo<BoundaryGroup>(() => {
    return customizeBoundaryGroup(baseDistrictsGroup, {
      lineColor: districtLineColor,
      lineWidth: districtLineWidth,
    });
  }, [districtLineColor, districtLineWidth]);

  const stateGroup = React.useMemo<BoundaryGroup>(() => {
    return customizeBoundaryGroup(baseStateGroup, {
      lineColor: stateLineColor,
      lineWidth: stateLineWidth,
    });
  }, [stateLineColor, stateLineWidth]);

  const subprefeituraGroup = React.useMemo<BoundaryGroup>(() => {
    return customizeBoundaryGroup(baseSubprefeituraGroup, {
      lineColor: subprefeituraLineColor,
      lineWidth: subprefeituraLineWidth,
    });
  }, [subprefeituraLineColor, subprefeituraLineWidth]);

  const boundaryGroups = React.useMemo(() => {
    return [districtsGroup, stateGroup, subprefeituraGroup];
  }, [districtsGroup, stateGroup, subprefeituraGroup]);

  const { spec, toggle, isVisible } = useBoundaryToggle(
    baseSpec,
    boundaryGroups
  );

  React.useEffect(() => {
    if (showDistrictOutlines !== isVisible(districtsGroup))
      toggle(districtsGroup);
  }, [showDistrictOutlines, toggle, isVisible, districtsGroup]);
  React.useEffect(() => {
    if (showStateOutlines !== isVisible(stateGroup)) toggle(stateGroup);
  }, [showStateOutlines, toggle, isVisible, stateGroup]);
  React.useEffect(() => {
    if (showSubprefeituraOutlines !== isVisible(subprefeituraGroup))
      toggle(subprefeituraGroup);
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
          {districtBbox && <FitBoundsToBbox bbox={districtBbox} />}
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
          {
            <MapOverlayLegend
              label="Total population"
              defaultColor={DEFAULT_COLOR}
              steps={populationSteps}
              formatValue={fmtPop}
            />
          }
        </div>
        {
          <GeoVisLegend
            legendId="population"
            breaks={populationBreaks}
            formatValue={fmtPop}
          />
        }
      </GeoVisProvider>
    </div>
    /* eslint-enable max-lines-per-function */
  );
};

/** Choropleth of São Paulo districts coloured by population with boundary toggles and labelFormat support. */
export const MunicipalDistrictMapData: StoryFn<
  MunicipalDistrictMapDataProps
> = (props: MunicipalDistrictMapDataProps) => {
  return <MunicipalDistrictMapDataRender {...props} />;
};

MunicipalDistrictMapData.argTypes = {
  year: { control: { type: 'select' }, options: AVAILABLE_YEARS },
  showBasemap: { control: 'boolean' },
  showStateOutlines: { control: 'boolean' },
  showDistrictOutlines: { control: 'boolean' },
  showSubprefeituraOutlines: { control: 'boolean' },
  stateLineColor: { control: 'color' },
  stateLineWidth: { control: { type: 'range', min: 0, max: 5, step: 0.5 } },
  districtLineColor: { control: 'color' },
  districtLineWidth: {
    control: { type: 'range', min: 0, max: 5, step: 0.5 },
  },
  subprefeituraLineColor: { control: 'color' },
  subprefeituraLineWidth: {
    control: { type: 'range', min: 0, max: 5, step: 0.5 },
  },
};

const baseVariationArgs = {
  year: 2020,
  showBasemap: true,
  showStateOutlines: true,
  showDistrictOutlines: true,
  showSubprefeituraOutlines: true,
  stateLineColor: '#374151',
  stateLineWidth: 1.5,
  districtLineColor: '#d1d5db',
  districtLineWidth: 0.5,
  subprefeituraLineColor: '#6b7280',
  subprefeituraLineWidth: 1.0,
};

MunicipalDistrictMapData.args = baseVariationArgs;
