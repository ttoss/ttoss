/**
 * Motion family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/motion.md#validation
 */

import { themeAltFlatToTest, themeFlatToTest } from '../../../helpers/theme';

// ---------------------------------------------------------------------------
// Test bundles — extend when new theme bundles are added
// ---------------------------------------------------------------------------

// Note: Error #3, Error #4, and Warning #5 from the Validation spec pertain to
// CSS pipeline output (reducedMotionVars emitted by toCssVars). They are not
// testable from flat tokens and are covered by toCssVars.test.ts instead.

const bundleEntries: ReadonlyArray<{
  label: string;
  base: Record<string, string | number>;
  alt?: Record<string, string | number>;
}> = [{ label: 'default', base: themeFlatToTest, alt: themeAltFlatToTest }];

// ---------------------------------------------------------------------------
// Helpers — duration parsing and semantic contract comparison
// ---------------------------------------------------------------------------

const parseDurationMs = (value: string | number | undefined): number | null => {
  if (value === undefined) return null;
  const match = String(value)
    .trim()
    .match(/^(-?[\d.]+)ms$/);
  return match ? parseFloat(match[1]) : null;
};

// Canonical semantic motion roles per the spec — used by Error #2 guard
const CANONICAL_MOTION_ROLES = [
  'feedback',
  'transition.enter',
  'transition.exit',
  'emphasis',
  'decorative',
] as const;

// Returns true when all semantic motion durations resolve to 0ms (static theme)
const isStaticMotion = (tokens: Record<string, string | number>): boolean => {
  return CANONICAL_MOTION_ROLES.every((role) => {
    return parseDurationMs(tokens[`semantic.motion.${role}.duration`]) === 0;
  });
};

// Returns a combined duration|easing string for semantic motion role comparison
const getMotionContract = (
  tokens: Record<string, string | number>,
  role: string
) => {
  return `${tokens[`semantic.motion.${role}.duration`]}|${tokens[`semantic.motion.${role}.easing`]}`;
};

// ---------------------------------------------------------------------------
// Error tests — core duration ordering
// Tested against base tokens only — alternate mode does not override core tokens.
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Motion errors — duration order ($label)',
  ({ base }) => {
    // Error #1: core duration order breaks — none > xs is a violation
    test('none must not exceed xs', () => {
      const a = parseDurationMs(base['core.motion.duration.none']);
      const b = parseDurationMs(base['core.motion.duration.xs']);
      if (a === null || b === null) return;
      expect(a).toBeLessThanOrEqual(b);
    });

    // Error #1
    test('xs must not exceed sm', () => {
      const a = parseDurationMs(base['core.motion.duration.xs']);
      const b = parseDurationMs(base['core.motion.duration.sm']);
      if (a === null || b === null) return;
      expect(a).toBeLessThanOrEqual(b);
    });

    // Error #1
    test('sm must not exceed md', () => {
      const a = parseDurationMs(base['core.motion.duration.sm']);
      const b = parseDurationMs(base['core.motion.duration.md']);
      if (a === null || b === null) return;
      expect(a).toBeLessThanOrEqual(b);
    });

    // Error #1
    test('md must not exceed lg', () => {
      const a = parseDurationMs(base['core.motion.duration.md']);
      const b = parseDurationMs(base['core.motion.duration.lg']);
      if (a === null || b === null) return;
      expect(a).toBeLessThanOrEqual(b);
    });

    // Error #1
    test('lg must not exceed xl', () => {
      const a = parseDurationMs(base['core.motion.duration.lg']);
      const b = parseDurationMs(base['core.motion.duration.xl']);
      if (a === null || b === null) return;
      expect(a).toBeLessThanOrEqual(b);
    });
  }
);

