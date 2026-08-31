import { defineConfig } from 'eslint/config';
import relay from 'eslint-plugin-relay';

/**
 * Relay rules, for applications that actually use Relay.
 *
 * Kept out of the base config on purpose: every rule here operates on
 * `graphql\`...\`` tagged template literals, so in a codebase without them the
 * plugin loads for every linted file and reports nothing.
 *
 * Uses the plugin's `ts-recommended` set rather than `recommended`, which adds
 * `generated-typescript-types` in place of the Flow-oriented check.
 *
 * Compose it after the base config:
 *
 * ```js
 * import ttossEslintConfig from '@ttoss/eslint-config';
 * import ttossEslintConfigRelay from '@ttoss/eslint-config/relay';
 *
 * export default [...ttossEslintConfig, ...ttossEslintConfigRelay];
 * ```
 */
export default defineConfig({
  plugins: {
    relay,
  },
  rules: {
    ...relay.configs['ts-recommended'].rules,
  },
});
