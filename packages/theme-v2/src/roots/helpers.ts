import type { DeepPartial } from '../Types';
import type { ThemeTokensV2 } from '../Types';

// ---------------------------------------------------------------------------
// Token reference utilities
// ---------------------------------------------------------------------------

/** Check if a value is a token reference like `{core.colors.brand.500}` */
export const isTokenRef = (value: unknown): value is string => {
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

// ---------------------------------------------------------------------------
// Flatten + resolve all refs to raw values
// ---------------------------------------------------------------------------

/**
 * Flatten a `ThemeTokensV2` into a `Record<string, string | number>` with
 * every `{ref}` recursively resolved to its final raw value where possible.
 *
 * Unresolvable references (missing target or circular dependency) are
 * preserved as-is in the output rather than throwing. Use the dedicated
 * token validators if you need strict failure on bad references.
 *
 * This is the universal primitive — every root is derived from this.
 */
export const flattenAndResolve = (
  theme: ThemeTokensV2
): Record<string, string | number> => {
  // 1. Flatten both layers (refs still as `{path}` strings)
  const coreFlat = flattenObject(
    theme.core as unknown as Record<string, unknown>,
    'core'
  );
  const semanticFlat = flattenObject(
    theme.semantic as unknown as Record<string, unknown>,
    'semantic'
  );
  const all = { ...coreFlat, ...semanticFlat };

  // 2. Resolve every ref recursively (with cycle guard)

  /** Resolve a single pure `{path}` reference to its raw value. */
  const resolveRef = (
    value: string | number,
    seen: Set<string>
  ): string | number => {
    if (typeof value !== 'string' || !isTokenRef(value)) {
      return value;
    }

    const path = extractRefPath(value);

    if (seen.has(path)) {
      return value; // break circular reference — return unresolved
    }

    const target = all[path];
    if (target === undefined) {
      return value; // unresolvable reference — return as-is
    }

    seen.add(path);
    return resolveRef(target, seen);
  };

  /**
   * Resolve all embedded `{path}` refs in a raw string expression.
   *
   * Handles both pure refs (`{core.space.4}`) and compound expressions
   * (`clamp({core.space.4}, {core.space.6}, {core.space.12})`).
   */
  const resolveInline = (value: string, seen: Set<string>): string => {
    return value.replace(/\{([^}]+)\}/g, (_match, path) => {
      const target = all[path];
      if (target === undefined) {
        return `{${path}}`; // unresolvable — keep as-is
      }
      if (seen.has(path)) {
        return `{${path}}`; // cycle guard
      }
      const childSeen = new Set(seen).add(path);
      const resolved = resolveRef(target, childSeen);
      return String(resolved);
    });
  };

  const resolved: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(all)) {
    if (typeof value === 'string') {
      if (
        value.startsWith('{') &&
        value.endsWith('}') &&
        !value.slice(1, -1).includes('{')
      ) {
        // pure token ref e.g. {core.colors.brand.500}
        resolved[key] = resolveRef(value, new Set());
      } else if (value.includes('{')) {
        // compound expression with embedded refs (e.g. clamp({core.space.4}, ...))
        resolved[key] = resolveInline(value, new Set());
      } else {
        resolved[key] = value;
      }
    } else {
      resolved[key] = value;
    }
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

/**
 * Root 2 — Flat Token Map.
 *
 * Convert a `ThemeTokensV2` into a flat `Record<string, string | number>`
 * with dot-separated keys and all `{ref}` values recursively resolved
 * to their final raw value.
 */
export const toFlatTokens = (theme: ThemeTokensV2): FlatTokenMap => {
  return flattenAndResolve(theme);
};
