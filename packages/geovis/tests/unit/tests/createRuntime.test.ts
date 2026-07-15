import type {
  CapabilitySet,
  EngineAdapter,
  SpecPatch,
} from 'src/runtime/adapter';
import { createRuntime } from 'src/runtime/createRuntime';
import type { VisualizationSpec } from 'src/spec/types';

const PERMISSIVE_CAPABILITIES: CapabilitySet = {
  sourceTypes: [
    'geojson',
    'vector-tiles',
    'raster-tiles',
    'raster-dem',
    'image',
    'video',
  ],
  layerGeometries: ['polygon', 'line', 'point', 'symbol', 'heatmap', 'raster'],
  dataFeatures: { featureState: ['geojson'], filter: ['geojson'] },
  viewFeatures: { pitch: true, bearing: true },
};

const makeAdapter = (): jest.Mocked<EngineAdapter> => {
  return {
    id: 'maplibre',
    getCapabilities: jest.fn(() => {
      return PERMISSIVE_CAPABILITIES;
    }),
    mount: jest.fn(() => {
      return { unmount: jest.fn() };
    }),
    update: jest.fn(),
    applyPatch: jest.fn(),
    setView: jest.fn(),
    setSelection: jest.fn(),
    destroy: jest.fn(),
    getNativeInstance: jest.fn(),
  } as unknown as jest.Mocked<EngineAdapter>;
};

const makeSpec = (): VisualizationSpec => {
  return {
    engine: 'maplibre',
    sources: [
      {
        id: 'src-1',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      { id: 'lyr-1', sourceId: 'src-1', geometry: 'polygon', visible: true },
    ],
    view: { center: [0, 0], zoom: 10 },
  };
};

describe('createRuntime — applyPatch add/remove', () => {
  test('op:add target:layer appends the layer to currentSpec', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    const newLayer = {
      id: 'lyr-2',
      sourceId: 'src-1',
      geometry: 'line' as const,
      visible: true,
    };
    runtime.applyPatch({ target: 'layer', op: 'add', value: newLayer });
    expect(runtime.spec.layers).toHaveLength(2);
    expect(runtime.spec.layers[1]).toEqual(newLayer);
    expect(adapter.applyPatch).toHaveBeenCalledWith(
      expect.objectContaining({ op: 'add', target: 'layer' })
    );
  });

  test('op:remove target:layer removes the layer from currentSpec', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    runtime.applyPatch({ target: 'layer', op: 'remove', value: 'lyr-1' });
    expect(runtime.spec.layers).toHaveLength(0);
  });

  test('op:add target:source appends the source to currentSpec', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    const newSource = {
      id: 'src-2',
      type: 'geojson' as const,
      data: { type: 'FeatureCollection' as const, features: [] },
    };
    runtime.applyPatch({ target: 'source', op: 'add', value: newSource });
    expect(runtime.spec.sources).toHaveLength(2);
    expect(runtime.spec.sources[1]).toEqual(newSource);
  });

  test('op:remove target:source removes the source from currentSpec', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    runtime.applyPatch({ target: 'source', op: 'remove', value: 'src-1' });
    expect(runtime.spec.sources).toHaveLength(0);
  });

  test('op:replace target:layer updates paint key in currentSpec', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    runtime.applyPatch({
      target: 'layer',
      op: 'replace',
      path: 'layer.lyr-1.paint.fillColor',
      value: '#ff0000',
    });
    expect(runtime.spec.layers[0].paint).toMatchObject({
      fillColor: '#ff0000',
    });
  });

  test('op:replace with undefined value is a no-op', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    runtime.applyPatch({
      target: 'layer',
      op: 'replace',
      path: 'layer.lyr-1.paint.fillColor',
      value: undefined,
    });
    expect(adapter.applyPatch).not.toHaveBeenCalled();
  });
});

