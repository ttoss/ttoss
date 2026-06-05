import { configCreator } from './configCreator';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const defaultConfig = require('../babel.config.cjs');

export { defaultConfig };

export const babelConfig = configCreator(defaultConfig);
