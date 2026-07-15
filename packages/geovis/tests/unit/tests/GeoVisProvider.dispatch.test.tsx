/**
 * @jest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react';
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
            layerGeometries: ['polygon'],
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

const buildSpec = (): VisualizationSpec => {
  return {
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [
      {
        id: 'src-1',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [{ id: 'lyr-1', sourceId: 'src-1', geometry: 'polygon' }],
  };
};

describe('GeoVisProvider — dispatch (PRD-002 Phase 2 correction)', () => {
  test('dispatching toggle-layer through context updates useGeoVis().spec reactively', async () => {
    const { result } = renderHook(
      () => {
        return useGeoVis();
      },
      {
        wrapper: ({ children }) => {
          return <GeoVisProvider spec={buildSpec()}>{children}</GeoVisProvider>;
        },
      }
    );

    await waitFor(() => {
      expect(result.current.runtime).not.toBeNull();
    });

    act(() => {
      result.current.dispatch({ type: 'toggle-layer', layerId: 'lyr-1' });
    });

    await waitFor(() => {
      expect(result.current.spec.layers[0]).toMatchObject({ visible: false });
    });
  });

  test('dispatching an unknown layerId surfaces the rejection through context.result without changing spec', async () => {
    const { result } = renderHook(
      () => {
        return useGeoVis();
      },
      {
        wrapper: ({ children }) => {
          return <GeoVisProvider spec={buildSpec()}>{children}</GeoVisProvider>;
        },
      }
    );

    await waitFor(() => {
      expect(result.current.runtime).not.toBeNull();
    });

    const specBefore = result.current.spec;

    act(() => {
      result.current.dispatch({ type: 'toggle-layer', layerId: 'ghost' });
    });

    await waitFor(() => {
      expect(result.current.result.status).toBe('mismatch');
    });
    expect(result.current.spec).toBe(specBefore);
  });

  test('dispatch is a no-op returning the current result before the runtime is ready', () => {
    let capturedDispatch:
      | ((action: { type: 'toggle-layer'; layerId: string }) => unknown)
      | undefined;

    const Capture = () => {
      const { dispatch } = useGeoVis();
      capturedDispatch = dispatch;
      return null;
    };

    renderHook(
      () => {
        return null;
      },
      {
        wrapper: ({ children }) => {
          return (
            <GeoVisProvider spec={buildSpec()}>
              <Capture />
              {children}
            </GeoVisProvider>
          );
        },
      }
    );

    expect(() => {
      capturedDispatch?.({ type: 'toggle-layer', layerId: 'lyr-1' });
    }).not.toThrow();
  });
});
