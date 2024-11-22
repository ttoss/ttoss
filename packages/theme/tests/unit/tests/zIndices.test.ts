import { createTheme } from '../../../src';

test('should have modal z-index', () => {
  const theme = createTheme({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect((theme.zIndices as any)?.modal).toBeDefined();
});
