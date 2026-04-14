/**
 * Layer 1 — Semantic Foundation: Component Meta
 *
 * ComponentMeta is the formal semantic identity of a component.
 * It declares what a component *is* — independently of how it looks,
 * which tokens it picks, or which React Aria primitives it uses.
 *
 * Consumed by:
 *   - Layer 2 (projection.ts) to derive valid evaluations and token subtrees
 *   - Contract tests (auto-discovered via *Meta export naming convention)
 */

import type { Entity, InteractionsFor, StructuresFor } from './taxonomy';

export interface ComponentMeta<E extends Entity = Entity> {
  /** Display name — used by React DevTools and contract test auto-discovery. */
  displayName: string;
  /** FSL Entity Kind — drives which token subtree and legality rules apply. */
  entity: E;
  /** Structural role of the root element. */
  structure: StructuresFor<E>;
  /** Interaction kind expressed by the component (if interactive). */
  interaction?: InteractionsFor<E>;
}
