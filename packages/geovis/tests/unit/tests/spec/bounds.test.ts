import { computeSourcesBbox, estimateMaxZoom } from 'src/spec/bounds';
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
