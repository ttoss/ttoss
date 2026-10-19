/**
 * @jest-environment jsdom
 *
 * The compass flies to the home view — the view the app's spec declares, or a
 * fit to the data when it declares none — instead of MapLibre's reset to north.
 */
import type * as maplibregl from 'maplibre-gl';
import {
  flyToHomeView,
  HOME_VIEW_DURATION_MS,
  HomeNavigationControl,
  type HomeViewSource,
} from 'src/adapters/maplibre/compassHome';
import type { VisualizationSpec } from 'src/spec/types';

// A navigation control with a real compass button whose own click handler —
// MapLibre's reset to north — is a spy, so a test can tell whether the click
// reached it.
const mockResetNorth = jest.fn();

jest.mock('maplibre-gl', () => {
  class NavigationControl {
    _map?: unknown;

    onAdd(map: unknown) {
      this._map = map;
      const group = globalThis.document.createElement('div');
      for (const className of [
        'maplibregl-ctrl-zoom-in',
        'maplibregl-ctrl-compass',
      ]) {
        const button = globalThis.document.createElement('button');
        button.className = className;
        if (className === 'maplibregl-ctrl-compass') {
          const icon = globalThis.document.createElement('span');
          icon.className = 'maplibregl-ctrl-icon';
          button.append(icon);
          button.addEventListener('click', mockResetNorth);
        }
        group.append(button);
      }
      return group;
    }

    onRemove() {}
  }
  return { __esModule: true, NavigationControl };
});

const fakeMap = () => {
  return {
    flyTo: jest.fn(),
    fitBounds: jest.fn(),
    easeTo: jest.fn(),
    getCenter: jest.fn(() => {
      return { lng: 1, lat: 2 };
    }),
    getZoom: jest.fn(() => {
      return 7;
    }),
    getContainer: jest.fn(() => {
      return { clientWidth: 1000, clientHeight: 500 };
    }),
  };
};

const sourceWith = (
  view: VisualizationSpec['view'],
  fitBbox: HomeViewSource['fitBbox'] = null
): HomeViewSource => {
  return {
    spec: { engine: 'maplibre', view, sources: [], layers: [] },
    fitBbox,
  };
};

const asMap = (map: ReturnType<typeof fakeMap>) => {
  return map as unknown as maplibregl.Map;
};

beforeEach(() => {
  mockResetNorth.mockClear();
});

describe('flyToHomeView', () => {
  test('flies to the declared view, angles included', () => {
    const map = fakeMap();
    flyToHomeView(
      asMap(map),
      sourceWith({ center: [-46.6, -23.5], zoom: 10, pitch: 45, bearing: 30 })
    );

    expect(map.flyTo).toHaveBeenCalledWith({
      center: [-46.6, -23.5],
      zoom: 10,
      pitch: 45,
      bearing: 30,
      roll: 0,
      duration: HOME_VIEW_DURATION_MS,
    });
  });

  test('levels and turns north a declared view without angles', () => {
    const map = fakeMap();
    flyToHomeView(asMap(map), sourceWith({ zoom: 4 }));

    // No `center` declared: the current one stays.
    expect(map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: { lng: 1, lat: 2 },
        zoom: 4,
        pitch: 0,
        bearing: 0,
      })
    );
  });

  test('fits the data again when the spec declares no frame', () => {
    const map = fakeMap();
    flyToHomeView(asMap(map), sourceWith({ pitch: 20 }, [-47, -24, -46, -23]));

    expect(map.flyTo).not.toHaveBeenCalled();
    expect(map.fitBounds).toHaveBeenCalledWith(
      [
        [-47, -24],
        [-46, -23],
      ],
      expect.objectContaining({
        padding: { top: 30, bottom: 30, left: 60, right: 60 },
        pitch: 20,
        bearing: 0,
        duration: HOME_VIEW_DURATION_MS,
      })
    );
  });

  test('only returns the angles while there is neither a frame nor a box', () => {
    const map = fakeMap();
    flyToHomeView(asMap(map), sourceWith(undefined));

    expect(map.flyTo).not.toHaveBeenCalled();
    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(map.easeTo).toHaveBeenCalledWith({
      pitch: 0,
      bearing: 0,
      roll: 0,
      duration: HOME_VIEW_DURATION_MS,
    });
  });
});

describe('HomeNavigationControl', () => {
  const mount = (getSource: () => HomeViewSource | undefined) => {
    const map = fakeMap();
    const control = new HomeNavigationControl({}, getSource);
    const group = control.onAdd(asMap(map));
    document.body.append(group);
    return { map, control, group };
  };

  const click = (group: HTMLElement, selector: string) => {
    group
      .querySelector(selector)!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('a compass click flies home instead of resetting north', () => {
    const { map, group } = mount(() => {
      return sourceWith({ center: [0, 0], zoom: 3, pitch: 45 });
    });

    // On the icon inside the button, as a real click usually lands.
    click(group, '.maplibregl-ctrl-compass .maplibregl-ctrl-icon');

    expect(map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [0, 0], zoom: 3, pitch: 45 })
    );
    expect(mockResetNorth).not.toHaveBeenCalled();
  });

  test('reads the home view at click time', () => {
    let zoom = 3;
    const { map, group } = mount(() => {
      return sourceWith({ center: [0, 0], zoom });
    });

    zoom = 9;
    click(group, '.maplibregl-ctrl-compass');

    expect(map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ zoom: 9 })
    );
  });

  test('leaves the other buttons alone', () => {
    const { map, group } = mount(() => {
      return sourceWith({ center: [0, 0], zoom: 3 });
    });
    const zoomIn = jest.fn();
    group
      .querySelector('.maplibregl-ctrl-zoom-in')!
      .addEventListener('click', zoomIn);

    click(group, '.maplibregl-ctrl-zoom-in');

    expect(zoomIn).toHaveBeenCalled();
    expect(map.flyTo).not.toHaveBeenCalled();
  });

  test('does nothing once the view is gone', () => {
    const { map, group } = mount(() => {
      return undefined;
    });

    click(group, '.maplibregl-ctrl-compass');

    expect(map.flyTo).not.toHaveBeenCalled();
    expect(mockResetNorth).not.toHaveBeenCalled();
  });

  test('stops listening once removed', () => {
    const { map, control, group } = mount(() => {
      return sourceWith({ center: [0, 0], zoom: 3 });
    });

    control.onRemove();
    click(group, '.maplibregl-ctrl-compass');

    expect(map.flyTo).not.toHaveBeenCalled();
    expect(mockResetNorth).toHaveBeenCalled();
  });
});
