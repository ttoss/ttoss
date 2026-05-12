import type { ThemeTokens } from '../Types';
import { isPlainObject } from './helpers';
import { toCssVarName } from './toCssVars';

// ---------------------------------------------------------------------------
// CssVarsMap — recursive type that mirrors a token shape with string leaves
// ---------------------------------------------------------------------------

/**
 * Transforms a token-tree type into an identical structure where every leaf
 * value becomes `string` (a CSS `var(--tt-*)` reference).
 *
 * Keys starting with `$` (e.g. `$deprecated`) are excluded — they are
 * metadata, not consumable tokens.
 *
 * Optional keys in the source type remain optional in the mapped type, so
 * theme extensions such as `dataviz?` are typed as `CssVarsMap<...> | undefined`
 * and TypeScript will require callers to guard against `undefined` before
 * accessing their members.
 *
 * @example
 * ```ts
 * type Colors = { action: { primary: { background: { default: TokenRef } } } };
 * type ColorVars = CssVarsMap<Colors>;
 * // → { action: { primary: { background: { default: string } } } }
 * ```
 */
export type CssVarsMap<T> = {
  [K in keyof T as K extends `$${string}` ? never : K]: NonNullable<
    T[K]
  > extends string | number
    ? string
    : undefined extends T[K]
      ? CssVarsMap<NonNullable<T[K]>> | undefined
      : CssVarsMap<NonNullable<T[K]>>;
};

// ---------------------------------------------------------------------------
// buildVarsMap
// ---------------------------------------------------------------------------

/**
 * Build a deeply-nested CSS var-reference map from a theme's semantic layer.
 *
 * Walks `theme.semantic` recursively and replaces every leaf value with the
 * corresponding `var(--tt-*)` CSS custom property reference. The resulting
 * object has the exact same shape as `theme.semantic` but with `string` leaves.
 *
 * Keys starting with `$` are skipped (deprecation metadata).
 *
 * @example
 * ```ts
 * import { buildVarsMap } from './roots/toVars';
 * import { baseTheme } from './baseTheme';
 *
 * const vars = buildVarsMap(baseTheme);
 * vars.colors.action.primary.background.default
 * // → 'var(--tt-action-primary-background-default)'
 * ```
 */
export const buildVarsMap = (
  theme: ThemeTokens
): CssVarsMap<ThemeTokens['semantic']> => {
  const walk = (
    obj: Record<string, unknown>,
    prefix: string
  ): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Skip metadata keys ($deprecated, $type, etc.)
      if (key.startsWith('$')) continue;

      const fullPath = `${prefix}.${key}`;

      if (isPlainObject(value)) {
        result[key] = walk(value as Record<string, unknown>, fullPath);
      } else if (typeof value === 'string' || typeof value === 'number') {
        result[key] = `var(${toCssVarName(fullPath)})`;
      }
    }

    return result;
  };

  return walk(
    theme.semantic as unknown as Record<string, unknown>,
    'semantic'
  ) as CssVarsMap<ThemeTokens['semantic']>;
};
