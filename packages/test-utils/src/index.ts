/**
 * https://github.com/facebook/jest/issues/12984#issuecomment-1228392944
 */
export const getTransformIgnorePatterns = ({
  esmModules,
}: {
  esmModules?: string[];
}) => {
  if (!esmModules) {
    return [];
  }

  return [
    `node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(${esmModules.join('|')}))`,
  ];
};
