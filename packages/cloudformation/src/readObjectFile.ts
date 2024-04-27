/* eslint-disable @typescript-eslint/no-var-requires */
import { createRequire } from 'node:module';
import { register } from 'ts-node';
import fs from 'fs';
import yaml from 'js-yaml';

export const readYaml = ({ path }: { path: string }) => {
  const template = fs.readFileSync(path, 'utf8') || JSON.stringify({});
  return yaml.load(template);
};

export const readObjectFile = ({ path }: { path: string }) => {
  if (!fs.existsSync(path)) {
    return {};
  }

  const require = createRequire(import.meta.url);

  const extension = path.split('.').pop();

  if (extension === 'ts') {
    register({
      compilerOptions: { moduleResolution: 'node', module: 'commonjs' },
      moduleTypes: {
        'carlin.*': 'cjs',
      },
      transpileOnly: true,
    });

    const tsObj = require(path);
    const obj = tsObj.default || tsObj;
    return typeof obj === 'function' ? obj() : obj;
  }

  if (extension === 'js') {
    const obj = require(path);
    return typeof obj === 'function' ? obj() : obj;
  }

  if (extension === 'json') {
    return require(path);
  }

  if (extension === 'yml' || extension === 'yaml') {
    return readYaml({ path });
  }

  return {};
};
