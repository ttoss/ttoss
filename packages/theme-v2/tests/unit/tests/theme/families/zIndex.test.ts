/**
 * Z-Index family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/z-index.md#validation
 */

import { themeAltFlatToTest, themeFlatToTest } from '../../../helpers/theme';

// ---------------------------------------------------------------------------
// Test bundles — extend when new theme bundles are added
// ---------------------------------------------------------------------------

const bundleEntries: ReadonlyArray<{
  label: string;
  base: Record<string, string | number>;
  alt?: Record<string, string | number>;
}> = [{ label: 'default', base: themeFlatToTest, alt: themeAltFlatToTest }];

// ---------------------------------------------------------------------------
// Helpers — resolve numeric z-index values from flat token maps
// ---------------------------------------------------------------------------

const extractCoreLevels = (tokens: Record<string, string | number>) => {
  return [0, 1, 2, 3, 4].map((n) => {
    return Number(tokens[`core.zIndex.level.${n}`]);
  });
};

const extractSemanticLayers = (tokens: Record<string, string | number>) => {
  return {
    base: Number(tokens['semantic.zIndex.layer.base']),
    sticky: Number(tokens['semantic.zIndex.layer.sticky']),
    overlay: Number(tokens['semantic.zIndex.layer.overlay']),
    blocking: Number(tokens['semantic.zIndex.layer.blocking']),
    transient: Number(tokens['semantic.zIndex.layer.transient']),
  };
};

// ---------------------------------------------------------------------------
// Error tests — layer order contracts that must never be violated
// ---------------------------------------------------------------------------

describe.each(bundleEntries)('Z-Index errors — $label', ({ base, alt }) => {
  const modes = [
    { mode: 'base', tokens: base },
    ...(alt !== undefined ? [{ mode: 'alt', tokens: alt }] : []),
  ];

  // Core errors tested against base only — alternate mode does not override core tokens.

  // Error #1: core z-index order breaks — level.0 >= level.1, level.1 >= level.2, level.2 >= level.3, level.3 >= level.4
  test('core: level.0 < level.1', () => {
    const levels = extractCoreLevels(base);
    expect(levels[0]).toBeLessThan(levels[1]);
  });

  // Error #1
  test('core: level.1 < level.2', () => {
    const levels = extractCoreLevels(base);
    expect(levels[1]).toBeLessThan(levels[2]);
  });

  // Error #1
  test('core: level.2 < level.3', () => {
    const levels = extractCoreLevels(base);
    expect(levels[2]).toBeLessThan(levels[3]);
  });

  // Error #1
  test('core: level.3 < level.4', () => {
    const levels = extractCoreLevels(base);
    expect(levels[3]).toBeLessThan(levels[4]);
  });

  // Error #2: core.zIndex.level.0 resolves below 0
  test('core: level.0 is non-negative', () => {
    const levels = extractCoreLevels(base);
    expect(levels[0]).toBeGreaterThanOrEqual(0);
  });

  describe.each(modes)('$mode mode', ({ tokens }) => {
    // Error #3: semantic layer order breaks — z.layer.base >= z.layer.sticky, sticky >= overlay, overlay >= blocking, blocking >= transient
    test('semantic: base < sticky', () => {
      const layers = extractSemanticLayers(tokens);
      expect(layers.base).toBeLessThan(layers.sticky);
    });

    // Error #3
    test('semantic: sticky < overlay', () => {
      const layers = extractSemanticLayers(tokens);
      expect(layers.sticky).toBeLessThan(layers.overlay);
    });

    // Error #3
    test('semantic: overlay < blocking', () => {
      const layers = extractSemanticLayers(tokens);
      expect(layers.overlay).toBeLessThan(layers.blocking);
    });

    // Error #3
    test('semantic: blocking < transient', () => {
      const layers = extractSemanticLayers(tokens);
      expect(layers.blocking).toBeLessThan(layers.transient);
    });
  });
});

// ---------------------------------------------------------------------------
// Warning tests — conditions that signal design quality degradation
// ---------------------------------------------------------------------------

describe.each(bundleEntries)('Z-Index warnings — $label', ({ base }) => {
  // Warning #1: adjacent core z-index levels differ by less than 10
  // Tested against base only — alternate mode does not override core tokens.
  test('core: adjacent levels must differ by at least 10', () => {
    const levels = extractCoreLevels(base);
    for (let i = 0; i < levels.length - 1; i++) {
      expect(levels[i + 1] - levels[i]).toBeGreaterThanOrEqual(10);
    }
  });
});
