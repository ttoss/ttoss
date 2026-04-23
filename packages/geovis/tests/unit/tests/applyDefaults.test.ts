import {
  applyDefaults,
  applyDefaultsAsync,
  inferBasemap,
} from 'src/spec/applyDefaults';
import type { GeoVisDataEntry } from 'src/spec/types';

import distritosMinimal from '../../../src/fixtures/distritos-sp-populacao-idosa.minimal.json';
import geojsonUrlMapMinimal from '../../../src/fixtures/geojson-url-map.minimal.json';
import invalidChoroplethMinimal from '../../../src/fixtures/invalid-raw-count-choropleth.minimal.json';

const GEOJSON_POLYGON_DATA: GeoVisDataEntry = {
  id: 'poly',
  kind: 'geojson-inline',
  geojson: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        },
        properties: null,
      },
    ],
  },
};

const RASTER_TILES_DATA: GeoVisDataEntry = {
  id: 'tiles',
  kind: 'raster-tiles',
  tiles: ['https://example.com/{z}/{x}/{y}.png'],
};

const RASTER_DEM_DATA: GeoVisDataEntry = {
  id: 'dem',
  kind: 'raster-dem',
  url: 'https://example.com/dem.json',
};

const IMAGE_DATA: GeoVisDataEntry = {
  id: 'img',
  kind: 'image',
  url: 'https://example.com/image.png',
  coordinates: [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ],
};

describe('inferBasemap', () => {
  test('returns none:true when any data entry is raster-tiles', () => {
    const result = inferBasemap({ data: [RASTER_TILES_DATA] });
    expect(result).toEqual({ none: true });
  });

  test('returns none:true when any data entry is raster-dem', () => {
    const result = inferBasemap({ data: [RASTER_DEM_DATA] });
    expect(result).toEqual({ none: true });
  });

  test('returns none:true when any data entry is image', () => {
    const result = inferBasemap({ data: [IMAGE_DATA] });
    expect(result).toEqual({ none: true });
  });

  test('returns none:true when raster-tiles is mixed with geojson', () => {
    const result = inferBasemap({
      data: [GEOJSON_POLYGON_DATA, RASTER_TILES_DATA],
    });
    expect(result).toEqual({ none: true });
  });

  test('returns positron for side-by-side presentation', () => {
    const result = inferBasemap({
      data: [GEOJSON_POLYGON_DATA],
      presentation: 'side-by-side',
    });
    expect(result.none).toBeUndefined();
    expect(result.styleUrl).toContain('positron');
  });

  test('returns positron for time-slider presentation', () => {
    const result = inferBasemap({
      data: [GEOJSON_POLYGON_DATA],
      presentation: 'time-slider',
    });
    expect(result.none).toBeUndefined();
    expect(result.styleUrl).toContain('positron');
  });

  test('returns bright for tabs presentation', () => {
    const result = inferBasemap({
      data: [GEOJSON_POLYGON_DATA],
      presentation: 'tabs',
    });
    expect(result.styleUrl).toContain('bright');
  });

  test('returns bright when no presentation is declared', () => {
    const result = inferBasemap({ data: [GEOJSON_POLYGON_DATA] });
    expect(result.styleUrl).toContain('bright');
  });

  test('returns bright when data is empty', () => {
    const result = inferBasemap({ data: [] });
    expect(result.styleUrl).toContain('bright');
  });
});

describe('applyDefaults basemap inference', () => {
  test('applies inferred basemap when spec does not declare one', () => {
    const spec = applyDefaults({ data: [GEOJSON_POLYGON_DATA] });
    expect(spec.basemap).toBeDefined();
    expect(spec.basemap!.styleUrl).toContain('bright');
  });

  test('preserves explicit basemap when already declared', () => {
    const spec = applyDefaults({
      data: [GEOJSON_POLYGON_DATA],
      basemap: { styleUrl: 'https://custom.example.com/style.json' },
    });
    expect(spec.basemap!.styleUrl).toBe(
      'https://custom.example.com/style.json'
    );
  });

  test('preserves explicit basemap.none when declared', () => {
    const spec = applyDefaults({
      data: [GEOJSON_POLYGON_DATA],
      basemap: { none: true },
    });
    expect(spec.basemap!.none).toBe(true);
  });

  test('infers none:true for raster-tiles even without presentation', () => {
    const spec = applyDefaults({ data: [RASTER_TILES_DATA] });
    expect(spec.basemap!.none).toBe(true);
  });

  test('infers positron for side-by-side presentation', () => {
    const spec = applyDefaults({
      data: [GEOJSON_POLYGON_DATA],
      presentation: 'side-by-side',
    });
    expect(spec.basemap!.styleUrl).toContain('positron');
  });
});

// ---------------------------------------------------------------------------
// applyDefaultsAsync — URL loading
// ---------------------------------------------------------------------------

const POLYGON_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      },
      properties: null,
    },
  ],
};

describe('applyDefaultsAsync URL loading', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const urlFixtures = [
    {
      name: 'geojson-url-map',
      fixture: geojsonUrlMapMinimal,
      dataId: 'remote-geojson',
      expectedUrlPrefix: 'https://api-forja.triangulos.tech',
    },
    {
      name: 'invalid-raw-count-choropleth',
      fixture: invalidChoroplethMinimal,
      dataId: 'rwanda-provinces',
      expectedUrlPrefix: 'https://maplibre.org',
    },
    {
      name: 'distritos-sp-populacao-idosa',
      fixture: distritosMinimal,
      dataId: 'distritos',
      expectedUrlPrefix: 'https://api-forja.triangulos.tech',
    },
  ];

  for (const entry of urlFixtures) {
    test(`fixture "${entry.name}": fetches its geojson-url and infers polygon geometry from the response`, async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => {
          return POLYGON_GEOJSON;
        },
      } as Response);

      const spec = await applyDefaultsAsync(entry.fixture);

      const calledUrl = jest.mocked(global.fetch).mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain(entry.expectedUrlPrefix);

      const layer = spec.layers.find((l) => {
        return l.dataId === entry.dataId;
      });
      expect(layer).toBeDefined();
      expect(layer?.geometry).toBe('polygon');
    });
  }

  test('infers point geometry when fetched GeoJSON contains Point features', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => {
        return {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [-46.6, -23.5] },
              properties: null,
            },
          ],
        };
      },
    } as Response);

    const spec = await applyDefaultsAsync(geojsonUrlMapMinimal);

    const layer = spec.layers.find((l) => {
      return l.dataId === 'remote-geojson';
    });
    expect(layer?.geometry).toBe('point');
  });

  test('falls back to polygon when the server returns a non-ok response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const spec = await applyDefaultsAsync(geojsonUrlMapMinimal);

    const layer = spec.layers.find((l) => {
      return l.dataId === 'remote-geojson';
    });
    expect(layer?.geometry).toBe('polygon');
  });

  test('falls back to polygon when the network request throws', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const spec = await applyDefaultsAsync(geojsonUrlMapMinimal);

    const layer = spec.layers.find((l) => {
      return l.dataId === 'remote-geojson';
    });
    expect(layer?.geometry).toBe('polygon');
  });
});
