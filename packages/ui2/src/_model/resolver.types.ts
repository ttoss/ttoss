/**
 * resolver.types.ts — Type definitions for the semantic token resolver.
 *
 * Extracted from resolver.ts for module focus. Contains all type definitions
 * used across the resolver layer: UxContext, FslState, Dimension, ColorRole,
 * StateVarMap, ColorSpec, TokenSpec.
 */
import type { Evaluation } from './taxonomy';

// ---------------------------------------------------------------------------
// UX Context
// ---------------------------------------------------------------------------

/**
 * The semantic color UX context — the `{ux}` axis of the token color grammar.
 *
 * Grammar: `semantic.colors.{ux}.{role}.{dimension}.{state}`
 *   → CSS var: `--tt-colors-{ux}-{role}-{dimension}-{state}`
 *
 * Derived from Responsibility via RESPONSIBILITY_UX_MAP. Not a 1:1 mapping —
 * multiple Responsibilities share a single UX context.
 */
export type UxContext =
  | 'action'
  | 'input'
  | 'navigation'
  | 'feedback'
  | 'content';

// ---------------------------------------------------------------------------
// Color Role & FSL State
// ---------------------------------------------------------------------------

/**
 * Valid color roles for the token grammar — the `{role}` axis.
 *
 * Values are identical to FSL Evaluation. In the token projection, "Evaluation"
 * is renamed to "role" (FSL Structural Language §17.1 projection renaming).
 * Only a subset of roles is valid per UX context — enforced by UX_VALID_ROLES.
 */
export type ColorRole = Evaluation;

/**
 * All FSL interaction states that appear in the token grammar — the `{state}` axis.
 *
 * Each UX context supports a specific subset defined by BASE_STATES +
 * UX_EXTRA_STATES. The resolver emits only states valid for the resolved context.
 */
export type FslState =
  | 'default'
  | 'hover'
  | 'active'
  | 'focused'
  | 'disabled'
  | 'selected'
  | 'droptarget'
  | 'pressed'
  | 'expanded'
  | 'checked'
  | 'indeterminate'
  | 'current'
  | 'visited';

/**
 * The three CSS color dimensions of the token grammar — the `{dimension}` axis.
 * Components choose which dimensions they consume — not all three are required.
 */
export type Dimension = 'background' | 'border' | 'text';

// ---------------------------------------------------------------------------
// TokenSpec — the output contract
// ---------------------------------------------------------------------------

/**
 * State-to-CSS-var map for one dimension.
 *
 * Each key is an FslState string. Values are `var(--tt-colors-…)` references.
 * The `default` key is always present in a successful resolution.
 * Other states appear only when valid for the resolved UX context.
 *
 * IMPORTANT — this is the authorized ALLOWLIST for the resolved expression.
 * A component may consume only states present in this map, for this dimension.
 */
export type StateVarMap = Record<string, string>;

/**
 * Color specification for one `ComponentExpression`.
 *
 * All three dimensions are always present in the returned object.
 * Components consume only the dimensions and states they need.
 */
export type ColorSpec = {
  background: StateVarMap;
  border: StateVarMap;
  text: StateVarMap;
};

/**
 * Full output of `resolveTokens()`.
 *
 * - `ux` and `role` are exposed for auditing, downstream tooling, and tests.
 * - `colors` is the authorized CSS var allowlist for the component expression.
 *
 * An empty `ColorSpec` (all empty maps) is returned when the role is invalid
 * for the UX context — accompanied by a `console.warn`.
 */
export type TokenSpec = {
  /** Resolved UX context — the `{ux}` segment of the token grammar. */
  ux: UxContext;
  /** Resolved color role — the `{role}` segment of the token grammar. */
  role: ColorRole;
  /** Authorized semantic color CSS vars for this component expression. */
  colors: ColorSpec;
};
