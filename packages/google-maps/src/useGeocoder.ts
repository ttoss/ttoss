import * as React from 'react';

import { useGoogleMaps } from './useGoogleMaps';

export const useGeocoder = () => {
  const { google } = useGoogleMaps();

  const geocoder = React.useMemo(() => {
    if (google.maps) {
      return new google.maps.Geocoder();
    }

    return null;
  }, [google.maps]);

  /**
   * Derived from `geocoder` instead of kept in state: it is initialized
   * exactly when the Geocoder instance exists.
   */
  const isGeocoderInitialized = geocoder !== null;

  return { geocoder, isGeocoderInitialized };
};
