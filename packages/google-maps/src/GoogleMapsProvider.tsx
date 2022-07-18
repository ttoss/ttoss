import * as React from 'react';
import { ScriptStatus, useScript } from '@ttoss/hooks';

type Extends<T, U extends T> = U;

export type GoogleMaps = typeof google.maps;

type LoadedMapsStatus = Extends<ScriptStatus, 'ready'>;

type NotLoadedMapStatus = Extends<ScriptStatus, 'idle' | 'error' | 'loading'>;

const GoogleMapsContext = React.createContext<
  | {
      status: LoadedMapsStatus;
      googleMaps: GoogleMaps;
    }
  | {
      status: NotLoadedMapStatus;
      googleMaps: null;
    }
>({
  status: 'idle',
  googleMaps: null,
});

type Libraries = 'places' | 'visualization' | 'drawing' | 'geometry';

export const GoogleMapsProvider = ({
  children,
  apiKey,
  libraries,
  language,
}: {
  children: React.ReactNode;
  apiKey: string;
  libraries?: Libraries[];
  /**
   * https://developers.google.com/maps/faq#languagesupport
   */
  language?: string;
}) => {
  const src = (() => {
    let srcTemp = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;

    if (libraries) {
      srcTemp = srcTemp + `&libraries=${libraries.join(',')}`;
    }

    if (language) {
      srcTemp = srcTemp + `&language=${language}`;
    }

    return srcTemp;
  })();

  const { status } = useScript(src);

  const googleMaps = React.useMemo(() => {
    if (status === 'ready' && window.google.maps) {
      return window.google.maps;
    }

    return null;
  }, [status]);

  const value = React.useMemo(() => {
    if (status === 'ready' && googleMaps) {
      return {
        status,
        googleMaps,
      };
    }

    return {
      status: status as NotLoadedMapStatus,
      googleMaps: null,
    };
  }, [googleMaps, status]);

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

/**
 *
 * @returns param.googleMaps: GoogleMaps - returns the google maps object which
 * provides access to the [Google Maps API](https://developers.google.com/maps/documentation/javascript/overview).
 */
export const useGoogleMaps = () => React.useContext(GoogleMapsContext);
