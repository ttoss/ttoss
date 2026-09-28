/**
 * @jest-environment jsdom
 */

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import type { LayerControl, VisualizationSpec } from 'src/spec/types';
import { validateSpec } from 'src/spec/validateSpec';

jest.mock('src/adapters/maplibre/MapLibreAdapter', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      return {
        id: 'maplibre',
        getCapabilities: jest.fn(() => {
          return {
            engine: 'maplibre',
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

const ITEM_IDS = ['a', 'b', 'c', 'd', 'e'];

/** Five single-layer items, all starting off, under the given control options. */
const buildSpec = (
  control: Partial<Omit<LayerControl, 'items'>> = {}
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
    layers: ITEM_IDS.map((id) => {
      return { id: `${id}-layer`, sourceId: 'src', geometry: 'point' };
    }),
    control: {
      id: 'layers',
      label: 'Camadas',
      trigger: 'click',
      ...control,
      items: ITEM_IDS.map((id) => {
        return {
          id,
          label: `Item ${id}`,
          layers: [`${id}-layer`],
          defaultActive: false,
        };
      }),
    },
  };
};

const visibleById: Record<string, boolean | undefined> = {};

/** Records each layer's committed `visible` flag so tests can assert on it. */
const SpecProbe = () => {
  const { spec } = useGeoVis();
  React.useEffect(() => {
    for (const layer of spec.layers) {
      visibleById[layer.id] = layer.visible;
    }
  }, [spec]);
  return null;
};

const renderControl = async (spec: VisualizationSpec) => {
  render(
    <GeoVisProvider spec={spec}>
      <SpecProbe />
    </GeoVisProvider>
  );
  await act(async () => {});
};

const trigger = () => {
  return document.querySelector(
    'button[aria-label="Camadas"]'
  ) as HTMLButtonElement;
};

const moreButton = () => {
  return document.querySelector(
    'button[data-more]'
  ) as HTMLButtonElement | null;
};

const fullPanel = () => {
  return document.querySelector('[role="dialog"]') as HTMLElement | null;
};

const itemButton = (id: string) => {
  return document.querySelector(
    `button[data-item-id="${id}"]`
  ) as HTMLButtonElement | null;
};

const renderedItemIds = () => {
  return Array.from(document.querySelectorAll('button[data-item-id]')).map(
    (el) => {
      return el.getAttribute('data-item-id');
    }
  );
};

/** The control's outer container, which carries the hover handlers. */
const container = () => {
  return trigger().parentElement as HTMLElement;
};

const openFullPanel = () => {
  act(() => {
    fireEvent.click(trigger());
  });
  act(() => {
    fireEvent.click(moreButton() as HTMLButtonElement);
  });
};

describe('GeoVisLayerControl — maxVisibleItems', () => {
  test('shows every item and no "Ver mais" card when the limit is unset', async () => {
    await renderControl(buildSpec());
    act(() => {
      fireEvent.click(trigger());
    });

    expect(renderedItemIds()).toEqual(ITEM_IDS);
    expect(moreButton()).toBeNull();
  });

  test('shows every item and no card when the list fits within the limit', async () => {
    await renderControl(buildSpec({ maxVisibleItems: 5 }));
    act(() => {
      fireEvent.click(trigger());
    });

    expect(renderedItemIds()).toEqual(ITEM_IDS);
    expect(moreButton()).toBeNull();
  });

  test('shows the first items in order plus a card counting the hidden ones', async () => {
    await renderControl(buildSpec({ maxVisibleItems: 2 }));
    act(() => {
      fireEvent.click(trigger());
    });

    expect(renderedItemIds()).toEqual(['a', 'b']);
    const more = moreButton() as HTMLButtonElement;
    expect(more.getAttribute('aria-label')).toBe('Ver mais (+3)');
    expect(more.textContent).toContain('+3');
    expect(more.textContent).toContain('Ver mais');
    expect(fullPanel()).toBeNull();
  });

  test('opens a full panel listing every item and moves focus to it', async () => {
    await renderControl(buildSpec({ maxVisibleItems: 2 }));
    openFullPanel();

    const panel = fullPanel() as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.getAttribute('aria-label')).toBe('Camadas');
    expect(renderedItemIds()).toEqual(ITEM_IDS);
    expect(moreButton()).toBeNull();
    expect(document.activeElement).toBe(panel);
  });

  test('toggles a hidden item from the full panel and badges it on the card', async () => {
    await renderControl(buildSpec({ maxVisibleItems: 2 }));
    openFullPanel();

    act(() => {
      fireEvent.click(itemButton('d') as HTMLButtonElement);
    });
    await waitFor(() => {
      expect(visibleById['d-layer']).toBe(true);
    });

    act(() => {
      fireEvent.click(
        document.querySelector(
          'button[aria-label="Fechar"]'
        ) as HTMLButtonElement
      );
    });
    expect(fullPanel()).toBeNull();
    expect(itemButton('a')).toBeNull();

    // Reopening lands on the summary strip again, with the hidden-active badge.
    act(() => {
      fireEvent.click(trigger());
    });
    expect(fullPanel()).toBeNull();
    expect(renderedItemIds()).toEqual(['a', 'b']);
    const badge = (moreButton() as HTMLButtonElement).querySelector(
      'span > span'
    );
    expect(badge?.textContent).toBe('1');
  });

  test('closes the full panel on Escape', async () => {
    await renderControl(buildSpec({ maxVisibleItems: 2 }));
    openFullPanel();

    act(() => {
      fireEvent.keyDown(document, { key: 'Enter' });
    });
    expect(fullPanel()).not.toBeNull();

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(fullPanel()).toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  test('closes the full panel on a pointer press outside, not inside', async () => {
    await renderControl(buildSpec({ maxVisibleItems: 2 }));
    openFullPanel();

    act(() => {
      fireEvent.pointerDown(itemButton('e') as HTMLButtonElement);
    });
    expect(fullPanel()).not.toBeNull();

    act(() => {
      fireEvent.pointerDown(document.body);
    });
    expect(fullPanel()).toBeNull();
  });

  test('keeps the full panel open when the pointer leaves a hover control', async () => {
    await renderControl(buildSpec({ maxVisibleItems: 2, trigger: 'hover' }));

    act(() => {
      fireEvent.mouseEnter(container());
    });
    expect(moreButton()).not.toBeNull();

    // The summary strip still collapses on leave, as before.
    act(() => {
      fireEvent.mouseLeave(container());
    });
    expect(moreButton()).toBeNull();

    act(() => {
      fireEvent.mouseEnter(container());
    });
    act(() => {
      fireEvent.mouseEnter(moreButton() as HTMLButtonElement);
    });
    // Leaving the card for the rest of the panel, not the control itself.
    act(() => {
      fireEvent.mouseLeave(moreButton() as HTMLButtonElement, {
        relatedTarget: container(),
      });
    });
    act(() => {
      fireEvent.click(moreButton() as HTMLButtonElement);
    });
    expect(fullPanel()).not.toBeNull();

    act(() => {
      fireEvent.mouseLeave(container());
    });
    act(() => {
      fireEvent.blur(fullPanel() as HTMLElement, { relatedTarget: null });
    });
    expect(fullPanel()).not.toBeNull();
  });
});

describe('validateSpec — control.maxVisibleItems', () => {
  test('accepts a positive integer', () => {
    const result = validateSpec(buildSpec({ maxVisibleItems: 3 }));
    expect(result.status).toBe('resolved');
  });

  test.each([
    ['zero', 0],
    ['a fraction', 2.5],
  ])('rejects %s', (_name, maxVisibleItems) => {
    const result = validateSpec(buildSpec({ maxVisibleItems }));
    expect(result.status).not.toBe('resolved');
  });
});
