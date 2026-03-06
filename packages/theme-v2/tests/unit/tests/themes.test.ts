import {
  createTheme,
  defaultTheme,
  themes,
  type ThemeTokensV2,
} from '../../../src';
import {
  extractRefPath,
  flattenObject,
  isTokenRef,
} from '../../../src/adapters/helpers';

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
      expect(core.borders).toBeDefined();
      expect(core.opacity).toBeDefined();
      expect(core.motion).toBeDefined();
      expect(core.zIndex).toBeDefined();
      expect(core.breakpoints).toBeDefined();
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
      expect(semantic.opacity).toBeDefined();
      expect(semantic.motion).toBeDefined();
      expect(semantic.zIndex).toBeDefined();
    });

    test('has complete brand colors', () => {
      const { brand } = theme.core.colors;
      expect(brand.main).toBeDefined();
      expect(brand.complimentary).toBeDefined();
      expect(brand.accent).toBeDefined();
      expect(brand.darkNeutral).toBeDefined();
      expect(brand.lightNeutral).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Theme-specific overrides
  // ---------------------------------------------------------------------------

  describe('theme-specific overrides', () => {
    test('bruttal has near-zero radii', () => {
      expect(themes.bruttal.core.radii.xs).toBe('0px');
      expect(themes.bruttal.core.radii.sm).toBe('0px');
    });

    test('bruttal has high-contrast brand colors', () => {
      expect(themes.bruttal.core.colors.brand.main).toBe('#0A0A0A');
      expect(themes.bruttal.core.colors.brand.complimentary).toBe('#FFFFFF');
    });

    test('oca has natural green accent', () => {
      expect(themes.oca.core.colors.brand.accent).toBe('#7CB342');
    });

    test('aurora has cool-toned accent', () => {
      expect(themes.aurora.core.colors.brand.accent).toBe('#7C4DFF');
    });

    test('terra has earthy amber accent', () => {
      expect(themes.terra.core.colors.brand.accent).toBe('#FF8F00');
    });

    test('neon has vibrant green accent', () => {
      expect(themes.neon.core.colors.brand.accent).toBe('#00E676');
    });

    test('neon overrides semantic colors for dark backgrounds', () => {
      expect(
        themes.neon.semantic.colors.content.primary?.background.default
      ).toBe('{core.colors.neutral.gray100}');
    });
  });

  // ---------------------------------------------------------------------------
  // Inheritance — non-overridden tokens come from defaultTheme
  // ---------------------------------------------------------------------------

  describe('inheritance from defaultTheme', () => {
    test('non-overridden breakpoints match defaultTheme', () => {
      for (const name of themeNames) {
        expect(themes[name].core.breakpoints).toEqual(
          defaultTheme.core.breakpoints
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
      expect(custom.core.colors.brand).toEqual(
        themes.bruttal.core.colors.brand
      );
    });

    test('multi-level inheritance produces valid theme', () => {
      const l1 = createTheme({
        base: themes.aurora,
        overrides: { core: { radii: { sm: '10px' } } },
      });
      const l2 = createTheme({
        base: l1,
        overrides: { core: { colors: { brand: { main: '#000' } } } },
      });

      expect(l2.core.radii.sm).toBe('10px');
      expect(l2.core.colors.brand.main).toBe('#000');
      expect(l2.core.colors.brand.accent).toBe(
        themes.aurora.core.colors.brand.accent
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
});
