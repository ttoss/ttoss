/**
 * @jest-environment jsdom
 */

import { act, render } from '@testing-library/react';
import * as React from 'react';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import { applyDefaultsAsync } from 'src/spec/applyDefaults';
import type { VisualizationSpec } from 'src/spec/types';

// var is hoisted alongside jest.mock, so the reference is valid inside the factory.
// eslint-disable-next-line no-var
var mockRuntimeUpdate = jest.fn();
// eslint-disable-next-line no-var
var mockRuntimeApplyPatch = jest.fn();
// Holds the spec that runtime.spec getter returns; tests can mutate this.
// eslint-disable-next-line no-var
var mockRuntimeSpec: unknown = {};

jest.mock('src/runtime/createRuntime', () => {
  return {
    createRuntime: jest.fn(() => {
      return {
        get spec() {
          return mockRuntimeSpec;
        },
        mount: jest.fn(() => {
          return {
            viewId: 'v',
            container: {},
            destroy: jest.fn(),
          };
        }),
        update: mockRuntimeUpdate,
        applyPatch: mockRuntimeApplyPatch,
        destroy: jest.fn(),
        getAdapter: jest.fn(),
      };
    }),
  };
});

jest.mock('src/spec/applyDefaults', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actual = jest.requireActual('src/spec/applyDefaults');
  return { ...actual, applyDefaultsAsync: jest.fn() };
});

jest.mock('src/adapters/maplibre/MapLibreAdapter', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      return {
        id: 'maplibre',
        getCapabilities: jest.fn(),
        mount: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        getNativeInstance: jest.fn(() => {
          return null;
        }),
      };
    }),
  };
});

const baseSpec: VisualizationSpec = {
  id: 'test',
  engine: 'maplibre',
  view: { center: [-46.6, -23.5], zoom: 10 },
  data: [],
  layers: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRuntimeSpec = {};
});

