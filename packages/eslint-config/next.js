require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  extends: './config.js',
  overrides: [
    {
      files: ['**/*.tsx'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
};
