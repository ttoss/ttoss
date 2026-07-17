import {
  bruttal,
  createTheme,
  type DeepPartial,
  type ThemeBundle,
  type ThemeTokens,
} from '@ttoss/fsl-theme';

/**
 * Theme Lab editing model (PRD F2.2/F2.3).
 *
 * Phase-1 editable surface = **core color scales** (brand, neutral, and any
 * other hue the preset defines). Semantic color tokens are references, not
 * independently editable values, and core color edits are what produce the
 * cascade the "wow" depends on (brand.500 is referenced ~149× in the base
 * theme). Non-color families and semantic-ref remapping are deferred to a
 * later phase (recorded in PRD §14).
 *
 * The single source of truth is the override diff itself: a map of
 * `hue → step → hex`. That diff *is* the "changes vs preset" view (F2.3) and
 * *is* the `overrides` argument to `createTheme` for both live preview and
 * code export — one structure, no derived duplicate to keep in sync.
 */
export type ColorOverrides = Record<string, Record<string, string>>;

export type PresetId = 'base' | 'bruttal';

export interface PresetSpec {
  id: PresetId;
  label: string;
  description: string;
}

export const PRESETS: readonly PresetSpec[] = [
  {
    id: 'base',
    label: 'Base',
    description:
      'The default FSL foundation — light base with a dark alternate.',
  },
  {
    id: 'bruttal',
    label: 'Bruttal',
    description: 'The built-in high-contrast, expressive brand theme.',
  },
];

/** The unedited bundle for a preset — also the "fallback" chrome theme. */
export const presetBundle = (preset: PresetId): ThemeBundle => {
  return preset === 'bruttal' ? bruttal : createTheme();
};

/**
 * Build the live bundle: the preset with the color overrides applied. `base`
 * extends the default foundation; `bruttal` extends the built-in bundle so it
 * inherits bruttal's alternate. The nested override object satisfies
 * `DeepPartial<ThemeTokens>` structurally but the color-scale type requires a
 * `500` step, which a partial diff intentionally omits — hence the cast.
 */
export const buildBundle = (
  preset: PresetId,
  colors: ColorOverrides
): ThemeBundle => {
  const overrides = {
    core: { colors },
  } as DeepPartial<ThemeTokens>;

  return preset === 'bruttal'
    ? createTheme({ extends: bruttal, overrides })
    : createTheme({ overrides });
};

/** Immutable set of one color leaf. */
export const setColorLeaf = (
  colors: ColorOverrides,
  hue: string,
  step: string,
  value: string
): ColorOverrides => {
  return {
    ...colors,
    [hue]: { ...colors[hue], [step]: value },
  };
};

/** Immutable removal of one color leaf, pruning an emptied hue. */
export const removeColorLeaf = (
  colors: ColorOverrides,
  hue: string,
  step: string
): ColorOverrides => {
  const hueEntry = colors[hue];
  if (!hueEntry || !(step in hueEntry)) {
    return colors;
  }

  const nextHue = { ...hueEntry };
  delete nextHue[step];

  const next = { ...colors };
  if (Object.keys(nextHue).length === 0) {
    delete next[hue];
  } else {
    next[hue] = nextHue;
  }
  return next;
};

export interface ColorLeaf {
  hue: string;
  step: string;
}

/** Flatten the override diff into a stable, sorted leaf list. */
export const listColorLeaves = (colors: ColorOverrides): ColorLeaf[] => {
  const leaves: ColorLeaf[] = [];
  for (const hue of Object.keys(colors).sort()) {
    for (const step of Object.keys(colors[hue]).sort()) {
      leaves.push({ hue, step });
    }
  }
  return leaves;
};

export const hasOverrides = (colors: ColorOverrides): boolean => {
  return Object.keys(colors).length > 0;
};

/**
 * Generate a runnable `createTheme(...)` snippet reproducing the edited theme
 * (PRD F2.7). The override diff serializes directly as the `overrides` object
 * literal — numeric step keys quote to valid TS object keys.
 */
export const generateThemeCode = (
  preset: PresetId,
  colors: ColorOverrides
): string => {
  const overridesLiteral = JSON.stringify({ core: { colors } }, null, 2)
    .split('\n')
    .map((line, index) => {
      return index === 0 ? line : `  ${line}`;
    })
    .join('\n');

  if (preset === 'bruttal') {
    return [
      "import { bruttal, createTheme } from '@ttoss/fsl-theme';",
      '',
      'export const theme = createTheme({',
      '  extends: bruttal,',
      `  overrides: ${overridesLiteral},`,
      '});',
      '',
    ].join('\n');
  }

  return [
    "import { createTheme } from '@ttoss/fsl-theme';",
    '',
    'export const theme = createTheme({',
    `  overrides: ${overridesLiteral},`,
    '});',
    '',
  ].join('\n');
};
