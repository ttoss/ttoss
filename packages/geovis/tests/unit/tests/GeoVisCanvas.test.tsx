/**
 * @jest-environment jsdom
 */

import { act, render } from '@testing-library/react';
import { GeoVisCanvas } from 'src/react/GeoVisCanvas';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';

// ---------------------------------------------------------------------------
// Adapter mock
//
// Intercepts adapter.mount so we can assert which viewId reaches the ViewMap.
// The real adapter, runtime, and provider are NOT mocked: GeoVisProvider calls
// createRuntime → runtime.mount → adapter.mount, which is what we track.
// ---------------------------------------------------------------------------

// var is hoisted alongside jest.mock so the reference is valid inside the factory.
// eslint-disable-next-line no-var
var mockAdapterMount = jest.fn(() => {
  return {
    viewId: 'captured',
    container: document.createElement('div'),
    destroy: jest.fn(),
  };
});

jest.mock('src/adapters/maplibre/MapLibreAdapter', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      return {
        id: 'maplibre',
        getCapabilities: jest.fn(),
        mount: mockAdapterMount,
        update: jest.fn(),
        destroy: jest.fn(),
        getNativeInstance: jest.fn(() => {
          return null;
        }),
        setView: jest.fn(),
      };
    }),
  };
});

const baseSpec: VisualizationSpec = {
  id: 'canvas-spec',
  engine: 'maplibre',
  sources: [
    {
      id: 'layer',
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    },
  ],
  layers: [{ id: 'fill', sourceId: 'layer', geometry: 'polygon' }],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GeoVisCanvas', () => {
  test('passes viewId to adapter.mount when provided', async () => {
    await act(async () => {
      render(
        <GeoVisProvider spec={baseSpec}>
          <GeoVisCanvas viewId="primary" />
        </GeoVisProvider>
      );
    });

    // adapter.mount signature: (container, spec, viewId)
    expect(mockAdapterMount).toHaveBeenCalledTimes(1);
    expect(mockAdapterMount.mock.calls[0][2]).toBe('primary');
  });

  test('uses "default" viewId when none is provided', async () => {
    // GeoVisCanvas.viewId must not be required — the MunicipalDistrictMapData story
    // renders <GeoVisCanvas style={...} /> without viewId. When viewId is
    // undefined the adapter's ViewMap stores the map under an undefined key,
    // violating the ViewMap<string, ViewState> invariant and breaking
    // multi-view disambiguation. A default value of 'default' makes single-map
    // stories work without boilerplate while keeping multi-view stories correct.
    await act(async () => {
      render(
        <GeoVisProvider spec={baseSpec}>
          {/* viewId is optional — defaults to 'default' */}
          <GeoVisCanvas />
        </GeoVisProvider>
      );
    });

    // adapter.mount must be called with a string viewId, not undefined.
    // FAILS before fix: mockAdapterMount.mock.calls[0][2] === undefined.
    expect(mockAdapterMount).toHaveBeenCalledTimes(1);
    expect(mockAdapterMount.mock.calls[0][2]).toBe('default');
  });
});
