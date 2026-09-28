import {
  babelConfig,
  formatjsBabelPlugin,
  formatjsSwcPlugin,
  I18N_ID_INTERPOLATION_PATTERN,
} from 'src/index';

test('the presets carry the canonical id pattern', () => {
  expect(I18N_ID_INTERPOLATION_PATTERN).toBe('[sha512:contenthash:base64:6]');
  expect(formatjsBabelPlugin()).toEqual([
    'formatjs',
    { idInterpolationPattern: I18N_ID_INTERPOLATION_PATTERN, ast: true },
  ]);
  expect(formatjsSwcPlugin()).toEqual([
    '@swc/plugin-formatjs',
    { idInterpolationPattern: I18N_ID_INTERPOLATION_PATTERN, ast: true },
  ]);
});

test('babel.config.cjs, which cannot import it, uses the same pattern', () => {
  const plugins = babelConfig().overrides.flatMap(
    (override: { plugins: unknown[] }) => {
      return override.plugins;
    }
  );

  expect(plugins).toContainEqual(formatjsBabelPlugin());
});
