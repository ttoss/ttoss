/**
 * @jest-environment jsdom
 */

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import type {
  LayerControl,
  LayerControlItem,
  VisualizationSpec,
} from 'src/spec/types';
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

/**
 * Five single-layer items under the given control options, each starting off
 * unless `items` says otherwise.
 */
const buildSpec = ({
  control = {},
  items = {},
}: {
  control?: Partial<Omit<LayerControl, 'items'>>;
  items?: Record<string, Partial<LayerControlItem>>;
} = {}): VisualizationSpec => {
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
          ...items[id],
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

const $ = (selector: string) => {
  return document.querySelector(selector) as HTMLElement | null;
};

const press = (element: Element | null) => {
  act(() => {
    fireEvent.click(element as Element);
  });
};

const trigger = () => {
  return $('button[aria-label="Camadas"]');
};

const itemButton = (id: string) => {
  return $(`button[data-item-id="${id}"]`);
};

const renderedItemIds = () => {
  return Array.from(document.querySelectorAll('button[data-item-id]')).map(
    (el) => {
      return el.getAttribute('data-item-id');
    }
  );
};

const isPressed = (id: string) => {
  return itemButton(id)?.getAttribute('aria-pressed') === 'true';
};

/** Closes the control with the trigger and opens it again. */
const reopen = () => {
  press(trigger());
  press(trigger());
};

beforeEach(() => {
  for (const key of Object.keys(visibleById)) delete visibleById[key];
});

describe('GeoVisLayerControl — maxActiveItems', () => {
  test('switching one on past the limit switches off the one on longest', async () => {
    await renderControl(buildSpec({ control: { maxActiveItems: 2 } }));
    press(trigger());

    press(itemButton('a'));
    press(itemButton('b'));
    press(itemButton('c'));

    await waitFor(() => {
      expect(visibleById['a-layer']).toBe(false);
    });
    expect(visibleById['b-layer']).toBe(true);
    expect(visibleById['c-layer']).toBe(true);

    // Switching `b` off and on again makes it the newest: `c` goes next.
    press(itemButton('b'));
    press(itemButton('b'));
    press(itemButton('d'));
    await waitFor(() => {
      expect(visibleById['c-layer']).toBe(false);
    });
    expect(visibleById['b-layer']).toBe(true);
    expect(visibleById['d-layer']).toBe(true);
  });

  test('items on by default are the oldest, in items order', async () => {
    await renderControl(
      buildSpec({
        control: { maxActiveItems: 2 },
        items: { b: { defaultActive: true }, d: { defaultActive: true } },
      })
    );
    press(trigger());

    press(itemButton('a'));

    await waitFor(() => {
      expect(visibleById['b-layer']).toBe(false);
    });
    // Never toggled, so its layer keeps the spec's own visibility: shown.
    expect(visibleById['d-layer']).not.toBe(false);
    expect(visibleById['a-layer']).toBe(true);
  });

  test('an item whose layers are missing does not take a place', async () => {
    await renderControl(
      buildSpec({
        control: { maxActiveItems: 1 },
        items: { e: { defaultActive: true, layers: ['ausente'] } },
      })
    );
    press(trigger());

    press(itemButton('a'));

    await waitFor(() => {
      expect(visibleById['a-layer']).toBe(true);
    });
    expect(isPressed('e')).toBe(true);
  });

  test('without a limit every item stays on', async () => {
    await renderControl(buildSpec());
    press(trigger());

    for (const id of ITEM_IDS) press(itemButton(id));

    await waitFor(() => {
      expect(visibleById['e-layer']).toBe(true);
    });
    expect(
      ITEM_IDS.every((id) => {
        return visibleById[`${id}-layer`] === true;
      })
    ).toBe(true);
  });
});

describe('GeoVisLayerControl — items on lead the strip', () => {
  test('the order holds while the panel is open and moves on reopening', async () => {
    await renderControl(buildSpec({ control: { maxVisibleItems: 2 } }));
    press(trigger());
    expect(renderedItemIds()).toEqual(['a', 'b']);

    // Switching `b` on leaves the cards where they are, under the pointer.
    press(itemButton('b'));
    expect(renderedItemIds()).toEqual(['a', 'b']);

    reopen();
    expect(renderedItemIds()).toEqual(['b', 'a']);
  });

  test('more items on than places grow the strip instead of hiding one', async () => {
    await renderControl(
      buildSpec({
        control: { maxVisibleItems: 2 },
        items: {
          c: { defaultActive: true },
          d: { defaultActive: true },
          e: { defaultActive: true },
        },
      })
    );
    press(trigger());

    expect(renderedItemIds()).toEqual(['c', 'd', 'e']);
    expect($('button[data-more]')?.getAttribute('aria-label')).toBe(
      'Ver mais (+2)'
    );
  });
});

describe('GeoVisLayerControl — categories in the "Ver mais" panel', () => {
  const openFullPanel = () => {
    press(trigger());
    press($('button[data-more]'));
  };

  const sections = () => {
    return Array.from(
      document.querySelectorAll('[role="dialog"] [role="group"]')
    ).map((group) => {
      return {
        name: group.getAttribute('aria-label'),
        items: Array.from(group.querySelectorAll('button[data-item-id]')).map(
          (el) => {
            return el.getAttribute('data-item-id');
          }
        ),
      };
    });
  };

  test('sections the items by category, uncategorised first, in first-seen order', async () => {
    await renderControl(
      buildSpec({
        control: { maxVisibleItems: 2 },
        items: {
          b: { category: 'Transporte' },
          c: { category: 'Saúde' },
          d: { category: 'Transporte' },
        },
      })
    );
    openFullPanel();

    expect(sections()).toEqual([
      { name: 'Camadas', items: ['a', 'e'] },
      { name: 'Transporte', items: ['b', 'd'] },
      { name: 'Saúde', items: ['c'] },
    ]);
    // Each titled section carries its heading; the first run has none.
    expect($('[role="dialog"]')?.textContent).toContain('Transporte');
    expect(
      $('[role="dialog"] [role="group"][aria-label="Camadas"]')?.textContent
    ).not.toContain('Camadas');
  });

  test('every item under a category leaves no untitled run', async () => {
    await renderControl(
      buildSpec({
        control: { maxVisibleItems: 2 },
        items: Object.fromEntries(
          ITEM_IDS.map((id) => {
            return [id, { category: 'Tudo' }];
          })
        ),
      })
    );
    openFullPanel();

    expect(sections()).toEqual([{ name: 'Tudo', items: ITEM_IDS }]);
  });

  test('an item is still toggled from its section', async () => {
    await renderControl(
      buildSpec({
        control: { maxVisibleItems: 2 },
        items: { e: { category: 'Saúde' } },
      })
    );
    openFullPanel();

    press(itemButton('e'));

    await waitFor(() => {
      expect(visibleById['e-layer']).toBe(true);
    });
  });
});

describe('the control spec', () => {
  test('accepts maxActiveItems and an item category', () => {
    const result = validateSpec(
      buildSpec({
        control: { maxActiveItems: 2 },
        items: { a: { category: 'Saúde' } },
      })
    );
    expect(result.status).toBe('resolved');
  });

  test('rejects a maxActiveItems below one', () => {
    const result = validateSpec(buildSpec({ control: { maxActiveItems: 0 } }));
    expect(result.status).toBe('invalid');
  });
});
