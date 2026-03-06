import { createTheme, defaultTheme, themes, toChakraTheme } from '../../../src';

// ---------------------------------------------------------------------------
// toChakraTheme — Core token mapping
// ---------------------------------------------------------------------------

describe('toChakraTheme', () => {
  const chakra = toChakraTheme(defaultTheme);

  describe('core tokens → theme.tokens', () => {
    test('maps core colors with { value } wrapper', () => {
      expect(chakra.theme.tokens.colors).toBeDefined();
      const colors = chakra.theme.tokens.colors as Record<string, unknown>;
      const brand = colors.brand as Record<string, { value: string }>;
      expect(brand.main).toEqual({ value: '#292C2a' });
      expect(brand.accent).toEqual({ value: '#0469E3' });
    });

    test('maps core elevation to shadows', () => {
      const shadows = chakra.theme.tokens.shadows as Record<
        string,
        { value: string }
      >;
      expect(shadows[0]).toEqual({ value: 'none' });
      expect(shadows[1]).toBeDefined();
      expect(typeof (shadows[1] as { value: string }).value).toBe('string');
    });

    test('maps core font families to fonts', () => {
      const fonts = chakra.theme.tokens.fonts as Record<
        string,
        { value: string }
      >;
      expect(fonts.sans).toBeDefined();
      expect(fonts.mono).toBeDefined();
      expect(typeof fonts.sans.value).toBe('string');
    });

    test('maps core font weights to fontWeights', () => {
      const fw = chakra.theme.tokens.fontWeights as Record<
        string,
        { value: number }
      >;
      expect(fw.regular).toEqual({ value: 400 });
      expect(fw.bold).toEqual({ value: 700 });
    });

    test('maps core space to spacing', () => {
      const spacing = chakra.theme.tokens.spacing as Record<
        string,
        { value: string }
      >;
      expect(spacing[0]).toEqual({ value: '0px' });
    });

    test('maps core radii', () => {
      const radii = chakra.theme.tokens.radii as Record<
        string,
        { value: string }
      >;
      expect(radii.none).toEqual({ value: '0px' });
      expect(radii.md).toEqual({ value: '8px' });
    });

    test('maps core breakpoints (without value wrapper)', () => {
      expect(chakra.breakpoints).toEqual(defaultTheme.core.breakpoints);
    });

    test('maps durations and easings', () => {
      const dur = chakra.theme.tokens.durations as Record<
        string,
        { value: string }
      >;
      expect(dur.xs).toEqual({ value: '50ms' });

      const eas = chakra.theme.tokens.easings as Record<
        string,
        { value: string }
      >;
      expect(eas.standard.value).toContain('cubic-bezier');
    });

    test('maps zIndex', () => {
      const zi = chakra.theme.tokens.zIndex as Record<
        string,
        { value: number }
      >;
      expect(zi.modal).toEqual({ value: 40 });
    });

    test('maps opacity', () => {
      const op = chakra.theme.tokens.opacity as Record<
        string,
        { value: number }
      >;
      expect(op[100]).toEqual({ value: 1 });
      expect(op[50]).toEqual({ value: 0.5 });
    });
  });

  // ---------------------------------------------------------------------------
  // Semantic tokens → theme.semanticTokens
  // ---------------------------------------------------------------------------

  describe('semantic tokens → theme.semanticTokens', () => {
    test('maps semantic colors with transformed refs', () => {
      const colors = chakra.theme.semanticTokens.colors as Record<
        string,
        unknown
      >;
      const action = colors.action as Record<string, unknown>;
      const primary = action.primary as Record<string, unknown>;
      const bg = primary.background as Record<string, { value: string }>;
      expect(bg.default.value).toBe('{colors.brand.accent}');
    });

    test('transforms core refs to Chakra-compatible paths', () => {
      const colors = chakra.theme.semanticTokens.colors as Record<
        string,
        unknown
      >;
      const input = colors.input as Record<string, unknown>;
      const primary = input.primary as Record<string, unknown>;
      const border = primary.border as Record<string, { value: string }>;
      expect(border.focused.value).toBe('{colors.brand.accent}');
    });

    test('maps semantic elevation to shadows', () => {
      const shadows = chakra.theme.semanticTokens.shadows as Record<
        string,
        { value: string }
      >;
      expect(shadows.flat.value).toBe('{shadows.0}');
      expect(shadows.modal.value).toBe('{shadows.4}');
    });

    test('maps semantic radii', () => {
      const radii = chakra.theme.semanticTokens.radii as Record<
        string,
        { value: string }
      >;
      expect(radii.surface.value).toBe('{radii.md}');
      expect(radii.control.value).toBe('{radii.sm}');
    });

    test('maps semantic spacing with core refs', () => {
      const sp = chakra.theme.semanticTokens.spacing as Record<string, unknown>;
      const inset = sp.inset as Record<string, unknown>;
      const control = inset.control as Record<string, { value: string }>;
      expect(control.sm.value).toBe('{spacing.2}');
    });

    test('maps semantic zIndex', () => {
      const zi = chakra.theme.semanticTokens.zIndex as Record<
        string,
        { value: string }
      >;
      expect(zi.toast.value).toBe('{zIndex.toast}');
    });

    test('maps semantic motion', () => {
      const motion = chakra.theme.semanticTokens.motion as Record<
        string,
        unknown
      >;
      expect(motion).toBeDefined();
      const feedback = motion.feedback as Record<string, unknown>;
      const fast = feedback.fast as Record<string, { value: string }>;
      expect(fast.duration.value).toBe('{durations.xs}');
      expect(fast.easing.value).toBe('{easings.standard}');
    });
  });

  // ---------------------------------------------------------------------------
  // Text styles
  // ---------------------------------------------------------------------------

  describe('textStyles', () => {
    test('maps semantic text to Chakra textStyles format', () => {
      const ts = chakra.theme.textStyles as Record<string, unknown>;
      const display = ts.display as Record<string, { value: unknown }>;
      expect(display.lg).toBeDefined();
      expect(display.lg.value).toBeDefined();
    });

    test('text style references are transformed to Chakra paths', () => {
      const ts = chakra.theme.textStyles as Record<string, unknown>;
      const body = ts.body as Record<string, { value: Record<string, string> }>;
      expect(body.md.value.fontFamily).toBe('{fonts.sans}');
      expect(body.md.value.lineHeight).toBe('{lineHeights.normal}');
    });

    test('all text families have expected sizes', () => {
      const ts = chakra.theme.textStyles as Record<string, unknown>;
      for (const family of ['display', 'headline', 'title', 'body', 'label']) {
        const f = ts[family] as Record<string, unknown>;
        expect(f.lg).toBeDefined();
        expect(f.md).toBeDefined();
        expect(f.sm).toBeDefined();
      }
      const code = ts.code as Record<string, unknown>;
      expect(code.md).toBeDefined();
      expect(code.sm).toBeDefined();
    });

    test('fontOpticalSizing is resolved to raw value, not a Chakra ref', () => {
      const ts = chakra.theme.textStyles as Record<string, unknown>;
      const display = ts.display as Record<
        string,
        { value: Record<string, string> }
      >;
      expect(display.lg.value.fontOpticalSizing).toBe('auto');
    });

    test('fontVariantNumeric is resolved to raw value, not a Chakra ref', () => {
      const ts = chakra.theme.textStyles as Record<string, unknown>;
      const code = ts.code as Record<string, { value: Record<string, string> }>;
      expect(code.md.value.fontVariantNumeric).toBe('tabular-nums');
    });
  });

  // ---------------------------------------------------------------------------
  // Stability across themes
  // ---------------------------------------------------------------------------

  describe('stability across themes', () => {
    test('produces consistent structure for all built-in themes', () => {
      const themeNames = Object.keys(themes) as Array<keyof typeof themes>;
      const structures = themeNames.map((name) => {
        const result = toChakraTheme(themes[name]);
        return {
          tokenKeys: Object.keys(result.theme.tokens).sort(),
          semanticKeys: Object.keys(result.theme.semanticTokens).sort(),
          hasTextStyles: Object.keys(result.theme.textStyles).length > 0,
          hasBreakpoints: Object.keys(result.breakpoints).length > 0,
        };
      });

      // All themes should produce the same structural keys
      for (let i = 1; i < structures.length; i++) {
        expect(structures[i].tokenKeys).toEqual(structures[0].tokenKeys);
        expect(structures[i].semanticKeys).toEqual(structures[0].semanticKeys);
        expect(structures[i].hasTextStyles).toBe(true);
        expect(structures[i].hasBreakpoints).toBe(true);
      }
    });

    test('custom theme produces valid Chakra config', () => {
      const custom = createTheme({
        overrides: {
          core: { colors: { brand: { main: '#FF4500' } } },
        },
      });
      const result = toChakraTheme(custom);

      const colors = result.theme.tokens.colors as Record<string, unknown>;
      const brand = colors.brand as Record<string, { value: string }>;
      expect(brand.main).toEqual({ value: '#FF4500' });
      // Other tokens should still exist from defaultTheme
      expect(brand.accent).toEqual({ value: '#0469E3' });
    });
  });
});
