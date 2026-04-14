/**
 * createTheme API tests.
 *
 * Validates the engine-level API:
 * - buildTheme: default output, overrides, inheritance, immutability
 * - createTheme: baseMode, base, alternate pass-through
 * - Themes/bundles registry completeness
 */

import { createTheme, type ModeOverride } from '../../../../src';
import { baseBundle } from '../../../../src/baseBundle';
import {
  baseTheme as defaultTheme,
  darkAlternate,
} from '../../../../src/baseTheme';
import { buildTheme } from '../../../../src/createTheme';
import { withDataviz } from '../../../../src/dataviz/withDataviz';

// ---------------------------------------------------------------------------
// buildTheme — default output
// ---------------------------------------------------------------------------

describe('buildTheme', () => {
  test('returns defaultTheme when called with no arguments', () => {
    const theme = buildTheme();
    expect(theme).toEqual(defaultTheme);
  });

  test('overrides a core brand color while preserving siblings', () => {
    const theme = buildTheme({
      overrides: { core: { colors: { brand: { 500: '#FF0000' } } } },
    });
    expect(theme.core.colors.brand[500]).toBe('#FF0000');
    expect(theme.core.colors.brand[100]).toBe(
      defaultTheme.core.colors.brand[100]
    );
    expect(theme.core.colors.brand[700]).toBe(
      defaultTheme.core.colors.brand[700]
    );
  });

  test('overrides a deeply nested semantic token', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: { surface: { raised: '{core.elevation.level.3}' } },
        },
      },
    });
    expect(theme.semantic.elevation.surface.raised).toBe(
      '{core.elevation.level.3}'
    );
    expect(theme.semantic.elevation.surface.flat).toBe(
      defaultTheme.semantic.elevation.surface.flat
    );
  });

  test('preserves all non-overridden values', () => {
    const theme = buildTheme({
      overrides: { core: { radii: { sm: '8px' } } },
    });
    expect(theme.core.radii.sm).toBe('8px');
    expect(theme.core.radii.md).toBe(defaultTheme.core.radii.md);
    expect(theme.core.colors).toEqual(defaultTheme.core.colors);
    expect(theme.semantic).toEqual(defaultTheme.semantic);
  });

  test('supports multi-level theme inheritance', () => {
    const l1 = buildTheme({ overrides: { core: { radii: { sm: '10px' } } } });
    const l2 = buildTheme({
      base: l1,
      overrides: { core: { colors: { brand: { 500: '#000' } } } },
    });
    expect(l2.core.radii.sm).toBe('10px');
    expect(l2.core.colors.brand[500]).toBe('#000');
    expect(l2.core.colors.brand[100]).toBe(defaultTheme.core.colors.brand[100]);
  });

  test('overrides multiple categories in a single call', () => {
    const theme = buildTheme({
      overrides: {
        core: {
          radii: { sm: '6px', lg: '16px' },
          breakpoints: { sm: '36rem' },
        },
        semantic: { radii: { control: '{core.radii.md}' } },
      },
    });
    expect(theme.core.radii.sm).toBe('6px');
    expect(theme.core.radii.lg).toBe('16px');
    expect(theme.core.radii.md).toBe(defaultTheme.core.radii.md);
    expect(theme.core.breakpoints.sm).toBe('36rem');
    expect(theme.semantic.radii.control).toBe('{core.radii.md}');
  });

  test('overrides numeric core values', () => {
    const theme = buildTheme({
      overrides: {
        core: { opacity: { 75: 0.8 }, zIndex: { level: { 3: 500 } } },
      },
    });
    expect(theme.core.opacity[75]).toBe(0.8);
    expect(theme.core.opacity[50]).toBe(defaultTheme.core.opacity[50]);
    expect(theme.core.zIndex.level[3]).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Immutability — deep-clone guarantees
// ---------------------------------------------------------------------------

describe('buildTheme immutability', () => {
  test('mutation in child does not affect the base', () => {
    const base = buildTheme({
      overrides: { core: { colors: { brand: { 500: '#111' } } } },
    });
    const child = buildTheme({
      base,
      overrides: { core: { radii: { sm: '10px' } } },
    });
    child.core.colors.brand[500] = '#MUTATED';
    expect(base.core.colors.brand[500]).toBe('#111');
  });

  test('mutation does not affect defaultTheme', () => {
    const theme = buildTheme();
    const originalBrand500 = defaultTheme.core.colors.brand[500];
    theme.core.colors.brand[500] = '#MUTATED';
    expect(defaultTheme.core.colors.brand[500]).toBe(originalBrand500);
  });

  test('non-overridden branch is not the same reference as base', () => {
    const theme = buildTheme();
    expect(Object.is(theme.semantic, defaultTheme.semantic)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createTheme
// ---------------------------------------------------------------------------

describe('createTheme', () => {
  test('returns valid bundle with defaults', () => {
    const bundle = createTheme();
    expect(bundle.baseMode).toBe('light');
    expect(bundle.base).toEqual(defaultTheme);
    expect(bundle.alternate).toEqual(darkAlternate);
  });

  test('alternate: null produces a single-mode theme', () => {
    const bundle = createTheme({ alternate: null });
    expect(bundle.alternate).toBeUndefined();
  });

  test('respects baseMode parameter', () => {
    const bundle = createTheme({ baseMode: 'dark' });
    expect(bundle.baseMode).toBe('dark');
  });

  test('applies overrides to base', () => {
    const bundle = createTheme({
      overrides: { core: { colors: { brand: { 500: '#FF0000' } } } },
    });
    expect(bundle.base.core.colors.brand[500]).toBe('#FF0000');
    expect(bundle.base.core.colors.brand[100]).toBe(
      defaultTheme.core.colors.brand[100]
    );
  });

  test('passes alternate through', () => {
    const alt: ModeOverride = {
      semantic: {
        colors: {
          content: {
            primary: { text: { default: '{core.colors.neutral.0}' } },
          },
        },
      },
    };
    const bundle = createTheme({ alternate: alt });
    expect(bundle.alternate).toEqual(alt);
  });

  test('baseBundle has light baseMode and a dark alternate', () => {
    expect(baseBundle.baseMode).toBe('light');
    expect(baseBundle.alternate).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// createTheme — extends inheritance
// ---------------------------------------------------------------------------

describe('createTheme — extends', () => {
  test('inherits base tokens from parent bundle', () => {
    const child = createTheme({ extends: baseBundle });
    expect(child.base).toEqual(baseBundle.base);
  });

  test('inherits alternate from parent bundle', () => {
    const child = createTheme({ extends: baseBundle });
    expect(child.alternate).toEqual(baseBundle.alternate);
  });

  test('inherits baseMode from parent bundle', () => {
    const child = createTheme({ extends: baseBundle });
    expect(child.baseMode).toBe(baseBundle.baseMode);
  });

  test('overrides take precedence over parent base tokens', () => {
    const brandColor = '#DEADBE';
    const child = createTheme({
      extends: baseBundle,
      overrides: { core: { colors: { brand: { 500: brandColor } } } },
    });
    expect(child.base.core.colors.brand[500]).toBe(brandColor);
    expect(baseBundle.base.core.colors.brand[500]).not.toBe(brandColor);
  });

  test('explicit alternate overrides the inherited one', () => {
    const customAlternate = { semantic: {} as never };
    const child = createTheme({
      extends: baseBundle,
      alternate: customAlternate,
    });
    expect(child.alternate).toBe(customAlternate);
  });
});

// ---------------------------------------------------------------------------
// Themes & bundles registry
// ---------------------------------------------------------------------------

describe('Theme and bundle exports', () => {
  test('baseTheme matches the default theme', () => {
    expect(baseBundle.base).toEqual(defaultTheme);
  });

  test('baseBundle has a default base and baseMode', () => {
    expect(baseBundle.base).toBeDefined();
    expect(baseBundle.baseMode).toBe('light');
  });
});

// ---------------------------------------------------------------------------
// withDataviz
// ---------------------------------------------------------------------------

describe('withDataviz', () => {
  test('preserves bundle.alternate as the same reference', () => {
    const result = withDataviz(baseBundle);
    expect(result.alternate).toBe(baseBundle.alternate);
  });

  test('adds dataviz tokens to base', () => {
    const result = withDataviz(baseBundle);
    expect(result.base.core).toBeDefined();
    // core.dataviz is present after extension
    const core = result.base.core as unknown as Record<string, unknown>;
    expect(core.dataviz).toBeDefined();
  });

  test('returns a new bundle object without mutating the original', () => {
    const original = baseBundle;
    const result = withDataviz(original);
    expect(result).not.toBe(original);
    expect(original.base).toEqual(baseBundle.base);
  });

  test('preserves baseMode from the original bundle', () => {
    const result = withDataviz(baseBundle);
    expect(result.baseMode).toBe(baseBundle.baseMode);
  });
});
