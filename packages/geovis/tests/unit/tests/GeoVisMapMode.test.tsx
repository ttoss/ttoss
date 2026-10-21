/**
 * @jest-environment jsdom
 */

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { GeoVisCanvas } from 'src/react/GeoVisCanvas';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import type { CameraView } from 'src/runtime/adapter';
import type { VisualizationSpec } from 'src/spec/types';

import { render } from '../renderWithI18n';

/*
 * One fake adapter per provider: the single map's, then one per split side.
 * Each records the views it mounts, the cameras it is moved to, and lets the
 * test report a camera move as the engine would.
 */
type FakeAdapter = {
  mounted: string[];
  setView: jest.Mock;
  report: (camera: CameraView) => void;
};

// var is hoisted alongside jest.mock so the reference is valid inside the factory.
// eslint-disable-next-line no-var
var mockAdapters: FakeAdapter[] = [];

jest.mock('src/adapters/maplibre/MapLibreAdapter', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      const listeners = new Set<(camera: CameraView) => void>();
      const fake: FakeAdapter = {
        mounted: [],
        setView: jest.fn(),
        report: (camera) => {
          for (const listener of listeners) listener(camera);
        },
      };
      mockAdapters.push(fake);
      return {
        id: 'maplibre',
        getCapabilities: jest.fn(),
        mount: jest.fn((container: HTMLElement, _spec, viewId: string) => {
          fake.mounted.push(viewId);
          return { viewId, container, destroy: jest.fn() };
        }),
        update: jest.fn(),
        destroy: jest.fn(),
        getNativeInstance: jest.fn(() => {
          return null;
        }),
        setView: fake.setView,
        onViewChange: (listener: (camera: CameraView) => void) => {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
      };
    }),
  };
});

const spec: VisualizationSpec = {
  engine: 'maplibre',
  view: { center: [0, 0], zoom: 3 },
  sources: [
    {
      id: 's',
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    },
  ],
  layers: [
    { id: 'areas', sourceId: 's', geometry: 'polygon' },
    { id: 'ubs-pts', sourceId: 's', geometry: 'point' },
    { id: 'parks-pts', sourceId: 's', geometry: 'point', visible: false },
  ],
  control: {
    id: 'layers',
    label: 'Camadas',
    items: [
      {
        id: 'ubs',
        label: 'UBS',
        layers: ['ubs-pts'],
        thumbnail: 'data:image/png;base64,AA==',
      },
      { id: 'parks', label: 'Parques', layers: ['parks-pts'] },
    ],
  },
  mapModeControl: true,
};

const camera: CameraView = {
  viewId: 'split-a',
  center: [-46.6, -23.5],
  zoom: 9,
  pitch: 0,
  bearing: 0,
};

const renderMap = async (mapSpec: VisualizationSpec = spec) => {
  const utils = render(
    <div style={{ width: 800, height: 600 }}>
      <GeoVisProvider spec={mapSpec}>
        <GeoVisCanvas />
      </GeoVisProvider>
    </div>
  );
  await waitFor(() => {
    expect(mockAdapters[0]?.mounted).toContain('default');
  });
  return utils;
};

const openMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Map mode' }));
};

const split = async () => {
  openMenu();
  fireEvent.click(screen.getByRole('radio', { name: /Split in two/ }));
  await waitFor(() => {
    expect(mockAdapters).toHaveLength(3);
  });
};

beforeEach(() => {
  mockAdapters = [];
});

