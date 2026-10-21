/**
 * Tests for the adapter's camera reporting (`onViewChange`) and the
 * `navigationControlEnabled` switch — what the split map mode builds on.
 */

import * as maplibregl from 'maplibre-gl';
import createMapLibreAdapter from 'src/adapters/maplibre/MapLibreAdapter';

import {
  installMapLibreDomMocks,
  makeContainer,
  makeMapMock,
  makeSpec,
  resetMapLibreDomMocks,
} from './mapLibreAdapterTestUtils';

jest.mock('maplibre-gl', () => {
  return {
    Map: jest.fn(),
    NavigationControl: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

installMapLibreDomMocks();

beforeEach(() => {
  resetMapLibreDomMocks();
});

/** A map mock that reports a fixed camera and hands back its `move` handler. */
const mountWithCamera = (spec = makeSpec()) => {
  const map = {
    ...makeMapMock(),
    getCenter: jest.fn(() => {
      return { lng: -46.6, lat: -23.5 };
    }),
    getZoom: jest.fn(() => {
      return 10;
    }),
    getPitch: jest.fn(() => {
      return 30;
    }),
    getBearing: jest.fn(() => {
      return 15;
    }),
  };
  jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
    return map as never;
  });
  const adapter = createMapLibreAdapter();
  adapter.mount(makeContainer(), spec, 'left');
  const move = map.on.mock.calls.find(([event]) => {
    return event === 'move';
  })?.[1] as () => void;
  return { adapter, map, move };
};

describe('MapLibreAdapter — onViewChange', () => {
  test('reports the view and its camera on every move', () => {
    const { adapter, move } = mountWithCamera();
    const listener = jest.fn();
    adapter.onViewChange?.(listener);

    move();

    expect(listener).toHaveBeenCalledWith({
      viewId: 'left',
      center: [-46.6, -23.5],
      zoom: 10,
      pitch: 30,
      bearing: 15,
    });
  });

  test('stops reporting once unsubscribed, and reads nothing without listeners', () => {
    const { adapter, map, move } = mountWithCamera();
    const listener = jest.fn();
    const unsubscribe = adapter.onViewChange?.(listener);

    unsubscribe?.();
    move();

    expect(listener).not.toHaveBeenCalled();
    expect(map.getCenter).not.toHaveBeenCalled();
  });
});

describe('MapLibreAdapter — navigationControlEnabled', () => {
  test('mounts the navigation control by default', () => {
    const { map } = mountWithCamera();
    expect(map.addControl).toHaveBeenCalledTimes(1);
  });

  test('leaves it out when the spec turns it off', () => {
    const { map } = mountWithCamera({
      ...makeSpec(),
      navigationControlEnabled: false,
    });
    expect(map.addControl).not.toHaveBeenCalled();
  });
});
