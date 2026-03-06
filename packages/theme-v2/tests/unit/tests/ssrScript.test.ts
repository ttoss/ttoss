import { getThemeScriptContent } from '../../../src/ssrScript';

// ---------------------------------------------------------------------------
// getThemeScriptContent
// ---------------------------------------------------------------------------

describe('getThemeScriptContent', () => {
  test('returns a non-empty string', () => {
    const script = getThemeScriptContent();
    expect(typeof script).toBe('string');
    expect(script.length).toBeGreaterThan(0);
  });

  test('is wrapped in an IIFE', () => {
    const script = getThemeScriptContent();
    expect(script).toMatch(/^\(function\(\)\{/);
    expect(script).toMatch(/\}\)\(\)$/);
  });

  test('contains default storageKey', () => {
    const script = getThemeScriptContent();
    expect(script).toContain('"tt-theme"');
  });

  test('contains default theme id', () => {
    const script = getThemeScriptContent();
    expect(script).toContain('"default"');
  });

  test('uses custom storageKey', () => {
    const script = getThemeScriptContent({ storageKey: 'my-key' });
    expect(script).toContain('"my-key"');
  });

  test('uses custom defaultTheme', () => {
    const script = getThemeScriptContent({ defaultTheme: 'bruttal' });
    expect(script).toContain('"bruttal"');
  });

  test('uses custom defaultMode', () => {
    const script = getThemeScriptContent({ defaultMode: 'dark' });
    expect(script).toContain('"dark"');
  });

  test('sets data-tt-theme attribute', () => {
    const script = getThemeScriptContent();
    expect(script).toContain("'data-tt-theme'");
  });

  test('sets data-tt-mode attribute', () => {
    const script = getThemeScriptContent();
    expect(script).toContain("'data-tt-mode'");
  });

  test('checks prefers-color-scheme for system mode', () => {
    const script = getThemeScriptContent();
    expect(script).toContain('prefers-color-scheme');
  });

  test('reads from localStorage', () => {
    const script = getThemeScriptContent();
    expect(script).toContain('localStorage.getItem');
  });

  test('sets colorScheme style', () => {
    const script = getThemeScriptContent();
    expect(script).toContain('colorScheme');
  });

  test('is valid JavaScript (can be evaluated)', () => {
    // In a real browser, this would run. We just verify it parses.
    expect(() => {
      new Function(getThemeScriptContent());
    }).not.toThrow();
  });

  test('contains mode validation array', () => {
    const script = getThemeScriptContent();
    expect(script).toContain("vm=['light','dark','system']");
  });

  test('validates stored mode with indexOf check', () => {
    const script = getThemeScriptContent();
    expect(script).toContain('vm.indexOf(s.mode)!==-1');
  });
});
