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
    import: {
      ignore: ['node_modules'],
    },
    'import/resolver': {
      typescript: true,
      node: true,
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
    'jest-dom',
    'import',
    'react-namespace-import',
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
    'plugin:jest-dom/recommended',
    'plugin:import/typescript',
  ],
  rules: {
    'max-params': ['error', 2],
    '@typescript-eslint/no-non-null-assertion': 'error',
    /**
     * https://formatjs.io/docs/tooling/linter
     */
    'formatjs/enforce-default-message': ['error', 'literal'],
    'formatjs/enforce-placeholders': ['error'],
    'formatjs/no-camel-case': ['error'],
    'formatjs/no-emoji': ['error'],
    'formatjs/no-literal-string-in-jsx': 'warn',
    'formatjs/no-multiple-whitespaces': ['error'],
    'formatjs/no-multiple-plurals': 'error',
    'formatjs/no-offset': 'error',
    'formatjs/no-id': 'error',
    'formatjs/no-complex-selectors': 'error',
    'no-console': 'error',
    /**
     * https://github.com/jsx-eslint/eslint-plugin-react/issues/2628#issuecomment-984160944
     */
    'no-restricted-syntax': [
      'error',
      {
        selector:
          "ImportDeclaration[source.value='react'][specifiers.0.type='ImportDefaultSpecifier']",
        message: 'Use "import * as React from \'react\'" instead.',
      },
    ],
    'no-use-before-define': ['error'],
    'object-shorthand': ['error', 'always'],
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
    /**
     * https://github.com/gonstoll/eslint-plugin-react-namespace-import
     */
    'react-namespace-import/no-namespace-import': 'error',
    'relay/generated-flow-types': 'off',
    'sort-imports-es6-autofix/sort-imports-es6': [
      2,
      {
        ignoreCase: false,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['all', 'multiple', 'single', 'none'],
      },
    ],
    'import/no-default-export': 'error',
    /**
     * https://eslint.org/docs/latest/rules/curly#all
     */
    curly: 'error',
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
      files: ['**/*.stories.tsx', '**/*.stories.jsx'],
      rules: {
        'import/no-default-export': 'off',
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
      rules: {
        'jest/consistent-test-it': [
          'error',
          { fn: 'test', withinDescribe: 'test' },
        ],
      },
    },
  ],
};
