import { getThemeStylesContent } from '@ttoss/fsl-theme/css';
import { Stack, Surface, Text } from '@ttoss/fsl-ui';
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
        {/* The stage panes dogfood the fsl-ui `Surface` primitive: each pane
            is a `raised` surface, so its depth (tonal colour + shadow) is the
            exact contract any app gets — the Studio renders on the system it
            edits. The theme-scope host wraps the Surface (`display: contents`,
            so the Surface is the grid item) — the scope's CSS custom
            properties still cascade into it, letting light/dark resolve
            independently of the chrome. */}
        <div
          className="stage-pane-scope"
          data-tt-theme={STAGE_THEME_ID}
          data-testid="stage-pane-light"
        >
          <Surface level="raised" padding="lg">
            <Stack gap="sm">
              <Text as="span" variant="label-sm" tone="muted">
                Light
              </Text>
              {renderSubject()}
            </Stack>
          </Surface>
        </div>
        <div
          className="stage-pane-scope"
          data-tt-theme={STAGE_THEME_ID}
          data-tt-mode="dark"
          data-testid="stage-pane-dark"
        >
          <Surface level="raised" padding="lg">
            <Stack gap="sm">
              <Text as="span" variant="label-sm" tone="muted">
                Dark
              </Text>
              {renderSubject()}
            </Stack>
          </Surface>
        </div>
      </div>
    </section>
  );
};