describe('createRuntime — applyPatch target:mapData', () => {
  const makeMapDataSpec = (): VisualizationSpec => {
    return {
      ...makeSpec(),
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'src-1',
          data: [
            { geometryId: 'BR', value: 211 },
            { geometryId: 'AR', value: 45 },
          ],
        },
      ],
    };
  };

  test('op:add appends the dataset to currentSpec.mapData', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    const newMd = {
      mapDataId: 'pop',
      mapId: 'src-1',
      data: [{ geometryId: 'BR', value: 211 }],
    };
    runtime.applyPatch({ target: 'mapData', op: 'add', value: newMd });
    expect(runtime.spec.mapData).toHaveLength(1);
    expect(runtime.spec.mapData?.[0]).toEqual(newMd);
  });

  test('op:remove removes the dataset by mapDataId', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeMapDataSpec());
    runtime.applyPatch({
      target: 'mapData',
      op: 'remove',
      value: 'pop',
    });
    expect(runtime.spec.mapData).toHaveLength(0);
  });

  test('op:replace at granular path updates a single row value', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeMapDataSpec());
    runtime.applyPatch({
      target: 'mapData',
      op: 'replace',
      path: 'mapData.pop.data.BR',
      value: 215,
    });
    const updated = runtime.spec.mapData?.[0].data.find((row) => {
      return String(row.geometryId) === 'BR';
    });
    expect(updated?.value).toBe(215);
  });

  test('forwards the patch to the adapter', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeMapDataSpec());
    const patch = {
      target: 'mapData' as const,
      op: 'remove' as const,
      value: 'pop',
    };
    runtime.applyPatch(patch);
    expect(adapter.applyPatch).toHaveBeenCalledWith(
      expect.objectContaining({ target: 'mapData', op: 'remove' })
    );
  });

  test('op:replace appends new row with numeric geometryId type when id is numeric', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeMapDataSpec());
    runtime.applyPatch({
      target: 'mapData',
      op: 'replace',
      path: 'mapData.pop.data.42',
      value: 99,
    });
    const appended = runtime.spec.mapData?.[0].data.find((row) => {
      return row.geometryId === 42;
    });
    expect(appended?.geometryId).toBe(42);
    expect(appended?.value).toBe(99);
  });

  test('op:replace appends new row with string geometryId type when id is not numeric', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeMapDataSpec());
    runtime.applyPatch({
      target: 'mapData',
      op: 'replace',
      path: 'mapData.pop.data.XX',
      value: 7,
    });
    const appended = runtime.spec.mapData?.[0].data.find((row) => {
      return row.geometryId === 'XX';
    });
    expect(appended?.geometryId).toBe('XX');
    expect(appended?.value).toBe(7);
  });

  test('op:replace at path depth 2 replaces the full MapData entry', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeMapDataSpec());
    const replacement = {
      mapDataId: 'pop',
      mapId: 'src-1',
      data: [{ geometryId: 'US', value: 330 }],
    };
    runtime.applyPatch({
      target: 'mapData',
      op: 'replace',
      path: 'mapData.pop',
      value: replacement,
    });
    expect(runtime.spec.mapData?.[0]).toEqual(replacement);
  });
});

describe('createRuntime — applyPatch unknown target', () => {
  test('returns an unsupported-patch-target result and does not throw when target is unrecognised', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    let result: ReturnType<typeof runtime.applyPatch>;
    expect(() => {
      result = runtime.applyPatch({
        target: 'view',
        op: 'replace',
        path: 'view.zoom',
        value: 5,
      } as unknown as SpecPatch);
    }).not.toThrow();

    expect(result!.status).toBe('unsupported');
    if (result!.status !== 'resolved') {
      expect(result!.issues).toHaveLength(1);
      expect(result!.issues[0].code).toBe('unsupported-patch-target');
      expect(result!.issues[0].message).toContain('view');
      expect(result!.issues[0].repair).toEqual([
        {
          kind: 'allowed-values',
          path: 'patch.target',
          values: ['layer', 'source', 'mapData'],
        },
      ]);
    }
    expect(adapter.applyPatch).not.toHaveBeenCalled();
  });

  test('spec is unchanged after an unknown-target patch', () => {
    const adapter = makeAdapter();
    const spec = makeSpec();
    const runtime = createRuntime(adapter, spec);

    const before = runtime.spec;
    runtime.applyPatch({
      target: 'style',
      op: 'replace',
      path: 'style.url',
      value: 'https://example.com/style.json',
    } as unknown as SpecPatch);

    expect(runtime.spec).toBe(before);
  });
});

