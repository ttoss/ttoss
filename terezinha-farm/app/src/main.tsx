import * as React from 'react';
import { App } from './App';
import { AuthProvider } from '@ttoss/react-auth';
import { I18nProvider, LoadLocaleData } from '@ttoss/react-i18n';
import { NotificationsProvider } from '@ttoss/react-notifications';
import { ThemeProvider } from '@ttoss/ui';
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
    <ThemeProvider>
      <I18nProvider locale="pt-BR" loadLocaleData={loadLocaleData}>
        <NotificationsProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </NotificationsProvider>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>
);
