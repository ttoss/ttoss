import * as allExports from 'src/themes/Bruttal2/Bruttal2';

test('should export fonts, icons, and theme', () => {
  expect(allExports.Bruttal2Fonts).toBeDefined();
  expect(allExports.Bruttal2Icons).toBeDefined();
  expect(allExports.Bruttal2Theme).toBeDefined();
});

test('should export only semantic tokens and theme components', () => {
  expect(allExports.Bruttal2Fonts).toBeDefined();
  expect(allExports.Bruttal2Icons).toBeDefined();
  expect(allExports.Bruttal2Theme).toBeDefined();
  expect(allExports.semanticColors).toBeDefined();

  // Core tokens should NOT be exported (internal only)
  expect('coreColors' in allExports).toBe(false);
  expect('coreFonts' in allExports).toBe(false);
  expect('coreRadii' in allExports).toBe(false);
});

test('should have semantic color structure for application consumption', () => {
  const { semanticColors } = allExports;

  // Test UX contexts exist
  expect(semanticColors.action).toBeDefined();
  expect(semanticColors.input).toBeDefined();
  expect(semanticColors.content).toBeDefined();
  expect(semanticColors.feedback).toBeDefined();
  expect(semanticColors.navigation).toBeDefined();
  expect(semanticColors.discovery).toBeDefined();
  expect(semanticColors.guidance).toBeDefined();

  // Test semantic structure with optimized token paths
  expect(semanticColors.action.background.primary.default).toBeDefined();
  expect(semanticColors.input.border.muted.focused).toBeDefined();
  expect(semanticColors.content.text.primary.default).toBeDefined();
  expect(semanticColors.feedback.text.negative.default).toBeDefined();
});

test('theme should contain semantic colors without rawColors', () => {
  const { Bruttal2Theme } = allExports;

  // Should have semantic color structure
  expect(Bruttal2Theme.colors?.action).toBeDefined();
  expect(Bruttal2Theme.colors?.content).toBeDefined();
  expect(Bruttal2Theme.colors?.input).toBeDefined();

  // Should NOT expose core tokens directly
  expect('rawColors' in (Bruttal2Theme.colors || {})).toBe(false);
});

test('Bruttal2 theme snapshot', () => {
  expect(allExports.Bruttal2Theme).toMatchSnapshot();
});