describe('createRuntime — validation gating (Phase 3/4)', () => {
  test('update() rejects an invalid spec, never calls the adapter, and leaves spec unchanged', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    adapter.update.mockClear();

    const before = runtime.spec;
    const result = runtime.update({
      ...makeSpec(),
      layers: [{ ...makeSpec().layers[0], mapDataId: 'ghost' }],
    });

    expect(result.status).toBe('mismatch');
    expect(runtime.spec).toBe(before);
    expect(adapter.update).not.toHaveBeenCalled();
    expect(runtime.result).toBe(result);
  });

  test('update() accepts a valid spec and calls the adapter', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    const nextSpec = {
      ...makeSpec(),
      layers: [{ id: 'lyr-2', sourceId: 'src-1', geometry: 'point' as const }],
    };
    const result = runtime.update(nextSpec);

    expect(result.status).toBe('resolved');
    expect(runtime.spec.layers).toHaveLength(1);
    expect(adapter.update).toHaveBeenCalled();
  });

  test('applyPatch() rejects a patch that produces an invalid spec and never calls the adapter', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    const result = runtime.applyPatch({
      target: 'layer',
      op: 'replace',
      path: 'layer.lyr-1.paint.fillColor',
      value: '#ff0000',
    });
    // sanity: a normal patch still resolves
    expect(result.status).toBe('resolved');

    adapter.applyPatch.mockClear();
    const invalidResult = runtime.applyPatch({
      target: 'layer',
      op: 'add',
      value: {
        id: 'lyr-bad',
        sourceId: 'does-not-exist',
        geometry: 'polygon',
      },
    });

    expect(invalidResult.status).toBe('mismatch');
    expect(runtime.spec.layers).toHaveLength(1);
    expect(adapter.applyPatch).not.toHaveBeenCalled();
  });

  test('constructor validates the initial spec and exposes it via `result`', () => {
    const adapter = makeAdapter();
    const invalidInitial = {
      ...makeSpec(),
      layers: [{ ...makeSpec().layers[0], mapDataId: 'ghost' }],
    };
    const runtime = createRuntime(adapter, invalidInitial);

    expect(runtime.result.status).toBe('mismatch');
  });

  test('mount() is a no-op and does not call the adapter when the initial spec is invalid', () => {
    const adapter = makeAdapter();
    const invalidInitial = {
      ...makeSpec(),
      layers: [{ ...makeSpec().layers[0], mapDataId: 'ghost' }],
    };
    const runtime = createRuntime(adapter, invalidInitial);

    const container = {} as HTMLElement;
    const mounted = runtime.mount(container, 'default');

    expect(adapter.mount).not.toHaveBeenCalled();
    expect(() => {
      mounted.destroy();
    }).not.toThrow();
  });
});

