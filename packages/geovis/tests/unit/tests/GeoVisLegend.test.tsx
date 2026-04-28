/**
 * @jest-environment jsdom
 */

import { fireEvent, render } from '@testing-library/react';
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
  test('renders categorical swatches and toggles bin disabled state on click', () => {
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

    const { getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="status" />
      </GeoVisProvider>
    );

    expect(getByText('open')).toBeTruthy();
    expect(getByText('closed')).toBeTruthy();

    const openItem = getByText('open').closest('button');
    expect(openItem).toBeTruthy();
    expect(openItem?.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(openItem as HTMLButtonElement);
    expect(openItem?.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(openItem as HTMLButtonElement);
    expect(openItem?.getAttribute('aria-pressed')).toBe('false');
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
            scale: 'quantile',
            bins: 3,
            colors: ['#dbeafe', '#60a5fa', '#1d4ed8'],
            defaultColor: '#9ca3af',
          },
        },
      ],
    };

    const { getAllByRole, getByText } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisLegend legendId="population" breaks={[20, 30]} />
      </GeoVisProvider>
    );

    expect(getAllByRole('button')).toHaveLength(3);

    const firstItem = getByText('< 20').closest('button');
    expect(firstItem).toBeTruthy();
    fireEvent.mouseEnter(firstItem as HTMLButtonElement);
    expect(firstItem?.getAttribute('data-hovered')).toBe('true');
    fireEvent.mouseLeave(firstItem as HTMLButtonElement);
    expect(firstItem?.getAttribute('data-hovered')).toBe('false');
  });
});
