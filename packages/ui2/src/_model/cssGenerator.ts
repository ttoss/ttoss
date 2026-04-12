/**
 * cssGenerator.ts — Generates static CSS color rules for ui2 components.
 *
 * Contains `generateComponentCss()` and its supporting constants
 * (STATE_CSS_ORDER, DIMENSION_CSS_PROP). Extracted from resolver.ts for
 * module focus.
 *
 * The CSS generator emits per-variant selector blocks that reference
 * `var(--tt-*)` theme tokens directly. No inline `--_*` scoped vars.
 */
import { buildColorSpec } from './resolver';
import type { Dimension, FslState } from './resolver.types';
import type { Responsibility } from './taxonomy';
import {
  RESPONSIBILITY_UX_MAP,
  STATE_SELECTORS,
  UX_VALID_ROLES,
} from './tokenMap';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Maps each color dimension to its CSS property name.
 */
const DIMENSION_CSS_PROP: Record<Dimension, string> = {
  background: 'background-color',
  border: 'border-color',
  text: 'color',
};

/**
 * Canonical order in which state CSS rules are emitted.
 *
 * All rules for a given component share the same base selector and therefore
 * the same specificity. CSS cascade order matters: later rules win over earlier
 * ones with equal specificity, so states that must "win" are placed last.
 *
 * Rule: `disabled` is always last so it overrides every interactive state.
 */
export const STATE_CSS_ORDER: ReadonlyArray<FslState> = [
  'hover',
  'active',
  'focused',
  'selected',
  'current',
  'visited',
  'checked',
  'indeterminate',
  'droptarget',
  'pressed',
  'expanded',
  'disabled',
];

// ---------------------------------------------------------------------------
// generateComponentCss
// ---------------------------------------------------------------------------

/**
 * Generates the complete CSS color rules for a ui2 component.
 *
 * Emits per-variant (per-role) selector blocks that reference `var(--tt-*)`
 * theme tokens directly. No inline `--_*` scoped vars — all styling is static
 * CSS, cacheable and DevTools-readable.
 *
 * For each valid role in the component's UX context:
 * 1. Base rule: `[data-scope][data-part][data-variant='role'] { background-color: var(--tt-colors-{ux}-{role}-background-default); ... }`
 * 2. State rules: `[...][data-variant='role']:hover { ... }` etc.
 * 3. Invalid overlay rules (when `withInvalidOverlay`): `[...][data-variant='role'][data-invalid] { ... }` using `negative` role tokens.
 */
export const generateComponentCss = ({
  scope,
  responsibility,
  part = 'root',
  dimensions: filteredDims,
  withInvalidOverlay = false,
}: {
  scope: string;
  responsibility: Responsibility;
  part?: string;
  dimensions?: ReadonlyArray<Dimension>;
  withInvalidOverlay?: boolean;
}): string => {
  const ux = RESPONSIBILITY_UX_MAP[responsibility];
  const validRoles = UX_VALID_ROLES[ux];
  const allDims = ['background', 'border', 'text'] as const;
  const activeDims: ReadonlyArray<Dimension> = filteredDims ?? allDims;
  const base = `[data-scope='${scope}'][data-part='${part}']`;

  const blocks: string[] = [];

  for (const role of validRoles) {
    const colors = buildColorSpec(ux, role);
    const variantBase = `${base}[data-variant='${role}']`;

    // ── Base (default state) ──────────────────────────────────────────
    const baseDecls = activeDims
      .filter((d) => {
        return colors[d].default !== undefined;
      })
      .map((d) => {
        return `  ${DIMENSION_CSS_PROP[d]}: ${colors[d].default};`;
      });

    if (baseDecls.length > 0) {
      blocks.push(`${variantBase} {\n${baseDecls.join('\n')}\n}`);
    }

    // ── State rules ───────────────────────────────────────────────────
    // Track emitted selectors to deduplicate (selected/checked collision)
    const emittedSelectors = new Set<string>();

    for (const state of STATE_CSS_ORDER) {
      const stateSelector = STATE_SELECTORS[state];
      /* istanbul ignore next -- STATE_CSS_ORDER excludes 'default' */
      if (stateSelector === null) continue;

      const fullSelector =
        state === 'disabled'
          ? `${variantBase}:disabled,\n${variantBase}${stateSelector}`
          : `${variantBase}${stateSelector}`;

      // Deduplicate selectors (e.g. selected and checked both produce [data-state="checked"])
      const selectorKey =
        state === 'disabled' ? ':disabled|[data-disabled]' : stateSelector;
      if (emittedSelectors.has(selectorKey)) continue;
      emittedSelectors.add(selectorKey);

      const decls = activeDims
        .filter((d) => {
          return colors[d][state] !== undefined;
        })
        .map((d) => {
          return `  ${DIMENSION_CSS_PROP[d]}: ${colors[d][state]};`;
        });

      if (decls.length === 0) continue;
      blocks.push(`${fullSelector} {\n${decls.join('\n')}\n}`);
    }

    // ── Invalid overlay rules ─────────────────────────────────────────
    if (withInvalidOverlay) {
      const invalidColors = buildColorSpec(ux, 'negative');

      // [data-invalid] base rule
      const invalidBaseDecls = activeDims
        .filter((d) => {
          return invalidColors[d].default !== undefined;
        })
        .map((d) => {
          return `  ${DIMENSION_CSS_PROP[d]}: ${invalidColors[d].default};`;
        });

      if (invalidBaseDecls.length > 0) {
        blocks.push(
          `${variantBase}[data-invalid] {\n${invalidBaseDecls.join('\n')}\n}`
        );
      }

      // Compound invalid + state rules
      const invalidEmitted = new Set<string>();
      for (const state of STATE_CSS_ORDER) {
        const stateSelector = STATE_SELECTORS[state];
        /* istanbul ignore next */
        if (stateSelector === null) continue;

        const selectorKey =
          state === 'disabled' ? ':disabled|[data-disabled]' : stateSelector;
        if (invalidEmitted.has(selectorKey)) continue;
        invalidEmitted.add(selectorKey);

        const decls = activeDims
          .filter((d) => {
            return invalidColors[d][state] !== undefined;
          })
          .map((d) => {
            return `  ${DIMENSION_CSS_PROP[d]}: ${invalidColors[d][state]};`;
          });

        if (decls.length === 0) continue;

        const sel =
          state === 'disabled'
            ? `${variantBase}[data-invalid]:disabled,\n${variantBase}[data-invalid]${stateSelector}`
            : `${variantBase}[data-invalid]${stateSelector}`;

        blocks.push(`${sel} {\n${decls.join('\n')}\n}`);
      }
    }
  }

  return blocks.join('\n');
};
