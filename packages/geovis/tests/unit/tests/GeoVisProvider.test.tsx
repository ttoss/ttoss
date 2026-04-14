/**
 * @jest-environment jsdom
 */

import { act, render } from '@testing-library/react';
import * as React from 'react';
import { GeoVisProvider, useGeoVis } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';

const mockRuntimeUpdate = jest.fn();

jest.mock('src/runtime/createRuntime', () => {
  return {
    createRuntime: jest.fn(() => {
      return {
        get spec() {
          return {};
        },
        mount: jest.fn(() => {
          return {
            viewId: 'v',
            container: {},
            destroy: jest.fn(),
          };
        }),
        update: mockRuntimeUpdate,
        applyPatch: jest.fn(),
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
  id: 'test',
  engine: 'maplibre',
  view: { center: [-46.6, -23.5], zoom: 10 },
  sources: [],
  layers: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GeoVisProvider spec memoization', () => {
  test('does not call runtime.update when spec reference changes but content is identical', async () => {
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

    // Pass a new object reference with identical content — must NOT trigger update
    await act(async () => {
      ref.current?.setSpec({ ...baseSpec });
    });

    expect(mockRuntimeUpdate.mock.calls.length).toBe(callsBefore);
  });

  test('calls runtime.update when spec content actually changes', async () => {
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