describe('createRuntime — dispatch() (PRD-002 action surface)', () => {
  test('toggle-layer with no explicit `visible` flips the layer, compiling to the layer-visibility SpecPatch', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    const result = runtime.dispatch({ type: 'toggle-layer', layerId: 'lyr-1' });

    expect(result.status).toBe('resolved');
    expect(runtime.spec.layers[0]).toMatchObject({ visible: false });
    expect(adapter.applyPatch).toHaveBeenCalledWith(
      expect.objectContaining({
        target: 'layer',
        op: 'replace',
        path: 'layer.lyr-1.visible',
        value: false,
      })
    );
  });

  test('toggle-layer with an explicit `visible` sets that value regardless of current state', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    runtime.dispatch({ type: 'toggle-layer', layerId: 'lyr-1', visible: true });

    expect(runtime.spec.layers[0]).toMatchObject({ visible: true });
  });

  test('toggle-layer twice flips back to the original visibility', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    runtime.dispatch({ type: 'toggle-layer', layerId: 'lyr-1' });
    runtime.dispatch({ type: 'toggle-layer', layerId: 'lyr-1' });

    expect(runtime.spec.layers[0].visible).not.toBe(false);
  });

  test('an unknown layerId is rejected before touching the adapter, spec unchanged', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    adapter.applyPatch.mockClear();

    const before = runtime.spec;
    const result = runtime.dispatch({ type: 'toggle-layer', layerId: 'ghost' });

    expect(result.status).toBe('mismatch');
    if (result.status !== 'resolved') {
      expect(result.issues[0].code).toBe('unknown-layer-id');
      expect(result.issues[0].repair).toEqual([
        { kind: 'allowed-values', path: 'action.layerId', values: ['lyr-1'] },
      ]);
    }
    expect(runtime.spec).toBe(before);
    expect(adapter.applyPatch).not.toHaveBeenCalled();
    expect(runtime.result).toBe(result);
  });

  test('every dispatch — accepted or rejected — appends one action log entry with the action and its result', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    const accepted = runtime.dispatch({
      type: 'toggle-layer',
      layerId: 'lyr-1',
      rationale: 'user hid the layer',
    });
    const rejected = runtime.dispatch({
      type: 'toggle-layer',
      layerId: 'ghost',
    });

    const log = runtime.getActionLog();
    expect(log).toHaveLength(2);
    expect(log[0]).toMatchObject({
      action: {
        type: 'toggle-layer',
        layerId: 'lyr-1',
        rationale: 'user hid the layer',
      },
      result: accepted,
    });
    expect(log[1]).toMatchObject({
      action: { type: 'toggle-layer', layerId: 'ghost' },
      result: rejected,
    });
    expect(typeof log[0].timestamp).toBe('number');
  });
});

describe('createRuntime — dispatch select-feature and getSelection() (PRD-002 Phase 2)', () => {
  test('selecting a feature updates getSelection() and forwards to adapter.setSelection', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    const result = runtime.dispatch({
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: 'BR',
    });

    expect(result.status).not.toBe('invalid');
    expect(runtime.getSelection()).toEqual({
      layerId: 'lyr-1',
      featureId: 'BR',
    });
    expect(adapter.setSelection).toHaveBeenCalledWith({
      layerId: 'lyr-1',
      featureId: 'BR',
    });
  });

  test('select-feature never mutates runtime.spec — selection is runtime-level state, not spec data', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    const before = runtime.spec;

    runtime.dispatch({
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: 'BR',
    });

    expect(runtime.spec).toBe(before);
    expect(adapter.applyPatch).not.toHaveBeenCalled();
  });

  test('select-feature returns the current result unchanged (does not touch spec validity)', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    const before = runtime.result;

    const result = runtime.dispatch({
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: 'BR',
    });

    expect(result).toBe(before);
    expect(runtime.result).toBe(before);
  });

  test('featureId: null clears the selection and forwards null to adapter.setSelection', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    runtime.dispatch({
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: 'BR',
    });

    runtime.dispatch({
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: null,
    });

    expect(runtime.getSelection()).toBeNull();
    expect(adapter.setSelection).toHaveBeenLastCalledWith(null);
  });

  test('getSelection() is null before anything is selected', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    expect(runtime.getSelection()).toBeNull();
  });

  test('an unknown layerId is rejected and does not update the selection', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    const result = runtime.dispatch({
      type: 'select-feature',
      layerId: 'ghost',
      featureId: 'BR',
    });

    expect(result.status).toBe('mismatch');
    expect(runtime.getSelection()).toBeNull();
    expect(adapter.setSelection).not.toHaveBeenCalled();
  });
});

