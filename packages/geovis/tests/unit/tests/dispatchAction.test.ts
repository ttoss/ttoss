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

describe('compileAction — select-feature', () => {
  test('selecting a known feature on a layer with no mapData join compiles to that selection unchecked', () => {
    const outcome = compileAction(makeSpec(), {
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: 'BR',
    });
    expect(outcome).toEqual({
      selection: { layerId: 'lyr-1', featureId: 'BR' },
    });
  });

  test('featureId: null always compiles to clearing the selection, skipping the layerId check entirely', () => {
    const outcome = compileAction(makeSpec(), {
      type: 'select-feature',
      layerId: 'ghost',
      featureId: null,
    });
    expect(outcome).toEqual({ selection: null });
  });

  test('an unknown layerId (when selecting, not clearing) compiles to an unknown-layer-id issue', () => {
    const outcome = compileAction(makeSpec(), {
      type: 'select-feature',
      layerId: 'ghost',
      featureId: 'BR',
    });
    expect('issue' in outcome && outcome.issue).toMatchObject({
      code: 'unknown-layer-id',
      subject: { path: 'action.layerId', id: 'ghost' },
    });
  });

  test("a featureId absent from the layer's joined mapData rows compiles to an unknown-feature-id issue", () => {
    const spec: VisualizationSpec = {
      ...makeSpec(),
      layers: [
        {
          id: 'lyr-1',
          sourceId: 'src-1',
          geometry: 'polygon',
          mapDataId: 'pop',
        },
      ],
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'src-1',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ],
    };
    const outcome = compileAction(spec, {
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: 'ghost-feature',
    });
    expect('issue' in outcome && outcome.issue).toMatchObject({
      code: 'unknown-feature-id',
      subject: { path: 'action.featureId', id: 'ghost-feature' },
      repair: [
        { kind: 'allowed-values', path: 'action.featureId', values: ['BR'] },
      ],
    });
  });

  test("a featureId present in the layer's joined mapData rows compiles successfully", () => {
    const spec: VisualizationSpec = {
      ...makeSpec(),
      layers: [
        {
          id: 'lyr-1',
          sourceId: 'src-1',
          geometry: 'polygon',
          mapDataId: 'pop',
        },
      ],
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'src-1',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ],
    };
    const outcome = compileAction(spec, {
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: 'BR',
    });
    expect(outcome).toEqual({
      selection: { layerId: 'lyr-1', featureId: 'BR' },
    });
  });

  test('a layer with mapDataId pointing to a since-removed mapData entry skips the featureId check', () => {
    const spec: VisualizationSpec = {
      ...makeSpec(),
      layers: [
        {
          id: 'lyr-1',
          sourceId: 'src-1',
          geometry: 'polygon',
          mapDataId: 'ghost-mapdata',
        },
      ],
    };
    const outcome = compileAction(spec, {
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: 'anything',
    });
    expect(outcome).toEqual({
      selection: { layerId: 'lyr-1', featureId: 'anything' },
    });
  });

  test('carries the action rationale through (type-level check; rationale is not part of the selection outcome)', () => {
    const outcome = compileAction(makeSpec(), {
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: 'BR',
      rationale: 'AI inspected the highest-population state',
    });
    expect(outcome).toEqual({
      selection: { layerId: 'lyr-1', featureId: 'BR' },
    });
  });
});

describe('compileAction — set-map-data', () => {
  test('compiles to a layer.<id>.mapDataId replace patch, carrying the rationale', () => {
    const outcome = compileAction(makeSpec(), {
      type: 'set-map-data',
      layerId: 'lyr-1',
      mapDataId: 'pop-2020',
      rationale: 'AI switched to the 2020 census dataset',
    });
    expect(outcome).toEqual({
      patch: {
        target: 'layer',
        op: 'replace',
        path: 'layer.lyr-1.mapDataId',
        value: 'pop-2020',
        rationale: 'AI switched to the 2020 census dataset',
      },
    });
  });

  test('an unknown layerId compiles to an unknown-layer-id issue', () => {
    const outcome = compileAction(makeSpec(), {
      type: 'set-map-data',
      layerId: 'ghost',
      mapDataId: 'pop-2020',
    });
    expect('issue' in outcome && outcome.issue).toMatchObject({
      code: 'unknown-layer-id',
      subject: { path: 'action.layerId', id: 'ghost' },
    });
  });

  test('does not itself validate mapDataId — that is left to validateSpec downstream', () => {
    // A bogus mapDataId still compiles to a patch; createRuntime's dispatch()
    // is what rejects it via the normal validateSpec pass (see createRuntime.test.ts).
    const outcome = compileAction(makeSpec(), {
      type: 'set-map-data',
      layerId: 'lyr-1',
      mapDataId: 'does-not-exist',
    });
    expect('patch' in outcome).toBe(true);
  });
});

