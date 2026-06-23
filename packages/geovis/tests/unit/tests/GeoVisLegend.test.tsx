/**
 * @jest-environment jsdom
 */

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { act, render } from '@testing-library/react';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';
import { GeoVisLegend } from 'src/ui/GeoVisLegend';

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
  test('returns null when legendId does not resolve', async () => {
    const { container } = render(
      <GeoVisProvider spec={baseSpec}>
        <GeoVisLegend legendId="missing" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(container.firstChild).toBeNull();
  });

  test('renders categorical swatches from explicit mapping', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'status',
          title: 'Status',
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

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getByText('open')).toBeTruthy();
    expect(getByText('closed')).toBeTruthy();
    expect(getAllByRole('listitem')).toHaveLength(2);
    // Should never render interactive elements.
    expect(queryByRole('button')).toBeNull();
  });

  test('renders quantitative bins using externally provided breaks', async () => {
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

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    // Two unique finite breaks → 3 bins (< first, range, > last).
    expect(getAllByRole('listitem')).toHaveLength(3);
    expect(getByText('< 20k')).toBeTruthy();
    expect(getByText('20k - 30k')).toBeTruthy();
    expect(getByText('> 30k')).toBeTruthy();
  });

  test('renders single quantitative bin when no breaks are provided', async () => {
    // `breaks` omitted AND no spec thresholds → falls back to [] → "All values".
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

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getAllByRole('listitem')).toHaveLength(1);
    expect(getByText('All values')).toBeTruthy();
  });

  test('renders single quantitative bin when breaks={[]} is explicitly passed even if spec has thresholds', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [100, 200, 300],
            colors: ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8'],
          },
        },
      ],
    };

    const { getAllByRole, getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="population" breaks={[]} />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    // Explicit [] bypasses the 3 spec thresholds → single "All values" bin.
    expect(getAllByRole('listitem')).toHaveLength(1);
    expect(getByText('All values')).toBeTruthy();
  });

  test('resolves legend defined at the layer level when not at top level', async () => {
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

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getByText('a')).toBeTruthy();
  });

  test('renders a single "All" swatch with the adapter fallback color when categorical mapping is empty', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'kind',
          colorBy: {
            type: 'categorical',
            property: 'kind',
            mapping: {},
            defaultColor: '#abcdef',
          },
        },
      ],
    };

    const { getAllByRole, getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="kind" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    const items = getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(getByText('All')).toBeTruthy();
    const swatch = items[0].querySelector('span[aria-hidden="true"]');
    expect(swatch).not.toBeNull();
    expect((swatch as HTMLElement).style.backgroundColor).toBe(
      'rgb(171, 205, 239)'
    );
  });

  test('quantitative fallback follows the adapter chain (defaultColor ?? palette[0])', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            colors: ['#112233', '#445566'],
          },
        },
      ],
    };

    const { getAllByRole } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="population" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    const items = getAllByRole('listitem');
    expect(items).toHaveLength(1);
    const swatch = items[0].querySelector('span[aria-hidden="true"]');
    expect((swatch as HTMLElement).style.backgroundColor).toBe(
      'rgb(17, 34, 51)'
    );
  });

  test('derives breaks from spec thresholds when no breaks prop is provided', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [100, 200, 300],
            colors: ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8'],
          },
        },
      ],
    };

    const { getAllByRole, getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend
          legendId="population"
          formatValue={(v) => {
            return `${v}`;
          }}
        />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    // 3 thresholds → 4 bins; legend must derive them from the spec.
    expect(getAllByRole('listitem')).toHaveLength(4);
    expect(getByText('< 100')).toBeTruthy();
    expect(getByText('100 - 200')).toBeTruthy();
    expect(getByText('200 - 300')).toBeTruthy();
    expect(getByText('> 300')).toBeTruthy();
  });
});