describe('createRuntime — dispatch set-map-data (PRD-002 Phase 3)', () => {
  const makeSpecWithTwoMapData = (): VisualizationSpec => {
    return {
      ...makeSpec(),
      layers: [
        {
          id: 'lyr-1',
          sourceId: 'src-1',
          geometry: 'polygon',
          mapDataId: 'pop-2010',
        },
      ],
      mapData: [
        {
          mapDataId: 'pop-2010',
          mapId: 'src-1',
          data: [{ geometryId: 'BR', value: 190 }],
        },
        {
          mapDataId: 'pop-2020',
          mapId: 'src-1',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ],
    };
  };

  test('rebinds the layer to another declared mapDataId and calls adapter.applyPatch', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpecWithTwoMapData());

    const result = runtime.dispatch({
      type: 'set-map-data',
      layerId: 'lyr-1',
      mapDataId: 'pop-2020',
    });

    expect(result.status).toBe('resolved');
    expect(runtime.spec.layers[0]).toMatchObject({ mapDataId: 'pop-2020' });
    expect(adapter.applyPatch).toHaveBeenCalledWith(
      expect.objectContaining({
        target: 'layer',
        op: 'replace',
        path: 'layer.lyr-1.mapDataId',
        value: 'pop-2020',
      })
    );
  });

  test('an unknown layerId is rejected before touching the adapter', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpecWithTwoMapData());

    const result = runtime.dispatch({
      type: 'set-map-data',
      layerId: 'ghost',
      mapDataId: 'pop-2020',
    });

    expect(result.status).toBe('mismatch');
    if (result.status !== 'resolved') {
      expect(result.issues[0].code).toBe('unknown-layer-id');
    }
    expect(adapter.applyPatch).not.toHaveBeenCalled();
  });

  test('an unknown mapDataId is rejected by the normal validateSpec pass, not a bespoke check', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpecWithTwoMapData());
    const before = runtime.spec;

    const result = runtime.dispatch({
      type: 'set-map-data',
      layerId: 'lyr-1',
      mapDataId: 'does-not-exist',
    });

    expect(result.status).toBe('mismatch');
    if (result.status !== 'resolved') {
      expect(result.issues[0].code).toBe('unknown-map-data-id');
    }
    expect(runtime.spec).toBe(before);
    expect(adapter.applyPatch).not.toHaveBeenCalled();
  });

  test('a mapDataId from a different source is rejected as a source-scope-conflict', () => {
    const adapter = makeAdapter();
    const spec: VisualizationSpec = {
      ...makeSpecWithTwoMapData(),
      sources: [
        ...makeSpecWithTwoMapData().sources,
        {
          id: 'src-2',
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        },
      ],
      mapData: [
        ...makeSpecWithTwoMapData().mapData!,
        { mapDataId: 'other-source-data', mapId: 'src-2', data: [] },
      ],
    };
    const runtime = createRuntime(adapter, spec);

    const result = runtime.dispatch({
      type: 'set-map-data',
      layerId: 'lyr-1',
      mapDataId: 'other-source-data',
    });

    expect(result.status).toBe('mismatch');
    if (result.status !== 'resolved') {
      expect(result.issues[0].code).toBe('source-scope-conflict');
    }
  });
});

