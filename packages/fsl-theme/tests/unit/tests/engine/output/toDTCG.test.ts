import { baseTheme as defaultTheme } from '../../../../../src/baseTheme';
import type { DTCGToken, DTCGTokenTree } from '../../../../../src/roots/toDTCG';
import { toDTCG } from '../../../../../src/roots/toDTCG';
import { bruttal } from '../../../../../src/themes/bruttal';

/** Collect every leaf (path → token) from a DTCG tree. */
const collectLeaves = (
  tree: DTCGTokenTree,
  path = ''
): { path: string; token: DTCGToken }[] => {
  // A DTCG leaf is identified by `$value`. `$type` is optional (omitted for
  // opaque tokens), so it must not be part of the leaf test.
  return '$value' in tree
    ? [{ path, token: tree as DTCGToken }]
    : Object.entries(tree as Record<string, DTCGTokenTree>).flatMap(
        ([key, child]) => {
          return collectLeaves(child, path ? `${path}.${key}` : key);
        }
      );
};

/** The complete set of valid W3C DTCG (2025.10) `$type` names. */
const VALID_DTCG_TYPES = new Set([
  'color',
  'dimension',
  'fontFamily',
  'fontWeight',
  'duration',
  'cubicBezier',
  'number',
  'strokeStyle',
  'border',
  'transition',
  'shadow',
  'gradient',
  'typography',
]);

