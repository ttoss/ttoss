import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  LabelFormatSpec,
  LegendPosition,
  NormalizationSpec,
  VisualizationSpec,
} from '@ttoss/geovis';
import { GeoVisLegend, GeoVisProvider } from '@ttoss/geovis';

const baseSpec: VisualizationSpec = {
  id: 'legend-visual-test',
  engine: 'maplibre',
  view: { center: [0, 0], zoom: 1 },
  sources: [
    {
      id: 'empty',
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    },
  ],
  layers: [{ id: 'fill', sourceId: 'empty', geometry: 'polygon' }],
};

const populationThresholds = [50_000, 100_000, 250_000];
const populationColors = ['#dbeafe', '#60a5fa', '#1d4ed8', '#1e3a8a'];

type StoryArgs = {
  legendId: string;
  title: string;
  subtitle: string;
  labelFormat: LabelFormatSpec | undefined;
  normalization: NormalizationSpec | undefined;
  thresholds: number[];
  colors: string[];
  position: LegendPosition | undefined;
  noDataLabel: string;
  formatValue: boolean;
};

const LegendStory: StoryFn<StoryArgs> = (args) => {
  const spec: VisualizationSpec = {
    ...baseSpec,
    legends: [
      {
        id: args.legendId,
        title: args.title || undefined,
        subtitle: args.subtitle || undefined,
        labelFormat: args.labelFormat,
        normalization: args.normalization,
        position: args.position,
        noDataLabel: args.noDataLabel || undefined,
        colorBy: {
          type: 'quantitative',
          property: 'value',
          scale: 'threshold',
          thresholds: args.thresholds,
          colors: args.colors,
        },
      },
    ],
  };

  return (
    <GeoVisProvider spec={spec}>
      <div
        style={{
          position: 'relative',
          width: '20rem',
          minHeight: '16rem',
          padding: 16,
          background: '#f3f4f6',
        }}
      >
        <GeoVisLegend
          legendId={args.legendId}
          formatValue={
            args.formatValue
              ? (v) => {
                  return v.toLocaleString('en-US');
                }
              : undefined
          }
        />
      </div>
    </GeoVisProvider>
  );
};

export default {
  title: 'GeoVis/GeoVisLegend',
  component: LegendStory,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    position: {
      control: 'select',
      options: ['none', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
    },
    noDataLabel: { control: 'text' },
    formatValue: { control: 'boolean' },
  },
} satisfies Meta<typeof LegendStory>;

/** Default range format with thousands separators (no abbreviation). */
export const DefaultRange: StoryFn<StoryArgs> = LegendStory.bind({});
DefaultRange.args = {
  legendId: 'population',
  title: 'Population',
  subtitle: 'Residents per district',
  labelFormat: undefined,
  normalization: undefined,
  thresholds: populationThresholds,
  colors: populationColors,
  position: undefined,
  noDataLabel: '',
  formatValue: false,
};

/** Count format with abbreviation (50k, 100k, etc.). */
export const CountAbbreviated: StoryFn<StoryArgs> = LegendStory.bind({});
CountAbbreviated.args = {
  legendId: 'population',
  title: 'Population',
  subtitle: '',
  labelFormat: { type: 'count', abbreviate: true },
  normalization: undefined,
  thresholds: populationThresholds,
  colors: populationColors,
  position: undefined,
  noDataLabel: '',
  formatValue: false,
};

/** Count format without abbreviation — shows thousands separators. */
export const CountNonAbbreviated: StoryFn<StoryArgs> = LegendStory.bind({});
CountNonAbbreviated.args = {
  legendId: 'population',
  title: 'Population',
  subtitle: 'Full numeric display with locale separators',
  labelFormat: { type: 'count', abbreviate: false },
  normalization: undefined,
  thresholds: populationThresholds,
  colors: populationColors,
  position: undefined,
  noDataLabel: '',
  formatValue: false,
};

/** Count format with extended normalization suffix. */
export const CountWithNormalization: StoryFn<StoryArgs> = LegendStory.bind({});
CountWithNormalization.args = {
  legendId: 'incidence',
  title: 'Incidence Rate',
  subtitle: '',
  labelFormat: { type: 'count', abbreviate: true, extended: true },
  normalization: {
    type: 'rate',
    numeratorLabel: 'cases',
    denominatorLabel: 'inhabitants',
    rateBase: 100_000,
  },
  thresholds: [10, 50, 100],
  colors: ['#dbeafe', '#60a5fa', '#1d4ed8', '#1e3a8a'],
  position: undefined,
  noDataLabel: '',
  formatValue: false,
};

/** Percentage format with 1 decimal place. */
export const Percentage: StoryFn<StoryArgs> = LegendStory.bind({});
Percentage.args = {
  legendId: 'coverage',
  title: 'Coverage',
  subtitle: '',
  labelFormat: { type: 'percentage', decimals: 1, denominator: 1 },
  normalization: undefined,
  thresholds: [0.2, 0.5, 0.8],
  colors: ['#dbeafe', '#60a5fa', '#1d4ed8', '#1e3a8a'],
  position: undefined,
  noDataLabel: '',
  formatValue: false,
};

/** Standard deviation format with sigma symbol. */
export const StdDev: StoryFn<StoryArgs> = LegendStory.bind({});
StdDev.args = {
  legendId: 'deviation',
  title: 'Deviation',
  subtitle: '',
  labelFormat: { type: 'stdDev' },
  normalization: undefined,
  thresholds: [-1, 0, 1],
  colors: ['#ef4444', '#fbbf24', '#22c55e', '#3b82f6'],
  position: undefined,
  noDataLabel: '',
  formatValue: false,
};

/** Range format with custom separator and unit. */
export const RangeWithUnit: StoryFn<StoryArgs> = LegendStory.bind({});
RangeWithUnit.args = {
  legendId: 'area',
  title: 'Area',
  subtitle: '',
  labelFormat: { type: 'range', separator: ' – ', unit: ' km²' },
  normalization: undefined,
  thresholds: [100, 500, 1000],
  colors: ['#dbeafe', '#60a5fa', '#1d4ed8', '#1e3a8a'],
  position: undefined,
  noDataLabel: '',
  formatValue: false,
};

/** Legend with no-data swatch at the bottom. */
export const WithNoDataLabel: StoryFn<StoryArgs> = LegendStory.bind({});
WithNoDataLabel.args = {
  legendId: 'population',
  title: 'Population',
  subtitle: '',
  labelFormat: { type: 'count', abbreviate: true },
  normalization: undefined,
  thresholds: populationThresholds,
  colors: populationColors,
  position: undefined,
  noDataLabel: 'No data available',
  formatValue: false,
};

/** Legend positioned at bottom-right. */
export const WithPosition: StoryFn<StoryArgs> = LegendStory.bind({});
WithPosition.args = {
  legendId: 'population',
  title: 'Population',
  subtitle: '',
  labelFormat: { type: 'count', abbreviate: true },
  normalization: undefined,
  thresholds: populationThresholds,
  colors: populationColors,
  position: 'bottom-right',
  noDataLabel: '',
  formatValue: false,
};

/** Legend with explicit formatValue callback overriding defaults. */
export const WithCustomFormatValue: StoryFn<StoryArgs> = LegendStory.bind({});
WithCustomFormatValue.args = {
  legendId: 'population',
  title: 'Population',
  subtitle: 'Custom formatValue: abbreviated with "k" suffix',
  labelFormat: undefined,
  normalization: undefined,
  thresholds: populationThresholds,
  colors: populationColors,
  position: undefined,
  noDataLabel: '',
  formatValue: true,
};
