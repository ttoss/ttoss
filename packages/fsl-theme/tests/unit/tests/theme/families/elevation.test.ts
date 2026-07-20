/**
 * Elevation family validation tests.
 *
 * @see /docs/website/docs/design/design-system/design-tokens/families/elevation.md#validation
 */

import { themeAltFlatToTest, themeFlatToTest } from '../../../fixtures/theme';

// ---------------------------------------------------------------------------
// Test bundles — extend when new theme bundles are added
// ---------------------------------------------------------------------------

const bundleEntries: ReadonlyArray<{
  label: string;
  base: Record<string, string | number>;
}> = [{ label: 'default', base: themeFlatToTest }];

// ---------------------------------------------------------------------------
// Helpers — shadow depth comparison for elevation assertions
// ---------------------------------------------------------------------------

/**
 * Parse a CSS box-shadow value into a rough "depth" metric.
 * Sum of (blur-radius + max offset) across all shadow layers.
 * Handles blur-based and hard-edge offset-based shadow styles.
 * Returns 0 for 'none', '0', or empty values.
 */
const parseShadowDepth = (shadow: string | number): number => {
  const str = String(shadow).trim();
  if (str === 'none' || str === '0' || str === '') return 0;

  let totalDepth = 0;
  for (const single of str.split(',')) {
    const numbers = single.match(/-?\d+(?:\.\d+)?/g);
    if (numbers && numbers.length >= 2) {
      const offsetX = Math.abs(parseFloat(numbers[0]));
      const offsetY = Math.abs(parseFloat(numbers[1]));
      const blur = numbers.length >= 3 ? Math.abs(parseFloat(numbers[2])) : 0;
      totalDepth += blur + Math.max(offsetX, offsetY);
    }
  }
  return totalDepth;
};

const isVisibleShadow = (shadow: string | number): boolean => {
  const str = String(shadow).trim();
  return str !== 'none' && str !== '0' && str !== '';
};

// ---------------------------------------------------------------------------
// Error tests — surface stratum contracts that must never be violated
// ---------------------------------------------------------------------------

describe.each(bundleEntries)('Elevation errors — $label', ({ base }) => {
  // darkAlternate does not override semantic.elevation; tested against base tokens only.

  // Error #1: elevation.surface.flat resolves to a visible shadow recipe instead of no elevation
  test('flat must not be a visible shadow', () => {
    expect(String(base['semantic.elevation.surface.flat']).trim()).toBe('none');
  });

  // Error #2: raised, overlay, and blocking resolve to none, 0, or equivalent non-visible value
  test('raised must be a visible shadow', () => {
    expect(isVisibleShadow(base['semantic.elevation.surface.raised'])).toBe(
      true
    );
  });

  // Error #2
  test('overlay must be a visible shadow', () => {
    expect(isVisibleShadow(base['semantic.elevation.surface.overlay'])).toBe(
      true
    );
  });

  // Error #2
  test('blocking must be a visible shadow', () => {
    expect(isVisibleShadow(base['semantic.elevation.surface.blocking'])).toBe(
      true
    );
  });

  // Error #3: semantic depth order breaks — flat < raised < overlay < blocking required
  test('flat depth must be less than raised', () => {
    expect(
      parseShadowDepth(base['semantic.elevation.surface.flat'])
    ).toBeLessThan(parseShadowDepth(base['semantic.elevation.surface.raised']));
  });

  // Error #3
  test('raised depth must be less than overlay', () => {
    expect(
      parseShadowDepth(base['semantic.elevation.surface.raised'])
    ).toBeLessThan(
      parseShadowDepth(base['semantic.elevation.surface.overlay'])
    );
  });

  // Error #3
  test('overlay depth must be less than blocking', () => {
    expect(
      parseShadowDepth(base['semantic.elevation.surface.overlay'])
    ).toBeLessThan(
      parseShadowDepth(base['semantic.elevation.surface.blocking'])
    );
  });
});

// ---------------------------------------------------------------------------
// Tonal surface tests — the "surface colour at depth" half of Surface + Shadow
// (elevation.md). Dark depth is carried here, not by the near-invisible
// emphatic shadows on a near-black canvas (ADR-018).
// ---------------------------------------------------------------------------

