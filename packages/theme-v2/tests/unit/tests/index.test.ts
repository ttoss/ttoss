import {
  createTheme,
  type DeepPartial,
  defaultTheme,
  type ThemeTokensV2,
} from '../../../src';

// ---------------------------------------------------------------------------
// defaultTheme
// ---------------------------------------------------------------------------

describe('defaultTheme', () => {
  test('has core and semantic layers', () => {
    expect(defaultTheme.core).toBeDefined();
    expect(defaultTheme.semantic).toBeDefined();
  });

  test('core contains all token categories', () => {
    const { core } = defaultTheme;
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

  test('semantic contains all token categories', () => {
    const { semantic } = defaultTheme;
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
});

// ---------------------------------------------------------------------------
// createTheme
// ---------------------------------------------------------------------------

describe('createTheme', () => {
  test('returns defaultTheme when called with no arguments', () => {
    const theme = createTheme();
    expect(theme).toEqual(defaultTheme);
  });

  test('returns defaultTheme when called with empty overrides', () => {
    const theme = createTheme({ overrides: {} });
    expect(theme).toEqual(defaultTheme);
  });

  test('overrides a core brand color while preserving siblings', () => {
    const theme = createTheme({
      overrides: {
        core: {
          colors: {
            brand: { main: '#FF0000' },
          },
        },
      },
    });

    expect(theme.core.colors.brand.main).toBe('#FF0000');
    expect(theme.core.colors.brand.accent).toBe(
      defaultTheme.core.colors.brand.accent
    );
    expect(theme.core.colors.brand.complimentary).toBe(
      defaultTheme.core.colors.brand.complimentary
    );
  });

  test('overrides a deeply nested semantic token', () => {
    const theme = createTheme({
      overrides: {
        semantic: {
          elevation: {
            resting: '{core.elevation.level.3}',
          },
        },
      },
    });

    expect(theme.semantic.elevation.resting).toBe('{core.elevation.level.3}');
    expect(theme.semantic.elevation.flat).toBe(
      defaultTheme.semantic.elevation.flat
    );
    expect(theme.semantic.elevation.modal).toBe(
      defaultTheme.semantic.elevation.modal
    );
  });

  test('preserves all non-overridden values', () => {
    const theme = createTheme({
      overrides: {
        core: { radii: { sm: '8px' } },
      },
    });

    expect(theme.core.radii.sm).toBe('8px');
    expect(theme.core.radii.md).toBe(defaultTheme.core.radii.md);
    expect(theme.core.radii.lg).toBe(defaultTheme.core.radii.lg);
    expect(theme.core.colors).toEqual(defaultTheme.core.colors);
    expect(theme.semantic).toEqual(defaultTheme.semantic);
  });

  test('supports theme inheritance with a custom base', () => {
    const parentTheme = createTheme({
      overrides: {
        core: { colors: { brand: { main: '#111111' } } },
      },
    });

    const childTheme = createTheme({
      base: parentTheme,
      overrides: {
        core: { colors: { brand: { accent: '#00FF00' } } },
      },
    });

    expect(childTheme.core.colors.brand.main).toBe('#111111');
    expect(childTheme.core.colors.brand.accent).toBe('#00FF00');
    expect(childTheme.core.colors.brand.complimentary).toBe(
      defaultTheme.core.colors.brand.complimentary
    );
  });

  test('returns a new object without mutating the base', () => {
    const originalMain = defaultTheme.core.colors.brand.main;

    const theme = createTheme({
      overrides: {
        core: { colors: { brand: { main: '#AABBCC' } } },
      },
    });

    expect(theme).not.toBe(defaultTheme);
    expect(theme.core.colors.brand.main).toBe('#AABBCC');
    expect(defaultTheme.core.colors.brand.main).toBe(originalMain);
  });

  test('overrides multiple categories in a single call', () => {
    const theme = createTheme({
      overrides: {
        core: {
          radii: { sm: '6px', lg: '16px' },
          breakpoints: { sm: '500px' },
        },
        semantic: {
          radii: { control: '{core.radii.md}' },
        },
      },
    });

    expect(theme.core.radii.sm).toBe('6px');
    expect(theme.core.radii.lg).toBe('16px');
    expect(theme.core.radii.md).toBe(defaultTheme.core.radii.md);
    expect(theme.core.breakpoints.sm).toBe('500px');
    expect(theme.core.breakpoints.md).toBe(defaultTheme.core.breakpoints.md);
    expect(theme.semantic.radii.control).toBe('{core.radii.md}');
    expect(theme.semantic.radii.surface).toBe(
      defaultTheme.semantic.radii.surface
    );
  });

  test('overrides numeric core values', () => {
    const theme = createTheme({
      overrides: {
        core: {
          opacity: { 75: 0.8 },
          zIndex: { modal: 100 },
        },
      },
    });

    expect(theme.core.opacity[75]).toBe(0.8);
    expect(theme.core.opacity[50]).toBe(defaultTheme.core.opacity[50]);
    expect(theme.core.zIndex.modal).toBe(100);
    expect(theme.core.zIndex.toast).toBe(defaultTheme.core.zIndex.toast);
  });
});

// ---------------------------------------------------------------------------
// Immutability — deep-clone guarantees
// ---------------------------------------------------------------------------

describe('immutability (deep-clone)', () => {
  test('mutation in child theme does not affect the base theme', () => {
    const base = createTheme({
      overrides: { core: { colors: { brand: { main: '#111' } } } },
    });
    const child = createTheme({
      base,
      overrides: { core: { radii: { sm: '10px' } } },
    });

    // Mutate child
    child.core.colors.brand.main = '#MUTATED';

    expect(base.core.colors.brand.main).toBe('#111');
  });

  test('mutation in built-in theme does not affect defaultTheme', () => {
    const theme = createTheme();
    const originalMain = defaultTheme.core.colors.brand.main;

    theme.core.colors.brand.main = '#MUTATED';

    expect(defaultTheme.core.colors.brand.main).toBe(originalMain);
  });

  test('non-overridden branch is not the same reference as base', () => {
    const theme = createTheme();

    expect(Object.is(theme.semantic, defaultTheme.semantic)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Type safety (compile-time — confirms the types work)
// ---------------------------------------------------------------------------

describe('type safety', () => {
  test('DeepPartial allows nested partial overrides', () => {
    const partial: DeepPartial<ThemeTokensV2> = {
      core: {
        colors: {
          brand: { main: '#000' },
        },
      },
    };

    expect(partial).toBeDefined();
  });

  test('createTheme result satisfies ThemeTokensV2', () => {
    const theme: ThemeTokensV2 = createTheme();
    expect(theme.core).toBeDefined();
    expect(theme.semantic).toBeDefined();
  });
});
