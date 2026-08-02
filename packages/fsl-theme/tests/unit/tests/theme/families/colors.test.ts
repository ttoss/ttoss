/**
 * Colors family validation tests.
 *
 * @see /docs/website/docs/design/design-system/design-tokens/families/colors.md#validation
 */

import {
  bruttalFixtures,
  themeAltFlatToTest,
  themeFlatToTest,
} from '../../../fixtures/theme';

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

// This map is the **sensor** for a published-surface change, not a test tweak: a
// role added or removed here accompanies a required member added or removed on the
// matching `*ColorRoles` interface in `src/families/colors.ts`, which every theme
// authored via `base: ThemeTokens` must satisfy.
//
// `@lerna-lite/version` derives the released version from commit markers, and
// `lerna.json` sets `ignoreChanges: ["**/tests/**"]` — so this file cannot trigger
// a release on its own. The `!` and the `BREAKING CHANGE:` footer belong on the
// commit that changes `src/families/colors.ts`, which in practice is this same
// commit: a member added there fails this test until the map follows.
//
// (The `overrides`/`extends` authoring paths take `DeepPartial`, so they are
// unaffected — which is why the break is invisible until someone supplies a
// complete base.)
const ALLOWED_ROLES: Readonly<Record<string, ReadonlyArray<string>>> = {
  action: ['primary', 'secondary', 'accent', 'muted', 'negative'],
  input: ['primary', 'secondary', 'muted', 'positive', 'caution', 'negative'],
  navigation: ['primary', 'secondary', 'accent', 'muted'],
  feedback: ['primary', 'muted', 'positive', 'caution', 'negative', 'accent'],
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
// expanded is also legal in `informational` (in-place disclosure on presentational
// surfaces: accordions, collapsible panels) and `navigation` (mega-nav panels).
const CONTEXT_EXTRA_STATES: Readonly<Record<string, ReadonlyArray<string>>> = {
  action: ['pressed', 'expanded'],
  input: ['checked', 'indeterminate', 'pressed', 'expanded', 'invalid'],
  navigation: ['current', 'visited', 'expanded'],
  feedback: [],
  informational: ['visited', 'expanded'],
};

// ---------------------------------------------------------------------------
// Border-vs-background inventories, per bundle AND per mode
//
// Two mechanical rules keep these lists reviewable. Without them a single
// below-threshold list per mode is dominated by contexts that carry no
// judgement, and the ones that do carry it become invisible — an inventory
// nobody can read is the guard failing quietly (fsl-theme ADR-024):
//
//   • **Mirrored** — a border that resolves to its own background has no edge
//     by construction. Listed separately, because the interesting event is a
//     role *gaining* or *losing* its edge, which a below-threshold list cannot
//     express (both states sit under 3:1).
//   • **Disabled** — excluded entirely. WCAG 2.2 §1.4.3 exempts disabled UI,
//     which the text pairing above already assumes; the border pairing was
//     enshrining disabled contexts that no rule ever wanted.
//
// What survives both rules is the real inventory: a border that differs from
// its background and is still deliberately below AA Large.
// ---------------------------------------------------------------------------

type BorderInventory = {
  /** Border differs from its background and sits below AA Large, by design. */
  soft: ReadonlySet<string>;
  /** Border resolves to its own background — no edge by construction. */
  mirrored: ReadonlySet<string>;
};

/** Apply an explicit delta to a base set. Both lists are asserted, so an entry
 *  that stops applying fails rather than lingering. */
const withDelta = (
  base: ReadonlySet<string>,
  { add = [], remove = [] }: { add?: string[]; remove?: string[] }
): ReadonlySet<string> => {
  const next = new Set(base);
  for (const c of remove) next.delete(c);
  for (const c of add) next.add(c);
  return next;
};

/** Filled surfaces and quiet rungs: the role paints one colour and its border
 *  repeats it. `focused` is the deliberate exception across the Action ladder —
 *  the one state that must show on any surface — and is absent here. */
const MIRRORED_BORDERS: ReadonlySet<string> = new Set([
  // action — the emphasis ladder is filled; the edge is the fill
  'action.accent.active',
  'action.accent.default',
  'action.accent.expanded',
  'action.accent.hover',
  'action.accent.pressed',
  'action.muted.active',
  'action.muted.default',
  'action.muted.expanded',
  'action.muted.hover',
  'action.muted.pressed',
  'action.negative.active',
  'action.negative.default',
  'action.negative.expanded',
  'action.negative.hover',
  'action.negative.pressed',
  'action.primary.active',
  'action.primary.default',
  'action.primary.expanded',
  'action.primary.hover',
  'action.primary.pressed',
  'action.secondary.active',
  'action.secondary.default',
  'action.secondary.hover',
  'action.secondary.pressed',
  // feedback — filled status surfaces (P3 slice 3)
  'feedback.accent.default',
  'feedback.caution.default',
  'feedback.negative.default',
  'feedback.positive.default',
  'feedback.primary.default',
  // input — the checked/indeterminate box is a solid mark, not an outline
  'input.caution.indeterminate',
  'input.muted.checked',
  'input.muted.indeterminate',
  'input.negative.indeterminate',
  'input.positive.indeterminate',
  'input.primary.checked',
  'input.primary.indeterminate',
  'input.secondary.checked',
  'input.secondary.indeterminate',
  // navigation — the accent marker is a fill; primary's rail has no edge
  'navigation.accent.current',
  'navigation.accent.selected',
  'navigation.primary.default',
]);

/** Deliberately soft edges. Three patterns, all visible in the grouping:
 *  (a) a `focused` border sitting on its own role's fill — focus is carried by
 *      the component outline ring, not by this token (ADR-011);
 *  (b) content-surface separators, below the interactive-border threshold on
 *      purpose because they divide rather than delimit;
 *  (c) resting and hover edges on quiet or low-emphasis controls, which
 *      materialise on engagement rather than at rest. */
const SOFT_BORDERS: ReadonlySet<string> = new Set([
  // (a) focused-on-own-fill
  'action.accent.focused',
  'action.negative.focused',
  'feedback.accent.focused',
  'feedback.caution.focused',
  'feedback.negative.focused',
  'feedback.positive.focused',
  // (b) separators
  'feedback.muted.default',
  'informational.accent.selected',
  'informational.caution.default',
  'informational.muted.default',
  'informational.muted.hover',
  'informational.positive.default',
  'informational.primary.active',
  'informational.primary.default',
  'informational.primary.droptarget',
  'informational.primary.hover',
  'informational.primary.selected',
  'informational.secondary.active',
  'informational.secondary.default',
  'informational.secondary.hover',
  'informational.secondary.selected',
  // (c) quiet resting edges
  'input.caution.default',
  'input.muted.default',
  'input.muted.hover',
  'input.positive.default',
  'input.primary.default',
  'input.secondary.default',
  'input.secondary.hover',
  'input.secondary.pressed',
  'navigation.muted.active',
  'navigation.muted.default',
  'navigation.muted.hover',
  'navigation.secondary.active',
  'navigation.secondary.default',
  'navigation.secondary.hover',
]);

/**
 * The dark alternate is not the light inventory with different hex values: it
 * remaps references by hand, so a context can change pattern between modes.
 * Every delta below was measured and classified rather than transcribed
 * (F-027). The `soft` additions are all pattern (a) — the brand step the
 * alternate keeps for `border.focused` sits on the mid-grey engaged fills — plus
 * the accent cascade, whose border weakens on hover/active where the base
 * strengthens it. That last one is a degree question, not an omission, and is
 * logged for the owner's review rather than tuned here.
 */
const DARK: BorderInventory = {
  mirrored: withDelta(MIRRORED_BORDERS, {
    remove: [
      // The inverted primary pill: its engaged fills step away from the edge.
      'action.primary.expanded',
      'action.primary.pressed',
      // The accent marker paints a brand fill in the base and grows an edge
      // here, because the fill and the dark page are one step apart.
      'navigation.accent.current',
      'navigation.accent.selected',
    ],
    add: [
      // The low-emphasis surfaces mirror their own fill at rest in this mode —
      // the documented way `input.secondary` recedes on a dark page (the edge
      // appears on hover, not at rest).
      'informational.muted.hover',
      'informational.secondary.default',
      'input.secondary.default',
    ],
  }),
  soft: withDelta(SOFT_BORDERS, {
    remove: [
      // Resolved by the dark canvas: these clear AA Large without the base's
      // light fills behind them.
      'informational.caution.default',
      'informational.muted.hover',
      'informational.positive.default',
      'informational.primary.active',
      'informational.primary.droptarget',
      'informational.primary.hover',
      'informational.primary.selected',
      'informational.secondary.active',
      'informational.secondary.default',
      'informational.secondary.hover',
      'input.caution.default',
      'input.muted.hover',
      'input.positive.default',
      'input.secondary.default',
      'input.secondary.hover',
      'input.secondary.pressed',
    ],
    add: [
      // (a) focused-on-own-fill — the ring carries focus in this mode too, and
      // it is the one token the alternate lifts to brand.300 for the purpose.
      'action.primary.focused',
      'action.secondary.focused',
      'feedback.muted.focused',
      'feedback.primary.focused',
      'informational.muted.focused',
      'informational.secondary.focused',
      'input.muted.focused',
      'input.primary.focused',
      'input.secondary.focused',
      // The accent cascade inverts here — logged, not tuned (F-039).
      'informational.accent.active',
      'informational.accent.hover',
      'navigation.accent.current',
      'navigation.accent.selected',
    ],
  }),
};

// ---------------------------------------------------------------------------
// Test bundles — extend this array when new theme bundles are added
// ---------------------------------------------------------------------------

const bundleEntries: ReadonlyArray<{
  label: string;
  base: Record<string, string | number>;
  alt?: Record<string, string | number>;
  /** Border inventory for this bundle's base mode. */
  borders: BorderInventory;
  /** Border inventory for this bundle's alternate mode. */
  bordersAlt: BorderInventory;
}> = [
  {
    label: 'default',
    base: themeFlatToTest,
    alt: themeAltFlatToTest,
    borders: { mirrored: MIRRORED_BORDERS, soft: SOFT_BORDERS },
    bordersAlt: DARK,
  },
  {
    label: 'bruttal',
    base: bruttalFixtures.base,
    alt: bruttalFixtures.alt,
    borders: {
      mirrored: MIRRORED_BORDERS,
      // Bruttal's brown brand.500 sits below AA Large against the filled
      // feedback.primary surface where the blue one clears it — pattern (a),
      // a palette difference rather than a different decision.
      soft: withDelta(SOFT_BORDERS, { add: ['feedback.primary.focused'] }),
    },
    bordersAlt: {
      mirrored: DARK.mirrored,
      soft: withDelta(DARK.soft, {
        // The brown ramp is flatter than the blue one against a dark canvas, so
        // the same patterns catch more contexts here — including the accent's
        // resting edge. A palette difference, not a different decision.
        add: [
          'action.muted.focused',
          'informational.primary.focused',
          'navigation.accent.default',
          'navigation.accent.hover',
          'navigation.muted.current',
        ],
        // …and brand.300 clears the accent fill in this palette.
        remove: ['action.accent.focused'],
      }),
    },
  },
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
// or ≥ 3:1 for intentionally subdued *.muted.* contexts (AA Large).
// action.* is NOT exempt: button labels render at text.label sizes
// (14-16px medium), which do not qualify as WCAG large text.
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

          // *.muted.* is intentionally subdued → AA Large; everything else AA Normal
          const threshold = context.includes('.muted.')
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

            const threshold = context.includes('.muted.')
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
// Error #3 (text pairing), cross-role: a part that renders one role's ink on
// another role's surface
//
// `extractTextBackgroundPairs` pairs `text.*` with the `background.*` of the
// **same** role. That is right for a part that paints its own surface and wrong
// for one that does not, and the field family deliberately does not: the
// validation message reads the negative role's ink and renders on whatever
// informational surface the form sits on (fsl-ui CONTRACT §3.2). What the
// same-role pairing verifies for that token is the filled negative input — a
// surface no field in the family renders (F-036).
//
// The surface is not one token. Per colors.md → "Stacking informational
// surfaces", the page and every contained surface resolve from the *same*
// background token, and a raised or overlay stratum is that token plus an
// `elevation.tonal.*` lift. So a part rendering "on the page" can sit on any of
// the strata below, and each is a distinct pairing.
//
// Keyed by where the part renders, not by which role owns the token. Additions
// are cheap; the entry earns its place by naming a part that actually composes
// this way, so the list stays as short as the evidence.
// ---------------------------------------------------------------------------

/** Every effective surface an `informational` stratum can resolve to. */
const INFORMATIONAL_STRATA: ReadonlyArray<string> = [
  'semantic.colors.informational.primary.background.default',
  'semantic.elevation.tonal.raised',
  'semantic.elevation.tonal.overlay',
  'semantic.elevation.tonal.blocking',
];

const CROSS_ROLE_TEXT_PAIRINGS: ReadonlyArray<{
  part: string;
  ink: string;
  surfaces: ReadonlyArray<string>;
  threshold: number;
}> = [
  {
    part: 'validation message',
    ink: 'semantic.colors.input.negative.text.default',
    surfaces: INFORMATIONAL_STRATA,
    // A field's message renders at body size — no large-text allowance.
    threshold: WCAG.AA_NORMAL,
  },
];

describe('Color contrast — cross-role text pairings', () => {
  for (const { label, base, alt } of bundleEntries) {
    describe(label, () => {
      for (const [mode, tokens] of [
        ['base', base],
        ['alt', alt],
      ] as const) {
        if (!tokens) continue;

        for (const {
          part,
          ink,
          surfaces,
          threshold,
        } of CROSS_ROLE_TEXT_PAIRINGS) {
          test(`${mode}: ${part} is legible on every informational stratum`, () => {
            const inkValue = tokens[ink];
            // The pairing is only meaningful while both ends exist — an absent
            // ink is a removed token, which the grammar suites above own.
            expect(isHexColor(inkValue!)).toBe(true);

            const failures = surfaces
              .map((surface) => {
                const ratio = getContrastRatio(
                  String(inkValue),
                  String(tokens[surface])
                );
                return {
                  surface,
                  ratio: ratio === null ? null : Number(ratio.toFixed(2)),
                };
              })
              .filter(({ ratio }) => {
                return ratio === null || ratio < threshold;
              });

            expect({ ink: String(inkValue), failures }).toMatchObject({
              failures: [],
            });
          });
        }
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Error #3 (border pairing) + Error #4: border vs background contrast
//
// Required Pairing #2: *.border.* ≥ 3:1 against the adjacent background.
// Error #4 applies the same assertion to each supported alternate mode — the
// text pairing above has always done so; this one did not, and the dark
// alternate ran unaudited until F-027 (fsl-theme ADR-024).
//
// Rather than a single numeric baseline (which is a license to drift), the
// guard is an explicit inventory of the `{ux}.{role}.{state}` pairs that are
// intentionally below threshold, split by the rules documented at the
// inventories above. Any delta in either set — a new entry OR a listed one that
// no longer applies — fails and forces an explicit decision.
// ---------------------------------------------------------------------------

/** Classify one mode's border pairs against its declared inventory. */
const assertBorderInventory = (
  tokens: Record<string, string | number>,
  inventory: BorderInventory
) => {
  const mirrored = new Set<string>();
  const soft = new Set<string>();

  for (const { borderPath, bgPath, context } of extractBorderBackgroundPairs(
    tokens
  )) {
    // WCAG 2.2 §1.4.3 exempts disabled UI, as the text pairing above assumes.
    if (context.endsWith('.disabled')) continue;

    const border = String(tokens[borderPath]);
    const background = String(tokens[bgPath]);

    if (border.toLowerCase() === background.toLowerCase()) {
      mirrored.add(context);
      continue;
    }

    const ratio = getContrastRatio(border, background);
    if (ratio !== null && ratio < WCAG.AA_LARGE) soft.add(context);
  }

  const delta = (
    observed: ReadonlySet<string>,
    declared: ReadonlySet<string>
  ) => {
    return {
      added: [...observed]
        .filter((c) => {
          return !declared.has(c);
        })
        .sort(),
      resolved: [...declared]
        .filter((c) => {
          return !observed.has(c);
        })
        .sort(),
    };
  };

  // `added`: a regression — require design review or a fix.
  // `resolved`: progress — remove the entry to lock the improvement in.
  expect({
    mirrored: delta(mirrored, inventory.mirrored),
    soft: delta(soft, inventory.soft),
  }).toEqual({
    mirrored: { added: [], resolved: [] },
    soft: { added: [], resolved: [] },
  });
};

describe('Color contrast — border vs background', () => {
  for (const { label, base, alt, borders, bordersAlt } of bundleEntries) {
    describe(label, () => {
      test('base: border/bg inventories match exactly', () => {
        // Error #3 (border/non-text pairing): *.border.* ≥ 3:1 against adjacent *.background.*
        assertBorderInventory(base, borders);
      });

      if (alt) {
        test('alt: border/bg inventories match exactly', () => {
          // Error #4: any supported mode fails the same required pairings for
          // the same semantic contract.
          assertBorderInventory(alt, bordersAlt);
        });
      }
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
// Error #3 — overlay must not appear inside semantic.colors
// ---------------------------------------------------------------------------

describe('Semantic color grammar — overlay absent from semantic.colors', () => {
  for (const { label, base } of bundleEntries) {
    test(`${label}: no semantic.colors.overlay.* token`, () => {
      const violations = Object.keys(base).filter((k) => {
        return k.startsWith('semantic.colors.overlay.');
      });
      expect(violations).toEqual([]);
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

// ---------------------------------------------------------------------------
// Error #5 (role collapse): two roles in the same ux context must not resolve
// to the same visual contract
//
// The distinguishability suite above compares *states within a role*. Nothing
// compared *roles within a context* — which is how `action.secondary` and
// `action.muted` shipped byte-identical in dark mode (both
// neutral.700 / neutral.500 / neutral.50): two documented emphasis levels
// rendering the same pixels, invisible to every existing test.
//
// The rule is minimal on purpose: it asserts only that the resting
// `(background, border, text)` triple differs somewhere. It makes no claim
// about *how much* it differs — that is a design judgement — but a role whose
// entire contract duplicates another's is a defect in any theme.
// ---------------------------------------------------------------------------

const restingTriple = (
  tokens: Record<string, string | number>,
  ux: string,
  role: string
): string => {
  return (['background', 'border', 'text'] as const)
    .map((dim) => {
      return String(tokens[`semantic.colors.${ux}.${role}.${dim}.default`]);
    })
    .join('|');
};

describe('Semantic color grammar — roles within a context are distinguishable', () => {
  for (const { label, base, alt } of bundleEntries) {
    describe(label, () => {
      for (const [ux, roles] of Object.entries(ALLOWED_ROLES)) {
        for (const [mode, tokens] of [
          ['base', base],
          ['alt', alt],
        ] as const) {
          if (!tokens) continue;

          test(`${mode}: every ${ux} role has its own resting contract`, () => {
            const seen = new Map<string, string>();
            const collisions: string[] = [];

            for (const role of roles) {
              const triple = restingTriple(tokens, ux, role);
              // A role that defines none of the three dimensions is not a
              // collapse — it simply is not painted in this theme.
              if (triple === 'undefined|undefined|undefined') continue;

              const previous = seen.get(triple);
              if (previous) {
                collisions.push(`${ux}.${role} === ${ux}.${previous}`);
              } else {
                seen.set(triple, role);
              }
            }

            expect(collisions).toEqual([]);
          });
        }
      }
    });
  }
});
