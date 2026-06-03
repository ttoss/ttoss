import { tsdownConfig } from './dist/index.mjs';

const config = tsdownConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
});

console.log('Resolved config:', JSON.stringify(config, null, 2));
