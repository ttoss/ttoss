import ttossEslintConfig from '@ttoss/eslint-config';

export default [
  ...ttossEslintConfig,
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
