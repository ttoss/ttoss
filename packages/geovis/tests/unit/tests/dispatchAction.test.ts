import { compileAction } from 'src/runtime/dispatchAction';
import type { VisualizationSpec } from 'src/spec/types';

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
    layers: [{ id: 'lyr-1', sourceId: 'src-1', geometry: 'polygon' }],
  };
};

describe('compileAction — toggle-layer', () => {
  test('a layer currently hidden (visible: false) flips to visible: true', () => {
    const spec: VisualizationSpec = {
      ...makeSpec(),
      layers: [
        { id: 'lyr-1', sourceId: 'src-1', geometry: 'polygon', visible: false },
      ],
    };
    const outcome = compileAction(spec, {
      type: 'toggle-layer',
      layerId: 'lyr-1',
    });
    expect(outcome).toEqual({
      patch: {
        target: 'layer',
        op: 'replace',
        path: 'layer.lyr-1.visible',
        value: true,
        rationale: undefined,
      },
    });
  });

  test('carries the action rationale onto the compiled patch', () => {
    const outcome = compileAction(makeSpec(), {
      type: 'toggle-layer',
      layerId: 'lyr-1',
      rationale: 'AI hid the layer to declutter the view',
    });
    expect('patch' in outcome && outcome.patch.rationale).toBe(
      'AI hid the layer to declutter the view'
    );
  });

  test('an unknown layerId compiles to an unknown-layer-id issue listing declared layer ids', () => {
    const outcome = compileAction(makeSpec(), {
      type: 'toggle-layer',
      layerId: 'ghost',
    });
    expect('issue' in outcome && outcome.issue).toMatchObject({
      code: 'unknown-layer-id',
      subject: { path: 'action.layerId', id: 'ghost' },
      repair: [
        { kind: 'allowed-values', path: 'action.layerId', values: ['lyr-1'] },
      ],
    });
  });
});
