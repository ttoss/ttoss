import * as React from 'react';

type Serializer<T> = (object: T | undefined) => string;
type Parser<T> = (val: string) => T | undefined;
type Setter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Logger = (error: any) => void;

type Options<T> = Partial<{
  serializer: Serializer<T>;
  parser: Parser<T>;
  logger: Logger;
  syncData: boolean;
  storage?: Storage;
}>;

/**
 * Read and parse the stored value once, on mount. `rawValue` is what was read
 * (kept even when parsing fails) so later writes and storage events can be
 * compared against it.
 */
const readStoredValue = <T>({
  storage,
  key,
  defaultValue,
  parser,
  logger,
}: {
  storage: Storage | undefined;
  key: string;
  defaultValue: T | undefined;
  parser: Parser<T>;
  logger: Logger;
}): { rawValue: string | null; value: T | undefined } => {
  if (typeof window === 'undefined' || !storage) {
    return { rawValue: null, value: defaultValue };
  }

  let rawValue: string | null = null;

  try {
    rawValue = storage.getItem(key);
    const value: T | undefined = rawValue ? parser(rawValue) : defaultValue;
    return { rawValue, value };
  } catch (error) {
    logger(error);
    return { rawValue, value: defaultValue };
  }
};

/**
 * Persist `value` (or remove the key when it is `undefined`). Browsers only
 * dispatch storage events to other tabs, NOT the current one, so the event is
 * dispatched manually for the current tab.
 */
const writeStoredValue = <T>({
  storage,
  key,
  value,
  serializer,
  rawValueRef,
}: {
  storage: Storage;
  key: string;
  value: T | undefined;
  serializer: Serializer<T>;
  rawValueRef: React.RefObject<string | null>;
}) => {
  if (value === undefined) {
    storage.removeItem(key);
    window.dispatchEvent(
      new StorageEvent('storage', {
        storageArea: storage,
        url: window.location.href,
        key,
      })
    );
    return;
  }

  const newValue = serializer(value);
  const oldValue = rawValueRef.current;
  rawValueRef.current = newValue;
  storage.setItem(key, newValue);
  window.dispatchEvent(
    new StorageEvent('storage', {
      storageArea: storage,
      url: window.location.href,
      key,
      newValue,
      oldValue,
    })
  );
};

export function useStorage<T>(
  key: string,
  defaultValue: T,
  options?: Options<T>
): [T, Setter<T>];

export function useStorage<T>(
  key: string,
  defaultValue?: undefined,
  options?: Options<T>
): [T | undefined, Setter<T>];

export function useStorage<T>(
  key: string,
  defaultValue?: T,
  options?: Options<T>
) {
  const opts = React.useMemo(() => {
    return {
      serializer: JSON.stringify,
      parser: JSON.parse,
      // eslint-disable-next-line no-console
      logger: console.log,
      syncData: true,
      ...options,
    };
  }, [options]);

  const { serializer, parser, logger, syncData, storage } = opts;

  const effectiveStorage =
    storage ??
    (typeof window !== 'undefined' ? window.localStorage : undefined);

  const [initialStoredValue] = React.useState(() => {
    return readStoredValue({
      storage: effectiveStorage,
      key,
      defaultValue,
      parser,
      logger,
    });
  });

  const rawValueRef = React.useRef<string | null>(initialStoredValue.rawValue);

  const [value, setValue] = React.useState(initialStoredValue.value);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !effectiveStorage) {
      return;
    }

    try {
      writeStoredValue({
        storage: effectiveStorage,
        key,
        value,
        serializer,
        rawValueRef,
      });
    } catch (error) {
      logger(error);
    }
  }, [key, logger, serializer, effectiveStorage, value]);

  React.useEffect(() => {
    if (!syncData) {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key || e.storageArea !== effectiveStorage) {
        return;
      }

      try {
        if (e.newValue !== rawValueRef.current) {
          rawValueRef.current = e.newValue;
          setValue(e.newValue ? parser(e.newValue) : undefined);
        }
      } catch (error) {
        logger(error);
      }
    };

    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('storage', handleStorageChange);
    return () => {
      return window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, logger, parser, effectiveStorage, syncData]);

  return [value, setValue];
}
