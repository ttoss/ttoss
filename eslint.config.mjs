// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import ttossEslintConfig from '@ttoss/eslint-config';

export default [...ttossEslintConfig, ...storybook.configs["flat/recommended"]];
