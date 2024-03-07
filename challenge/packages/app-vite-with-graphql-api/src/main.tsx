import * as React from 'react';
import { App } from './App.tsx';
import { RelayEnvironmentProvider } from 'react-relay';
import { ThemeProvider } from '@ttoss/ui';
import { relayEnvironment } from './relay/environment.ts';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RelayEnvironmentProvider environment={relayEnvironment}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </RelayEnvironmentProvider>
  </React.StrictMode>
);
