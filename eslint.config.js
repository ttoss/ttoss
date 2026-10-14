import ttossEslintConfig from '@ttoss/eslint-config';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  ...ttossEslintConfig,
  {
    // The Vite apps are the only places with Fast Refresh (HMR), so the rule
    // that keeps modules refreshable lives here rather than in the shared
    // config, where it reported on library code that never hot-reloads.
    files: [
      'docs/fsl-studio/**/*.{jsx,tsx}',
      'docs/fsl-storybook/**/*.{jsx,tsx}',
    ],
    // Storybook's preview config exports a config object, not components, and
    // Storybook reloads the whole preview when it changes.
    ignores: ['docs/fsl-storybook/.storybook/**'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // Benchmark fixtures are validated by the fsl-bench gauntlet, not by repo
    // lint: their blanket eslint-disable exists precisely to stop autofixes
    // from corrupting the calibration, so it must not be reported as unused
    // even when no scoped rule currently fires in them.
    files: ['packages/fsl-bench/golden/**'],
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  {
    // Playwright drives these scripts, and the callbacks passed to
    // `page.evaluate` run inside the browser, where `document` is defined.
    files: ['docs/fsl-storybook/scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        document: 'readonly',
      },
    },
  },
];
