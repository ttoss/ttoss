/**
 * Component Semantics Projection — Layer 3 of the FSL architecture.
 *
 * This module is the Component Semantics Projection derived from the
 * Foundational Semantic Language (FSL). It maps FSL dimensions to the
 * component model vocabulary used throughout @ttoss/ui2.
 *
 * FSL dimension mapping (authorized by FSL Structural Language §17.1):
 *   FSL Entity Kind  → Responsibility (values identical)
 *   FSL Evaluation   → Evaluation     (values identical)
 *   FSL Consequence  → Consequence    (values identical)
 *
 * Zero external dependencies. No imports from @ttoss/theme2, Ark UI, React,
 * or any other package. This module is the stable foundation of ui2.
 *
 * Design principle — const first, types are shadows:
 *   Every type in this module is derived from a runtime const counterpart.
 *   The const is the source of truth. Adding a value to the const propagates
 *   to all derived types automatically, with TypeScript enforcing completeness.
 */

/* ------------------------------------------------------------------ */
/*  Responsibility                                                      */
/* ------------------------------------------------------------------ */

/**
 * All valid Responsibility values as an ordered const tuple.
 *
 * Used for:
 * - Deriving the `Responsibility` type (never the reverse)
 * - Runtime iteration (exhaustiveness checks, code generation)
 */
export const RESPONSIBILITIES = [
  'Action',
  'Input',
  'Selection',
  'Collection',
  'Overlay',
  'Navigation',
  'Disclosure',
  'Feedback',
  'Structure',
] as const;

/**
 * The semantic identity of a component.
 *
 * Every public ui2 component has exactly one Responsibility.
 * It determines:
 *   - which token families the component consumes (via resolveTokens)
 *   - the CSS variable namespaces the component is allowed to reference
 *
 * A component CANNOT change its Responsibility based on context, variant, or
 * usage. If a different Responsibility is needed → a different component must
 * exist.
 *
 * | Value       | Use for                                           |
 * |-------------|---------------------------------------------------|
 * | Action      | triggering commands or state changes              |
 * | Input       | direct user data entry                            |
 * | Selection   | choosing one or more options                      |
 * | Collection  | structured sets of items                          |
 * | Overlay     | temporary layered UI above the interface          |
 * | Navigation  | movement across destinations or views             |
 * | Disclosure  | revealing or hiding related content in place      |
 * | Feedback    | communicating state, status, or outcome           |
 * | Structure   | organizing interface structure and support surfaces|
 */
export type Responsibility = (typeof RESPONSIBILITIES)[number];

/* ------------------------------------------------------------------ */
/*  Evaluation — FSL Evaluation dimension                              */
/* ------------------------------------------------------------------ */

/**
 * All valid Evaluation values as an ordered const tuple.
 *
 * Values are identical to the FSL Lexicon §5. Every value has the canonical
 * meaning defined there.
 */
export const EVALUATIONS = [
  'primary',
  'secondary',
  'accent',
  'muted',
  'positive',
  'caution',
  'negative',
] as const;

/**
 * The evaluative or emphatic meaning carried by a component expression.
 *
 * Evaluation is foundational — it determines semantic emphasis before any
 * token color or visual realization is chosen.
 *
 * When omitted from a ComponentExpression, the default is inferred by the
 * resolver from the Responsibility + composition context.
 *
 * | Value     | Use for                                     |
 * |-----------|---------------------------------------------|
 * | primary   | main intended emphasis                      |
 * | secondary | subordinate but still intentional           |
 * | accent    | deliberately differentiated emphasis        |
 * | muted     | de-emphasized but still meaningful          |
 * | positive  | affirming, successful, or favorable         |
 * | caution   | warning or careful-attention signal         |
 * | negative  | harmful, erroneous, or adverse              |
 */
export type Evaluation = (typeof EVALUATIONS)[number];

/* ------------------------------------------------------------------ */
/*  Consequence — FSL Consequence dimension                            */
/* ------------------------------------------------------------------ */

/**
 * All valid Consequence values as an ordered const tuple.
 *
 * Values are identical to the FSL Lexicon §6. Every value has the canonical
 * meaning defined there.
 */
export const CONSEQUENCES = [
  'neutral',
  'reversible',
  'committing',
  'destructive',
  'interruptive',
  'recoverable',
  'safeDefaultRequired',
] as const;

/**
 * The user-facing consequence or risk profile carried by a component expression.
 *
 * Distinct from Evaluation: `negative` is evaluative meaning, `destructive`
 * is outcome risk. Both may appear simultaneously in the same expression.
 *
 * When omitted, `neutral` is the implicit default.
 *
 * | Value               | Use for                                       |
 * |---------------------|-----------------------------------------------|
 * | neutral             | no special risk profile                       |
 * | reversible          | effect can be undone                          |
 * | committing          | moves to a more committed state               |
 * | destructive         | causes deletion or materially harmful loss    |
 * | interruptive        | interrupts flow and demands handling          |
 * | recoverable         | adverse path exists but recovery is supported |
 * | safeDefaultRequired | the safer path must be privileged             |
 */
export type Consequence = (typeof CONSEQUENCES)[number];

/* ------------------------------------------------------------------ */
/*  ComponentExpression — the typed FSL semantic expression            */
/* ------------------------------------------------------------------ */

/**
 * The typed semantic expression for the Component Semantics Projection.
 *
 * This is the formal input contract of the resolver. It maps to the FSL
 * canonical expression shape:
 *
 *   FSL entity      → responsibility
 *   FSL evaluation  → evaluation
 *   FSL consequence → consequence
 *
 * FSL dimensions not present at this surface (structure, interaction, state,
 * layer, context) are resolved internally by the resolver from the
 * responsibility context.
 *
 * @example
 * // Minimal — standalone component
 * const expr: ComponentExpression = { responsibility: 'Action' };
 *
 * // Consequence-bearing — destructive action
 * const expr: ComponentExpression = {
 *   responsibility: 'Action',
 *   evaluation: 'negative',
 *   consequence: 'destructive',
 * };
 */
export type ComponentExpression = {
  responsibility: Responsibility;
  evaluation?: Evaluation;
  consequence?: Consequence;
};
