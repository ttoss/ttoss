/**
 * @jest-environment jsdom
 */

import { act, render } from '@testing-library/react';
import * as React from 'react';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import type { GeoVisResult } from 'src/spec/result';
import type { VisualizationSpec } from 'src/spec/types';

// var is hoisted alongside jest.mock, so the reference is valid inside the factory.
// eslint-disable-next-line no-var
var mockRuntimeUpdate = jest.fn();
// eslint-disable-next-line no-var
var mockRuntimeApplyPatch = jest.fn();
// eslint-disable-next-line no-var
var mockRuntimeSetView = jest.fn();
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
        setView: mockRuntimeSetView,
        destroy: jest.fn(),
        getAdapter: jest.fn(),
      };
    }),
  };
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
  engine: 'maplibre',
  view: { center: [-46.6, -23.5], zoom: 10 },
  sources: [],
  layers: [],
};

/** Wraps a spec as the `GeoVisResult` shape `runtime.update`/`applyPatch` now return. */
const resolved = (spec: VisualizationSpec): GeoVisResult => {
  return { status: 'resolved', spec, warnings: [] };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRuntimeSpec = baseSpec;
  // Keep mockRuntimeSpec in sync with runtime.update() calls so that
  // runtime?.spec reflects the latest spec passed to the provider.
  mockRuntimeUpdate.mockImplementation((spec: VisualizationSpec) => {
    mockRuntimeSpec = spec;
    return resolved(spec);
  });
  mockRuntimeApplyPatch.mockImplementation(() => {
    return resolved(mockRuntimeSpec as VisualizationSpec);
  });
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

describe('GeoVisProvider result — policy warnings (ADR-0001, D4)', () => {
  test('is empty when spec has no metadata', async () => {
    const capturedRef = { current: undefined as GeoVisResult | undefined };
    const Consumer = () => {
      capturedRef.current = useGeoVis().result;
      return null;
    };
    await act(async () => {
      render(
        <GeoVisProvider spec={baseSpec}>
          <Consumer />
        </GeoVisProvider>
      );
    });
    expect(capturedRef.current?.status).toBe('resolved');
    if (capturedRef.current?.status === 'resolved') {
      expect(capturedRef.current.warnings).toEqual([]);
    }
  });

  test('has one policy-violation warning when metadata.isPolicyInvalid is true', async () => {
    const invalidSpec: VisualizationSpec = {
      ...baseSpec,
      metadata: {
        isPolicyInvalid: true,
        invalidReason: 'raw-count-choropleth',
        metricField: 'population',
        normalizedExpression: 'population / sq-km',
        normalizedLabel: 'hab por km²',
      },
    };
    const capturedRef = { current: undefined as GeoVisResult | undefined };
    const Consumer = () => {
      capturedRef.current = useGeoVis().result;
      return null;
    };
    await act(async () => {
      render(
        <GeoVisProvider spec={invalidSpec}>
          <Consumer />
        </GeoVisProvider>
      );
    });
    expect(capturedRef.current?.status).toBe('resolved');
    if (capturedRef.current?.status !== 'resolved') return;
    expect(capturedRef.current.warnings).toHaveLength(1);
    const [warning] = capturedRef.current.warnings;
    expect(warning.code).toBe('policy-violation');
    expect(warning.subject.id).toBe('raw-count-choropleth');
    expect(warning.message).toContain('population');
    expect(warning.repair).toEqual([
      {
        kind: 'set-value',
        path: 'metadata.metricField',
        value: 'population / sq-km',
        label: `Use 'population / sq-km' (hab por km²)`,
      },
    ]);
  });

  test('uses policy-invalid as fallback subject.id when invalidReason is absent, with no repair', async () => {
    const specNoReason: VisualizationSpec = {
      ...baseSpec,
      metadata: { isPolicyInvalid: true },
    };
    const capturedRef = { current: undefined as GeoVisResult | undefined };
    const Consumer = () => {
      capturedRef.current = useGeoVis().result;
      return null;
    };
    await act(async () => {
      render(
        <GeoVisProvider spec={specNoReason}>
          <Consumer />
        </GeoVisProvider>
      );
    });
    expect(capturedRef.current?.status).toBe('resolved');
    if (capturedRef.current?.status !== 'resolved') return;
    expect(capturedRef.current.warnings).toHaveLength(1);
    expect(capturedRef.current.warnings[0].subject.id).toBe('policy-invalid');
    expect(capturedRef.current.warnings[0].repair).toBeUndefined();
  });
});

describe('GeoVisProvider applyPatch updates context spec', () => {
  test('context spec reflects runtime.spec immediately after applyPatch', async () => {
    const updatedSpec: VisualizationSpec = {
      ...baseSpec,
      layers: [
        { id: 'patched', sourceId: 'src', geometry: 'polygon' as const },
      ],
    };

    // Make mockRuntimeApplyPatch update the runtime spec when called.
    mockRuntimeApplyPatch.mockImplementation(() => {
      mockRuntimeSpec = updatedSpec;
      return resolved(updatedSpec);
    });

    const latestSpecRef = { current: baseSpec as VisualizationSpec };
    const triggerPatchRef = { current: () => {} };

    const Consumer = () => {
      const { spec, applyPatch } = useGeoVis();

      latestSpecRef.current = spec as VisualizationSpec;

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

  test('a failed applyPatch surfaces through result and leaves context spec unchanged (ADR-0001)', async () => {
    const failure: GeoVisResult = {
      status: 'unsupported',
      issues: [
        {
          code: 'unsupported-patch-target',
          subject: { path: 'patch.target' },
          message: 'nope',
        },
      ],
    };
    mockRuntimeApplyPatch.mockImplementation(() => {
      return failure;
    });

    const latestRef = {
      current: null as { spec: VisualizationSpec; result: GeoVisResult } | null,
    };
    const triggerPatchRef = { current: () => {} };

    const Consumer = () => {
      const { spec, result, applyPatch } = useGeoVis();
      latestRef.current = { spec: spec as VisualizationSpec, result };
      triggerPatchRef.current = () => {
        applyPatch({ target: 'layer', op: 'remove', value: 'x' });
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

    const specBefore = latestRef.current?.spec;

    await act(async () => {
      triggerPatchRef.current();
    });

    expect(latestRef.current?.spec).toBe(specBefore);
    expect(latestRef.current?.result.status).toBe('unsupported');
  });
});

describe('GeoVisProvider setView', () => {
  test('calling setView forwards to runtime.setView and refreshes context spec', async () => {
    const Consumer = ({
      onReady,
    }: {
      onReady: (ctx: ReturnType<typeof useGeoVis>) => void;
    }) => {
      const ctx = useGeoVis();
      onReady(ctx);
      return null;
    };

    let latestCtx: ReturnType<typeof useGeoVis> | undefined;
    await act(async () => {
      render(
        <GeoVisProvider spec={baseSpec}>
          <Consumer
            onReady={(ctx) => {
              latestCtx = ctx;
            }}
          />
        </GeoVisProvider>
      );
    });

    await act(async () => {
      latestCtx?.setView({ zoom: 8 });
    });

    expect(mockRuntimeSetView).toHaveBeenCalledWith({ zoom: 8 });
  });
});

describe('GeoVisProvider effectiveSpec synchronization', () => {
  /**
   * GeoVisProvider derives `effectiveSpec` directly during render using a
   * `patchState` object: `{ forSpec, patchedSpec }`.
   *
   * - When `spec` prop matches `patchState.forSpec`, the context serves
   *   `patchedSpec` (the post-patch view of the spec).
   * - When the parent provides a new `spec` reference, `patchState.forSpec !==
   *   spec` and the context falls through to the fresh prop, automatically
   *   discarding stale patch state.
   *
   * `runtime.update(spec)` is called by a dedicated `useEffect([runtime, spec])`
   * whenever either the runtime or the spec prop changes.
   */
  test('runtime.update is called once after initial mount', async () => {
    await act(async () => {
      render(
        <GeoVisProvider spec={baseSpec}>
          <div />
        </GeoVisProvider>
      );
    });

    // The sync effect fires after the async init resolves and setRuntime is
    // called. runtime.update(spec) must be called exactly once with baseSpec.
    expect(mockRuntimeUpdate).toHaveBeenCalledTimes(1);
    expect(mockRuntimeUpdate).toHaveBeenCalledWith(baseSpec);
  });

  test('context spec (effectiveSpec) tracks spec prop through multiple changes', async () => {
    type SpecController = { setSpec: (s: VisualizationSpec) => void };
    const specCaptureRef = { current: baseSpec as VisualizationSpec };

    const Consumer = () => {
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
    expect(specCaptureRef.current.view?.zoom).toBe(10);

    const spec2: VisualizationSpec = {
      ...baseSpec,
      view: { ...baseSpec.view, zoom: 14 },
    };
    await act(async () => {
      ref.current?.setSpec(spec2);
    });
    expect(specCaptureRef.current.view?.zoom).toBe(14);

    const spec3: VisualizationSpec = {
      ...baseSpec,
      view: { ...baseSpec.view, zoom: 8 },
    };
    await act(async () => {
      ref.current?.setSpec(spec3);
    });
    expect(specCaptureRef.current.view?.zoom).toBe(8);
  });
});

describe('GeoVisProvider adapter error', () => {
  // A minimal class-based ErrorBoundary — React only supports class components
  // as error boundaries; function components cannot use getDerivedStateFromError.
  class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { caught: boolean }
  > {
    state = { caught: false };

    static getDerivedStateFromError() {
      return { caught: true };
    }

    render() {
      return this.state.caught ? this.props.fallback : this.props.children;
    }
  }

  test('ErrorBoundary catches adapter initialization error', async () => {
    // Make the MapLibreAdapter factory throw on this one invocation.
    // The dynamic import in resolveAdapter() resolves the same jest mock.
    const adapterMock = jest.requireMock(
      'src/adapters/maplibre/MapLibreAdapter'
    ) as { default: jest.MockedFunction<() => unknown> };
    adapterMock.default.mockImplementationOnce(() => {
      throw new Error('WebGL not supported');
    });

    // React logs uncaught errors to console.error during error boundary tests;
    // suppress to keep test output clean.
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      return undefined;
    });

    const { getByText, queryByText } = await act(async () => {
      return render(
        <ErrorBoundary fallback={<p>Map failed to load</p>}>
          <GeoVisProvider spec={baseSpec}>
            <p>Map loaded</p>
          </GeoVisProvider>
        </ErrorBoundary>
      );
    });

    consoleSpy.mockRestore();

    expect(getByText('Map failed to load').tagName).toBe('P');

    expect(queryByText('Map loaded')).toBeNull();
  });
});
