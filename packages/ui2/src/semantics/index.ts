/**
 * Layer 1 — Semantic Foundation
 *
 * Public API: ComponentMeta is the only artifact consumers need.
 * Taxonomy internals (ENTITY_STRUCTURE, validateExpression, etc.) are available
 * via direct import from './taxonomy' when needed by tests or Layer 2.
 */

export type { ComponentMeta } from './componentMeta';
export type { EvaluationsFor } from './taxonomy';
