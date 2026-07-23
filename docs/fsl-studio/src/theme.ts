import { createTheme, type SemanticTokens } from '@ttoss/fsl-theme';
import { type SemanticDataviz, withDataviz } from '@ttoss/fsl-theme/dataviz';
import { buildVarsMap, type CssVarsMap } from '@ttoss/fsl-theme/vars';

/**
 * The Studio runs on the unmodified base theme on purpose: it is the
 * adoption proving ground for the default `@ttoss/fsl-theme` experience
 * (P3 aesthetic findings are tuned in `baseTheme`, not overridden here).
 * The dataviz extension is composed in for the Dashboard block — the first
 * real consumer of the `semantic.dataviz.*` family.
 */
export const theme = withDataviz(createTheme());

type StudioSemanticTokens = SemanticTokens & { dataviz: SemanticDataviz };

/**
 * Typed CSS-var mirror including the dataviz extension. The default `vars`
 * export is typed against the foundation shape only, so extensions build
 * their own mirror per the README recipe (friction F-013: a first-party
 * extension should ship this map itself).
 */
export const studioVars = buildVarsMap(
  theme.base
) as CssVarsMap<StudioSemanticTokens>;