describe('GeoVisLegend — title and subtitle', () => {
  test('renders title above the list', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'pop',
          title: 'Population',
          colorBy: {
            type: 'categorical',
            property: 'pop',
            mapping: { low: '#ccc' },
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

    expect(getByText('Population')).toBeTruthy();
  });

  test('renders subtitle below title when provided', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'pop',
          title: 'Population',
          subtitle: 'Residents per district',
          colorBy: {
            type: 'categorical',
            property: 'pop',
            mapping: { low: '#ccc' },
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

    expect(getByText('Residents per district')).toBeTruthy();
  });

  test('does not render title or subtitle elements when absent', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'pop',
          colorBy: {
            type: 'categorical',
            property: 'pop',
            mapping: { low: '#ccc' },
          },
        },
      ],
    };

    const { queryByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="pop" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(queryByText('Population')).toBeNull();
    expect(queryByText('Residents per district')).toBeNull();
  });
});

describe('GeoVisLegend — noDataLabel', () => {
  test('renders noDataLabel item at the bottom of the list', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'status',
          noDataLabel: 'No data',
          colorBy: {
            type: 'categorical',
            property: 'status',
            mapping: { open: '#16a34a' },
          },
        },
      ],
    };

    const { getAllByRole, getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="status" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    // 1 mapping entry + 1 noDataLabel = 2 list items
    expect(getAllByRole('listitem')).toHaveLength(2);
    expect(getByText('No data')).toBeTruthy();
  });

  test('does not render noDataLabel item when absent', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'status',
          colorBy: {
            type: 'categorical',
            property: 'status',
            mapping: { open: '#16a34a' },
          },
        },
      ],
    };

    const { getAllByRole, queryByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="status" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getAllByRole('listitem')).toHaveLength(1);
    expect(queryByText('No data')).toBeNull();
  });
});

describe('GeoVisLegend — reference field', () => {
  test('renders plain text reference below legend items', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'status',
          reference: 'Data: Census Bureau 2020',
          colorBy: {
            type: 'categorical',
            property: 'status',
            mapping: { open: '#16a34a' },
          },
        },
      ],
    };

    const { getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="status" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getByText('Data: Census Bureau 2020')).toBeTruthy();
  });

  test('parses {link:text|url} markup in reference into anchor elements', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'status',
          reference: 'Source: {link:IBGE Censo|https://ibge.gov.br} 2022',
          colorBy: {
            type: 'categorical',
            property: 'status',
            mapping: { open: '#16a34a' },
          },
        },
      ],
    };

    const { container } = render(
      <ChakraProvider value={defaultSystem}>
        <GeoVisProvider spec={spec}>
          <GeoVisLegend legendId="status" />
        </GeoVisProvider>
      </ChakraProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('IBGE Censo');
    expect(link?.getAttribute('href')).toBe('https://ibge.gov.br');
    // The surrounding paragraph should contain the full text
    const para = container.querySelector('p:last-child');
    expect(para?.textContent).toContain('Source:');
    expect(para?.textContent).toContain('2022');
  });

  test('does not render reference element when reference is not provided', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'status',
          colorBy: {
            type: 'categorical',
            property: 'status',
            mapping: { open: '#16a34a' },
          },
        },
      ],
    };

    const { container } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="status" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(container.querySelector('p:last-child')).toBeNull();
  });

  test('sourceNode prop takes precedence over spec reference string', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'status',
          reference: 'Plain text reference',
          colorBy: {
            type: 'categorical',
            property: 'status',
            mapping: { open: '#16a34a' },
          },
        },
      ],
    };

    const { getByText, queryByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend
          legendId="status"
          sourceNode={<a href="https://example.com">Rich source link</a>}
        />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(getByText('Rich source link')).toBeTruthy();
    expect(queryByText('Plain text reference')).toBeNull();
  });
});

describe('GeoVisLegend — position', () => {
  test('applies absolute CSS positioning when position is set', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'status',
          position: 'bottom-right',
          colorBy: {
            type: 'categorical',
            property: 'status',
            mapping: { open: '#16a34a' },
          },
        },
      ],
    };

    const { container } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="status" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    const div = container.firstChild as HTMLElement;
    expect(div.style.position).toBe('absolute');
    expect(div.style.bottom).toBeTruthy();
    expect(div.style.right).toBeTruthy();
  });

  test('does not apply absolute positioning when position is omitted', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'status',
          colorBy: {
            type: 'categorical',
            property: 'status',
            mapping: { open: '#16a34a' },
          },
        },
      ],
    };

    const { container } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="status" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    const div = container.firstChild as HTMLElement;
    expect(div.style.position).toBe('');
  });
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
