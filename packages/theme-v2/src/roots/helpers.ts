import type { DeepPartial } from '../Types';
import type { ThemeTokens } from '../Types';

// ---------------------------------------------------------------------------
// Token reference utilities
// ---------------------------------------------------------------------------

/** Check if a value is a token reference like `{core.colors.brand.500}` */
export const isTokenRef = (value: unknown): value is `{${string}}` => {
  return (
    typeof value === 'string' &&
    value.length > 2 &&
    value.startsWith('{') &&
    value.endsWith('}')
  );
};

/** Extract the inner path from a token reference: `{core.colors.brand.500}` → `core.colors.brand.500` */
export const extractRefPath = (ref: string): string => {
  return ref.slice(1, -1);
};

// ---------------------------------------------------------------------------
// ID validation
// ---------------------------------------------------------------------------

/**
 * Allowed characters for a theme identifier: alphanumeric, hyphens, underscores.
 * Shared between toCssVars (CSS selector injection guard) and ssrScript (SSR inline script).
 * A single definition prevents the two validation paths from silently diverging.
 */
export const SAFE_ID_RE = /^[a-zA-Z0-9_-]+$/;

/**
 * Matches every `{token.path}` reference embedded in a string value.
 * Shared between helpers.ts (toFlatTokens) and toCssVars.ts (inlineRefsToVars)
 * so a single definition governs the `{…}` syntax in both resolution paths.
 */
export const COMPOUND_REF_RE = /\{([^}]+)\}/g;

// ---------------------------------------------------------------------------
// Object traversal
// ---------------------------------------------------------------------------

export const isPlainObject = (
  value: unknown
): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// ---------------------------------------------------------------------------
// Deep Merge
// ---------------------------------------------------------------------------

/**
 * Recursively merges `overrides` into `base`.
 * - Plain objects are merged recursively.
 * - All other values (primitives, arrays) are replaced.
 */
export const deepMerge = <T>(base: T, overrides: DeepPartial<T>): T => {
  if (!isPlainObject(base) || !isPlainObject(overrides)) {
    return (overrides ?? base) as T;
  }

  const result = { ...base } as Record<string, unknown>;

  for (const key of Object.keys(overrides)) {
    const baseVal = result[key];
    const overVal = (overrides as Record<string, unknown>)[key];

    if (overVal === undefined) {
      continue;
    }

    if (isPlainObject(baseVal) && isPlainObject(overVal)) {
      result[key] = deepMerge(baseVal, overVal);
    } else {
      result[key] = overVal;
    }
  }

  return result as T;
};

/**
 * Flatten a nested object into a flat record with dot-separated keys.
 *
 * `{ brand: { 500: '#0469E3' } }` → `{ 'brand.500': '#0469E3' }`
 */
export const flattenObject = (
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, string | number> => {
  const result: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else if (typeof value === 'string' || typeof value === 'number') {
      result[fullKey] = value;
    }
  }

  return result;
};

/**
 * Flatten a `ThemeTokens` into separate `{ core, semantic }` flat records
 * with dot-separated keys. Centralizes the unsafe casts needed to traverse
 * the opaque token trees.
 *
 * Used by both `toFlatTokens` (resolution) and `buildCssVars` (CSS emission)
 * so the casts live in exactly one place.
 */
export const flattenTheme = (
  theme: ThemeTokens
): {
  core: Record<string, string | number>;
  semantic: Record<string, string | number>;
} => {
  return {
    core: flattenObject(
      theme.core as unknown as Record<string, unknown>,
      'core'
    ),
    semantic: flattenObject(
      theme.semantic as unknown as Record<string, unknown>,
      'semantic'
    ),
  };
};

// ---------------------------------------------------------------------------
// Flatten + resolve all refs to raw values
// ---------------------------------------------------------------------------

/**
 * Flatten a `ThemeTokens` into a `Record<string, string | number>` with
 * every `{ref}` recursively resolved to its final raw value where possible.
 *
 * By default, unresolvable references (missing target or circular dependency)
 * are preserved as-is in the output. Pass `{ strict: true }` to instead throw
 * on any unresolved reference — useful in tests and build steps that must
 * fail loudly on palette drift.
 *
 * This is the universal primitive — every root is derived from this.
 */
export const toFlatTokens = (
  theme: ThemeTokens,
  options: { strict?: boolean } = {}
): Record<string, string | number> => {
  const { strict = false } = options;

  // 1. Flatten both layers (refs still as `{path}` strings)
  const { core: coreFlat, semantic: semanticFlat } = flattenTheme(theme);
  const all = { ...coreFlat, ...semanticFlat };

  // Collected when `strict` is enabled; reported as a single error so the
  // caller sees every unresolved ref in one pass rather than one at a time.
  const unresolved: string[] = [];
  const reportUnresolved = (key: string, path: string, reason: string) => {
    if (strict) unresolved.push(`${key} → {${path}} (${reason})`);
  };

  // 2. Resolve every ref recursively (with cycle guard)

  /** Resolve a single pure `{path}` reference to its raw value. */
  const resolveRef = (
    value: string | number,
    seen: Set<string>,
    ownerKey: string
  ): string | number => {
    if (typeof value !== 'string' || !isTokenRef(value)) {
      return value;
    }

    const path = extractRefPath(value);

    if (seen.has(path)) {
      reportUnresolved(ownerKey, path, 'circular reference');
      return value; // break circular reference — return unresolved
    }

    const target = all[path];
    if (target === undefined) {
      reportUnresolved(ownerKey, path, 'missing target');
      return value; // unresolvable reference — return as-is
    }

    seen.add(path);
    return resolveRef(target, seen, ownerKey);
  };

  /**
   * Resolve all embedded `{path}` refs in a raw string expression.
   *
   * Handles both pure refs (`{core.space.4}`) and compound expressions
   * (`clamp({core.space.4}, {core.space.6}, {core.space.12})`).
   */
  const resolveInline = (
    value: string,
    seen: Set<string>,
    ownerKey: string
  ): string => {
    return value.replace(COMPOUND_REF_RE, (_match, path) => {
      const target = all[path];
      if (target === undefined) {
        reportUnresolved(ownerKey, path, 'missing target');
        return `{${path}}`; // unresolvable — keep as-is
      }
      if (seen.has(path)) {
        reportUnresolved(ownerKey, path, 'circular reference');
        return `{${path}}`; // cycle guard
      }
      const childSeen = new Set(seen).add(path);
      const resolved = resolveRef(target, childSeen, ownerKey);
      return String(resolved);
    });
  };

  const resolved: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(all)) {
    if (typeof value === 'string') {
      if (isTokenRef(value)) {
        // pure token ref e.g. {core.colors.brand.500}
        resolved[key] = resolveRef(value, new Set(), key);
      } else if (value.includes('{')) {
        // compound expression with embedded refs (e.g. clamp({core.space.4}, ...))
        resolved[key] = resolveInline(value, new Set(), key);
      } else {
        resolved[key] = value;
      }
    } else {
      resolved[key] = value;
    }
  }

  if (strict && unresolved.length > 0) {
    throw new Error(
      `toFlatTokens: ${unresolved.length} unresolved reference(s):\n  ${unresolved.join('\n  ')}`
    );
  }

  return resolved;
};

// ---------------------------------------------------------------------------
// Flat Token Map (public surface)
// ---------------------------------------------------------------------------

/**
 * A flat map of dot-path token keys to resolved raw values.
 *
 * Most `{ref}` values are recursively resolved. Unresolvable or circular
 * references are preserved as their original `{path}` string.
 */
export type FlatTokenMap = Record<string, string | number>;
