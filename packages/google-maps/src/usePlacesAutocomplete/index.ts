/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from './../GoogleMapsProvider';
import _debounce from './debounce';
import useLatest from './useLatest';

export interface HookArgs {
  requestOptions?: Omit<google.maps.places.AutocompletionRequest, 'input'>;
  debounce?: number;
  cache?: number | false;
  cacheKey?: string;
  callbackName?: string;
  defaultValue?: string;
  initOnMount?: boolean;
}

type Suggestion = google.maps.places.AutocompletePrediction;

type Status = `${google.maps.places.PlacesServiceStatus}` | '';

interface Suggestions {
  readonly loading: boolean;
  readonly status: Status;
  data: Suggestion[];
}

interface SetValue {
  (val: string, shouldFetchData?: boolean): void;
}

interface HookReturn {
  ready: boolean;
  value: string;
  suggestions: Suggestions;
  setValue: SetValue;
  clearSuggestions: () => void;
  clearCache: () => void;
  init: () => void;
}

export const loadApiErr = '💡 Google Maps Places API library must be loaded.';

export const usePlacesAutocomplete = ({
  requestOptions,
  debounce = 200,
  cache = 24 * 60 * 60,
  cacheKey,
  callbackName,
  defaultValue = '',
  initOnMount = true,
}: HookArgs = {}): HookReturn => {
  const [ready, setReady] = useState(false);
  const [value, setVal] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestions>({
    loading: false,
    status: '',
    data: [],
  });
  const asRef = useRef<any>(null);
  const requestOptionsRef = useLatest(requestOptions);
  const { googleMaps } = useGoogleMaps();

  const googleMapsRef = useLatest(googleMaps);

  const upaCacheKey = cacheKey ? `upa-${cacheKey}` : 'upa';

  const init = useCallback(() => {
    if (asRef.current) return;

    if (!googleMaps) {
      return;
    }

    const { current: gMaps } = googleMapsRef;
    const placesLib = gMaps?.places || googleMaps.places;

    if (!placesLib) {
      return;
    }

    asRef.current = new placesLib.AutocompleteService();
    setReady(true);
  }, [googleMaps]);

  const clearSuggestions = useCallback(() => {
    setSuggestions({ loading: false, status: '', data: [] });
  }, []);

  const clearCache = useCallback(() => {
    try {
      sessionStorage.removeItem(upaCacheKey);
    } catch (error) {
      // Skip exception
    }
  }, []);

  const fetchPredictions = useCallback(
    _debounce((val: string) => {
      if (!val) {
        clearSuggestions();
        return;
      }

      setSuggestions((prevState) => ({ ...prevState, loading: true }));

      let cachedData: Record<string, { data: Suggestion[]; maxAge: number }> =
        {};

      try {
        cachedData = JSON.parse(sessionStorage.getItem(upaCacheKey) || '{}');
      } catch (error) {
        // Skip exception
      }

      if (cache) {
        cachedData = Object.keys(cachedData).reduce(
          (acc: typeof cachedData, key) => {
            if (cachedData[key].maxAge - Date.now() >= 0)
              acc[key] = cachedData[key];
            return acc;
          },
          {}
        );

        if (cachedData[val]) {
          setSuggestions({
            loading: false,
            status: 'OK',
            data: cachedData[val].data,
          });
          return;
        }
      }

      asRef?.current?.getPlacePredictions(
        { ...requestOptionsRef.current, input: val },
        (data: Suggestion[] | null, status: Status) => {
          setSuggestions({ loading: false, status, data: data || [] });

          if (cache && status === 'OK') {
            cachedData[val] = {
              data: data as Suggestion[],
              maxAge: Date.now() + cache * 1000,
            };

            try {
              sessionStorage.setItem(upaCacheKey, JSON.stringify(cachedData));
            } catch (error) {
              // Skip exception
            }
          }
        }
      );
    }, debounce),
    [debounce, clearSuggestions]
  );

  const setValue: SetValue = useCallback(
    (val, shouldFetchData = true) => {
      setVal(val);
      if (asRef.current && shouldFetchData) fetchPredictions(val);
    },
    [fetchPredictions]
  );

  useEffect(() => {
    if (!initOnMount) {
      // eslint-disable-next-line react/display-name
      return () => null;
    }

    if (!googleMapsRef.current && !googleMaps && callbackName) {
      (window as any)[callbackName] = init;
    } else {
      init();
    }

    return () => {
      if ((window as any)[callbackName as string])
        delete (window as any)[callbackName as string];
    };
  }, [callbackName, init]);

  return {
    ready,
    value,
    suggestions,
    setValue,
    clearSuggestions,
    clearCache,
    init,
  };
};
