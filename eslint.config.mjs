import ttossEslintConfig from '@ttoss/eslint-config';

export default [
  ...ttossEslintConfig,
  {
    files: ['**/*.stories.tsx'],
    rules: {
      // TypeScript types replace PropTypes validation in story files
      'react/prop-types': 'off',
    },
  },
];
