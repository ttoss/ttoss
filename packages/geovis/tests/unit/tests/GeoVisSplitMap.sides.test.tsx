/**
 * @jest-environment jsdom
 */

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { GeoVisCanvas } from 'src/react/GeoVisCanvas';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import type { GeoVisSplitInput } from 'src/react/mapMode.split';
import type { CameraView } from 'src/runtime/adapter';
import type { VisualizationSpec } from 'src/spec/types';

import { render } from '../renderWithI18n';

/*
 * One fake adapter per provider: the single map's, then one per split side.
 * Each records the specs it is mounted and updated with, and lets the test
 * report a camera move as the engine would.
 */
type MockListener = (moved: CameraView) => void;

type FakeAdapter = {
  specs: VisualizationSpec[];
  report: (moved: CameraView) => void;
};

// var is hoisted alongside jest.mock so the reference is valid inside the factory.
// eslint-disable-next-line no-var
var mockAdapters: FakeAdapter[] = [];

jest.mock('src/adapters/maplibre/MapLibreAdapter', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      const listeners = new Set<MockListener>();
      const fake: FakeAdapter = {
        specs: [],
        report: (moved) => {
          for (const listener of listeners) listener(moved);
        },
      };
      mockAdapters.push(fake);
      return {
        id: 'maplibre',
        getCapabilities: jest.fn(),
        mount: jest.fn(
          (container: HTMLElement, spec: VisualizationSpec, viewId: string) => {
            fake.specs.push(spec);
            return { viewId, container, destroy: jest.fn() };
          }
        ),
        update: jest.fn((spec: VisualizationSpec) => {
          fake.specs.push(spec);
        }),
        destroy: jest.fn(),
        getNativeInstance: jest.fn(() => {
          return null;
        }),
        setView: jest.fn(),
        onViewChange: (listener: MockListener) => {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
      };
    }),
  };
});

/** A spec of one side: its own fill colour, legend and camera angles. */
const sideSpec = ({
  color,
  pitch = 0,
}: {
  color: string;
  pitch?: number;
}): VisualizationSpec => {
  return {
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 3, pitch, bearing: 0 },
    sources: [
      {
        id: 's',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      {
        id: 'areas',
        sourceId: 's',
        geometry: 'polygon',
        paint: { fillColor: color },
      },
      { id: 'ubs-pts', sourceId: 's', geometry: 'point' },
      { id: 'parks-pts', sourceId: 's', geometry: 'point', visible: false },
    ],
    legends: [
      {
        id: `legend-${color}`,
        title: color,
        position: 'bottom-right',
        colorBy: {
          type: 'quantitative',
          property: 'value',
          scale: 'threshold',
          thresholds: [10],
          colors: ['#eee', color],
        },
      },
    ],
    control: {
      id: 'layers',
      label: 'Camadas',
      items: [
        { id: 'ubs', label: 'UBS', layers: ['ubs-pts'] },
        { id: 'parks', label: 'Parques', layers: ['parks-pts'] },
      ],
    },
    mapModeControl: true,
  };
};

const red = sideSpec({ color: 'red' });
const blue = sideSpec({ color: 'blue' });

const Map = ({
  sides,
  spec = sides?.a ?? red,
}: {
  sides?: { a: VisualizationSpec; b: VisualizationSpec };
  spec?: VisualizationSpec;
}) => {
  const split: GeoVisSplitInput | undefined = sides
    ? { sides: { a: { spec: sides.a }, b: { spec: sides.b } } }
    : undefined;
  return (
    <GeoVisProvider spec={spec} split={split}>
      <GeoVisCanvas />
    </GeoVisProvider>
  );
};

const splitMap = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Map mode' }));
  fireEvent.click(screen.getByRole('radio', { name: /Split in two/ }));
  await waitFor(() => {
    expect(mockAdapters).toHaveLength(3);
    expect(mockAdapters[1].specs.length).toBeGreaterThan(0);
    expect(mockAdapters[2].specs.length).toBeGreaterThan(0);
  });
};

