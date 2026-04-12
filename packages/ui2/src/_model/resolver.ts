/**
 * Semantic Token Resolver — Layer 3.5 of the FSL architecture.
 *
 * This module is the public façade for the resolver layer. It re-exports
 * types and constants from focused sub-modules and provides the two core
 * resolution functions:
 *
 *   - `resolveRole()` — lightweight, used at render time for `data-variant`
 *   - `resolveTokens()` — full ColorSpec, used by CSS generator and tests
 *
 * Sub-modules:
 *   - `resolver.types.ts` — type definitions (UxContext, FslState, etc.)
 *   - `tokenMap.ts` — projection constants (RESPONSIBILITY_UX_MAP, etc.)
 *   - `cssGenerator.ts` — CSS generation (generateComponentCss)
 *
 * @see taxonomy.ts — ComponentExpression, Responsibility, Evaluation, Consequence types
 */
import { vars } from '@ttoss/theme2/vars';

import type {
  ColorRole,
  ColorSpec,
  TokenSpec,
  UxContext,
} from './resolver.types';
import type { ComponentExpression } from './taxonomy';
import {
  CONSEQUENCE_ROLE_OVERRIDE,
  RESPONSIBILITY_UX_MAP,
  UX_VALID_ROLES,
} from './tokenMap';

// ---------------------------------------------------------------------------
// Re-exports — maintain the same public API
// ---------------------------------------------------------------------------

export { generateComponentCss, STATE_CSS_ORDER } from './cssGenerator';
export type {
  ColorRole,
  ColorSpec,
  Dimension,
  FslState,
  StateVarMap,
  TokenSpec,
  UxContext,
} from './resolver.types';
export {
  CONSEQUENCE_ROLE_OVERRIDE,
  RESPONSIBILITY_UX_MAP,
  STATE_SELECTORS,
  UX_VALID_ROLES,
} from './tokenMap';

// ---------------------------------------------------------------------------
// Internal helpers (used by cssGenerator.ts via import)
// ---------------------------------------------------------------------------

/**
 * Extracts a flat `{ state: cssVar }` map from one dimension node of `vars`.
 */
const extractStateVars = (
  node: Record<string, string> | undefined
): Record<string, string> => {
  /* istanbul ignore next -- node is only undefined when a dimension is absent from baseTheme */
  return node ?? {};
};

/* istanbul ignore next -- only reachable from the istanbul-ignored branch in buildColorSpec */
const emptyColorSpec = (): ColorSpec => {
  return {
    background: {},
    border: {},
    text: {},
  };
};

/**
 * Builds a `ColorSpec` by navigating the `vars` tree from `@ttoss/theme2/vars`.
 *
 * Only states actually defined in `baseTheme` are included — every emitted
 * `var(--tt-*)` reference is guaranteed to have a backing CSS custom property.
 */
export const buildColorSpec = (ux: UxContext, role: ColorRole): ColorSpec => {
  const uxColors = vars.colors as unknown as Record<
    string,
    Record<
      string,
      {
        background?: Record<string, string>;
        border?: Record<string, string>;
        text?: Record<string, string>;
      }
    >
  >;
  /* istanbul ignore next */
  const roleVars = uxColors[ux]?.[role];
  /* istanbul ignore next */
  if (!roleVars) return emptyColorSpec();

  return {
    background: extractStateVars(roleVars.background),
    border: extractStateVars(roleVars.border),
    text: extractStateVars(roleVars.text),
  };
};

// ---------------------------------------------------------------------------
// Shared role resolution (DRY helper for resolveRole + resolveTokens)
// ---------------------------------------------------------------------------

/**
 * Resolves ux context and validated color role from a ComponentExpression.
 *
 * Resolution rules (ordered):
 *   1. UX context:  `RESPONSIBILITY_UX_MAP[expr.responsibility]`
 *   2. Role:        `CONSEQUENCE_ROLE_OVERRIDE[consequence] ?? expr.evaluation ?? 'primary'`
 *   3. Role validity: warn + fallback to `'primary'` if role ∉ `UX_VALID_ROLES[ux]`
 */
const resolveUxAndRole = (
  expr: ComponentExpression
): { ux: UxContext; role: ColorRole } => {
  const ux = RESPONSIBILITY_UX_MAP[expr.responsibility];

  const candidateRole: ColorRole =
    CONSEQUENCE_ROLE_OVERRIDE[expr.consequence ?? 'neutral'] ??
    expr.evaluation ??
    'primary';

  const validRoles = UX_VALID_ROLES[ux];

  if (!validRoles.includes(candidateRole)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[ui2/resolver] role "${candidateRole}" is not valid for ux context "${ux}" ` +
        `(Responsibility: "${expr.responsibility}"). ` +
        `Valid roles: ${validRoles.join(', ')}. ` +
        `Falling back to 'primary'.`
    );
    return { ux, role: 'primary' };
  }

  return { ux, role: candidateRole };
};

// ---------------------------------------------------------------------------
// resolveRole
// ---------------------------------------------------------------------------

/**
 * Lightweight role resolution for render-time use.
 *
 * Computes only the color role string (e.g. `'primary'`, `'negative'`) without
 * building the full `ColorSpec`. This is all a component needs at render time
 * to set `data-variant` — the CSS handles everything else via static selectors.
 */
export const resolveRole = (expr: ComponentExpression): ColorRole => {
  return resolveUxAndRole(expr).role;
};

// ---------------------------------------------------------------------------
// resolveTokens
// ---------------------------------------------------------------------------

/**
 * Resolves a `ComponentExpression` to its authorized semantic token set.
 *
 * The returned `TokenSpec` is the complete allowlist of CSS custom properties
 * the component may consume. Used by the CSS generator and by tests — not
 * called at render time (components use `resolveRole()` instead).
 *
 * When the role is invalid for the UX context, falls back to `'primary'` role
 * (consistent with `resolveRole()`) and builds the fallback ColorSpec.
 */
export const resolveTokens = (expr: ComponentExpression): TokenSpec => {
  const { ux, role } = resolveUxAndRole(expr);

  return { ux, role, colors: buildColorSpec(ux, role) };
};
