/**
 * Tree-shaking probe (audit A10).
 *
 * Bundles `import { Button } from '@ttoss/fsl-ui'` with esbuild against the
 * built `dist/` output (falling back to `src/` when dist is absent — e.g.
 * when the probe runs before a build) and asserts:
 *
 *   1. Composite code is shaken out — the bundle must not contain the
 *      Wizard/DialogModal/ConfirmationDialog implementations.
 *   2. The Button-only bundle stays under a byte budget.
 *
 * Peer/runtime dependencies (react, react-aria-components, @ttoss/fsl-theme)
 * are marked external: the probe measures THIS package's shakeability, not
 * the cost of its dependencies. Run with `pnpm run verify:treeshake`.
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const distEntry = resolve(pkgRoot, 'dist/index.mjs');
const srcEntry = resolve(pkgRoot, 'src/index.ts');
const entry = existsSync(distEntry) ? distEntry : srcEntry;

// Markers that only exist in composite implementations — if any survives a
// Button-only import, tree-shaking is broken.
const COMPOSITE_MARKERS = [
  'data-scope="wizard"',
  "data-scope='wizard'",
  'data-scope:"wizard"',
  'wizard',
  'confirmation-dialog',
  'toast-region',
];

// Byte budget for the minified Button-only bundle (externals excluded).
// The probe prints the measured size on every run; generous headroom
// before the probe complains — a jump past this means the barrel stopped
// shaking.
const BUDGET_BYTES = 16_000;

const result = await build({
  stdin: {
    contents: `export { Button } from ${JSON.stringify(entry)};`,
    resolveDir: pkgRoot,
    loader: 'ts',
  },
  bundle: true,
  minify: true,
  format: 'esm',
  write: false,
  logLevel: 'silent',
  external: ['react', 'react-dom', 'react-aria-components', '@ttoss/fsl-theme'],
});

const output = result.outputFiles[0].text;
const bytes = Buffer.byteLength(output, 'utf8');

const leaked = COMPOSITE_MARKERS.filter((marker) => {
  return output.toLowerCase().includes(marker.toLowerCase());
});

process.stdout.write(`entry:  ${entry.replace(`${pkgRoot}/`, '')}\n`);
process.stdout.write(`bundle: ${bytes} bytes (minified, externals excluded)\n`);
process.stdout.write(`budget: ${BUDGET_BYTES} bytes\n`);

let failed = false;
if (leaked.length > 0) {
  process.stderr.write(
    `FAIL: composite code leaked into a Button-only bundle: ${leaked.join(', ')}\n`
  );
  failed = true;
}
if (bytes > BUDGET_BYTES) {
  process.stderr.write(
    `FAIL: bundle exceeds budget by ${bytes - BUDGET_BYTES} bytes\n`
  );
  failed = true;
}

if (failed) {
  process.exit(1);
}
process.stdout.write('OK: Button-only import tree-shakes cleanly.\n');
