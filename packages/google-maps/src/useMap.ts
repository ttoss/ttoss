import * as React from 'react';
import { useCallbackRef } from 'use-callback-ref';
import { useGoogleMaps } from './GoogleMapsProvider';

export const useMap = (options: google.maps.MapOptions = {}) => {
  /**
   * Read here for more details about the useCallbackRef hook:
   * https://github.com/theKashey/use-callback-ref#usecallbackref---to-replace-reactuseref
   */
  const [, forceUpdate] = React.useState(0);

  const ref = useCallbackRef<HTMLDivElement>(null, () =>
    forceUpdate((n) => n + 1)
  );

  const { googleMaps } = useGoogleMaps();

  const map = React.useMemo(() => {
    if (googleMaps && ref.current) {
      return new googleMaps.Map(ref.current, options);
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMaps, ref.current]);

  /**
   * To avoid re-initializing the map because shallow object comparison.
   * https://stackoverflow.com/a/62409962/8786986
   */
  const optionsStringify = JSON.stringify(options);

  /**
   * Update options but not reinitialize the map.
   */
  React.useEffect(() => {
    if (map) {
      const parsedOptions = JSON.parse(optionsStringify);
      map.setOptions(parsedOptions);
    }
  }, [optionsStringify, map]);

  return {
    /**
     * asss
     */
    map,
    /**
     * hhhh
     */
    ref,
  };
};
