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
});
