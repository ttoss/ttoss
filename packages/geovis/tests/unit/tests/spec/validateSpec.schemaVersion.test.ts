import { SPEC_SCHEMA_VERSION } from 'src/spec/types';
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

describe('validateSpec — schemaVersion (ADR-0001 consequence)', () => {
  test('accepts a spec with no schemaVersion (treated as current)', () => {
    expect(validateSpec(baseSpec).status).toBe('resolved');
  });

  test('accepts a spec declaring the current schemaVersion', () => {
    const result = validateSpec({
      ...baseSpec,
      schemaVersion: SPEC_SCHEMA_VERSION,
    });
    expect(result.status).toBe('resolved');
  });

  test('rejects a spec declaring a stale schemaVersion, with a set-value repair', () => {
    const broken = { ...baseSpec, schemaVersion: SPEC_SCHEMA_VERSION + 1 };
    const result = validateSpec(broken);

    expect(result.status).toBe('invalid');
    if (result.status === 'resolved') return;

    const issue = result.issues.find((i) => {
      return i.code === 'invalid-schema-version';
    });
    expect(issue).toBeDefined();
    expect(issue?.repair).toEqual([
      {
        kind: 'set-value',
        path: 'schemaVersion',
        value: SPEC_SCHEMA_VERSION,
        label: `Set schemaVersion to ${SPEC_SCHEMA_VERSION}`,
      },
    ]);

    // Round-trip: applying the repair produces a spec that validates.
    const repaired = { ...broken, schemaVersion: issue!.repair![0].value };
    expect(validateSpec(repaired).status).toBe('resolved');
  });
});
