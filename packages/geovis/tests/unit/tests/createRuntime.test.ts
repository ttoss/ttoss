import type { EngineAdapter } from 'src/runtime/adapter';
import { createRuntime } from 'src/runtime/createRuntime';
import type { VisualizationSpec } from 'src/spec/types';

const makeAdapter = (): jest.Mocked<EngineAdapter> => {
  return {
    mount: jest.fn(() => {
      return { unmount: jest.fn() };
    }),
    update: jest.fn(),
    applyPatch: jest.fn(),
    destroy: jest.fn(),
    getNativeInstance: jest.fn(),
  };
};

const makeSpec = (): VisualizationSpec => {
  return {
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

  // 2.1
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

  // 2.2
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

  // 2.3
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

  // 2.4
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
});
