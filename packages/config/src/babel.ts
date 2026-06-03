import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { configCreator } from './configCreator';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const defaultConfig = require('../babel.config.cjs');

export { defaultConfig };

export const babelConfig = configCreator(defaultConfig);
