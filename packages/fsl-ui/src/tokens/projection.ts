/**
 * Layer 2 — Semantic Token Projection
 *
 * Maps each FSL Entity (foundation layer — `../semantics/taxonomy`) to the
 * token-layer coordinates it consumes: the `vars.colors.{ux}` subtree and
 * the control-vs-surface family that drives radii, border, sizing, and
 * spacing tokens.
 *
 * These symbols are **projection-only** (FSL Structural Language §13.1 —
 * Semantic Token Projection). They live in `tokens/` — not `semantics/` —
 * because they exist exclusively because the token layer needs them. The
 * FSL boundary rule (§13.2) is therefore structural here, not editorial.
 *
 * Consumed by:
 *   - `CONTRACT.md` — AI-facing guide that tells component authors which
 *     `vars.*` paths to use per Entity.
 *   - Contract tests (`tests/unit/tests/components.contract.test.tsx`) —
 *     enforce entity → ux-context alignment in component sources.
 *
 * @see ../semantics/taxonomy.ts — foundation vocabulary this projection rests on.
 * @see ./CONTRACT.md — operational guide that consumes this mapping.
 */

import type { Entity } from '../semantics/taxonomy';

// ---------------------------------------------------------------------------
// Entity → UX Context Mapping (CONTRACT.md §1.1)
//
// Each Entity maps to a UX color context. The grouping rationale (5 contexts
// for 9 entities) is documented in CONTRACT.md §1.1 and enforced by invariant
// tests. Surface type (control vs surface) derives all non-color token
// columns. See CONTRACT.md §1.1 for the full derivation rules.
// ---------------------------------------------------------------------------

/**
 * UX color contexts — the Colors column of CONTRACT.md §1.
 * Each context corresponds to a `vars.colors.{ux}` subtree in @ttoss/fsl-theme.
 */
export const UX_CONTEXTS = [
  'action',
  'input',
  'navigation',
  'feedback',
  'informational',
] as const;
export type UxContext = (typeof UX_CONTEXTS)[number];

/**
 * Surface types — derives all non-color token columns (Radii, Border, Sizing, Spacing).
 *
 * - `control`: user operates this directly (hit targets, control radii)
 * - `surface`: carries content for the user (surface radii, no hit sizing)
 */
export const SURFACE_TYPES = ['control', 'surface'] as const;
export type SurfaceType = (typeof SURFACE_TYPES)[number];

/**
 * Type families — the Typography column of CONTRACT.md §1.
 *
 * Data rather than prose, because the column carries a legality claim and the
 * colour column's history is the argument: colours are mechanically audited and
 * have been corrected many times; typography lived only in the table and the
 * one contradiction in it survived two components (F-064).
 *
 * `display` is deliberately absent: no §1 row names it (`Text`'s `display-sm`
 * variant reads it without a row that grants it). That divergence is recorded,
 * not resolved here — encoding it as legal would decide it by omission.
 */
export const TYPE_FAMILIES = ['action', 'label', 'body', 'title'] as const;
export type TypeFamily = (typeof TYPE_FAMILIES)[number];

/**
 * The full Entity → token derivation record.
 *
 * Given an Entity, this tells you:
 * - `uxContext`: which `vars.colors.{ux}` subtree to use
 * - `surfaceType`: which non-color token family to use (control vs surface)
 * - `typography`: which `vars.text.{family}` subtrees the entity may set type
 *   from. Constrained by invariant #16 against `ENTITY_STRUCTURE`: an entity
 *   that can name a `title` **over** a `body` must be able to type it, because
 *   no `label.*` step outranks `body.md` — every one of them is weight 400 and
 *   the largest merely ties it (F-064).
 */
export const ENTITY_TOKEN_MAPPING = {
  Action: {
    uxContext: 'action',
    surfaceType: 'control',
    typography: ['action'],
  },
  Input: { uxContext: 'input', surfaceType: 'control', typography: ['label'] },
  Selection: {
    uxContext: 'input',
    surfaceType: 'control',
    typography: ['label'],
  },
  Navigation: {
    uxContext: 'navigation',
    surfaceType: 'control',
    typography: ['label'],
  },
  Disclosure: {
    uxContext: 'navigation',
    surfaceType: 'control',
    typography: ['label'],
  },
  Overlay: {
    uxContext: 'informational',
    surfaceType: 'surface',
    typography: ['title', 'body', 'label'],
  },
  Feedback: {
    uxContext: 'feedback',
    surfaceType: 'surface',
    typography: ['title', 'body', 'label'],
  },
  Collection: {
    uxContext: 'informational',
    surfaceType: 'surface',
    typography: ['body', 'label'],
  },
  Structure: {
    uxContext: 'informational',
    surfaceType: 'surface',
    typography: ['title', 'body', 'label'],
  },
} as const satisfies Record<
  Entity,
  {
    uxContext: UxContext;
    surfaceType: SurfaceType;
    typography: ReadonlyArray<TypeFamily>;
  }
>;

/** UX color context for a given Entity. */
export type UxContextFor<E extends Entity> =
  (typeof ENTITY_TOKEN_MAPPING)[E]['uxContext'];

/** Surface type for a given Entity. */
export type SurfaceTypeFor<E extends Entity> =
  (typeof ENTITY_TOKEN_MAPPING)[E]['surfaceType'];
