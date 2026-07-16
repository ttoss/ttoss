import { makeMapMock } from '../helpers/makeMapMock';

/**
 * Minimal Jest stub for `maplibre-gl`.
 *
 * Applied via `moduleNameMapper` in jest.config.ts so that any test file that
 * does NOT explicitly call `jest.mock('maplibre-gl', factory)` gets this
 * lightweight stub instead of loading the real MapLibre GL JS bundle.
 *
 * Loading the real bundle in Jest fails because it relies on browser globals
 * (`TextDecoder`, `window.URL.createObjectURL`, WebGL context, etc.) that are
 * not reliably provided by either the `node` or `jsdom` Jest environments.
 *
 * Tests that need specific mock behaviour (e.g. `useClickAnchor.test.tsx`,
 * `fitBoundsToBboxLifecycle.test.tsx`) override this stub by declaring their
 * own `jest.mock('maplibre-gl', factory)` — babel-jest hoists those calls
 * above the module resolution, so the factory wins over this file.
 */

const createMarkerMock = () => {
  return {
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
  };
};

const MapMock = jest.fn().mockImplementation(() => {
  return {
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    addControl: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    getSource: jest.fn(() => {
      return null;
    }),
    getLayer: jest.fn(() => {
      return null;
    }),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    isStyleLoaded: jest.fn(() => {
      return true;
    }),
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
    setStyle: jest.fn(),
    setCenter: jest.fn(),
    setZoom: jest.fn(),
    setPitch: jest.fn(),
    setBearing: jest.fn(),
    isSourceLoaded: jest.fn(() => {
      return false;
    }),
    setFeatureState: jest.fn(),
    getFeatureState: jest.fn(() => {
      return {};
    }),
    getCanvas: jest.fn(() => {
      return { style: {} };
    }),
    getContainer: jest.fn(() => {
      return { clientWidth: 800, clientHeight: 520 };
    }),
    resize: jest.fn(),
    fitBounds: jest.fn(),
    queryRenderedFeatures: jest.fn(() => {
      return [];
    }),
  };
});

const MarkerMock = jest.fn().mockImplementation(createMarkerMock);

const NavigationControlMock = jest.fn().mockImplementation(() => {
  return {};
});

/**
 * Builds a plain-object mock of `maplibregl.Map` with every method as a
 * `jest.fn()`. Accepts an optional `overrides` map to replace any method
 * (e.g. real event-handler tracking for `on`/`off`/`once`).
 *
 * Used by adapter, legend, hooks, companion-layers, and fitBounds tests.
 * basemapLabels uses a specialised parameterised mock and keeps its own.
 */
export const makeMapMock = (
  overrides?: Partial<Record<string, unknown>>
): Record<string, unknown> => {
  const base: Record<string, unknown> = {
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    addControl: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    getSource: jest.fn(() => {
      return null;
    }),
    getLayer: jest.fn(() => {
      return null;
    }),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    isStyleLoaded: jest.fn(() => {
      return true;
    }),
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
    setStyle: jest.fn(),
    setCenter: jest.fn(),
    setZoom: jest.fn(),
    setPitch: jest.fn(),
    setBearing: jest.fn(),
    flyTo: jest.fn(),
    jumpTo: jest.fn(),
    isSourceLoaded: jest.fn(() => {
      return false;
    }),
    setFeatureState: jest.fn(),
    getFeatureState: jest.fn(() => {
      return {};
    }),
    getCanvas: jest.fn(() => {
      return { style: {} };
    }),
    getContainer: jest.fn(() => {
      return { clientWidth: 800, clientHeight: 520 };
    }),
    resize: jest.fn(),
    fitBounds: jest.fn(),
    queryRenderedFeatures: jest.fn(() => {
      return [];
    }),
  };
  if (overrides) Object.assign(base, overrides);
  return base;
};

const maplibreglStub = {
  Map: MapMock,
  Marker: MarkerMock,
  NavigationControl: NavigationControlMock,
};

export default maplibreglStub;
module.exports = {
  __esModule: true,
  default: maplibreglStub,
  makeMapMock,
  ...maplibreglStub,
};
