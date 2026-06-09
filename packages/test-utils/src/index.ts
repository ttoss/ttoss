/**
 * Returns transformIgnorePatterns that allow Jest to transform all node_modules,
 * including ESM-only packages (react-markdown, react-intl, etc. and their
 * transitive deps). The pattern never matches any real pnpm path, so Jest
 * transforms everything — the same approach used by @ttoss/components.
 *
 * Pass `esmModules` for backwards-compat; the argument is ignored.
 * https://github.com/facebook/jest/issues/12984#issuecomment-1228392944
 */
export const getTransformIgnorePatterns = (_options?: {
  esmModules?: string[];
}) => {
  return ['node_modules/(?!rehype-raw)/'];
};
