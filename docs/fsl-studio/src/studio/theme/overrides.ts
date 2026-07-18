import {
  createTheme,
  type DeepPartial,
  type ThemeBundle,
  type ThemeTokens,
} from '@ttoss/fsl-theme';

import { AUTHORED_PRESETS, presetBundle, type PresetId } from './presets';

/**
 * Theme Lab editing model (PRD F2.2/F2.3).
 *
 * The editable surface is any token leaf, addressed by its flat dotted path:
 * core values (`core.colors.brand.500`, `core.radii.md`, …) and semantic
 * remaps (`semantic.radii.control` → `{core.radii.none}`, …). The single
 * source of truth is the override diff itself — a flat `path → value` map.
 * That diff *is* the "changes vs preset" view (F2.3) and, unflattened, *is*
 * the `overrides` argument to `createTheme` for both live preview and code
 * export — one structure, no derived duplicate to keep in sync.
 */
export type TokenOverrides = Record<string, string>;

export type { PresetId };

/** Immutable set of one token leaf. */
export const setToken = (
  overrides: TokenOverrides,
  path: string,
  value: string
): TokenOverrides => {
  return { ...overrides, [path]: value };
};

/** Immutable removal of one token leaf. */
export const removeToken = (
  overrides: TokenOverrides,
  path: string
): TokenOverrides => {
  if (!(path in overrides)) {
    return overrides;
  }
  const next = { ...overrides };
  delete next[path];
  return next;
};

/** The override diff as a stable, sorted path list. */
export const listTokenPaths = (overrides: TokenOverrides): string[] => {
  return Object.keys(overrides).sort();
};

export const hasOverrides = (overrides: TokenOverrides): boolean => {
  return Object.keys(overrides).length > 0;
};

/**
 * Unflatten the diff's dotted paths into the nested object `createTheme`
 * expects. A non-leaf collision (a path that is a prefix of another) keeps
 * the deeper structure: sorted iteration puts the prefix first, so the deeper
 * path's segment walk replaces the stray leaf — the UI only produces leaf
 * paths, this only matters for defensively handling foreign URL payloads.
 */
export const nestOverrides = (
  overrides: TokenOverrides
): DeepPartial<ThemeTokens> => {
  const root: Record<string, unknown> = {};

  for (const path of listTokenPaths(overrides)) {
    const segments = path.split('.');
    let node = root;
    for (const segment of segments.slice(0, -1)) {
      const existing = node[segment];
      if (typeof existing === 'object' && existing !== null) {
        node = existing as Record<string, unknown>;
      } else {
        const child: Record<string, unknown> = {};
        node[segment] = child;
        node = child;
      }
    }
    node[segments[segments.length - 1]] = overrides[path];
  }

  return root as DeepPartial<ThemeTokens>;
};

/**
 * Minimal recursive merge for plain override objects (`b` wins on leaves).
 * Used to inline an authored preset's overrides under the user diff for code
 * export, and to resolve the dark alternate for contrast checks.
 */
export const mergeDeep = <T extends Record<string, unknown>>(
  a: T,
  b: Record<string, unknown>
): T => {
  const out: Record<string, unknown> = { ...a };
  for (const key of Object.keys(b)) {
    const prev = out[key];
    const next = b[key];
    out[key] =
      typeof prev === 'object' &&
      prev !== null &&
      typeof next === 'object' &&
      next !== null
        ? mergeDeep(
            prev as Record<string, unknown>,
            next as Record<string, unknown>
          )
        : next;
  }
  return out as T;
};

/**
 * Build the live bundle: the preset with the override diff applied on top.
 * Extending the preset's bundle inherits its alternate (dark mode) too.
 */
export const buildBundle = (
  preset: PresetId,
  overrides: TokenOverrides
): ThemeBundle => {
  return createTheme({
    extends: presetBundle(preset),
    overrides: nestOverrides(overrides),
  });
};

const serializeOverrides = (nested: object): string => {
  return JSON.stringify(nested, null, 2)
    .split('\n')
    .map((line, index) => {
      return index === 0 ? line : `  ${line}`;
    })
    .join('\n');
};

/**
 * Generate a runnable `createTheme(...)` snippet reproducing the edited theme
 * (PRD F2.7). `base` embeds the diff alone; `bruttal` extends the published
 * export; Studio-authored presets inline their own overrides under the diff
 * (merged, diff wins) so the exported code runs anywhere without the Studio.
 */
export const generateThemeCode = (
  preset: PresetId,
  overrides: TokenOverrides
): string => {
  const nested = nestOverrides(overrides);

  if (preset === 'bruttal') {
    return [
      "import { bruttal, createTheme } from '@ttoss/fsl-theme';",
      '',
      'export const theme = createTheme({',
      '  extends: bruttal,',
      `  overrides: ${serializeOverrides(nested)},`,
      '});',
      '',
    ].join('\n');
  }

  const authored = AUTHORED_PRESETS[preset];
  const merged = authored
    ? mergeDeep(
        authored.overrides as Record<string, unknown>,
        nested as Record<string, unknown>
      )
    : nested;

  return [
    "import { createTheme } from '@ttoss/fsl-theme';",
    '',
    'export const theme = createTheme({',
    `  overrides: ${serializeOverrides(merged)},`,
    '});',
    '',
  ].join('\n');
};
