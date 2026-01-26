import './amplify.ts';

import { configureLogger } from '@ttoss/logger';
import { AuthProvider } from '@ttoss/react-auth-cognito';
import { FeatureFlagsProvider } from '@ttoss/react-feature-flags';
import type { LoadLocaleData } from '@ttoss/react-i18n';
import { I18nProvider } from '@ttoss/react-i18n';
import { NotificationsProvider } from '@ttoss/react-notifications';
import { OcaTheme } from '@ttoss/theme/Oca';
import { ThemeProvider } from '@ttoss/ui';
import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { RelayEnvironmentProvider } from 'react-relay';

import { App } from './App.tsx';
import { environment } from './RelayEnvironment.ts';

const loadLocaleData: LoadLocaleData = async (locale) => {
  switch (locale) {
    case 'pt-BR': {
      return (await import('../i18n/lang/pt-BR.json')).default;
    }
    default:
      return (await import('../i18n/lang/en.json')).default;
  }
};

configureLogger({
  project: 'terezinha-farm',
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <FeatureFlagsProvider>
      <RelayEnvironmentProvider environment={environment}>
        <ThemeProvider theme={OcaTheme}>
          <I18nProvider locale="pt-BR" loadLocaleData={loadLocaleData}>
            <NotificationsProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </NotificationsProvider>
          </I18nProvider>
        </ThemeProvider>
      </RelayEnvironmentProvider>
    </FeatureFlagsProvider>
  </React.StrictMode>
);
