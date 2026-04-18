/**
 * Shared token introspection utilities for storybook2 token browser stories.
 *
 * Exposes programmatically-derived data from @ttoss/theme2 so that every
 * token family story can render itself from a single source of truth — the
 * theme itself — rather than hand-curated lists.
 *
 * Core APIs used:
 *   createTheme      → @ttoss/theme2
 *   toFlatTokens     → @ttoss/theme2/css   (resolved flat map)
 *   toCssVarName     → @ttoss/theme2/css   (path → CSS custom property name)
 */
import { createTheme } from '@ttoss/theme2';
import { toCssVarName, toFlatTokens } from '@ttoss/theme2/css';

export { toCssVarName };

// ---------------------------------------------------------------------------
// Bootstrap — single createTheme call shared across all token stories
// ---------------------------------------------------------------------------
const _theme = createTheme();

// ---------------------------------------------------------------------------
// Internal leaf walker
// ---------------------------------------------------------------------------
const walkLeaves = (
  obj: Record<string, unknown>,
  prefix: string
): Record<string, string | number> => {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue; // skip DTCG metadata ($type, $deprecated…)
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, walkLeaves(v as Record<string, unknown>, path));
    } else if (typeof v === 'string' || typeof v === 'number') {
      out[path] = v;
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// Raw token maps
// ---------------------------------------------------------------------------

/**
 * Flat map of all core tokens with their raw primitive values (hex, px, etc.).
 * Values are stable across all themes — these are the design PRIMITIVES.
 */
export const rawCoreTokens: Record<string, string | number> = walkLeaves(
  _theme.base.core as unknown as Record<string, unknown>,
  'core'
);

/**
 * Flat map of all semantic tokens with UNRESOLVED ref strings.
 * e.g. `semantic.colors.action.primary.background.default` → `{core.colors.neutral.1000}`
 *
 * Use this to extract the core→semantic mapping graph.
 */
export const rawSemanticTokens: Record<string, string | number> = walkLeaves(
  _theme.base.semantic as unknown as Record<string, unknown>,
  'semantic'
);

/**
 * All tokens (core + semantic) with every `{ref}` recursively resolved to raw values.
 * Used to show the actual resolved value next to the CSS var.
 */
export const resolvedTokens: Record<string, string | number> = toFlatTokens(
  _theme.base
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when a token value is a pure `{path}` reference. */
export const isRef = (v: string | number): boolean => {
  return typeof v === 'string' && v.startsWith('{') && v.endsWith('}');
};

/** Extract path from a ref string: `{core.colors.brand.500}` → `core.colors.brand.500` */
export const deref = (ref: string | number): string => {
  return String(ref).slice(1, -1);
};

/** True when a string value looks like a CSS hex/rgb/hsl color. */
export const isCssColor = (v: string | number): boolean => {
  if (typeof v !== 'string') return false;
  return (
    /^#[0-9a-f]{3,8}$/i.test(v) || v.startsWith('rgb') || v.startsWith('hsl')
  );
};

/**
 * Filter token entries by path prefix, sorted by path.
 * Returns `[path, rawValue]` pairs.
 */
export const byPrefix = (
  tokens: Record<string, string | number>,
  prefix: string
): [string, string | number][] => {
  return Object.entries(tokens)
    .filter(([path]) => {
      return path.startsWith(prefix);
    })
    .sort(([a], [b]) => {
      return a.localeCompare(b);
    });
};

// ---------------------------------------------------------------------------
// Core → Semantic adjacency map
// ---------------------------------------------------------------------------

export interface SemanticRef {
  /** Full semantic token path. */
  semanticPath: string;
  /** CSS custom property name, e.g. `--tt-colors-action-primary-background-default` */
  cssVar: string;
}

/**
 * Map from core token path → all semantic tokens that reference it (pure refs only).
 *
 * This is the structural backbone of the token graph — it reveals exactly which
 * semantic roles each core primitive serves, and which primitives are "hot" (many
 * semantic consumers) vs. "cold" (unique usage).
 *
 * When the toolbar theme changes, the CSS vars still carry the right values because
 * ThemeProvider re-injects the full CSS custom property set — both core and semantic.
 */
export const coreSemanticMap: Map<string, SemanticRef[]> = (() => {
  const map = new Map<string, SemanticRef[]>();
  for (const [semPath, rawVal] of Object.entries(rawSemanticTokens)) {
    if (!isRef(rawVal)) continue;
    const corePath = deref(rawVal);
    if (!map.has(corePath)) map.set(corePath, []);
    map.get(corePath)!.push({
      semanticPath: semPath,
      cssVar: toCssVarName(semPath),
    });
  }
  return map;
})();

// ---------------------------------------------------------------------------
// Palette grouping helpers
// ---------------------------------------------------------------------------

/**
 * Group core color tokens by palette name.
 * Returns `{ brand: [[path, val], ...], neutral: [...], ... }` sorted by scale.
 */
export const coreColorPalettes: Record<string, [string, string | number][]> =
  (() => {
    const groups: Record<string, [string, string | number][]> = {};
    for (const entry of byPrefix(rawCoreTokens, 'core.colors.')) {
      const [path] = entry;
      const palette = path.slice('core.colors.'.length).split('.')[0];
      if (!groups[palette]) groups[palette] = [];
      groups[palette].push(entry);
    }
    return groups;
  })();

/**
 * Group semantic color tokens by UX role (action, input, informational, navigation…).
 * Returns `{ action: [[path, val], ...], ... }`.
 */
export const semanticColorGroups: Record<string, [string, string | number][]> =
  (() => {
    const groups: Record<string, [string, string | number][]> = {};
    for (const entry of byPrefix(rawSemanticTokens, 'semantic.colors.')) {
      const [path] = entry;
      const role = path.slice('semantic.colors.'.length).split('.')[0];
      if (!groups[role]) groups[role] = [];
      groups[role].push(entry);
    }
    return groups;
  })();
