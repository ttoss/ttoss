/**
 * Motion family validation tests.
 *
 * @see /docs/website/docs/design/design-system/design-tokens/families/motion.md#validation
 */

import { themeFlatToTest } from '../../../fixtures/theme';

// ---------------------------------------------------------------------------
// Test bundles — extend when new theme bundles are added
// ---------------------------------------------------------------------------

// Note: Error #3, Error #4, and Warning #5 from the Validation spec pertain to
// CSS pipeline output (reducedMotionVars emitted by toCssVars). They are not
// testable from flat tokens and are covered by toCssVars.test.ts instead.

const bundleEntries: ReadonlyArray<{
  label: string;
  base: Record<string, string | number>;
}> = [{ label: 'default', base: themeFlatToTest }];

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
    // Error #1: core duration scale must be non-decreasing
    test('core duration scale is non-decreasing', () => {
      const STEPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
      const values = STEPS.map((k) => {
        return parseDurationMs(base[`core.motion.duration.${k}`]);
      });
      for (let i = 0; i < values.length - 1; i++) {
        const a = values[i];
        const b = values[i + 1];
        if (a === null || b === null) continue;
        expect(a).toBeLessThanOrEqual(b);
      }
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
    // Warning #1: all adjacent core duration steps must be distinct
    test('adjacent core duration steps must all be distinct', () => {
      const STEPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
      const values = STEPS.map((k) => {
        return parseDurationMs(base[`core.motion.duration.${k}`]);
      });
      for (let i = 0; i < values.length - 1; i++) {
        const a = values[i];
        const b = values[i + 1];
        if (a === null || b === null) continue;
        expect(a).not.toBe(b);
      }
    });
  }
);

// ---------------------------------------------------------------------------
// Warning tests — semantic motion contract collapse (per mode, non-static only)
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Motion warnings — semantic contracts ($label)',
  ({ base }) => {
    // Warning #2–4: semantic contract collapse (non-static themes only).
    // darkAlternate does not override semantic.motion; tested against base tokens only.
    test('transition.enter and transition.exit must use different easing (non-static)', () => {
      if (isStaticMotion(base)) return;
      expect(base['semantic.motion.transition.enter.easing']).not.toBe(
        base['semantic.motion.transition.exit.easing']
      );
    });

    test('feedback and transition.enter must have distinct contracts (non-static)', () => {
      if (isStaticMotion(base)) return;
      expect(getMotionContract(base, 'feedback')).not.toBe(
        getMotionContract(base, 'transition.enter')
      );
    });

    test('emphasis and transition.enter must have distinct contracts (non-static)', () => {
      if (isStaticMotion(base)) return;
      expect(getMotionContract(base, 'emphasis')).not.toBe(
        getMotionContract(base, 'transition.enter')
      );
    });
  }
);
