/* eslint-disable react-hooks/exhaustive-deps */
import * as React from 'react';

import { useGoogleMaps } from './../useGoogleMaps';
import { useLatest } from './useLatest';

/**
 * Creates the Places `AutocompleteService` once the Maps API is available,
 * either on mount or, when the script is still loading, from the global
 * `callbackName` the script calls when ready.
 */
export const useAutocompleteService = ({
  callbackName,
  initOnMount,
}: {
  callbackName?: string;
  initOnMount: boolean;
}) => {
  const [ready, setReady] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serviceRef = React.useRef<any>(null);
  const { google } = useGoogleMaps();
  const googleMapsRef = useLatest(google.maps);

  const init = React.useCallback(() => {
    if (serviceRef.current) {
      return;
    }

    if (!google.maps) {
      return;
    }

    const { current: gMaps } = googleMapsRef;
    const placesLib = gMaps?.places || google.maps.places;

    if (!placesLib) {
      return;
    }

    serviceRef.current = new placesLib.AutocompleteService();
    setReady(true);
  }, [google.maps]);

  React.useEffect(() => {
    if (!initOnMount) {
      return () => {
        return null;
      };
    }

    if (!googleMapsRef.current && !google.maps && callbackName) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)[callbackName] = init;
    } else {
      init();
    }

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any)[callbackName as string]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any)[callbackName as string];
      }
    };
  }, [callbackName, init]);

  return { ready, serviceRef, init };
};
