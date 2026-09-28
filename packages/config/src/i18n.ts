/**
 * The one message-id pattern of the ttoss ecosystem. `ttoss-i18n` extracts
 * with it, the build presets below inject it, and a package's compiled
 * catalogs only match its runtime ids when both sides use the same one — a
 * mismatch fails silently, every message falling back to its
 * `defaultMessage`. Import it instead of retyping it.
 */
export const I18N_ID_INTERPOLATION_PATTERN = '[sha512:contenthash:base64:6]';

const formatjsOptions = () => {
  return { idInterpolationPattern: I18N_ID_INTERPOLATION_PATTERN, ast: true };
};

/**
 * `babel-plugin-formatjs` with the canonical pattern — for Babel, Jest and
 * `@vitejs/plugin-react` (`react({ babel: { plugins: [formatjsBabelPlugin()] } })`).
 */
export const formatjsBabelPlugin = (): [
  string,
  ReturnType<typeof formatjsOptions>,
] => {
  return ['formatjs', formatjsOptions()];
};

/**
 * `@swc/plugin-formatjs` with the canonical pattern — for SWC and
 * `@vitejs/plugin-react-swc` (`react({ plugins: [formatjsSwcPlugin()] })`).
 */
export const formatjsSwcPlugin = (): [
  string,
  ReturnType<typeof formatjsOptions>,
] => {
  return ['@swc/plugin-formatjs', formatjsOptions()];
};
