import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Meter as RACMeter,
  type MeterProps as RACMeterProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
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
//   colors: `feedback.{primary|positive|caution|negative}` (uxContext = feedback),
//   radii: `control` (track — matches ProgressBar's documented track radius),
//   border: `outline.surface` (track outline), spacing: `inset.control`,
//   typography: `label.md`, elevation: `flat`.
//
// Meter is the STATIC sibling of ProgressBar: it shows a quantity within a
// known range (battery level, disk usage, score, remaining quota) — a value
// the user reads, not an activity in flight. It therefore has no
// indeterminate mode and no animation (ProgressBar owns "work happening";
// Meter owns "how full is this"). Like ProgressBar it carries no interactive
// State — the only surfaces are `default` and evaluation color rotation.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Meter root (Feedback entity). */
export const meterMeta = {
  displayName: 'Meter',
  entity: 'Feedback',
  structure: 'root',
} as const satisfies ComponentMeta<'Feedback'>;

type FeedbackColors = (typeof vars.colors.feedback)[EvaluationsFor<'Feedback'>];

/** Fill (content) style — width tracks the value's percentage of the range.
 * The fill is the evaluation's filled surface (`background.default`).
 * Envelope from the shared rail (`buildRailFillStyle`); Meter is the static
 * sibling, so unlike ProgressBar it passes no sweep animation. */
const buildFillStyle = ({
  c,
  percentage,
}: {
  c: FeedbackColors;
  percentage: number;
}): React.CSSProperties => {
  return buildRailFillStyle({
    width: `${percentage}%`,
    color: c?.background?.default,
  });
};

/**
 * Props for the Meter component.
 */
export interface MeterProps extends Omit<
  RACMeterProps,
  'style' | 'className' | 'children'
> {
  /**
   * Authorial emphasis matching the *meaning* of the level: `positive` for a
   * healthy fill (storage available), `caution` for an approaching limit,
   * `negative` for a critical level (battery almost empty). `primary` is the
   * neutral default.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<'Feedback'>;
  /** Visible label shown above the bar (e.g. "Storage used"). */
  label?: React.ReactNode;
  /**
   * Whether to render the formatted value alongside the label.
   * @default true
   */
  showValueLabel?: boolean;
}

/**
 * A semantic meter built on React Aria's `Meter` — a static quantity within a
 * known range (`role="meter"`).
 *
 * Reads from `vars.colors.feedback.{primary|positive|caution|negative}` and
 * uses `vars.radii.control` for the track. Unlike `ProgressBar` (which
 * communicates an operation *in progress* and supports an indeterminate
 * mode), `Meter` displays a **fixed measurement the user reads** — battery,
 * disk usage, rate limit remaining. Pick `Meter` when the number is a state,
 * `ProgressBar` when it is a task advancing.
 *
 * Provide an accessible name via `aria-label` (or `aria-labelledby`) — the
 * visible `label` is display text and does not itself name the meter.
 *
 * @example
 * ```tsx
 * <Meter aria-label="Storage" label="Storage used" value={82} evaluation="caution" />
 * <Meter aria-label="Battery" value={12} evaluation="negative" />
 * ```
 */
export const Meter = ({
  evaluation = 'primary',
  label,
  showValueLabel = true,
  ...props
}: MeterProps) => {
  const c = vars.colors.feedback[evaluation];

  return (
    <RACMeter
      {...props}
      data-scope="meter"
      data-part="root"
      data-evaluation={evaluation}
      style={RAIL_ROOT_STYLE}
    >
      {({ percentage, valueText }) => {
        // Built outside JSX deliberately: the status span is aria-hidden, so
        // this is a formatted number echoing the value RAC already exposes
        // accessibly — not copy for translation.
        const statusText = valueText ?? `${Math.round(percentage)}%`;

        return (
          <>
            {(label || showValueLabel) && (
              <div
                data-scope="meter"
                data-part="labelRow"
                style={buildRailLabelRowStyle({
                  // Label row sits on the page, not on the fill — the
                  // entity's quiet text is correct here (see ProgressBar).
                  ink: vars.colors.feedback.muted.text?.default,
                  // The ellipsizing title needs a guaranteed gutter before
                  // the status — the opt-in axis of the shared row.
                  gap: vars.spacing.gap.inline.sm,
                })}
              >
                <span
                  data-scope="meter"
                  data-part="title"
                  style={
                    {
                      minInlineSize: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    } as React.CSSProperties
                  }
                >
                  {label}
                </span>
                {showValueLabel && (
                  <span
                    data-scope="meter"
                    data-part="status"
                    aria-hidden
                    style={{ flex: 'none' } as React.CSSProperties}
                  >
                    {statusText}
                  </span>
                )}
              </div>
            )}

            {/* Track */}
            <div
              data-scope="meter"
              data-part="body"
              style={buildRailTrackStyle()}
            >
              {/* Fill */}
              <div
                data-scope="meter"
                data-part="content"
                style={buildFillStyle({ c, percentage })}
              />
            </div>
          </>
        );
      }}
    </RACMeter>
  );
};
Meter.displayName = meterMeta.displayName;
