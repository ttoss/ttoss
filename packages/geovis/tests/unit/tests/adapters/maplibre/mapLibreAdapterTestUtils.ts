/**
 * Shared fixtures for the MapLibreAdapter suites.
 *
 * `jest.mock('maplibre-gl')` deliberately stays in each test file: babel-jest
 * hoists it above that file's imports, which only works in the file itself.
 */

/** Installs the DOM globals `injectMaplibreCSS` touches. */
export const installMapLibreDomMocks = (): void => {
  Object.defineProperty(global, 'document', {
    value: {
      getElementById: jest.fn(() => {
        return null;
      }),
      createElement: jest.fn(() => {
        return { id: '', rel: '', href: '', style: {} };
      }),
      head: { appendChild: jest.fn() },
    },
    writable: true,
  });

  Object.defineProperty(global, 'URL', {
    value: jest.fn(() => {
      return { href: 'mocked-css-url' };
    }),
    writable: true,
  });
};

/** Returns the DOM mocks to their default state between tests. */
export const resetMapLibreDomMocks = (): void => {
  jest.clearAllMocks();
  (document.getElementById as jest.Mock).mockReturnValue(null);
  (document.createElement as jest.Mock).mockReturnValue({
    id: '',
    rel: '',
    href: '',
  });
};

export const makeMapMock = () => {
  return {
    on: jest.fn(),
    once: jest.fn(),
    remove: jest.fn(),
    // `nonCancelableTouchMove` attaches its listener here, so the adapter
    // throws without it.
    getCanvasContainer: jest.fn(() => {
      return { addEventListener: jest.fn(), removeEventListener: jest.fn() };
    }),
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
    moveLayer: jest.fn(),
    getStyle: jest.fn(() => {
      return { layers: [] };
    }),
    isStyleLoaded: jest.fn(() => {
      return true;
    }),
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
    setFeatureState: jest.fn(),
    setFilter: jest.fn(),
    setStyle: jest.fn(),
    setCenter: jest.fn(),
    setZoom: jest.fn(),
    setMaxZoom: jest.fn(),
    setMinZoom: jest.fn(),
    setPitch: jest.fn(),
    setBearing: jest.fn(),
  };
};

export const makeSpec = () => {
  return {
    engine: 'maplibre' as const,
    view: { center: [-46.6, -23.5] as [number, number], zoom: 10 },
    sources: [],
    layers: [],
  };
};

export const makeContainer = () => {
  return { style: {} } as unknown as HTMLElement;
};