describe('createRuntime — dispatch set-filter (PRD-002 Phase 4)', () => {
  test('sets the layer filter and calls adapter.applyPatch', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    const result = runtime.dispatch({
      type: 'set-filter',
      layerId: 'lyr-1',
      filter: { property: 'status', operator: 'eq', value: 'active' },
    });

    expect(result.status).toBe('resolved');
    expect(runtime.spec.layers[0]).toMatchObject({
      filter: { property: 'status', operator: 'eq', value: 'active' },
    });
    expect(adapter.applyPatch).toHaveBeenCalledWith(
      expect.objectContaining({
        target: 'layer',
        op: 'replace',
        path: 'layer.lyr-1.filter',
        value: { property: 'status', operator: 'eq', value: 'active' },
      })
    );
  });

  test('filter: null clears a previously-set filter', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    runtime.dispatch({
      type: 'set-filter',
      layerId: 'lyr-1',
      filter: { property: 'status', operator: 'eq', value: 'active' },
    });

    runtime.dispatch({ type: 'set-filter', layerId: 'lyr-1', filter: null });

    expect(runtime.spec.layers[0].filter).toBeUndefined();
  });

  test('an unknown layerId is rejected before touching the adapter', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    adapter.applyPatch.mockClear();

    const result = runtime.dispatch({
      type: 'set-filter',
      layerId: 'ghost',
      filter: { property: 'status', operator: 'eq', value: 'active' },
    });

    expect(result.status).toBe('mismatch');
    if (result.status !== 'resolved') {
      expect(result.issues[0].code).toBe('unknown-layer-id');
    }
    expect(adapter.applyPatch).not.toHaveBeenCalled();
  });

  test('a filter on a source type the adapter does not declare filter support for is rejected as unsupported-data-feature', () => {
    const adapter = makeAdapter();
    adapter.getCapabilities.mockReturnValue({
      ...PERMISSIVE_CAPABILITIES,
      dataFeatures: { featureState: ['geojson'], filter: [] },
    });
    const runtime = createRuntime(adapter, makeSpec());
    const before = runtime.spec;

    const result = runtime.dispatch({
      type: 'set-filter',
      layerId: 'lyr-1',
      filter: { property: 'status', operator: 'eq', value: 'active' },
    });

    expect(result.status).toBe('unsupported');
    if (result.status !== 'resolved') {
      expect(result.issues[0].code).toBe('unsupported-data-feature');
    }
    expect(runtime.spec).toBe(before);
    expect(adapter.applyPatch).not.toHaveBeenCalled();
  });
});

describe('createRuntime — dispatch set-view-preset (PRD-002 Phase 5)', () => {
  const makeSpecWithPresets = (): VisualizationSpec => {
    return {
      ...makeSpec(),
      viewPresets: [
        {
          id: 'overview',
          label: 'Overview',
          view: { center: [10, 20], zoom: 3 },
        },
      ],
    };
  };

  test('moves the camera via adapter.setView and syncs spec.view', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpecWithPresets());

    const result = runtime.dispatch({
      type: 'set-view-preset',
      presetId: 'overview',
    });

    expect(adapter.setView).toHaveBeenCalledWith(
      expect.objectContaining({ center: [10, 20], zoom: 3 })
    );
    expect(runtime.spec.view).toMatchObject({ center: [10, 20], zoom: 3 });
    expect(result).toBe(runtime.result);
  });

  test('never calls adapter.applyPatch (a camera move is not a SpecPatch)', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpecWithPresets());

    runtime.dispatch({ type: 'set-view-preset', presetId: 'overview' });

    expect(adapter.applyPatch).not.toHaveBeenCalled();
  });

  test('an unknown presetId is rejected before touching the adapter, spec unchanged', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpecWithPresets());
    const before = runtime.spec;

    const result = runtime.dispatch({
      type: 'set-view-preset',
      presetId: 'ghost',
    });

    expect(result.status).toBe('mismatch');
    if (result.status !== 'resolved') {
      expect(result.issues[0].code).toBe('unknown-view-preset');
      expect(result.issues[0].repair).toEqual([
        {
          kind: 'allowed-values',
          path: 'action.presetId',
          values: ['overview'],
        },
      ]);
    }
    expect(runtime.spec).toBe(before);
    expect(adapter.setView).not.toHaveBeenCalled();
  });

  test('is logged on the action log like any other dispatch', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpecWithPresets());

    runtime.dispatch({
      type: 'set-view-preset',
      presetId: 'overview',
      rationale: 'AI zoomed out to the overview',
    });

    const log = runtime.getActionLog();
    expect(log[0]).toMatchObject({
      action: {
        type: 'set-view-preset',
        presetId: 'overview',
        rationale: 'AI zoomed out to the overview',
      },
    });
  });
});

