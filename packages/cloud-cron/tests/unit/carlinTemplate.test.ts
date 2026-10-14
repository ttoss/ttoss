import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as esbuild from 'esbuild';

// carlin reads a TypeScript template by bundling it to CJS with every import
// it reaches (`@ttoss/read-config-file`), then requiring the bundle.
test('loads as a carlin template', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cloud-cron-'));
  const entry = path.join(dir, 'cloudformation.ts');
  const outfile = path.join(dir, 'cloudformation.cjs');

  fs.writeFileSync(
    entry,
    `import { createCronTemplate, importValueFromParameter } from ${JSON.stringify(
      path.resolve(__dirname, '../../src')
    )};

export default createCronTemplate({
  role: importValueFromParameter('CronRoleExportedName'),
  jobs: { Job: { handler: 'job.handler', schedule: 'rate(1 day)' } },
});
`
  );

  esbuild.buildSync({
    bundle: true,
    entryPoints: [entry],
    external: [],
    format: 'cjs',
    outfile,
    platform: 'node',
    target: 'ES2021',
    treeShaking: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const template = require(outfile).default;

  expect(template.Resources.JobFunction.Properties.Role).toEqual({
    'Fn::ImportValue': { 'Fn::Sub': '${CronRoleExportedName}' },
  });
});
