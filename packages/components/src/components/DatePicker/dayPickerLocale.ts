import type { Locale } from 'react-day-picker';
import { enUS, es, ptBR } from 'react-day-picker/locale';

const DAY_PICKER_LOCALES: Record<string, Locale> = {
  en: enUS,
  es,
  pt: ptBR,
};

/**
 * The calendar locale (month and weekday names) for an intl locale, matched
 * by language and falling back to English.
 */
export const getDayPickerLocale = (locale: string | undefined): Locale => {
  const language = locale?.split('-')[0].toLowerCase() ?? 'en';
  return DAY_PICKER_LOCALES[language] ?? enUS;
};
