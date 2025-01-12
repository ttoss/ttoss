import * as React from 'react';

type Serializer<T> = (object: T | undefined) => string;
type Parser<T> = (val: string) => T | undefined;
type Setter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;

type Options<T> = Partial<{
  serializer: Serializer<T>;
  parser: Parser<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger: (error: any) => void;
  syncData: boolean;
  storage?: Storage;
}>;

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

  const {
    serializer,
    parser,
    logger,
    syncData,
    storage = window.localStorage,
  } = opts;

  const rawValueRef = React.useRef<string | null>(null);

  const [value, setValue] = React.useState(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      rawValueRef.current = storage.getItem(key);
      const res: T = rawValueRef.current
        ? parser(rawValueRef.current)
        : defaultValue;
      return res;
    } catch (e) {
      logger(e);
      return defaultValue;
    }
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateLocalStorage = () => {
      // Browser ONLY dispatch storage events to other tabs, NOT current tab.
      // We need to manually dispatch storage event for current tab
      if (value !== undefined) {
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
      } else {
        storage.removeItem(key);
        window.dispatchEvent(
          new StorageEvent('storage', {
            storageArea: storage,
            url: window.location.href,
            key,
          })
        );
      }
    };

    try {
      updateLocalStorage();
    } catch (e) {
      logger(e);
    }
  }, [key, logger, serializer, storage, value]);

  React.useEffect(() => {
    if (!syncData) {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key || e.storageArea !== storage) {
        return;
      }

      try {
        if (e.newValue !== rawValueRef.current) {
          rawValueRef.current = e.newValue;
          setValue(e.newValue ? parser(e.newValue) : undefined);
        }
      } catch (e) {
        logger(e);
      }
    };

    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('storage', handleStorageChange);
    return () => {
      return window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, logger, parser, storage, syncData]);

  return [value, setValue];
}
