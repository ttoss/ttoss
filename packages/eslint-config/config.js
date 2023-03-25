/**
 * See https://modules.ttoss.dev/docs/core/config/default-configs#eslint
 * for more details about plugins and extensions.
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    browser: true,
    node: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: [
    '@typescript-eslint',
    'formatjs',
    'react',
    'react-hooks',
    'relay',
    'jsx-a11y',
    'sort-imports-es6-autofix',
    'prefer-arrow-functions',
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'turbo',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:relay/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'error',
    /**
     * https://formatjs.io/docs/tooling/linter
     */
    'formatjs/enforce-default-message': ['error', 'literal'],
    'formatjs/enforce-placeholders': ['error'],
    'formatjs/no-camel-case': ['error'],
    'formatjs/no-emoji': ['error'],
    'formatjs/no-multiple-whitespaces': ['error'],
    'formatjs/no-multiple-plurals': 'error',
    'formatjs/no-offset': 'error',
    'formatjs/no-id': 'error',
    'formatjs/no-complex-selectors': 'error',
    'no-console': 'error',
    'no-use-before-define': ['error'],
    'prefer-arrow-callback': 'error',
    /**
     * https://github.com/JamieMason/eslint-plugin-prefer-arrow-functions
     */
    'prefer-arrow-functions/prefer-arrow-functions': [
      'error',
      {
        returnStyle: 'explicit',
      },
    ],
    'relay/generated-flow-types': 'off',
    'sort-imports-es6-autofix/sort-imports-es6': [
      2,
      {
        ignoreCase: false,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['all', 'multiple', 'single', 'none'],
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.js', '**/*.jsx'],
      rules: {
        '@typescript-eslint': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/camelcase': 'off',
      },
    },
    {
      files: ['*.spec.ts', '*.test.ts', '*.spec.tsx', '*.test.tsx'],
      plugins: ['jest'],
      env: {
        es6: true,
        node: true,
        'jest/globals': true,
      },
      extends: ['plugin:jest/recommended'],
      parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module',
      },
    },
  ],
};
