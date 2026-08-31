/**
 * @jest-environment jsdom
 */

/**
 * Legend label and number formatting: the labelFormat variants, locale
 * separators, normalization suffixes and the proportional-circle formatter.
 */

import { act, render } from '@testing-library/react';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';
import { GeoVisLegend } from 'src/ui/GeoVisLegend';

import { baseSpec } from './geoVisLegendTestUtils';

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

describe('GeoVisLegend — labelFormat: count', () => {
  test('renders count format with abbreviation', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'pop',
          labelFormat: { type: 'count', abbreviate: true },
          colorBy: {
            type: 'quantitative',
            property: 'pop',
            scale: 'threshold',
            thresholds: [50000, 100000, 250000],
            colors: ['#dbeafe', '#60a5fa', '#1d4ed8', '#1e3a8a'],
          },
        },
      ],
    };

    const { getAllByRole, getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="pop" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getAllByRole('listitem')).toHaveLength(4);
    expect(getByText('< 50k')).toBeTruthy();
    expect(getByText('50k ≤ 100k')).toBeTruthy();
    expect(getByText('100k ≤ 250k')).toBeTruthy();
    expect(getByText('> 250k')).toBeTruthy();
  });

  test('renders count format with extended normalization suffix', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'pop',
          labelFormat: { type: 'count', abbreviate: true, extended: true },
          normalization: { type: 'raw', numeratorLabel: 'inhabitants' },
          colorBy: {
            type: 'quantitative',
            property: 'pop',
            scale: 'threshold',
            thresholds: [50000],
            colors: ['#dbeafe', '#1d4ed8'],
          },
        },
      ],
    };

    const { getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="pop" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getByText('< 50k inhabitants')).toBeTruthy();
    expect(getByText('> 50k inhabitants')).toBeTruthy();
  });

  test('renders count format without abbreviation using locale separators', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'pop',
          labelFormat: { type: 'count', abbreviate: false },
          colorBy: {
            type: 'quantitative',
            property: 'pop',
            scale: 'threshold',
            thresholds: [50000, 100000, 250000],
            colors: ['#dbeafe', '#60a5fa', '#1d4ed8', '#1e3a8a'],
          },
        },
      ],
    };

    const { getAllByRole, getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="pop" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getAllByRole('listitem')).toHaveLength(4);
    expect(getByText('< 50,000')).toBeTruthy();
    expect(getByText('50,000 ≤ 100,000')).toBeTruthy();
    expect(getByText('100,000 ≤ 250,000')).toBeTruthy();
    expect(getByText('> 250,000')).toBeTruthy();
  });
});

describe('GeoVisLegend — default range with locale separators', () => {
  test('renders default range format with thousands separators when no formatValue is provided', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [10000, 50000, 100000],
            colors: ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8'],
          },
        },
      ],
    };

    const { getAllByRole, getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="population" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getAllByRole('listitem')).toHaveLength(4);
    expect(getByText('< 10,000')).toBeTruthy();
    expect(getByText('10,000 - 50,000')).toBeTruthy();
    expect(getByText('50,000 - 100,000')).toBeTruthy();
    expect(getByText('> 100,000')).toBeTruthy();
  });
});

describe('GeoVisLegend — labelFormat: percentage', () => {
  test('renders percentage format for [0-1] range values', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'coverage',
          labelFormat: { type: 'percentage', decimals: 0 },
          colorBy: {
            type: 'quantitative',
            property: 'coverage',
            scale: 'threshold',
            thresholds: [0.1, 0.5, 0.8],
            colors: ['#dbeafe', '#60a5fa', '#1d4ed8', '#1e3a8a'],
          },
        },
      ],
    };

    const { getAllByRole, getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="coverage" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getAllByRole('listitem')).toHaveLength(4);
    expect(getByText('< 10%')).toBeTruthy();
    expect(getByText('10% \u2013 50%')).toBeTruthy();
    expect(getByText('50% \u2013 80%')).toBeTruthy();
    expect(getByText('> 80%')).toBeTruthy();
  });
});

describe('GeoVisLegend — labelFormat: stdDev', () => {
  test('renders stdDev format with sigma symbol', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'deviation',
          labelFormat: { type: 'stdDev', unit: 'σ' },
          colorBy: {
            type: 'quantitative',
            property: 'deviation',
            scale: 'threshold',
            thresholds: [-1, 0, 1],
            colors: ['#1d4ed8', '#60a5fa', '#f9a8d4', '#dc2626'],
          },
        },
      ],
    };

    const { getAllByRole } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend
          legendId="deviation"
          formatValue={(v) => {
            return String(v);
          }}
        />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getAllByRole('listitem')).toHaveLength(4);
  });
});

