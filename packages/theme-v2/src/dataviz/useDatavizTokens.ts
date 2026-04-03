import { useTokens } from '../react';
import type { SemanticDataviz } from './Types';

/**
 * Access the current theme's **dataviz semantic tokens**.
 *
 * Requires `<ThemeProvider theme={...}>` with a bundle whose theme includes
 * the dataviz extension (`core.dataviz` + `semantic.dataviz`).
 *
 * Throws a descriptive error when the active theme has no dataviz extension,
 * making misconfiguration immediately visible during development.
 *
 * @example
 * ```tsx
 * import { useDatavizTokens } from '@ttoss/theme2/dataviz';
 *
 * const ChartLegend = ({ categories }: { categories: string[] }) => {
 *   const dataviz = useDatavizTokens();
 *   // Full type-safety, no optional chaining
 *   return categories.map((name, i) => (
 *     <span key={name} style={{ color: `var(--tt-dataviz-color-series-${i + 1})` }}>
 *       {name}
 *     </span>
 *   ));
 * };
 * ```
 *
 * @see {@link useTokens} — access full semantic tokens (dataviz will be on `tokens.dataviz?`)
 */
export const useDatavizTokens = (): SemanticDataviz => {
  const tokens = useTokens();

  if (!tokens.dataviz) {
    throw new Error(
      'useDatavizTokens: the active theme does not include the dataviz extension.\n' +
        'Wrap your bundle with withDataviz before passing it to ThemeProvider:\n\n' +
        '  import { withDataviz } from "@ttoss/theme2/dataviz";\n' +
        '  export const myTheme = withDataviz(createTheme({ ... }));'
    );
  }

  return tokens.dataviz;
};
