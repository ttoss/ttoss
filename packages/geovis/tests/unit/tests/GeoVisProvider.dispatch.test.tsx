/**
 * @jest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import createMapLibreAdapter from 'src/adapters/maplibre/MapLibreAdapter';
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

  /*
   * The whole point of compiling a camera action to `runtime.setView()` is that
   * the adapter moves the map itself. Feeding the resulting spec back through
   * `update()` would hand the same camera over again declaratively, and an
   * update applies a changed `view` with `setCenter`/`setZoom` — an instant
   * jump landing on top of the flight `setView` just started.
   */
  test('a camera action moves the adapter without a second update', async () => {
    const specWithPreset: VisualizationSpec = {
      ...buildSpec(),
      viewPresets: [
        {
          id: 'capital',
          view: { center: [-47.9, -15.8], zoom: 10 },
          animation: { duration: 2400, essential: true },
        },
      ],
    };

    const { result } = renderHook(
      () => {
        return useGeoVis();
      },
      {
        wrapper: ({ children }) => {
          return (
            <GeoVisProvider spec={specWithPreset}>{children}</GeoVisProvider>
          );
        },
      }
    );

    await waitFor(() => {
      expect(result.current.runtime).not.toBeNull();
    });

    const adapter = jest.mocked(createMapLibreAdapter).mock.results[0]
      .value as {
      setView: jest.Mock;
      update: jest.Mock;
    };
    const updatesBefore = adapter.update.mock.calls.length;

    await act(async () => {
      result.current.dispatch({
        type: 'set-view-preset',
        presetId: 'capital',
      });
    });

    expect(adapter.setView).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [-47.9, -15.8],
        zoom: 10,
        duration: 2400,
        essential: true,
      })
    );
    expect(adapter.update).toHaveBeenCalledTimes(updatesBefore);
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
