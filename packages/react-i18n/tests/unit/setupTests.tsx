import { setOptions } from '@ttoss/test-utils/react';
import * as React from 'react';
import { I18nProvider, LoadLocaleData } from 'src/index';

const delay = (ms: number) => {
  return new Promise((resolve) => {
    return setTimeout(resolve, ms);
  });
};

export const loadLocaleData: LoadLocaleData = async (locale) => {
  switch (locale) {
    case 'pt-BR': {
      await delay(1000);
      return (await import('../../i18n/compiled/pt-BR.json')).default;
    }
    default:
      return (await import('../../i18n/compiled/en.json')).default;
  }
};

export const Providers = ({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale?: string;
}) => {
  return (
    <I18nProvider
      locale={locale || window.navigator.language}
      loadLocaleData={loadLocaleData}
    >
      {children}
    </I18nProvider>
  );
};

setOptions({ wrapper: Providers });
