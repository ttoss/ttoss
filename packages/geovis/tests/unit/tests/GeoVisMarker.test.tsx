/**
 * @jest-environment jsdom
 *
 * Integration tests for GeoVisMarker — validates end-to-end behavior from
 * user click to marker rendering and cleanup.
 *
 * Coverage target: ≥80% of GeoVisMarker.tsx (happy path + critical edge cases)
 */

import '@testing-library/jest-dom';

import { act, render, waitFor } from '@testing-library/react';
import maplibregl from 'maplibre-gl';
import * as React from 'react';

import { GeoVisClickContext, GeoVisContext } from '../../../src/react/contexts';
import type { GeoVisRuntime } from '../../../src/runtime/createRuntime';
import type { MapClickInfo, VisualizationSpec } from '../../../src/spec/types';
import { GeoVisMarker } from '../../../src/ui/GeoVisMarker';

// ---------------------------------------------------------------------------
// Test window interface extension
// ---------------------------------------------------------------------------

interface TestWindow extends Window {
  __testSetClick?: (click: MapClickInfo | null) => void;
}

declare const window: TestWindow;

// ---------------------------------------------------------------------------
// Mock: maplibre-gl Marker — Simple approach without DOM manipulation
// ---------------------------------------------------------------------------

interface MockMarkerOptions {
  element?: HTMLElement;
  color?: string;
  offset?: [number, number];
}

jest.mock('maplibre-gl', () => {
  const Marker = jest.fn((options?: MockMarkerOptions) => {
    return {
      setLngLat: jest.fn().mockReturnThis(),
      addTo: jest.fn().mockReturnThis(),
      remove: jest.fn(),
      __options: options, // Store for test assertions
    };
  });
  return { __esModule: true, default: { Marker } };
});

const getMockMarkerCtor = () => {
  return jest.mocked(maplibregl.Marker);
};

