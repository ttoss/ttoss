import fs from 'node:fs/promises';
import path from 'node:path';

import pkg from '../package.json';
import { components } from '../tsdown.config';

// eslint-disable-next-line no-console
console.log('Updating package.json exports...');

const newPkg = {
  ...pkg,
  exports: Object.fromEntries(
    components.map((component) => {
      return [`./${component}`, `./src/components/${component}/index.ts`];
    })
  ),
  publishConfig: {
    ...pkg.publishConfig,
    exports: Object.fromEntries(
      components.map((component) => {
        return [
          `./${component}`,
          {
            types: `./dist/${component}/index.d.mts`,
            default: `./dist/${component}/index.mjs`,
          },
        ];
      })
    ),
  },
};

fs.writeFile(
  path.join(process.cwd(), 'package.json'),
  JSON.stringify(newPkg, null, 2)
);
