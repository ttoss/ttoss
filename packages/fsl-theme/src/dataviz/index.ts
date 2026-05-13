/**
 * @ttoss/fsl-theme/dataviz — Data Visualization Extension
 *
 * Provides the `withDataviz` composer to extend any theme with dataviz tokens,
 * a default core dataviz palette, and a React hook for consuming dataviz semantics.
 *
 * @example
 * ```tsx
 * import { withDataviz, coreDataviz } from '@ttoss/fsl-theme/dataviz';
 * import { createTheme } from '@ttoss/fsl-theme';
 *
 * // Extend any theme with dataviz tokens
 * const myThemeWithDataviz = withDataviz(myTheme);
 *
 * // Consume dataviz tokens in React
 * import { useDatavizTokens } from '@ttoss/fsl-theme/dataviz';
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

export { coreDataviz, semanticDataviz } from './baseTheme';
export type { CoreDataviz, SemanticDataviz } from './Types';
export { useDatavizTokens } from './useDatavizTokens';
export { withDataviz } from './withDataviz';
