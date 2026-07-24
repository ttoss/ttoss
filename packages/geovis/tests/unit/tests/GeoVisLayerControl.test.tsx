/**
 * @jest-environment jsdom
 */

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';

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

const source = {
  id: 'src',
  type: 'geojson' as const,
  data: { type: 'FeatureCollection' as const, features: [] },
};

/** Spec whose kitchen layer id varies by "mode", to exercise persistence. */
const buildSpec = (kitchenLayerId: string | null): VisualizationSpec => {
  return {
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [source],
    layers: kitchenLayerId
      ? [{ id: kitchenLayerId, sourceId: 'src', geometry: 'point' }]
      : [{ id: 'choropleth-fill', sourceId: 'src', geometry: 'polygon' }],
    control: {
      id: 'layers',
      label: 'Camadas',
      position: 'bottom-left',
      trigger: 'click',
      items: [
        {
          id: 'kitchens',
          label: 'Localização das cozinhas',
          // References both mode-specific ids; only one exists per mode.
          layers: ['cozinhas-pts', 'cozinhas-bolhas'],
        },
      ],
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

const findKitchenButton = () => {
  return document.querySelector(
    'button[data-item-id="kitchens"]'
  ) as HTMLButtonElement | null;
};

const openPanel = () => {
  const trigger = document.querySelector(
    'button[aria-expanded]'
  ) as HTMLButtonElement;
  fireEvent.click(trigger);
};

describe('GeoVisLayerControl', () => {
  test('renders the trigger with the control label and reveals items on click', async () => {
    render(
      <GeoVisProvider spec={buildSpec('cozinhas-pts')}>
        <div />
      </GeoVisProvider>
    );
    await act(async () => {});

    const trigger = await waitFor(() => {
      const el = document.querySelector('button[aria-expanded]');
      expect(el).not.toBeNull();
      return el as HTMLButtonElement;
    });
    expect(trigger.textContent).toBe('Camadas');
    // Collapsed: no item yet.
    expect(findKitchenButton()).toBeNull();

    act(() => {
      openPanel();
    });
    const item = findKitchenButton();
    expect(item).not.toBeNull();
    expect(item!.textContent).toBe('Localização das cozinhas');
    // Active by default.
    expect(item!.getAttribute('aria-pressed')).toBe('true');
    expect(item!.disabled).toBe(false);
  });

  test('clicking an item hides its existing layer (toggle-layer visible:false)', async () => {
    const { container } = render(
      <GeoVisProvider spec={buildSpec('cozinhas-pts')}>
        <div />
      </GeoVisProvider>
    );
    await act(async () => {});
    await waitFor(() => {
      expect(container.querySelector('button[aria-expanded]')).not.toBeNull();
    });

    act(() => {
      openPanel();
    });
    act(() => {
      fireEvent.click(findKitchenButton()!);
    });

    // Button reflects the "off" intent.
    await waitFor(() => {
      expect(findKitchenButton()!.getAttribute('aria-pressed')).toBe('false');
    });
  });

  test('disables the item when none of its layers exist in the current spec', async () => {
    // Choropleth "mode": no kitchen layer at all.
    render(
      <GeoVisProvider spec={buildSpec(null)}>
        <div />
      </GeoVisProvider>
    );
    await act(async () => {});
    await waitFor(() => {
      expect(document.querySelector('button[aria-expanded]')).not.toBeNull();
    });

    act(() => {
      openPanel();
    });
    const item = findKitchenButton();
    expect(item).not.toBeNull();
    expect(item!.disabled).toBe(true);
  });

  test('remembers the off choice across a spec rebuild with a different layer id (2b persistence)', async () => {
    // Start in a "mode" where kitchens are `cozinhas-pts`.
    const { rerender } = render(
      <GeoVisProvider spec={buildSpec('cozinhas-pts')}>
        <SpecProbe />
      </GeoVisProvider>
    );
    await act(async () => {});
    await waitFor(() => {
      expect(document.querySelector('button[aria-expanded]')).not.toBeNull();
    });

    act(() => {
      openPanel();
    });
    act(() => {
      fireEvent.click(findKitchenButton()!);
    });
    await waitFor(() => {
      expect(findKitchenButton()!.getAttribute('aria-pressed')).toBe('false');
    });

    // Switch "mode": kitchens are now `cozinhas-bolhas` (a fresh spec object).
    // The control stays mounted across the rebuild, so the panel remains open
    // (its `expanded` state persists) — no need to re-open it.
    rerender(
      <GeoVisProvider spec={buildSpec('cozinhas-bolhas')}>
        <SpecProbe />
      </GeoVisProvider>
    );
    await act(async () => {});

    // The remembered "off" (keyed by item.id) survives the rebuild: the item
    // stays inactive, and reconciliation drives the new layer hidden too.
    await waitFor(() => {
      expect(findKitchenButton()!.getAttribute('aria-pressed')).toBe('false');
    });
    expect(findKitchenButton()!.disabled).toBe(false);
    // Reconciliation actually hid the new mode's layer, not just the UI intent.
    await waitFor(() => {
      expect(visibleById['cozinhas-bolhas']).toBe(false);
    });
  });

  test('hover trigger expands on pointer/focus enter and collapses on leave', async () => {
    const hoverSpec: VisualizationSpec = {
      ...buildSpec('cozinhas-pts'),
      control: { ...buildSpec('cozinhas-pts').control!, trigger: 'hover' },
    };
    render(
      <GeoVisProvider spec={hoverSpec}>
        <div />
      </GeoVisProvider>
    );
    await act(async () => {});

    const trigger = await waitFor(() => {
      const el = document.querySelector('button[aria-expanded]');
      expect(el).not.toBeNull();
      return el as HTMLButtonElement;
    });
    const panelContainer = trigger.parentElement as HTMLElement;

    // Collapsed initially.
    expect(findKitchenButton()).toBeNull();

    // Pointer enter expands; leave collapses.
    act(() => {
      fireEvent.mouseEnter(panelContainer);
    });
    expect(findKitchenButton()).not.toBeNull();
    act(() => {
      fireEvent.mouseLeave(panelContainer);
    });
    expect(findKitchenButton()).toBeNull();

    // Keyboard focus expands; blurring out of the panel collapses.
    act(() => {
      fireEvent.focus(panelContainer);
    });
    expect(findKitchenButton()).not.toBeNull();
    act(() => {
      fireEvent.blur(panelContainer, { relatedTarget: document.body });
    });
    expect(findKitchenButton()).toBeNull();
  });

  test('top-right position, default label, and defaultActive:false start hidden', async () => {
    const spec: VisualizationSpec = {
      engine: 'maplibre',
      view: { center: [0, 0], zoom: 1 },
      sources: [source],
      layers: [{ id: 'cozinhas-pts', sourceId: 'src', geometry: 'point' }],
      control: {
        id: 'layers',
        // No `label` → the trigger falls back to 'Layers'.
        position: 'top-right',
        trigger: 'click',
        items: [
          {
            id: 'kitchens',
            label: 'Kitchens',
            layers: ['cozinhas-pts'],
            defaultActive: false,
          },
        ],
      },
    };
    render(
      <GeoVisProvider spec={spec}>
        <SpecProbe />
      </GeoVisProvider>
    );
    await act(async () => {});

    const trigger = await waitFor(() => {
      const el = document.querySelector('button[aria-expanded]');
      expect(el).not.toBeNull();
      return el as HTMLButtonElement;
    });
    expect(trigger.textContent).toBe('Layers');
    // Anchored top-right, pushed off the edges by the default EDGE_GAP.
    const container = trigger.parentElement as HTMLElement;
    expect(container.style.top).toBe('40px');
    expect(container.style.right).toBe('40px');

    // defaultActive:false → the layer starts hidden without any interaction.
    await waitFor(() => {
      expect(visibleById['cozinhas-pts']).toBe(false);
    });

    act(() => {
      trigger.click();
    });
    expect(findKitchenButton()!.getAttribute('aria-pressed')).toBe('false');
  });

  test('highlights an item row on pointer enter and clears it on leave', async () => {
    render(
      <GeoVisProvider spec={buildSpec('cozinhas-pts')}>
        <div />
      </GeoVisProvider>
    );
    await act(async () => {});
    await waitFor(() => {
      expect(document.querySelector('button[aria-expanded]')).not.toBeNull();
    });

    act(() => {
      openPanel();
    });
    const item = findKitchenButton()!;
    const before = item.style.backgroundColor;

    act(() => {
      fireEvent.mouseEnter(item);
    });
    expect(item.style.backgroundColor).not.toBe(before);

    act(() => {
      fireEvent.mouseLeave(item);
    });
    expect(item.style.backgroundColor).toBe(before);
  });

  test('does not mount the control overlay when the spec has no control', async () => {
    const spec: VisualizationSpec = {
      engine: 'maplibre',
      view: { center: [0, 0], zoom: 1 },
      sources: [source],
      layers: [{ id: 'lyr', sourceId: 'src', geometry: 'point' }],
    };
    render(
      <GeoVisProvider spec={spec}>
        <div />
      </GeoVisProvider>
    );
    await act(async () => {});
    expect(document.querySelector('button[aria-expanded]')).toBeNull();
  });
});
