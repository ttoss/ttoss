import ttossEslintConfig from '@ttoss/eslint-config';

export default [
  ...ttossEslintConfig,
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
