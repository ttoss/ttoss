import * as React from 'react';
import { I18nProvider } from '@ttoss/react-i18n';
import { ThemeProvider } from '@ttoss/ui';
import { setOptions } from '@ttoss/test-utils';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <I18nProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </I18nProvider>
  );
};

setOptions({ wrapper: Providers });
