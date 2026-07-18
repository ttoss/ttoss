import './studio.css';

import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('FSL Studio: #root element not found');
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
