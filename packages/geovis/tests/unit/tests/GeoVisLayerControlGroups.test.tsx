/**
 * @jest-environment jsdom
 */

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import { isLayerControlGroup, layerControlItems } from 'src/spec/layerControl';
import type {
  LayerControl,
  LayerControlEntry,
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
            layerGeometries: ['point', 'polygon', 'line'],
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

const LAYER_IDS = ['parques', 'ubs', 'hospitais', 'metro'];

/** A loose toggle, two categories, and one whose layers the spec lacks. */
const ENTRIES: LayerControlEntry[] = [
  {
    id: 'parques',
    label: 'Parques',
    layers: ['parques'],
    defaultActive: false,
  },
  {
    id: 'saude',
    label: 'Saúde',
    items: [
      { id: 'ubs', label: 'UBS', layers: ['ubs'], defaultActive: false },
      {
        id: 'hospitais',
        label: 'Hospitais',
        layers: ['hospitais'],
        defaultActive: false,
      },
    ],
  },
  {
    id: 'transporte',
    label: 'Transporte',
    items: [{ id: 'metro', label: 'Metrô', layers: ['metro'] }],
  },
  {
    id: 'vazio',
    label: 'Vazio',
    items: [{ id: 'nada', label: 'Nada', layers: ['ausente'] }],
  },
];

const buildSpec = (
  control: Partial<LayerControl> = {},
  layerIds: string[] = LAYER_IDS
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
    layers: layerIds.map((id) => {
      return { id, sourceId: 'src', geometry: 'point' };
    }),
    control: {
      id: 'camadas',
      label: 'Camadas',
      trigger: 'click',
      items: ENTRIES,
      ...control,
    },
  };
};

const visibleById: Record<string, boolean | undefined> = {};

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
  const view = render(
    <GeoVisProvider spec={spec}>
      <SpecProbe />
    </GeoVisProvider>
  );
  await act(async () => {});
  return view;
};

const $ = <T extends Element = HTMLElement>(selector: string) => {
  return document.querySelector(selector) as T | null;
};

const trigger = () => {
  return $<HTMLButtonElement>('button[aria-label="Camadas"]')!;
};

const groupCard = (id: string) => {
  return $<HTMLButtonElement>(`button[data-group-id="${id}"]`);
};

const itemButton = (id: string) => {
  return $<HTMLButtonElement>(`button[data-item-id="${id}"]`);
};

const dialog = () => {
  return $('[role="dialog"]');
};

const press = (element: Element | null) => {
  act(() => {
    fireEvent.click(element as Element);
  });
};

const openControl = () => {
  press(trigger());
};

