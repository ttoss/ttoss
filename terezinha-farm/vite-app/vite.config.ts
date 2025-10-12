import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(async () => {
  return {
    plugins: [
      react({
        tsDecorators: true,
        plugins: [
          [
            '@swc/plugin-relay',
            {
              rootDir: __dirname,
              language: 'typescript',
              eagerEsModules: true,
            },
          ],
          [
            '@swc/plugin-formatjs',
            {
              idInterpolationPattern: '[sha512:contenthash:base64:6]',
              ast: true,
            },
          ],
        ],
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
