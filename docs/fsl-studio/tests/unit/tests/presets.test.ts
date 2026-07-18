import { toFlatTokens } from '@ttoss/fsl-theme/css';
import { contrastRatio } from 'src/studio/theme/palette';
import {
  AUTHORED_PRESETS,
  findPreset,
  presetBundle,
  PRESETS,
} from 'src/studio/theme/presets';

describe('preset catalog', () => {
  test('ships base, bruttal, and the style-reference starting points', () => {
    const ids = PRESETS.map((preset) => {
      return preset.id;
    });
    expect(ids).toEqual([
      'base',
      'bruttal',
      'minimalist',
      'neobrutalism',
      'glass',
      'nineties',
    ]);
  });

  test('findPreset resolves known ids and rejects unknown ones', () => {
    expect(findPreset('glass')?.label).toBe('Glass');
    expect(findPreset('vaporwave')).toBeUndefined();
  });
});

describe('preset bundles', () => {
  test.each(
    PRESETS.map((preset) => {
      return [preset.id] as const;
    })
  )('%s builds, resolves cleanly, and keeps a dark alternate', (id) => {
    const bundle = presetBundle(id);
    // strict: throws on any unresolved ref — authored remaps must be valid.
    expect(() => {
      return toFlatTokens(bundle.base, { strict: true });
    }).not.toThrow();
    expect(bundle.alternate).toBeDefined();
  });

  test('bundles are cached per preset', () => {
    expect(presetBundle('minimalist')).toBe(presetBundle('minimalist'));
  });

  test('authored presets carry their brand scale and brief', () => {
    const neo = presetBundle('neobrutalism');
    expect(neo.base.core.colors.brand[500]).toBe('#6d28d9');
    expect(neo.meta?.name).toBe('neobrutalism');
    expect(neo.base.semantic.radii.control).toBe('{core.radii.none}');
  });

  test.each(Object.keys(AUTHORED_PRESETS))(
    '%s brand.500 keeps ≥ 4.5:1 on white (AA filled surfaces)',
    (id) => {
      const authored = AUTHORED_PRESETS[id as keyof typeof AUTHORED_PRESETS];
      const brand = (
        authored?.overrides.core?.colors as Record<
          string,
          Record<string, string>
        >
      ).brand;
      const ratio = contrastRatio(brand[500], '#ffffff');
      expect(ratio).not.toBeNull();
      expect(ratio as number).toBeGreaterThanOrEqual(4.5);
    }
  );
});
