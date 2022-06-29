import * as uiModule from './';

test('should export methods', () => {
  expect(uiModule.useBreakpointIndex).toBeDefined();
  expect(uiModule.useResponsiveValue).toBeDefined();
  expect(uiModule.useTheme).toBeDefined();

  expect(uiModule.Divider).toBeDefined();
});
