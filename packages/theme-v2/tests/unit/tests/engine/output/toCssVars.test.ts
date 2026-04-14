import { baseBundle } from '../../../../../src/baseBundle';
import { baseTheme as defaultTheme } from '../../../../../src/baseTheme';
import { buildTheme, createTheme } from '../../../../../src/createTheme';
import { getThemeStylesContent } from '../../../../../src/css';
import {
  hasCqUnits,
  isThemeBundle,
  toCssVarName,
  toCssVars,
  toViewportFallback,
} from '../../../../../src/roots/toCssVars';

// Inline custom theme for testing theme-specific values
const customTheme = buildTheme({
  overrides: { core: { colors: { brand: { 500: '#FF2D20' } } } },
});

// ---------------------------------------------------------------------------
// toCssVarName — path → CSS custom property name
// ---------------------------------------------------------------------------

describe('toCssVarName', () => {
  test('core color paths', () => {
    expect(toCssVarName('core.colors.brand.500')).toBe(
      '--tt-core-colors-brand-500'
    );
  });

  test('core spacing paths', () => {
    expect(toCssVarName('core.spacing.2')).toBe('--tt-core-spacing-2');
  });

  test('core radii paths', () => {
    expect(toCssVarName('core.radii.md')).toBe('--tt-core-radii-md');
  });

  test('core elevation paths', () => {
    expect(toCssVarName('core.elevation.level.3')).toBe(
      '--tt-core-elevation-3'
    );
  });

  test('core font family paths', () => {
    expect(toCssVarName('core.font.family.sans')).toBe(
      '--tt-core-font-family-sans'
    );
  });

  test('semantic color paths', () => {
    expect(
      toCssVarName('semantic.colors.action.primary.background.default')
    ).toBe('--tt-colors-action-primary-background-default');
  });

  test('semantic elevation paths', () => {
    expect(toCssVarName('semantic.elevation.surface.flat')).toBe(
      '--tt-elevation-surface-flat'
    );
  });

  test('semantic radii paths', () => {
    expect(toCssVarName('semantic.radii.surface')).toBe('--tt-radii-surface');
  });

  test('falls back to full path for unknown prefixes', () => {
    expect(toCssVarName('unknown.foo.bar')).toBe('--tt-unknown-foo-bar');
  });

  // TEST-08 — CSS_PATH_PREFIXES order regression guards
  test('core.dataviz.color.* uses the more-specific core-dataviz-color prefix', () => {
    // core.dataviz.color.series.1 must match the specific 'core.dataviz.color.' entry.
    // Under the --tt-core-<family> scheme both candidate prefixes produce the same
    // CSS name, so we just assert the correct result.
    const result = toCssVarName('core.dataviz.color.series.1');
    expect(result).toBe('--tt-core-dataviz-color-series-1');
  });

  test('core.dataviz.* (non-color) uses the core dataviz prefix', () => {
    const result = toCssVarName('core.dataviz.shape.circle');
    expect(result).toBe('--tt-core-dataviz-shape-circle');
  });

  test('semantic.dataviz.* uses the public consumer prefix', () => {
    const result = toCssVarName('semantic.dataviz.color.series.1');
    expect(result).toBe('--tt-dataviz-series-1');
  });
});

// ---------------------------------------------------------------------------
// hasCqUnits
// ---------------------------------------------------------------------------

