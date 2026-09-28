import { validateSpec } from 'src/spec/validateSpec';

describe('validateSpec — images (pins)', () => {
  const PIN_SPEC = {
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [
      {
        id: 'places',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      {
        id: 'places-pins',
        sourceId: 'places',
        geometry: 'symbol',
        paint: { iconImage: 'hospital-pin', iconAnchor: 'bottom' },
      },
    ],
  };

  test('accepts pin images referenced by a symbol layer', () => {
    const result = validateSpec({
      ...PIN_SPEC,
      images: [
        {
          id: 'hospital-pin',
          kind: 'pin',
          icon: 'maki:hospital',
          color: '#C0392B',
          iconColor: '#ffffff',
          size: 32,
        },
      ],
    });

    expect(result.status).toBe('resolved');
  });

  test.each([
    ['an unknown kind', { kind: 'sprite' }],
    ['no icon', { icon: undefined }],
    ['a zero size', { size: 0 }],
  ])('rejects a pin image with %s', (_name, override) => {
    const result = validateSpec({
      ...PIN_SPEC,
      images: [
        {
          id: 'hospital-pin',
          kind: 'pin',
          icon: 'maki:hospital',
          color: '#C0392B',
          ...override,
        },
      ],
    });

    expect(result.status).not.toBe('resolved');
  });
});
