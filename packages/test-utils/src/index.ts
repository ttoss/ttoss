const TTOSS_ESM_MODULES = [
  'react-error-boundary',
  'react-intl',
  '@formatjs',
  'intl-messageformat',
  '@faker-js/faker',
  'change-case',
  'rehype-raw',
  '@iconify-icons',
  'react-markdown',
  'remark-gfm',
  'remark-parse',
  'unified',
  'mdast-util-from-markdown',
  'mdast-util-to-hast',
  'hast-util-to-jsx-runtime',
  'vfile',
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