describe('toDTCG', () => {
  const leaves = collectLeaves(toDTCG(defaultTheme));
  const leafAt = (path: string) => {
    return leaves.find((l) => {
      return l.path === path;
    })?.token;
  };

  // ---------------------------------------------------------------------------
  // Structural invariant — every leaf has resolved $value (no {ref}) and $type
  // ---------------------------------------------------------------------------

  test('every leaf has concrete $value (no {ref}); $type is a valid DTCG type when present', () => {
    expect(leaves.length).toBeGreaterThan(0);
    for (const { token } of leaves) {
      expect(['string', 'number']).toContain(typeof token.$value);
      // $type is optional; when present it MUST be a valid DTCG type — never
      // an invalid one like 'string'.
      if (token.$type !== undefined) {
        expect(VALID_DTCG_TYPES).toContain(token.$type);
      }
      if (typeof token.$value === 'string') {
        expect(token.$value).not.toMatch(/^\{.+\}$/);
      }
    }
  });

  test('no leaf emits an invalid $type (e.g. the non-DTCG "string")', () => {
    const invalid = leaves.filter((l) => {
      return (
        l.token.$type !== undefined && !VALID_DTCG_TYPES.has(l.token.$type)
      );
    });
    expect(
      invalid.map((l) => {
        return `${l.path}: ${l.token.$type}`;
      })
    ).toEqual([]);
  });

  test('opaque tokens (easing, font keywords, border style) omit $type', () => {
    const opaquePrefixes = [
      'core.motion.easing.',
      'core.font.optical.',
      'core.font.numeric.',
      'core.border.style.',
    ];
    const opaque = leaves.filter((l) => {
      return opaquePrefixes.some((p) => {
        return l.path.startsWith(p);
      });
    });
    expect(opaque.length).toBeGreaterThan(0);
    for (const { token } of opaque) {
      expect(token.$type).toBeUndefined();
    }
  });

  test('border and focus line widths are typed dimension (.width suffix override)', () => {
    const widthLeaves = leaves.filter((l) => {
      return (
        (l.path.startsWith('semantic.border.') ||
          l.path.startsWith('semantic.focus.')) &&
        l.path.endsWith('.width')
      );
    });
    expect(widthLeaves.length).toBeGreaterThan(0);
    for (const { token } of widthLeaves) {
      expect(token.$type).toBe('dimension');
    }
  });

  // ---------------------------------------------------------------------------
  // $type prefix-family coverage — every leaf in a path family has the registry type
  // Tests the class (all members), not a single case from each family.
  // ---------------------------------------------------------------------------

  test.each([
    ['core.colors.', 'color'],
    ['core.spacing.', 'dimension'],
    ['core.elevation.level.', 'shadow'],
    ['core.opacity.', 'number'],
    ['core.motion.duration.', 'duration'],
    ['core.font.weight.', 'fontWeight'],
    ['core.font.leading.', 'number'],
    ['core.font.tracking.', 'dimension'],
  ] as const)(
    'every leaf under prefix %s has $type %s',
    (prefix, expectedType) => {
      const family = leaves.filter((l) => {
        return l.path.startsWith(prefix);
      });
      expect(family.length).toBeGreaterThan(0);
      for (const { token } of family) {
        expect(token.$type).toBe(expectedType);
      }
    }
  );

  // ---------------------------------------------------------------------------
  // $type suffix overrides — suffix beats the 'string' prefix fallback
  // ---------------------------------------------------------------------------

  // .duration overrides semantic.motion. → string for every motion subtree leaf
  test('all semantic.motion leaves ending in .duration have $type duration', () => {
    const durationLeaves = leaves.filter((l) => {
      return (
        l.path.startsWith('semantic.motion.') && l.path.endsWith('.duration')
      );
    });
    expect(durationLeaves.length).toBeGreaterThan(0);
    for (const { token } of durationLeaves) {
      expect(token.$type).toBe('duration');
    }
  });

  // typography suffix overrides beat semantic.text. → string for every family/step
  test.each([
    ['.fontFamily', 'fontFamily'],
    ['.fontWeight', 'fontWeight'],
    ['.lineHeight', 'number'],
    ['.letterSpacing', 'dimension'],
    ['.fontSize', 'dimension'],
  ] as const)(
    'all semantic.text leaves ending in %s have $type %s',
    (suffix, expectedType) => {
      const textLeaves = leaves.filter((l) => {
        return l.path.startsWith('semantic.text.') && l.path.endsWith(suffix);
      });
      expect(textLeaves.length).toBeGreaterThan(0);
      for (const { token } of textLeaves) {
        expect(token.$type).toBe(expectedType);
      }
    }
  );

  // .ring.color suffix overrides semantic.focus. → string (only one such leaf)
  test('semantic.focus.ring.color has $type color (.ring.color suffix overrides semantic.focus. → string)', () => {
    expect(leafAt('semantic.focus.ring.color')?.$type).toBe('color');
  });

  // ---------------------------------------------------------------------------
  // Multi-theme coverage — all built-in themes produce valid DTCG trees
  // ---------------------------------------------------------------------------

  test.each([
    ['baseTheme', defaultTheme],
    ['bruttal', bruttal.base],
  ] as const)(
    'toDTCG(%s) produces a valid DTCG tree: $value present, $type valid-or-absent, no refs',
    (_label, theme) => {
      const themeLeaves = collectLeaves(toDTCG(theme));
      expect(themeLeaves.length).toBeGreaterThan(50);
      for (const { token } of themeLeaves) {
        expect(['string', 'number']).toContain(typeof token.$value);
        if (token.$type !== undefined) {
          expect(VALID_DTCG_TYPES).toContain(token.$type);
        }
        if (typeof token.$value === 'string') {
          expect(token.$value).not.toMatch(/^\{.+\}$/);
        }
      }
    }
  );

  // ---------------------------------------------------------------------------
  // $extensions — coarse-pointer hit target metadata
  // ---------------------------------------------------------------------------

  describe('coarse-pointer $extensions', () => {
    test('every semantic.sizing.hit step has com.ttoss.pointer-override with the correct coarse value', () => {
      for (const step of ['min', 'base', 'prominent'] as const) {
        expect(
          leafAt(`semantic.sizing.hit.${step}`)?.$extensions?.[
            'com.ttoss.pointer-override'
          ]
        ).toEqual({
          condition: 'any-pointer: coarse',
          value: defaultTheme.core.sizing.hit.coarse[step],
        });
      }
    });

    test('non-hit semantic and core tokens have no $extensions', () => {
      const nonHit = leaves.filter((l) => {
        return (
          (l.path.startsWith('semantic.') &&
            !l.path.startsWith('semantic.sizing.hit.')) ||
          l.path.startsWith('core.')
        );
      });
      for (const { token } of nonHit) {
        expect(token.$extensions).toBeUndefined();
      }
    });
  });
});
