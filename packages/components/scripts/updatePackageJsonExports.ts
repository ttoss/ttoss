import { components } from '../tsup.config';
import fs from 'node:fs/promises';
import path from 'node:path';
import pkg from '../package.json';

// eslint-disable-next-line no-console
console.log('Updating package.json exports...', pkg);

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
            types: `./dist/${component}/index.d.ts`,
            import: `./dist/esm/${component}/index.js`,
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
