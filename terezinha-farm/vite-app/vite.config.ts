// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { babelConfig } from '@ttoss/config';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import react from '@vitejs/plugin-react';
import relay from 'vite-plugin-relay';

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig(async () => {
  return {
    plugins: [
      relay,
      react({
        babel: {
          plugins: babelConfig().plugins,
        },
      }),
      visualizer({
        filename: 'stats/index.html',
      }),
    ],
    resolve: {
      alias: {
        './runtimeConfig': './runtimeConfig.browser',
      },
    },
  };
});
