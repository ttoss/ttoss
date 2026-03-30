import { createTheme } from '../../createTheme';
import { aurora } from '../../themes/aurora';
import { bruttal } from '../../themes/bruttal';
import { defaultTheme } from '../../themes/default';
import { neon } from '../../themes/neon';
import { oca } from '../../themes/oca';
import { terra } from '../../themes/terra';
import type { ThemeTokensV2 } from '../../Types';
import type { CoreDataviz, SemanticDataviz } from '../Types';
import { coreDatavizAurora } from './aurora';
import { coreDatavizBruttal } from './bruttal';
import { coreDatavizDefault } from './default';
import { coreDatavizNeon } from './neon';
import { coreDatavizOca } from './oca';
import { coreDatavizTerra } from './terra';

// -- Per-theme core dataviz palettes ----------------------------------------

export { coreDatavizAurora } from './aurora';
export { coreDatavizBruttal } from './bruttal';
export { coreDatavizDefault } from './default';
export { coreDatavizNeon } from './neon';
export { coreDatavizOca } from './oca';
export { coreDatavizTerra } from './terra';

// -- Semantic mapping (shared across all themes) ---------------------------
//
// All themes change core VALUES; the semantic→core ref structure is identical.
// This is an implementation detail of withDataviz — not a public export.

const semanticDataviz: SemanticDataviz = {
  color: {
    series: {
      1: '{core.dataviz.color.qualitative.1}',
      2: '{core.dataviz.color.qualitative.2}',
      3: '{core.dataviz.color.qualitative.3}',
      4: '{core.dataviz.color.qualitative.4}',
      5: '{core.dataviz.color.qualitative.5}',
      6: '{core.dataviz.color.qualitative.6}',
      7: '{core.dataviz.color.qualitative.7}',
      8: '{core.dataviz.color.qualitative.8}',
    },
    scale: {
      sequential: {
        1: '{core.dataviz.color.sequential.1}',
        2: '{core.dataviz.color.sequential.2}',
        3: '{core.dataviz.color.sequential.3}',
        4: '{core.dataviz.color.sequential.4}',
        5: '{core.dataviz.color.sequential.5}',
        6: '{core.dataviz.color.sequential.6}',
        7: '{core.dataviz.color.sequential.7}',
      },
      diverging: {
        neg3: '{core.dataviz.color.diverging.1}',
        neg2: '{core.dataviz.color.diverging.2}',
        neg1: '{core.dataviz.color.diverging.3}',
        neutral: '{core.dataviz.color.diverging.4}',
        pos1: '{core.dataviz.color.diverging.5}',
        pos2: '{core.dataviz.color.diverging.6}',
        pos3: '{core.dataviz.color.diverging.7}',
      },
    },
    reference: {
      baseline: '{core.colors.neutral.500}',
      target: '{core.dataviz.color.qualitative.2}',
    },
    state: {
      highlight: '{core.dataviz.color.qualitative.6}',
      muted: '{core.colors.neutral.300}',
      selected: '{core.dataviz.color.qualitative.1}',
    },
    status: {
      missing: '{core.colors.neutral.200}',
      suppressed: '{core.colors.neutral.300}',
      'not-applicable': '{core.colors.neutral.500}',
    },
  },
  encoding: {
    shape: {
      series: {
        1: '{core.dataviz.shape.1}',
        2: '{core.dataviz.shape.2}',
        3: '{core.dataviz.shape.3}',
        4: '{core.dataviz.shape.4}',
        5: '{core.dataviz.shape.5}',
        6: '{core.dataviz.shape.6}',
        7: '{core.dataviz.shape.7}',
        8: '{core.dataviz.shape.8}',
      },
    },
    pattern: {
      series: {
        1: '{core.dataviz.pattern.1}',
        2: '{core.dataviz.pattern.2}',
        3: '{core.dataviz.pattern.3}',
        4: '{core.dataviz.pattern.4}',
        5: '{core.dataviz.pattern.5}',
        6: '{core.dataviz.pattern.6}',
      },
    },
    stroke: {
      reference: '{core.dataviz.stroke.dashed}',
      forecast: '{core.dataviz.stroke.dashed}',
      uncertainty: '{core.dataviz.stroke.dotted}',
    },
    opacity: {
      context: '{core.dataviz.opacity.context}',
      muted: '{core.dataviz.opacity.muted}',
      uncertainty: '{core.dataviz.opacity.uncertainty}',
    },
  },
  geo: {
    context: {
      muted: '{core.colors.neutral.50}',
      boundary: '{core.colors.neutral.300}',
      label: '{core.colors.neutral.500}',
    },
    state: {
      selection: '{core.dataviz.color.qualitative.1}',
      focus: '{core.colors.brand.500}',
    },
  },
};

// -- Composer ---------------------------------------------------------------

/**
 * Compose any `ThemeTokensV2` with the dataviz extension.
 *
 * Applies `core.dataviz` and `semantic.dataviz` on top of the given theme via
 * `createTheme` (deep merge). Semantic tokens are universal across all themes.
 * Core tokens default to the standard palette unless a per-theme override is supplied.
 *
 * @param theme - Base theme to extend (e.g. `aurora`, `neon`, `defaultTheme`).
 * @param coreOverrides - Per-theme analytical palette overrides. When omitted,
 *   `coreDatavizDefault` (Tableau 10 / Blues / RdBu) is used.
 * @returns A complete `ThemeTokensV2` with dataviz tokens included.
 *
 * @example
 * ```ts
 * import { neon } from '@ttoss/theme2';
 * import { withDataviz, coreDatavizNeon } from '@ttoss/theme2/dataviz';
 *
 * // Dark-optimized neon + dataviz
 * const neonWithDataviz = withDataviz(neon, coreDatavizNeon);
 *
 * // Any custom theme with default dataviz palette
 * const myThemeWithDataviz = withDataviz(myTheme);
 * ```
 */
export const withDataviz = (
  theme: ThemeTokensV2,
  coreOverrides?: CoreDataviz
): ThemeTokensV2 => {
  return createTheme({
    base: theme,
    overrides: {
      core: { dataviz: coreOverrides ?? coreDatavizDefault },
      semantic: { dataviz: semanticDataviz },
    },
  });
};

// -- Pre-composed built-in themes with dataviz ------------------------------
//
// Convenience exports — ready-to-use ThemeTokensV2 objects.
// These are evaluated lazily via `withDataviz` — no shared references.

/** Default theme with dataviz extension included. */
export const defaultWithDataviz = withDataviz(defaultTheme, coreDatavizDefault);

/** Aurora theme with dataviz extension included. */
export const auroraWithDataviz = withDataviz(aurora, coreDatavizAurora);

/** Bruttal theme with dataviz extension included. */
export const bruttalWithDataviz = withDataviz(bruttal, coreDatavizBruttal);

/** Neon theme with dataviz extension included (dark-optimized palette). */
export const neonWithDataviz = withDataviz(neon, coreDatavizNeon);

/** OCA theme with dataviz extension included. */
export const ocaWithDataviz = withDataviz(oca, coreDatavizOca);

/** Terra theme with dataviz extension included. */
export const terraWithDataviz = withDataviz(terra, coreDatavizTerra);
