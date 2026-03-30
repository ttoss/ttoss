import ttossEslintConfig from '@ttoss/eslint-config';
import storybook from 'eslint-plugin-storybook';

export default [...ttossEslintConfig, ...storybook.configs['flat/recommended']];
