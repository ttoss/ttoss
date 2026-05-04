/**
 * Layer 1 — Semantic Foundation
 *
 * Public API: ComponentMeta is the only artifact consumers need.
 * Taxonomy internals (ENTITY_STRUCTURE, ENTITY_EVALUATION, etc.) are available
 * via direct import from './taxonomy' when needed by tests or Layer 2.
 *
 * Token-projection types (UxContextFor, SurfaceTypeFor) live in
 * `../tokens/projection` — not here. The foundation layer is projection-free.
 */

export type { ComponentMeta } from './componentMeta';
export type {
  CompositionsFor,
  ConsequencesFor,
  EvaluationsFor,
} from './taxonomy';
