require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  extends: ['./config.js', 'next/core-web-vitals'],
  rules: {
    'import/no-default-export': 'off',
  },
};
