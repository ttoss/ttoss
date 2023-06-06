import { createTheme } from '../../src';

test('should have modal z-index', () => {
  const theme = createTheme({});
  expect((theme.zIndices as any)?.modal).toBeDefined();
});
