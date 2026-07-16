import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Tooltip as RACTooltip,
  type TooltipProps as RACTooltipProps,
  TooltipTrigger as RACTooltipTrigger,
  type TooltipTriggerComponentProps as RACTooltipTriggerProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { fslVar } from '../../tokens/escapeHatch';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Overlay → CONTRACT.md §1 row: colors `informational`, radii
// `surface`, border `outline.surface`, spacing `inset.surface`, motion
// `transition`, elevation `overlay`. A Tooltip is a non-blocking, hover/focus
// overlay. Like Menu/Popover, the single RAC Tooltip element folds
// positioner + surface into `data-part="root"`.
// ---------------------------------------------------------------------------

// Layout constant (CONTRIBUTING §4). Host-overridable via the A6 knob.
const TOOLTIP_MAX_WIDTH_DEFAULT = 'min(280px, 90vw)';
// Gap between the trigger and the tooltip surface.
const TOOLTIP_OFFSET_DEFAULT = 6;

/**
 * Wraps a focusable trigger and its `Tooltip`. React Aria shows the tooltip on
 * hover and keyboard focus and manages the delay.
 */
export const TooltipTrigger = (props: RACTooltipTriggerProps) => {
  return <RACTooltipTrigger {...props} />;
};
TooltipTrigger.displayName = 'TooltipTrigger';

/** Formal semantic identity — Tooltip surface (Overlay entity). */
export const tooltipMeta = {
  displayName: 'Tooltip',
  entity: 'Overlay',
  structure: 'root',
} as const satisfies ComponentMeta<'Overlay'>;

/** Props for the Tooltip surface. */
export interface TooltipProps extends Omit<RACTooltipProps, 'style'> {
  /**
   * Semantic emphasis for the tooltip surface.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof tooltipMeta)['entity']>;
}

/**
 * A hover/focus tooltip (Overlay entity). Place inside a `TooltipTrigger`
 * after the focusable trigger element.
 *
 * A tooltip must contain **only non-interactive text/content** — it is not a
 * focus target and must never hold buttons, links, or form fields (use a
 * `Popover` for interactive overlays).
 *
 * @example
 * ```tsx
 * <TooltipTrigger>
 *   <Button>Save</Button>
 *   <Tooltip>Saves the current draft</Tooltip>
 * </TooltipTrigger>
 * ```
 */
export const Tooltip = ({
  evaluation = 'primary',
  offset = TOOLTIP_OFFSET_DEFAULT,
  ...props
}: TooltipProps) => {
  const colors = vars.colors.informational[evaluation];

  return (
    <RACTooltip
      {...props}
      offset={offset}
      data-scope="tooltip"
      data-part="root"
      data-evaluation={evaluation}
      style={
        {
          boxSizing: 'border-box',
          maxWidth: fslVar(
            '--fsl-tooltip-max-width',
            TOOLTIP_MAX_WIDTH_DEFAULT
          ),
          borderRadius: vars.radii.surface,
          borderWidth: vars.border.outline.surface.width,
          borderStyle: vars.border.outline.surface.style,
          borderColor: colors?.border?.default,
          backgroundColor: colors?.background?.default,
          color: colors?.text?.default,
          boxShadow: vars.elevation.surface.overlay,
          paddingBlock: vars.spacing.inset.surface.sm,
          paddingInline: vars.spacing.inset.surface.md,
          ...(vars.text.label.md as React.CSSProperties),
          transitionProperty: 'opacity',
          transitionDuration: vars.motion.transition.enter.duration,
          transitionTimingFunction: vars.motion.transition.enter.easing,
          zIndex: vars.zIndex.layer.overlay,
        } as React.CSSProperties
      }
    />
  );
};
Tooltip.displayName = tooltipMeta.displayName;
