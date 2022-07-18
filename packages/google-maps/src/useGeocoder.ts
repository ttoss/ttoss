import * as React from 'react';

import { useGoogleMaps } from './GoogleMapsProvider';

export const useGeocoder = () => {
  const { googleMaps } = useGoogleMaps();

  const [isGeocoderInitialized, setIsGeocoderInitialized] =
    React.useState(false);

  const geocoder = React.useMemo(() => {
    if (googleMaps) {
      const googleMapsGeocoder = new googleMaps.Geocoder();
      setIsGeocoderInitialized(true);
      return googleMapsGeocoder;
    }

    return null;
  }, [googleMaps]);

  return { geocoder, isGeocoderInitialized };
};
