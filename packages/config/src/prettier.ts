/**
 * https://prettier.io/docs/en/configuration.html#sharing-configurations
 */
import { configCreator } from './configCreator';

export const defaultConfig = {
  arrowParens: 'always',
  printWidth: 80,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
};

export const prettierConfig = configCreator(defaultConfig);
