import { I18nProvider } from '@ttoss/react-i18n';
import { setOptions } from '@ttoss/test-utils/react';
import { ThemeProvider } from '@ttoss/ui';
import type * as React from 'react';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <I18nProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </I18nProvider>
  );
};

setOptions({ wrapper: Providers });
