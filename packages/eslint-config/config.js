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
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNamespaceImport from 'eslint-plugin-react-namespace-import';
import reactRefresh from 'eslint-plugin-react-refresh';
import relay from 'eslint-plugin-relay';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
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
  {
    files: ['**/*.{jsx,tsx}'],
    ...reactPlugin.configs.flat.recommended,
  },
  {
    files: ['**/*.{jsx,tsx}'],
    ...reactPlugin.configs.flat['jsx-runtime'],
  },
  relay.configs.recommended,
  // Not scoped to JSX: custom hooks live in plain .ts files, and scoping this
  // to {jsx,tsx} silently drops the hooks rules there.
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{jsx,tsx}'],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    plugins: {
      relay,
      formatjs,
      'prefer-arrow-functions': preferArrowFunctions,
      'react-namespace-import': reactNamespaceImport,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
      sonarjs,
      unicorn: eslintPluginUnicorn,
    },
    linterOptions: {
      // An eslint-disable comment for a rule that no longer reports is a lie
      // about what is enforced. Report them so they get removed.
      reportUnusedDisableDirectives: 'error',
    },
    languageOptions: {
      globals: globals.builtin,
      parser: tsParser,
    },
    settings: {
      react: {
        version: 'detect',
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
      // `any` is banned via @typescript-eslint/no-explicit-any (inherited from
      // tseslint.configs.recommended). `unknown` is deliberately NOT banned:
      // it is the safe counterpart to `any`, and TypeScript has no alternative
      // for `as unknown as T` double assertions, `Record<string, unknown>`, or
      // generic defaults. Banning it pushes code toward `any`, which is worse.
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
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
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
      'max-params': ['error', 5],
      // Cognitive complexity weights nesting, so it tracks how hard code is to
      // read rather than how many paths it has. Threshold reports above the
      // value, so 21 enforces < 22.
      'sonarjs/cognitive-complexity': ['error', 21],

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

      // ── Redundant and dead code (SonarJS) ─────────────────────────────────
      // Catch duplicated logic and assignments that are never read. ESLint sees
      // one file at a time: cross-file duplication and unused exports are out of
      // reach here and need a dedicated tool (jscpd, Knip).
      // https://github.com/SonarSource/eslint-plugin-sonarjs
      'sonarjs/no-all-duplicated-branches': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/no-dead-store': 'error',
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-identical-expressions': 'error',
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-redundant-jump': 'error',
      'sonarjs/no-unused-collection': 'error',

      // ── Unicorn ───────────────────────────────────────────────────────────
      // Enforce modern JavaScript best practices and Node.js idioms.
      // https://github.com/sindresorhus/eslint-plugin-unicorn
      'unicorn/no-array-for-each': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/prefer-node-protocol': 'error',
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
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
    files: ['**/*.{js,jsx,cjs,mjs}'],
    // Tooling scripts, babel configs and CLIs run on Node. `globals.builtin`
    // alone leaves `console`, `process` and `Buffer` undefined, which only
    // produces no-undef noise — TypeScript files are unaffected because
    // tseslint's recommended config already turns no-undef off for them.
    languageOptions: {
      globals: globals.node,
    },
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
      globals: { ...globals.node, ...globals.commonjs },
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

      // Only the rules whose shape is wrong for a test suite are disabled here,
      // measured across the repo's test files rather than assumed:
      //
      //   max-lines-per-function — a `describe` block is one function, so a
      //     whole suite counts as a single 80-line function
      //   max-nested-callbacks   — `describe > describe > test > callback` is
      //     the standard shape of a suite, not accidental nesting
      //   max-lines              — table-driven suites are legitimately long
      //   complexity             — a handful of table-driven helpers exceed it
      //   no-identical-functions — near-identical arrange/assert blocks are how
      //     a suite stays readable, not duplication to factor out
      //
      // max-depth, max-params and cognitive-complexity are deliberately NOT
      // disabled: they report zero violations across the test suites, so
      // turning them off buys nothing and gives up the protection.
      complexity: 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-nested-callbacks': 'off',
      'sonarjs/no-identical-functions': 'off',
    },
  },
  eslintPluginPrettierRecommended
);
