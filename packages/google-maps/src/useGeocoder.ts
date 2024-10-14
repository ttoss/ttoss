import * as React from 'react';
import { useGoogleMaps } from './useGoogleMaps';

export const useGeocoder = () => {
  const { google } = useGoogleMaps();

  const [isGeocoderInitialized, setIsGeocoderInitialized] =
    React.useState(false);

  const geocoder = React.useMemo(() => {
    if (google.maps) {
      const googleMapsGeocoder = new google.maps.Geocoder();
      setIsGeocoderInitialized(true);
      return googleMapsGeocoder;
    }

    return null;
  }, [google.maps]);

  return { geocoder, isGeocoderInitialized };
};
