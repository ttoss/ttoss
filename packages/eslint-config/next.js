require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  extends: ['next/core-web-vitals', './config.js'],
  overrides: [
    {
      files: ['**/*.tsx'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
};
