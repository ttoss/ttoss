// Public contract smoke tests — verifies the package index exports the expected symbols.
import * as geovis from 'src/index';

test('package exports expected public symbols', () => {
  expect(typeof geovis.GeoVisProvider).toBe('function');
  expect(typeof geovis.GeoVisCanvas).toBe('function');
  expect(typeof geovis.useGeoVis).toBe('function');
  expect(typeof geovis.validateSpec).toBe('function');
  // 5.1: useMapData is part of the public contract
  expect(typeof geovis.useMapData).toBe('function');
});
