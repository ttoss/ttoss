import type { OnErrorFn } from '@formatjs/intl';

import { createI18n, type I18n, type Messages } from './createI18n';
import { negotiateLocale } from './negotiateLocale';

export type Catalog = {
  /**
   * The `I18n` for the best supported match of `requested` — a locale, a list,
   * or an `Accept-Language` header — or for `fallback` when nothing matches.
   * Each locale's messages are loaded once and reused.
   */
  getI18n: (requested?: string | string[] | null) => Promise<I18n>;
  negotiate: (requested?: string | string[] | null) => string;
  supported: string[];
  fallback: string;
};

/**
 * Load catalogs lazily, once per process or Lambda container, and memoize one
 * `I18n` per locale.
 */
export const createCatalog = ({
  supported,
  fallback,
  load,
  defaultLocale,
  onError,
}: {
  supported: string[];
  fallback: string;
  load: (locale: string) => Messages | Promise<Messages>;
  defaultLocale?: string;
  onError?: OnErrorFn;
}): Catalog => {
  const cache = new Map<string, Promise<I18n>>();

  const negotiate = (requested?: string | string[] | null) => {
    return negotiateLocale({ requested, supported, fallback });
  };

  const getI18n = (requested?: string | string[] | null) => {
    const locale = negotiate(requested);

    const cached = cache.get(locale);
    if (cached) {
      return cached;
    }

    const pending = Promise.resolve()
      .then(() => {
        return load(locale);
      })
      .then((messages) => {
        return createI18n({ locale, messages, defaultLocale, onError });
      });

    // A failed load is not memoized, so the next request retries it.
    pending.catch(() => {
      cache.delete(locale);
    });

    cache.set(locale, pending);

    return pending;
  };

  return { getI18n, negotiate, supported, fallback };
};
