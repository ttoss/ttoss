import { themes } from '../../../src';
import {
  getContrastRatio,
  getLuminance,
  getWCAGConformance,
  hexToRgb,
} from '../../../src/roots/accessibility';
import { flattenAndResolve } from '../../../src/roots/helpers';
import type { ThemeTokensV2 } from '../../../src/Types';

// ---------------------------------------------------------------------------
// Type Guards & Helpers
// ---------------------------------------------------------------------------

const isHexColor = (value: string | number): boolean => {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{3,6}$/.test(value);
};

/**
 * Extract all background/text pair paths from semantic colors structure.
 *
 * For each {ux}.{role}.{state} combination, returns paired paths:
 * - semantic.colors.{ux}.{role}.background.{state}
 * - semantic.colors.{ux}.{role}.text.{state}
 */
const extractColorPairs = (
  theme: ThemeTokensV2
): Array<{ background: string; text: string; context: string }> => {
  const pairs: Array<{ background: string; text: string; context: string }> =
    [];

  const { semantic } = theme;
  if (!semantic?.colors) {
    return pairs;
  }

  // Iterate UX contexts (action, input, content, feedback, navigation, etc.)
  for (const [uxKey, uxValue] of Object.entries(semantic.colors)) {
    if (!uxValue || typeof uxValue !== 'object') {
      continue;
    }

    // Iterate roles (primary, secondary, accent, muted, etc.)
    for (const [roleKey, roleValue] of Object.entries(uxValue)) {
      if (!roleValue || typeof roleValue !== 'object') {
        continue;
      }

      const dimensions = roleValue as {
        background?: Record<string, unknown>;
        text?: Record<string, unknown>;
      };

      const { background, text } = dimensions;

      if (!background || !text) {
        continue; // Skip if either dimension is missing
      }

      // Iterate states (default, hover, focused, etc.)
      for (const stateKey of Object.keys(background)) {
        if (!(stateKey in text)) {
          continue; // Skip if text doesn't have this state
        }

        const bgPath = `semantic.colors.${uxKey}.${roleKey}.background.${stateKey}`;
        const textPath = `semantic.colors.${uxKey}.${roleKey}.text.${stateKey}`;
        const context = `${uxKey}.${roleKey}.${stateKey}`;

        pairs.push({ background: bgPath, text: textPath, context });
      }
    }
  }

  return pairs;
};

// ---------------------------------------------------------------------------
// Accessibility Tests — Contrast Validation
// ---------------------------------------------------------------------------

describe('accessibility — color contrast', () => {
  const themeNames = Object.keys(themes) as Array<keyof typeof themes>;

  describe.each(themeNames)('theme: %s', (themeName) => {
    const theme = themes[themeName];
    const resolved = flattenAndResolve(theme);
    const pairs = extractColorPairs(theme);

    test('has extractable background/text pairs', () => {
      expect(pairs.length).toBeGreaterThan(0);
    });

    test.each(pairs)(
      'contrast for $context',
      ({ background: bgPath, text: textPath, context }) => {
        // WCAG 2.2 §1.4.3 explicitly exempts inactive/disabled UI components
        // from contrast requirements. Disabled states have no contrast requirement.
        if (context.endsWith('.disabled')) {
          return;
        }

        const bgValue = resolved[bgPath];
        const textValue = resolved[textPath];

        // Validate that both values resolved to hex colors
        expect(bgValue).toBeDefined();
        expect(textValue).toBeDefined();
        expect(isHexColor(String(bgValue))).toBe(true);
        expect(isHexColor(String(textValue))).toBe(true);

        const ratio = getContrastRatio(
          String(bgValue),
          String(textValue)
        ) as number;
        expect(ratio).not.toBeNull();

        const conformance = getWCAGConformance(ratio);

        // Contrast rules by context:
        // - action.*: buttons/CTA use large/bold text → AA Large (3:1)
        // - *.muted.*: intentionally subdued surfaces → AA Large (3:1)
        // - all others: normal text → AA Normal (4.5:1)
        const isMutedRole = context.includes('.muted.');
        const isActionContext = context.startsWith('action.');
        const meetsRequired =
          isActionContext || isMutedRole
            ? conformance.aa.large
            : conformance.aa.normal;

        // Assert minimum WCAG AA conformance
        expect({
          theme: themeName,
          context,
          background: bgValue,
          text: textValue,
          ratio: conformance.ratio,
          meetsAA: meetsRequired,
        }).toMatchObject({
          meetsAA: true,
        });
      }
    );
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — Utility Functions
// ---------------------------------------------------------------------------

describe('accessibility utilities', () => {
  describe('hexToRgb', () => {
    test('parses 6-digit hex correctly', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    });

    test('parses 3-digit hex correctly', () => {
      expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#00f')).toEqual({ r: 0, g: 0, b: 255 });
    });

    test('handles hex without # prefix', () => {
      expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    test('returns null for invalid hex', () => {
      expect(hexToRgb('zzz')).toBeNull();
      expect(hexToRgb('#12')).toBeNull();
      expect(hexToRgb('')).toBeNull();
    });
  });

  describe('getLuminance', () => {
    test('calculates luminance for pure colors', () => {
      // White should be close to 1
      expect(getLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 2);

      // Black should be close to 0
      expect(getLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 2);
    });
  });

  describe('getContrastRatio', () => {
    test('calculates contrast between black and white', () => {
      expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    });

    test('calculates contrast between identical colors', () => {
      expect(getContrastRatio('#ff0000', '#ff0000')).toBeCloseTo(1, 1);
    });

    test('is commutative (order does not matter)', () => {
      const ratio1 = getContrastRatio('#333333', '#ffffff');
      const ratio2 = getContrastRatio('#ffffff', '#333333');
      expect(ratio1).toBe(ratio2);
    });

    test('returns null for invalid colors', () => {
      expect(getContrastRatio('invalid', '#ffffff')).toBeNull();
      expect(getContrastRatio('#ffffff', 'invalid')).toBeNull();
    });
  });

  describe('getWCAGConformance', () => {
    test('classifies high contrast correctly', () => {
      const conformance = getWCAGConformance(21); // Black on white

      expect(conformance.aa.normal).toBe(true);
      expect(conformance.aa.large).toBe(true);
      expect(conformance.aaa.normal).toBe(true);
      expect(conformance.aaa.large).toBe(true);
    });

    test('classifies low contrast correctly', () => {
      const conformance = getWCAGConformance(2); // Poor contrast

      expect(conformance.aa.normal).toBe(false);
      expect(conformance.aa.large).toBe(false);
      expect(conformance.aaa.normal).toBe(false);
      expect(conformance.aaa.large).toBe(false);
    });

    test('classifies AA normal threshold edge case', () => {
      const conformance = getWCAGConformance(4.5); // Exactly AA normal & AAA large

      expect(conformance.aa.normal).toBe(true);
      expect(conformance.aa.large).toBe(true);
      expect(conformance.aaa.normal).toBe(false);
      expect(conformance.aaa.large).toBe(true); // 4.5 is exactly AAA large threshold
    });
  });
});
