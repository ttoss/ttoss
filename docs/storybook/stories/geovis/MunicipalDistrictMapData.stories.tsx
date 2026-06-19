import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  BoundaryGroup,
  GeoJSONFeatureCollection,
  LabelFormatSpec,
  LegendPosition,
  NormalizationSpec,
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

type LabelFormatType = LabelFormatSpec['type'];

type DataProperty = 'total' | 'men' | 'women';

type ThresholdPreset = 'standard' | 'ibge';

type LegendPositionControl = 'none' | LegendPosition;

type NormalizationType = 'raw' | 'percentage';

/** Storybook controls mapped to `VisualizationSpec` input fields. */
type MunicipalDistrictStoryArgs = {
  year: Year;
  dataProperty: DataProperty;
  abbreviate: boolean;
  extended: boolean;
  legendPosition: LegendPositionControl;
  labelFormatType: LabelFormatType;
  noDataLabel: string;
  thresholdPreset: ThresholdPreset;
  showOutline: boolean;
  showClickAnchor: boolean;
  hoverLineColor: string;
  hoverLineWidth: number;
  selectedLineColor: string;
  selectedLineWidth: number;
  clickAnchorColor: string;
  normalizationType: NormalizationType;
  basemapVisible: boolean;
  showStateOutlines: boolean;
  showDistrictOutlines: boolean;
  showSubprefeituraOutlines: boolean;
  stateLineColor: string;
  stateLineWidth: number;
  districtLineColor: string;
  districtLineWidth: number;
  subprefeituraLineColor: string;
  subprefeituraLineWidth: number;
};

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

// IBGE urban classification thresholds (used only for 'labels' type demonstration).
// Aligns with official Brazilian census categorization:
// < 20k (Rural) | 20k–50k (Small Settlement) | 50k–100k (Medium City) |
// 100k–250k (Large City) | 250k–500k (Metropolitan) | ≥ 500k (Mega Metropolitan)
const populationStepsIBGE: ColorStep[] = [
  { threshold: 20_000, color: '#bfdbfe' },
  { threshold: 50_000, color: '#60a5fa' },
  { threshold: 100_000, color: '#3b82f6' },
  { threshold: 250_000, color: '#1d4ed8' },
  { threshold: 500_000, color: '#1e3a8a' },
];

const DEFAULT_COLOR = '#f0f9ff';

const AVAILABLE_YEARS = [
  2000, 2005, 2010, 2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050,
] as const;

type Year = (typeof AVAILABLE_YEARS)[number];

/** Approximate population of São Paulo Municipality (2020 estimate) — used as denominator for percentage calculations. */
const SAO_PAULO_POPULATION = 12_272_000;

const fmtPop = (v: number) => {
  return `${(v / 1_000).toFixed(0)}k`;
};

/**
 * Custom formatter replicating range style with the variable name alongside
 * each label. Demonstrates the 'custom' escape hatch with a named formatter
 * variable — the `formatter` function receives `(lower, upper, index)` and
 * the `extended` suffix is applied automatically via `withSuffix`.
 */
