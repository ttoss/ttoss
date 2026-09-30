const canonicalize = (locale: string) => {
  try {
    return Intl.getCanonicalLocales(locale)[0];
  } catch {
    return undefined;
  }
};

const language = (locale: string) => {
  return locale.split('-')[0].toLowerCase();
};

/**
 * Parse an `Accept-Language` header, a single locale, or a list of them into
 * canonical locales in preference order. Invalid entries and `*` are dropped.
 */
const parseRequested = (requested: string | string[]) => {
  const entries = (Array.isArray(requested) ? requested : [requested])
    .flatMap((entry) => {
      return entry.split(',');
    })
    .map((entry, index) => {
      const [tag, ...params] = entry.trim().split(';');
      const qParam = params.find((param) => {
        return param.trim().startsWith('q=');
      });
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim(), q: Number.isNaN(q) ? 0 : q, index };
    })
    .filter(({ tag, q }) => {
      return tag !== '' && tag !== '*' && q > 0;
    })
    .sort((a, b) => {
      return b.q - a.q || a.index - b.index;
    });

  return entries
    .map(({ tag }) => {
      return canonicalize(tag);
    })
    .filter((tag): tag is string => {
      return tag !== undefined;
    });
};

/**
 * Pick the supported locale that best serves what was requested — a user
 * preference, an `Accept-Language` header, or both in priority order.
 *
 * For each requested locale, in order: an exact match, then the locale with
 * its subtags dropped one at a time (`pt-BR` → `pt`), then any supported
 * locale of the same language (`pt-PT` → `pt-BR`). Only when no requested
 * locale matches at all does `fallback` apply; without one, the result is
 * `undefined`, so a caller can tell "nothing matched" from a real match.
 */
export function negotiateLocale(args: {
  requested?: string | string[] | null;
  supported: string[];
  fallback: string;
}): string;
export function negotiateLocale(args: {
  requested?: string | string[] | null;
  supported: string[];
  fallback?: undefined;
}): string | undefined;
export function negotiateLocale(args: {
  requested?: string | string[] | null;
  supported: string[];
  fallback?: string;
}): string | undefined {
  const { requested, supported, fallback } = args;

  if (!requested) {
    return fallback;
  }

  const supportedByKey = new Map(
    supported.map((locale) => {
      return [(canonicalize(locale) ?? locale).toLowerCase(), locale];
    })
  );

  for (const locale of parseRequested(requested)) {
    const subtags = locale.split('-');

    for (let length = subtags.length; length > 0; length -= 1) {
      const match = supportedByKey.get(
        subtags.slice(0, length).join('-').toLowerCase()
      );
      if (match) {
        return match;
      }
    }

    const sameLanguage = supported.find((candidate) => {
      return language(candidate) === language(locale);
    });

    if (sameLanguage) {
      return sameLanguage;
    }
  }

  return fallback;
}
