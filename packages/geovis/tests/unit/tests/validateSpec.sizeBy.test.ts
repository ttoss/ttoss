import type { SizeBy } from 'src/spec/types';
import { validateSpec } from 'src/spec/validateSpec';

describe('validateSpec — sizeBy', () => {
  const pointSpec = {
    id: 'sizeby-test',
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

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/range/);
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

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/finite/);
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

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/finite/);
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

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/range/);
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

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/range/);
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

    expect(result.valid).toBe(true);
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

    // sizeBy on non-point is a warning, not an error — spec should still be valid
    expect(result.valid).toBe(true);
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

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/non-finite/);
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

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(/ascending/);
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

    expect(result.valid).toBe(true);
  });

  test('rejects sizeBy with mode stepped and transform sqrt', () => {
    const result = validateSpec({
      ...pointSpec,
      layers: [
        {
          ...pointSpec.layers[0],
          // Type assertion needed: discriminated union forbids this at compile
          // time, but JSON-based specs can still produce this invalid combo.
          sizeBy: {
            range: [4, 20],
            mode: 'stepped',
            thresholds: [100, 500],
            transform: 'sqrt',
          } as SizeBy,
        },
      ],
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join('\n')).toMatch(
        /sqrt.*stepped|stepped.*sqrt|must NOT be valid/
      );
    }
  });
});