describe('compileAction — set-filter', () => {
  test('compiles to a layer.<id>.filter replace patch, carrying the rationale', () => {
    const outcome = compileAction(makeSpec(), {
      type: 'set-filter',
      layerId: 'lyr-1',
      filter: { property: 'status', operator: 'eq', value: 'active' },
      rationale: 'AI narrowed the view to active regions',
    });
    expect(outcome).toEqual({
      patch: {
        target: 'layer',
        op: 'replace',
        path: 'layer.lyr-1.filter',
        value: { property: 'status', operator: 'eq', value: 'active' },
        rationale: 'AI narrowed the view to active regions',
      },
    });
  });

  test('filter: null compiles to value: null, never value: undefined (which would be a no-op downstream)', () => {
    const outcome = compileAction(makeSpec(), {
      type: 'set-filter',
      layerId: 'lyr-1',
      filter: null,
    });
    expect('patch' in outcome && outcome.patch.value).toBeNull();
  });

  test('an unknown layerId compiles to an unknown-layer-id issue', () => {
    const outcome = compileAction(makeSpec(), {
      type: 'set-filter',
      layerId: 'ghost',
      filter: { property: 'status', operator: 'eq', value: 'active' },
    });
    expect('issue' in outcome && outcome.issue).toMatchObject({
      code: 'unknown-layer-id',
      subject: { path: 'action.layerId', id: 'ghost' },
    });
  });
});

describe('compileAction — set-view-preset', () => {
  const specWithPresets = (): VisualizationSpec => {
    return {
      ...makeSpec(),
      viewPresets: [
        {
          id: 'overview',
          label: 'Overview',
          view: { center: [0, 0], zoom: 2 },
        },
        { id: 'detail', view: { zoom: 8, pitch: 30, bearing: 45 } },
      ],
    };
  };

  test('resolves the declared preset to SetViewOptions', () => {
    const outcome = compileAction(specWithPresets(), {
      type: 'set-view-preset',
      presetId: 'overview',
    });
    expect(outcome).toEqual({
      setViewOptions: {
        center: [0, 0],
        zoom: 2,
        pitch: undefined,
        bearing: undefined,
      },
    });
  });

  test('carries every camera field the preset declares', () => {
    const outcome = compileAction(specWithPresets(), {
      type: 'set-view-preset',
      presetId: 'detail',
    });
    expect(outcome).toEqual({
      setViewOptions: { center: undefined, zoom: 8, pitch: 30, bearing: 45 },
    });
  });

  test('an unknown presetId compiles to an unknown-view-preset issue listing declared preset ids', () => {
    const outcome = compileAction(specWithPresets(), {
      type: 'set-view-preset',
      presetId: 'ghost',
    });
    expect('issue' in outcome && outcome.issue).toMatchObject({
      code: 'unknown-view-preset',
      subject: { path: 'action.presetId', id: 'ghost' },
      repair: [
        {
          kind: 'allowed-values',
          path: 'action.presetId',
          values: ['overview', 'detail'],
        },
      ],
    });
  });

  test('a spec with no viewPresets always rejects with an empty allowed-values list', () => {
    const outcome = compileAction(makeSpec(), {
      type: 'set-view-preset',
      presetId: 'anything',
    });
    expect('issue' in outcome && outcome.issue).toMatchObject({
      code: 'unknown-view-preset',
      repair: [{ kind: 'allowed-values', values: [] }],
    });
  });
});
