import * as React from 'react';
import { MapContext } from './MapProvider';
import { useCallbackRef } from 'use-callback-ref';
import { useGoogleMaps } from './useGoogleMaps';

export const useMap = (options: google.maps.MapOptions = {}) => {
  /**
   * Read here for more details about the useCallbackRef hook:
   * https://github.com/theKashey/use-callback-ref#usecallbackref---to-replace-reactuseref
   */
  const [, forceUpdate] = React.useState(0);

  const ref = useCallbackRef<HTMLDivElement>(null, () => {
    return forceUpdate((n) => {
      return n + 1;
    });
  });

  const { google, isReady } = useGoogleMaps();

  const mapContext = React.useContext(MapContext);

  const [map, setMap] = React.useState<google.maps.Map | null>(mapContext.map);

  React.useEffect(() => {
    if (map) {
      return;
    }

    if (!ref.current) {
      return;
    }

    if (!isReady) {
      return;
    }

    if (!google.maps?.Map) {
      return;
    }

    setMap(new google.maps.Map(ref.current, options));
  }, [map, isReady, ref, google.maps, options]);

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
     * Returns the map object which provides access to the [Google Maps API](https://developers.google.com/maps/documentation/javascript/overview).
     */
    map,
    /**
     * Returns the ref object which provides access to the HTMLDivElement element
     * that the map is rendered in.
     */
    ref,
  };
};
