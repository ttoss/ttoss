/**
 * Layer 1 — Semantic Foundation: Component Meta
 *
 * ComponentMeta is the formal semantic identity of a component.
 * It declares what a component *is* — independently of how it looks,
 * which tokens it picks, or which React Aria primitives it uses.
 *
 * Consumed by:
 *   - Layer 2 (`src/tokens/CONTRACT.md`) to derive valid evaluations and
 *     `vars.*` subtrees from `entity` — see CONTRACT.md §0–§2.
 *   - Contract tests (auto-discovered via *Meta export naming convention).
 */

import type {
  CompositionsFor,
  Entity,
  InteractionsFor,
  StructuresFor,
} from './taxonomy';

export interface ComponentMeta<E extends Entity = Entity> {
  /** Display name — used by React DevTools and contract test auto-discovery. */
  displayName: string;
  /**
   * FSL Entity Kind — drives which token subtree and legality rules apply.
   * @see ../tokens/CONTRACT.md §1 — Entity → Token Map
   */
  entity: E;
  /**
   * Structural role of the root element.
   * @see ../tokens/CONTRACT.md §5 — data-part convention
   */
  structure: StructuresFor<E>;
  /**
   * Interaction kind expressed by the component (if interactive).
   * @see ../tokens/CONTRACT.md §2 — Colors path uses interaction to derive state
   */
  interaction?: InteractionsFor<E>;
  /**
   * Slot this component plays inside a parent composition (FSL §4 / §5.4).
   * Present on sub-parts of a composite (e.g. DialogHeading → 'heading',
   * TextFieldLabel → 'label') and on leaf entities participating in a slot
   * (e.g. a confirm Button inside DialogActions → 'primaryAction').
   * Legality is enforced by `ENTITY_COMPOSITION[entity]`.
   */
  composition?: CompositionsFor<E>;
}
