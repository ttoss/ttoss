/**
 * https://prettier.io/docs/en/configuration.html#sharing-configurations
 */
import { configCreator } from './configCreator';

export const defaultConfig: any = {
  extends: ['@commitlint/config-conventional'],
};

export const commitlintConfig = configCreator(defaultConfig);
