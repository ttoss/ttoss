import { act, renderHook } from '@ttoss/test-utils/react';
import { usePlacesAutocomplete } from 'src/usePlacesAutocomplete';
import {
  readCache,
  removeCache,
  writeCache,
} from 'src/usePlacesAutocomplete/cache';

const prediction = {
  description: 'Rua Augusta, São Paulo',
} as google.maps.places.AutocompletePrediction;

const mockGetPlacePredictions = jest.fn();

jest.mock('src/useGoogleMaps', () => {
  const google = {
    maps: {
      places: {
        AutocompleteService: jest.fn().mockImplementation(() => {
          return { getPlacePredictions: mockGetPlacePredictions };
        }),
      },
    },
  };
  return {
    useGoogleMaps: () => {
      return { google };
    },
  };
});

beforeEach(() => {
  jest.useFakeTimers();
  sessionStorage.clear();
  mockGetPlacePredictions.mockReset();
  mockGetPlacePredictions.mockImplementation((_request, callback) => {
    callback([prediction], 'OK');
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('cache', () => {
  test('drops expired entries', () => {
    writeCache({
      key: 'upa',
      cachedData: {
        fresh: { data: [prediction], maxAge: Date.now() + 1000 },
        stale: { data: [prediction], maxAge: Date.now() - 1000 },
      },
    });

    expect(Object.keys(readCache('upa'))).toEqual(['fresh']);
  });

  test('returns an empty cache when the stored value is malformed', () => {
    sessionStorage.setItem('upa', '{not json');

    expect(readCache('upa')).toEqual({});
  });

  test('removeCache deletes the stored predictions', () => {
    writeCache({
      key: 'upa',
      cachedData: { a: { data: [], maxAge: Date.now() + 1000 } },
    });
    removeCache('upa');

    expect(sessionStorage.getItem('upa')).toBeNull();
  });
});

describe('usePlacesAutocomplete', () => {
  test('initializes the AutocompleteService on mount', () => {
    const { result } = renderHook(() => {
      return usePlacesAutocomplete();
    });

    expect(result.current.ready).toBe(true);
  });

  test('fetches predictions after the debounce delay', () => {
    const { result } = renderHook(() => {
      return usePlacesAutocomplete({ debounce: 300 });
    });

    act(() => {
      result.current.setValue('Rua');
      result.current.setValue('Rua A');
    });

    expect(result.current.value).toBe('Rua A');
    expect(mockGetPlacePredictions).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockGetPlacePredictions).toHaveBeenCalledTimes(1);
    expect(mockGetPlacePredictions.mock.calls[0][0]).toEqual({
      input: 'Rua A',
    });
    expect(result.current.suggestions).toEqual({
      loading: false,
      status: 'OK',
      data: [prediction],
    });
  });

  test('serves repeated values from the cache', () => {
    const { result } = renderHook(() => {
      return usePlacesAutocomplete({ cacheKey: 'test' });
    });

    for (let i = 0; i < 2; i += 1) {
      act(() => {
        result.current.setValue('Rua');
        jest.runAllTimers();
      });
    }

    expect(mockGetPlacePredictions).toHaveBeenCalledTimes(1);
    expect(readCache('upa-test').Rua.data).toEqual([prediction]);
    expect(result.current.suggestions.data).toEqual([prediction]);
  });

  test('clears suggestions for an empty value', () => {
    const { result } = renderHook(() => {
      return usePlacesAutocomplete();
    });

    act(() => {
      result.current.setValue('Rua');
      jest.runAllTimers();
    });
    act(() => {
      result.current.setValue('');
      jest.runAllTimers();
    });

    expect(result.current.suggestions).toEqual({
      loading: false,
      status: '',
      data: [],
    });
  });

  test('does not fetch when shouldFetchData is false', () => {
    const { result } = renderHook(() => {
      return usePlacesAutocomplete();
    });

    act(() => {
      result.current.setValue('Rua', false);
      jest.runAllTimers();
    });

    expect(mockGetPlacePredictions).not.toHaveBeenCalled();
  });
});
