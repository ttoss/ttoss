import { renderHook } from '@ttoss/test-utils/react';
import { useGeocoder } from 'src/useGeocoder';
import { useGoogleMaps } from 'src/useGoogleMaps';

jest.mock('src/useGoogleMaps', () => {
  return {
    useGoogleMaps: jest.fn(),
  };
});

const Geocoder = jest.fn();

test('returns no geocoder while Google Maps is not loaded', () => {
  jest.mocked(useGoogleMaps).mockReturnValue({
    isReady: false,
    status: 'loading',
    google: { maps: null },
  });

  const { result } = renderHook(() => {
    return useGeocoder();
  });

  expect(result.current.geocoder).toBeNull();
  expect(result.current.isGeocoderInitialized).toBe(false);
});

test('creates the geocoder once Google Maps is loaded', () => {
  jest.mocked(useGoogleMaps).mockReturnValue({
    isReady: true,
    status: 'ready',
    google: { maps: { Geocoder } as unknown as typeof google.maps },
  });

  const { result, rerender } = renderHook(() => {
    return useGeocoder();
  });

  expect(result.current.geocoder).toBeInstanceOf(Geocoder);
  expect(result.current.isGeocoderInitialized).toBe(true);

  const { geocoder } = result.current;
  rerender();
  expect(result.current.geocoder).toBe(geocoder);
  expect(Geocoder).toHaveBeenCalledTimes(1);
});
