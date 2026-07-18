import { getThemeStylesContent } from '@ttoss/fsl-theme/css';
import * as React from 'react';

import { STAGE_THEME_ID } from '../theme';
import { useThemeStore } from './theme/themeStore';

/**
 * The stage: the permanent orientation axis of the Studio (PRD §6.2). The
 * light and dark panes render the current subject simultaneously via
 * element-scoped theme CSS, so they are independent of the chrome's color
 * mode and re-theme in the same frame when the live bundle changes (AD-5).
 *
 * `renderSubject` is called once per pane so each gets its own element tree
 * (independent state — a Wizard step or form input in one pane doesn't move
 * the other). What the subject *is* depends on the active lens; the stage
 * frame itself never resets.
 */
export const Stage = ({
  renderSubject,
  toolbar,
}: {
  renderSubject: () => React.ReactNode;
  /** Stage-level controls (the altitude switcher, PRD F1.4). */
  toolbar?: React.ReactNode;
}) => {
  const { liveBundle } = useThemeStore();

  const stageCss = React.useMemo(() => {
    return getThemeStylesContent(liveBundle, STAGE_THEME_ID, {
      systemModeFallback: false,
    });
  }, [liveBundle]);

  return (
    <section className="stage" aria-label="Stage">
      <style>{stageCss}</style>
      {toolbar ? <div className="stage-toolbar">{toolbar}</div> : null}
      <div className="stage-panes">
        <div
          className="stage-pane"
          data-tt-theme={STAGE_THEME_ID}
          data-testid="stage-pane-light"
        >
          <span className="stage-pane-label">Light</span>
          {renderSubject()}
        </div>
        <div
          className="stage-pane"
          data-tt-theme={STAGE_THEME_ID}
          data-tt-mode="dark"
          data-testid="stage-pane-dark"
        >
          <span className="stage-pane-label">Dark</span>
          {renderSubject()}
        </div>
      </div>
    </section>
  );
};