describe('GeoVisProvider spec memoization', () => {
  test('does not call runtime.update when the same spec reference is passed again', async () => {
    type SpecController = { setSpec: (s: VisualizationSpec) => void };
    const Wrapper = React.forwardRef<SpecController, object>((_, ref) => {
      const [spec, setSpec] = React.useState<VisualizationSpec>(baseSpec);
      React.useImperativeHandle(ref, () => {
        return { setSpec };
      }, [setSpec]);
      return (
        <GeoVisProvider spec={spec}>
          <div />
        </GeoVisProvider>
      );
    });
    Wrapper.displayName = 'Wrapper';

    const ref = React.createRef<SpecController>();
    await act(async () => {
      render(<Wrapper ref={ref} />);
    });

    const callsBefore = mockRuntimeUpdate.mock.calls.length;

    // Pass the same object reference — must NOT trigger update
    await act(async () => {
      ref.current?.setSpec(baseSpec);
    });

    expect(mockRuntimeUpdate.mock.calls.length).toBe(callsBefore);
  });

  test('calls runtime.update when a new spec reference is passed', async () => {
    type SpecController = { setSpec: (s: VisualizationSpec) => void };
    const Wrapper = React.forwardRef<SpecController, object>((_, ref) => {
      const [spec, setSpec] = React.useState<VisualizationSpec>(baseSpec);
      React.useImperativeHandle(ref, () => {
        return { setSpec };
      }, [setSpec]);
      return (
        <GeoVisProvider spec={spec}>
          <div />
        </GeoVisProvider>
      );
    });
    Wrapper.displayName = 'Wrapper';

    const ref = React.createRef<SpecController>();
    await act(async () => {
      render(<Wrapper ref={ref} />);
    });

    const callsBefore = mockRuntimeUpdate.mock.calls.length;

    await act(async () => {
      ref.current?.setSpec({
        ...baseSpec,
        view: { ...baseSpec.view, zoom: 14 },
      });
    });

    expect(mockRuntimeUpdate.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});

describe('GeoVisProvider useGeoVis', () => {
  test('useGeoVis throws when used outside GeoVisProvider', () => {
    const BrokenConsumer = () => {
      useGeoVis();
      return null;
    };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {
      return undefined;
    });
    expect(() => {
      return render(<BrokenConsumer />);
    }).toThrow('useGeoVis must be used inside <GeoVisProvider>');
    spy.mockRestore();
  });
});

describe('GeoVisProvider applyPatch updates context spec', () => {
  test('context spec reflects runtime.spec immediately after applyPatch', async () => {
    const updatedSpec: VisualizationSpec = {
      ...baseSpec,
      layers: [{ id: 'patched', dataId: 'src', geometry: 'polygon' as const }],
    };

    // Make mockRuntimeApplyPatch update the runtime spec when called.
    mockRuntimeApplyPatch.mockImplementation(() => {
      mockRuntimeSpec = updatedSpec;
    });

    const latestSpecRef = { current: baseSpec as VisualizationSpec };
    const triggerPatchRef = { current: () => {} };

    const Consumer = () => {
      const { spec, applyPatch } = useGeoVis();
      // eslint-disable-next-line react-hooks/immutability
      latestSpecRef.current = spec as VisualizationSpec;
      // eslint-disable-next-line react-hooks/immutability
      triggerPatchRef.current = () => {
        applyPatch({
          target: 'layer',
          op: 'add',
          value: updatedSpec.layers[0],
        });
      };
      return null;
    };

    await act(async () => {
      render(
        <GeoVisProvider spec={baseSpec}>
          <Consumer />
        </GeoVisProvider>
      );
    });

    await act(async () => {
      triggerPatchRef.current();
    });

    expect(latestSpecRef.current.layers).toHaveLength(1);
    expect(latestSpecRef.current.layers[0].id).toBe('patched');
  });
});

describe('GeoVisProvider effectiveSpec synchronization', () => {
  /**
   * Regression test for: "When spec.engine changes, the runtime is re-created
   * but effectiveSpec is not updated. Because prevSpecRef.current is set to spec
   * in the init effect, the sync effect exits early (spec === prevSpecRef.current),
   * leaving the context serving the previous spec."
   *
   * The init effect MUST NOT set prevSpecRef.current. Only the sync effect
   * manages prevSpecRef so that after every runtime re-creation (engine change),
   * the sync effect correctly sees spec !== prevSpecRef.current and calls
   * setEffectiveSpec(spec) + runtime.update(spec).
   *
   * Observable in unit tests (single engine):
   *   - Fixed code: sync effect runs after init → runtime.update IS called once.
   *   - Buggy code: init sets prevSpecRef → sync exits early → runtime.update NOT called.
   *
   * Full engine-change scenario (requires multiple engine support / integration test):
   *   1. Mount with spec1  → effectiveSpec = spec1
   *   2. Change to spec2 (same engine) → effectiveSpec = spec2 (sync path)
   *   3. Change to spec3 (different engine) → runtime re-created
   *      Fixed: sync sees spec3 !== prevSpecRef(=spec2) → effectiveSpec = spec3
   *      Buggy: init sets prevSpecRef=spec3 → sync exits → effectiveSpec = spec2 (stale)
   */
  test('runtime.update is called once after initial mount (init must not set prevSpecRef)', async () => {
    await act(async () => {
      render(
        <GeoVisProvider spec={baseSpec}>
          <div />
        </GeoVisProvider>
      );
    });

    // The sync effect fires after the async init completes and setRuntime is called.
    // prevSpecRef starts as null → spec !== null → setEffectiveSpec + runtime.update called.
    // If the init effect had set prevSpecRef = spec, sync would have exited early here.
    expect(mockRuntimeUpdate).toHaveBeenCalledTimes(1);
    expect(mockRuntimeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: baseSpec.id,
        engine: baseSpec.engine,
        view: baseSpec.view,
        data: baseSpec.data,
        layers: baseSpec.layers,
      })
    );
  });

  test('context spec (effectiveSpec) tracks spec prop through multiple changes', async () => {
    type SpecController = { setSpec: (s: VisualizationSpec) => void };
    const specCaptureRef = { current: baseSpec as VisualizationSpec };

    const Consumer = () => {
      // eslint-disable-next-line react-hooks/immutability
      specCaptureRef.current = useGeoVis().spec as VisualizationSpec;
      return null;
    };

    const Wrapper = React.forwardRef<SpecController, object>((_, ref) => {
      const [spec, setSpec] = React.useState<VisualizationSpec>(baseSpec);
      React.useImperativeHandle(ref, () => {
        return { setSpec };
      }, [setSpec]);
      return (
        <GeoVisProvider spec={spec}>
          <Consumer />
        </GeoVisProvider>
      );
    });
    Wrapper.displayName = 'Wrapper';

    const ref = React.createRef<SpecController>();
    await act(async () => {
      render(<Wrapper ref={ref} />);
    });
    expect(specCaptureRef.current.id).toBe(baseSpec.id);

    const spec2: VisualizationSpec = {
      ...baseSpec,
      id: 'spec-v2',
      view: { ...baseSpec.view, zoom: 14 },
    };
    await act(async () => {
      ref.current?.setSpec(spec2);
    });
    expect(specCaptureRef.current.id).toBe('spec-v2');

    const spec3: VisualizationSpec = {
      ...baseSpec,
      id: 'spec-v3',
      view: { ...baseSpec.view, zoom: 8 },
    };
    await act(async () => {
      ref.current?.setSpec(spec3);
    });
    expect(specCaptureRef.current.id).toBe('spec-v3');
  });
});

describe('GeoVisProvider async geometry inference', () => {
  test('applies async-inferred geometry when geojson-url entries have no explicit layers', async () => {
    const resolvedSpec: VisualizationSpec = {
      ...baseSpec,
      layers: [
        { id: 'places-point', dataId: 'places', geometry: 'point' as const },
      ],
    };
    jest.mocked(applyDefaultsAsync).mockResolvedValue(resolvedSpec);

    const urlSpec = {
      data: [
        {
          id: 'places',
          kind: 'geojson-url' as const,
          url: 'https://example.com/places.geojson',
        },
      ],
    };

    const specCaptureRef = {
      current: null as unknown as { layers?: Array<{ geometry: string }> },
    };
    const Consumer = () => {
      // eslint-disable-next-line react-hooks/immutability
      specCaptureRef.current = useGeoVis().spec;
      return null;
    };

    await act(async () => {
      render(
        <GeoVisProvider spec={urlSpec}>
          <Consumer />
        </GeoVisProvider>
      );
    });

    expect(applyDefaultsAsync).toHaveBeenCalledWith(urlSpec);
    expect(specCaptureRef.current.layers?.[0]?.geometry).toBe('point');
  });
});
