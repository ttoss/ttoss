/**
 * Colors family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/colors.md#validation
 */

import {
  bruttalFixtures,
  themeAltFlatToTest,
  themeFlatToTest,
} from '../../../helpers/theme';

// ---------------------------------------------------------------------------
// WCAG 2.1 contrast utilities (inlined — no external dependency)
// ---------------------------------------------------------------------------

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const cleaned = hex.replace(/^#/, '');
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => {
            return c + c;
          })
          .join('')
      : cleaned;
  if (expanded.length !== 6) return null;
  const num = Number.parseInt(expanded, 16);
  if (Number.isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

const getLuminance = (rgb: { r: number; g: number; b: number }): number => {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * toLinear(rgb.r) +
    0.7152 * toLinear(rgb.g) +
    0.0722 * toLinear(rgb.b)
  );
};

const getContrastRatio = (hex1: string, hex2: string): number | null => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

const WCAG = { AA_NORMAL: 4.5, AA_LARGE: 3.0 } as const;

// ---------------------------------------------------------------------------
// Canonical grammar constraints — Legal Combinations from colors.md
// ---------------------------------------------------------------------------

const ALLOWED_ROLES: Readonly<Record<string, ReadonlyArray<string>>> = {
  action: ['primary', 'secondary', 'accent', 'muted', 'negative'],
  input: ['primary', 'secondary', 'muted', 'positive', 'caution', 'negative'],
  navigation: ['primary', 'secondary', 'accent', 'muted'],
  feedback: ['primary', 'muted', 'positive', 'caution', 'negative'],
  informational: [
    'primary',
    'secondary',
    'accent',
    'muted',
    'positive',
    'caution',
    'negative',
  ],
};

// droptarget was promoted to BaseColorStates (FSL Lexicon §7 — general FSL State).
// Any UX context accepting drag-and-drop may use it without needing a context-specific override.
const BASE_STATES = new Set([
  'default',
  'hover',
  'active',
  'focused',
  'disabled',
  'selected',
  'droptarget',
]);

// expanded was added to ActionColorStates — Action components (disclosure triggers,
// menu anchors, split buttons) communicate the open/closed state visually.
const CONTEXT_EXTRA_STATES: Readonly<Record<string, ReadonlyArray<string>>> = {
  action: ['pressed', 'expanded'],
  input: ['checked', 'indeterminate', 'pressed', 'expanded'],
  navigation: ['current', 'visited', 'expanded'],
  feedback: [],
  informational: ['visited'],
};

// ---------------------------------------------------------------------------
// Test bundles — extend this array when new theme bundles are added
// ---------------------------------------------------------------------------

