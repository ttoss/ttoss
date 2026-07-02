/**
 * @jest-environment jsdom
 */

import { render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import type { QuantitativeColorBy, VisualizationSpec } from 'src/spec/types';

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
          return undefined;
        }),
      };
    }),
  };
});

const buildColorBy = (): QuantitativeColorBy => {
  return {
    type: 'quantitative',
    property: 'value',
    scale: 'threshold',
    thresholds: [100, 200],
    colors: ['#aaa', '#bbb', '#ccc'],
  };
};

const buildSpec = ({
  legends,
  layers,
}: {
  legends?: VisualizationSpec['legends'];
  layers?: VisualizationSpec['layers'];
}): VisualizationSpec => {
  return {
    id: 'spec-legend',
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [
      {
        id: 'districts',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: layers ?? [
      {
        id: 'districts-fill',
        sourceId: 'districts',
        geometry: 'polygon',
        activeLegendId: 'pop',
      },
    ],
    legends,
  };
};

const ExposeRuntime = ({ onReady }: { onReady: () => void }) => {
  const { runtime } = useGeoVis();
  React.useEffect(() => {
    if (runtime) onReady();
  }, [runtime, onReady]);
  return null;
};

describe('spec-driven legend overlay (legend.position)', () => {
  test('does not mount a legend overlay when no legend declares position', async () => {
    const onReady = jest.fn();
    render(
      <GeoVisProvider
        spec={buildSpec({
          legends: [
            { id: 'pop', title: 'Population', colorBy: buildColorBy() },
          ],
        })}
      >
        <ExposeRuntime onReady={onReady} />
      </GeoVisProvider>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    expect(document.querySelector('ul[aria-label="Population"]')).toBeNull();
  });

  test('mounts a positioned overlay for a top-level legend that declares position', async () => {
    render(
      <GeoVisProvider
        spec={buildSpec({
          legends: [
            {
              id: 'pop',
              title: 'Population',
              subtitle: 'people per district',
              position: 'bottom-right',
              colorBy: buildColorBy(),
            },
          ],
        })}
      >
        <div />
      </GeoVisProvider>
    );

    await waitFor(() => {
      expect(
        document.querySelector('ul[aria-label="Population"]')
      ).not.toBeNull();
    });

    const list = document.querySelector(
      'ul[aria-label="Population"]'
    ) as HTMLElement;
    // One swatch per threshold bin (2 thresholds ⇒ 3 bins).
    expect(list.querySelectorAll('li')).toHaveLength(3);

    // The overlay container is absolutely positioned in the bottom-right.
    const container = list.closest('div') as HTMLElement;
    expect(container.style.position).toBe('absolute');
    expect(container.style.right).toBe('10px');
    expect(container.style.bottom).toBe('10px');
  });

  test('mounts an overlay for a layer-level legend that declares position', async () => {
    render(
      <GeoVisProvider
        spec={buildSpec({
          layers: [
            {
              id: 'districts-fill',
              sourceId: 'districts',
              geometry: 'polygon',
              activeLegendId: 'pop',
              legends: [
                {
                  id: 'pop',
                  title: 'Population',
                  position: 'bottom-right',
                  colorBy: buildColorBy(),
                },
              ],
            },
          ],
        })}
      >
        <div />
      </GeoVisProvider>
    );

    await waitFor(() => {
      expect(
        document.querySelector('ul[aria-label="Population"]')
      ).not.toBeNull();
    });
  });

  test('mounts one overlay per positioned legend', async () => {
    render(
      <GeoVisProvider
        spec={buildSpec({
          legends: [
            {
              id: 'pop',
              title: 'Population',
              position: 'bottom-right',
              colorBy: buildColorBy(),
            },
            {
              id: 'density',
              title: 'Density',
              position: 'top-left',
              colorBy: buildColorBy(),
            },
          ],
        })}
      >
        <div />
      </GeoVisProvider>
    );

    await waitFor(() => {
      expect(
        document.querySelector('ul[aria-label="Population"]')
      ).not.toBeNull();
    });
    expect(document.querySelector('ul[aria-label="Density"]')).not.toBeNull();
  });
});
