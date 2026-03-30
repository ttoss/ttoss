import {
  bundles,
  createTheme,
  createThemeBundle,
  defaultTheme,
  themes,
  type SemanticModeOverride,
  type ThemeTokensV2,
} from '../../../src';
import {
  extractRefPath,
  flattenAndResolve,
  flattenObject,
  isTokenRef,
} from '../../../src/roots/helpers';

// ---------------------------------------------------------------------------
// Built-in themes — Contract compliance
// ---------------------------------------------------------------------------

describe('built-in themes', () => {
  const themeNames = Object.keys(themes) as Array<keyof typeof themes>;

  describe.each(themeNames)('themes.%s', (name) => {
    const theme = themes[name];

    test('satisfies ThemeTokensV2 contract', () => {
      // Compile-time check via assignment
      const _typed: ThemeTokensV2 = theme;
      expect(_typed).toBeDefined();
    });

    test('has both core and semantic layers', () => {
      expect(theme.core).toBeDefined();
      expect(theme.semantic).toBeDefined();
    });

    test('core contains all required categories', () => {
      const { core } = theme;
      expect(core.colors).toBeDefined();
      expect(core.elevation).toBeDefined();
      expect(core.font).toBeDefined();
      expect(core.type).toBeDefined();
      expect(core.space).toBeDefined();
      expect(core.size).toBeDefined();
      expect(core.radii).toBeDefined();
      expect(core.border).toBeDefined();
      expect(core.opacity).toBeDefined();
      expect(core.motion).toBeDefined();
      expect(core.zIndex).toBeDefined();
      expect(core.breakpoint).toBeDefined();
    });

    test('semantic contains all required categories', () => {
      const { semantic } = theme;
      expect(semantic.colors).toBeDefined();
      expect(semantic.elevation).toBeDefined();
      expect(semantic.text).toBeDefined();
      expect(semantic.spacing).toBeDefined();
      expect(semantic.sizing).toBeDefined();
      expect(semantic.radii).toBeDefined();
      expect(semantic.border).toBeDefined();
      expect(semantic.focus).toBeDefined();
      expect(semantic.opacity).toBeDefined();
      expect(semantic.motion).toBeDefined();
      expect(semantic.zIndex).toBeDefined();
    });

    test('has complete brand colors', () => {
      const { brand } = theme.core.colors;
      expect(brand[100]).toBeDefined();
      expect(brand[300]).toBeDefined();
      expect(brand[500]).toBeDefined();
      expect(brand[700]).toBeDefined();
      expect(brand[900]).toBeDefined();
    });

    test('has complete green hue scale', () => {
      const { green } = theme.core.colors;
      expect(green[100]).toBeDefined();
      expect(green[500]).toBeDefined();
      expect(green[900]).toBeDefined();
    });

    test('has complete yellow hue scale', () => {
      const { yellow } = theme.core.colors;
      expect(yellow[100]).toBeDefined();
      expect(yellow[500]).toBeDefined();
      expect(yellow[900]).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Theme-specific overrides
  // ---------------------------------------------------------------------------

  describe('theme-specific overrides', () => {
    test('bruttal has near-zero radii', () => {
      expect(themes.bruttal.core.radii.none).toBe('0px');
      expect(themes.bruttal.core.radii.sm).toBe('0px');
    });

    test('bruttal has high-contrast brand colors', () => {
      expect(themes.bruttal.core.colors.brand[500]).toBe('#FF2D20');
    });

    test('oca has natural green accent', () => {
      expect(themes.oca.core.colors.brand[500]).toBe('#7CB342');
    });

    test('aurora has cool-toned accent', () => {
      expect(themes.aurora.core.colors.brand[500]).toBe('#7C4DFF');
    });

    test('terra has earthy amber accent', () => {
      expect(themes.terra.core.colors.brand[500]).toBe('#FF8F00');
    });

    test('neon has vibrant green accent', () => {
      expect(themes.neon.core.colors.brand[500]).toBe('#00E676');
    });

    test('neon overrides semantic colors for dark backgrounds', () => {
      expect(
        themes.neon.semantic.colors.content.primary?.background?.default
      ).toBe('{core.colors.neutral.100}');
    });
  });

  // ---------------------------------------------------------------------------
  // Inheritance — non-overridden tokens come from defaultTheme
  // ---------------------------------------------------------------------------

  describe('inheritance from defaultTheme', () => {
    test('non-overridden breakpoints match defaultTheme', () => {
      for (const name of themeNames) {
        expect(themes[name].core.breakpoint).toEqual(
          defaultTheme.core.breakpoint
        );
      }
    });

    test('non-overridden motion matches defaultTheme', () => {
      for (const name of themeNames) {
        expect(themes[name].core.motion).toEqual(defaultTheme.core.motion);
      }
    });

    test('non-overridden zIndex matches defaultTheme', () => {
      for (const name of themeNames) {
        expect(themes[name].core.zIndex).toEqual(defaultTheme.core.zIndex);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Custom theme extension from built-in
  // ---------------------------------------------------------------------------

  describe('extending built-in themes', () => {
    test('can extend a built-in theme with overrides', () => {
      const custom = createTheme({
        base: themes.bruttal,
        overrides: {
          core: { radii: { md: '12px' } },
        },
      });
      expect(custom.core.radii.md).toBe('12px');
      expect(custom.core.radii.sm).toBe(themes.bruttal.core.radii.sm);
      expect(custom.core.colors.brand[500]).toBe(
        themes.bruttal.core.colors.brand[500]
      );
    });

    test('multi-level inheritance produces valid theme', () => {
      const l1 = createTheme({
        base: themes.aurora,
        overrides: { core: { radii: { sm: '10px' } } },
      });
      const l2 = createTheme({
        base: l1,
        overrides: { core: { colors: { brand: { 500: '#000' } } } },
      });

      expect(l2.core.radii.sm).toBe('10px');
      expect(l2.core.colors.brand[500]).toBe('#000');
      expect(l2.core.colors.brand[100]).toBe(
        themes.aurora.core.colors.brand[100]
      );
    });
  });

  // ---------------------------------------------------------------------------
  // themes record
  // ---------------------------------------------------------------------------

  describe('themes object', () => {
    test('contains all 6 built-in themes', () => {
      expect(Object.keys(themes)).toEqual(
        expect.arrayContaining([
          'default',
          'bruttal',
          'oca',
          'aurora',
          'terra',
          'neon',
        ])
      );
      expect(Object.keys(themes)).toHaveLength(6);
    });

    test('themes.default is the same as defaultTheme', () => {
      expect(themes.default).toBe(defaultTheme);
    });
  });

  // ---------------------------------------------------------------------------
  // Semantic ref integrity — every {core.*} ref points to an existing path
  // ---------------------------------------------------------------------------

  describe('semantic ref integrity', () => {
    /**
     * Resolve a dot-separated path against a nested object.
     * Returns undefined if the path does not exist.
     */
    const resolvePath = (
      obj: Record<string, unknown>,
      path: string
    ): unknown => {
      return path.split('.').reduce<unknown>((acc, key) => {
        if (
          acc &&
          typeof acc === 'object' &&
          key in (acc as Record<string, unknown>)
        ) {
          return (acc as Record<string, unknown>)[key];
        }
        return undefined;
      }, obj);
    };

    test.each(Object.keys(themes) as Array<keyof typeof themes>)(
      'all semantic refs in themes.%s resolve to existing paths',
      (name) => {
        const theme = themes[name];
        const semanticFlat = flattenObject(
          theme.semantic as unknown as Record<string, unknown>,
          'semantic'
        );

        const brokenRefs: string[] = [];

        for (const [tokenPath, value] of Object.entries(semanticFlat)) {
          if (typeof value === 'string' && isTokenRef(value)) {
            const refPath = extractRefPath(value);
            const resolved = resolvePath(
              theme as unknown as Record<string, unknown>,
              refPath
            );
            if (resolved === undefined) {
              brokenRefs.push(`${tokenPath} → ${value}`);
            }
          }
        }

        expect(brokenRefs).toEqual([]);
      }
    );

    test('semantic tokens contain only refs or raw sizing values', () => {
      const semanticFlat = flattenObject(
        defaultTheme.semantic as unknown as Record<string, unknown>,
        'semantic'
      );

      for (const [path, value] of Object.entries(semanticFlat)) {
        if (typeof value === 'string') {
          // Allow token refs, raw sizing values (hit targets, measures), and var() expressions
          const isRef = isTokenRef(value);
          const isRawSizing =
            path.includes('sizing.hit') || path.includes('sizing.measure');
          const isVarExpr = value.includes('var(') || value.includes('clamp(');
          expect(isRef || isRawSizing || isVarExpr).toBe(true);
        }
        // Numbers (like zIndex values referenced as numeric) are OK
      }
    });
  });

  // ---------------------------------------------------------------------------
  // defaultTheme as canonical source of truth
  //
  // Every token path that exists in any non-default theme must also exist in
  // defaultTheme. This guarantees that:
  //   1. defaultTheme is the complete fallback for all themes.
  //   2. A new token added via `overrides` in any theme is also added to
  //      defaultTheme, so all other themes inherit it automatically.
  // ---------------------------------------------------------------------------

  describe('defaultTheme as canonical source of truth', () => {
    test('defaultTheme contains every token path that exists in any other theme', () => {
      const defaultFlat = flattenObject(
        defaultTheme as unknown as Record<string, unknown>
      );
      const defaultKeys = new Set(Object.keys(defaultFlat));

      const missing: string[] = [];

      for (const name of themeNames.filter((n) => {
        return n !== 'default';
      })) {
        const flat = flattenObject(
          themes[name] as unknown as Record<string, unknown>
        );
        for (const key of Object.keys(flat)) {
          if (!defaultKeys.has(key)) {
            missing.push(`themes.${name}: ${key}`);
          }
        }
      }

      expect(missing).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Theme bundles
  // ---------------------------------------------------------------------------

  describe('bundles', () => {
    const bundleNames = Object.keys(bundles) as Array<keyof typeof bundles>;

    test('contains all 6 built-in bundles', () => {
      expect(bundleNames).toEqual(
        expect.arrayContaining([
          'default',
          'bruttal',
          'oca',
          'aurora',
          'terra',
          'neon',
        ])
      );
      expect(bundleNames).toHaveLength(6);
    });

    test.each(bundleNames)('bundles.%s has valid baseMode', (name) => {
      const bundle = bundles[name];
      expect(['light', 'dark']).toContain(bundle.baseMode);
    });

    test.each(bundleNames)(
      'bundles.%s.base satisfies ThemeTokensV2',
      (name) => {
        const bundle = bundles[name];
        const _typed: ThemeTokensV2 = bundle.base;
        expect(_typed.core).toBeDefined();
        expect(_typed.semantic).toBeDefined();
      }
    );

    test('neon bundle has baseMode dark and no alternate', () => {
      expect(bundles.neon.baseMode).toBe('dark');
      expect(bundles.neon.alternate).toBeUndefined();
    });

    test.each(
      bundleNames.filter((n) => {
        return n !== 'neon';
      })
    )('bundles.%s has light baseMode and a dark alternate', (name) => {
      const bundle = bundles[name];
      expect(bundle.baseMode).toBe('light');
      expect(bundle.alternate).toBeDefined();
    });

    test.each(
      bundleNames.filter((n) => {
        return n !== 'neon';
      })
    )('bundles.%s alternate only overrides semantic layer', (name) => {
      const bundle = bundles[name];
      const alt = bundle.alternate!;
      // Core is immutable — alternate must NOT override it
      expect((alt as Record<string, unknown>).core).toBeUndefined();
      // Only semantic layer is overridden
      expect(alt.semantic).toBeDefined();
      // Within semantic, colors and elevation surfaces change
      const semanticKeys = Object.keys(alt.semantic!);
      expect(semanticKeys).toContain('colors');
      expect(semanticKeys).toContain('elevation');
    });
  });

  // ---------------------------------------------------------------------------
  // createThemeBundle
  // ---------------------------------------------------------------------------

  describe('createThemeBundle', () => {
    test('returns valid bundle with defaults', () => {
      const bundle = createThemeBundle();
      expect(bundle.baseMode).toBe('light');
      expect(bundle.base).toEqual(defaultTheme);
      expect(bundle.alternate).toBeUndefined();
    });

    test('respects baseMode parameter', () => {
      const bundle = createThemeBundle({ baseMode: 'dark' });
      expect(bundle.baseMode).toBe('dark');
    });

    test('applies overrides to base', () => {
      const bundle = createThemeBundle({
        overrides: { core: { colors: { brand: { 500: '#FF0000' } } } },
      });
      expect(bundle.base.core.colors.brand[500]).toBe('#FF0000');
      expect(bundle.base.core.colors.brand[100]).toBe(
        defaultTheme.core.colors.brand[100]
      );
    });

    test('passes alternate through', () => {
      const alt: SemanticModeOverride = {
        semantic: {
          colors: {
            content: {
              primary: { text: { default: '{core.colors.neutral.0}' } },
            },
          },
        },
      };
      const bundle = createThemeBundle({ alternate: alt });
      expect(bundle.alternate).toEqual(alt);
    });
  });
});
