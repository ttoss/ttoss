import { baseBundle } from '../baseBundle';
import type { CssVarsMap } from '../roots/toVars';
import { buildVarsMap } from '../roots/toVars';
import type { ThemeTokens } from '../Types';
import { semanticDataviz } from './baseTheme';
import type { SemanticDataviz } from './Types';

// ---------------------------------------------------------------------------
// datavizVars — Static typed CSS Custom Property references (dataviz subtree)
// ---------------------------------------------------------------------------

/**
 * Typed CSS-var mirror of the dataviz semantic tokens — the extension's
 * counterpart of the foundation's `vars` export.
 *
 * Var names derive from token paths alone, so this map is valid for any
 * theme extended with `withDataviz` (only the values behind the CSS vars
 * change per theme/mode). Chart code references the vars; the CSS emitted
 * by `toCssVars` carries the values.
 *
 * @example
 * ```tsx
 * import { datavizVars } from '@ttoss/fsl-theme/dataviz';
 *
 * <rect fill={datavizVars.color.series[1]} />
 * // → fill: 'var(--tt-dataviz-color-series-1)'
 * ```
 */
export const datavizVars: CssVarsMap<SemanticDataviz> = (
  buildVarsMap({
    core: baseBundle.base.core,
    semantic: { dataviz: semanticDataviz },
  } as unknown as ThemeTokens) as { dataviz: CssVarsMap<SemanticDataviz> }
).dataviz;
