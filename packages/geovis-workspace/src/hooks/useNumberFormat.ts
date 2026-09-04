import { useI18n } from '@ttoss/react-i18n';
import * as React from 'react';

/**
 * Formats a number for the locale the application declared.
 *
 * Not `intl.formatNumber`, which would be the obvious call: `I18nProvider` only
 * hands the locale to its `IntlProvider` once a `loadLocaleData` has resolved
 * messages for it — deliberately, since a locale with no messages makes
 * react-intl report every string as a missing translation. An app that declares
 * `locale="pt-BR"` to have its numbers grouped, without shipping a message
 * bundle, therefore still formats them as `en`.
 *
 * The declared locale is not lost, though: it reaches the config context
 * untouched, which is what this reads. So `1234567` renders as `1.234.567`
 * under `pt-BR` and `1,234,567` under the default locale.
 *
 * It is passed to `Intl` as it comes: `I18nProvider` is a peer dependency and
 * always seeds a locale, so guarding for its absence here would only add a
 * branch no consumer can reach.
 *
 * @returns The `format` function of an `Intl.NumberFormat` for that locale.
 *
 * @example
 * const format = useNumberFormat();
 * format(13453245); // '13.453.245' under pt-BR
 */
export const useNumberFormat = () => {
  const { locale } = useI18n();

  return React.useMemo(() => {
    return new Intl.NumberFormat(locale).format;
  }, [locale]);
};
