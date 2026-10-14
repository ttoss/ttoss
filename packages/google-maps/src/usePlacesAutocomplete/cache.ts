export type CachedPredictions = Record<
  string,
  { data: google.maps.places.AutocompletePrediction[]; maxAge: number }
>;

/**
 * Reads the predictions cached under `key` in sessionStorage, dropping the
 * expired entries. Returns an empty cache when storage is unavailable or holds
 * malformed data.
 */
export const readCache = (key: string): CachedPredictions => {
  let cachedData: CachedPredictions = {};

  try {
    cachedData = JSON.parse(sessionStorage.getItem(key) || '{}');
  } catch {
    // sessionStorage unavailable or malformed — start empty.
  }

  const now = Date.now();

  return Object.fromEntries(
    Object.entries(cachedData).filter(([, entry]) => {
      return entry.maxAge - now >= 0;
    })
  );
};

/**
 * Persists `cachedData` under `key`. Storage errors (quota, private mode) are
 * ignored: the cache is an optimization, not a requirement.
 */
export const writeCache = ({
  key,
  cachedData,
}: {
  key: string;
  cachedData: CachedPredictions;
}) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(cachedData));
  } catch {
    // Skip exception
  }
};

export const removeCache = (key: string) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Skip exception
  }
};
