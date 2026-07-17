import { extractCode } from '../../../src/extract.ts';

describe('extractCode', () => {
  test('extracts a single fenced tsx block', () => {
    const completion = [
      'Here is the component:',
      '```tsx',
      "import React from 'react';",
      'const App = () => null;',
      'export default App;',
      '```',
    ].join('\n');

    expect(extractCode(completion)).toContain('export default App;');
    expect(extractCode(completion)).not.toContain('```');
  });

  test('prefers the last block containing an export default', () => {
    const completion = [
      '```tsx',
      'const Draft = () => null;',
      'export default Draft;',
      '```',
      'After fixing the bug:',
      '```tsx',
      'const App = () => null;',
      'export default App;',
      '```',
      'Usage example:',
      '```tsx',
      '<App />',
      '```',
    ].join('\n');

    const code = extractCode(completion);
    expect(code).toContain('export default App;');
    expect(code).not.toContain('<App />');
  });

  test('falls back to the last block when none has export default', () => {
    const completion = ['```tsx', 'const a = 1;', '```'].join('\n');
    expect(extractCode(completion)).toBe('const a = 1;');
  });

  test('accepts raw code without fences', () => {
    const completion = "import React from 'react';\nexport default () => null;";
    expect(extractCode(completion)).toBe(completion);
  });

  test('returns null for prose-only completions', () => {
    expect(extractCode('I cannot generate that component.')).toBeNull();
  });
});
