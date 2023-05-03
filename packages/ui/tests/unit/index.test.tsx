import * as uiModule from '../../src';

test('should export methods', () => {
  expect(uiModule.useBreakpointIndex).toBeDefined();
  expect(uiModule.useResponsiveValue).toBeDefined();
  expect(uiModule.useTheme).toBeDefined();
  expect(uiModule.BaseStyles).toBeDefined();
  expect(uiModule.Global).toBeDefined();
  expect(uiModule.keyframes).toBeDefined();

  expect(uiModule.Badge).toBeDefined();
  expect(uiModule.Box).toBeDefined();
  expect(uiModule.Button).toBeDefined();
  expect(uiModule.Card).toBeDefined();
  expect(uiModule.Divider).toBeDefined();
  expect(uiModule.Flex).toBeDefined();
  expect(uiModule.Grid).toBeDefined();
  expect(uiModule.Heading).toBeDefined();
  expect(uiModule.Image).toBeDefined();
  expect(uiModule.Input).toBeDefined();
  expect(uiModule.Label).toBeDefined();
  expect(uiModule.Link).toBeDefined();
  expect(uiModule.LinearProgress).toBeDefined();
  expect(uiModule.Text).toBeDefined();
  expect(uiModule.Select).toBeDefined();
  expect(uiModule.Spinner).toBeDefined();
  expect(uiModule.Radio).toBeDefined();
  expect(uiModule.Icon).toBeDefined();
  expect(uiModule.Slider).toBeDefined();
  expect(uiModule.Checkbox).toBeDefined();
  expect(uiModule.InfiniteLinearProgress).toBeDefined();
  expect(uiModule.Textarea).toBeDefined();
  expect(uiModule.Container).toBeDefined();
  expect(uiModule.Paragraph).toBeDefined();
});
