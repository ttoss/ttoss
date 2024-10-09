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
  Script?: React.ComponentType<ScriptProps>;
  onError?: (e: Error) => void;
}) => {
  const src = (() => {
    let srcTemp = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;

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