describe('GeoVisLegend — labelFormat: custom', () => {
  test('renders custom formatter output', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'area',
          labelFormat: {
            type: 'custom',
            formatter: (lo, hi, i) => {
              if (i === 0) return `up to ${hi} km²`;
              if (hi === null) return `> ${lo} km²`;
              return `${lo}–${hi} km²`;
            },
          },
          colorBy: {
            type: 'quantitative',
            property: 'area',
            scale: 'threshold',
            thresholds: [100, 500],
            colors: ['#dbeafe', '#60a5fa', '#1d4ed8'],
          },
        },
      ],
    };

    const { getAllByRole, getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="area" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getAllByRole('listitem')).toHaveLength(3);
    expect(getByText('up to 100 km²')).toBeTruthy();
    expect(getByText('100–500 km²')).toBeTruthy();
    expect(getByText('> 500 km²')).toBeTruthy();
  });
});

describe('GeoVisLegend — labelFormat: range', () => {
  test('renders range format with custom separator and unit', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'dist',
          labelFormat: { type: 'range', separator: ' to ', unit: ' km' },
          colorBy: {
            type: 'quantitative',
            property: 'dist',
            scale: 'threshold',
            thresholds: [10, 50],
            colors: ['#dbeafe', '#60a5fa', '#1d4ed8'],
          },
        },
      ],
    };

    const { getAllByRole, getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend
          legendId="dist"
          formatValue={(v) => {
            return String(v);
          }}
        />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getAllByRole('listitem')).toHaveLength(3);
    expect(getByText('< 10 km')).toBeTruthy();
    expect(getByText('10 km to 50 km')).toBeTruthy();
    expect(getByText('> 50 km')).toBeTruthy();
  });
});

describe('GeoVisLegend — normalization extended suffix', () => {
  test('rate normalization extended suffix', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'incidence',
          labelFormat: { type: 'count', extended: true },
          normalization: {
            type: 'rate',
            numeratorLabel: 'cases',
            denominatorLabel: 'inhabitants',
            rateBase: 100000,
          },
          colorBy: {
            type: 'quantitative',
            property: 'incidence',
            scale: 'threshold',
            thresholds: [10],
            colors: ['#dbeafe', '#1d4ed8'],
          },
        },
      ],
    };

    const { container } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="incidence" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    // Labels should have the rate suffix appended
    const items = container.querySelectorAll('li span:last-child');
    expect(items.length).toBeGreaterThan(0);
    const texts = Array.from(items).map((el) => {
      return el.textContent ?? '';
    });
    expect(
      texts.some((t) => {
        return t.includes('cases') && t.includes('inhabitants');
      })
    ).toBe(true);
  });
});

describe('GeoVisLegend — proportional circles default formatter', () => {
  const circlesSpec: VisualizationSpec = {
    id: 'circles-spec',
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    scaleMaxValue: 500000,
    sources: [
      {
        id: 'points',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    legends: [
      {
        id: 'pop',
        title: 'Population',
        colorBy: {
          type: 'quantitative',
          property: 'value',
          scale: 'threshold',
          thresholds: [100, 200],
          colors: ['#dbeafe', '#60a5fa', '#1d4ed8'],
        },
      },
    ],
    layers: [
      {
        id: 'points-layer',
        sourceId: 'points',
        geometry: 'point',
        activeLegendId: 'pop',
        sizeBy: { range: [4, 36], transform: 'sqrt' },
      },
    ],
  };

  test('uses the compact formatter by default for circle reference labels', async () => {
    const { getByText } = render(
      <GeoVisProvider spec={circlesSpec}>
        <GeoVisLegend legendId="pop" />
      </GeoVisProvider>
    );
    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });
    // 500000 -> "500k", not "500,000"
    expect(getByText('≥ 500k')).toBeTruthy();
  });

  test('an explicit formatValue prop overrides the compact default', async () => {
    const { getByText } = render(
      <GeoVisProvider spec={circlesSpec}>
        <GeoVisLegend
          legendId="pop"
          formatValue={(v) => {
            return `${v} ppl`;
          }}
        />
      </GeoVisProvider>
    );
    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });
    expect(getByText('≥ 500000 ppl')).toBeTruthy();
  });
});
