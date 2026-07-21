import { type ThemeBundle } from '@ttoss/fsl-theme';
import { type FlatTokenMap } from '@ttoss/fsl-theme/css';

/**
 * Token-tree projection for the Theme Lab navigator (PRD F2.1).
 *
 * The navigator opens at the **semantic** layer grouped by family; `core` is
 * one level down, on demand (progressive disclosure — never ~500 leaves at
 * once). This module derives that tree from a theme bundle: families in the
 * PRD's canonical order, semantic colors further grouped by ux context, and
 * every leaf carrying its **raw** value (`{ref}` strings included) — the raw
 * value is what a remap edits (PRD F2.2).
 */

export interface TokenLeaf {
  /** Flat dotted path, e.g. `semantic.radii.control`. */
  path: string;
  /** Raw authored value — a `{ref}` string or a literal. */
  raw: string;
}

export interface TokenGroup {
  /** Sub-group label (ux context for semantic colors), '' for a flat family. */
  label: string;
  leaves: TokenLeaf[];
}

export interface TokenFamily {
  family: string;
  groups: TokenGroup[];
  leafCount: number;
}

/** Flatten a nested token object into raw leaves, sorted by path. */
export const flattenLeaves = (
  node: Record<string, unknown>,
  prefix: string
): TokenLeaf[] => {
  const leaves: TokenLeaf[] = [];
  for (const key of Object.keys(node).sort()) {
    const value = node[key];
    const path = `${prefix}.${key}`;
    if (typeof value === 'object' && value !== null) {
      leaves.push(...flattenLeaves(value as Record<string, unknown>, path));
    } else if (value !== undefined) {
      leaves.push({ path, raw: String(value) });
    }
  }
  return leaves;
};

/** Canonical semantic family order (PRD F2.1). */
export const SEMANTIC_FAMILIES = [
  'colors',
  'text',
  'spacing',
  'sizing',
  'radii',
  'border',
  'focus',
  'elevation',
  'opacity',
  'overlay',
  'motion',
  'zIndex',
] as const;

const groupByFirstSegment = (
  leaves: TokenLeaf[],
  prefixLength: number
): TokenGroup[] => {
  const byLabel = new Map<string, TokenLeaf[]>();
  for (const leaf of leaves) {
    const label = leaf.path.split('.')[prefixLength];
    const bucket = byLabel.get(label);
    if (bucket) {
      bucket.push(leaf);
    } else {
      byLabel.set(label, [leaf]);
    }
  }
  return [...byLabel.entries()].map(([label, groupLeaves]) => {
    return { label, leaves: groupLeaves };
  });
};

const toFamily = (
  family: string,
  node: Record<string, unknown>,
  layer: 'semantic' | 'core'
): TokenFamily => {
  const leaves = flattenLeaves(node, `${layer}.${family}`);
  // Colors are by far the largest family — group them one level deeper
  // (ux context for semantic, hue for core) so no group dumps hundreds of
  // leaves at once (Miller/chunking, PRD §6.5).
  const groups =
    family === 'colors'
      ? groupByFirstSegment(leaves, 2)
      : [{ label: '', leaves }];
  return { family, groups, leafCount: leaves.length };
};

/**
 * The semantic layer of a bundle as ordered families. The `dataviz` extension
 * is not part of the F2.1 family list and is omitted.
 */
export const semanticFamilies = (bundle: ThemeBundle): TokenFamily[] => {
  const semantic = bundle.base.semantic as unknown as Record<string, unknown>;
  return SEMANTIC_FAMILIES.filter((family) => {
    return typeof semantic[family] === 'object' && semantic[family] !== null;
  }).map((family) => {
    return toFamily(
      family,
      semantic[family] as Record<string, unknown>,
      'semantic'
    );
  });
};

/**
 * The core layer as families, colors excluded — core color scales get the
 * dedicated picker editor (the SC-1 "wow" surface), not generic rows.
 */
export const coreFamilies = (bundle: ThemeBundle): TokenFamily[] => {
  const core = bundle.base.core as unknown as Record<string, unknown>;
  return Object.keys(core)
    .sort()
    .filter((family) => {
      return (
        family !== 'colors' &&
        family !== 'dataviz' &&
        typeof core[family] === 'object' &&
        core[family] !== null
      );
    })
    .map((family) => {
      return toFamily(family, core[family] as Record<string, unknown>, 'core');
    });
};

/**
 * Broken references in a **resolved** flat map (PRD F2.2 live validation).
 * `toFlatTokens` leaves unresolvable refs (missing target or circular) as
 * `{path}` in the output, so any surviving brace expression marks a broken
 * token — the same mechanical check `validateRefs` performs, but readable as
 * data instead of console output (recorded in PRD §14).
 */
export const findBrokenRefs = (flat: FlatTokenMap): string[] => {
  return Object.keys(flat)
    .filter((key) => {
      const value = flat[key];
      return typeof value === 'string' && /\{[^}]+\}/.test(value);
    })
    .sort();
};