describe('createRuntime — getContextPacket() (PRD-002, ADR-0004)', () => {
  test('reports sources, layers, allowed actions, and the last result — metadata only', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    const packet = runtime.getContextPacket();

    expect(packet.schemaVersion).toBe(1);
    expect(packet.sources).toEqual([{ id: 'src-1', type: 'geojson' }]);
    expect(packet.layers).toEqual([
      { id: 'lyr-1', geometry: 'polygon', visible: true },
    ]);
    expect(packet.allowedActions).toEqual([
      'toggle-layer',
      'select-feature',
      'set-filter',
    ]);
    expect(packet.lastResult).toBe(runtime.result);
    expect(packet.warnings).toEqual([]);
  });

  test('reflects a dispatched toggle-layer immediately', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    runtime.dispatch({
      type: 'toggle-layer',
      layerId: 'lyr-1',
      visible: false,
    });

    expect(runtime.getContextPacket().layers[0]).toMatchObject({
      visible: false,
    });
  });

  test('allowedActions is empty when the spec has no layers', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, { ...makeSpec(), layers: [] });

    expect(runtime.getContextPacket().allowedActions).toEqual([]);
  });

  test('reflects a dispatched select-feature immediately', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    runtime.dispatch({
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: 'BR',
    });

    expect(runtime.getContextPacket().selection).toEqual({
      layerId: 'lyr-1',
      featureId: 'BR',
    });
  });

  test('set-map-data is allowed once the spec has both a layer and a mapData entry, and reflects a dispatched rebind', () => {
    const adapter = makeAdapter();
    const spec: VisualizationSpec = {
      ...makeSpec(),
      layers: [{ id: 'lyr-1', sourceId: 'src-1', geometry: 'polygon' }],
      mapData: [
        {
          mapDataId: 'pop-2020',
          mapId: 'src-1',
          dimension: 'color',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ],
    };
    const runtime = createRuntime(adapter, spec);

    expect(runtime.getContextPacket().allowedActions).toContain('set-map-data');

    runtime.dispatch({
      type: 'set-map-data',
      layerId: 'lyr-1',
      mapDataId: 'pop-2020',
    });

    expect(runtime.getContextPacket().layers[0]).toMatchObject({
      mapDataId: 'pop-2020',
      dimension: 'color',
    });
  });

  test('set-map-data is not allowed when the spec has no mapData entries', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    expect(runtime.getContextPacket().allowedActions).not.toContain(
      'set-map-data'
    );
  });

  test('set-filter is allowed when the adapter declares filter support for a present source type, and reflects a dispatched filter', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    expect(runtime.getContextPacket().allowedActions).toContain('set-filter');

    runtime.dispatch({
      type: 'set-filter',
      layerId: 'lyr-1',
      filter: { property: 'status', operator: 'eq', value: 'active' },
    });

    expect(runtime.getContextPacket().layers[0]).toMatchObject({
      filter: { property: 'status', operator: 'eq', value: 'active' },
    });
  });

  test('set-filter is not allowed when the adapter declares no filter-capable source types', () => {
    const adapter = makeAdapter();
    adapter.getCapabilities.mockReturnValue({
      ...PERMISSIVE_CAPABILITIES,
      dataFeatures: { featureState: ['geojson'], filter: [] },
    });
    const runtime = createRuntime(adapter, makeSpec());

    expect(runtime.getContextPacket().allowedActions).not.toContain(
      'set-filter'
    );
  });

  test('viewPresets are reported by id/label, never raw camera coordinates; set-view-preset is allowed once declared', () => {
    const adapter = makeAdapter();
    const spec: VisualizationSpec = {
      ...makeSpec(),
      viewPresets: [
        {
          id: 'overview',
          label: 'Overview',
          view: { center: [10, 20], zoom: 3 },
        },
      ],
    };
    const runtime = createRuntime(adapter, spec);

    const packet = runtime.getContextPacket();
    expect(packet.viewPresets).toEqual([{ id: 'overview', label: 'Overview' }]);
    expect(packet.allowedActions).toContain('set-view-preset');
  });

  test('set-view-preset is not allowed when the spec declares no viewPresets', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());

    const packet = runtime.getContextPacket();
    expect(packet.viewPresets).toEqual([]);
    expect(packet.allowedActions).not.toContain('set-view-preset');
  });
});
