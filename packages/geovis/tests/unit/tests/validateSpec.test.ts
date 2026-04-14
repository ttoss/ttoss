import { validateSpec } from 'src/spec/validateSpec';

import geojsonUrlMap from '../../../src/fixtures/geojson-url-map.json';
import imageMap from '../../../src/fixtures/image-map.json';
import rasterDemMap from '../../../src/fixtures/raster-dem-map.json';
import rasterTilesMap from '../../../src/fixtures/raster-tiles-map.json';
import singleMap from '../../../src/fixtures/single-map.json';
import vectorTilesMap from '../../../src/fixtures/vector-tiles-map.json';
import videoMap from '../../../src/fixtures/video-map.json';

describe('validateSpec', () => {
  test.each([
    ['single-map (geojson source)', singleMap],
    ['geojson-url-map (geojson url source)', geojsonUrlMap],
    ['vector-tiles-map (vector-tiles source)', vectorTilesMap],
    ['raster-tiles-map (raster-tiles source)', rasterTilesMap],
    ['raster-dem-map (raster-dem source)', rasterDemMap],
    ['video-map (video source)', videoMap],
    ['image-map (image source)', imageMap],
  ])('fixture "%s" is valid', (_name, fixture) => {
    const result = validateSpec(fixture);

    expect(result.valid).toBe(true);
  });

  test('returns errors for an invalid spec', () => {
    const result = validateSpec({ title: 'missing required fields' });

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