const numeratorLabel = 'inhabitants';
const customRangeFormatter = (
  lower: number | null,
  upper: number | null,
  _index: number
): string => {
  const fmt = (v: number) => {
    return `${(v / 1_000).toFixed(0)}k`;
  };
  if (lower === null) return `0 - ${fmt(upper!)} ${numeratorLabel}`;
  if (upper === null) return `${fmt(lower!)} ${numeratorLabel} or more`;
  return `${fmt(lower!)} – ${fmt(upper!)} ${numeratorLabel}`;
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

const getDistrictValue = (
  entry: DistrictEntry,
  dataProperty: DataProperty
): number => {
  switch (dataProperty) {
    case 'men':
      return Object.values(entry.men).reduce((sum, value) => {
        return sum + value;
      }, 0);
    case 'women':
      return Object.values(entry.women).reduce((sum, value) => {
        return sum + value;
      }, 0);
    case 'total':
    default:
      return entry.total;
  }
};

const resolveLegendPosition = (
  legendPosition: LegendPositionControl
): LegendPosition | undefined => {
  return legendPosition === 'none' ? undefined : legendPosition;
};

const resolveThresholdSteps = ({
  labelFormatType,
  thresholdPreset,
}: {
  labelFormatType: LabelFormatType;
  thresholdPreset: ThresholdPreset;
}): ColorStep[] => {
  if (labelFormatType === 'labels' || thresholdPreset === 'ibge') {
    return populationStepsIBGE;
  }
  return populationSteps;
};

const resolveNormalization = ({
  labelFormatType,
  normalizationType,
}: {
  labelFormatType: LabelFormatType;
  normalizationType: NormalizationType;
}): NormalizationSpec => {
  if (labelFormatType === 'percentage' || normalizationType === 'percentage') {
    return {
      type: 'percentage',
      numeratorLabel: 'inhabitants',
      denominatorLabel: 'São Paulo Municipality',
    };
  }
  return {
    type: 'raw',
    numeratorLabel: 'inhabitants',
  };
};

export default {
  title: 'GeoVis/Fixtures/MunicipalDistrictMapData',
  tags: ['autodocs'],
  argTypes: {
    year: {
      control: { type: 'select' },
      options: AVAILABLE_YEARS,
      description: 'Census / projection year used in `mapData` rows',
    },
    dataProperty: {
      control: { type: 'select' },
      options: ['total', 'men', 'women'] satisfies DataProperty[],
      description:
        'District attribute joined via `mapData` (`total`, summed `men`, or summed `women`)',
    },
    abbreviate: {
      control: { type: 'boolean' },
      description: '`labelFormat.type: count` — abbreviate values (e.g. 50k)',
    },
    extended: {
      control: { type: 'boolean' },
      description:
        '`labelFormat.extended` — append normalization suffix to legend labels',
    },
    legendPosition: {
      control: { type: 'select' },
      options: [
        'none',
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ] satisfies LegendPositionControl[],
      description:
        '`legends[].position` — overlay corner; `none` keeps legend in document flow',
    },
    labelFormatType: {
      control: { type: 'select' },
      options: [
        'count',
        'range',
        'percentage',
        'stdDev',
        'custom',
        'labels',
      ] satisfies LabelFormatType[],
      description: '`legends[].labelFormat.type`',
    },
    noDataLabel: {
      control: { type: 'text' },
      description:
        '`legends[].noDataLabel` — empty string omits the no-data swatch',
    },
    thresholdPreset: {
      control: { type: 'select' },
      options: ['standard', 'ibge'] satisfies ThresholdPreset[],
      description:
        '`colorBy.thresholds` preset — IBGE urban classes or standard district bins',
    },
    showOutline: {
      control: { type: 'boolean' },
      description: '`layers[].visible` for the `districts-outline` line layer',
    },
    showClickAnchor: {
      control: { type: 'boolean' },
      description:
        'Toggle `layers[].clickAnchor` on the fill layer (click marker)',
    },
    hoverLineColor: {
      control: { type: 'color' },
      description: '`layers[].hoverPaint.lineColor`',
    },
    hoverLineWidth: {
      control: { type: 'range', min: 0, max: 8, step: 0.5 },
      description: '`layers[].hoverPaint.lineWidth`',
    },
    selectedLineColor: {
      control: { type: 'color' },
      description: '`layers[].selectedPaint.lineColor`',
    },
    selectedLineWidth: {
      control: { type: 'range', min: 0, max: 8, step: 0.5 },
      description: '`layers[].selectedPaint.lineWidth`',
    },
    clickAnchorColor: {
      control: { type: 'color' },
      description: '`layers[].clickAnchor.color`',
    },
    normalizationType: {
      control: { type: 'select' },
      options: ['raw', 'percentage'] satisfies NormalizationType[],
      description:
        '`legends[].normalization.type` — forced to `percentage` when `labelFormatType` is `percentage`',
    },
    basemapVisible: { control: 'boolean' },
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
  },
  args: {
    year: 2020,
    dataProperty: 'total',
    abbreviate: false,
    extended: false,
    legendPosition: 'none',
    labelFormatType: 'count',
    noDataLabel: '',
    thresholdPreset: 'standard',
    showOutline: true,
    showClickAnchor: true,
    hoverLineColor: '#333333',
    hoverLineWidth: 2,
    selectedLineColor: '#1a1a1a',
    selectedLineWidth: 3,
    clickAnchorColor: '#2171b5',
    normalizationType: 'raw',
    basemapVisible: true,
    showStateOutlines: true,
    showDistrictOutlines: true,
    showSubprefeituraOutlines: true,
    stateLineColor: '#374151',
    stateLineWidth: 1.5,
    districtLineColor: '#d1d5db',
    districtLineWidth: 0.5,
    subprefeituraLineColor: '#6b7280',
    subprefeituraLineWidth: 1.0,
  },
} satisfies Meta<MunicipalDistrictStoryArgs>;

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
/* eslint-disable max-lines-per-function, max-lines */
const MunicipalDistrictMapDataRender = (props: MunicipalDistrictStoryArgs) => {
  const {
    year,
    showStateOutlines,
    showDistrictOutlines,
    showSubprefeituraOutlines,
    stateLineColor,
    stateLineWidth,
    districtLineColor,
    districtLineWidth,
    subprefeituraLineColor,
    subprefeituraLineWidth,
    dataProperty,
    abbreviate,
    extended,
    legendPosition,
    labelFormatType,
    noDataLabel,
    thresholdPreset,
    basemapVisible,
    showOutline,
    showClickAnchor,
    hoverLineColor,
    hoverLineWidth,
    selectedLineColor,
    selectedLineWidth,
    clickAnchorColor,
    normalizationType,
  } = props;

  const position = resolveLegendPosition(legendPosition);
  const trimmedNoDataLabel = noDataLabel.trim() || undefined;
  const [populationData, setPopulationData] = React.useState<Record<
    string,
    Record<string, DistrictEntry>
  > | null>(null);
  const [districtGeoJson, setDistrictGeoJson] =
    React.useState<GeoJSONFeatureCollection | null>(null);

  React.useEffect(() => {
    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

  const mapDataEntries = React.useMemo(() => {
    if (!populationData) return [];
    const yearData = populationData[String(year)];
    if (!yearData) return [];
    return Object.entries(yearData).map(([districtId, entry]) => {
      return {
        geometryId: districtId,
        value: getDistrictValue(entry as DistrictEntry, dataProperty),
      };
    });
  }, [populationData, year, dataProperty]);

  const getLabelFormat = (): LabelFormatSpec => {
    switch (labelFormatType) {
      case 'range':
        return { type: 'range', separator: ' ≤ ', extended };
      case 'percentage':
        return {
          type: 'percentage',
          decimals: 1,
          denominator: SAO_PAULO_POPULATION,
          extended,
        };
      case 'stdDev':
        return { type: 'stdDev', unit: 'σ', extended };
      case 'custom':
        return { type: 'custom', formatter: customRangeFormatter, extended };
      case 'labels':
        // Explicit labels using IBGE urban classification for São Paulo districts.
        // Based on official Brazilian census categorization: Rural → Small Settlement →
        // Medium City → Large City → Metropolitan → Mega Metropolitan.
        return {
          type: 'labels',
          labels: [
            'Rural',
            'Small Settlement',
            'Medium City',
            'Large City',
            'Metropolitan',
            'Mega Metropolitan',
          ],
          extended,
        };
      case 'count':
      default:
        return { type: 'count', abbreviate, extended };
    }
  };

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

  const specInput = React.useMemo<VisualizationSpec>(() => {
    const effectiveSteps = resolveThresholdSteps({
      labelFormatType,
      thresholdPreset,
    });
    const effectiveBreaks = effectiveSteps.map((step) => {
      return step.threshold;
    });

    return {
      id: 'municipal-district-mapdata',
      engine: 'maplibre',
      basemap: {
        visible: basemapVisible,
      },
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
          hoverPaint: { lineColor: hoverLineColor, lineWidth: hoverLineWidth },
          selectedPaint: {
            lineColor: selectedLineColor,
            lineWidth: selectedLineWidth,
          },
          ...(showClickAnchor && { clickAnchor: { color: clickAnchorColor } }),
        },
        {
          id: 'districts-outline',
          sourceId: 'districts',
          geometry: 'line',
          visible: showOutline,
          paint: { lineColor: '#93c5fd', lineWidth: 0.5 },
        },
      ],
      legends: [
        {
          id: 'population',
          title: 'Population by district',
          subtitle: `São Paulo Municipality (SMUL/GEOINFO, 2000–2050 projection)`,
          labelFormat: getLabelFormat(),
          normalization: resolveNormalization({
            labelFormatType,
            normalizationType,
          }),
          reference:
            'Population by district, {link:São Paulo Municipality (SMUL/GEOINFO, 2000–2050 projection)|https://example.com}',
          ...(trimmedNoDataLabel && { noDataLabel: trimmedNoDataLabel }),
          ...(position && { position }),
          colorBy: {
            type: 'quantitative',
            property: 'value',
            scale: 'threshold',
            thresholds: effectiveBreaks,
            colors: [
              DEFAULT_COLOR,
              ...effectiveSteps.map((step) => {
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
  }, [
    districtGeoJson,
    mapDataEntries,
    labelFormatType,
    abbreviate,
    extended,
    position,
    trimmedNoDataLabel,
    thresholdPreset,
    basemapVisible,
    showOutline,
    showClickAnchor,
    hoverLineColor,
    hoverLineWidth,
    selectedLineColor,
    selectedLineWidth,
    clickAnchorColor,
    normalizationType,
  ]);

  const { spec, toggle, isVisible } = useBoundaryToggle(
    specInput,
    boundaryGroups
  );

  const districtsGroupRef = React.useRef(districtsGroup);
  const stateGroupRef = React.useRef(stateGroup);
  const subprefeituraGroupRef = React.useRef(subprefeituraGroup);

  React.useEffect(() => {
    districtsGroupRef.current = districtsGroup;
  }, [districtsGroup]);
  React.useEffect(() => {
    stateGroupRef.current = stateGroup;
  }, [stateGroup]);
  React.useEffect(() => {
    subprefeituraGroupRef.current = subprefeituraGroup;
  }, [subprefeituraGroup]);

  React.useEffect(() => {
    if (showDistrictOutlines !== isVisible(districtsGroupRef.current))
      toggle(districtsGroupRef.current);
  }, [showDistrictOutlines, toggle, isVisible]);
  React.useEffect(() => {
    if (showStateOutlines !== isVisible(stateGroupRef.current))
      toggle(stateGroupRef.current);
  }, [showStateOutlines, toggle, isVisible]);
  React.useEffect(() => {
    if (showSubprefeituraOutlines !== isVisible(subprefeituraGroupRef.current))
      toggle(subprefeituraGroupRef.current);
  }, [showSubprefeituraOutlines, toggle, isVisible]);

  // When the GeoVisLegend is overlaid at a corner (16rem wide, ~285px tall),
  // shift the fitBounds padding so São Paulo is centred in the VISIBLE area,
  // not behind the legend.  Values: 16rem ≈ 256px + 12px padding + 12px gap.
  const fitInsets = React.useMemo(() => {
    if (!position) return undefined;
    const w = 280; // legend width inset (px)
    const h = 285; // legend height inset (px)
    const pad = 40; // standard padding on the uncovered sides
    const isLeft = position.includes('left');
    const isTop = position.includes('top');
    return {
      top: isTop ? h : pad,
      bottom: isTop ? pad : h,
      left: isLeft ? w : pad,
      right: isLeft ? pad : w,
    };
  }, [position]);

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
            São Paulo — {dataProperty} {year}
          </MapLabel>
          <GeoVisCanvas
            viewId="primary"
            style={{ width: '100%', height: '100%' }}
          />
          <FitBoundsToBbox bbox={districtBbox} overlayInsets={fitInsets} />
          <GeoVisHoverTooltip
            render={(info) => {
              const district =
                populationData?.[String(year)]?.[String(info.featureId)];
              const value =
                district !== undefined
                  ? getDistrictValue(district, dataProperty)
                  : info.value;
              return (
                <>
                  <div style={{ fontWeight: 600 }}>
                    {district?.districtName ??
                      `District #${String(info.featureId)}`}
                  </div>
                  <div>
                    {typeof value === 'number'
                      ? `${fmtPop(value)} inhabitants`
                      : 'No data'}
                  </div>
                </>
              );
            }}
          />
          {!position && (
            <MapOverlayLegend
              label={`${dataProperty} population`}
              defaultColor={DEFAULT_COLOR}
              steps={resolveThresholdSteps({
                labelFormatType,
                thresholdPreset,
              })}
              formatValue={fmtPop}
            />
          )}
          {position && (
            <GeoVisLegend legendId="population" formatValue={fmtPop} />
          )}
        </div>
        {!position && (
          <GeoVisLegend legendId="population" formatValue={fmtPop} />
        )}
      </GeoVisProvider>
    </div>
  );
};

/** Choropleth of São Paulo districts coloured by population with boundary toggles and labelFormat support. */
export const MunicipalDistrictMapData: StoryFn<MunicipalDistrictStoryArgs> = (
  props
) => {
  return <MunicipalDistrictMapDataRender {...props} />;
};

/** Variation with labelFormat type='range' (abbreviated and extended) */
export const WithRangeLabel = MunicipalDistrictMapData.bind({});
WithRangeLabel.args = {
  year: 2020,
  abbreviate: true,
  extended: true,
  legendPosition: 'none',
  labelFormatType: 'range',
};

/** Variation with labelFormat type='percentage' (denominator=300k, extended). */
export const WithPercentageLabel = MunicipalDistrictMapData.bind({});
WithPercentageLabel.args = {
  year: 2020,
  abbreviate: false,
  extended: true,
  legendPosition: 'none',
  labelFormatType: 'percentage',
};

/** Variation with labelFormat type='stdDev' (abbreviated and extended) */
export const WithStdDevLabel = MunicipalDistrictMapData.bind({});
WithStdDevLabel.args = {
  year: 2020,
  abbreviate: true,
  extended: true,
  legendPosition: 'none',
  labelFormatType: 'stdDev',
};

/** Variation with range label format, positioned legend at bottom-left and no-data label */
export const WithPositionedLegend = MunicipalDistrictMapData.bind({});
WithPositionedLegend.args = {
  year: 2020,
  abbreviate: true,
  extended: true,
  legendPosition: 'bottom-left',
  labelFormatType: 'range',
  noDataLabel: 'No data',
};

/**
 * Variation with a custom formatter (named variable `customRangeFormatter`)
 * that replicates range style and appends the variable name alongside each label.
 * Demonstrates that `type: 'custom'` accepts any TypeScript-driven formatter function.
 */
export const WithCustomLabel = MunicipalDistrictMapData.bind({});
WithCustomLabel.args = {
  year: 2020,
  abbreviate: false,
  extended: false,
  legendPosition: 'none',
  labelFormatType: 'custom',
};

/**
 * Variation with `type: 'labels'` — explicit, human-readable strings for each
 * population bin. No numeric formatting involved; the spec author controls the
 * exact label text. Demonstrates the JSON-serialisable alternative to `'custom'`.
 */
export const WithLabelsFormat = MunicipalDistrictMapData.bind({});
WithLabelsFormat.args = {
  year: 2020,
  abbreviate: false,
  extended: false,
  legendPosition: 'none',
  labelFormatType: 'labels',
  thresholdPreset: 'ibge',
  noDataLabel: 'No data',
};
