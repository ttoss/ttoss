import * as React from 'react';
import { I18nProvider, LoadLocaleData } from '../src';
import { setOptions } from '@ttoss/test-utils';

const loadLocaleData: LoadLocaleData = (locale) => {
  switch (locale) {
    case 'pt-BR':
      return import('../i18n/compiled-lang/pt-BR.json');
    default:
      return import('../i18n/compiled-lang/en.json');
  }
};

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <I18nProvider
      locale={window.navigator.language}
      loadLocaleData={loadLocaleData}
    >
      {children}
    </I18nProvider>
  );
};

setOptions({ wrapper: Providers });
