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
import { TOKEN_PATH_REGISTRY } from '../../../../../src/roots/tokenRegistry';

// Inline custom theme for testing theme-specific values
const customTheme = buildTheme({
  overrides: { core: { colors: { brand: { 500: '#FF2D20' } } } },
});

// ---------------------------------------------------------------------------
// toCssVarName — path → CSS custom property name
// ---------------------------------------------------------------------------

describe('toCssVarName', () => {
  test('applies every registered prefix: strips source prefix, attaches CSS prefix, converts dots to hyphens', () => {
    // Derives expected values from TOKEN_PATH_REGISTRY — scales automatically
    // when entries are added or removed without requiring manual test updates.
    for (const { path, cssPrefix } of TOKEN_PATH_REGISTRY) {
      expect(toCssVarName(`${path}foo.bar`)).toBe(`${cssPrefix}foo-bar`);
    }
  });

  test('prefix ordering: longer match wins (semantic.dataviz.color.* beats semantic.dataviz.*)', () => {
    // semantic.dataviz.color. → --tt-dataviz- (strips "color" from path)
    // if semantic.dataviz. matched first → --tt-dataviz-color-series-1 (wrong)
    expect(toCssVarName('semantic.dataviz.color.series.1')).toBe(
      '--tt-dataviz-series-1'
    );
  });

  test('falls back to --tt-<path-with-hyphens> for unregistered paths', () => {
    expect(toCssVarName('unknown.foo.bar')).toBe('--tt-unknown-foo-bar');
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
    ['clamp(12px, calc(0.6cqi + 10px), 14px)', true],
    ['10px', false],
    ['2rem', false],
    ['50%', false],
    ['var(--tt-foo)', false],
    ['#0469E3', false],
  ])('hasCqUnits(%s) → %s', (value, expected) => {
    expect(hasCqUnits(value)).toBe(expected);
  });

  test('returns false for numbers', () => {
    expect(hasCqUnits(42)).toBe(false);
    expect(hasCqUnits(400)).toBe(false);
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
    [
      'clamp(12px, calc(0.6cqi + 10px), 14px)',
      'clamp(12px, calc(0.6vw + 10px), 14px)',
    ],
    ['16px', '16px'],
    ['100dvh', '100dvh'],
  ])('toViewportFallback(%s) → %s', (value, expected) => {
    expect(toViewportFallback(value)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Selector generation
// ---------------------------------------------------------------------------

describe('toCssVars', () => {
  describe('selector', () => {
    test.each([
      [{}, ':root'],
      [{ themeId: 'bruttal' }, '[data-tt-theme="bruttal"]'],
      [
        { themeId: 'bruttal', mode: 'dark' },
        '[data-tt-theme="bruttal"][data-tt-mode="dark"]',
      ],
      [
        { themeId: 'bruttal', mode: 'dark', selector: '.custom-scope' },
        '.custom-scope',
      ],
      [{ mode: 'light' }, ':root[data-tt-mode="light"]'],
    ] as const)('options %j → selector %s', (options, expected) => {
      expect(toCssVars(defaultTheme, options).selector).toBe(expected);
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

    test.each([
      [{ colorScheme: 'dark' as const }, 'color-scheme: dark;', undefined],
      [
        { colorScheme: 'light dark' as const },
        'color-scheme: light dark;',
        undefined,
      ],
      [
        { themeId: 'default', mode: 'dark' as const },
        'color-scheme: dark;',
        undefined,
      ],
      [
        {
          themeId: 'default',
          mode: 'dark' as const,
          colorScheme: 'light dark' as const,
        },
        'color-scheme: light dark;',
        'color-scheme: dark;',
      ],
    ] as const)('color-scheme with options %j', (options, expected, absent) => {
      const css = toCssVars(defaultTheme, options).toCssString();
      expect(css).toContain(expected);
      if (absent) expect(css).not.toContain(absent);
    });

    test('no color-scheme when not specified', () => {
      expect(toCssVars(defaultTheme).toCssString()).not.toContain(
        'color-scheme'
      );
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
      expect(
        altVars['--tt-colors-informational-primary-background-default']
      ).toBe('var(--tt-core-colors-neutral-900)');
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
  test.each(['"] { } body { color: red } [', 'foo"bar', 'foo bar'])(
    'rejects invalid themeId: %s',
    (themeId) => {
      expect(() => {
        return toCssVars(defaultTheme, { themeId });
      }).toThrow(/Invalid themeId/);
    }
  );

  test('accepts valid themeId (hyphens, underscores, alphanumeric)', () => {
    expect(() => {
      return toCssVars(defaultTheme, { themeId: 'my-theme_v2' });
    }).not.toThrow();
    expect(toCssVars(defaultTheme, { themeId: 'bruttal' }).selector).toBe(
      '[data-tt-theme="bruttal"]'
    );
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
  /** Asserts no var() reference in `cssVars` points to an absent property. */
  const assertNobrokenRefs = (
    cssVars: Record<string, string | number>,
    additionalVars: Record<string, string | number> = {}
  ) => {
    const broken: string[] = [];
    for (const [key, value] of Object.entries(cssVars)) {
      if (typeof value !== 'string' || !value.includes('var(')) continue;
      for (const varRef of value.match(/var\(([^)]+)\)/g) ?? []) {
        const varName = varRef.slice(4, -1); // 'var(--tt-foo)' → '--tt-foo'
        if (!(varName in cssVars) && !(varName in additionalVars)) {
          broken.push(`${key} → ${varName}`);
        }
      }
    }
    expect(broken).toEqual([]);
  };

  test('no broken var() references in base or alternate output', () => {
    // Base: every var() ref in default theme cssVars must resolve within the same map
    assertNobrokenRefs(toCssVars(defaultTheme).cssVars);
    // Alternate: refs may point to base core vars — pass base as additional context
    const result = toCssVars(baseBundle, { themeId: 'default' });
    if (result.alternate) {
      assertNobrokenRefs(result.alternate.cssVars, result.base.cssVars);
    }
  });

  test('no "undefined" literal in any CSS var value', () => {
    for (const value of Object.values(toCssVars(baseBundle.base).cssVars)) {
      expect(String(value)).not.toContain('undefined');
      expect(String(value)).not.toMatch(/var\(--tt-undefined-/);
    }
  });
});

// ---------------------------------------------------------------------------
// getThemeStylesContent
// ---------------------------------------------------------------------------

describe('getThemeStylesContent', () => {
  test('delegates to toCssVars(bundle, { themeId }).toCssString()', () => {
    const expected = toCssVars(baseBundle, {
      themeId: 'default',
    }).toCssString();
    expect(getThemeStylesContent(baseBundle, 'default')).toBe(expected);
  });

  test('without themeId delegates to toCssVars(bundle).toCssString() targeting :root', () => {
    const expected = toCssVars(baseBundle).toCssString();
    const result = getThemeStylesContent(baseBundle);
    expect(result).toBe(expected);
    expect(result).toContain(':root {');
    expect(result).not.toContain('[data-tt-theme');
  });

  test('single-mode bundle produces no mode selector', () => {
    const darkOnly = createTheme({ baseMode: 'dark', alternate: null });
    expect(getThemeStylesContent(darkOnly, 'dark-only')).not.toContain(
      'data-tt-mode'
    );
  });

  test('rejects themeId with injection characters', () => {
    expect(() => {
      getThemeStylesContent(baseBundle, '"] { } body { color: red } [');
    }).toThrow(/Invalid themeId/);
  });
});

// ---------------------------------------------------------------------------
// Container query progressive enhancement (Gap 1)
// ---------------------------------------------------------------------------

describe('containerQueryVars', () => {
  const { containerQueryVars } = toCssVars(defaultTheme);

  test('contains only CQ-unit vars and includes known responsive tokens', () => {
    expect(Object.keys(containerQueryVars).length).toBeGreaterThan(0);
    // Every extracted var must carry a CQ unit — non-CQ vars must not appear here
    for (const value of Object.values(containerQueryVars)) {
      expect(hasCqUnits(value)).toBe(true);
    }
    // Representative known responsive tokens — guards against accidental removal
    for (const varName of [
      '--tt-core-font-scale-text-1',
      '--tt-core-font-scale-display-1',
      '--tt-core-spacing-engine-unit',
      '--tt-core-sizing-ramp-ui-1',
      '--tt-core-sizing-ramp-layout-1',
    ]) {
      expect(containerQueryVars[varName]).toBeDefined();
    }
  });

  test('excludes non-CQ vars', () => {
    expect(containerQueryVars['--tt-core-colors-brand-500']).toBeUndefined();
    expect(containerQueryVars['--tt-core-radii-md']).toBeUndefined();
  });
});

describe('@supports (width: 1cqi) block', () => {
  test('base block uses viewport fallbacks; @supports block carries original CQ values', () => {
    const css = toCssVars(defaultTheme).toCssString();
    // @supports block is present and contains cqi values
    expect(css).toContain('@supports (width: 1cqi)');
    const supportsBlock = css.match(
      /@supports \(width: 1cqi\) \{[\s\S]*?\n\}/
    )!;
    expect(supportsBlock).not.toBeNull();
    expect(supportsBlock[0]).toContain('cqi');
    // Base block (before first @supports) must use viewport fallbacks, not cqi
    const baseBlock = css.split('@supports')[0];
    expect(baseBlock).toContain('vw');
    expect(baseBlock).not.toMatch(/\bcqi\b/);
  });

  test('@supports block uses correct selector in themed output', () => {
    const css = toCssVars(defaultTheme, { themeId: 'default' }).toCssString();
    expect(css).toContain(
      '@supports (width: 1cqi) {\n  [data-tt-theme="default"]'
    );
  });

  test('bundle emits @supports block in base and combined output', () => {
    const bundleResult = toCssVars(baseBundle, { themeId: 'default' });
    expect(bundleResult.base.toCssString()).toContain(
      '@supports (width: 1cqi)'
    );
    const supportsMatches = bundleResult
      .toCssString()
      .match(/@supports \(width: 1cqi\)/g);
    expect(supportsMatches).not.toBeNull();
    expect(supportsMatches!.length).toBeGreaterThanOrEqual(1);
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
