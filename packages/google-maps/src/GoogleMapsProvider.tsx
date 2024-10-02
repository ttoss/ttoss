import * as React from 'react';
import { ScriptStatus, useScript } from '@ttoss/react-hooks';

type Extends<T, U extends T> = U;

export type GoogleMaps = typeof google.maps;

type LoadedMapsStatus = Extends<ScriptStatus, 'ready'>;

type NotLoadedMapStatus = Extends<ScriptStatus, 'idle' | 'error' | 'loading'>;

export const GoogleMapsContext = React.createContext<
  | {
      status: LoadedMapsStatus;
      google: {
        maps: GoogleMaps;
      };
    }
  | {
      status: NotLoadedMapStatus;
      google: {
        maps: null;
      };
    }
>({
  status: 'idle',
  google: {
    maps: null,
  },
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

  const google = React.useMemo(() => {
    if (status === 'ready' && window.google) {
      return window.google;
    }

    return null;
  }, [status]);

  const value = React.useMemo(() => {
    if (status === 'ready' && google?.maps) {
      return {
        status,
        google: {
          maps: google.maps,
        },
      };
    }

    return {
      status: status as NotLoadedMapStatus,
      google: {
        maps: null,
      },
    };
  }, [google, status]);

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
