import * as React from 'react';
import { GoogleMapsContext } from './GoogleMapsProvider';

/**
 * Returns the status of the Google Maps API and the google object which
 * provides access to the [Google Maps API](https://developers.google.com/maps/documentation/javascript/overview).
 *
 * @returns An object containing the API status and the google object.
 */
export const useGoogleMaps = () => {
  const { status, google } = React.useContext(GoogleMapsContext);
  return {
    status,
    google,
    /**
     * @deprecated Use google.maps instead.
     */
    googleMaps: google.maps,
  };
};
