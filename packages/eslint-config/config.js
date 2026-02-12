import eslint from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import turboConfig from 'eslint-config-turbo/flat';
import formatjs from 'eslint-plugin-formatjs';
import importPlugin from 'eslint-plugin-import';
import jest from 'eslint-plugin-jest';
import jestDom from 'eslint-plugin-jest-dom';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import preferArrowFunctions from 'eslint-plugin-prefer-arrow-functions';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNamespaceImport from 'eslint-plugin-react-namespace-import';
import reactRefresh from 'eslint-plugin-react-refresh';
import relay from 'eslint-plugin-relay';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.generated.*',
      '**/coverage/**',
    ],
  },
  ...turboConfig,
  eslint.configs.recommended,
  tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  // {
  //   files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
  //   ...reactPlugin.configs.flat.recommended,
  // },
  // {
  //   files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
  //   ...reactPlugin.configs.flat['jsx-runtime'],
  // },
  relay.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    plugins: {
      relay,
      formatjs,
      'jsx-a11y': jsxA11y,
      'prefer-arrow-functions': preferArrowFunctions,
      'react-namespace-import': reactNamespaceImport,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
      unicorn: eslintPluginUnicorn,
    },
    languageOptions: {
      globals: globals.builtin,
      parser: tsParser,
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
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-use-before-define': ['error'],
      curly: 'error',
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
      'import/no-default-export': 'off',
      'import/no-unresolved': 'off',
      'max-params': ['error', 3],
      'no-console': 'error',
      'no-use-before-define': 'off',
      'object-shorthand': ['error', 'always'],
      'prefer-arrow-callback': 'error',
      'prefer-arrow-functions/prefer-arrow-functions': [
        'error',
        {
          returnStyle: 'explicit',
        },
      ],
      'react-namespace-import/no-namespace-import': 'error',
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
        },
      ],
      'relay/generated-flow-types': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unicorn/no-array-for-each': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/prefer-node-protocol': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.jsx', '**/*.cjs'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.tsx', '**/*.test.tsx'],
    ...jestDom.configs['flat/recommended'],
    plugins: {
      jest,
      ...jestDom.configs['flat/recommended'].plugins,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...jest.environments.globals.globals,
      },

      ecmaVersion: 2019,
      sourceType: 'module',
    },
    rules: {
      'jest/consistent-test-it': [
        'error',
        {
          fn: 'test',
          withinDescribe: 'test',
        },
      ],
    },
  },
  eslintPluginPrettierRecommended
);