describe('hasCqUnits', () => {
  test.each([
    ['10cqi', true],
    ['10cqb', true],
    ['10cqw', true],
    ['10cqh', true],
    ['10cqmin', true],
    ['10cqmax', true],
    ['10px', false],
    ['2rem', false],
    ['50%', false],
    ['var(--tt-foo)', false],
  ])('hasCqUnits(%s) → %s', (value, expected) => {
    expect(hasCqUnits(value)).toBe(expected);
  });

  test('returns false for numbers', () => {
    expect(hasCqUnits(42)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toViewportFallback
// ---------------------------------------------------------------------------

describe('toViewportFallback', () => {
  test.each([
    ['10cqi', '10vw'],
    ['10cqb', '10vh'],
    ['10cqw', '10vw'],
    ['10cqh', '10vh'],
    ['10cqmin', '10vmin'],
    ['10cqmax', '10vmax'],
    ['calc(10cqi + 2cqb)', 'calc(10vw + 2vh)'],
  ])('toViewportFallback(%s) → %s', (value, expected) => {
    expect(toViewportFallback(value)).toBe(expected);
  });
});

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

    test('mode alone without themeId scopes to :root with mode qualifier', () => {
      const result = toCssVars(defaultTheme, { mode: 'light' });
      expect(result.selector).toBe(':root[data-tt-mode="light"]');
    });

    test('no themeId and no mode defaults to :root', () => {
      const result = toCssVars(defaultTheme);
      expect(result.selector).toBe(':root');
    });
  });

  // ---------------------------------------------------------------------------
  // CSS vars output
  // ---------------------------------------------------------------------------

  describe('cssVars', () => {
    test('generates CSS vars for core tokens', () => {
      const { cssVars } = toCssVars(defaultTheme);
      expect(cssVars['--tt-core-colors-brand-500']).toBe(
        defaultTheme.core.colors.brand[500]
      );
    });

    test('generates CSS vars for semantic tokens with var() refs', () => {
      const { cssVars } = toCssVars(defaultTheme);
      expect(cssVars['--tt-colors-action-primary-background-default']).toBe(
        'var(--tt-core-colors-neutral-1000)'
      );
    });

    test('reflects theme-specific values', () => {
      const { cssVars } = toCssVars(customTheme);
      expect(cssVars['--tt-core-colors-brand-500']).toBe('#FF2D20');
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
      expect(css).toContain(
        `--tt-core-colors-brand-500: ${defaultTheme.core.colors.brand[500]};`
      );
    });

    test('wraps vars in themed selector', () => {
      const css = toCssVars(customTheme, {
        themeId: 'custom',
      }).toCssString();
      expect(css).toMatch(/^\[data-tt-theme="custom"\] \{/);
      expect(css).toContain(
        `--tt-core-colors-brand-500: ${customTheme.core.colors.brand[500]};`
      );
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

    test('infers color-scheme from mode when colorScheme is omitted', () => {
      const css = toCssVars(defaultTheme, {
        themeId: 'default',
        mode: 'dark',
      }).toCssString();

      expect(css).toContain('color-scheme: dark;');
    });

    test('explicit colorScheme overrides inferred mode value', () => {
      const css = toCssVars(defaultTheme, {
        themeId: 'default',
        mode: 'dark',
        colorScheme: 'light dark',
      }).toCssString();

      expect(css).toContain('color-scheme: light dark;');
      expect(css).not.toContain('color-scheme: dark;');
    });

    test('does not include color-scheme when not specified', () => {
      const css = toCssVars(defaultTheme).toCssString();
      expect(css).not.toContain('color-scheme');
    });
  });

  // ---------------------------------------------------------------------------
  // coarseHitVars — pointer modality overrides
  // ---------------------------------------------------------------------------

  describe('coarseHitVars', () => {
    test('all coarseHitVars are raw CSS values (not var() references)', () => {
      const { coarseHitVars } = toCssVars(defaultTheme);
      expect(Object.keys(coarseHitVars).length).toBeGreaterThan(0);
      for (const value of Object.values(coarseHitVars)) {
        expect(typeof value).toBe('string');
        expect(value as string).not.toMatch(/^var\(/);
      }
    });

    test('fine-pointer baseline is a var() ref; coarse override is a raw value', () => {
      const { cssVars, coarseHitVars } = toCssVars(defaultTheme);
      // fine pointer: semantic var resolves to a var() reference (not a raw value)
      expect(cssVars['--tt-sizing-hit-base']).toMatch(/^var\(/);
      // coarse override: raw value (not a var() reference)
      expect(coarseHitVars['--tt-sizing-hit-base']).not.toMatch(/^var\(/);
      expect(typeof coarseHitVars['--tt-sizing-hit-base']).toBe('string');
    });

    test('toCssString includes @media (any-pointer: coarse) block', () => {
      const css = toCssVars(defaultTheme).toCssString();
      expect(css).toContain('@media (any-pointer: coarse)');
      // The block must contain at least one non-var token declaration
      const coarseBlock = css.slice(
        css.indexOf('@media (any-pointer: coarse)')
      );
      expect(coarseBlock).toMatch(/--tt-sizing-hit-base: [^v]/);
    });

    test('coarse block uses correct selector in themed output', () => {
      const css = toCssVars(defaultTheme, { themeId: 'default' }).toCssString();
      expect(css).toContain(
        '@media (any-pointer: coarse) {\n  [data-tt-theme="default"]'
      );
    });
  });

  describe('composability', () => {
    test('multiple themes produce distinct CSS blocks', () => {
      const defaultCss = toCssVars(baseBundle.base).toCssString();
      const themeCss = toCssVars(customTheme, {
        themeId: 'custom',
      }).toCssString();

      const combined = `${defaultCss}\n\n${themeCss}`;
      expect(combined).toContain(':root {');
      expect(combined).toContain('[data-tt-theme="custom"]');
    });

    test('all built-in themes produce valid CSS blocks', () => {
      {
        const name = 'default';
        const css = toCssVars(baseBundle.base, { themeId: name }).toCssString();
        expect(css).toMatch(/^\[data-tt-theme=/);
        expect(css.split('\n').length).toBeGreaterThan(10);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// isThemeBundle
// ---------------------------------------------------------------------------

describe('isThemeBundle', () => {
  test('returns true for a ThemeBundle', () => {
    expect(isThemeBundle(baseBundle)).toBe(true);
  });

  test('returns false for a plain ThemeTokens', () => {
    expect(isThemeBundle(defaultTheme)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toCssVars (bundle overload)
// ---------------------------------------------------------------------------

describe('toCssVars (bundle overload)', () => {
  describe('without themeId (:root canonical model)', () => {
    test('base selector is :root when themeId is omitted', () => {
      const result = toCssVars(baseBundle);
      expect(result.base.selector).toBe(':root');
    });

    test('alternate selector is :root[data-tt-mode] when themeId is omitted', () => {
      const result = toCssVars(baseBundle);
      expect(result.alternate!.selector).toBe(':root[data-tt-mode="dark"]');
    });

    test('toCssString targets :root without themeId', () => {
      const css = toCssVars(baseBundle).toCssString();
      expect(css).toContain(':root {');
      expect(css).toContain(':root[data-tt-mode="dark"]');
      expect(css).not.toContain('[data-tt-theme');
    });
  });

  describe('base result', () => {
    test('generates scoped selector with themeId', () => {
      const result = toCssVars(baseBundle, {
        themeId: 'default',
      });
      expect(result.base.selector).toBe('[data-tt-theme="default"]');
    });

    test('base cssVars contain all core+semantic vars', () => {
      const result = toCssVars(baseBundle, {
        themeId: 'default',
      });
      expect(result.base.cssVars['--tt-core-colors-brand-500']).toBe(
        baseBundle.base.core.colors.brand[500]
      );
      expect(
        result.base.cssVars['--tt-colors-action-primary-background-default']
      ).toBeDefined();
    });

    test('base toCssString includes color-scheme for baseMode', () => {
      const css = toCssVars(baseBundle, {
        themeId: 'default',
      }).base.toCssString();
      expect(css).toContain('color-scheme: light;');
    });
  });

  describe('alternate result', () => {
    test('returns alternate for bundles with dark alternate', () => {
      const result = toCssVars(baseBundle, {
        themeId: 'default',
      });
      expect(result.alternate).toBeDefined();
    });

    test('alternate selector includes opposite mode', () => {
      const result = toCssVars(baseBundle, {
        themeId: 'default',
      });
      expect(result.alternate!.selector).toBe(
        '[data-tt-theme="default"][data-tt-mode="dark"]'
      );
    });

    test('alternate has fewer vars than base (diff-only)', () => {
      const result = toCssVars(baseBundle, {
        themeId: 'default',
      });
      const baseCount = Object.keys(result.base.cssVars).length;
      const altCount = Object.keys(result.alternate!.cssVars).length;
      expect(altCount).toBeLessThan(baseCount);
      expect(altCount).toBeGreaterThan(0);
    });

    test('alternate contains semantic dark overrides (not core mutations)', () => {
      const result = toCssVars(baseBundle, {
        themeId: 'default',
      });
      const altVars = result.alternate!.cssVars;
      // Core vars must NOT appear in alternate (core is immutable)
      expect(altVars['--tt-core-colors-neutral-0']).toBeUndefined();
      // Semantic vars are remapped in dark mode
      expect(altVars['--tt-colors-content-primary-background-default']).toBe(
        'var(--tt-core-colors-neutral-900)'
      );
    });

    test('alternate toCssString includes color-scheme opposite', () => {
      const css = toCssVars(baseBundle, {
        themeId: 'default',
      }).alternate!.toCssString();
      expect(css).toContain('color-scheme: dark;');
    });
  });

  describe('single-mode bundle (dark-only)', () => {
    // Create an inline single-mode (dark-only) bundle for testing
    const darkOnlyBundle = createTheme({ baseMode: 'dark', alternate: null });

    test('single-mode bundle has no alternate', () => {
      const result = toCssVars(darkOnlyBundle, { themeId: 'dark-only' });
      expect(result.alternate).toBeUndefined();
    });

    test('dark-only base has dark color-scheme', () => {
      const css = toCssVars(darkOnlyBundle, {
        themeId: 'dark-only',
      }).base.toCssString();
      expect(css).toContain('color-scheme: dark;');
    });

    test('dark-only toCssString produces only base block', () => {
      const result = toCssVars(darkOnlyBundle, { themeId: 'dark-only' });
      const css = result.toCssString();
      expect(css).not.toContain('data-tt-mode');
    });
  });

  describe('combined toCssString', () => {
    test('produces base + alternate blocks for light-base bundle', () => {
      const css = toCssVars(baseBundle, {
        themeId: 'default',
      }).toCssString();
      expect(css).toContain('[data-tt-theme="default"]');
      expect(css).toContain('[data-tt-theme="default"][data-tt-mode="dark"]');
    });

    test('all light-base bundles produce proper CSS', () => {
      {
        const name = 'default';
        const bundle = baseBundle;
        if (bundle.alternate) {
          const css = toCssVars(bundle, {
            themeId: name,
          }).toCssString();
          expect(css).toContain(`[data-tt-theme="${name}"]`);
          expect(css).toContain(`[data-tt-mode="dark"]`);
        }
      }
    });

    test('alternate toCssString does not include coarse pointer block (diff-only)', () => {
      const result = toCssVars(baseBundle, {
        themeId: 'default',
      });
      const altCss = result.alternate!.toCssString();
      // alternate is diff-only — coarse hit vars are core-sourced (immutable)
      // and therefore never differ between modes.
      expect(altCss).not.toContain('@media (any-pointer: coarse)');
      expect(altCss).toContain(
        '[data-tt-theme="default"][data-tt-mode="dark"]'
      );
    });

    test('combined toCssString emits coarse block once (base covers all modes)', () => {
      const css = toCssVars(baseBundle, {
        themeId: 'default',
      }).toCssString();
      // core is immutable in ModeOverride — coarse hit targets cannot differ
      // between base and alternate, so the combined output has exactly one block.
      const coarseMatches = css.match(/@media \(any-pointer: coarse\)/g);
      expect(coarseMatches).not.toBeNull();
      expect(coarseMatches!.length).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// themeId sanitization
// ---------------------------------------------------------------------------

describe('themeId sanitization', () => {
  test('rejects themeId with CSS injection characters', () => {
    expect(() => {
      toCssVars(defaultTheme, { themeId: '"] { } body { color: red } [' });
    }).toThrow(/Invalid themeId/);
  });

  test('rejects themeId with quotes', () => {
    expect(() => {
      toCssVars(defaultTheme, { themeId: 'foo"bar' });
    }).toThrow(/Invalid themeId/);
  });

  test('rejects themeId with spaces', () => {
    expect(() => {
      toCssVars(defaultTheme, { themeId: 'foo bar' });
    }).toThrow(/Invalid themeId/);
  });

  test('accepts valid themeId with hyphens and underscores', () => {
    expect(() => {
      toCssVars(defaultTheme, { themeId: 'my-theme_v2' });
    }).not.toThrow();
  });

  test('accepts simple alphanumeric themeId', () => {
    const result = toCssVars(defaultTheme, { themeId: 'bruttal' });
    expect(result.selector).toBe('[data-tt-theme="bruttal"]');
  });
});

// ---------------------------------------------------------------------------
// Reduced-motion overrides (Phase 7.1)
// ---------------------------------------------------------------------------

describe('reducedMotionVars', () => {
  test('all semantic motion durations set to core.motion.duration.none', () => {
    const { reducedMotionVars } = toCssVars(defaultTheme);
    const noneRef = `var(${toCssVarName('core.motion.duration.none')})`;

    // All duration overrides should reference the same none token
    expect(Object.keys(reducedMotionVars).length).toBeGreaterThan(0);
    for (const value of Object.values(reducedMotionVars)) {
      expect(value).toBe(noneRef);
    }
  });

  test('toCssString includes @media (prefers-reduced-motion: reduce) block', () => {
    const css = toCssVars(defaultTheme).toCssString();
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    // The block must set duration tokens to the none reference
    const noneVarName = `var(${toCssVarName('core.motion.duration.none')})`;
    expect(css).toContain(noneVarName);
  });

  test('reduced-motion block uses correct selector in themed output', () => {
    const css = toCssVars(defaultTheme, { themeId: 'default' }).toCssString();
    expect(css).toContain(
      '@media (prefers-reduced-motion: reduce) {\n  [data-tt-theme="default"]'
    );
  });

  test('toCssVars (bundle) alternate does not include reduced-motion block when motion is not overridden', () => {
    const result = toCssVars(baseBundle, { themeId: 'default' });
    const altCss = result.alternate!.toCssString();

    // darkAlternate does not override semantic.motion — reduced-motion diff is
    // empty, so the block is correctly absent from the alternate standalone output.
    expect(altCss).not.toContain('@media (prefers-reduced-motion: reduce)');
    expect(altCss).toContain('[data-tt-theme="default"][data-tt-mode="dark"]');
  });

  test('toCssVars (bundle) combined emits reduced-motion block once when motion is not overridden', () => {
    const css = toCssVars(baseBundle, {
      themeId: 'default',
    }).toCssString();

    // darkAlternate does not override semantic.motion — the diff is empty,
    // so the combined output has exactly one reduced-motion block (from base).
    const reducedMotionMatches = css.match(
      /@media \(prefers-reduced-motion: reduce\)/g
    );
    expect(reducedMotionMatches).not.toBeNull();
    expect(reducedMotionMatches!.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// No broken references (Phase 7.1)
// ---------------------------------------------------------------------------

describe('reference integrity', () => {
  test('no undefined var references in default theme output', () => {
    const { cssVars } = toCssVars(defaultTheme);

    for (const [_key, value] of Object.entries(cssVars)) {
      if (typeof value === 'string' && value.includes('var(')) {
        // Extract var name from var(--tt-something)
        const matches = value.match(/var\(([^)]+)\)/g);
        if (matches) {
          for (const varRef of matches) {
            const varName = varRef.replace(/var\(([^)]+)\)/, '$1');
            // Var reference should exist in cssVars
            expect(cssVars[varName]).toBeDefined();
          }
        }
      }
    }
  });

  test('no "undefined" in any CSS var values', () => {
    {
      const { cssVars } = toCssVars(baseBundle.base);

      for (const [_key, value] of Object.entries(cssVars)) {
        expect(String(value)).not.toContain('undefined');
        expect(String(value)).not.toMatch(/var\(--tt-undefined-/);
      }
    }
  });

  test('toCssVars (bundle) alternate has no broken references', () => {
    {
      const name = 'default';
      const result = toCssVars(baseBundle, { themeId: name });

      if (result.alternate) {
        const { cssVars } = result.alternate;
        const baseCssVars = result.base.cssVars;

        const brokenRefs: string[] = [];
        for (const [key, value] of Object.entries(cssVars)) {
          if (typeof value === 'string' && value.includes('var(')) {
            const matches = value.match(/var\(([^)]+)\)/g);
            if (matches) {
              for (const varRef of matches) {
                const varName = varRef.replace(/var\(([^)]+)\)/, '$1');
                // Alternate can reference vars from base (core tokens)
                if (!cssVars[varName] && !baseCssVars[varName]) {
                  brokenRefs.push(`${key} → ${varName}`);
                }
              }
            }
          }
        }

        expect(brokenRefs).toEqual([]);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getThemeStylesContent
// ---------------------------------------------------------------------------

describe('getThemeStylesContent', () => {
  test('returns a non-empty string', () => {
    const css = getThemeStylesContent(baseBundle, 'default');
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  test('output matches toCssVars().toCssString() for the same bundle', () => {
    const expected = toCssVars(baseBundle, {
      themeId: 'default',
    }).toCssString();
    expect(getThemeStylesContent(baseBundle, 'default')).toBe(expected);
  });

  test('scopes output to the given themeId', () => {
    const customBundle = createTheme({
      overrides: { core: { colors: { brand: { 500: '#7C4DFF' } } } },
    });
    const css = getThemeStylesContent(customBundle, 'custom');
    expect(css).toContain('[data-tt-theme="custom"]');
    expect(css).not.toContain('[data-tt-theme="default"]');
  });

  test('single-mode bundle has no alternate mode block', () => {
    const darkOnlyBundle = createTheme({ baseMode: 'dark', alternate: null });
    const css = getThemeStylesContent(darkOnlyBundle, 'dark-only');
    expect(css).not.toContain('data-tt-mode');
  });

  test('rejects themeId with injection characters', () => {
    expect(() => {
      getThemeStylesContent(baseBundle, '"] { } body { color: red } [');
    }).toThrow(/Invalid themeId/);
  });

  test('targets :root when themeId is omitted', () => {
    const css = getThemeStylesContent(baseBundle);
    expect(css).toContain(':root {');
    expect(css).toContain(':root[data-tt-mode="dark"]');
    expect(css).not.toContain('[data-tt-theme');
  });

  test('output without themeId matches toCssVars(bundle).toCssString()', () => {
    const expected = toCssVars(baseBundle).toCssString();
    expect(getThemeStylesContent(baseBundle)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Container query progressive enhancement (Gap 1)
// ---------------------------------------------------------------------------

describe('hasCqUnits', () => {
  test('detects cqi', () => {
    expect(hasCqUnits('clamp(12px, calc(0.6cqi + 10px), 14px)')).toBe(true);
  });

  test('detects cqb', () => {
    expect(hasCqUnits('10cqb')).toBe(true);
  });

  test('detects cqw/cqh', () => {
    expect(hasCqUnits('10cqw')).toBe(true);
    expect(hasCqUnits('10cqh')).toBe(true);
  });

  test('detects cqmin/cqmax', () => {
    expect(hasCqUnits('10cqmin')).toBe(true);
    expect(hasCqUnits('10cqmax')).toBe(true);
  });

  test('returns false for non-CQ values', () => {
    expect(hasCqUnits('#0469E3')).toBe(false);
    expect(hasCqUnits('16px')).toBe(false);
    expect(hasCqUnits('1rem')).toBe(false);
    expect(hasCqUnits(400)).toBe(false);
  });
});

describe('toViewportFallback', () => {
  test('replaces cqi with vw', () => {
    expect(toViewportFallback('clamp(12px, calc(0.6cqi + 10px), 14px)')).toBe(
      'clamp(12px, calc(0.6vw + 10px), 14px)'
    );
  });

  test('replaces cqb with vh', () => {
    expect(toViewportFallback('10cqb')).toBe('10vh');
  });

  test('replaces cqw with vw', () => {
    expect(toViewportFallback('10cqw')).toBe('10vw');
  });

  test('replaces cqh with vh', () => {
    expect(toViewportFallback('10cqh')).toBe('10vh');
  });

  test('replaces cqmin/cqmax', () => {
    expect(toViewportFallback('10cqmin')).toBe('10vmin');
    expect(toViewportFallback('10cqmax')).toBe('10vmax');
  });

  test('leaves non-CQ values unchanged', () => {
    expect(toViewportFallback('16px')).toBe('16px');
    expect(toViewportFallback('100dvh')).toBe('100dvh');
  });
});

describe('containerQueryVars', () => {
  test('extracts CQ vars from default theme', () => {
    const { containerQueryVars } = toCssVars(defaultTheme);
    expect(Object.keys(containerQueryVars).length).toBeGreaterThan(0);
  });

  test('all extracted vars contain CQ units', () => {
    const { containerQueryVars } = toCssVars(defaultTheme);
    for (const value of Object.values(containerQueryVars)) {
      expect(hasCqUnits(value)).toBe(true);
    }
  });

  test('includes font scale vars', () => {
    const { containerQueryVars } = toCssVars(defaultTheme);
    expect(containerQueryVars['--tt-core-font-scale-text-1']).toBeDefined();
    expect(containerQueryVars['--tt-core-font-scale-display-1']).toBeDefined();
  });

  test('includes space unit var', () => {
    const { containerQueryVars } = toCssVars(defaultTheme);
    expect(containerQueryVars['--tt-core-spacing-engine-unit']).toBeDefined();
  });

  test('includes size ramp ui vars', () => {
    const { containerQueryVars } = toCssVars(defaultTheme);
    expect(containerQueryVars['--tt-core-sizing-ramp-ui-1']).toBeDefined();
  });

  test('includes size ramp layout vars', () => {
    const { containerQueryVars } = toCssVars(defaultTheme);
    expect(containerQueryVars['--tt-core-sizing-ramp-layout-1']).toBeDefined();
  });

  test('does not include non-CQ vars', () => {
    const { containerQueryVars } = toCssVars(defaultTheme);
    expect(containerQueryVars['--tt-core-colors-brand-500']).toBeUndefined();
    expect(containerQueryVars['--tt-core-radii-md']).toBeUndefined();
  });
});

describe('@supports (width: 1cqi) block', () => {
  test('toCssString includes @supports block', () => {
    const css = toCssVars(defaultTheme).toCssString();
    expect(css).toContain('@supports (width: 1cqi)');
  });

  test('@supports block contains original CQ values', () => {
    const css = toCssVars(defaultTheme).toCssString();
    // The @supports block should have the original cqi values
    const supportsMatch = css.match(/@supports \(width: 1cqi\) \{[\s\S]*?\n\}/);
    expect(supportsMatch).not.toBeNull();
    expect(supportsMatch![0]).toContain('cqi');
  });

  test('base block uses viewport fallbacks for CQ vars', () => {
    const css = toCssVars(defaultTheme).toCssString();
    // Split at @supports to get just the base block
    const baseBlock = css.split('@supports')[0];
    // The base block should contain vw (fallback) but NOT cqi
    expect(baseBlock).toContain('vw');
    expect(baseBlock).not.toMatch(/\bcqi\b/);
  });

  test('@supports block uses correct selector in themed output', () => {
    const css = toCssVars(defaultTheme, { themeId: 'default' }).toCssString();
    expect(css).toContain(
      '@supports (width: 1cqi) {\n  [data-tt-theme="default"]'
    );
  });

  test('toCssVars (bundle) base includes @supports block', () => {
    const css = toCssVars(baseBundle, {
      themeId: 'default',
    }).base.toCssString();
    expect(css).toContain('@supports (width: 1cqi)');
  });

  test('toCssVars (bundle) combined includes @supports blocks', () => {
    const css = toCssVars(baseBundle, {
      themeId: 'default',
    }).toCssString();
    const supportsMatches = css.match(/@supports \(width: 1cqi\)/g);
    expect(supportsMatches).not.toBeNull();
    // At least one @supports block for the base
    expect(supportsMatches!.length).toBeGreaterThanOrEqual(1);
  });

  test('all themes produce @supports block', () => {
    {
      const name = 'default';
      const css = toCssVars(baseBundle.base, { themeId: name }).toCssString();
      expect(css).toContain('@supports (width: 1cqi)');
    }
  });
});

// ---------------------------------------------------------------------------
// Spacing responsive engine — CSS output validation
//
// @see spacing.md — Validation > Error #17, Error #18
// Error #17: generated output does not emit a viewport-safe fallback before
//            container-based overrides.
// Error #18: generated output does not gate container-based overrides behind
//            @supports (width: 1cqi).
//
// These tests inspect the CSS string produced by getThemeStylesContent() to
// verify both structural contracts for core.space.unit, which is the single
// responsive engine for the entire spacing system.
// ---------------------------------------------------------------------------

describe('spacing responsive engine — CSS output (Error #17 / Error #18)', () => {
  const SPACE_UNIT_VAR = '--tt-core-spacing-engine-unit';

  test('Error #17: --tt-core-spacing-unit emits viewport-safe fallback in the base block', () => {
    // Error #17: generated output does not emit a viewport-safe fallback
    // before container-based overrides.
    const css = getThemeStylesContent(baseBundle);

    // The base :root block ends just before the first @supports
    const baseBlock = css.split('@supports')[0];

    // Must contain the vw-based fallback (cqi → vw via toViewportFallback)
    expect(baseBlock).toContain(`${SPACE_UNIT_VAR}:`);
    expect(baseBlock).toMatch(new RegExp(`${SPACE_UNIT_VAR}:[^;]*vw`));
    // Must NOT contain cqi in the base block — CQ override lives in @supports only
    expect(baseBlock).not.toMatch(/\bcqi\b/);
  });

  test('Error #18: --tt-core-spacing-unit CQ override is gated behind @supports (width: 1cqi)', () => {
    // Error #18: generated output does not gate container-based overrides
    // behind @supports (width: 1cqi).
    const css = getThemeStylesContent(baseBundle);

    // Locate the @supports block
    const supportsIdx = css.indexOf('@supports (width: 1cqi)');
    expect(supportsIdx).toBeGreaterThan(-1);

    // The @supports block must contain --tt-space-unit with a cqi value
    const supportsBlock = css.slice(supportsIdx);
    expect(supportsBlock).toMatch(new RegExp(`${SPACE_UNIT_VAR}:[^;]*cqi`));
  });

  test('viewport fallback appears before the @supports block in source order', () => {
    // Asserts Error #17 and #18 together: fallback must precede the CQ override.
    const css = getThemeStylesContent(baseBundle);

    const fallbackIdx = css.indexOf(`${SPACE_UNIT_VAR}:`);
    const supportsIdx = css.indexOf('@supports (width: 1cqi)');

    expect(fallbackIdx).toBeGreaterThan(-1);
    expect(supportsIdx).toBeGreaterThan(-1);
    expect(fallbackIdx).toBeLessThan(supportsIdx);
  });
});
