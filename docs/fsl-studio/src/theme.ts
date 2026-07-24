import { createTheme } from '@ttoss/fsl-theme';
import { withDataviz } from '@ttoss/fsl-theme/dataviz';

/**
 * The Studio runs the unedited base theme — it is the flagship the Stage
 * exists to prove (ROADMAP P3). The dataviz extension powers the dashboard
 * chart, the Stage's one bespoke widget (BLUEPRINT D-002); its tokens are
 * referenced via `datavizVars` from `@ttoss/fsl-theme/dataviz`.
 */
export const theme = withDataviz(createTheme());
