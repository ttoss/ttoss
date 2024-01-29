import * as React from 'react';
import { App } from './App.tsx';
import { AuthProvider } from '@ttoss/react-auth';
import { FeatureFlagsProvider } from '@ttoss/react-feature-flags';
import { I18nProvider, LoadLocaleData } from '@ttoss/react-i18n';
import { NotificationsProvider } from '@ttoss/react-notifications';
import { RelayEnvironmentProvider } from 'react-relay';
import { ThemeProvider } from '@ttoss/ui';
import { environment } from './RelayEnvironment.ts';
import ReactDOM from 'react-dom/client';
import './amplify.ts';

const loadLocaleData: LoadLocaleData = async (locale) => {
  switch (locale) {
    case 'pt-BR': {
      return (await import('../i18n/compiled/pt-BR.json')).default;
    }
    default:
      return (await import('../i18n/compiled/en.json')).default;
  }
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <FeatureFlagsProvider>
      <RelayEnvironmentProvider environment={environment}>
        <ThemeProvider>
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
