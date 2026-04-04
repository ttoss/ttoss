/**
 * @ttoss/theme2/dataviz — Data Visualization Extension
 *
 * Provides the `withDataviz` composer to extend any theme with dataviz tokens,
 * a default core dataviz palette, and a React hook for consuming dataviz semantics.
 *
 * @example
 * ```tsx
 * import { withDataviz, coreDatavizDefault } from '@ttoss/theme2/dataviz';
 * import { createTheme } from '@ttoss/theme2';
 *
 * // Extend any theme with dataviz tokens
 * const myThemeWithDataviz = withDataviz(myTheme);
 *
 * // Consume dataviz tokens in React
 * import { useDatavizTokens } from '@ttoss/theme2/dataviz';
 *
 * const ChartLegend = ({ categories }: { categories: string[] }) => {
 *   const dataviz = useDatavizTokens();
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
 */

export { coreDatavizDefault, semanticDataviz } from './baseTheme';
export type { CoreDataviz, SemanticDataviz } from './Types';
export { useDatavizTokens } from './useDatavizTokens';
export { withDataviz } from './withDataviz';