// ---------------------------------------------------------------------------
// Error tests — canonical semantic motion token names
// Tested against base tokens only — alternate mode does not change the key structure.
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Motion errors — semantic token names ($label)',
  ({ base }) => {
    // Error #2: canonical roles must all be present — semantic token names must not change
    test.each(CANONICAL_MOTION_ROLES)(
      'role "%s" must expose duration and easing',
      (role) => {
        expect(base[`semantic.motion.${role}.duration`]).toBeDefined();
        expect(base[`semantic.motion.${role}.easing`]).toBeDefined();
      }
    );

    // Error #2: no undeclared roles may be invented
    test('no extra motion roles beyond the canonical set', () => {
      const roles = [
        ...new Set(
          Object.keys(base)
            .filter((k) => {
              return k.startsWith('semantic.motion.');
            })
            .map((k) => {
              return k
                .replace('semantic.motion.', '')
                .replace(/\.(duration|easing)$/, '');
            })
        ),
      ];
      for (const role of roles) {
        expect(CANONICAL_MOTION_ROLES as readonly string[]).toContain(role);
      }
    });
  }
);

// ---------------------------------------------------------------------------
// Warning tests — adjacent core duration duplicates
// Tested against base tokens only — alternate mode does not override core tokens.
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Motion warnings — adjacent durations ($label)',
  ({ base }) => {
    // Warning #1: adjacent core duration steps must not resolve to the same effective value
    test('none and xs must not be equal', () => {
      const a = parseDurationMs(base['core.motion.duration.none']);
      const b = parseDurationMs(base['core.motion.duration.xs']);
      if (a === null || b === null) return;
      expect(a).not.toBe(b);
    });

    // Warning #1
    test('xs and sm must not be equal', () => {
      const a = parseDurationMs(base['core.motion.duration.xs']);
      const b = parseDurationMs(base['core.motion.duration.sm']);
      if (a === null || b === null) return;
      expect(a).not.toBe(b);
    });

    // Warning #1
    test('sm and md must not be equal', () => {
      const a = parseDurationMs(base['core.motion.duration.sm']);
      const b = parseDurationMs(base['core.motion.duration.md']);
      if (a === null || b === null) return;
      expect(a).not.toBe(b);
    });

    // Warning #1
    test('md and lg must not be equal', () => {
      const a = parseDurationMs(base['core.motion.duration.md']);
      const b = parseDurationMs(base['core.motion.duration.lg']);
      if (a === null || b === null) return;
      expect(a).not.toBe(b);
    });

    // Warning #1
    test('lg and xl must not be equal', () => {
      const a = parseDurationMs(base['core.motion.duration.lg']);
      const b = parseDurationMs(base['core.motion.duration.xl']);
      if (a === null || b === null) return;
      expect(a).not.toBe(b);
    });
  }
);

// ---------------------------------------------------------------------------
// Warning tests — semantic motion contract collapse (per mode, non-static only)
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Motion warnings — semantic contracts ($label)',
  ({ base, alt }) => {
    const modes = [
      { mode: 'base', tokens: base },
      ...(alt !== undefined ? [{ mode: 'alt', tokens: alt }] : []),
    ];

    describe.each(modes)('$mode mode', ({ tokens }) => {
      // Warning #2: transition.enter and transition.exit must not share the same effective easing in a non-static theme
      test('transition.enter and transition.exit must use different easing (non-static)', () => {
        if (isStaticMotion(tokens)) return;
        expect(tokens['semantic.motion.transition.enter.easing']).not.toBe(
          tokens['semantic.motion.transition.exit.easing']
        );
      });

      // Warning #3: motion.feedback and motion.transition.enter must not share the same effective contract in a non-static theme
      test('feedback and transition.enter must have distinct contracts (non-static)', () => {
        if (isStaticMotion(tokens)) return;
        expect(getMotionContract(tokens, 'feedback')).not.toBe(
          getMotionContract(tokens, 'transition.enter')
        );
      });

      // Warning #4: motion.emphasis must not resolve to the same effective contract as motion.transition.enter in a non-static theme
      test('emphasis and transition.enter must have distinct contracts (non-static)', () => {
        if (isStaticMotion(tokens)) return;
        expect(getMotionContract(tokens, 'emphasis')).not.toBe(
          getMotionContract(tokens, 'transition.enter')
        );
      });
    });
  }
);
