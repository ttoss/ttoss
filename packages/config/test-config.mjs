import { tsdownConfig } from './dist/index.mjs';

const config = tsdownConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
});

process.stdout.write(`Resolved config: ${JSON.stringify(config, null, 2)}\n`);
