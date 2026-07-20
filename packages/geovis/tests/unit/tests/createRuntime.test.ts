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
  dataFeatures: { featureState: ['geojson'] },
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
