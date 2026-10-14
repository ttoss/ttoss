/* eslint-disable react-hooks/exhaustive-deps */
import * as React from 'react';

import { readCache, removeCache, writeCache } from './cache';
import { useLatest } from './useLatest';

type Suggestion = google.maps.places.AutocompletePrediction;

type Status = `${google.maps.places.PlacesServiceStatus}` | '';

export interface Suggestions {
  readonly loading: boolean;
  readonly status: Status;
  data: Suggestion[];
}

/**
 * Debounced Places predictions for an input value, served from the
 * sessionStorage cache under `cacheKey` while `cache` (seconds) is set.
 */
export const usePredictions = ({
  serviceRef,
  requestOptions,
  cache,
  cacheKey,
  debounce,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceRef: React.RefObject<any>;
  requestOptions?: Omit<google.maps.places.AutocompletionRequest, 'input'>;
  cache: number | false;
  cacheKey: string;
  debounce: number;
}) => {
  const [suggestions, setSuggestions] = React.useState<Suggestions>({
    loading: false,
    status: '',
    data: [],
  });
  const requestOptionsRef = useLatest(requestOptions);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const clearSuggestions = React.useCallback(() => {
    setSuggestions({ loading: false, status: '', data: [] });
  }, []);

  const clearCache = React.useCallback(() => {
    removeCache(cacheKey);
  }, []);

  const predict = React.useCallback(
    (val: string) => {
      if (!val) {
        clearSuggestions();
        return;
      }

      setSuggestions((prevState) => {
        return { ...prevState, loading: true };
      });

      const cachedData = readCache(cacheKey);

      if (cache && cachedData[val]) {
        setSuggestions({
          loading: false,
          status: 'OK',
          data: cachedData[val].data,
        });
        return;
      }

      serviceRef.current?.getPlacePredictions(
        { ...requestOptionsRef.current, input: val },
        (data: Suggestion[] | null, status: Status) => {
          setSuggestions({ loading: false, status, data: data || [] });

          if (cache && status === 'OK') {
            cachedData[val] = {
              data: data as Suggestion[],
              maxAge: Date.now() + cache * 1000,
            };
            writeCache({ key: cacheKey, cachedData });
          }
        }
      );
    },
    [clearSuggestions]
  );

  const fetchPredictions = React.useCallback(
    (val: string) => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        predict(val);
      }, debounce);
    },
    [debounce, predict]
  );

  return { suggestions, clearSuggestions, clearCache, fetchPredictions };
};
