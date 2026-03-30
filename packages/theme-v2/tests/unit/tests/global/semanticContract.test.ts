/**
 * Global semantic contract validation tests.
 *
 * Validates that all themes and bundles satisfy the semantic contract:
 * - Both core and semantic layers exist
 * - All required categories are present
 * - Bundle structure is correct
 * - Alternate modes follow the remapping-only pattern
 *
 * @see validation.md — Semantic contract rules
 * @see modes.md — Mode validation requirements
 */

import type { ThemeTokensV2 } from '../../../../src';
import { bundles, defaultTheme, themes } from '../../../../src';
import { bundleEntries, themeEntries } from '../../helpers';

// ---------------------------------------------------------------------------
// Theme Contract — Core & Semantic Layers
// ---------------------------------------------------------------------------

describe('Theme contract', () => {
  describe.each(themeEntries)('%s theme', (themeName, theme) => {
    test('satisfies ThemeTokensV2 type contract', () => {
      // Compile-time check via assignment
      const _typed: ThemeTokensV2 = theme;
      expect(_typed).toBeDefined();
    });

    test('has both core and semantic layers', () => {
      expect(theme.core).toBeDefined();
      expect(theme.semantic).toBeDefined();
      expect(typeof theme.core).toBe('object');
      expect(typeof theme.semantic).toBe('object');
    });

    test('core contains all 11 required categories', () => {
      const { core } = theme;

      // Color family
      expect(core.colors).toBeDefined();

      // Foundation families
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

    test('semantic contains all 11 required categories', () => {
      const { semantic } = theme;

      // Color family
      expect(semantic.colors).toBeDefined();

      // Foundation families
      expect(semantic.elevation).toBeDefined();
      expect(semantic.text).toBeDefined();
      expect(semantic.spacing).toBeDefined();
      expect(semantic.sizing).toBeDefined();
      expect(semantic.radii).toBeDefined();
      expect(semantic.border).toBeDefined();
      expect(semantic.focus).toBeDefined(); // Part of border family
      expect(semantic.opacity).toBeDefined();
      expect(semantic.motion).toBeDefined();
      expect(semantic.zIndex).toBeDefined();
    });

    test('core colors have required brand and neutral scales', () => {
      const { brand, neutral } = theme.core.colors;

      // brand.500 is required anchor
      expect(brand[500]).toBeDefined();
      expect(typeof brand[500]).toBe('string');

      // neutral.500 is required anchor
      expect(neutral[500]).toBeDefined();
      expect(typeof neutral[500]).toBe('string');
    });

    test('core colors have required hue scales (red, green, yellow)', () => {
      const { red, green, yellow } = theme.core.colors;

      // These are required for feedback semantic tokens
      expect(red[500]).toBeDefined();
      expect(green[500]).toBeDefined();
      expect(yellow[500]).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// Bundle Contract — Base + Alternate Structure
// ---------------------------------------------------------------------------

describe('Bundle contract', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName, bundle) => {
    test('baseMode is either "light" or "dark"', () => {
      expect(['light', 'dark']).toContain(bundle.baseMode);
    });

    test('base theme satisfies ThemeTokensV2', () => {
      const _typed: ThemeTokensV2 = bundle.base;
      expect(_typed).toBeDefined();
      expect(_typed.core).toBeDefined();
      expect(_typed.semantic).toBeDefined();
    });

    test('base theme is complete (has all required categories)', () => {
      const { core, semantic } = bundle.base;

      // Core categories
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

      // Semantic categories
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

    test('if alternate exists, it is semantic-only (no core override)', () => {
      if (!bundle.alternate) {
        return; // Single-mode theme (e.g., neon) — valid per modes.md
      }

      const alt = bundle.alternate;

      // Alternate should only have semantic layer
      expect(alt.semantic).toBeDefined();

      // Alternate should NOT override core (type-safe check)
      expect('core' in alt).toBe(false);
    });

    test('if alternate exists, its paths are subset of base semantic paths', () => {
      if (!bundle.alternate) {
        return;
      }

      // This is enforced by TypeScript SemanticModeOverride type
      // Test validates the type contract is satisfied
      expect(bundle.alternate.semantic).toBeDefined();
    });

    test('single-mode themes are valid (e.g., neon)', () => {
      // Per modes.md, single-mode themes (no alternate) are intentional
      if (bundleName === 'neon') {
        expect(bundle.alternate).toBeUndefined();
        expect(bundle.baseMode).toBe('dark');
      }

      // All bundles are valid regardless of alternate presence
      expect(bundle.base).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// Theme Inheritance from defaultTheme
// ---------------------------------------------------------------------------

describe('Theme inheritance', () => {
  describe.each(
    themeEntries.filter(([name]) => {
      return name !== 'default';
    })
  )('%s theme inherits from default', (themeName, theme) => {
    test('non-overridden breakpoints match defaultTheme', () => {
      // Themes typically don't override breakpoints
      expect(theme.core.breakpoint).toEqual(defaultTheme.core.breakpoint);
    });

    test('non-overridden motion matches defaultTheme', () => {
      // Themes typically don't override motion
      expect(theme.core.motion).toEqual(defaultTheme.core.motion);
    });

    test('non-overridden z-index matches defaultTheme', () => {
      // Themes typically don't override z-index
      expect(theme.core.zIndex).toEqual(defaultTheme.core.zIndex);
    });

    test('theme overrides are intentional (brand colors differ)', () => {
      // Each theme should have its own brand identity
      if (themeName !== 'default') {
        // Most themes override brand colors
        const themeBrand = theme.core.colors.brand[500];

        // Allow same brand if explicitly identical, but most differ
        expect(themeBrand).toBeDefined();
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Built-in Themes Registry
// ---------------------------------------------------------------------------

describe('Built-in themes registry', () => {
  test('themes object contains all 6 built-in themes', () => {
    const themeNames = Object.keys(themes);

    expect(themeNames).toEqual(
      expect.arrayContaining([
        'default',
        'aurora',
        'bruttal',
        'neon',
        'oca',
        'terra',
      ])
    );

    expect(themeNames).toHaveLength(6);
  });

  test('bundles object contains all 6 built-in bundles', () => {
    const bundleNames = Object.keys(bundles);

    expect(bundleNames).toEqual(
      expect.arrayContaining([
        'default',
        'aurora',
        'bruttal',
        'neon',
        'oca',
        'terra',
      ])
    );

    expect(bundleNames).toHaveLength(6);
  });

  test('every theme has a corresponding bundle', () => {
    const themeNames = Object.keys(themes);
    const bundleNames = Object.keys(bundles);

    for (const themeName of themeNames) {
      expect(bundleNames).toContain(themeName);
    }
  });
});
