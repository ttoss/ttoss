import { ScriptStatus, useScript } from '@ttoss/react-hooks';
import * as React from 'react';

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

/**
 * The libraries that can be loaded from the Google Maps JavaScript API.
 * https://developers.google.com/maps/documentation/javascript/libraries?hl=pt-br#available-libraries
 */
export type Libraries =
  | 'core'
  | 'maps'
  | 'maps3d'
  | 'places'
  | 'geocoding'
  | 'routes'
  | 'marker'
  | 'geometry'
  | 'elevation'
  | 'streetView'
  | 'journeySharing'
  | 'visualization'
  | 'airQuality'
  | 'addressValidation';

type ScriptProps = {
  src: string;
  onReady: () => void;
  onError?: (e: Error) => void;
};

const DefaultScript = ({ src, onReady }: ScriptProps) => {
  const { status } = useScript(src);

  React.useEffect(() => {
    if (status === 'ready') {
      onReady();
    }
  }, [status, onReady]);

  return null;
};

export const GoogleMapsProvider = ({
  children,
  apiKey,
  loading = 'async',
  libraries,
  language,
  Script = DefaultScript,
  onError,
}: {
  children: React.ReactNode;
  apiKey: string;
  libraries?: Libraries[];
  /**
   * https://developers.google.com/maps/faq#languagesupport
   */
  language?: string;
  loading?: 'async' | false;
  Script?: React.ComponentType<ScriptProps>;
  onError?: (e: Error) => void;
}) => {
  const src = (() => {
    let srcTemp = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;

    if (loading) {
      srcTemp = srcTemp + `&loading=${loading}`;
    }

    if (libraries) {
      srcTemp = srcTemp + `&libraries=${libraries.join(',')}`;
    }

    if (language) {
      srcTemp = srcTemp + `&language=${language}`;
    }

    return srcTemp;
  })();

  const [status, setStatus] = React.useState<ScriptStatus>('loading');

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
    <>
      <Script
        src={src}
        onReady={() => {
          return setStatus('ready');
        }}
        onError={onError}
      />
      <GoogleMapsContext.Provider value={value}>
        {children}
      </GoogleMapsContext.Provider>
    </>
  );
};