/** Relative luminance (0 = black … 1 = white) of a #rrggbb colour. */
const luminance = (hex: string): number => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return NaN;
  const n = parseInt(m[1], 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = channel((n >> 16) & 0xff);
  const g = channel((n >> 8) & 0xff);
  const b = channel(n & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

describe('Elevation tonal — surface colour at depth', () => {
  const strata = ['raised', 'overlay', 'blocking'] as const;

  test('base ships a tonal token for every shadowed stratum', () => {
    for (const stratum of strata) {
      const value = themeFlatToTest[`semantic.elevation.tonal.${stratum}`];
      expect(typeof value).toBe('string');
      expect(String(value)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  test('dark tonal surfaces sit above (lighter than) the dark canvas', () => {
    expect(themeAltFlatToTest).toBeDefined();
    const alt = themeAltFlatToTest as Record<string, string | number>;
    // The dark canvas is the primary informational background.
    const canvas = luminance(
      String(alt['semantic.colors.informational.primary.background.default'])
    );
    for (const stratum of strata) {
      const surface = luminance(
        String(alt[`semantic.elevation.tonal.${stratum}`])
      );
      expect(surface).toBeGreaterThan(canvas);
    }
  });

  test('dark tonal ramp does not darken as strata rise (raised ≤ overlay ≤ blocking)', () => {
    const alt = themeAltFlatToTest as Record<string, string | number>;
    const raised = luminance(String(alt['semantic.elevation.tonal.raised']));
    const overlay = luminance(String(alt['semantic.elevation.tonal.overlay']));
    const blocking = luminance(
      String(alt['semantic.elevation.tonal.blocking'])
    );
    expect(overlay).toBeGreaterThanOrEqual(raised);
    expect(blocking).toBeGreaterThanOrEqual(overlay);
  });
});

// ---------------------------------------------------------------------------
// Warning tests — conditions that signal design quality degradation
// ---------------------------------------------------------------------------

describe.each(bundleEntries)('Elevation warnings — $label', ({ base }) => {
  // darkAlternate does not override semantic.elevation; tested against base tokens only.

  // Warning #1: adjacent semantic strata resolve to the same effective elevation contract
  test('Warning #1 — flat and raised must not share equal depth', () => {
    expect(parseShadowDepth(base['semantic.elevation.surface.flat'])).not.toBe(
      parseShadowDepth(base['semantic.elevation.surface.raised'])
    );
  });

  // Warning #1
  test('Warning #1 — raised and overlay must not share equal depth', () => {
    expect(
      parseShadowDepth(base['semantic.elevation.surface.raised'])
    ).not.toBe(parseShadowDepth(base['semantic.elevation.surface.overlay']));
  });

  // Warning #1
  test('Warning #1 — overlay and blocking must not share equal depth', () => {
    expect(
      parseShadowDepth(base['semantic.elevation.surface.overlay'])
    ).not.toBe(parseShadowDepth(base['semantic.elevation.surface.blocking']));
  });

  // Warning #2: adjacent core elevation levels resolve to the same effective shadow recipe.
  // Tested against base tokens only — alternate mode does not override core tokens.
  // Keys are sorted numerically so the adjacency check is order-stable regardless
  // of how many levels the theme defines.
  test('Warning #2 — adjacent core levels must not share equal depth', () => {
    const levelKeys = Object.keys(base)
      .filter((k) => {
        return k.startsWith('core.elevation.level.');
      })
      .sort((a, b) => {
        return Number(a.split('.').pop()) - Number(b.split('.').pop());
      });
    const depths = levelKeys.map((k) => {
      return parseShadowDepth(base[k]);
    });
    for (let i = 0; i < depths.length - 1; i++) {
      expect(depths[i]).not.toBe(depths[i + 1]);
    }
  });

  // Warning #3: adjacent emphatic ramp levels resolve to the same effective shadow recipe.
  // The emphatic ramp is optional — skip if the theme does not define it.
  test('Warning #3 — adjacent emphatic levels must not share equal depth', () => {
    const emphaticKeys = Object.keys(base)
      .filter((k) => {
        return k.startsWith('core.elevation.emphatic.');
      })
      .sort((a, b) => {
        return Number(a.split('.').pop()) - Number(b.split('.').pop());
      });
    if (emphaticKeys.length < 2) return;
    const depths = emphaticKeys.map((k) => {
      return parseShadowDepth(base[k]);
    });
    for (let i = 0; i < depths.length - 1; i++) {
      expect(depths[i]).not.toBe(depths[i + 1]);
    }
  });
});
