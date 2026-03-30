import {
  bundles,
  bundleToCssVars,
  defaultTheme,
  themes,
  toCssVars,
} from '../../../../src';
import {
  hasCqUnits,
  isThemeBundle,
  toCssVarName,
  toViewportFallback,
} from '../../../../src/roots/toCssVars';

// ---------------------------------------------------------------------------
// toCssVarName — path → CSS custom property name
// ---------------------------------------------------------------------------

describe('toCssVarName', () => {
  test('core color paths', () => {
    expect(toCssVarName('core.colors.brand.500')).toBe('--tt-color-brand-500');
  });

  test('core space paths', () => {
    expect(toCssVarName('core.space.2')).toBe('--tt-space-2');
  });

  test('core radii paths', () => {
    expect(toCssVarName('core.radii.md')).toBe('--tt-radii-md');
  });

  test('core shadow paths', () => {
    expect(toCssVarName('core.elevation.level.3')).toBe('--tt-shadow-3');
  });

  test('core font family paths', () => {
    expect(toCssVarName('core.font.family.sans')).toBe('--tt-font-sans');
  });

  test('semantic color paths', () => {
    expect(
      toCssVarName('semantic.colors.action.primary.background.default')
    ).toBe('--tt-action-primary-background-default');
  });

  test('semantic elevation paths', () => {
    expect(toCssVarName('semantic.elevation.surface.flat')).toBe(
      '--tt-elevation-surface-flat'
    );
  });

  test('semantic radii scoped to avoid collision', () => {
    expect(toCssVarName('semantic.radii.surface')).toBe(
      '--tt-radii-semantic-surface'
    );
  });

  test('falls back to full path for unknown prefixes', () => {
    expect(toCssVarName('unknown.foo.bar')).toBe('--tt-unknown-foo-bar');
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
      expect(cssVars['--tt-color-brand-500']).toBe('#0469E3');
    });

    test('generates CSS vars for semantic tokens with var() refs', () => {
      const { cssVars } = toCssVars(defaultTheme);
      expect(cssVars['--tt-action-primary-background-default']).toBe(
        'var(--tt-color-brand-500)'
      );
    });

    test('reflects theme-specific values', () => {
      const { cssVars } = toCssVars(themes.bruttal);
      expect(cssVars['--tt-color-brand-500']).toBe('#FF2D20');
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
      expect(css).toContain('--tt-color-brand-500: #0469E3;');
    });

    test('wraps vars in themed selector', () => {
      const css = toCssVars(themes.bruttal, {
        themeId: 'bruttal',
      }).toCssString();
      expect(css).toMatch(/^\[data-tt-theme="bruttal"\] \{/);
      expect(css).toContain('--tt-color-brand-500: #FF2D20;');
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
  // Composability — multiple themes concatenated
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // coarseHitVars — pointer modality overrides
  // ---------------------------------------------------------------------------

  describe('coarseHitVars', () => {
    test('exposes coarse hit target overrides', () => {
      const { coarseHitVars } = toCssVars(defaultTheme);
      expect(coarseHitVars['--tt-sizing-hit-min']).toBe('44px');
      expect(coarseHitVars['--tt-sizing-hit-default']).toBe('48px');
      expect(coarseHitVars['--tt-sizing-hit-prominent']).toBe('56px');
    });

    test('fine-pointer baseline differs from coarse override', () => {
      const { cssVars, coarseHitVars } = toCssVars(defaultTheme);
      // semantic var resolves to fine core token (a var() reference)
      expect(cssVars['--tt-sizing-hit-default']).toBe(
        'var(--tt-size-hit-fine-default)'
      );
      // coarse override is a raw value larger than fine
      expect(coarseHitVars['--tt-sizing-hit-default']).toBe('48px');
    });

    test('toCssString includes @media (any-pointer: coarse) block', () => {
      const css = toCssVars(defaultTheme).toCssString();
      expect(css).toContain('@media (any-pointer: coarse)');
      expect(css).toContain('--tt-sizing-hit-default: 48px;');
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

// ---------------------------------------------------------------------------
// isThemeBundle
// ---------------------------------------------------------------------------

describe('isThemeBundle', () => {
  test('returns true for a ThemeBundle', () => {
    expect(isThemeBundle(bundles.default)).toBe(true);
  });

  test('returns false for a plain ThemeTokensV2', () => {
    expect(isThemeBundle(defaultTheme)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// bundleToCssVars
// ---------------------------------------------------------------------------

describe('bundleToCssVars', () => {
  describe('base result', () => {
    test('generates scoped selector with themeId', () => {
      const result = bundleToCssVars(bundles.default, {
        themeId: 'default',
      });
      expect(result.base.selector).toBe('[data-tt-theme="default"]');
    });

    test('base cssVars contain all core+semantic vars', () => {
      const result = bundleToCssVars(bundles.default, {
        themeId: 'default',
      });
      expect(result.base.cssVars['--tt-color-brand-500']).toBe('#0469E3');
      expect(
        result.base.cssVars['--tt-action-primary-background-default']
      ).toBeDefined();
    });

    test('base toCssString includes color-scheme for baseMode', () => {
      const css = bundleToCssVars(bundles.default, {
        themeId: 'default',
      }).base.toCssString();
      expect(css).toContain('color-scheme: light;');
    });
  });

  describe('alternate result', () => {
    test('returns alternate for bundles with dark alternate', () => {
      const result = bundleToCssVars(bundles.default, {
        themeId: 'default',
      });
      expect(result.alternate).toBeDefined();
    });

    test('alternate selector includes opposite mode', () => {
      const result = bundleToCssVars(bundles.default, {
        themeId: 'default',
      });
      expect(result.alternate!.selector).toBe(
        '[data-tt-theme="default"][data-tt-mode="dark"]'
      );
    });

    test('alternate has fewer vars than base (diff-only)', () => {
      const result = bundleToCssVars(bundles.default, {
        themeId: 'default',
      });
      const baseCount = Object.keys(result.base.cssVars).length;
      const altCount = Object.keys(result.alternate!.cssVars).length;
      expect(altCount).toBeLessThan(baseCount);
      expect(altCount).toBeGreaterThan(0);
    });

    test('alternate contains semantic dark overrides (not core mutations)', () => {
      const result = bundleToCssVars(bundles.default, {
        themeId: 'default',
      });
      const altVars = result.alternate!.cssVars;
      // Core vars must NOT appear in alternate (core is immutable)
      expect(altVars['--tt-color-neutral-0']).toBeUndefined();
      // Semantic vars are remapped in dark mode
      expect(altVars['--tt-content-primary-background-default']).toBe(
        'var(--tt-color-neutral-900)'
      );
    });

    test('alternate toCssString includes color-scheme opposite', () => {
      const css = bundleToCssVars(bundles.default, {
        themeId: 'default',
      }).alternate!.toCssString();
      expect(css).toContain('color-scheme: dark;');
    });
  });

  describe('single-mode bundle (neon)', () => {
    test('neon has no alternate', () => {
      const result = bundleToCssVars(bundles.neon, { themeId: 'neon' });
      expect(result.alternate).toBeUndefined();
    });

    test('neon base has dark color-scheme', () => {
      const css = bundleToCssVars(bundles.neon, {
        themeId: 'neon',
      }).base.toCssString();
      expect(css).toContain('color-scheme: dark;');
    });

    test('neon toCssString produces only base block', () => {
      const result = bundleToCssVars(bundles.neon, { themeId: 'neon' });
      const css = result.toCssString();
      expect(css).not.toContain('data-tt-mode');
    });
  });

  describe('combined toCssString', () => {
    test('produces base + alternate blocks for light-base bundle', () => {
      const css = bundleToCssVars(bundles.default, {
        themeId: 'default',
      }).toCssString();
      expect(css).toContain('[data-tt-theme="default"]');
      expect(css).toContain('[data-tt-theme="default"][data-tt-mode="dark"]');
    });

    test('all light-base bundles produce proper CSS', () => {
      const bundleNames = Object.keys(bundles) as Array<keyof typeof bundles>;
      for (const name of bundleNames.filter((n) => {
        return n !== 'neon';
      })) {
        const css = bundleToCssVars(bundles[name], {
          themeId: name,
        }).toCssString();
        expect(css).toContain(`[data-tt-theme="${name}"]`);
        expect(css).toContain(`[data-tt-mode="dark"]`);
      }
    });

    test('alternate toCssString includes coarse pointer block', () => {
      const result = bundleToCssVars(bundles.default, {
        themeId: 'default',
      });
      const altCss = result.alternate!.toCssString();
      expect(altCss).toContain('@media (any-pointer: coarse)');
      expect(altCss).toContain(
        '[data-tt-theme="default"][data-tt-mode="dark"]'
      );
    });

    test('combined toCssString includes coarse blocks for both modes', () => {
      const css = bundleToCssVars(bundles.default, {
        themeId: 'default',
      }).toCssString();
      // Should have at least 2 coarse blocks: one for base, one for alternate
      const coarseMatches = css.match(/@media \(any-pointer: coarse\)/g);
      expect(coarseMatches).not.toBeNull();
      expect(coarseMatches!.length).toBeGreaterThanOrEqual(2);
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
  test('exposes reduced-motion duration overrides', () => {
    const { reducedMotionVars } = toCssVars(defaultTheme);
    expect(reducedMotionVars['--tt-motion-feedback-duration']).toBe(
      'var(--tt-duration-none)'
    );
    expect(reducedMotionVars['--tt-motion-transition-enter-duration']).toBe(
      'var(--tt-duration-none)'
    );
    expect(reducedMotionVars['--tt-motion-transition-exit-duration']).toBe(
      'var(--tt-duration-none)'
    );
    expect(reducedMotionVars['--tt-motion-emphasis-duration']).toBe(
      'var(--tt-duration-none)'
    );
    expect(reducedMotionVars['--tt-motion-decorative-duration']).toBe(
      'var(--tt-duration-none)'
    );
  });

  test('all semantic motion durations set to core.motion.duration.none', () => {
    const { reducedMotionVars } = toCssVars(defaultTheme);
    const noneRef = 'var(--tt-duration-none)';
    
    // All duration overrides should reference the same none token
    Object.values(reducedMotionVars).forEach((value) => {
      expect(value).toBe(noneRef);
    });
  });

  test('reducedMotionVars contains exactly 5 semantic motion durations', () => {
    const { reducedMotionVars } = toCssVars(defaultTheme);
    expect(Object.keys(reducedMotionVars)).toHaveLength(5);
  });

  test('toCssString includes @media (prefers-reduced-motion: reduce) block', () => {
    const css = toCssVars(defaultTheme).toCssString();
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('--tt-motion-feedback-duration: var(--tt-duration-none);');
  });

  test('reduced-motion block uses correct selector in themed output', () => {
    const css = toCssVars(defaultTheme, { themeId: 'default' }).toCssString();
    expect(css).toContain(
      '@media (prefers-reduced-motion: reduce) {\n  [data-tt-theme="default"]'
    );
  });

  test('bundleToCssVars alternate includes reduced-motion block', () => {
    const result = bundleToCssVars(bundles.default, { themeId: 'default' });
    const altCss = result.alternate!.toCssString();
    
    expect(altCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(altCss).toContain(
      '[data-tt-theme="default"][data-tt-mode="dark"]'
    );
  });

  test('bundleToCssVars combined has reduced-motion blocks for both modes', () => {
    const css = bundleToCssVars(bundles.default, { themeId: 'default' }).toCssString();
    
    // Should have at least 2 reduced-motion blocks: one for base, one for alternate
    const reducedMotionMatches = css.match(/@media \(prefers-reduced-motion: reduce\)/g);
    expect(reducedMotionMatches).not.toBeNull();
    expect(reducedMotionMatches!.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// No broken references (Phase 7.1)
// ---------------------------------------------------------------------------

describe('reference integrity', () => {
  test('no undefined var references in default theme output', () => {
    const { cssVars } = toCssVars(defaultTheme);
    
    Object.entries(cssVars).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes('var(')) {
        // Extract var name from var(--tt-something)
        const matches = value.match(/var\(([^)]+)\)/g);
        if (matches) {
          matches.forEach((varRef) => {
            const varName = varRef.replace(/var\(([^)]+)\)/, '$1');
            // Var reference should exist in cssVars
            expect(cssVars[varName]).toBeDefined();
          });
        }
      }
    });
  });

  test('no "undefined" in any CSS var values', () => {
    const themeNames = Object.keys(themes) as Array<keyof typeof themes>;
    
    themeNames.forEach((name) => {
      const { cssVars } = toCssVars(themes[name]);
      
      Object.entries(cssVars).forEach(([key, value]) => {
        expect(String(value)).not.toContain('undefined');
        expect(String(value)).not.toMatch(/var\(--tt-undefined-/);
      });
    });
  });

  test('bundleToCssVars alternate has no broken references', () => {
    const bundleNames = Object.keys(bundles) as Array<keyof typeof bundles>;
    
    bundleNames.forEach((name) => {
      const result = bundleToCssVars(bundles[name], { themeId: name });
      
      if (result.alternate) {
        const { cssVars } = result.alternate;
        const baseCssVars = result.base.cssVars;
        
        const brokenRefs: string[] = [];
        Object.entries(cssVars).forEach(([key, value]) => {
          if (typeof value === 'string' && value.includes('var(')) {
            const matches = value.match(/var\(([^)]+)\)/g);
            if (matches) {
              matches.forEach((varRef) => {
                const varName = varRef.replace(/var\(([^)]+)\)/, '$1');
                // Alternate can reference vars from base (core tokens)
                if (!cssVars[varName] && !baseCssVars[varName]) {
                  brokenRefs.push(`${key} → ${varName}`);
                }
              });
            }
          }
        });
        
        expect(brokenRefs).toEqual([]);
      }
    });
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

  test('includes type ramp vars', () => {
    const { containerQueryVars } = toCssVars(defaultTheme);
    expect(containerQueryVars['--tt-font-size-text-1']).toBeDefined();
    expect(containerQueryVars['--tt-font-size-display-1']).toBeDefined();
  });

  test('includes space unit var', () => {
    const { containerQueryVars } = toCssVars(defaultTheme);
    expect(containerQueryVars['--tt-space-unit']).toBeDefined();
  });

  test('includes size ramp ui vars', () => {
    const { containerQueryVars } = toCssVars(defaultTheme);
    expect(containerQueryVars['--tt-size-ramp-ui-1']).toBeDefined();
  });

  test('includes size ramp layout vars', () => {
    const { containerQueryVars } = toCssVars(defaultTheme);
    expect(containerQueryVars['--tt-size-ramp-layout-1']).toBeDefined();
  });

  test('does not include non-CQ vars', () => {
    const { containerQueryVars } = toCssVars(defaultTheme);
    expect(containerQueryVars['--tt-color-brand-500']).toBeUndefined();
    expect(containerQueryVars['--tt-radii-md']).toBeUndefined();
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
    const supportsMatch = css.match(
      /@supports \(width: 1cqi\) \{[\s\S]*?\n\}/
    );
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

  test('bundleToCssVars base includes @supports block', () => {
    const css = bundleToCssVars(bundles.default, {
      themeId: 'default',
    }).base.toCssString();
    expect(css).toContain('@supports (width: 1cqi)');
  });

  test('bundleToCssVars combined includes @supports blocks', () => {
    const css = bundleToCssVars(bundles.default, {
      themeId: 'default',
    }).toCssString();
    const supportsMatches = css.match(/@supports \(width: 1cqi\)/g);
    expect(supportsMatches).not.toBeNull();
    // At least one @supports block for the base
    expect(supportsMatches!.length).toBeGreaterThanOrEqual(1);
  });

  test('all themes produce @supports block', () => {
    for (const name of Object.keys(themes) as Array<keyof typeof themes>) {
      const css = toCssVars(themes[name], { themeId: name }).toCssString();
      expect(css).toContain('@supports (width: 1cqi)');
    }
  });
});
