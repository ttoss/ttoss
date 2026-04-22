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
    data: [
      {
        id: 'src-1',
        kind: 'geojson-inline',
        geojson: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      { id: 'lyr-1', dataId: 'src-1', geometry: 'polygon', visible: true },
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
      dataId: 'src-1',
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

  test('op:add target:data appends the data entry to currentSpec', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    const newEntry = {
      id: 'src-2',
      kind: 'geojson-inline' as const,
      geojson: { type: 'FeatureCollection' as const, features: [] },
    };
    runtime.applyPatch({ target: 'data', op: 'add', value: newEntry });
    expect(runtime.spec.data).toHaveLength(2);
    expect(runtime.spec.data[1]).toEqual(newEntry);
  });

  test('op:remove target:data removes the data entry from currentSpec', () => {
    const adapter = makeAdapter();
    const runtime = createRuntime(adapter, makeSpec());
    runtime.applyPatch({ target: 'data', op: 'remove', value: 'src-1' });
    expect(runtime.spec.data).toHaveLength(0);
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
