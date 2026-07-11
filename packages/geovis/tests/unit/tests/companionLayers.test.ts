/**
 * Happy-path tests for companion layers added by `syncSourcesAndLayers` when
 * a `VisualizationLayer` declares `hoverPaint`, `selectedPaint`, or
 * `clickAnchor.iconImage`.
 *
 * `syncSourcesAndLayers` is called directly with a minimal mock map so tests
 * are fast and completely isolated from the full adapter mount cycle.
 */

import { syncSourcesAndLayers } from 'src/adapters/maplibre/syncSourcesAndLayers';
import type { VisualizationSpec } from 'src/spec/types';

// ---------------------------------------------------------------------------
// Mock map — only the methods called by syncSourcesAndLayers are needed
// ---------------------------------------------------------------------------

const makeMapMock = () => {
  return {
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
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
  };
};

type MapMock = ReturnType<typeof makeMapMock>;

// ---------------------------------------------------------------------------
// Spec builder
// ---------------------------------------------------------------------------

type LayerExtra = Partial<VisualizationSpec['layers'][number]>;

/** Builds a minimal spec with one polygon layer, optionally extended by `extra`. */
const buildSpec = (extra: LayerExtra = {}): VisualizationSpec => {
  return {
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [
      {
        id: 'districts',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      {
        id: 'districts-fill',
        sourceId: 'districts',
        geometry: 'polygon',
        ...extra,
      } as VisualizationSpec['layers'][number],
    ],
  };
};

/** Returns the `addLayer` call arguments for the layer with the given id. */
const findAddLayerCall = (
  map: MapMock,
  layerId: string
): Record<string, unknown> | undefined => {
  const calls = jest.mocked(map.addLayer).mock.calls as Array<
    [Record<string, unknown>]
  >;
  const match = calls.find(([spec]) => {
    return spec.id === layerId;
  });
  return match ? match[0] : undefined;
};

// ---------------------------------------------------------------------------
// hoverPaint companion
// ---------------------------------------------------------------------------

describe('companion layers — hoverPaint', () => {
  test('hoverPaint → adds <id>-hover-outline line layer driven by feature-state.hover', () => {
    const map = makeMapMock();
    syncSourcesAndLayers(
      map as unknown as Parameters<typeof syncSourcesAndLayers>[0],
      buildSpec({ hoverPaint: { lineColor: '#333333', lineWidth: 2 } }),
      null
    );
    const companion = findAddLayerCall(map, 'districts-fill-hover-outline');
    expect(companion).toBeDefined();
    expect(companion!.type).toBe('line');
    expect(companion!.source).toBe('districts');
  });

  test('no hoverPaint → <id>-hover-outline is never added', () => {
    const map = makeMapMock();
    syncSourcesAndLayers(
      map as unknown as Parameters<typeof syncSourcesAndLayers>[0],
      buildSpec(),
      null
    );
    expect(
      findAddLayerCall(map, 'districts-fill-hover-outline')
    ).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// selectedPaint companion
// ---------------------------------------------------------------------------

describe('companion layers — selectedPaint', () => {
  test('selectedPaint → adds <id>-selected-outline line layer driven by feature-state.selected', () => {
    const map = makeMapMock();
    syncSourcesAndLayers(
      map as unknown as Parameters<typeof syncSourcesAndLayers>[0],
      buildSpec({ selectedPaint: { lineColor: '#1a1a1a', lineWidth: 3 } }),
      null
    );
    const companion = findAddLayerCall(map, 'districts-fill-selected-outline');
    expect(companion).toBeDefined();
    expect(companion!.type).toBe('line');
    expect(companion!.source).toBe('districts');
  });

  test('no selectedPaint → <id>-selected-outline is never added', () => {
    const map = makeMapMock();
    syncSourcesAndLayers(
      map as unknown as Parameters<typeof syncSourcesAndLayers>[0],
      buildSpec(),
      null
    );
    expect(
      findAddLayerCall(map, 'districts-fill-selected-outline')
    ).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// clickAnchor.iconImage companion
// ---------------------------------------------------------------------------

describe('companion layers — clickAnchor.iconImage', () => {
  test('clickAnchor.iconImage → adds <id>-click-anchor symbol layer filtered by feature-state.selected', () => {
    const map = makeMapMock();
    syncSourcesAndLayers(
      map as unknown as Parameters<typeof syncSourcesAndLayers>[0],
      buildSpec({ clickAnchor: { iconImage: 'marker-pin' } }),
      null
    );
    const companion = findAddLayerCall(map, 'districts-fill-click-anchor');
    expect(companion).toBeDefined();
    expect(companion!.type).toBe('symbol');
    expect(companion!.filter).toEqual([
      'boolean',
      ['feature-state', 'selected'],
      false,
    ]);
    const layout = companion!.layout as Record<string, unknown>;
    expect(layout['icon-image']).toBe('marker-pin');
  });

  test('clickAnchor without iconImage → <id>-click-anchor is never added', () => {
    const map = makeMapMock();
    syncSourcesAndLayers(
      map as unknown as Parameters<typeof syncSourcesAndLayers>[0],
      buildSpec({ clickAnchor: { color: '#2171b5' } }),
      null
    );
    expect(
      findAddLayerCall(map, 'districts-fill-click-anchor')
    ).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Removal: removing the parent layer also removes all companions
// ---------------------------------------------------------------------------

describe('companion layers — removal', () => {
  test('removing the parent layer also removes hover, selected, and click-anchor companions', () => {
    const map = makeMapMock();

    const prevSpec = buildSpec({
      hoverPaint: { lineColor: '#333333', lineWidth: 2 },
      selectedPaint: { lineColor: '#1a1a1a', lineWidth: 3 },
      clickAnchor: { iconImage: 'pin' },
    });

    // Next spec has no layers — everything should be removed.
    const nextSpec: VisualizationSpec = { ...prevSpec, layers: [] };

    // Simulate all companion layers as already mounted.
    const mounted = new Set([
      'districts-fill',
      'districts-fill-hover-outline',
      'districts-fill-selected-outline',
      'districts-fill-click-anchor',
    ]);
    jest.mocked(map.getLayer).mockImplementation((id: string) => {
      return mounted.has(id) ? ({} as ReturnType<typeof map.getLayer>) : null;
    });

    syncSourcesAndLayers(
      map as unknown as Parameters<typeof syncSourcesAndLayers>[0],
      nextSpec,
      prevSpec
    );

    const removedIds = jest.mocked(map.removeLayer).mock.calls.map(([id]) => {
      return id;
    });
    expect(removedIds).toContain('districts-fill');
    expect(removedIds).toContain('districts-fill-hover-outline');
    expect(removedIds).toContain('districts-fill-selected-outline');
    expect(removedIds).toContain('districts-fill-click-anchor');
  });
});
