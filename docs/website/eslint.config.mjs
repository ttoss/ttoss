import ttossEslintConfig from '@ttoss/eslint-config';

export default [
  ...ttossEslintConfig,
  {
    rules: {
      'react/jsx-uses-react': 1,
    },
  },
];
