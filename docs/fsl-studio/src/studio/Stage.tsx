import { getThemeStylesContent } from '@ttoss/fsl-theme/css';
import * as React from 'react';

import { STAGE_THEME_ID, studioBundle } from '../theme';
import { StageSample } from './StageSample';

/**
 * The stage: the permanent orientation axis of the Studio (PRD §6.2).
 * Renders the current content in light and dark simultaneously, using
 * element-scoped theme CSS so the panes are independent of the chrome's
 * color mode.
 */
export const Stage = () => {
  // Phase 0: the bundle is a module constant, so the CSS is computed once.
  // Phase 1 recomputes this on every accepted token edit (PRD AD-5) — the
  // memo dependency then becomes the session's theme state.
  const stageCss = React.useMemo(() => {
    return getThemeStylesContent(studioBundle, STAGE_THEME_ID, {
      systemModeFallback: false,
    });
  }, []);

  return (
    <section className="stage" aria-label="Stage">
      <style>{stageCss}</style>
      <div className="stage-panes">
        <div
          className="stage-pane"
          data-tt-theme={STAGE_THEME_ID}
          data-testid="stage-pane-light"
        >
          <span className="stage-pane-label">Light</span>
          <StageSample />
        </div>
        <div
          className="stage-pane"
          data-tt-theme={STAGE_THEME_ID}
          data-tt-mode="dark"
          data-testid="stage-pane-dark"
        >
          <span className="stage-pane-label">Dark</span>
          <StageSample />
        </div>
      </div>
    </section>
  );
};
