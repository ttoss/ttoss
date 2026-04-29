/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import { GeoVisLegend } from 'src/react/GeoVisLegend';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';

jest.mock('src/adapters/maplibre/MapLibreAdapter', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      return {
        id: 'maplibre',
        getCapabilities: jest.fn(),
        mount: jest.fn(() => {
          return { viewId: 'v', container: {}, destroy: jest.fn() };
        }),
        update: jest.fn(),
        destroy: jest.fn(),
        getNativeInstance: jest.fn(() => {
          return null;
        }),
      };
    }),
  };
});

const baseSpec: VisualizationSpec = {
  id: 'legend-spec',
  engine: 'maplibre',
  view: { center: [0, 0], zoom: 1 },
  sources: [
    {
      id: 'states',
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    },
  ],
  layers: [{ id: 'fill', sourceId: 'states', geometry: 'polygon' }],
};

describe('GeoVisLegend', () => {
  test('returns null when legendId does not resolve', () => {
    const { container } = render(
      <GeoVisProvider spec={baseSpec}>
        <GeoVisLegend legendId="missing" />
      </GeoVisProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  test('renders categorical swatches from explicit mapping', () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'status',
          label: 'Status',
          colorBy: {
            type: 'categorical',
            property: 'status',
            mapping: {
              open: '#16a34a',
              closed: '#dc2626',
            },
          },
        },
      ],
    };

    const { getByText, getAllByRole, queryByRole } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="status" />
      </GeoVisProvider>
    );

    expect(getByText('open')).toBeTruthy();
    expect(getByText('closed')).toBeTruthy();
    expect(getAllByRole('listitem')).toHaveLength(2);
    // Should never render interactive elements.
    expect(queryByRole('button')).toBeNull();
  });

  test('renders quantitative bins using externally provided breaks', () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [10, 20, 30],
            colors: ['#dbeafe', '#60a5fa', '#1d4ed8', '#1e3a8a'],
            defaultColor: '#9ca3af',
          },
        },
      ],
    };

    const { getAllByRole, getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend
          legendId="population"
          breaks={[20, 30, NaN, 30]}
          formatValue={(v) => {
            return `${v}k`;
          }}
        />
      </GeoVisProvider>
    );

    // Two unique finite breaks → 3 bins (< first, range, >= last).
    expect(getAllByRole('listitem')).toHaveLength(3);
    expect(getByText('< 20k')).toBeTruthy();
    expect(getByText('20k - < 30k')).toBeTruthy();
    expect(getByText('>= 30k')).toBeTruthy();
  });

  test('renders single quantitative bin when no breaks are provided', () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
          },
        },
      ],
    };

    const { getAllByRole, getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="population" />
      </GeoVisProvider>
    );

    expect(getAllByRole('listitem')).toHaveLength(1);
    expect(getByText('All values')).toBeTruthy();
  });

  test('resolves legend defined at the layer level when not at top level', () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      layers: [
        {
          id: 'fill',
          sourceId: 'states',
          geometry: 'polygon',
          legends: [
            {
              id: 'kind',
              colorBy: {
                type: 'categorical',
                property: 'kind',
                mapping: { a: '#000' },
              },
            },
          ],
        },
      ],
    };

    const { getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="kind" />
      </GeoVisProvider>
    );

    expect(getByText('a')).toBeTruthy();
  });
});
