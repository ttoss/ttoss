require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  extends: ['./config.js', 'next/core-web-vitals'],
  overrides: [
    {
      files: ['**/*.tsx'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
};
