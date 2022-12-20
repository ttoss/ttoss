/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';
import yaml from 'js-yaml';

export const readYaml = ({ path }: { path: string }) => {
  const template = fs.readFileSync(path, 'utf8') || JSON.stringify({});
  return yaml.load(template);
};

/**
 * If your file is `.ts`, you must you must export the final object
 * `export default { ... }`. If your file is `.js`, you must you must export
 * the final object `module.exports =  { ... }`. `.json` and `.yml/yaml` must
 * define the resources in [JSON](https://www.json.org/json-en.html) and
 * [YAML](https://yaml.org/) format respectively.
 */
export const readObjectFile = ({ path }: { path: string }) => {
  if (!fs.existsSync(path)) {
    return {};
  }

  const extension = path.split('.').pop();

  if (extension === 'ts') {
    require('ts-node').register({
      compilerOptions: { module: 'commonjs' },
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
