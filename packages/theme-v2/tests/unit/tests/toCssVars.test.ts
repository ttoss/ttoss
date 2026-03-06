import { defaultTheme, themes, toCssVars } from '../../../src';

// ---------------------------------------------------------------------------
// Selector generation
// ---------------------------------------------------------------------------

describe('toCssVars', () => {
  describe('selector', () => {
    test('defaults to :root when no options given', () => {
      const result = toCssVars(defaultTheme);
      expect(result.selector).toBe(':root');
    });

    test('scopes by themeId', () => {
      const result = toCssVars(defaultTheme, { themeId: 'bruttal' });
      expect(result.selector).toBe('[data-tt-theme="bruttal"]');
    });

    test('scopes by themeId and mode', () => {
      const result = toCssVars(defaultTheme, {
        themeId: 'bruttal',
        mode: 'dark',
      });
      expect(result.selector).toBe(
        '[data-tt-theme="bruttal"][data-tt-mode="dark"]'
      );
    });

    test('custom selector overrides themeId/mode', () => {
      const result = toCssVars(defaultTheme, {
        themeId: 'bruttal',
        mode: 'dark',
        selector: '.custom-scope',
      });
      expect(result.selector).toBe('.custom-scope');
    });

    test('mode alone without themeId falls back to :root', () => {
      const result = toCssVars(defaultTheme, { mode: 'light' });
      expect(result.selector).toBe(':root');
    });
  });

  // ---------------------------------------------------------------------------
  // CSS vars output
  // ---------------------------------------------------------------------------

  describe('cssVars', () => {
    test('generates CSS vars for core tokens', () => {
      const { cssVars } = toCssVars(defaultTheme);
      expect(cssVars['--tt-color-brand-main']).toBe('#292C2a');
      expect(cssVars['--tt-color-brand-accent']).toBe('#0469E3');
    });

    test('generates CSS vars for semantic tokens with var() refs', () => {
      const { cssVars } = toCssVars(defaultTheme);
      expect(cssVars['--tt-action-primary-background-default']).toBe(
        'var(--tt-color-brand-accent)'
      );
    });

    test('reflects theme-specific values', () => {
      const { cssVars } = toCssVars(themes.bruttal);
      expect(cssVars['--tt-color-brand-main']).toBe('#0A0A0A');
    });
  });

  // ---------------------------------------------------------------------------
  // toCssString
  // ---------------------------------------------------------------------------

  describe('toCssString', () => {
    test('wraps vars in :root by default', () => {
      const css = toCssVars(defaultTheme).toCssString();
      expect(css).toMatch(/^:root \{/);
      expect(css).toMatch(/\}$/);
      expect(css).toContain('--tt-color-brand-main: #292C2a;');
    });

    test('wraps vars in themed selector', () => {
      const css = toCssVars(themes.bruttal, {
        themeId: 'bruttal',
      }).toCssString();
      expect(css).toMatch(/^\[data-tt-theme="bruttal"\] \{/);
      expect(css).toContain('--tt-color-brand-main: #0A0A0A;');
    });

    test('wraps vars in themed + mode selector', () => {
      const css = toCssVars(defaultTheme, {
        themeId: 'default',
        mode: 'light',
      }).toCssString();
      expect(css).toMatch(
        /^\[data-tt-theme="default"\]\[data-tt-mode="light"\] \{/
      );
    });

    test('includes color-scheme when specified', () => {
      const css = toCssVars(defaultTheme, {
        colorScheme: 'dark',
      }).toCssString();
      expect(css).toContain('color-scheme: dark;');
    });

    test('includes color-scheme: light dark', () => {
      const css = toCssVars(defaultTheme, {
        colorScheme: 'light dark',
      }).toCssString();
      expect(css).toContain('color-scheme: light dark;');
    });

    test('does not include color-scheme when not specified', () => {
      const css = toCssVars(defaultTheme).toCssString();
      expect(css).not.toContain('color-scheme');
    });
  });

  // ---------------------------------------------------------------------------
  // Composability — multiple themes concatenated
  // ---------------------------------------------------------------------------

  describe('composability', () => {
    test('multiple themes produce distinct CSS blocks', () => {
      const defaultCss = toCssVars(themes.default).toCssString();
      const bruttalCss = toCssVars(themes.bruttal, {
        themeId: 'bruttal',
      }).toCssString();

      const combined = `${defaultCss}\n\n${bruttalCss}`;
      expect(combined).toContain(':root {');
      expect(combined).toContain('[data-tt-theme="bruttal"]');
    });

    test('all built-in themes produce valid CSS blocks', () => {
      for (const name of Object.keys(themes) as Array<keyof typeof themes>) {
        const css = toCssVars(themes[name], { themeId: name }).toCssString();
        expect(css).toMatch(/^\[data-tt-theme=/);
        expect(css.split('\n').length).toBeGreaterThan(10);
      }
    });
  });
});
