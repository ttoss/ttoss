/**
 * @jest-environment jsdom
 */

/**
 * Legend rendering: header, swatches, bins, reference, position and container
 * style. Number and label formatting lives in
 * GeoVisLegend.labelFormat.test.tsx.
 */

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { act, render } from '@testing-library/react';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';
import { GeoVisLegend } from 'src/ui/GeoVisLegend';
import { buildContainerStyle } from 'src/ui/GeoVisLegend.utils';

import { baseSpec } from './geoVisLegendTestUtils';

// This suite mounts GeoVisProvider through `await act(async () => ...)` in
// every test (~20 in this file); on slower/CI runners the accumulated async
// render+effect flushes can exceed Jest's default 5s per-test timeout.
jest.setTimeout(30000);

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

  test('renders an icon chip, description, and footer value from the spec', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'farms',
          title: 'Farms',
          subtitle: 'Registered rural properties',
          icon: 'lucide:tractor',
          iconColor: '#0e9e6e',
          footerValue: '2024',
          reference: 'Source: IBGE',
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
          <GeoVisLegend legendId="farms" />
        </GeoVisProvider>
      </ChakraProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    // Icon chip renders the iconify glyph with the requested name.
    const icon = container.querySelector('[data-testid="iconify-icon"]');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('icon')).toBe('lucide:tractor');

    // Description (subtitle) and footer value are shown.
    expect(container.textContent).toContain('Registered rural properties');
    expect(container.textContent).toContain('2024');
  });

  test('renders a header with only a subtitle (no icon, no title)', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'farms',
          subtitle: 'Description only, no title or icon',
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
        <GeoVisLegend legendId="farms" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(container.textContent).toContain(
      'Description only, no title or icon'
    );
    // No title row renders, so there is no iconify chip.
    expect(container.querySelector('[data-testid="iconify-icon"]')).toBeNull();
  });

  test('renders a footer value without a reference', async () => {
    const spec: VisualizationSpec = {
      ...baseSpec,
      legends: [
        {
          id: 'farms',
          footerValue: '2024',
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
        <GeoVisLegend legendId="farms" />
      </GeoVisProvider>
    );

    await act(async () => {
      // Await for any pending state updates from GeoVisProvider
    });

    expect(container.textContent).toContain('2024');
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
    // The surrounding footer text should contain the full reference.
    const para = link?.closest('span');
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

    // With no reference and no footerValue, no footer section renders — the
    // swatch list is the card's last child.
    const list = container.querySelector('ul');
    expect(list).not.toBeNull();
    expect(list?.parentElement?.lastElementChild).toBe(list);
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

describe('buildContainerStyle — offset', () => {
  test('returns card chrome only (no positioning) when position is undefined', () => {
    const style = buildContainerStyle(undefined);
    expect(style.position).toBeUndefined();
    expect(style.width).toBe(276);
  });

  test('keeps the default edge gaps when no offset is given', () => {
    const style = buildContainerStyle('bottom-right');
    expect(style.position).toBe('absolute');
    expect(style.right).toBe(24);
    expect(style.bottom).toBe(24);
  });

  test('a numeric offset overrides both anchored edges', () => {
    const style = buildContainerStyle('bottom-right', 100);
    expect(style.right).toBe(100);
    expect(style.bottom).toBe(100);
    expect(style.transition).toContain('right');
  });

  test('an axis offset overrides only that edge, preserving the other default', () => {
    const style = buildContainerStyle('bottom-right', { x: 332 });
    expect(style.right).toBe(332);
    // y omitted → bottom keeps the default gap.
    expect(style.bottom).toBe(24);
  });

  test('resolves the correct edges for a top-left anchor', () => {
    const style = buildContainerStyle('top-left', { x: 40, y: 12 });
    expect(style.left).toBe(40);
    expect(style.top).toBe(12);
  });
});
