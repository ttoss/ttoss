import { vars } from '@ttoss/theme2/vars';
import type * as React from 'react';
import {
  ProgressBar as RACProgressBar,
  type ProgressBarProps as RACProgressBarProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Feedback → CONTRACT.md §1 row:
//   colors: `feedback.{primary|positive|caution|negative}` (uxContext = feedback),
//   radii: `control` (track), border: `outline.surface` (track outline),
//   sizing: `hit.base` is not used (non-interactive), spacing: `inset.control`,
//   typography: `label.md` (label + value), elevation: `flat`
//   motion: `transition.enter` (value easing; ProgressBar has no dismissal),
//   interaction: — (Feedback may carry `dismiss` but ProgressBar does not).
//
// Feedback carries no interactive States; the only State surface is `default`
// and `disabled`. Evaluations `primary|positive|caution|negative` rotate the
// color tree — no muted (not in ENTITY_EVALUATION for Feedback).
// ---------------------------------------------------------------------------

/** Formal semantic identity — ProgressBar root (Feedback entity). */
export const progressBarMeta = {
  displayName: 'ProgressBar',
  entity: 'Feedback',
  structure: 'root',
} as const satisfies ComponentMeta<'Feedback'>;

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
   * an approaching limit, `negative` for a failing operation. `primary` is
   * the default neutral chrome.
   * @default 'primary'
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
 * Reads from `vars.colors.feedback.{primary|positive|caution|negative}` and
 * uses `vars.radii.control` for the track. Supports both determinate
 * (0–100%) and indeterminate modes — pass `isIndeterminate`.
 *
 * @example
 * ```tsx
 * <ProgressBar label="Uploading" value={42} />
 * <ProgressBar label="Saving" isIndeterminate evaluation="positive" />
 * ```
 */
export const ProgressBar = ({
  evaluation = 'primary',
  label,
  showValueLabel = true,
  ...props
}: ProgressBarProps) => {
  const c = vars.colors.feedback[evaluation];

  return (
    <RACProgressBar
      {...props}
      data-scope="progressBar"
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
                data-scope="progressBar"
                data-part="labelRow"
                style={
                  {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    color: c?.text?.default,
                    ...(vars.text.label.md as React.CSSProperties),
                  } as React.CSSProperties
                }
              >
                <span data-scope="progressBar" data-part="title">
                  {label}
                </span>
                {showValueLabel && !isIndeterminate && (
                  <span data-scope="progressBar" data-part="status" aria-hidden>
                    {valueText ?? `${Math.round(percentage ?? 0)}%`}
                  </span>
                )}
              </div>
            )}

            {/* Track */}
            <div
              data-scope="progressBar"
              data-part="body"
              style={
                {
                  position: 'relative',
                  overflow: 'hidden',
                  width: '100%',
                  height: vars.spacing.gap.stack.sm,
                  backgroundColor: c?.background?.default,
                  borderRadius: vars.radii.control,
                  borderWidth: vars.border.outline.surface.width,
                  borderStyle: vars.border.outline.surface.style,
                  borderColor: c?.border?.default,
                } as React.CSSProperties
              }
            >
              {/* Fill */}
              <div
                data-scope="progressBar"
                data-part="content"
                style={
                  {
                    height: '100%',
                    width: isIndeterminate ? '40%' : `${percentage ?? 0}%`,
                    backgroundColor: c?.border?.default,
                    borderRadius: 'inherit',
                    transitionProperty: 'width',
                    transitionDuration: vars.motion.transition.enter.duration,
                    transitionTimingFunction:
                      vars.motion.transition.enter.easing,
                    animation: isIndeterminate
                      ? 'tt-progressbar-indeterminate 1.2s infinite'
                      : undefined,
                  } as React.CSSProperties
                }
              />
            </div>
          </>
        );
      }}
    </RACProgressBar>
  );
};
ProgressBar.displayName = progressBarMeta.displayName;
