import { tsdownConfig } from '@ttoss/config';

const ESM_ONLY_DEPS = ['camelcase-keys', 'camelcase', 'map-obj', 'quick-lru'];

export default tsdownConfig({
  entry: ['src/index.ts', 'src/cloudformation/index.ts'],
  deps: {
    /**
     * camelcase-keys and its runtime dependencies ship ESM only. The CJS build
     * would `require()` them and read `.default` off the module namespace,
     * which is not a function, so bundle them into both outputs instead.
     */
    alwaysBundle: ESM_ONLY_DEPS,
    onlyBundle: ESM_ONLY_DEPS,
  },
});
