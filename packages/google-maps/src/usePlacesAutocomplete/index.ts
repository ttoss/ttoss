/* eslint-disable react-hooks/exhaustive-deps */
import * as React from 'react';

import { useAutocompleteService } from './useAutocompleteService';
import { type Suggestions, usePredictions } from './usePredictions';

export interface HookArgs {
  requestOptions?: Omit<google.maps.places.AutocompletionRequest, 'input'>;
  debounce?: number;
  cache?: number | false;
  cacheKey?: string;
  callbackName?: string;
  defaultValue?: string;
  initOnMount?: boolean;
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
  const [value, setVal] = React.useState(defaultValue);

  const { ready, serviceRef, init } = useAutocompleteService({
    callbackName,
    initOnMount,
  });

  const { suggestions, clearSuggestions, clearCache, fetchPredictions } =
    usePredictions({
      serviceRef,
      requestOptions,
      cache,
      cacheKey: cacheKey ? `upa-${cacheKey}` : 'upa',
      debounce,
    });

  const setValue: SetValue = React.useCallback(
    (val, shouldFetchData = true) => {
      setVal(val);
      if (serviceRef.current && shouldFetchData) {
        fetchPredictions(val);
      }
    },
    [fetchPredictions]
  );

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
