const TTOSS_ESM_MODULES = [
  'react-error-boundary',
  'react-intl',
  '@formatjs',
  'intl-messageformat',
  '@faker-js/faker',
  'change-case',
  'rehype-raw',
  '@iconify-icons',
];

/**
 * https://github.com/facebook/jest/issues/12984#issuecomment-1228392944
 */
export const getTransformIgnorePatterns = ({
  esmModules,
}: {
  esmModules?: string[];
} = {}) => {
  const allEsmModules = [...TTOSS_ESM_MODULES, ...(esmModules || [])];

  return [
    `node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(${allEsmModules.join('|')}))`,
  ];
};
