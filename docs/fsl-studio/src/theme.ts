import type { SemanticTokens } from '@ttoss/fsl-theme';
import { createTheme } from '@ttoss/fsl-theme';
import type { SemanticDataviz } from '@ttoss/fsl-theme/dataviz';
import { withDataviz } from '@ttoss/fsl-theme/dataviz';
import type { CssVarsMap } from '@ttoss/fsl-theme/vars';
import { buildVarsMap } from '@ttoss/fsl-theme/vars';

/**
 * The Studio runs the unedited base theme — it is the flagship the Stage
 * exists to prove (ROADMAP P3). The dataviz extension powers the dashboard
 * chart, the Stage's one bespoke widget (BLUEPRINT D-002).
 */
export const theme = withDataviz(createTheme());

type StudioSemanticTokens = SemanticTokens & { dataviz: SemanticDataviz };

/**
 * Typed CSS-var mirror including the dataviz extension.
 *
 * The `as` cast is the documented extension recipe — the dataviz package
 * ships no typed vars mirror of its own (FRICTION F-013, open).
 */
export const studioVars: CssVarsMap<StudioSemanticTokens> = buildVarsMap(
  theme.base
) as CssVarsMap<StudioSemanticTokens>;
