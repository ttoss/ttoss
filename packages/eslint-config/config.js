import eslint from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import formatjs from 'eslint-plugin-formatjs';
import importPlugin from 'eslint-plugin-import';
import jest from 'eslint-plugin-jest';
import jestDom from 'eslint-plugin-jest-dom';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import preferArrowFunctions from 'eslint-plugin-prefer-arrow-functions';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
// import reactPlugin from 'eslint-plugin-react';
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
  eslint.configs.recommended,
  tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  /**
   * TODO: uncomment when eslint-plugin-react supports ESLint 10
   */
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
  jsxA11y.flatConfigs.recommended,
  {
    plugins: {
      relay,
      formatjs,
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
      // ── TypeScript ────────────────────────────────────────────────────────
      // Enforce type safety and TypeScript idioms across the codebase.
      // https://typescript-eslint.io/rules/
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-use-before-define': ['error'],

      // ── Internationalization (FormatJS) ───────────────────────────────────
      // Keep i18n message definitions correct, consistent, and translator-friendly.
      // https://formatjs.io/docs/tooling/linter/
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

      // ── Import organization ───────────────────────────────────────────────
      // Keep imports sorted, explicit, and free of unresolved paths.
      // https://github.com/lydell/eslint-plugin-simple-import-sort
      'import/no-default-export': 'off',
      'import/no-unresolved': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // ── Complexity and code size ──────────────────────────────────────────
      // Prevent functions and files from growing too large to understand or test.
      // https://www.sonarsource.com/blog/cognitive-complexity-because-testability-understandability-and-changeability-matter/
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', { max: 4 }],
      'max-lines': [
        'error',
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
      'max-nested-callbacks': ['error', { max: 3 }],
      'max-params': ['error', 3],

      // ── Code quality ──────────────────────────────────────────────────────
      // Enforce clean control flow and idiomatic JavaScript patterns.
      // https://eslint.org/docs/latest/rules/
      curly: 'error',
      'no-console': 'error',
      'no-else-return': 'error',
      'no-use-before-define': 'off',
      'object-shorthand': ['error', 'always'],
      'prefer-arrow-callback': 'error',

      // ── Arrow functions ───────────────────────────────────────────────────
      // Enforce consistent use of arrow functions over function declarations.
      // https://github.com/nicolo-ribaudo/eslint-plugin-prefer-arrow-functions
      'prefer-arrow-functions/prefer-arrow-functions': [
        'error',
        {
          returnStyle: 'explicit',
        },
      ],

      // ── React ─────────────────────────────────────────────────────────────
      // Enforce React best practices, including component purity and refresh safety.
      // https://react.dev/learn/keeping-components-pure
      'react-namespace-import/no-namespace-import': 'error',
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
        },
      ],

      // ── Relay ─────────────────────────────────────────────────────────────
      // GraphQL Relay framework rules.
      // https://relay.dev/
      'relay/generated-flow-types': 'off',

      // ── Unicorn ───────────────────────────────────────────────────────────
      // Enforce modern JavaScript best practices and Node.js idioms.
      // https://github.com/sindresorhus/eslint-plugin-unicorn
      'unicorn/no-array-for-each': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/prefer-node-protocol': 'error',
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      // React components with JSX, hooks, and handlers routinely exceed 80 lines
      // while remaining focused and readable — allow a slightly higher limit.
      'max-lines-per-function': [
        'error',
        { max: 150, skipBlankLines: true, skipComments: true },
      ],
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
    files: ['**/*.cjs'],
    languageOptions: {
      globals: globals.commonjs,
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

      // Test files legitimately have many test cases, long setup blocks, and
      // deeply nested assertions — complexity/size rules add noise without value.
      complexity: 'off',
      'max-depth': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-nested-callbacks': 'off',
      'max-params': 'off',
    },
  },
  eslintPluginPrettierRecommended
);
