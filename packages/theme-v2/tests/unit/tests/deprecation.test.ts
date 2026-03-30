/**
 * Deprecation metadata validation tests.
 *
 * Validates that:
 * 1. Themes without $deprecated metadata return empty results
 * 2. Deprecated tokens that still resolve are reported correctly
 * 3. Deprecated tokens with valid replacements are flagged
 * 4. Deprecated tokens that no longer resolve are caught
 * 5. Missing replacements are detected
 * 6. All current themes have no deprecated tokens (baseline)
 *
 * @see REFACTOR.md Gap 6 — Deprecation metadata support
 */

import { defaultTheme, themes } from '../../../src';
import { validateDeprecations } from '../../../src/roots/validateDeprecations';
import type { DeprecationEntry, ThemeTokensV2 } from '../../../src/Types';

// ---------------------------------------------------------------------------
// Current themes — no deprecations expected
// ---------------------------------------------------------------------------

describe('validateDeprecations: current themes', () => {
  test.each(Object.entries(themes))(
    '%s has no deprecated tokens',
    (_name, theme) => {
      const results = validateDeprecations(theme);
      expect(results).toEqual([]);
    }
  );
});

// ---------------------------------------------------------------------------
// Synthetic themes — validate deprecation logic
// ---------------------------------------------------------------------------

describe('validateDeprecations: synthetic scenarios', () => {
  test('returns empty array when $deprecated is undefined', () => {
    const theme = { ...defaultTheme };
    delete theme.$deprecated;
    expect(validateDeprecations(theme)).toEqual([]);
  });

  test('returns empty array when $deprecated is empty', () => {
    const theme: ThemeTokensV2 = { ...defaultTheme, $deprecated: {} };
    expect(validateDeprecations(theme)).toEqual([]);
  });

  test('deprecated token that still resolves is reported as resolving', () => {
    const theme: ThemeTokensV2 = {
      ...defaultTheme,
      $deprecated: {
        'core.colors.brand.500': {
          since: '2.0.0',
          reason: 'Testing — this token exists in default theme.',
        },
      },
    };

    const results = validateDeprecations(theme);
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe('core.colors.brand.500');
    expect(results[0].resolves).toBe(true);
    expect(results[0].replacementExists).toBeNull();
  });

  test('deprecated token with valid replacement', () => {
    const theme: ThemeTokensV2 = {
      ...defaultTheme,
      $deprecated: {
        'core.colors.brand.500': {
          since: '2.0.0',
          replacement: 'core.colors.brand.700',
          reason: 'Moved to darker variant.',
          removalVersion: '3.0.0',
        },
      },
    };

    const results = validateDeprecations(theme);
    expect(results).toHaveLength(1);
    expect(results[0].resolves).toBe(true);
    expect(results[0].replacementExists).toBe(true);
    expect(results[0].entry.removalVersion).toBe('3.0.0');
  });

  test('deprecated token with non-existent replacement is flagged', () => {
    const theme: ThemeTokensV2 = {
      ...defaultTheme,
      $deprecated: {
        'core.colors.brand.500': {
          since: '2.0.0',
          replacement: 'core.colors.brand.9999',
        },
      },
    };

    const results = validateDeprecations(theme);
    expect(results).toHaveLength(1);
    expect(results[0].resolves).toBe(true);
    expect(results[0].replacementExists).toBe(false);
  });

  test('deprecated token that no longer resolves is caught', () => {
    const theme: ThemeTokensV2 = {
      ...defaultTheme,
      $deprecated: {
        'semantic.colors.nonexistent.token.path': {
          since: '2.0.0',
          reason: 'This path does not exist in the theme.',
        },
      },
    };

    const results = validateDeprecations(theme);
    expect(results).toHaveLength(1);
    expect(results[0].resolves).toBe(false);
  });

  test('multiple deprecated tokens are all reported', () => {
    const theme: ThemeTokensV2 = {
      ...defaultTheme,
      $deprecated: {
        'core.colors.brand.500': {
          since: '2.0.0',
        },
        'core.colors.brand.700': {
          since: '2.0.0',
          replacement: 'core.colors.brand.500',
        },
        'semantic.colors.nonexistent.path': {
          since: '2.0.0',
        },
      },
    };

    const results = validateDeprecations(theme);
    expect(results).toHaveLength(3);

    const resolving = results.filter((r) => {
      return r.resolves;
    });
    const broken = results.filter((r) => {
      return !r.resolves;
    });
    expect(resolving).toHaveLength(2);
    expect(broken).toHaveLength(1);
  });
});
