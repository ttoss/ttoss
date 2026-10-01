import { jestUnitConfig } from '../../dist/index.mjs';

export default jestUnitConfig({
  // babel-plugin-formatjs and @formatjs/* ship ESM only.
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm/)?(@formatjs|babel-plugin-formatjs))',
  ],
});