const bundleEntries: ReadonlyArray<{
  label: string;
  base: Record<string, string | number>;
  alt?: Record<string, string | number>;
  /**
   * Known `{ux}.{role}.{state}` contexts whose border falls below AA Large
   * against its adjacent background by design. When omitted, the default
   * inventory is used.
   */
  knownBorderViolations?: ReadonlySet<string>;
}> = [
  { label: 'default', base: themeFlatToTest, alt: themeAltFlatToTest },
  { label: 'bruttal', base: bruttalFixtures.base, alt: bruttalFixtures.alt },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isHexColor = (v: string | number): v is string => {
  return typeof v === 'string' && /^#[0-9A-Fa-f]{3,6}$/.test(v);
};

/** Decompose 'semantic.colors.{ux}.{role}.{dim}.{state}' → parts, or null. */
const parseSemanticColorKey = (
  key: string
): { ux: string; role: string; dim: string; state: string } | null => {
  if (!key.startsWith('semantic.colors.')) return null;
  const parts = key.slice('semantic.colors.'.length).split('.');
  if (parts.length !== 4) return null;
  const [ux, role, dim, state] = parts as [string, string, string, string];
  return { ux, role, dim, state };
};

/**
 * Text/background pairs: for each ux.role.state where both background and
 * text tokens resolve to hex values.
 */
const extractTextBackgroundPairs = (
  tokens: Record<string, string | number>
): Array<{ bgPath: string; textPath: string; context: string }> => {
  const pairs: Array<{ bgPath: string; textPath: string; context: string }> =
    [];
  const prefix = 'semantic.colors.';

  for (const bgPath of Object.keys(tokens)) {
    if (!bgPath.startsWith(prefix) || !bgPath.includes('.background.')) {
      continue;
    }
    if (!isHexColor(tokens[bgPath]!)) continue;

    const parsed = parseSemanticColorKey(bgPath);
    if (!parsed) continue;
    const { ux, role, state } = parsed;

    const textPath = `${prefix}${ux}.${role}.text.${state}`;
    if (!(textPath in tokens) || !isHexColor(tokens[textPath]!)) continue;

    pairs.push({ bgPath, textPath, context: `${ux}.${role}.${state}` });
  }

  return pairs;
};

/**
 * Border/background pairs: for each border token, pair it with same-state
 * background (or fall back to .default) in the same ux.role.
 */
const extractBorderBackgroundPairs = (
  tokens: Record<string, string | number>
): Array<{ borderPath: string; bgPath: string; context: string }> => {
  const pairs: Array<{ borderPath: string; bgPath: string; context: string }> =
    [];
  const prefix = 'semantic.colors.';

  for (const borderPath of Object.keys(tokens)) {
    if (!borderPath.startsWith(prefix) || !borderPath.includes('.border.')) {
      continue;
    }
    if (!isHexColor(tokens[borderPath]!)) continue;

    const parsed = parseSemanticColorKey(borderPath);
    if (!parsed) continue;
    const { ux, role, state } = parsed;

    const sameBg = `${prefix}${ux}.${role}.background.${state}`;
    const defaultBg = `${prefix}${ux}.${role}.background.default`;
    const bgPath = isHexColor(tokens[sameBg]!)
      ? sameBg
      : isHexColor(tokens[defaultBg]!)
        ? defaultBg
        : null;
    if (!bgPath) continue;

    pairs.push({ borderPath, bgPath, context: `${ux}.${role}.${state}` });
  }

  return pairs;
};

// ---------------------------------------------------------------------------
// Error #1: invalid ux→role combinations
// ---------------------------------------------------------------------------

describe('Semantic color grammar — ux→role validity', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      test('base: all ux→role pairs are valid', () => {
        // Error #1: a semantic color token uses an invalid ux→role combination
        const violations: string[] = [];
        const seen = new Set<string>();

        for (const key of Object.keys(base)) {
          const parsed = parseSemanticColorKey(key);
          if (!parsed) continue;
          const { ux, role } = parsed;
          const id = `${ux}.${role}`;
          if (seen.has(id)) continue;
          seen.add(id);

          if (!(ux in ALLOWED_ROLES)) {
            violations.push(`unknown ux context: ${ux}`);
          } else if (!ALLOWED_ROLES[ux].includes(role)) {
            violations.push(`${ux}.${role} — role not allowed for ${ux}`);
          }
        }

        expect(violations).toEqual([]);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Error #2: state outside allowed restrictions for that context
// ---------------------------------------------------------------------------

describe('Semantic color grammar — state restrictions per context', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      test('base: all states are within the allowed set for their context', () => {
        // Error #2: a semantic color token uses a state outside the allowed state
        // restrictions for that contract
        const violations: string[] = [];

        for (const key of Object.keys(base)) {
          const parsed = parseSemanticColorKey(key);
          if (!parsed) continue;
          const { ux, role, state } = parsed;
          if (!(ux in ALLOWED_ROLES)) continue; // already caught by Error #1

          const allowed = new Set([
            ...BASE_STATES,
            ...(CONTEXT_EXTRA_STATES[ux] ?? []),
          ]);

          if (!allowed.has(state)) {
            violations.push(
              `${ux}.${role}.*.${state} — state not allowed in ${ux} context`
            );
          }
        }

        expect(violations).toEqual([]);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Structural coverage — every ux→role pair in ALLOWED_ROLES must be realized
//
// Prevents silent gaps: if a new role is added to ALLOWED_ROLES but no tokens
// are defined for it, the grammar drifts out of sync with the theme. This
// invariant scales to any future bundle without manual enumeration.
// ---------------------------------------------------------------------------

describe('Semantic color grammar — ux→role coverage', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      test('base: every ALLOWED_ROLES pair has at least one token defined', () => {
        const realized = new Set<string>();
        for (const key of Object.keys(base)) {
          const parsed = parseSemanticColorKey(key);
          if (!parsed) continue;
          realized.add(`${parsed.ux}.${parsed.role}`);
        }

        const missing: string[] = [];
        for (const [ux, roles] of Object.entries(ALLOWED_ROLES)) {
          for (const role of roles) {
            if (!realized.has(`${ux}.${role}`)) {
              missing.push(`${ux}.${role}`);
            }
          }
        }

        expect(missing).toEqual([]);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Error #3 (text pairing) + Error #4: text vs background contrast
//
// Required Pairing #1: *.text.* ≥ 4.5:1 against *.background.* (normal text)
// or ≥ 3:1 for large/bold text (action.* and *.muted.* contexts).
// Error #4 applies the same assertion to each supported alternate mode.
// ---------------------------------------------------------------------------

describe('Color contrast — text vs background', () => {
  for (const { label, base, alt } of bundleEntries) {
    describe(label, () => {
      test.each(extractTextBackgroundPairs(base))(
        'base: $context',
        ({ bgPath, textPath, context }) => {
          // Error #3 (text pairing): any required semantic pairing fails contrast targets
          if (context.endsWith('.disabled')) return; // WCAG 2.2 §1.4.3 exempts disabled UI

          const bg = String(base[bgPath]);
          const text = String(base[textPath]);
          const ratio = getContrastRatio(bg, text) as number;

          // action.* uses large/bold text; *.muted.* is intentionally subdued → AA Large
          const threshold =
            context.startsWith('action.') || context.includes('.muted.')
              ? WCAG.AA_LARGE
              : WCAG.AA_NORMAL;

          expect({
            context,
            background: bg,
            text,
            ratio: Number(ratio.toFixed(2)),
            meetsAA: ratio >= threshold,
          }).toMatchObject({ meetsAA: true });
        }
      );

      if (alt) {
        test.each(extractTextBackgroundPairs(alt))(
          'alt: $context',
          ({ bgPath, textPath, context }) => {
            // Error #4: any supported mode fails the same required pairings for the
            // same semantic contract
            if (context.endsWith('.disabled')) return;

            const bg = String(alt[bgPath]);
            const text = String(alt[textPath]);
            const ratio = getContrastRatio(bg, text) as number;

            const threshold =
              context.startsWith('action.') || context.includes('.muted.')
                ? WCAG.AA_LARGE
                : WCAG.AA_NORMAL;

            expect({
              context,
              background: bg,
              text,
              ratio: Number(ratio.toFixed(2)),
              meetsAA: ratio >= threshold,
            }).toMatchObject({ meetsAA: true });
          }
        );
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Error #3 (border pairing): border vs background contrast — regression guard
//
// Required Pairing #2: *.border.* ≥ 3:1 against the adjacent background.
//
// Rather than a single numeric baseline (which is a license to drift), the
// guard is an explicit inventory of the `{ux}.{role}.{state}` pairs that are
// intentionally below threshold. Any delta — new violation OR a resolved one
// not yet removed from the inventory — fails the test and forces an explicit
// decision.
//
// The inventory reflects four design patterns:
//   (a) Solid filled buttons (action.primary/negative/accent) where
//       border == background by design;
//   (b) Ghost/muted buttons (action.muted/secondary) with subtle borders;
//   (c) Informational / feedback surfaces where the border is a decorative
//       separator deliberately below the interactive-border threshold;
//   (d) Input / navigation resting states with intentionally soft borders.
// ---------------------------------------------------------------------------

/** Known `{ux}.{role}.{state}` contexts whose border falls below AA Large against
 *  its adjacent background by design. Sorted alphabetically for diff stability. */
const KNOWN_BORDER_CONTRAST_VIOLATIONS: ReadonlySet<string> = new Set([
  // action — solid and subtle variants
  'action.accent.active',
  'action.accent.default',
  'action.accent.disabled',
  'action.accent.expanded',
  'action.accent.focused',
  'action.accent.hover',
  'action.accent.pressed',
  'action.accent.selected',
  'action.muted.active',
  'action.muted.default',
  'action.muted.disabled',
  'action.muted.hover',
  'action.muted.pressed',
  'action.negative.active',
  'action.negative.default',
  'action.negative.disabled',
  'action.negative.expanded',
  'action.negative.focused',
  'action.negative.hover',
  'action.negative.pressed',
  'action.negative.selected',
  'action.primary.active',
  'action.primary.default',
  'action.primary.disabled',
  'action.primary.expanded',
  'action.primary.hover',
  'action.primary.pressed',
  'action.primary.selected',
  'action.secondary.active',
  'action.secondary.default',
  'action.secondary.disabled',
  'action.secondary.hover',
  'action.secondary.pressed',
  'action.secondary.selected',
  // feedback — decorative separators
  'feedback.caution.default',
  'feedback.muted.default',
  'feedback.positive.default',
  'feedback.primary.default',
  // informational — content-surface separators
  'informational.accent.disabled',
  'informational.accent.selected',
  'informational.caution.default',
  'informational.caution.disabled',
  'informational.muted.default',
  'informational.muted.hover',
  'informational.negative.disabled',
  'informational.positive.default',
  'informational.positive.disabled',
  'informational.primary.active',
  'informational.primary.default',
  'informational.primary.disabled',
  'informational.primary.droptarget',
  'informational.primary.hover',
  'informational.primary.selected',
  'informational.secondary.active',
  'informational.secondary.default',
  'informational.secondary.disabled',
  'informational.secondary.hover',
  'informational.secondary.selected',
  // input — soft resting/disabled borders
  'input.caution.default',
  'input.caution.disabled',
  'input.caution.indeterminate',
  'input.muted.checked',
  'input.muted.default',
  'input.muted.disabled',
  'input.muted.hover',
  'input.muted.indeterminate',
  'input.negative.disabled',
  'input.negative.indeterminate',
  'input.positive.default',
  'input.positive.disabled',
  'input.positive.indeterminate',
  'input.primary.checked',
  'input.primary.default',
  'input.primary.disabled',
  'input.primary.indeterminate',
  'input.secondary.checked',
  'input.secondary.default',
  'input.secondary.disabled',
  'input.secondary.hover',
  'input.secondary.indeterminate',
  'input.secondary.pressed',
  // navigation — subtle nav borders
  'navigation.accent.current',
  'navigation.accent.disabled',
  'navigation.accent.selected',
  'navigation.muted.active',
  'navigation.muted.default',
  'navigation.muted.disabled',
  'navigation.muted.hover',
  'navigation.primary.default',
  'navigation.secondary.active',
  'navigation.secondary.default',
  'navigation.secondary.disabled',
  'navigation.secondary.hover',
]);

describe('Color contrast — border vs background', () => {
  for (const entry of bundleEntries) {
    const { label, base } = entry;
    const inventory =
      entry.knownBorderViolations ?? KNOWN_BORDER_CONTRAST_VIOLATIONS;
    describe(label, () => {
      test('base: border/bg violations match the documented inventory exactly', () => {
        // Error #3 (border/non-text pairing): *.border.* ≥ 3:1 against adjacent *.background.*
        const pairs = extractBorderBackgroundPairs(base);
        const observed = new Set(
          pairs
            .filter(({ borderPath, bgPath }) => {
              const ratio = getContrastRatio(
                String(base[borderPath]),
                String(base[bgPath])
              );
              return ratio !== null && ratio < WCAG.AA_LARGE;
            })
            .map((v) => {
              return v.context;
            })
        );

        const added = [...observed]
          .filter((c) => {
            return !inventory.has(c);
          })
          .sort();
        const resolved = [...inventory]
          .filter((c) => {
            return !observed.has(c);
          })
          .sort();

        // New violations: a regression — require design review or fix.
        // Resolved violations: progress — remove the entry from the inventory
        // above to lock in the improvement.
        expect({ added, resolved }).toEqual({ added: [], resolved: [] });
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Error #3 (focus pairing) and Error #3 (selected/current pairing)
//
// Required Pairings #3 and #4 each have two sub-requirements:
//
//   (a) The focused/selected/current indicator color ≥ 3:1 against the adjacent
//       surface. The "adjacent surface" is determined at the component/layout
//       level (e.g., a button focus ring sits on the page surface, not on the
//       button's own background). This requires component-level testing —
//       visual regression tools or browser accessibility audits — and is not
//       derivable from the flat token dictionary alone.
//
//   (b) "When distinction depends on color, the color must differ from the prior
//       state." This IS testable at the token level and is enforced by Warning #1
//       and Warning #2 below.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Warning #1 / Warning #2: state distinguishability
// ---------------------------------------------------------------------------

describe('Color contrast — state distinguishability', () => {
  // Pairs to check (state → the state it is meant to distinguish from).
  // Warning #2 explicitly targets focused/selected/current vs default;
  // Warning #1 is the broader rule that also covers hover and active.
  const DISTINGUISHABLE_PAIRS: ReadonlyArray<
    readonly [state: string, against: string]
  > = [
    ['hover', 'default'], // Warning #1: hover must differ from resting state
    ['active', 'default'], // Warning #1
    ['focused', 'default'], // Warning #2: focused resolves to same color as default
    ['selected', 'default'], // Warning #2: selected resolves to same color as default
    ['current', 'default'], // Warning #2: current resolves to same color as default
  ];

  const checkDistinguishability = (
    tokens: Record<string, string | number>
  ): string[] => {
    const conflicts: string[] = [];

    for (const [state, against] of DISTINGUISHABLE_PAIRS) {
      for (const key of Object.keys(tokens)) {
        if (!key.startsWith('semantic.colors.') || !key.endsWith(`.${state}`)) {
          continue;
        }
        if (!isHexColor(tokens[key]!)) continue;

        const againstPath = key.slice(0, -state.length) + against;
        if (!(againstPath in tokens) || !isHexColor(tokens[againstPath]!)) {
          continue;
        }

        if (tokens[key] === tokens[againstPath]) {
          conflicts.push(`${key} == ${againstPath} (${tokens[key]})`);
        }
      }
    }

    return conflicts;
  };

  for (const { label, base, alt } of bundleEntries) {
    describe(label, () => {
      test('base: each distinguishable state differs from its reference state', () => {
        // Warning #1: a separately defined state token resolves to the same color
        // as the state it is meant to distinguish
        // Warning #2: focused/selected/current resolves to the same color as default
        expect(checkDistinguishability(base)).toEqual([]);
      });

      if (alt) {
        test('alt: each distinguishable state differs from its reference state', () => {
          // Warning #1
          // Warning #2
          expect(checkDistinguishability(alt)).toEqual([]);
        });
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Warning #3 — not pragmatically testable at the token level
//
// Warning #3: two distinct semantic tokens in the same ux/dimension/state
// resolve to the same color.
//
// Whether two roles sharing a color in the same ux/dimension/state is a
// problem depends on design intent metadata that is not present in the token
// dictionary. For example, informational.primary.border.default and
// informational.secondary.border.default both mapping to neutral.200 may be a
// deliberate choice for visual consistency. Automating this would produce
// false positives for intentional shared tones. Validate through design
// review rather than automated testing.
// ---------------------------------------------------------------------------
