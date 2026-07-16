/**
 * Shared factory for a plain-object mock of `maplibregl.Map`.
 *
 * Every method is a `jest.fn()`. Pass an optional `overrides` map to replace
 * any method (e.g. real event-handler tracking for `on`/`off`/`once`).
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
