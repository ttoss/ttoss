import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  VisualizationSpec,
} from '@ttoss/geovis';
import {
  GeoVisCanvas,
  GeoVisHoverTooltip,
  GeoVisLegend,
  GeoVisProvider,
} from '@ttoss/geovis';
import * as React from 'react';

import districtGeoJson from '../../../../packages/geovis/src/fixtures/distrito-municipal-v2.json';
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
  return `${(v / 1_000).toFixed(0)}k`;
};

/**
 * Custom formatter replicating range style with the variable name alongside
 * each label. Demonstrates the 'custom' escape hatch with a named formatter
 * variable — the `formatter` function receives `(lower, upper, index)` and
 * the `extended` suffix is applied automatically via `withSuffix`.
 */
const customRangeFormatter = (
  lower: number | null,
  upper: number | null
): string => {
  const fmt = (v: number) => {
    return `${(v / 1_000).toFixed(0)}k`;
  };
  if (lower === null) return `0 - ${fmt(upper!)} inhabitants`;
  if (upper === null) return `${fmt(lower!)} inhabitants or more`;
  return `${fmt(lower!)} – ${fmt(upper!)} inhabitants`;
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
/* eslint-disable react/prop-types, max-lines-per-function, max-lines, @typescript-eslint/no-explicit-any -- Storybook fixture story: TypeScript generics validate props, component integrates data + spec + UI, file contains comprehensive fixture data */
export const MunicipalDistrictMapData: StoryFn<{
  year: Year;
  abbreviate?: boolean;
  extended?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  labelFormatType?:
    | 'count'
    | 'range'
    | 'percentage'
    | 'stdDev'
    | 'auto'
    | 'custom';
  noDataLabel?: string;
}> = ({
  year,
  abbreviate = false,
  extended = false,
  position,
  labelFormatType = 'count',
  noDataLabel,
}) => {
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

  const getLabelFormat = (): any => {
    switch (labelFormatType) {
      case 'range':
        return { type: 'range', separator: ' ≤ ', extended };
      case 'percentage':
        return { type: 'percentage', decimals: 1, extended };
      case 'stdDev':
        return { type: 'stdDev', unit: 'σ', extended };
      case 'auto':
        return { type: 'auto', extended };
      case 'custom':
        return { type: 'custom', formatter: customRangeFormatter, extended };
      case 'count':
      default:
        return { type: 'count', abbreviate, extended };
    }
  };

  const spec = React.useMemo<VisualizationSpec>(() => {
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
          title: 'Population by district',
          subtitle: `São Paulo Municipality (SMUL/GEOINFO, 2000–2050 projection)`,
          classCount: populationBreaks.length + 1,
          labelFormat: getLabelFormat(),
          normalization: {
            type: 'raw',
            numeratorLabel: 'inhabitants',
          },
          reference:
            'Population by district, {link:São Paulo Municipality (SMUL/GEOINFO, 2000–2050 projection)|https://example.com}',
          ...(noDataLabel && { noDataLabel }),
          ...(position && { position }),
          colorBy: {
            type: 'quantitative',
            property: 'value',
            scale: 'threshold',
            thresholds: populationBreaks,
            classCount: populationBreaks.length + 1,
            // First color matches `defaultColor` so the legend swatch for the
            // "< first threshold" bin lines up with the in-map fill.
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
  }, [
    mapDataEntries,
    year,
    labelFormatType,
    abbreviate,
    extended,
    position,
    noDataLabel,
  ]);

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
          <MapLabel>São Paulo — population {year}</MapLabel>
          <GeoVisCanvas
            viewId="primary"
            style={{ width: '100%', height: '100%' }}
          />
          <FitBoundsToBbox bbox={DISTRICT_BBOX} overlayInsets={fitInsets} />
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
                      ? `${fmtPop(info.value)} inhabitants`
                      : 'No data'}
                  </div>
                </>
              );
            }}
          />
          {!position && (
            <MapOverlayLegend
              label="Total population"
              defaultColor={DEFAULT_COLOR}
              steps={populationSteps}
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

MunicipalDistrictMapData.argTypes = {
  year: {
    control: { type: 'select' },
    options: AVAILABLE_YEARS,
    description: 'Census / projection year',
  },
  abbreviate: {
    control: { type: 'boolean' },
    description: 'Abbreviate population counts (e.g., 50k instead of 50000)',
  },
  extended: {
    control: { type: 'boolean' },
    description:
      'Show extended labels with semantic suffixes (e.g., "inhabitants")',
  },
  position: {
    control: { type: 'select' },
    options: [
      undefined,
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
    ],
    description: 'Legend position overlay on the map',
  },
  labelFormatType: {
    control: { type: 'select' },
    options: ['count', 'range', 'percentage', 'stdDev', 'auto', 'custom'],
    description: 'Type of label format to use in the legend',
  },
  noDataLabel: {
    control: { type: 'text' },
    description: 'Label for features with no data value',
  },
};

MunicipalDistrictMapData.args = {
  year: 2020,
  abbreviate: false,
  extended: false,
  position: undefined,
  noDataLabel: undefined,
};

/** Variation with labelFormat type='range' (abbreviated and extended) */
export const WithRangeLabel = MunicipalDistrictMapData.bind({});
WithRangeLabel.args = {
  year: 2020,
  abbreviate: true,
  extended: true,
  position: undefined,
  labelFormatType: 'range',
};

/** Variation with labelFormat type='percentage' (denominator=300k, extended). */
export const WithPercentageLabel = MunicipalDistrictMapData.bind({});
WithPercentageLabel.args = {
  year: 2020,
  abbreviate: false,
  extended: true,
  position: undefined,
  labelFormatType: 'percentage',
};

/** Variation with labelFormat type='stdDev' (abbreviated and extended) */
export const WithStdDevLabel = MunicipalDistrictMapData.bind({});
WithStdDevLabel.args = {
  year: 2020,
  abbreviate: true,
  extended: true,
  position: undefined,
  labelFormatType: 'stdDev',
};

/** Variation with auto label format, positioned legend at bottom-left and no-data label */
export const WithPositionedLegend = MunicipalDistrictMapData.bind({});
WithPositionedLegend.args = {
  year: 2020,
  abbreviate: true,
  extended: true,
  position: 'bottom-left',
  labelFormatType: 'auto',
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
  position: undefined,
  labelFormatType: 'custom',
};
