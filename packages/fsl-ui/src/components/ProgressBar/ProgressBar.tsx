import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';
import {
  ProgressBar as RACProgressBar,
  type ProgressBarProps as RACProgressBarProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { ANIMATION_NAMES, ensureKeyframes } from '../../tokens/keyframes';
import {
  buildRailFillStyle,
  buildRailLabelRowStyle,
  buildRailTrackStyle,
  RAIL_ROOT_STYLE,
} from '../../tokens/rail';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Feedback → CONTRACT.md §1 row:
//   colors: `feedback.{accent|primary|positive|caution|negative}` for the
//   fill (uxContext = feedback) with the `muted` surface as the neutral rail,
//   radii: `round` (thin pill track), sizing: `hit` is not used
//   (non-interactive), spacing: `gap.stack.xs` (label→track),
//   typography: `label.md` (label + value), elevation: `flat`,
//   motion: `transition.enter` (value easing; ProgressBar has no dismissal).
//
// Feedback carries no interactive States; the only State surface is `default`
// and `disabled`. Evaluations rotate the fill color tree.
// ---------------------------------------------------------------------------

/** Formal semantic identity — ProgressBar root (Feedback entity). */
export const progressBarMeta = {
  displayName: 'ProgressBar',
  entity: 'Feedback',
  structure: 'root',
} as const satisfies ComponentMeta<'Feedback'>;

type FeedbackColors = (typeof vars.colors.feedback)[EvaluationsFor<'Feedback'>];

// Layout constants (CONTRIBUTING §4 layout-literal rule) — geometry of the
// indeterminate sweep, not semantic tokens:
// the fill occupies 40% of the track and one sweep cycle takes 1.2s (slow
// enough to read as "working", fast enough to read as "alive").
const INDETERMINATE_FILL_WIDTH = '40%';
const INDETERMINATE_CYCLE_DURATION = '1.2s';

/** Fill (content) style — width tracks percentage; indeterminate animates.
 * The fill is the evaluation's filled surface (`background.default`) — deep
 * valence fills and the informative `accent` brand fill. Envelope from the
 * shared rail (`buildRailFillStyle`); only the value geometry and the sweep
 * are this component's. */
const buildFillStyle = ({
  c,
  percentage,
  isIndeterminate,
}: {
  c: FeedbackColors;
  percentage?: number | null;
  isIndeterminate?: boolean;
}): React.CSSProperties => {
  return buildRailFillStyle({
    width: isIndeterminate ? INDETERMINATE_FILL_WIDTH : `${percentage ?? 0}%`,
    color: c?.background?.default,
    animation: isIndeterminate
      ? `${ANIMATION_NAMES.progressBarIndeterminate} ${INDETERMINATE_CYCLE_DURATION} linear infinite`
      : undefined,
  });
};

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------

/**
 * Props for the ProgressBar component.
 */
export interface ProgressBarProps extends Omit<
  RACProgressBarProps,
  'style' | 'className' | 'children'
> {
  /**
   * Authorial emphasis. Choose the evaluation that matches the *meaning* of
   * the progress: `positive` for completing a desirable task, `caution` for
   * an approaching limit, `negative` for a failing operation. `accent` is
   * the default — informative activity with the brand fill; `primary` is the
   * monochrome variant.
   * @default 'accent'
   */
  evaluation?: EvaluationsFor<'Feedback'>;
  /** Visible label shown above the bar. */
  label?: React.ReactNode;
  /**
   * Whether to render the `valueText`/percentage alongside the label.
   * @default true
   */
  showValueLabel?: boolean;
}

/**
 * A semantic progress bar built on React Aria's `ProgressBar`.
 *
 * The fill reads the evaluation's filled surface from `vars.colors.feedback`
 * over the `muted` neutral rail (`vars.radii.round`, thin pill). Supports
 * both determinate (0–100%) and indeterminate modes — pass `isIndeterminate`.
 *
 * @example
 * ```tsx
 * <ProgressBar label="Uploading" value={42} />
 * <ProgressBar label="Saving" isIndeterminate evaluation="positive" />
 * ```
 */
export const ProgressBar = ({
  evaluation = 'accent',
  label,
  showValueLabel = true,
  ...props
}: ProgressBarProps) => {
  const c = vars.colors.feedback[evaluation];

  // The indeterminate sweep references a registered @keyframes name —
  // inject the package stylesheet before the browser paints this style.
  React.useInsertionEffect(() => {
    ensureKeyframes();
  }, []);

  return (
    <RACProgressBar
      {...props}
      data-scope="progress-bar"
      data-part="root"
      data-evaluation={evaluation}
      style={RAIL_ROOT_STYLE}
    >
      {({ percentage, valueText, isIndeterminate }) => {
        // Built outside JSX deliberately: the status span is aria-hidden, so
        // this is a formatted number echoing the value RAC already exposes
        // accessibly — not copy for translation.
        const statusText = valueText ?? `${Math.round(percentage ?? 0)}%`;

        return (
          <>
            {(label || showValueLabel) && (
              <div
                data-scope="progress-bar"
                data-part="labelRow"
                style={buildRailLabelRowStyle({
                  // The label row sits on the page surface, not on the
                  // fill — filled evaluations carry neutral.0 text that
                  // would vanish here; the entity's quiet text is correct.
                  ink: vars.colors.feedback.muted.text?.default,
                })}
              >
                <span data-scope="progress-bar" data-part="title">
                  {label}
                </span>
                {showValueLabel && !isIndeterminate && (
                  <span
                    data-scope="progress-bar"
                    data-part="status"
                    aria-hidden
                  >
                    {statusText}
                  </span>
                )}
              </div>
            )}

            {/* Track */}
            <div
              data-scope="progress-bar"
              data-part="body"
              style={buildRailTrackStyle()}
            >
              {/* Fill */}
              <div
                data-scope="progress-bar"
                data-part="content"
                style={buildFillStyle({ c, percentage, isIndeterminate })}
              />
            </div>
          </>
        );
      }}
    </RACProgressBar>
  );
};
ProgressBar.displayName = progressBarMeta.displayName;
