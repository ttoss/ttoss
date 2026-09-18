import {
  computeFeatureBbox,
  computeSourcesBbox,
  estimateMaxZoom,
} from 'src/spec/bounds';
import type { DataSource } from 'src/spec/types';

describe('computeSourcesBbox', () => {
  test('returns null for an empty sources array', () => {
    expect(computeSourcesBbox([])).toBeNull();
  });

  test('returns null when every geojson source has an empty FeatureCollection', () => {
    const sources: DataSource[] = [
      {
        id: 'empty',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ];
    expect(computeSourcesBbox(sources)).toBeNull();
  });

  test('computes the bbox of a single Point feature', () => {
    const sources: DataSource[] = [
      {
        id: 'points',
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: null,
              geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
            },
          ],
        },
      },
    ];
    expect(computeSourcesBbox(sources)).toEqual([-46.6, -23.5, -46.6, -23.5]);
  });

  test('computes the bbox of a MultiPolygon feature', () => {
    const sources: DataSource[] = [
      {
        id: 'polygons',
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: null,
              geometry: {
                type: 'MultiPolygon',
                coordinates: [
                  [
                    [
                      [-46.8, -24.0],
                      [-46.3, -24.0],
                      [-46.3, -23.3],
                      [-46.8, -23.3],
                      [-46.8, -24.0],
                    ],
                  ],
                ],
              },
            },
          ],
        },
      },
    ];
    expect(computeSourcesBbox(sources)).toEqual([-46.8, -24.0, -46.3, -23.3]);
  });

  test('walks GeometryCollection geometries', () => {
    const sources: DataSource[] = [
      {
        id: 'mixed',
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: null,
              geometry: {
                type: 'GeometryCollection',
                geometries: [
                  { type: 'Point', coordinates: [-10, -10] },
                  { type: 'Point', coordinates: [10, 10] },
                ],
              },
            },
          ],
        },
      },
    ];
    expect(computeSourcesBbox(sources)).toEqual([-10, -10, 10, 10]);
  });

  test('reads a bare GeoJSON Feature (not wrapped in a FeatureCollection)', () => {
    const sources: DataSource[] = [
      {
        id: 'bare-feature',
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: null,
          geometry: { type: 'Point', coordinates: [1, 2] },
        },
      },
    ];
    expect(computeSourcesBbox(sources)).toEqual([1, 2, 1, 2]);
  });

  test('reads a bare GeoJSON geometry (not wrapped in a Feature)', () => {
    const sources: DataSource[] = [
      {
        id: 'bare-geometry',
        type: 'geojson',
        data: { type: 'Point', coordinates: [3, 4] },
      },
    ];
    expect(computeSourcesBbox(sources)).toEqual([3, 4, 3, 4]);
  });

  test('skips a geojson source whose data is a URL string', () => {
    const sources: DataSource[] = [
      {
        id: 'remote',
        type: 'geojson',
        data: 'https://example.com/districts.geojson',
      },
    ];
    expect(computeSourcesBbox(sources)).toBeNull();
  });

  test('includes the four corners of image and video sources', () => {
    const sources: DataSource[] = [
      {
        id: 'overlay',
        type: 'image',
        url: 'https://example.com/overlay.png',
        coordinates: [
          [-10, 10],
          [10, 10],
          [10, -10],
          [-10, -10],
        ],
      },
    ];
    expect(computeSourcesBbox(sources)).toEqual([-10, -10, 10, 10]);
  });

  test('skips vector-tiles, raster-tiles and raster-dem sources (no client geometry)', () => {
    const sources: DataSource[] = [
      {
        id: 'vt',
        type: 'vector-tiles',
        tiles: ['https://example.com/{z}/{x}/{y}.pbf'],
      },
      {
        id: 'rt',
        type: 'raster-tiles',
        tiles: ['https://example.com/{z}/{x}/{y}.png'],
      },
      { id: 'rd', type: 'raster-dem', url: 'https://example.com/dem.json' },
    ];
    expect(computeSourcesBbox(sources)).toBeNull();
  });

  test('merges bounds across multiple sources', () => {
    const sources: DataSource[] = [
      {
        id: 'a',
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: null,
              geometry: { type: 'Point', coordinates: [-50, -30] },
            },
          ],
        },
      },
      {
        id: 'b',
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: null,
              geometry: { type: 'Point', coordinates: [-40, -20] },
            },
          ],
        },
      },
    ];
    expect(computeSourcesBbox(sources)).toEqual([-50, -30, -40, -20]);
  });

  test('skips null geometries and features with no coordinates', () => {
    const sources: DataSource[] = [
      {
        id: 'sparse',
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: null, geometry: null },
            {
              type: 'Feature',
              properties: null,
              geometry: { type: 'Point', coordinates: [5, 6] },
            },
          ],
        },
      },
    ];
    expect(computeSourcesBbox(sources)).toEqual([5, 6, 5, 6]);
  });
});

describe('estimateMaxZoom', () => {
  test('caps zoom low for country-sized bounding boxes', () => {
    expect(estimateMaxZoom([-70, -30, -35, 5])).toBe(8);
  });

  test('caps zoom for state/large-region bounding boxes', () => {
    expect(estimateMaxZoom([-50, -25, -48, -23])).toBe(10);
  });

  test('caps zoom for municipality-sized bounding boxes', () => {
    expect(estimateMaxZoom([-46.8253, -24.0082, -46.3653, -23.3567])).toBe(13);
  });

  test('allows the highest zoom for small neighbourhood-sized bounding boxes', () => {
    expect(estimateMaxZoom([-46.65, -23.56, -46.63, -23.54])).toBe(15);
  });
});

describe('computeFeatureBbox', () => {
  const square = (
    id: string | number,
    lng: number,
    size: number,
    props: Record<string, unknown> = {}
  ) => {
    return {
      type: 'Feature' as const,
      id,
      properties: props,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [lng, 0],
            [lng + size, 0],
            [lng + size, size],
            [lng, size],
            [lng, 0],
          ],
        ],
      },
    };
  };

  const mesh = (): DataSource => {
    return {
      id: 'malha',
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          square(3550308, -46, 1),
          square(1302603, -60, 4, { codigo: '1302603' }),
        ],
      },
    };
  };

  test('returns the box of the addressed feature alone, not of the source', () => {
    expect(computeFeatureBbox({ source: mesh(), featureId: 3550308 })).toEqual([
      -46, 0, -45, 1,
    ]);
  });

  /*
   * An id that travelled through a permalink or a selection comes back as a
   * string, while the mesh that declared it wrote a number.
   */
  test('matches across the string/number divide', () => {
    expect(
      computeFeatureBbox({ source: mesh(), featureId: '3550308' })
    ).toEqual([-46, 0, -45, 1]);
  });

  test('addresses by a promoted property when one is given', () => {
    expect(
      computeFeatureBbox({
        source: mesh(),
        featureId: '1302603',
        promoteId: 'codigo',
      })
    ).toEqual([-60, 0, -56, 4]);
  });

  test('a feature the source does not hold has no box', () => {
    expect(
      computeFeatureBbox({ source: mesh(), featureId: 'ghost' })
    ).toBeNull();
  });

  /*
   * A URL source has no client-side geometry to walk: framing one of its
   * features needs the data fetched first, the way auto-fit does it.
   */
  test('a URL-referenced source has no box to compute', () => {
    const source: DataSource = {
      id: 'remota',
      type: 'geojson',
      data: 'https://example.test/malha.geojson',
    };
    expect(computeFeatureBbox({ source, featureId: 1 })).toBeNull();
  });
});
