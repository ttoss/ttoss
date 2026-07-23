// Inter Variable — the base theme's first-choice family; self-hosted via
// Fontsource (no external font CDN).
import '@fontsource-variable/inter';

import { createRoot } from 'react-dom/client';

import { App } from './App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container "#root" not found');
}

createRoot(container).render(<App />);
