import * as googleMaps from 'src/index';

test('should export all methods', () => {
  expect(googleMaps.GoogleMapsProvider).toBeDefined();
  expect(googleMaps.useGeocoder).toBeDefined();
  expect(googleMaps.useGoogleMaps).toBeDefined();
  expect(googleMaps.useMap).toBeDefined();
  expect(googleMaps.usePlacesAutocomplete).toBeDefined();
});