describe('GeoVisLayerControl — categories', () => {
  /*
   * A flat control — cozsolidarias' kitchens and state lines — keeps the exact
   * behaviour it had before categories existed.
   */
  test('a control without categories is the flat list of toggles it was', async () => {
    await renderControl(
      buildSpec({
        trigger: 'hover',
        items: [
          {
            id: 'cozinhas',
            label: 'Localização das cozinhas',
            layers: ['parques'],
          },
          { id: 'estados', label: 'Linhas dos estados', layers: ['ubs'] },
        ],
      })
    );
    act(() => {
      fireEvent.mouseEnter(trigger().parentElement!);
    });

    expect($('[data-group-id]')).toBeNull();
    expect(itemButton('cozinhas')?.getAttribute('aria-pressed')).toBe('true');

    press(itemButton('cozinhas'));
    await waitFor(() => {
      expect(visibleById['parques']).toBe(false);
    });
    expect(dialog()).toBeNull();
  });

  test('a category card opens its panel rather than toggling anything', async () => {
    await renderControl(buildSpec());
    openControl();

    expect(groupCard('saude')?.getAttribute('aria-label')).toBe('Saúde');
    expect(itemButton('ubs')).toBeNull();

    press(groupCard('saude'));

    expect(dialog()?.getAttribute('aria-label')).toBe('Saúde');
    expect(document.activeElement).toBe(dialog());
    expect(itemButton('ubs')).not.toBeNull();
    expect(itemButton('hospitais')).not.toBeNull();
    // The strip it replaced is gone.
    expect(itemButton('parques')).toBeNull();
    expect(visibleById['ubs']).toBe(false);
  });

  test('toggles inside a category, then counts them on its card and the trigger', async () => {
    await renderControl(buildSpec());
    openControl();
    press(groupCard('saude'));

    press(itemButton('ubs'));
    await waitFor(() => {
      expect(visibleById['ubs']).toBe(true);
    });

    press($('button[aria-label="Voltar"]'));
    expect(dialog()).toBeNull();
    expect(groupCard('saude')?.textContent).toContain('1');
    // Metrô and Nada start on, UBS was turned on. The count is of remembered
    // choices, as for loose toggles: "Nada" counts although its layer is gone.
    expect(trigger().textContent).toContain('3');
  });

  test('a category card highlights on hover, like a toggle', async () => {
    await renderControl(buildSpec());
    openControl();
    const card = groupCard('saude')!;
    const resting = card.style.backgroundColor;

    act(() => {
      fireEvent.mouseEnter(card);
    });
    expect(card.style.backgroundColor).not.toBe(resting);

    act(() => {
      fireEvent.mouseLeave(card);
    });
    expect(card.style.backgroundColor).toBe(resting);
  });

  test('a category whose every item is unavailable is disabled', async () => {
    await renderControl(buildSpec());
    openControl();

    expect(groupCard('vazio')?.disabled).toBe(true);
    expect(groupCard('saude')?.disabled).toBe(false);
  });

  test('back returns to the full panel when the category was opened from it', async () => {
    await renderControl(buildSpec({ maxVisibleItems: 1 }));
    openControl();
    press($('button[data-more]'));
    expect(dialog()?.getAttribute('aria-label')).toBe('Camadas');

    press(groupCard('transporte'));
    expect(dialog()?.getAttribute('aria-label')).toBe('Transporte');

    press($('button[aria-label="Voltar"]'));
    expect(dialog()?.getAttribute('aria-label')).toBe('Camadas');
    expect(groupCard('saude')).not.toBeNull();
  });

  test('the "Ver mais" badge counts the items of the categories it hides', async () => {
    await renderControl(buildSpec({ maxVisibleItems: 1 }));
    openControl();

    // Metrô (in "Transporte") and Nada (in "Vazio"), both hidden, are on.
    const badge = $('button[data-more]')?.querySelector('span > span');
    expect(badge?.textContent).toBe('2');
  });

  test('a category panel stays open when the pointer leaves a hover control', async () => {
    await renderControl(buildSpec({ trigger: 'hover' }));
    const container = trigger().parentElement!;
    act(() => {
      fireEvent.mouseEnter(container);
    });
    press(groupCard('saude'));

    act(() => {
      fireEvent.mouseLeave(container);
    });

    expect(dialog()?.getAttribute('aria-label')).toBe('Saúde');
  });

  test('Escape closes a category panel, and the control reopens on the strip', async () => {
    await renderControl(buildSpec());
    openControl();
    press(groupCard('saude'));

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(dialog()).toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');

    openControl();
    expect(dialog()).toBeNull();
    expect(groupCard('saude')).not.toBeNull();
  });

  test('a press outside closes a category panel', async () => {
    await renderControl(buildSpec());
    openControl();
    press(groupCard('saude'));

    act(() => {
      fireEvent.pointerDown(document.body);
    });

    expect(dialog()).toBeNull();
  });

  test('a category dropped from the spec while open falls back to the strip', async () => {
    const { rerender } = await renderControl(buildSpec());
    openControl();
    press(groupCard('saude'));

    rerender(
      <GeoVisProvider
        spec={buildSpec({
          items: ENTRIES.filter((entry) => {
            return entry.id !== 'saude';
          }),
        })}
      >
        <SpecProbe />
      </GeoVisProvider>
    );
    await act(async () => {});

    expect(dialog()).toBeNull();
    expect(itemButton('parques')).not.toBeNull();
  });
});

describe('layer control categories — helpers', () => {
  test('tells a category from a toggle, and flattens them in order', () => {
    expect(ENTRIES.map(isLayerControlGroup)).toEqual([false, true, true, true]);
    expect(
      layerControlItems(ENTRIES).map((item) => {
        return item.id;
      })
    ).toEqual(['parques', 'ubs', 'hospitais', 'metro', 'nada']);
  });
});

describe('validateSpec — layer control categories', () => {
  test('accepts categories beside loose toggles', () => {
    expect(validateSpec(buildSpec()).status).toBe('resolved');
  });

  test('rejects a category inside a category', () => {
    const nested = buildSpec({
      items: [
        {
          id: 'fora',
          label: 'Fora',
          items: [
            {
              id: 'dentro',
              label: 'Dentro',
              items: [{ id: 'x', label: 'X', layers: ['ubs'] }],
            } as unknown as LayerControlEntry & { layers: string[] },
          ],
        },
      ],
    });

    expect(validateSpec(nested).status).toBe('invalid');
  });

  test('rejects an empty category', () => {
    const empty = buildSpec({ items: [{ id: 'g', label: 'G', items: [] }] });

    expect(validateSpec(empty).status).toBe('invalid');
  });

  test('rejects an id repeated across the categories and toggles', () => {
    const result = validateSpec(
      buildSpec({
        items: [
          { id: 'ubs', label: 'UBS solta', layers: ['ubs'] },
          {
            id: 'saude',
            label: 'Saúde',
            items: [{ id: 'ubs', label: 'UBS', layers: ['ubs'] }],
          },
          { id: 'saude', label: 'Outra', layers: ['metro'] },
        ],
      })
    );

    if (result.status === 'resolved') throw new Error('expected issues');
    expect(
      result.issues.map((issue) => {
        return [issue.code, issue.subject.path, issue.subject.id];
      })
    ).toEqual([
      ['duplicate-control-item-id', '/control/items/1/items/0', 'ubs'],
      ['duplicate-control-item-id', '/control/items/2', 'saude'],
    ]);
  });
});
