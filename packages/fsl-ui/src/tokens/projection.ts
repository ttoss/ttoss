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
 * Each context corresponds to a `vars.colors.{ux}` subtree in theme-v2.
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
 * The full Entity → token derivation record.
 *
 * Given an Entity, this tells you:
 * - `uxContext`: which `vars.colors.{ux}` subtree to use
 * - `surfaceType`: which non-color token family to use (control vs surface)
 */
export const ENTITY_TOKEN_MAPPING = {
  Action: { uxContext: 'action', surfaceType: 'control' },
  Input: { uxContext: 'input', surfaceType: 'control' },
  Selection: { uxContext: 'input', surfaceType: 'control' },
  Navigation: { uxContext: 'navigation', surfaceType: 'control' },
  Disclosure: { uxContext: 'navigation', surfaceType: 'control' },
  Overlay: { uxContext: 'informational', surfaceType: 'surface' },
  Feedback: { uxContext: 'feedback', surfaceType: 'surface' },
  Collection: { uxContext: 'informational', surfaceType: 'surface' },
  Structure: { uxContext: 'informational', surfaceType: 'surface' },
} as const satisfies Record<
  Entity,
  {
    uxContext: UxContext;
    surfaceType: SurfaceType;
  }
>;

/** UX color context for a given Entity. */
export type UxContextFor<E extends Entity> =
  (typeof ENTITY_TOKEN_MAPPING)[E]['uxContext'];

/** Surface type for a given Entity. */
export type SurfaceTypeFor<E extends Entity> =
  (typeof ENTITY_TOKEN_MAPPING)[E]['surfaceType'];
