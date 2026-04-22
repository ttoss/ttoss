import ttossEslintConfig from '@ttoss/eslint-config';
import storybook from 'eslint-plugin-storybook';

export default [
  ...ttossEslintConfig,
  ...storybook.configs['flat/recommended'],
  {
    files: ['**/*.stories.tsx'],
    rules: {
      // TypeScript types replace PropTypes validation in story files
      'react/prop-types': 'off',
    },
  },
];
