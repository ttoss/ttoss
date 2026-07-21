import type { SizeBy } from 'src/spec/types';
import { validateSpec } from 'src/spec/validateSpec';

const issueMessages = (result: ReturnType<typeof validateSpec>): string => {
  return result.status === 'resolved'
    ? ''
    : result.issues
        .map((issue) => {
          return issue.message;
        })
        .join('\n');
};

describe('validateSpec — sizeBy', () => {
  const pointSpec = {
    engine: 'maplibre' as const,
    view: { center: [0, 0] as [number, number], zoom: 1 },
    sources: [
      {
        id: 'cities',
        type: 'geojson' as const,
        data: { type: 'FeatureCollection' as const, features: [] },
      },
    ],
    layers: [
      {
        id: 'cities-points',
        sourceId: 'cities',
        geometry: 'point' as const,
      },
    ],
  };

  test('rejects sizeBy with invalid range where min >= max', () => {
    const result = validateSpec({
      ...pointSpec,
      layers: [
        {
          ...pointSpec.layers[0],
          sizeBy: { range: [20, 4] },
        },
      ],
    });

    expect(result.status).toBe('invalid');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/range/);
      const issue = result.issues.find((i) => {
        return i.code === 'invalid-size-range';
      });
      expect(issue?.repair).toBeUndefined();
    }
  });

  test('rejects sizeBy with NaN in range', () => {
    const result = validateSpec({
      ...pointSpec,
      layers: [
        {
          ...pointSpec.layers[0],
          sizeBy: { range: [NaN, 10] },
        },
      ],
    });

    expect(result.status).toBe('invalid');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/finite/);
    }
  });

  test('rejects sizeBy with Infinity in range', () => {
    const result = validateSpec({
      ...pointSpec,
      layers: [
        {
          ...pointSpec.layers[0],
          sizeBy: { range: [1, Infinity] },
        },
      ],
    });

    expect(result.status).toBe('invalid');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/finite/);
    }
  });

  test('rejects sizeBy with min <= 0', () => {
    const result = validateSpec({
      ...pointSpec,
      layers: [
        {
          ...pointSpec.layers[0],
          sizeBy: { range: [0, 20] },
        },
      ],
    });

    expect(result.status).toBe('invalid');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/range/);
    }
  });

  test('rejects sizeBy with min === max', () => {
    const result = validateSpec({
      ...pointSpec,
      layers: [
        {
          ...pointSpec.layers[0],
          sizeBy: { range: [20, 20] },
        },
      ],
    });

    expect(result.status).toBe('invalid');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/range/);
    }
  });

  test('accepts valid sizeBy on point layer', () => {
    const result = validateSpec({
      ...pointSpec,
      layers: [
        {
          ...pointSpec.layers[0],
          sizeBy: { range: [4, 20] },
        },
      ],
    });

    expect(result.status).toBe('resolved');
  });

  test('accepts sizeBy on non-point geometry (warning only, not error)', () => {
    const result = validateSpec({
      ...pointSpec,
      layers: [
        {
          id: 'region-fill',
          sourceId: 'cities',
          geometry: 'polygon' as const,
          sizeBy: { range: [4, 20] },
        },
      ],
    });

    // sizeBy on non-point is a warning, not an error — spec should still resolve
    expect(result.status).toBe('resolved');
  });

  test('rejects sizeBy.thresholds with non-finite values', () => {
    const result = validateSpec({
      ...pointSpec,
      layers: [
        {
          ...pointSpec.layers[0],
          sizeBy: {
            range: [4, 20],
            mode: 'stepped',
            thresholds: [NaN, 500],
          },
        },
      ],
    });

    expect(result.status).toBe('invalid');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/non-finite/);
      const issue = result.issues.find((i) => {
        return i.code === 'invalid-threshold-value';
      });
      expect(issue).toBeDefined();
    }
  });

  test('rejects sizeBy.thresholds not in ascending order', () => {
    const result = validateSpec({
      ...pointSpec,
      layers: [
        {
          ...pointSpec.layers[0],
          sizeBy: {
            range: [4, 20],
            mode: 'stepped',
            thresholds: [500, 100],
          },
        },
      ],
    });

    expect(result.status).toBe('invalid');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/ascending/);
      const issue = result.issues.find((i) => {
        return i.code === 'invalid-threshold-order';
      });
      expect(issue).toBeDefined();
    }
  });

  test('accepts valid sizeBy.thresholds in ascending order', () => {
    const result = validateSpec({
      ...pointSpec,
      layers: [
        {
          ...pointSpec.layers[0],
          sizeBy: {
            range: [4, 20],
            mode: 'stepped',
            thresholds: [100, 200, 500],
          },
        },
      ],
    });

    expect(result.status).toBe('resolved');
  });

  test('rejects sizeBy with mode stepped and transform sqrt (schema-level, not a custom check)', () => {
    const result = validateSpec({
      ...pointSpec,
      layers: [
        {
          ...pointSpec.layers[0],
          // Type assertion needed: discriminated union forbids this at compile
          // time, but JSON-based specs can still produce this invalid combo.
          // The JSON Schema's `not` constraint on sizeBy rejects it before any
          // custom check runs, so this is an 'invalid-schema' issue.
          sizeBy: {
            range: [4, 20],
            mode: 'stepped',
            thresholds: [100, 500],
            transform: 'sqrt',
          } as SizeBy,
        },
      ],
    });

    expect(result.status).toBe('invalid');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/must NOT be valid/);
      expect(
        result.issues.every((issue) => {
          return issue.code === 'invalid-schema';
        })
      ).toBe(true);
    }
  });

  test('rejects sizeBy in stepped mode without thresholds or an active threshold legend', () => {
    const result = validateSpec({
      ...pointSpec,
      layers: [
        {
          ...pointSpec.layers[0],
          sizeBy: { range: [4, 20], mode: 'stepped' },
        },
      ],
    });

    expect(result.status).toBe('invalid');
    if (result.status !== 'resolved') {
      expect(issueMessages(result)).toMatch(/requires thresholds/);
      const issue = result.issues.find((i) => {
        return i.code === 'invalid-size-mode';
      });
      // No static alternative exists — thresholds depend on the data
      // distribution, so nothing is computable here.
      expect(issue?.repair).toBeUndefined();
    }
  });
});