const getLastMarkerInstance = () => {
  const ctor = getMockMarkerCtor();
  const result = ctor.mock.results[ctor.mock.results.length - 1];
  return result?.value as {
    setLngLat: jest.Mock;
    addTo: jest.Mock;
    remove: jest.Mock;
  };
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const minimalSpec: VisualizationSpec = {
  id: 'marker-test',
  engine: 'maplibre',
  view: { center: [-46.6, -23.5], zoom: 10 },
  sources: [
    {
      id: 'test-source',
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    },
  ],
  layers: [
    {
      id: 'test-layer',
      sourceId: 'test-source',
      geometry: 'polygon',
      activeLegendId: 'test-legend',
    },
  ],
};

const mockClickInfo: MapClickInfo = {
  layerId: 'test-layer',
  sourceId: 'test-source',
  featureId: 1,
  value: 100,
  lngLat: [-46.6, -23.5],
  point: { x: 200, y: 150 },
};

// ---------------------------------------------------------------------------
// Test Wrapper — provides required contexts with controllable state
// ---------------------------------------------------------------------------

interface TestWrapperProps {
  children: React.ReactNode;
  click: MapClickInfo | null;
  spec?: VisualizationSpec;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  click,
  spec = minimalSpec,
}) => {
  // Mock map instance
  const mockMap = React.useMemo(() => {
    return {
      on: jest.fn(),
      off: jest.fn(),
      getCanvas: jest.fn(() => {
        return document.createElement('canvas');
      }),
      queryRenderedFeatures: jest.fn(() => {
        return [];
      }),
      setFeatureState: jest.fn(),
      getFeatureState: jest.fn(() => {
        return {};
      }),
    };
  }, []);

  // Mock runtime
  const mockRuntime = React.useMemo(() => {
    return {
      getAdapter: () => {
        return {
          getNativeInstance: () => {
            return mockMap;
          },
        };
      },
    };
  }, [mockMap]) as unknown as GeoVisRuntime;

  // Mock GeoVis context value
  const geovisValue = React.useMemo(() => {
    return {
      runtime: mockRuntime,
      spec,
      applyPatch: jest.fn(),
      setView: jest.fn(),
      result: { status: 'resolved', spec, warnings: [] },
    };
  }, [mockRuntime, spec]);

  return (
    <GeoVisContext.Provider value={geovisValue}>
      <GeoVisClickContext.Provider value={click}>
        {children}
      </GeoVisClickContext.Provider>
    </GeoVisContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GeoVisMarker — Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1 — Children mode creates marker with container element
  test('creates marker with container element when children provided', async () => {
    // Use a state-controlled wrapper to trigger re-renders properly
    const ControlledWrapper: React.FC = () => {
      const [clickState, setClickState] = React.useState<MapClickInfo | null>(
        null
      );

      // Expose setClickState to test
      React.useEffect(() => {
        window.__testSetClick = setClickState;
      }, []);

      return (
        <TestWrapper click={clickState}>
          <GeoVisMarker>
            <span data-testid="marker-content">Custom Marker</span>
          </GeoVisMarker>
        </TestWrapper>
      );
    };

    render(<ControlledWrapper />);

    // Initially no marker when click is null
    expect(maplibregl.Marker).not.toHaveBeenCalled();

    // Simulate click by updating state
    act(() => {
      window.__testSetClick?.(mockClickInfo);
    });

    // Marker created with container element
    await waitFor(() => {
      expect(maplibregl.Marker).toHaveBeenCalledWith(
        expect.objectContaining({ element: expect.any(HTMLDivElement) })
      );
    });

    const markerInstance = getLastMarkerInstance();
    expect(markerInstance.setLngLat).toHaveBeenCalledWith([-46.6, -23.5]);
    expect(markerInstance.addTo).toHaveBeenCalled();

    // Cleanup
    delete window.__testSetClick;
  });

  // Test 2 — Color mode
  test('creates default marker with color when no children', async () => {
    const { rerender } = render(
      <TestWrapper click={null}>
        <GeoVisMarker color="#ff0000" />
      </TestWrapper>
    );

    // No marker initially
    expect(maplibregl.Marker).not.toHaveBeenCalled();

    // Simulate click
    rerender(
      <TestWrapper click={mockClickInfo}>
        <GeoVisMarker color="#ff0000" />
      </TestWrapper>
    );

    // Verify MapLibre Marker was created with color
    await waitFor(() => {
      expect(maplibregl.Marker).toHaveBeenCalledWith(
        expect.objectContaining({ color: '#ff0000' })
      );
    });

    const markerInstance = getLastMarkerInstance();
    expect(markerInstance.setLngLat).toHaveBeenCalledWith([-46.6, -23.5]);
  });

  // Test 3 — Marker removed on click clear
  test('removes marker when click is cleared', async () => {
    const { rerender } = render(
      <TestWrapper click={mockClickInfo}>
        <GeoVisMarker color="blue" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(maplibregl.Marker).toHaveBeenCalled();
    });

    const markerInstance = getLastMarkerInstance();

    // Clear click
    rerender(
      <TestWrapper click={null}>
        <GeoVisMarker color="blue" />
      </TestWrapper>
    );

    // Marker should be removed
    await waitFor(() => {
      expect(markerInstance.remove).toHaveBeenCalled();
    });
  });

  // Test 4 — No marker when no click
  test('does not create marker when click is null', () => {
    render(
      <TestWrapper click={null}>
        <GeoVisMarker color="blue" />
      </TestWrapper>
    );

    // No click triggered
    expect(maplibregl.Marker).not.toHaveBeenCalled();
  });

  // Test 5 — className prop doesn't affect marker creation
  test('creates marker with container regardless of className prop', async () => {
    const ControlledWrapper: React.FC = () => {
      const [clickState, setClickState] = React.useState<MapClickInfo | null>(
        null
      );

      React.useEffect(() => {
        window.__testSetClick = setClickState;
      }, []);

      return (
        <TestWrapper click={clickState}>
          <GeoVisMarker className="custom-marker-class">
            <span>Content</span>
          </GeoVisMarker>
        </TestWrapper>
      );
    };

    render(<ControlledWrapper />);

    act(() => {
      window.__testSetClick?.(mockClickInfo);
    });

    // Marker created with container element (className is only applied to portal wrapper, not marker options)
    await waitFor(() => {
      expect(maplibregl.Marker).toHaveBeenCalledWith(
        expect.objectContaining({ element: expect.any(HTMLDivElement) })
      );
    });

    // Cleanup
    delete window.__testSetClick;
  });

  // Test 6 — offset passed to Marker
  test('passes offset prop to Marker options', async () => {
    const { rerender } = render(
      <TestWrapper click={null}>
        <GeoVisMarker color="green" offset={[10, -20]} />
      </TestWrapper>
    );

    rerender(
      <TestWrapper click={mockClickInfo}>
        <GeoVisMarker color="green" offset={[10, -20]} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(maplibregl.Marker).toHaveBeenCalledWith(
        expect.objectContaining({ offset: [10, -20] })
      );
    });
  });

  // Test 7 — element prop
  test('uses pre-existing element when provided', async () => {
    const customElement = document.createElement('div');
    customElement.textContent = 'Custom Element Marker';

    const { rerender } = render(
      <TestWrapper click={null}>
        <GeoVisMarker element={customElement} />
      </TestWrapper>
    );

    rerender(
      <TestWrapper click={mockClickInfo}>
        <GeoVisMarker element={customElement} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(maplibregl.Marker).toHaveBeenCalledWith(
        expect.objectContaining({ element: customElement })
      );
    });
  });

  // Test 8 — children takes priority over element and color
  test('children takes priority over element and color props', async () => {
    const customElement = document.createElement('div');

    const { rerender } = render(
      <TestWrapper click={null}>
        <GeoVisMarker element={customElement} color="red">
          <span>Child Content</span>
        </GeoVisMarker>
      </TestWrapper>
    );

    rerender(
      <TestWrapper click={mockClickInfo}>
        <GeoVisMarker element={customElement} color="red">
          <span>Child Content</span>
        </GeoVisMarker>
      </TestWrapper>
    );

    await waitFor(() => {
      const call = jest.mocked(maplibregl.Marker).mock.calls[0][0];
      // Should use container (for children), not customElement or color
      expect(call.element).toBeInstanceOf(HTMLDivElement);
      expect(call.element).not.toBe(customElement);
      expect(call.color).toBeUndefined();
    });
  });
});
