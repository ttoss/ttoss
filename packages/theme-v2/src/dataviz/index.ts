/**
 * @ttoss/theme2 — Data Visualization Extension
 *
 * Provides types, default values, and a React hook for the dataviz extension.
 *
 * @example
 * ```tsx
 * // 1. Compose a theme with dataviz support
 * import { createTheme } from '@ttoss/theme2';
 * import { withDataviz, coreDatavizDefault } from '@ttoss/theme2/dataviz';
 *
 * export const myTheme = withDataviz(defaultTheme, coreDatavizDefault);
 *
 * // 2. Consume in components — React hook lives in '@ttoss/theme2/react'
 * import { useDatavizTokens } from '@ttoss/theme2/react';
 *
 * const ChartLegend = ({ categories }: { categories: string[] }) => {
 *   const dataviz = useDatavizTokens();
 *   // Full type-safety, no optional chaining
 *   return categories.map((name, i) => (
 *     <span
 *       key={name}
 *       style={{ color: `var(--tt-dataviz-color-series-${i + 1})` }}
 *     >
 *       {name}
 *     </span>
 *   ));
 * };
 * ```
 *
 * @example CSS custom properties usage (no hook needed)
 * ```css
 * .series-1 { color: var(--tt-dataviz-color-series-1); }
 * .series-2 { color: var(--tt-dataviz-color-series-2); }
 * .scale-high { background: var(--tt-dataviz-color-scale-sequential-7); }
 * .muted-mark  { opacity: var(--tt-dataviz-encoding-opacity-muted); }
 * ```
 *
 * @see {@link useDatavizTokens} — React hook (exported from `@ttoss/theme2/react`)
 */

// -- Types ------------------------------------------------------------------

export type { CoreDataviz, SemanticDataviz } from './Types';
export type {
  CoreDatavizColor,
  CoreDatavizEncoding,
  SemanticDatavizColor,
  SemanticDatavizEncoding,
  SemanticDatavizGeo,
} from './Types';

// -- Default values ---------------------------------------------------------

// -- Per-theme core palettes & composer -------------------------------------

export {
  auroraWithDataviz,
  bruttalWithDataviz,
  coreDatavizAurora,
  coreDatavizBruttal,
  coreDatavizDefault,
  coreDatavizNeon,
  coreDatavizOca,
  coreDatavizTerra,
  defaultWithDataviz,
  neonWithDataviz,
  ocaWithDataviz,
  terraWithDataviz,
  withDataviz,
} from './themes';
