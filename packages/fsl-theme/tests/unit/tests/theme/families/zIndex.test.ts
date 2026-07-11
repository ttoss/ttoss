/**
 * Z-Index family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/z-index.md#validation
 */

import { themeFlatToTest } from '../../../fixtures/theme';

// ---------------------------------------------------------------------------
// Test bundles — extend when new theme bundles are added
// ---------------------------------------------------------------------------

const bundleEntries: ReadonlyArray<{
  label: string;
  base: Record<string, string | number>;
}> = [{ label: 'default', base: themeFlatToTest }];

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

describe.each(bundleEntries)('Z-Index errors — $label', ({ base }) => {
  // Error #1: core level order — any level.N >= level.N+1 is a violation
  test('core: levels are strictly increasing', () => {
    const levels = extractCoreLevels(base);
    for (let i = 0; i < levels.length - 1; i++) {
      expect(levels[i]).toBeLessThan(levels[i + 1]);
    }
  });

  // Error #2: core.zIndex.level.0 resolves below 0
  test('core: level.0 is non-negative', () => {
    const levels = extractCoreLevels(base);
    expect(levels[0]).toBeGreaterThanOrEqual(0);
  });

  // Error #3: semantic layer order — darkAlternate does not override semantic.zIndex
  test('semantic: layers are strictly increasing', () => {
    const layers = extractSemanticLayers(base);
    expect(layers.base).toBeLessThan(layers.sticky);
    expect(layers.sticky).toBeLessThan(layers.overlay);
    expect(layers.overlay).toBeLessThan(layers.blocking);
    expect(layers.blocking).toBeLessThan(layers.transient);
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
