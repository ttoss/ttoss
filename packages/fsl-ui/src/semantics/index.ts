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
  CompositionRole,
  CompositionsFor,
  Consequence,
  ConsequencesFor,
  Entity,
  Evaluation,
  EvaluationsFor,
  State,
  StructuralRole,
  StructuresFor,
} from './taxonomy';
export {
  COMPOSITION_ROLES,
  CONSEQUENCES,
  ENTITIES,
  ENTITY_COMPOSITION,
  ENTITY_CONSEQUENCE,
  ENTITY_EVALUATION,
  ENTITY_STRUCTURE,
  EVALUATIONS,
  STATE_PRIORITY,
  STATES,
  STRUCTURAL_ROLES,
} from './taxonomy';
