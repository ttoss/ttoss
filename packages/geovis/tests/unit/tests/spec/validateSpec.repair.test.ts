import type { RepairOption } from 'src/spec/result';
import { validateSpec } from 'src/spec/validateSpec';

/** Sets a dotted/bracketed path (as produced by our `subject.path`/`repair.path`) on a plain object clone. */
const applyRepairPath = (
  spec: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> => {
  // Paths look like `layers[id].sourceId` or `mapData[id].mapId` — split into
  // ['layers', 'id', 'sourceId'] style segments.
  const segments = path
    .replace(/\[/g, '.')
    .replace(/\]/g, '')
    .split('.')
    .filter(Boolean);

  const clone = structuredClone(spec);
  let cursor: Record<string, unknown> = clone;
  let arrayKey: string | null = null;
  let arrayId: string | null = null;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    const isArrayContainer = Array.isArray(cursor[segment]);
    if (isArrayContainer) {
      arrayKey = segment;
      arrayId = segments[i + 1];
      const arr = cursor[segment] as Array<Record<string, unknown>>;
      const idField =
        arrayKey === 'layers'
          ? 'id'
          : arrayKey === 'mapData'
            ? 'mapDataId'
            : 'id';
      const entry = arr.find((item) => {
        return String(item[idField]) === arrayId;
      });
      if (!entry)
        throw new Error(`Could not find ${arrayKey} entry '${arrayId}'`);
      cursor = entry;
      i += 1; // skip the id segment
      continue;
    }
    if (i === segments.length - 1) {
      cursor[segment] = value;
    } else {
      cursor = cursor[segment] as Record<string, unknown>;
    }
  }

  return clone;
};

/** Applies a single repair option to a spec and returns the patched clone. */
const applyRepair = (
  spec: Record<string, unknown>,
  repair: RepairOption
): Record<string, unknown> => {
  const value = repair.kind === 'set-value' ? repair.value : repair.values[0];
  return applyRepairPath(spec, repair.path, value);
};

describe('validateSpec — repair honesty (round-trip)', () => {
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

  test('unknown-source repair produces a spec that validates', () => {
    const broken = {
      ...baseSpec,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'does-not-exist',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ],
    };

    const firstResult = validateSpec(broken);
    expect(firstResult.status).toBe('mismatch');
    if (firstResult.status === 'resolved') return;

    const issue = firstResult.issues.find((i) => {
      return i.code === 'unknown-source';
    });
    expect(issue?.repair).toBeDefined();

    const repaired = applyRepair(broken, issue!.repair![0]);
    const secondResult = validateSpec(repaired);
    expect(secondResult.status).toBe('resolved');
  });

  test('unsupported-source-type repair produces a spec that validates', () => {
    const broken = {
      ...baseSpec,
      sources: [
        ...baseSpec.sources,
        {
          id: 'tiles',
          type: 'vector-tiles' as const,
          tiles: ['https://example/{z}/{x}/{y}.pbf'],
        },
      ],
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'tiles',
          data: [{ geometryId: 'BR', value: 1 }],
        },
      ],
    };

    const firstResult = validateSpec(broken);
    expect(firstResult.status).toBe('unsupported');
    if (firstResult.status === 'resolved') return;

    const issue = firstResult.issues.find((i) => {
      return i.code === 'unsupported-source-type';
    });
    expect(issue?.repair).toBeDefined();

    // The repair targets the source's `type` field directly.
    const repaired = structuredClone(broken);
    repaired.sources[1].type = issue!.repair![0].values[0] as 'geojson';
    // A geojson source has `data`, not `tiles` — swap the shape to match, since
    // the repair only tells us the correct *type*, not a full source rewrite.
    (repaired.sources[1] as unknown as { data: unknown }).data = {
      type: 'FeatureCollection',
      features: [],
    };
    delete (repaired.sources[1] as { tiles?: unknown }).tiles;

    const secondResult = validateSpec(repaired);
    expect(secondResult.status).toBe('resolved');
  });

  test('unknown-map-data-id repair produces a spec that validates', () => {
    const broken = {
      ...baseSpec,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ],
      layers: [{ ...baseSpec.layers[0], mapDataId: 'ghost' }],
    };

    const firstResult = validateSpec(broken);
    expect(firstResult.status).toBe('mismatch');
    if (firstResult.status === 'resolved') return;

    const issue = firstResult.issues.find((i) => {
      return i.code === 'unknown-map-data-id';
    });
    expect(issue?.repair).toBeDefined();
    expect(issue!.repair![0]).toMatchObject({
      kind: 'allowed-values',
      values: ['pop'],
    });

    const repaired = applyRepair(broken, issue!.repair![0]);
    const secondResult = validateSpec(repaired);
    expect(secondResult.status).toBe('resolved');
  });

  test('source-scope-conflict repair produces a spec that validates', () => {
    const broken = {
      ...baseSpec,
      sources: [
        ...baseSpec.sources,
        {
          id: 'other',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'other',
          data: [{ geometryId: 'BR', value: 1 }],
        },
      ],
      layers: [{ ...baseSpec.layers[0], mapDataId: 'pop' }],
    };

    const firstResult = validateSpec(broken);
    expect(firstResult.status).toBe('mismatch');
    if (firstResult.status === 'resolved') return;

    const issue = firstResult.issues.find((i) => {
      return i.code === 'source-scope-conflict';
    });
    expect(issue?.repair).toBeDefined();

    const repaired = applyRepair(broken, issue!.repair![0]);
    const secondResult = validateSpec(repaired);
    expect(secondResult.status).toBe('resolved');
  });

  test('codes outside D3 never carry a repair', () => {
    const broken = {
      ...baseSpec,
      mapData: [
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [{ geometryId: 'BR', value: 10 }],
        },
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [{ geometryId: 'AR', value: 5 }],
        },
      ],
    };

    const result = validateSpec(broken);
    expect(result.status).toBe('mismatch');
    if (result.status === 'resolved') return;

    const issue = result.issues.find((i) => {
      return i.code === 'duplicate-map-data-id';
    });
    expect(issue?.repair).toBeUndefined();
  });
});
