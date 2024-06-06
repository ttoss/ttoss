import { configCreator } from './configCreator';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultConfig = require('../babel.config.js');

export { defaultConfig };

export const babelConfig = configCreator(defaultConfig);
