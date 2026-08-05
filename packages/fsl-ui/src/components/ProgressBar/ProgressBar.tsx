import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';
import {
  ProgressBar as RACProgressBar,
  type ProgressBarProps as RACProgressBarProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { ANIMATION_NAMES, ensureKeyframes } from '../../tokens/keyframes';
import { RAIL_BASE, RAIL_FILL } from '../../tokens/rail';

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
/** Track (body) style — the neutral rail the fill animates across. Geometry
 * comes from the shared rail (`TRACK_RAIL`, one silhouette across the three
 * rails); the colour is the cross-cutting rail fill every rail shares
 * (`semantic.rail.track`, F-050/F-051), not a borrowed role token. */
const buildTrackStyle = (): React.CSSProperties => {
  return {
    ...RAIL_BASE,
    backgroundColor: RAIL_FILL,
  };
};

/** Fill (content) style — width tracks percentage; indeterminate animates.
 * The fill is the evaluation's filled surface (`background.default`) — deep
 * valence fills and the informative `accent` brand fill. */
const buildFillStyle = ({
  c,
  percentage,
  isIndeterminate,
}: {
  c: FeedbackColors;
  percentage?: number | null;
  isIndeterminate?: boolean;
}): React.CSSProperties => {
  return {
    height: '100%',
    width: isIndeterminate ? INDETERMINATE_FILL_WIDTH : `${percentage ?? 0}%`,
    backgroundColor: c?.background?.default,
    borderRadius: 'inherit',
    transitionProperty: 'width',
    transitionDuration: vars.motion.transition.enter.duration,
    transitionTimingFunction: vars.motion.transition.enter.easing,
    animation: isIndeterminate
      ? `${ANIMATION_NAMES.progressBarIndeterminate} ${INDETERMINATE_CYCLE_DURATION} linear infinite`
      : undefined,
  };
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
      style={
        {
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: vars.spacing.gap.stack.xs,
        } as React.CSSProperties
      }
    >
      {({ percentage, valueText, isIndeterminate }) => {
        return (
          <>
            {(label || showValueLabel) && (
              <div
                data-scope="progress-bar"
                data-part="labelRow"
                style={
                  {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    // The label row sits on the page surface, not on the
                    // fill — filled evaluations carry neutral.0 text that
                    // would vanish here; the entity's quiet text is correct.
                    color: vars.colors.feedback.muted.text?.default,
                    ...(vars.text.label.md as React.CSSProperties),
                  } as React.CSSProperties
                }
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
                    {valueText ?? `${Math.round(percentage ?? 0)}%`}
                  </span>
                )}
              </div>
            )}

            {/* Track */}
            <div
              data-scope="progress-bar"
              data-part="body"
              style={buildTrackStyle()}
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
