import * as React from 'react';
import { App } from './App';
import { AuthProvider } from '@ttoss/react-auth';
import { I18nProvider } from '@ttoss/react-i18n';
import { NotificationsProvider } from '@ttoss/react-notifications';
import { RelayEnvironmentProvider } from 'react-relay';
import { ThemeProvider } from '@ttoss/ui';
import { environment } from './RelayEnvironment';
import ReactDOM from 'react-dom/client';

import './amplify';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RelayEnvironmentProvider environment={environment}>
      <ThemeProvider>
        <I18nProvider>
          <NotificationsProvider>
            <AuthProvider>
              <React.Suspense fallback="Loading...">
                <App />
              </React.Suspense>
            </AuthProvider>
          </NotificationsProvider>
        </I18nProvider>
      </ThemeProvider>
    </RelayEnvironmentProvider>
  </React.StrictMode>
);
