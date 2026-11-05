import { validateSpec } from 'src/spec/validateSpec';

describe('validateSpec — proximitySearch', () => {
  const BASE = {
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [
      {
        id: 'places',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [{ id: 'places-dots', sourceId: 'places', geometry: 'point' }],
  };

  const query = async () => {
    return [];
  };

  test.each([
    ['layers to search from', { layers: ['places-dots'] }],
    ['only fromAnyPoint', { fromAnyPoint: true }],
    ['both', { layers: ['places-dots'], fromAnyPoint: true }],
  ])('accepts a search with %s', (_name, search) => {
    const result = validateSpec({
      ...BASE,
      proximitySearch: { query, ...search },
    });

    expect(result.status).toBe('resolved');
  });

  test.each([
    ['neither layers nor fromAnyPoint', {}],
    ['fromAnyPoint off and no layers', { fromAnyPoint: false }],
    ['a fromAnyPoint that is not a boolean', { fromAnyPoint: 'yes' }],
  ])('rejects a search with %s', (_name, search) => {
    const result = validateSpec({
      ...BASE,
      proximitySearch: { query, ...search },
    });

    expect(result.status).not.toBe('resolved');
  });
});
