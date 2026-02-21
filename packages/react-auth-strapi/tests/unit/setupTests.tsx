import { I18nProvider } from '@ttoss/react-i18n';
import { NotificationsProvider } from '@ttoss/react-notifications';
import { setOptions } from '@ttoss/test-utils/react';
import { ThemeProvider } from '@ttoss/ui';
import type * as React from 'react';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <I18nProvider locale="en">
      <ThemeProvider
        theme={{
          colors: {
            primary: '#000',
            secondary: '#fff',
          },
        }}
      >
        <NotificationsProvider>{children}</NotificationsProvider>
      </ThemeProvider>
    </I18nProvider>
  );
};

setOptions({ wrapper: Providers });
