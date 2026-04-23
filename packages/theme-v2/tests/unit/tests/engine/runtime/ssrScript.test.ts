/**
 * @jest-environment jsdom
 */

import { getThemeScriptContent } from '../../../../../src/ssrScript';
import { clearDom } from '../../../helpers/dom';

// ---------------------------------------------------------------------------
// getThemeScriptContent
// ---------------------------------------------------------------------------

describe('getThemeScriptContent', () => {
  afterEach(clearDom);
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

  test('when defaultTheme is omitted, data-tt-theme is not written', () => {
    localStorage.clear();
    new Function(getThemeScriptContent({ defaultMode: 'light' }))();
    // dt is undefined — if(dt) is falsy — no attribute written
    expect(document.documentElement.getAttribute('data-tt-theme')).toBeNull();
  });

  test('when defaultTheme is provided, data-tt-theme is written', () => {
    const script = getThemeScriptContent({ defaultTheme: 'bruttal' });
    expect(script).toContain("'data-tt-theme'");
    expect(script).toContain('"bruttal"');
  });

  test('uses custom defaultMode', () => {
    const script = getThemeScriptContent({ defaultMode: 'dark' });
    expect(script).toContain('"dark"');
  });

  test('uses custom storageKey', () => {
    const script = getThemeScriptContent({ storageKey: 'my-key' });
    expect(script).toContain('"my-key"');
  });

  test('uses custom defaultTheme', () => {
    const script = getThemeScriptContent({ defaultTheme: 'bruttal' });
    expect(script).toContain('"bruttal"');
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

  test('bootstraps default state into DOM when localStorage is empty', () => {
    localStorage.clear();
    // Use explicit mode to avoid window.matchMedia (not available in jsdom)
    new Function(getThemeScriptContent({ defaultMode: 'light' }))();
    expect(document.documentElement.getAttribute('data-tt-theme')).toBeNull();
    expect(document.documentElement.getAttribute('data-tt-mode')).toBe('light');
  });

  test('restores persisted mode from localStorage (themeId in storage is ignored)', () => {
    localStorage.setItem(
      'tt-theme',
      JSON.stringify({ themeId: 'bruttal', mode: 'dark' })
    );
    new Function(getThemeScriptContent())();
    // themeId from localStorage is ignored and no defaultTheme was provided
    expect(document.documentElement.getAttribute('data-tt-theme')).toBeNull();
    expect(document.documentElement.getAttribute('data-tt-mode')).toBe('dark');
  });

  test('falls back to light mode when window.matchMedia is unavailable', () => {
    localStorage.clear();
    // Execute the system-mode script in a context where matchMedia is absent
    const scriptFn = new Function(
      'window',
      'document',
      getThemeScriptContent({ defaultMode: 'system' })
    );
    const fakeDoc = {
      documentElement: {
        attributes: {} as Record<string, string>,
        setAttribute(k: string, v: string) {
          this.attributes[k] = v;
        },
        removeAttribute(k: string) {
          delete this.attributes[k];
        },
        style: {} as Record<string, string>,
      },
    };
    // window without matchMedia
    const fakeWindow = { localStorage };
    scriptFn(fakeWindow, fakeDoc);
    expect(fakeDoc.documentElement.attributes['data-tt-mode']).toBe('light');
  });

  test('throws when defaultTheme contains invalid characters', () => {
    expect(() => {
      return getThemeScriptContent({
        defaultTheme: '</script><script>alert(1)',
      });
    }).toThrow(/Invalid defaultTheme/);
  });

  test('accepts valid defaultTheme with hyphens and underscores', () => {
    expect(() => {
      return getThemeScriptContent({ defaultTheme: 'my-theme_v2' });
    }).not.toThrow();
  });
});
