/**
 * @jest-environment jsdom
 *
 * Compact-breakpoint layout for the layer control: the panel opens away from
 * the anchored edge instead of sideways, sizes itself to its options and wraps
 * them once they stop fitting, and takes turns with the legend panel — the two
 * share that strip.
 */

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import type { QuantitativeColorBy, VisualizationSpec } from 'src/spec/types';
import { COMPACT_BREAKPOINT_PX } from 'src/ui/useCompactViewport';

jest.mock('src/adapters/maplibre/MapLibreAdapter', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      return {
        id: 'maplibre',
        getCapabilities: jest.fn(() => {
          return {
            sourceTypes: ['geojson'],
            layerGeometries: ['point', 'polygon'],
            dataFeatures: { featureState: ['geojson'], filter: ['geojson'] },
            viewFeatures: { pitch: false, bearing: false },
          };
        }),
        mount: jest.fn(() => {
          return { viewId: 'v', container: {}, destroy: jest.fn() };
        }),
        update: jest.fn(),
        applyPatch: jest.fn(),
        setView: jest.fn(),
        setSelection: jest.fn(),
        destroy: jest.fn(),
        getNativeInstance: jest.fn(() => {
          return null;
        }),
      };
    }),
  };
});

/**
 * Stubs `matchMedia` so `useCompactViewport` resolves to `compact`. jsdom ships
 * no implementation, which is why the hook otherwise reports the roomy layout.
 */
const mockViewport = (width: number) => {
  window.matchMedia = ((query: string) => {
    const limit = Number(/max-width:\s*([\d.]+)px/.exec(query)?.[1]);
    return {
      matches: width <= limit,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }) as unknown as typeof window.matchMedia;
};

const buildColorBy = (): QuantitativeColorBy => {
  return {
    type: 'quantitative',
    property: 'value',
    scale: 'threshold',
    thresholds: [100, 200],
    colors: ['#aaa', '#bbb', '#ccc'],
  };
};

/** Spec with both a layer control and a positioned legend, so the compact bar
 * holds the two triggers whose panels compete for the same strip. */
const buildSpec = (
  position: 'bottom-left' | 'top-right' = 'bottom-left'
): VisualizationSpec => {
  return {
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [
      {
        id: 'src',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [{ id: 'pts', sourceId: 'src', geometry: 'point' }],
    legends: [
      {
        id: 'pop',
        title: 'Population',
        position: 'bottom-right',
        colorBy: buildColorBy(),
      },
    ],
    control: {
      id: 'layers',
      label: 'Camadas',
      position,
      trigger: 'hover',
      items: [
        { id: 'kitchens', label: 'Cozinhas', layers: ['pts'] },
        { id: 'settlements', label: 'Assentamentos', layers: ['pts'] },
      ],
    },
  };
};

const layersTrigger = () => {
  return document.querySelector(
    'button[aria-label="Camadas"]'
  ) as HTMLButtonElement;
};

const legendTrigger = () => {
  return document.querySelector(
    'button[aria-label="Legend"]'
  ) as HTMLButtonElement;
};

const layersPanel = () => {
  return document.querySelector('div[role="group"][aria-label="Camadas"]');
};

const legendPanel = () => {
  return document.querySelector('div[role="group"][aria-label="Legend"]');
};

/**
 * The layer control's anchored container. Walks up from the trigger to the
 * absolutely-positioned ancestor, since the compact layout inserts a trigger
 * row between the two and the roomy one does not.
 */
const outerContainer = () => {
  let el: HTMLElement | null = layersTrigger();
  while (el && el.style.position !== 'absolute') {
    el = el.parentElement;
  }
  return el as HTMLElement;
};

const renderMap = async (spec: VisualizationSpec) => {
  render(
    <GeoVisProvider spec={spec}>
      <div />
    </GeoVisProvider>
  );
  await act(async () => {});
  await waitFor(() => {
    expect(layersTrigger()).not.toBeNull();
  });
};

describe('GeoVisLayerControl below the compact breakpoint', () => {
  beforeEach(() => {
    mockViewport(COMPACT_BREAKPOINT_PX - 265);
  });

  test('stacks the panel above the trigger row for a bottom corner', async () => {
    await renderMap(buildSpec('bottom-left'));

    const outer = outerContainer();
    expect(outer.style.flexDirection).toBe('column');
    // Both horizontal edges pinned — this is what spans the map.
    expect(outer.style.left).toBe('40px');
    expect(outer.style.right).toBe('40px');
    expect(outer.style.bottom).toBe('40px');

    act(() => {
      fireEvent.click(layersTrigger());
    });
    // Panel precedes the trigger row in the column, so it renders above it.
    expect(outer.firstElementChild).toBe(layersPanel());
    expect(outer.lastElementChild).toBe(layersTrigger().parentElement);
  });

  test('stacks the panel below the trigger row for a top corner', async () => {
    await renderMap(buildSpec('top-right'));

    act(() => {
      fireEvent.click(layersTrigger());
    });
    const outer = outerContainer();
    expect(outer.style.top).toBe('40px');
    expect(outer.lastElementChild).toBe(layersPanel());
    expect(outer.firstElementChild).toBe(layersTrigger().parentElement);
  });

  test('lets the panel size to its options rather than stretching', async () => {
    await renderMap(buildSpec());

    act(() => {
      fireEvent.click(layersTrigger());
    });
    const panel = layersPanel() as HTMLElement;
    // Wrapping is what fills the width, and only once the options need it.
    expect(panel.style.flexWrap).toBe('wrap');
    expect(panel.style.overflowY).toBe('auto');
    // Never stretched: a card holding two options stays as wide as the two.
    expect(panel.style.alignSelf).toBe('');
    expect(panel.style.width).toBe('');
  });

  test('opening one panel closes the other, in both directions', async () => {
    await renderMap(buildSpec());

    act(() => {
      fireEvent.click(layersTrigger());
    });
    expect(layersPanel()).not.toBeNull();
    expect(legendPanel()).toBeNull();

    act(() => {
      fireEvent.click(legendTrigger());
    });
    expect(legendPanel()).not.toBeNull();
    expect(layersPanel()).toBeNull();

    act(() => {
      fireEvent.click(layersTrigger());
    });
    expect(layersPanel()).not.toBeNull();
    expect(legendPanel()).toBeNull();
  });

  test('ignores the hover trigger, leaving the panel to the click', async () => {
    await renderMap(buildSpec());

    act(() => {
      fireEvent.mouseEnter(outerContainer());
    });
    expect(layersPanel()).toBeNull();

    act(() => {
      fireEvent.click(layersTrigger());
    });
    expect(layersPanel()).not.toBeNull();

    // A pointer leaving the row must not close a panel opened by touch.
    act(() => {
      fireEvent.mouseLeave(outerContainer());
    });
    expect(layersPanel()).not.toBeNull();
  });

  test('keeps the sideways layout above the breakpoint', async () => {
    mockViewport(COMPACT_BREAKPOINT_PX + 400);
    await renderMap(buildSpec());

    const outer = outerContainer();
    expect(outer.style.flexDirection).toBe('row');
    expect(outer.style.right).toBe('');

    // Roomy layout keeps the control's own state, so hover still expands it.
    act(() => {
      fireEvent.mouseEnter(outer);
    });
    const panel = layersPanel() as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.style.flexWrap).toBe('');
    // No legend button up here, so nothing competes with the panel.
    expect(legendTrigger()).toBeNull();
  });
});
