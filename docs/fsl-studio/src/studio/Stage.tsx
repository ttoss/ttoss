import { getThemeStylesContent } from '@ttoss/fsl-theme/css';
import * as React from 'react';

import { STAGE_THEME_ID } from '../theme';
import { StageSample } from './StageSample';
import { useThemeStore } from './theme/themeStore';

/**
 * The stage: the permanent orientation axis of the Studio (PRD §6.2).
 * Renders the current content in light and dark simultaneously, using
 * element-scoped theme CSS so the panes are independent of the chrome's
 * color mode. The CSS re-derives whenever the live bundle changes — an edit
 * to any token re-themes both panes in the same frame (PRD AD-5).
 */
export const Stage = () => {
  const { liveBundle } = useThemeStore();

  const stageCss = React.useMemo(() => {
    return getThemeStylesContent(liveBundle, STAGE_THEME_ID, {
      systemModeFallback: false,
    });
  }, [liveBundle]);

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
