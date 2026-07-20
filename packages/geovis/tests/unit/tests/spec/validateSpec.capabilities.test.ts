import type { CapabilitySet } from 'src/runtime/adapter';
import { validateSpec } from 'src/spec/validateSpec';

const baseSpec = {
  engine: 'maplibre' as const,
  view: { center: [0, 0] as [number, number], zoom: 1 },
  sources: [
    {
      id: 'states',
      type: 'geojson' as const,
      data: { type: 'FeatureCollection' as const, features: [] },
    },
  ],
  layers: [
    { id: 'states-fill', sourceId: 'states', geometry: 'polygon' as const },
  ],
};

/** A deliberately restrictive capability set — only geojson/polygon, no camera tilt. */
const restrictiveCapabilities: CapabilitySet = {
  sourceTypes: ['geojson'],
  layerGeometries: ['polygon'],
  dataFeatures: { featureState: ['geojson'], filter: ['geojson'] },
  viewFeatures: { pitch: false, bearing: false },
};

describe('validateSpec — capabilities (ADR-0002)', () => {
  test('omitting capabilities skips capability checks entirely', () => {
    const spec = {
      ...baseSpec,
      sources: [
        { id: 'tiles', type: 'raster-dem' as const, tiles: ['a/{z}/{x}/{y}'] },
      ],
      layers: [{ id: 'l', sourceId: 'tiles', geometry: 'heatmap' as const }],
    };
    const result = validateSpec(spec);
    expect(result.status).toBe('resolved');
  });

  test('rejects a source type the adapter does not declare', () => {
    const spec = {
      ...baseSpec,
      sources: [
        {
          id: 'tiles',
          type: 'vector-tiles' as const,
          tiles: ['https://example/{z}/{x}/{y}.pbf'],
        },
      ],
      layers: [{ id: 'l', sourceId: 'tiles', geometry: 'polygon' as const }],
    };
    const result = validateSpec(spec, restrictiveCapabilities);
    expect(result.status).toBe('unsupported');
    if (result.status === 'resolved') return;
    const issue = result.issues.find((i) => {
      return i.code === 'unsupported-source-type' && i.subject.id === 'tiles';
    });
    expect(issue?.repair).toEqual([
      {
        kind: 'allowed-values',
        path: 'sources[tiles].type',
        values: ['geojson'],
      },
    ]);
  });

  test('rejects a layer geometry the adapter does not render', () => {
    const spec = {
      ...baseSpec,
      layers: [{ id: 'l', sourceId: 'states', geometry: 'heatmap' as const }],
    };
    const result = validateSpec(spec, restrictiveCapabilities);
    expect(result.status).toBe('unsupported');
    if (result.status === 'resolved') return;
    const issue = result.issues.find((i) => {
      return i.code === 'unsupported-layer-type';
    });
    expect(issue?.repair).toEqual([
      {
        kind: 'allowed-values',
        path: 'layers[l].geometry',
        values: ['polygon'],
      },
    ]);
  });

  test('rejects a view pitch the adapter does not support, with a set-value repair', () => {
    const spec = {
      ...baseSpec,
      view: { ...baseSpec.view, pitch: 45 },
    };
    const result = validateSpec(spec, restrictiveCapabilities);
    expect(result.status).toBe('unsupported');
    if (result.status === 'resolved') return;
    const issue = result.issues.find((i) => {
      return (
        i.code === 'unsupported-view-feature' && i.subject.path === 'view.pitch'
      );
    });
    expect(issue?.repair).toEqual([
      {
        kind: 'set-value',
        path: 'view.pitch',
        value: 0,
        label: 'Remove pitch (flat view)',
      },
    ]);

    const repaired = { ...spec, view: { ...spec.view, pitch: 0 } };
    expect(validateSpec(repaired, restrictiveCapabilities).status).toBe(
      'resolved'
    );
  });

  test('rejects a view bearing the adapter does not support, with a set-value repair', () => {
    const spec = {
      ...baseSpec,
      view: { ...baseSpec.view, bearing: 90 },
    };
    const result = validateSpec(spec, restrictiveCapabilities);
    expect(result.status).toBe('unsupported');
    if (result.status === 'resolved') return;
    const issue = result.issues.find((i) => {
      return (
        i.code === 'unsupported-view-feature' &&
        i.subject.path === 'view.bearing'
      );
    });
    expect(issue?.repair).toEqual([
      {
        kind: 'set-value',
        path: 'view.bearing',
        value: 0,
        label: 'Remove bearing (north-up view)',
      },
    ]);
  });

  test('rejects a layer filter when the adapter does not declare the filter capability for its source type (PRD-002)', () => {
    const noFilterCapabilities: CapabilitySet = {
      ...restrictiveCapabilities,
      dataFeatures: { featureState: ['geojson'], filter: [] },
    };
    const spec = {
      ...baseSpec,
      layers: [
        {
          id: 'states-fill',
          sourceId: 'states',
          geometry: 'polygon' as const,
          filter: {
            property: 'status',
            operator: 'eq' as const,
            value: 'active',
          },
        },
      ],
    };
    const result = validateSpec(spec, noFilterCapabilities);
    expect(result.status).toBe('unsupported');
    if (result.status === 'resolved') return;
    const issue = result.issues.find((i) => {
      return i.code === 'unsupported-data-feature';
    });
    expect(issue).toMatchObject({
      code: 'unsupported-data-feature',
      subject: { path: 'layers[states-fill].filter', id: 'states-fill' },
      repair: [
        {
          kind: 'allowed-values',
          path: 'sources[states].type',
          values: [],
        },
      ],
    });
  });

  test('accepts a layer filter when the adapter declares the filter capability for its source type', () => {
    const spec = {
      ...baseSpec,
      layers: [
        {
          id: 'states-fill',
          sourceId: 'states',
          geometry: 'polygon' as const,
          filter: {
            property: 'status',
            operator: 'eq' as const,
            value: 'active',
          },
        },
      ],
    };
    expect(validateSpec(spec, restrictiveCapabilities).status).toBe('resolved');
  });

  test('a layer with no filter is unaffected by a restrictive filter capability', () => {
    const noFilterCapabilities: CapabilitySet = {
      ...restrictiveCapabilities,
      dataFeatures: { featureState: ['geojson'], filter: [] },
    };
    expect(validateSpec(baseSpec, noFilterCapabilities).status).toBe(
      'resolved'
    );
  });

  test('a permissive capability set accepts everything the restrictive one rejects', () => {
    const permissive: CapabilitySet = {
      sourceTypes: ['geojson', 'vector-tiles'],
      layerGeometries: ['polygon', 'heatmap'],
      dataFeatures: { featureState: ['geojson'], filter: ['geojson'] },
      viewFeatures: { pitch: true, bearing: true },
    };
    const spec = {
      ...baseSpec,
      sources: [
        ...baseSpec.sources,
        {
          id: 'tiles',
          type: 'vector-tiles' as const,
          tiles: ['https://example/{z}/{x}/{y}.pbf'],
        },
      ],
      layers: [
        ...baseSpec.layers,
        { id: 'heat', sourceId: 'tiles', geometry: 'heatmap' as const },
      ],
      view: { ...baseSpec.view, pitch: 45, bearing: 90 },
    };
    expect(validateSpec(spec, permissive).status).toBe('resolved');
  });
});
