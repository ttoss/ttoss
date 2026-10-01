/**
 * The one message-id pattern of the ttoss ecosystem. `ttoss-i18n` extracts
 * with it, the build presets below inject it, and a package's compiled
 * catalogs only match its runtime ids when both sides use the same one — a
 * mismatch fails silently, every message falling back to its
 * `defaultMessage`. Import it instead of retyping it.
 */
export const I18N_ID_INTERPOLATION_PATTERN = '[sha512:contenthash:base64:6]';

/**
 * `preserveWhitespace` keeps a message's line breaks and indentation, which
 * formatjs otherwise collapses to single spaces — multi-line copy would render
 * on one line. It is part of the id contract, not only of rendering: the
 * hashed id is computed over the message text, so the build and `ttoss-i18n`
 * extraction must agree on it, or every message with a whitespace run gets a
 * different id on each side. `@ttoss/i18n-cli` extracts with it too.
 */
const formatjsOptions = () => {
  return {
    idInterpolationPattern: I18N_ID_INTERPOLATION_PATTERN,
    ast: true,
    preserveWhitespace: true,
  };
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
