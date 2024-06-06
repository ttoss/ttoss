import { configCreator } from './configCreator';
import defaultConfig from '../babel.config';

export { defaultConfig };

export const babelConfig = configCreator(defaultConfig);
