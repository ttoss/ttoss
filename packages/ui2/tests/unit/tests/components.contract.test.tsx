/**
 * Universal component contract tests for @ttoss/ui2.
 *
 * Auto-discovers all ui2 primitives by scanning `src/components/`.
 * Each component using `defineComponent()` exports a `*ContractConfig`.
 * This test file discovers them automatically — no manual registration.
 *
 * Convention: `src/components/Name/Name.tsx` exports `{camelName}ContractConfig`.
 *
 * Note: Composites (e.g. TextField) are NOT included — they don't have their
 * own resolveTokens() call. They are tested through their own test files.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { ComponentContractConfig } from 'src/_model/factory.types';

import { testComponentContract } from '../helpers/componentContract';

// ---------------------------------------------------------------------------
// Auto-discovery
// ---------------------------------------------------------------------------

const componentsDir = path.resolve(__dirname, '../../../src/components');
const componentDirs = fs
  .readdirSync(componentsDir, { withFileTypes: true })
  .filter((d) => {
    return d.isDirectory();
  })
  .map((d) => {
    return d.name;
  });

const configs: ComponentContractConfig[] = [];

for (const dir of componentDirs) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(`src/components/${dir}/${dir}`) as Record<
    string,
    unknown
  >;
  const configKey = Object.keys(mod).find((k) => {
    return k.endsWith('ContractConfig');
  });
  if (configKey) {
    configs.push(mod[configKey] as ComponentContractConfig);
  }
}

// Verify we discovered all expected components (guard against silent failures)
if (configs.length === 0) {
  throw new Error(
    'Auto-discovery found 0 component contract configs. ' +
      'Check that components export *ContractConfig from their module files.'
  );
}

for (const config of configs) {
  testComponentContract(config);
}
