import {
  createTheme,
  defaultTheme,
  themes,
  toTailwindTheme,
} from '../../../src';

// ---------------------------------------------------------------------------
// toTailwindTheme — CSS variables
// ---------------------------------------------------------------------------

describe('toTailwindTheme', () => {
  const tw = toTailwindTheme(defaultTheme);

  describe('cssVars', () => {
    test('generates CSS vars for core colors', () => {
      expect(tw.cssVars['--tt-color-brand-main']).toBe('#292C2a');
      expect(tw.cssVars['--tt-color-brand-accent']).toBe('#0469E3');
    });

    test('generates CSS vars for core space', () => {
      expect(tw.cssVars['--tt-space-0']).toBe('0px');
    });

    test('generates CSS vars for core radii', () => {
      expect(tw.cssVars['--tt-radii-none']).toBe('0px');
      expect(tw.cssVars['--tt-radii-md']).toBe('8px');
    });

    test('generates CSS vars for core shadows', () => {
      expect(tw.cssVars['--tt-shadow-0']).toBe('none');
    });

    test('generates CSS vars for core font families', () => {
      expect(tw.cssVars['--tt-font-sans']).toBeDefined();
      expect(tw.cssVars['--tt-font-mono']).toBeDefined();
    });

    test('generates CSS vars for core font weights', () => {
      expect(tw.cssVars['--tt-font-weight-regular']).toBe(400);
      expect(tw.cssVars['--tt-font-weight-bold']).toBe(700);
    });

    test('generates CSS vars for durations and easings', () => {
      expect(tw.cssVars['--tt-duration-xs']).toBe('50ms');
      expect(tw.cssVars['--tt-easing-standard']).toContain('cubic-bezier');
    });

    test('generates CSS vars for zIndex', () => {
      expect(tw.cssVars['--tt-z-index-modal']).toBe(40);
    });

    test('generates CSS vars for opacity', () => {
      expect(tw.cssVars['--tt-opacity-100']).toBe(1);
      expect(tw.cssVars['--tt-opacity-50']).toBe(0.5);
    });

    test('generates CSS vars for breakpoints', () => {
      expect(tw.cssVars['--tt-breakpoint-sm']).toBe('480px');
      expect(tw.cssVars['--tt-breakpoint-lg']).toBe('1024px');
    });

    test('semantic colors use var() references', () => {
      expect(tw.cssVars['--tt-action-primary-background-default']).toBe(
        'var(--tt-color-brand-accent)'
      );
    });

    test('semantic radii use var() references', () => {
      expect(tw.cssVars['--tt-radii-semantic-surface']).toBe(
        'var(--tt-radii-md)'
      );
    });

    test('semantic elevation use var() references', () => {
      expect(tw.cssVars['--tt-elevation-flat']).toBe('var(--tt-shadow-0)');
      expect(tw.cssVars['--tt-elevation-modal']).toBe('var(--tt-shadow-4)');
    });
  });

  // ---------------------------------------------------------------------------
  // Tailwind config
  // ---------------------------------------------------------------------------

  describe('config', () => {
    test('colors reference CSS vars', () => {
      expect(tw.config.colors['brand-main']).toBe('var(--tt-color-brand-main)');
      expect(tw.config.colors['brand-accent']).toBe(
        'var(--tt-color-brand-accent)'
      );
    });

    test('spacing references CSS vars', () => {
      expect(tw.config.spacing['0']).toBe('var(--tt-space-0)');
    });

    test('fontFamily references CSS vars', () => {
      expect(tw.config.fontFamily.sans).toBe('var(--tt-font-sans)');
    });

    test('borderRadius references CSS vars', () => {
      expect(tw.config.borderRadius.md).toBe('var(--tt-radii-md)');
    });

    test('screens maps breakpoints directly', () => {
      expect(tw.config.screens).toEqual(defaultTheme.core.breakpoints);
    });

    test('boxShadow references CSS vars', () => {
      expect(tw.config.boxShadow['0']).toBe('var(--tt-shadow-0)');
    });

    test('zIndex references CSS vars', () => {
      expect(tw.config.zIndex.modal).toBe('var(--tt-z-index-modal)');
    });

    test('transitionDuration references CSS vars', () => {
      expect(tw.config.transitionDuration.xs).toBe('var(--tt-duration-xs)');
    });

    test('transitionTimingFunction references CSS vars', () => {
      expect(tw.config.transitionTimingFunction.standard).toBe(
        'var(--tt-easing-standard)'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // toCssString
  // ---------------------------------------------------------------------------

  describe('toCssString', () => {
    test('produces a valid :root CSS block', () => {
      const css = tw.toCssString();
      expect(css).toMatch(/^:root \{/);
      expect(css).toMatch(/\}$/);
    });

    test('contains core CSS vars', () => {
      const css = tw.toCssString();
      expect(css).toContain('--tt-color-brand-main: #292C2a;');
      expect(css).toContain('--tt-radii-md: 8px;');
    });

    test('contains semantic CSS vars with var() references', () => {
      const css = tw.toCssString();
      expect(css).toContain('var(--tt-color-brand-accent)');
    });
  });

  // ---------------------------------------------------------------------------
  // Stability across themes
  // ---------------------------------------------------------------------------

  describe('stability across themes', () => {
    test('produces consistent config keys for all built-in themes', () => {
      const themeNames = Object.keys(themes) as Array<keyof typeof themes>;
      const configKeys = themeNames.map((name) => {
        const result = toTailwindTheme(themes[name]);
        return Object.keys(result.config).sort();
      });

      for (let i = 1; i < configKeys.length; i++) {
        expect(configKeys[i]).toEqual(configKeys[0]);
      }
    });

    test('custom theme reflects overridden values', () => {
      const custom = createTheme({
        overrides: {
          core: { colors: { brand: { main: '#FF4500' } } },
        },
      });
      const result = toTailwindTheme(custom);
      expect(result.cssVars['--tt-color-brand-main']).toBe('#FF4500');
      expect(result.cssVars['--tt-color-brand-accent']).toBe('#0469E3');
    });

    test('all built-in themes produce valid CSS', () => {
      for (const name of Object.keys(themes) as Array<keyof typeof themes>) {
        const result = toTailwindTheme(themes[name]);
        const css = result.toCssString();
        expect(css).toMatch(/^:root \{/);
        expect(css.split('\n').length).toBeGreaterThan(10);
      }
    });
  });
});