const lastSpec = (index: number) => {
  const { specs } = mockAdapters[index];
  return specs[specs.length - 1];
};

const fillOf = (spec: VisualizationSpec) => {
  return (
    spec.layers.find((layer) => {
      return layer.id === 'areas';
    })?.paint as { fillColor?: string }
  ).fillColor;
};

beforeEach(() => {
  mockAdapters = [];
});

describe('a split map whose sides the app builds', () => {
  test('each side draws its own spec, with the item its pill chose', async () => {
    render(<Map sides={{ a: red, b: blue }} />);
    await splitMap();

    expect(fillOf(lastSpec(1))).toBe('red');
    expect(fillOf(lastSpec(2))).toBe('blue');
    // Both sides show the item that was on, on their own spec.
    for (const index of [1, 2]) {
      const ubs = lastSpec(index).layers.find((layer) => {
        return layer.id === 'ubs-pts';
      });
      expect(ubs?.visible).toBe(true);
    }
  });

  test('each side draws its own legends, positioned', async () => {
    render(<Map sides={{ a: red, b: blue }} />);
    await splitMap();

    expect(lastSpec(1).legends?.[0]).toMatchObject({
      title: 'red',
      position: 'bottom-right',
    });
    expect(lastSpec(2).legends?.[0]).toMatchObject({
      title: 'blue',
      position: 'bottom-right',
    });
  });

  test('the side being edited is ringed, and a click on the other half edits it', async () => {
    const { container } = render(<Map sides={{ a: red, b: blue }} />);
    await splitMap();

    expect(container.querySelector('[data-split-active="a"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Edit map B' }));

    expect(container.querySelector('[data-split-active="b"]')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit map A' })).toBeTruthy();
    const pillB = screen.getByRole('button', { name: 'Map B layer: UBS' });
    expect(pillB.style.border).toContain('2px');
  });

  test("a tilt in the app's spec reaches the side, over the reader's camera", async () => {
    const { rerender } = render(<Map sides={{ a: red, b: blue }} />);
    await splitMap();
    act(() => {
      mockAdapters[1].report({
        viewId: 'split-a',
        center: [5, 5],
        zoom: 7,
        pitch: 0,
        bearing: 0,
      });
    });

    const tilted = sideSpec({ color: 'red', pitch: 45 });
    rerender(<Map sides={{ a: tilted, b: blue }} />);

    await waitFor(() => {
      expect(lastSpec(1).view).toMatchObject({
        center: [5, 5],
        zoom: 7,
        pitch: 45,
      });
    });

    // A later pick keeps the camera where the reader moved it.
    act(() => {
      mockAdapters[1].report({
        viewId: 'split-a',
        center: [5, 5],
        zoom: 7,
        pitch: 20,
        bearing: 0,
      });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Map A layer: UBS' }));
    fireEvent.click(screen.getByRole('option', { name: 'Parques' }));
    await waitFor(() => {
      expect(lastSpec(1).view?.pitch).toBe(20);
    });
  });

  test('without the app sides, no half is ringed or veiled', async () => {
    const { container } = render(<Map spec={red} />);
    await splitMap();

    expect(container.querySelector('[data-split-active]')).toBeNull();
    expect(screen.queryByRole('button', { name: /Edit map/ })).toBeNull();
  });
});

describe('the divider', () => {
  test('sits in the middle of the map the app panels leave free', async () => {
    const clientWidth = jest
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockReturnValue(800);
    try {
      const spec = { ...red, viewInsets: { left: 200 } };
      const { container } = render(<Map spec={spec} />);
      await splitMap();

      // 200 px covered, 600 free: the middle of those is 500 px in.
      const halves = Array.from(
        container.querySelectorAll<HTMLElement>('div')
      ).filter((element) => {
        return element.style.width === '500px';
      });
      expect(halves.length).toBeGreaterThan(0);
      const pillA = screen.getByRole('button', { name: 'Map A layer: UBS' });
      expect(pillA.parentElement?.style.right).toBe('312px');
    } finally {
      clientWidth.mockRestore();
    }
  });
});
