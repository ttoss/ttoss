import { ThemeProvider } from '@ttoss/ui';
import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { RelayEnvironmentProvider } from 'react-relay';

import { App } from './App.tsx';
import { relayEnvironment } from './relay/environment.ts';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RelayEnvironmentProvider environment={relayEnvironment}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </RelayEnvironmentProvider>
  </React.StrictMode>
);
