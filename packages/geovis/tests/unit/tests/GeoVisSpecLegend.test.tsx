/**
 * @jest-environment jsdom
 */

import { render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import type {
  LegendPosition,
  QuantitativeColorBy,
  VisualizationSpec,
} from 'src/spec/types';

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
    expect(container.style.right).toBe('24px');
    expect(container.style.bottom).toBe('24px');
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

describe('stacked legend overlays (shared position)', () => {
  const legendNamed = (id: string, title: string, position: LegendPosition) => {
    return { id, title, position, colorBy: buildColorBy() };
  };

  test('stacks two legends sharing a position in one overlay container, instead of overlapping two absolutely-positioned boxes', async () => {
    render(
      <GeoVisProvider
        spec={buildSpec({
          legends: [
            legendNamed('pop', 'Population', 'bottom-right'),
            legendNamed('density', 'Density', 'bottom-right'),
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

    const popList = document.querySelector(
      'ul[aria-label="Population"]'
    ) as HTMLElement;
    const densityList = document.querySelector(
      'ul[aria-label="Density"]'
    ) as HTMLElement;

    // Both legend bodies live under the SAME positioned ancestor — not two
    // separate absolutely-positioned boxes.
    const popGroup = (popList.closest('div') as HTMLElement).parentElement;
    const densityGroup = (densityList.closest('div') as HTMLElement)
      .parentElement;
    expect(popGroup).toBe(densityGroup);
    expect(popGroup!.style.position).toBe('absolute');
    expect(popGroup!.style.right).toBe('24px');
    expect(popGroup!.style.bottom).toBe('24px');

    // Only the second legend in declaration order gets a leading divider.
    const dividers = popGroup!.querySelectorAll('div[aria-hidden="true"]');
    expect(dividers).toHaveLength(1);
  });

  test('stacks any number of legends sharing a position (3), preserving declaration order and dividing every legend but the first', async () => {
    render(
      <GeoVisProvider
        spec={buildSpec({
          legends: [
            legendNamed('a', 'Legend A', 'top-left'),
            legendNamed('b', 'Legend B', 'top-left'),
            legendNamed('c', 'Legend C', 'top-left'),
          ],
        })}
      >
        <div />
      </GeoVisProvider>
    );

    await waitFor(() => {
      expect(
        document.querySelector('ul[aria-label="Legend A"]')
      ).not.toBeNull();
    });

    const listA = document.querySelector('ul[aria-label="Legend A"]')!;
    const listB = document.querySelector('ul[aria-label="Legend B"]')!;
    const listC = document.querySelector('ul[aria-label="Legend C"]')!;

    const group = (listA.closest('div') as HTMLElement).parentElement!;
    expect((listB.closest('div') as HTMLElement).parentElement).toBe(group);
    expect((listC.closest('div') as HTMLElement).parentElement).toBe(group);
    expect(group.style.position).toBe('absolute');

    // Declaration order preserved inside the group.
    const bodies = Array.from(group.children);
    expect(bodies.indexOf(listA.closest('div') as HTMLElement)).toBeLessThan(
      bodies.indexOf(listB.closest('div') as HTMLElement)
    );
    expect(bodies.indexOf(listB.closest('div') as HTMLElement)).toBeLessThan(
      bodies.indexOf(listC.closest('div') as HTMLElement)
    );

    // First legend gets no leading divider; the other two do (N legends ⇒ N-1 dividers).
    expect(group.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(2);
  });

  test('legends with different positions never share a group, even when both are positioned', async () => {
    render(
      <GeoVisProvider
        spec={buildSpec({
          legends: [
            legendNamed('pop', 'Population', 'bottom-right'),
            legendNamed('density', 'Density', 'top-left'),
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

    // A single-member group has no extra wrapper: the legend body div itself
    // is the absolutely-positioned box (pre-existing behavior for one
    // positioned legend, unaffected by the same-position stacking feature).
    const popBox = document
      .querySelector('ul[aria-label="Population"]')!
      .closest('div') as HTMLElement;
    const densityBox = document
      .querySelector('ul[aria-label="Density"]')!
      .closest('div') as HTMLElement;

    expect(popBox).not.toBe(densityBox);
    expect(popBox.style.position).toBe('absolute');
    expect(popBox.style.right).toBe('24px');
    expect(popBox.style.bottom).toBe('24px');
    expect(densityBox.style.position).toBe('absolute');
    expect(densityBox.style.top).toBe('24px');
    expect(densityBox.style.left).toBe('24px');
    expect(popBox.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(0);
  });
});