describe('map mode', () => {
  test('no button without the opt-in', async () => {
    await renderMap({ ...spec, mapModeControl: undefined });
    expect(screen.queryByRole('button', { name: 'Map mode' })).toBeNull();
  });

  test('the menu offers both modes and closes on Escape or a click outside', async () => {
    await renderMap();

    openMenu();
    expect(
      screen
        .getByRole('radio', { name: /Single map/ })
        .getAttribute('aria-checked')
    ).toBe('true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('radiogroup')).toBeNull();

    openMenu();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('radiogroup')).toBeNull();

    // A click inside the control keeps it open; the button toggles it shut.
    openMenu();
    fireEvent.pointerDown(screen.getByRole('radiogroup'));
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(screen.getByRole('radiogroup')).toBeTruthy();
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Map mode' }));
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'Map mode' }));
    openMenu();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  test('splitting mounts a map per side, with the layer control stepping aside', async () => {
    await renderMap();
    expect(screen.getByRole('button', { name: 'Camadas' })).toBeTruthy();

    await split();

    await waitFor(() => {
      expect(mockAdapters[1].mounted).toEqual(['split-a']);
      expect(mockAdapters[2].mounted).toEqual(['split-b']);
    });
    expect(screen.queryByRole('button', { name: 'Camadas' })).toBeNull();
    expect(screen.getByText('2')).toBeTruthy();
    // The left side carries on with the item that was on; the right is empty.
    expect(
      screen.getByRole('button', { name: 'Map A layer: UBS' })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Map B layer: No layer' })
    ).toBeTruthy();
  });

  test("a side's picker chooses its item, and empties it again", async () => {
    await renderMap();
    await split();

    fireEvent.click(
      screen.getByRole('button', { name: 'Map B layer: No layer' })
    );
    fireEvent.click(screen.getByRole('option', { name: 'Parques' }));
    expect(
      screen.getByRole('button', { name: 'Map B layer: Parques' })
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Map B layer: Parques' })
    );
    expect(screen.getByRole('listbox', { name: 'Map B layer' })).toBeTruthy();
    fireEvent.click(screen.getByRole('option', { name: 'No layer' }));
    expect(
      screen.getByRole('button', { name: 'Map B layer: No layer' })
    ).toBeTruthy();
  });

  test('a picker closes on Escape or a click outside', async () => {
    await renderMap();
    await split();

    const pill = screen.getByRole('button', { name: 'Map A layer: UBS' });
    fireEvent.click(pill);
    fireEvent.pointerDown(screen.getByRole('listbox'));
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();

    fireEvent.click(pill);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  test("a side's camera is mirrored onto the other, without echo", async () => {
    await renderMap();
    await split();
    const [, left, right] = mockAdapters;

    act(() => {
      left.report(camera);
    });

    expect(right.setView).toHaveBeenCalledWith({
      center: camera.center,
      zoom: 9,
      pitch: 0,
      bearing: 0,
      animate: false,
    });
    expect(left.setView).not.toHaveBeenCalled();

    // The mirrored move reported back while it is applied is not copied again.
    right.setView.mockImplementation(() => {
      right.report({ ...camera, viewId: 'split-b' });
    });
    act(() => {
      left.report({ ...camera, zoom: 10 });
    });
    expect(left.setView).not.toHaveBeenCalled();
  });

  test('back to a single map, it remounts where the split left the camera', async () => {
    await renderMap();
    await split();
    act(() => {
      mockAdapters[1].report(camera);
    });

    openMenu();
    fireEvent.click(screen.getByRole('radio', { name: /Single map/ }));

    await waitFor(() => {
      expect(mockAdapters[0].mounted).toEqual(['default', 'default']);
    });
    expect(mockAdapters[0].setView).toHaveBeenCalledWith(
      expect.objectContaining({ center: camera.center, animate: false })
    );
    expect(screen.getByRole('button', { name: 'Camadas' })).toBeTruthy();
  });

  test('the pickers restack as the map is resized', async () => {
    let width = 800;
    const clientWidth = jest
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockImplementation(() => {
        return width;
      });
    const observed: (() => void)[] = [];
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      constructor(callback: () => void) {
        observed.push(callback);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;
    try {
      await renderMap();
      await split();
      const pill = () => {
        return screen.getByRole('button', { name: 'Map B layer: No layer' });
      };
      expect(pill().parentElement?.style.top).toBe('12px');

      width = 240;
      act(() => {
        for (const callback of observed) callback();
      });
      expect(pill().parentElement?.style.top).toBe('56px');
    } finally {
      clientWidth.mockRestore();
      globalThis.ResizeObserver = original;
    }
  });

  test('a narrow map stacks the pickers over the divider', async () => {
    const clientWidth = jest
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockReturnValue(240);
    try {
      await renderMap();
      await split();
      const pill = screen.getByRole('button', {
        name: 'Map B layer: No layer',
      });
      expect(pill.parentElement?.style.top).toBe('56px');
    } finally {
      clientWidth.mockRestore();
    }
  });
});
