import * as React from 'react';
import { I18nProvider } from '@ttoss/react-i18n';
import { NotificationsProvider } from '@ttoss/react-notifications';
import { ThemeProvider } from '@ttoss/ui';
import { setOptions } from '@ttoss/test-utils';

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
